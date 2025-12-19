import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
    Image,
} from "react-native";

export default function LoginScreen({ navigation }) {
    const [name, setName] = useState("dhivya");
    const [email, setEmail] = useState("dhivya@gmail.com");
    const [whatsapp, setWhatsapp] = useState("8883571421");

    const handleContinue = () => {
        Keyboard.dismiss();
        navigation.navigate("Camera", {
            user: { name, email, whatsapp },
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoid}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.container}>
                            {/* Header Section */}
                            <View style={styles.header}>
                                <View style={styles.logoContainer}>
                                    <Text style={styles.logo}>📸</Text>
                                </View>
                                <Text style={styles.title}>Welcome</Text>
                                <Text style={styles.subtitle}>
                                    Enter your details to continue
                                </Text>
                            </View>

                            {/* Form Section */}
                            <View style={styles.formContainer}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Full Name</Text>
                                    <TextInput
                                        placeholder="Enter your name"
                                        style={styles.input}
                                        value={name}
                                        onChangeText={setName}
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Email Address</Text>
                                    <TextInput
                                        placeholder="Enter your email"
                                        style={styles.input}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>WhatsApp Number</Text>
                                    <TextInput
                                        placeholder="Enter your WhatsApp number"
                                        style={styles.input}
                                        value={whatsapp}
                                        onChangeText={setWhatsapp}
                                        keyboardType="phone-pad"
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                {/* Info Note */}
                                <View style={styles.noteContainer}>
                                    <Text style={styles.noteText}>
                                        📱 We'll use this WhatsApp number for notifications
                                    </Text>
                                </View>

                                {/* Continue Button */}
                                <TouchableOpacity
                                    style={styles.btn}
                                    onPress={handleContinue}
                                    activeOpacity={0.9}
                                >
                                    <Text style={styles.btnText}>Continue to Camera</Text>
                                    <Text style={styles.btnIcon}>→</Text>
                                </TouchableOpacity>

                                {/* Terms Text */}
                                {/* <Text style={styles.termsText}>
                                    By continuing, you agree to our Terms and Privacy Policy
                                </Text> */}
                            </View>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 30,
    },
    header: {
        alignItems: "center",
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#FFE5E5",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    logo: {
        fontSize: 36,
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        color: "#1A1A1A",
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        lineHeight: 22,
    },
    formContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 8,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
        paddingLeft: 4,
    },
    input: {
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        borderRadius: 16,
        paddingHorizontal: 18,
        paddingVertical: 16,
        fontSize: 16,
        color: "#1A1A1A",
        backgroundColor: "#F8FAFC",
    },
    noteContainer: {
        backgroundColor: "#F0F9FF",
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: "#0EA5E9",
    },
    noteText: {
        fontSize: 14,
        color: "#0369A1",
        lineHeight: 20,
    },
    btn: {
        backgroundColor: "#DC2626",
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 24,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#DC2626",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 20,
    },
    btnText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    btnIcon: {
        color: "#FFFFFF",
        fontSize: 20,
        marginLeft: 8,
        fontWeight: "600",
    },
    termsText: {
        fontSize: 13,
        color: "#666",
        textAlign: "center",
        lineHeight: 18,
        paddingHorizontal: 20,
    },
});