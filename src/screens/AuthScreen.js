import React, { useState, useRef } from 'react';
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
    Alert,
    ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAxios from '../services/useAxios';

const { width } = Dimensions.get('window');

export default function AuthScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const scrollRef = useRef(null);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    const emailInput = useRef(null);
    const passwordInput = useRef(null);
    const axios = useAxios();

    const handleLogin = async () => {
        Keyboard.dismiss();
        // Basic validation
        if (!email.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('/users/login', {
                email,
                password,
                type: 'app user'
            });

            if (response.data.success) {
                // Navigate to Login screen with user data
                navigation.navigate('Login', { userData: response.data.data });
            } else {
                Alert.alert('Login Failed', response.data.error || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.error || 'Connection error. Please try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToInput = ref => {
        setTimeout(() => {
            ref?.current?.measureLayout(
                scrollRef.current,
                (x, y) => {
                    scrollRef.current?.scrollTo({
                        y: y - 20,
                        animated: true,
                    });
                },
                () => { },
            );
        }, 100);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#4a0012', '#9a1b2d', '#c22f42']}
                style={styles.gradientBackground}
            >
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />

                <SafeAreaView style={styles.headerContent}>
                    <View style={styles.topBar}>
                        <Icon
                            name="more-horiz"
                            size={30}
                            color="#fff"
                            style={{ alignSelf: 'flex-end' }}
                        />
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.titleLine}>Sign In</Text>
                        <Text style={styles.titleLine}>To Your Account</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.formSheet}>
                            <ScrollView
                                ref={scrollRef}
                                contentContainerStyle={styles.scrollContent}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                <KeyboardAwareScrollView
                                    enableOnAndroid
                                    extraScrollHeight={30}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    {/* Email Input */}
                                    <View style={styles.inputGroup} ref={emailRef}>
                                        <Text style={styles.label}>Email Address</Text>
                                        <View style={styles.inputWrapper}>
                                            <TextInput
                                                ref={emailInput}
                                                style={styles.input}
                                                placeholder="Enter your email"
                                                placeholderTextColor="#ccc"
                                                value={email}
                                                onChangeText={setEmail}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                onFocus={() => scrollToInput(emailRef)}
                                                returnKeyType="next"
                                                onSubmitEditing={() => passwordInput.current.focus()}
                                            />
                                            {email.includes('@') && (
                                                <Icon name="check" size={20} color="#28a745" />
                                            )}
                                        </View>
                                    </View>

                                    {/* Password Input */}
                                    <View style={styles.inputGroup} ref={passwordRef}>
                                        <Text style={styles.label}>Password</Text>
                                        <View style={styles.inputWrapper}>
                                            <TextInput
                                                ref={passwordInput}
                                                style={styles.input}
                                                placeholder="Enter your password"
                                                placeholderTextColor="#ccc"
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry={!showPassword}
                                                onFocus={() => scrollToInput(passwordRef)}
                                                returnKeyType="done"
                                                onSubmitEditing={handleLogin}
                                            />
                                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                                <Icon
                                                    name={showPassword ? 'visibility' : 'visibility-off'}
                                                    size={20}
                                                    color="#999"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Login Button */}
                                    <TouchableOpacity
                                        onPress={handleLogin}
                                        activeOpacity={0.8}
                                        style={{ marginTop: 30 }}
                                    >
                                        <LinearGradient
                                            colors={['#7f0020', '#b3152c']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.btn}
                                            disabled={!email.trim() || !password.trim() || isLoading}
                                        >
                                            {isLoading ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <Text style={styles.btnText}>SIGN IN</Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    {/* Footer */}
                                    <View style={styles.footer}>
                                        <Text style={styles.footerText}>
                                            © 2025 PhotoMerge. All rights reserved.
                                        </Text>
                                    </View>
                                </KeyboardAwareScrollView>
                            </ScrollView>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#4a0012',
    },
    gradientBackground: {
        height: '40%',
        width: '100%',
        position: 'relative',
        justifyContent: 'center',
    },
    circle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(0,0,0,0.2)',
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
        marginTop: -30,
        backgroundColor: '#fff',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        paddingHorizontal: 35,
        paddingTop: 50,
    },
    scrollContent: {
        paddingBottom: 10,
    },
    inputGroup: {
        marginBottom: 25,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        color: '#880e25',
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
    btn: {
        width: '100%',
        height: 55,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7f0020',
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
});
