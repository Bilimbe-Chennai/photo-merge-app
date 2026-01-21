package com.photomergeapp

import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.media.MediaMetadataRetriever
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import java.io.File
import java.nio.ByteBuffer
import java.util.concurrent.Executors

class VideoProcessingModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val executor = Executors.newSingleThreadExecutor()
    
    override fun getName(): String {
        return "VideoProcessing"
    }

    @ReactMethod
    fun processVideoWithSlowMotion(
        inputPath: String,
        segments: ReadableArray,
        outputPath: String,
        promise: Promise
    ) {
        executor.execute {
            try {
                val cleanInputPath = inputPath.replace("file://", "")
                val inputFile = File(cleanInputPath)
                
                if (!inputFile.exists()) {
                    promise.reject("FILE_NOT_FOUND", "Input video file not found: $cleanInputPath")
                    return@execute
                }

                if (segments.size() == 0) {
                    val outputFile = File(outputPath)
                    inputFile.copyTo(outputFile, overwrite = true)
                    promise.resolve(outputPath)
                    return@execute
                }

                
                // Parse segments
                val slowMotionSegments = mutableListOf<Pair<Double, Double>>()
                for (i in 0 until segments.size()) {
                    val segment = segments.getMap(i) ?: continue
                    val start = segment.getDouble("start")
                    val end = if (segment.hasKey("end") && !segment.isNull("end")) {
                        segment.getDouble("end")
                    } else {
                        -1.0
                    }
                    slowMotionSegments.add(Pair(start, end))
                }

                // Process video
                processVideoSegments(cleanInputPath, outputPath, slowMotionSegments, promise)
                
            } catch (e: Exception) {
                Log.e("VideoProcessing", "Error processing video", e)
                promise.reject("PROCESSING_ERROR", "Failed to process video: ${e.message}", e)
            }
        }
    }

    private fun processVideoSegments(
        inputPath: String,
        outputPath: String,
        segments: List<Pair<Double, Double>>,
        promise: Promise
    ) {
        var extractor: MediaExtractor? = null
        var muxer: MediaMuxer? = null
        
        try {
            extractor = MediaExtractor()
            extractor.setDataSource(inputPath)
            
            // Find video and audio tracks
            var videoTrackIndex = -1
            var audioTrackIndex = -1
            var videoFormat: MediaFormat? = null
            var audioFormat: MediaFormat? = null
            
            for (i in 0 until extractor.trackCount) {
                val format = extractor.getTrackFormat(i)
                val mime = format.getString(MediaFormat.KEY_MIME) ?: continue
                
                if (mime.startsWith("video/") && videoFormat == null) {
                    videoFormat = format
                    videoTrackIndex = i
                } else if (mime.startsWith("audio/") && audioFormat == null) {
                    audioFormat = format
                    audioTrackIndex = i
                }
            }
            
            if (videoFormat == null) {
                promise.reject("NO_VIDEO_TRACK", "No video track found")
                return
            }
            
            // Get video duration
            val durationUs = videoFormat.getLong(MediaFormat.KEY_DURATION)
            val durationSeconds = durationUs / 1_000_000.0
            
            // Build parts list
            val sortedSegments = segments.sortedBy { it.first }
            val allParts = mutableListOf<VideoPart>()
            var currentTime = 0.0
            
            sortedSegments.forEach { segment ->
                val segStart = segment.first
                val segEnd = if (segment.second < 0) durationSeconds else segment.second
                
                if (segStart > currentTime) {
                    allParts.add(VideoPart(currentTime, segStart, false))
                }
                allParts.add(VideoPart(segStart, segEnd, true))
                currentTime = segEnd
            }
            
            if (currentTime < durationSeconds) {
                allParts.add(VideoPart(currentTime, durationSeconds, false))
            }
            
            
            // Read orientation from input video metadata
            var orientation = 0
            var metadataRetriever: MediaMetadataRetriever? = null
            try {
                metadataRetriever = MediaMetadataRetriever()
                metadataRetriever.setDataSource(inputPath)
                
                // Try to get rotation from metadata
                val rotationStr = metadataRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)
                if (rotationStr != null) {
                    orientation = rotationStr.toIntOrNull() ?: 0
                } else {
                    // Check if orientation is in the video format as fallback
                    if (videoFormat.containsKey(MediaFormat.KEY_ROTATION)) {
                        orientation = videoFormat.getInteger(MediaFormat.KEY_ROTATION)
                    }
                }
            } catch (e: Exception) {
                Log.w("VideoProcessing", "Could not read orientation: ${e.message}")
            } finally {
                metadataRetriever?.release()
            }
            
            // Create muxer and add tracks BEFORE starting
            muxer = MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
            
            // Set orientation hint if we found one (preserves portrait/landscape orientation)
            if (orientation != 0) {
                try {
                    muxer.setOrientationHint(orientation)
                } catch (e: Exception) {
                    Log.w("VideoProcessing", "Could not set orientation hint: ${e.message}")
                }
            }
            
            val muxerVideoTrackIndex = muxer.addTrack(videoFormat)
            val muxerAudioTrackIndex = if (audioFormat != null) {
                muxer.addTrack(audioFormat)
            } else {
                -1
            }
            
            muxer.start()
            
            // Process video track
            extractor.selectTrack(videoTrackIndex)
            var outputVideoTime = 0L
            
            for (part in allParts) {
                val startTimeUs = (part.start * 1_000_000).toLong()
                val endTimeUs = (part.end * 1_000_000).toLong()
                
                extractor.seekTo(startTimeUs, MediaExtractor.SEEK_TO_CLOSEST_SYNC)
                
                val buffer = ByteBuffer.allocate(1024 * 1024)
                var frameCount = 0
                
                while (true) {
                    val sampleSize = extractor.readSampleData(buffer, 0)
                    if (sampleSize < 0) break
                    
                    val sampleTime = extractor.sampleTime
                    if (sampleTime >= endTimeUs) break
                    
                    val flags = extractor.sampleFlags
                    val relativeTime = sampleTime - startTimeUs
                    
                    // Calculate output time (slow motion = 4x slower)
                    val outputTime = if (part.isSlow) {
                        outputVideoTime + (relativeTime * 4)
                    } else {
                        outputVideoTime + relativeTime
                    }
                    
                    buffer.position(0)
                    buffer.limit(sampleSize)
                    
                    val bufferInfo = android.media.MediaCodec.BufferInfo()
                    bufferInfo.set(0, sampleSize, outputTime, flags)
                    muxer.writeSampleData(muxerVideoTrackIndex, buffer, bufferInfo)
                    
                    frameCount++
                    if (!extractor.advance()) break
                }
                
                val partDurationUs = endTimeUs - startTimeUs
                outputVideoTime += if (part.isSlow) (partDurationUs * 4) else partDurationUs
                
            }
            
            // Process audio track if available
            if (muxerAudioTrackIndex >= 0 && audioTrackIndex >= 0) {
                extractor.selectTrack(audioTrackIndex)
                var outputAudioTime = 0L
                
                for (part in allParts) {
                    val startTimeUs = (part.start * 1_000_000).toLong()
                    val endTimeUs = (part.end * 1_000_000).toLong()
                    
                    extractor.seekTo(startTimeUs, MediaExtractor.SEEK_TO_CLOSEST_SYNC)
                    
                    val buffer = ByteBuffer.allocate(64 * 1024)
                    var sampleCount = 0
                    
                    while (true) {
                        val sampleSize = extractor.readSampleData(buffer, 0)
                        if (sampleSize < 0) break
                        
                        val sampleTime = extractor.sampleTime
                        if (sampleTime >= endTimeUs) break
                        
                        val flags = extractor.sampleFlags
                        val relativeTime = sampleTime - startTimeUs
                        
                        val outputTime = if (part.isSlow) {
                            outputAudioTime + (relativeTime * 4)
                        } else {
                            outputAudioTime + relativeTime
                        }
                        
                        buffer.position(0)
                        buffer.limit(sampleSize)
                        
                        val bufferInfo = android.media.MediaCodec.BufferInfo()
                        bufferInfo.set(0, sampleSize, outputTime, flags)
                        muxer.writeSampleData(muxerAudioTrackIndex, buffer, bufferInfo)
                        
                        sampleCount++
                        if (!extractor.advance()) break
                    }
                    
                    val partDurationUs = endTimeUs - startTimeUs
                    outputAudioTime += if (part.isSlow) (partDurationUs * 4) else partDurationUs
                    
                }
            }
            
            muxer.stop()
            muxer.release()
            muxer = null
            
            val outputFile = File(outputPath)
            if (outputFile.exists() && outputFile.length() > 0) {
                promise.resolve(outputPath)
            } else {
                promise.reject("PROCESSING_ERROR", "Output file was not created or is empty")
            }
            
        } catch (e: Exception) {
            Log.e("VideoProcessing", "Error in processVideoSegments", e)
            promise.reject("PROCESSING_ERROR", "Video processing failed: ${e.message}", e)
        } finally {
            extractor?.release()
            muxer?.release()
        }
    }
    
    private data class VideoPart(
        val start: Double,
        val end: Double,
        val isSlow: Boolean
    )
}
