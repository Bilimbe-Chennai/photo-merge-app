import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
    Dimensions,
} from "react-native";
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Using MaterialIcons for check/eye
import { SafeAreaView } from 'react-native-safe-area-context';
const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const handleContinue = () => {
        Keyboard.dismiss();
        if (name && email) {
            navigation.navigate("Camera", {
                user: { name, email, whatsapp },
            });
        }
    };

    return (
        <View style={styles.container}>
            {/* Background Gradient for the whole screen (or just top) */}
            <LinearGradient
                colors={['#4a0012', '#9a1b2d', '#c22f42']} // Deep burgundy to red
                style={styles.gradientBackground}
            >
                {/* Decorative Circles */}
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />

                {/* Header Content */}
                <SafeAreaView style={styles.headerContent}>
                    <View style={styles.topBar}>
                        {/* Menu Dots Icon placeholder */}
                        <Icon name="more-horiz" size={30} color="#fff" style={{ alignSelf: 'flex-end' }} />
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.titleLine}>Hello</Text>
                        <Text style={styles.titleLine}>Welcome Back!</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* White Form Container */}
            <View style={styles.formSheet}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* Name Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Name</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your Name"
                                    placeholderTextColor="#ccc"
                                    value={name}
                                    onChangeText={setName}
                                />
                                {name.length > 2 && (
                                    <Icon name="check" size={20} color="#28a745" />
                                )}
                            </View>
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Gmail</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your gmail id"
                                    placeholderTextColor="#ccc"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                {email.includes('@') && (
                                    <Icon name="check" size={20} color="#28a745" />
                                )}
                            </View>
                        </View>

                        {/* WhatsApp Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>WhatsApp</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Whatsapp Number"
                                    placeholderTextColor="#ccc"
                                    value={whatsapp}
                                    onChangeText={setWhatsapp}
                                    keyboardType="phone-pad"
                                />
                                <Icon name="chat" size={20} color="#999" />
                            </View>
                        </View>


                        {/* Sign In Button */}
                        <TouchableOpacity onPress={handleContinue} activeOpacity={0.8} style={{ marginTop: 30 }}>
                            <LinearGradient
                                colors={['#7f0020', '#b3152c']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.btn}
                                    disabled={!name.trim() || !email.trim() || !whatsapp.trim()}
                            >
                                <Text style={styles.btnText}>SUBMIT</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>© 2025 PhotoMerge. All rights reserved.</Text>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#4a0012', // Match top gradient color
    },
    gradientBackground: {
        height: '40%', // Takes top 40%
        width: '100%',
        position: 'relative',
        justifyContent: 'center',
    },
    circle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(0,0,0,0.2)', // Subtle shadow circles
    },
    circle1: {
        width: 150,
        height: 150,
        top: -30,
        right: 40,
        opacity: 0.5,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    circle2: {
        width: 100,
        height: 100,
        top: '30%',
        right: '15%',
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    headerContent: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: 20,
        justifyContent: 'flex-start',
    },
    topBar: {
        alignItems: 'flex-end',
        marginBottom: 30,
        marginTop: Platform.OS === 'android' ? 20 : 0,
    },
    titleContainer: {
        marginTop: 10,
    },
    titleLine: {
        fontSize: 38,
        fontWeight: 'bold',
        color: '#fff',
        lineHeight: 46,
    },
    formSheet: {
        flex: 1,
        marginTop: -30, // Pull up to overlap gradient
        backgroundColor: '#fff',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        paddingHorizontal: 35,
        paddingTop: 50,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    inputGroup: {
        marginBottom: 25,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        color: '#880e25', // Deep red for labels
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingBottom: 8,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#333',
        paddingVertical: 5,
    },
    forgotPass: {
        fontWeight: 'bold',
        color: '#333',
        fontSize: 13,
        textDecorationLine: 'underline',
    },
    btn: {
        width: '100%',
        height: 55,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#7f0020",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    btnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        color: '#aaa',
        fontSize: 13,
    },
    footerLink: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 13,
    },
});