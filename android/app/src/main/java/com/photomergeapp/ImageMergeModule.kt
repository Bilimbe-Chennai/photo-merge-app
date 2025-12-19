package com.photomergeapp

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.Paint
import android.provider.MediaStore
import android.util.Log
import androidx.exifinterface.media.ExifInterface
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream
import android.os.Build

class ImageMergeModule(
  private val context: ReactApplicationContext
) : ReactContextBaseJavaModule(context) {

  override fun getName(): String {
    return "ImageMerge"
  }

  @ReactMethod
  fun merge(photoPath: String, templateAssetName: String, overlay: ReadableMap?, previewPath: String?, promise: Promise) {
    Log.d("ImageMerge", "merge called: photo=$photoPath template=$templateAssetName overlayPresent=${overlay != null} preview=${previewPath != null}")
    try {
      // Load full-resolution photo
      // Load photo and correct orientation using EXIF (some devices write rotated images)
      var photoBitmap = BitmapFactory.decodeFile(photoPath)
        ?: throw Exception("Photo bitmap is null")

      // Track whether we've already applied a horizontal mirror so we don't double-mirror later
      var appliedHorizontalMirror = false

      // Predeclare overlay mapping values so they are available later (e.g. when writing variants)
      var overlayX = 0
      var overlayY = 0
      var overlayW = 0
      var overlayH = 0

      // helper functions (moved earlier so they are available for EXIF/preview handling)
      // mirrorType: 0 = none, 1 = horizontal (mirror X), 2 = vertical (mirror Y)
      fun applyTransform(b: Bitmap, rot: Int, mirrorType: Int): Bitmap {
        val rotNorm = ((rot % 360) + 360) % 360
        // Determine output dimensions after rotation
        val outW = if (rotNorm == 90 || rotNorm == 270) b.height else b.width
        val outH = if (rotNorm == 90 || rotNorm == 270) b.width else b.height

        val outBmp = Bitmap.createBitmap(outW, outH, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(outBmp)
        val m = Matrix()

        // Center the source bitmap inside the output bitmap
        val translateX = (outW - b.width) / 2f
        val translateY = (outH - b.height) / 2f
        m.postTranslate(translateX, translateY)

        // Rotate around center of output
        if (rotNorm != 0) {
          m.postRotate(rotNorm.toFloat(), outW / 2f, outH / 2f)
        }

        // Mirror relative to the center of output
        when (mirrorType) {
          1 -> m.postScale(-1f, 1f, outW / 2f, outH / 2f) // horizontal
          2 -> m.postScale(1f, -1f, outW / 2f, outH / 2f) // vertical
          else -> {}
        }

        // Use filtered paint for better resampling quality when rotating/mirroring/scaling
        val p = Paint()
        p.isFilterBitmap = true
        p.isAntiAlias = true

        canvas.drawBitmap(b, m, p)
        return outBmp
      }

      fun computeMSE(a: Bitmap, b: Bitmap): Double {
        if (a.width != b.width || a.height != b.height) return Double.MAX_VALUE
        val size = a.width * a.height
        val pa = IntArray(size)
        val pb = IntArray(size)
        a.getPixels(pa, 0, a.width, 0, 0, a.width, a.height)
        b.getPixels(pb, 0, b.width, 0, 0, b.width, b.height)
        var sum = 0.0
        for (i in 0 until size) {
          val p1 = pa[i]
          val p2 = pb[i]
          val r1 = (p1 shr 16) and 0xff
          val g1 = (p1 shr 8) and 0xff
          val b1 = p1 and 0xff
          val r2 = (p2 shr 16) and 0xff
          val g2 = (p2 shr 8) and 0xff
          val b2 = p2 and 0xff
          val dr = r1 - r2
          val dg = g1 - g2
          val db = b1 - b2
          sum += (dr * dr + dg * dg + db * db).toDouble()
        }
        return sum / size
      }

      // Progressive multi-step downscale: halves repeatedly (with filtering) for better perceived sharpness
      fun progressiveDownscale(src: Bitmap, targetW: Int, targetH: Int): Bitmap {
        var cur = src
        val orig = src
        while (cur.width / 2 >= targetW && cur.height / 2 >= targetH) {
          val nw = maxOf(targetW, cur.width / 2)
          val nh = maxOf(targetH, cur.height / 2)
          val tmp = Bitmap.createScaledBitmap(cur, nw, nh, true)
          if (cur !== orig && !cur.isRecycled) cur.recycle()
          cur = tmp
        }

        if (cur.width != targetW || cur.height != targetH) {
          val finalBmp = Bitmap.createScaledBitmap(cur, targetW, targetH, true)
          if (cur !== orig && !cur.isRecycled) cur.recycle()
          if (finalBmp !== orig && !orig.isRecycled) orig.recycle()
          return finalBmp
        }

        // If cur is different from the original source, recycle original to free memory
        if (cur !== orig && !orig.isRecycled) orig.recycle()
        return cur
      }

      // Simple 3x3 sharpen filter to increase perceived sharpness after resampling
      // Reduced strength: center weight lowered and blended with original to soften effect
      fun applySharpen(src: Bitmap): Bitmap {
        val w = src.width
        val h = src.height
        val inPixels = IntArray(w * h)
        val outPixels = IntArray(w * h)
        src.getPixels(inPixels, 0, w, 0, 0, w, h)

        // softened kernel: [0 -1 0; -1 4 -1; 0 -1 0] and final blend (sharpenAlpha)
        val sharpenAlpha = 0.6f // blend factor: 0.0 => original, 1.0 => full sharpen

        for (y in 0 until h) {
          for (x in 0 until w) {
            var rSum = 0
            var gSum = 0
            var bSum = 0
            val center = inPixels[y * w + x]
            val origR = (center shr 16) and 0xff
            val origG = (center shr 8) and 0xff
            val origB = center and 0xff
            var aCenter = (center ushr 24) and 0xff

            // center *4 (reduced)
            rSum += (origR * 4)
            gSum += (origG * 4)
            bSum += (origB * 4)

            // neighbors (-1 weight)
            val pairs = arrayOf(intArrayOf(-1, 0), intArrayOf(1, 0), intArrayOf(0, -1), intArrayOf(0, 1))
            for (p in pairs) {
              val nx = x + p[0]
              val ny = y + p[1]
              if (nx in 0 until w && ny in 0 until h) {
                val v = inPixels[ny * w + nx]
                rSum -= (v shr 16) and 0xff
                gSum -= (v shr 8) and 0xff
                bSum -= v and 0xff
              }
            }

            val rSharp = rSum.coerceIn(0, 255)
            val gSharp = gSum.coerceIn(0, 255)
            val bSharp = bSum.coerceIn(0, 255)

            // Blend sharpened value with original to soften result
            val rFinal = ((rSharp * sharpenAlpha) + (origR * (1 - sharpenAlpha))).toInt().coerceIn(0, 255)
            val gFinal = ((gSharp * sharpenAlpha) + (origG * (1 - sharpenAlpha))).toInt().coerceIn(0, 255)
            val bFinal = ((bSharp * sharpenAlpha) + (origB * (1 - sharpenAlpha))).toInt().coerceIn(0, 255)

            outPixels[y * w + x] = (aCenter shl 24) or (rFinal shl 16) or (gFinal shl 8) or bFinal
          }
        }

        val out = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        out.setPixels(outPixels, 0, w, 0, 0, w, h)
        Log.d("ImageMerge", "applySharpen: reduced strength applied (alpha=$sharpenAlpha)")
        return out
      }

      try {
        val exif = ExifInterface(photoPath)
        val orientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
        val matrix = Matrix()
        // Handle all EXIF orientation cases including flips and transposes
        when (orientation) {
          ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.setScale(-1f, 1f)
          ExifInterface.ORIENTATION_ROTATE_180 -> matrix.setRotate(180f)
          ExifInterface.ORIENTATION_FLIP_VERTICAL -> { matrix.setRotate(180f); matrix.postScale(-1f, 1f) }
          ExifInterface.ORIENTATION_TRANSPOSE -> { matrix.setRotate(90f); matrix.postScale(-1f, 1f) }
          ExifInterface.ORIENTATION_ROTATE_90 -> matrix.setRotate(90f)
          ExifInterface.ORIENTATION_TRANSVERSE -> { matrix.setRotate(-90f); matrix.postScale(-1f, 1f) }
          ExifInterface.ORIENTATION_ROTATE_270 -> matrix.setRotate(-90f)
          else -> {}
        }
        if (!matrix.isIdentity) {
          photoBitmap = Bitmap.createBitmap(photoBitmap, 0, 0, photoBitmap.width, photoBitmap.height, matrix, true)
          Log.d("ImageMerge", "Adjusted photo according to EXIF ($orientation): new=${photoBitmap.width}x${photoBitmap.height}")
        } else {
          Log.d("ImageMerge", "EXIF orientation normal ($orientation)")
        }
      } catch (e: Exception) {
        Log.w("ImageMerge", "Failed to read EXIF orientation: ${e.message}")
      }

      // If overlay contains container size, and photo orientation doesn't match container, rotate photo 90deg to match preview orientation
      try {
        if (overlay != null && overlay.hasKey("containerWidth") && overlay.hasKey("containerHeight")) {
          val cw = overlay.getDouble("containerWidth").toFloat()
          val ch = overlay.getDouble("containerHeight").toFloat()

          val suppliedPhotoW = if (overlay.hasKey("photoWidth")) overlay.getDouble("photoWidth").toInt() else -1
          val suppliedPhotoH = if (overlay.hasKey("photoHeight")) overlay.getDouble("photoHeight").toInt() else -1

          Log.d("ImageMerge", "Container size: ${cw}x${ch}, photoBitmap before: ${photoBitmap.width}x${photoBitmap.height}, suppliedPhoto=${suppliedPhotoW}x${suppliedPhotoH}")

          val photoPortrait = photoBitmap.height > photoBitmap.width
          val containerPortrait = ch > cw
          if (photoPortrait != containerPortrait) {
            val mRot = Matrix()
            mRot.postRotate(90f)
            photoBitmap = Bitmap.createBitmap(photoBitmap, 0, 0, photoBitmap.width, photoBitmap.height, mRot, true)
            Log.d("ImageMerge", "Rotated photo 90deg to match container orientation: new=${photoBitmap.width}x${photoBitmap.height}")
          }

          // If this is the front camera (mirror=true) and no preview was provided for auto-selection,
          // apply a horizontal (left-right) mirror as the intended behavior for front-camera photos.
          try {
            if (overlay.hasKey("mirror") && overlay.getBoolean("mirror") && previewPath == null) {
              photoBitmap = applyTransform(photoBitmap, 0, 1) // mirrorType 1 = horizontal
              appliedHorizontalMirror = true
              Log.d("ImageMerge", "Applied horizontal mirror for front camera (fallback): new=${photoBitmap.width}x${photoBitmap.height}")
            }
          } catch (e: Exception) {
            Log.w("ImageMerge", "Failed to apply horizontal mirror for front camera: ${e.message}")
          }

        }
      } catch (e: Exception) {
        Log.w("ImageMerge", "Failed to rotate photo to match container orientation: ${e.message}")
      }



      // Load template asset from app assets
      val inputStream = context.assets.open(templateAssetName)
      val templateBitmap = BitmapFactory.decodeStream(inputStream)
        ?: throw Exception("Template bitmap is null")
      inputStream.close()


      // If preview provided, perform candidate-based auto-selection of transform for front camera
      if (previewPath != null && overlay != null && overlay.hasKey("containerWidth") && overlay.hasKey("containerHeight")) {
        try {
          var previewFilePath = previewPath
          if (previewFilePath != null && previewFilePath.startsWith("file://")) previewFilePath = previewFilePath.substring(7)
          val previewRaw = if (previewFilePath != null) BitmapFactory.decodeFile(previewFilePath) else null
          if (previewRaw != null) {
            // downscale preview to reasonable size for comparison
            val maxDim = 320
            val scale = minOf(1f, maxDim.toFloat() / maxOf(previewRaw.width, previewRaw.height))
            val previewW = (previewRaw.width * scale).toInt().coerceAtLeast(1)
            val previewH = (previewRaw.height * scale).toInt().coerceAtLeast(1)
            val previewBmp = Bitmap.createScaledBitmap(previewRaw, previewW, previewH, true)

            val cw = overlay.getDouble("containerWidth").toFloat()
            val ch = overlay.getDouble("containerHeight").toFloat()

            var bestScore = Double.MAX_VALUE
            var bestRot = 0
            var bestMirrorType = 0 // 0=none,1=horizontal,2=vertical

            val rotations = intArrayOf(0, 90, 180, 270)
            val mirrorTypes = intArrayOf(0, 1, 2)

            // create small working photo scaled to preview size to speed up candidate transforms
            val smallPhoto = Bitmap.createScaledBitmap(photoBitmap, previewW, previewH, true)

            Log.d("ImageMerge", "previewRaw=${previewRaw.width}x${previewRaw.height} preview=${previewW}x${previewH} smallPhoto=${smallPhoto.width}x${smallPhoto.height} container=${cw}x${ch}")

            for (r in rotations) {
              for (mt in mirrorTypes) {
                try {
                  val cand = applyTransform(smallPhoto, r, mt)

                  // scaled overlay coordinates relative to previewBmp
                  val sW = previewW / cw
                  val sH = previewH / ch
                  val ox = overlay.getDouble("x").toFloat()
                  val oy = overlay.getDouble("y").toFloat()
                  val ow = overlay.getDouble("width").toFloat()
                  val oh = overlay.getDouble("height").toFloat()

                  val overlayXScaled = ((ox) * sW).toInt().coerceIn(0, previewW)
                  val overlayYScaled = ((oy) * sH).toInt().coerceIn(0, previewH)
                  val overlayWScaled = ((ow) * sW).toInt().coerceIn(0, previewW - overlayXScaled)
                  val overlayHScaled = ((oh) * sH).toInt().coerceIn(0, previewH - overlayYScaled)

                  val mergedCandidate = Bitmap.createBitmap(previewW, previewH, Bitmap.Config.ARGB_8888)
                  val cc = Canvas(mergedCandidate)
                  // Use filtered paint for candidate composition to better match final render
                  val candidatePaint = Paint()
                  candidatePaint.isFilterBitmap = true
                  candidatePaint.isAntiAlias = true
                  cc.drawBitmap(cand, 0f, 0f, candidatePaint)
                  if (overlayWScaled > 0 && overlayHScaled > 0) {
                    val scaledTemplate = Bitmap.createScaledBitmap(templateBitmap, overlayWScaled, overlayHScaled, true)
                    cc.drawBitmap(scaledTemplate, overlayXScaled.toFloat(), overlayYScaled.toFloat(), candidatePaint)
                    scaledTemplate.recycle()
                  } else {
                    val scaledTemplate = Bitmap.createScaledBitmap(templateBitmap, previewW, previewH, true)
                    cc.drawBitmap(scaledTemplate, 0f, 0f, candidatePaint)
                    scaledTemplate.recycle()
                  }

                  val score = computeMSE(mergedCandidate, previewBmp)
                  Log.d("ImageMerge", "candidate rot=$r mirrorType=$mt score=$score overlayScaled=[x=$overlayXScaled y=$overlayYScaled w=$overlayWScaled h=$overlayHScaled]")
                  if (score < bestScore) {
                    bestScore = score
                    bestRot = r
                    bestMirrorType = mt
                  }

                  mergedCandidate.recycle()
                  if (!cand.isRecycled) cand.recycle()
                } catch (e: Exception) {
                  Log.w("ImageMerge", "candidate fail r=$r mt=$mt : ${e.message}")
                }
              }
            }

            if (!smallPhoto.isRecycled) smallPhoto.recycle()

            previewBmp.recycle()

            Log.d("ImageMerge", "best transform rot=$bestRot mirrorType=$bestMirrorType score=$bestScore")

            // Apply best transform to the full-resolution photo before final composition
            photoBitmap = applyTransform(photoBitmap, bestRot, bestMirrorType)
            if (bestMirrorType == 1) appliedHorizontalMirror = true
          }
        } catch (e: Exception) {
          Log.w("ImageMerge", "Auto-selection failed: ${e.message}")
        }

        // After auto-selection: if front-camera mirror was requested and we haven't yet applied a horizontal mirror,
        // enforce a horizontal left-right flip so the final saved image matches the preview
        try {
          if (overlay.hasKey("mirror") && overlay.getBoolean("mirror") && !appliedHorizontalMirror) {
            photoBitmap = applyTransform(photoBitmap, 0, 1)
            appliedHorizontalMirror = true
            Log.d("ImageMerge", "Ensured final horizontal mirror for front camera: new=${photoBitmap.width}x${photoBitmap.height}")
          }
        } catch (e: Exception) {
          Log.w("ImageMerge", "Failed to ensure final horizontal mirror: ${e.message}")
        }
      }

      // Ensure final horizontal mirror if requested but not yet applied
      try {
        if (overlay != null && overlay.hasKey("mirror") && overlay.getBoolean("mirror") && !appliedHorizontalMirror) {
          photoBitmap = applyTransform(photoBitmap, 0, 1)
          appliedHorizontalMirror = true
          Log.d("ImageMerge", "Enforced final horizontal mirror before composition: new=${photoBitmap.width}x${photoBitmap.height}")
        }
      } catch (e: Exception) {
        Log.w("ImageMerge", "Failed to enforce final horizontal mirror: ${e.message}")
      }

      // Create result bitmap at the template's intrinsic pixel size (so output dimensions match the template)
      val outW = templateBitmap.width
      val outH = templateBitmap.height

      // Predeclare resultBitmap so both render branches can assign to it
      var resultBitmap: Bitmap? = null

      // Map overlay rect (container pixels) into template pixel coordinates so the output size matches template layout
      try {
        if (overlay != null && overlay.hasKey("containerWidth") && overlay.hasKey("containerHeight")) {
          val cw = overlay.getDouble("containerWidth").toFloat()
          val ch = overlay.getDouble("containerHeight").toFloat()
          val ox = overlay.getDouble("x").toFloat()
          val oy = overlay.getDouble("y").toFloat()
          val ow = overlay.getDouble("width").toFloat()
          val oh = overlay.getDouble("height").toFloat()

          // normalized fractions
          val fx = ox / cw
          val fy = oy / ch
          val fw = ow / cw
          val fh = oh / ch

          val isMirror = overlay.hasKey("mirror") && overlay.getBoolean("mirror")
          if (isMirror) {
            val oxRightFrac = 1f - (fx + fw)
            overlayX = (oxRightFrac * outW).toInt().coerceIn(0, outW)
          } else {
            overlayX = (fx * outW).toInt().coerceIn(0, outW)
          }
          overlayY = (fy * outH).toInt().coerceIn(0, outH)
          overlayW = (fw * outW).toInt().coerceIn(0, outW - overlayX)
          overlayH = (fh * outH).toInt().coerceIn(0, outH - overlayY)

          Log.d("ImageMerge", "mapped overlay into template pixels: x=$overlayX y=$overlayY w=$overlayW h=$overlayH template=${outW}x${outH}")
        }
      } catch (e: Exception) {
        Log.w("ImageMerge", "Failed to map overlay into template pixels: ${e.message}")
      }

      // Legacy behavior: use template-size rendering (no hi-res upscaling / progressive downscale / sharpen)
      // This matches the previous output that you preferred — set renderScale to 1 to force the simple path.
      val renderScale = 1
      Log.d("ImageMerge", "Using legacy render pipeline (renderScale=1)")
      val qualityPaint = Paint()
      qualityPaint.isFilterBitmap = true
      qualityPaint.isAntiAlias = true

      if (renderScale > 1) {
        val hiW = outW * renderScale
        val hiH = outH * renderScale
        val hiBmp = Bitmap.createBitmap(hiW, hiH, Bitmap.Config.ARGB_8888)
        val hiCanvas = Canvas(hiBmp)

        // scale the canvas so we can reuse our draw logic at template coordinates
        hiCanvas.scale(renderScale.toFloat(), renderScale.toFloat())

        // Draw photo (using same cover logic)
        val pw = photoBitmap.width.toFloat()
        val ph = photoBitmap.height.toFloat()
        val scale = maxOf(outW / pw, outH / ph)
        val scaledWidth = pw * scale
        val scaledHeight = ph * scale
        val dx = (outW - scaledWidth) / 2f
        val dy = (outH - scaledHeight) / 2f

        val drawMatrix = Matrix()
        drawMatrix.postScale(scale, scale)
        drawMatrix.postTranslate(dx, dy)

        hiCanvas.drawBitmap(photoBitmap, drawMatrix, qualityPaint)
        hiCanvas.drawBitmap(templateBitmap, 0f, 0f, qualityPaint)


        // Downscale to final size using progressive multistep downscale for higher quality
        val finalBmp = progressiveDownscale(hiBmp, outW, outH)
        if (!hiBmp.isRecycled && finalBmp !== hiBmp) hiBmp.recycle()

        // Apply a small sharpen filter to restore perceived edge contrast after resampling
        val sharpened = applySharpen(finalBmp)
        if (sharpened !== finalBmp && !finalBmp.isRecycled) finalBmp.recycle()

        // Assign to predeclared result
        resultBitmap = sharpened

        Log.d("ImageMerge", "Rendered hi-res ${hiW}x${hiH} and downscaled to ${outW}x${outH}")

        // Continue with saving 'resultBitmap' below
        
        // Draw diagnostic variant using resultBitmap dimensions if needed later
      } else {
        // Legacy exact-draw behavior: no filter/antialiasing for pixel-accurate draw
        val rb = Bitmap.createBitmap(outW, outH, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(rb)

        try {
          val pw = photoBitmap.width.toFloat()
          val ph = photoBitmap.height.toFloat()
          val scale = maxOf(outW / pw, outH / ph)
          val scaledWidth = pw * scale
          val scaledHeight = ph * scale
          val dx = (outW - scaledWidth) / 2f
          val dy = (outH - scaledHeight) / 2f

          val drawMatrix = Matrix()
          drawMatrix.postScale(scale, scale)
          drawMatrix.postTranslate(dx, dy)

          // Use null paint to avoid any bitmap filtering or anti-aliasing — this matches the old output
          canvas.drawBitmap(photoBitmap, drawMatrix, null)
          Log.d("ImageMerge", "Drew photo (legacy) onto canvas (template-size): ${outW}x${outH} scale=$scale scaled=${scaledWidth}x${scaledHeight} dx=$dx dy=$dy")
        } catch (e: Exception) {
          Log.w("ImageMerge", "Failed to draw scaled photo onto template-size canvas: ${e.message}")
          canvas.drawBitmap(photoBitmap, 0f, 0f, null)
        }

        // Draw the template onto the output without filtering to preserve exact pixels
        try {
          if (overlayW > 0 && overlayH > 0) {
            val scaledTemplate = Bitmap.createScaledBitmap(templateBitmap, overlayW, overlayH, false)
            canvas.drawBitmap(scaledTemplate, overlayX.toFloat(), overlayY.toFloat(), null)
            scaledTemplate.recycle()
          } else {
            canvas.drawBitmap(templateBitmap, 0f, 0f, null)
          }
        } catch (e: Exception) {
          Log.w("ImageMerge", "Failed to draw template onto output canvas: ${e.message}")
        }

        resultBitmap = rb
      }

      if (resultBitmap == null) throw Exception("Rendering failed: result bitmap is null")

      // Legacy output: always use PNG to match previous exports
      val extension = "png"
      val file = File(
        context.cacheDir,
        "merged_${System.currentTimeMillis()}.${extension}"
      )

      val out = FileOutputStream(file)
      val usedFormat = Bitmap.CompressFormat.PNG
      val quality = 100
      resultBitmap!!.compress(usedFormat, quality, out)
      out.flush()
      out.close()

      Log.d("ImageMerge", "Saved (legacy PNG): ${file.absolutePath}")

      // Do NOT insert into MediaStore here; return cached file path to JS so the app can save on confirm
      Log.d("ImageMerge", "SAVED (cached): ${file.absolutePath}")

      // If requested, also write a diagnostic rotated-180 variant so we can compare
      if (overlay != null && overlay.hasKey("saveVariants") && overlay.getBoolean("saveVariants")) {
        try {
          val rot = Matrix()
          rot.postRotate(180f)
          val altPhoto = Bitmap.createBitmap(photoBitmap, 0, 0, photoBitmap.width, photoBitmap.height, rot, true)

          val altResult = Bitmap.createBitmap(altPhoto.width, altPhoto.height, Bitmap.Config.ARGB_8888)
          val altCanvas = Canvas(altResult)
          val qualityPaintVariant = Paint()
          qualityPaintVariant.isFilterBitmap = true
          qualityPaintVariant.isAntiAlias = true
          altCanvas.drawBitmap(altPhoto, 0f, 0f, qualityPaintVariant)

          if (overlayW > 0 && overlayH > 0) {
            val scaledTemplateAlt = Bitmap.createScaledBitmap(templateBitmap, overlayW, overlayH, true)
            altCanvas.drawBitmap(scaledTemplateAlt, overlayX.toFloat(), overlayY.toFloat(), qualityPaintVariant)
          } else {
            val scaledTemplateAlt = Bitmap.createScaledBitmap(templateBitmap, altPhoto.width, altPhoto.height, true)
            altCanvas.drawBitmap(scaledTemplateAlt, 0f, 0f, qualityPaintVariant)
          }

          val altExt = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) "webp" else "png"
          val altFile = File(context.cacheDir, "merged_variant_${System.currentTimeMillis()}.${altExt}")
          val altOut = FileOutputStream(altFile)
          val altFormat = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) Bitmap.CompressFormat.WEBP_LOSSLESS else Bitmap.CompressFormat.PNG
          altResult.compress(altFormat, 100, altOut)
          altOut.flush()
          altOut.close()

          Log.d("ImageMerge", "VARIANT_SAVED (cached): ${altFile.absolutePath}")
        } catch (e: Exception) {
          Log.w("ImageMerge", "Failed to write variant: ${e.message}")
        }
      }

      promise.resolve(file.absolutePath)

    } catch (e: Exception) {
      promise.reject("MERGE_ERROR", e.message, e)
    }
  }
}