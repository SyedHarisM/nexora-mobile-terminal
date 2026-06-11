import AsyncStorage from '@react-native-async-storage/async-storage';
import MaskedView from '@react-native-masked-view/masked-view';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Fingerprint, KeyRound, Lock, Mail, ScanFace, ShieldCheck, User, XCircle } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from './_layout';

const { width } = Dimensions.get('window');
const BACKEND_URL = "http://192.168.18.139:8080"; 

let hasAnimationPlayed = false;

interface RecoveryProps {
  visible: boolean;
  onClose: () => void;
  isSignupMode?: boolean;
  signupEmail?: string;
  otpSent?: boolean;
}

export const RecoveryModal = ({ visible, onClose, isSignupMode = false, signupEmail = "" }: RecoveryProps) => {
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 

  useEffect(() => {
    if (visible) {
      setStep(isSignupMode ? 2 : 1);
    }
  }, [visible, isSignupMode]);

  const handleRequestOtp = async () => {
    if (!recoveryEmail.includes('@')) return Alert.alert("SYSTEM ERROR", "Invalid coordinate format.");
    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/users/forgot-password`, { email: recoveryEmail.trim().toLowerCase() });
      setStep(2);
      Alert.alert("DISPATCHED", "Security frequency (OTP) sent to your mail.");
    } catch (err: any) {
      Alert.alert("DENIED", "Identity not found.");
    } finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (otp.length < 4) return Alert.alert("⚠️ ERROR", "Enter valid OTP.");
    setLoading(true);
    try {
      const targetEmail = isSignupMode ? signupEmail : recoveryEmail.trim().toLowerCase();
      await axios.post(`${BACKEND_URL}/api/users/reset-password`, {
        email: targetEmail,
        otp: otp.trim(),
        newPassword: isSignupMode ? "" : newPass 
      });
      Alert.alert("✨ SUCCESS", isSignupMode ? "Verified! Now Login." : "Key Updated.");
      onClose();
    } catch (err: any) {
      Alert.alert("🚨 BREACH", "Invalid OTP.");
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={modalStyles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', alignItems: 'center' }}>
          <View style={modalStyles.container}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>{isSignupMode ? "IDENTITY VERIFICATION" : "RECOVERY PROTOCOL"}</Text>
              <TouchableOpacity onPress={onClose}><XCircle color="#FF00FF" size={24} /></TouchableOpacity>
            </View>
            {step === 1 ? (
              <View style={modalStyles.content}>
                <Text style={modalStyles.label}>IDENTIFY EMAIL</Text>
                <View style={modalStyles.inputBox}>
                  <Mail color="#00F0FF" size={18} />
                  <TextInput placeholder="ENTER OPERATOR EMAIL" placeholderTextColor="#444" style={modalStyles.input} value={recoveryEmail} onChangeText={setRecoveryEmail} autoCapitalize="none" />
                </View>
                <TouchableOpacity style={modalStyles.btn} onPress={handleRequestOtp}>
                  {loading ? <ActivityIndicator color="#000" /> : <Text style={modalStyles.btnText}>GET OTP NOW</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={modalStyles.content}>
                <Text style={modalStyles.label}>SECURITY FREQUENCY</Text>
                <View style={modalStyles.inputBox}>
                  <KeyRound color="#00F0FF" size={18} />
                  <TextInput placeholder="ENTER SECURITY OTP" placeholderTextColor="#444" style={modalStyles.input} value={otp} onChangeText={setOtp} keyboardType="numeric" />
                </View>
                {!isSignupMode && (
                  <>
                    <Text style={[modalStyles.label, {marginTop: 15}]}>NEW SECRET KEY</Text>
                    <View style={modalStyles.inputBox}>
                      <Lock color="#FF00FF" size={18} />
                      <TextInput placeholder="MIN 6 CHARACTERS" placeholderTextColor="#444" style={modalStyles.input} value={newPass} onChangeText={setNewPass} secureTextEntry />
                    </View>
                  </>
                )}
                <TouchableOpacity style={[modalStyles.btn, {backgroundColor: '#FF00FF'}]} onPress={handleReset}>
                  {loading ? <ActivityIndicator color="#000" /> : <Text style={modalStyles.btnText}>{isSignupMode ? "VERIFY IDENTITY" : "CONFIRM PROTOCOL"}</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const GeometricX = () => (
  <View style={xStyles.xContainer}>
    <View style={xStyles.leftArm} /><View style={xStyles.rightArm} /><View style={xStyles.innerGlow} /><View style={xStyles.corePulse} />
  </View>
);

const GradientText = ({ children, style }: { children: string, style?: any }) => (
  <MaskedView maskElement={<Text style={[styles.logoTextBase, style]}>{children}</Text>}>
    <LinearGradient colors={['#FFFFFF', '#FF00FF', '#7000FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={[styles.logoTextBase, style, { opacity: 0 }]}>{children}</Text>
    </LinearGradient>
  </MaskedView>
);

export default function LoginPage() {
  const auth = useAuth() as any;
  const signIn = auth?.signIn;

  const [identity, setIdentity] = useState(''); 
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [recoveryVisible, setRecoveryVisible] = useState(false); 
  const [biometricType, setBiometricType] = useState<string>('BIOMETRIC');
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  const insets = useSafeAreaInsets();
  const router = useRouter();

  const logoOpacity = useRef(new Animated.Value(hasAnimationPlayed ? 1 : 0)).current;
  const logoScale = useRef(new Animated.Value(hasAnimationPlayed ? 1 : 0.5)).current;
  const formOpacity = useRef(new Animated.Value(hasAnimationPlayed ? 1 : 0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const [isVerifying, setIsVerifying] = useState(false);
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [otpAlreadySent, setOtpAlreadySent] = useState(false);

  useEffect(() => {
    const initializeTerminal = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricAvailable(hasHardware && isEnrolled);

        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('FACE ID');
        } else {
          setBiometricType('FINGERPRINT');
        }

        const savedIdentity = await AsyncStorage.getItem('remembered_identity');
        if (savedIdentity) {
          setIdentity(savedIdentity);
          setRememberMe(true);
        }
        
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
            router.replace('/(tabs)'); 
        } else {
            setIsCheckingAuth(false);
        }
      } catch (e) { 
        setIsCheckingAuth(false); 
      }
    };

    initializeTerminal();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!hasAnimationPlayed && !isCheckingAuth) {
      Animated.sequence([
        Animated.delay(400),
        Animated.parallel([
          Animated.timing(logoOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        ]),
        Animated.timing(formOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]).start(() => { hasAnimationPlayed = true; });
    }
  }, [isCheckingAuth]);

  const handleBiometricAuth = async () => {
    // FIX: Check if we have biometrics enabled for this account
    const biometricEnabled = await AsyncStorage.getItem('biometric_enabled');
    
    if (!isBiometricAvailable) {
      return Alert.alert("HARDWARE ERROR", "Biometric sensors not detected.");
    }

    if (biometricEnabled !== 'true') {
      return Alert.alert("AUTH REQUIRED", "Please login with your password once to activate Face ID/Biometrics for this account.");
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `NEXORA SECURITY: SCAN ${biometricType}`,
      fallbackLabel: 'Use Password',
    });

    if (result.success) {
      const savedToken = await SecureStore.getItemAsync('userToken_Vault'); // Stored specifically for biometrics
      if (savedToken) {
        setIsLoading(true);
        await SecureStore.setItemAsync('userToken', savedToken);
        if (signIn) signIn(savedToken);
        else router.replace('/(tabs)');
      } else {
        Alert.alert("VAULT EMPTY", "Session expired. Please login with password.");
      }
    }
  };
  
  const handleLogin = async () => {
    if (!identity.trim() || !password.trim()) {
      Alert.alert("⚠️ NEXORA SYSTEM", "Identity and Secret Key are mandatory.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/users/login`, {
        email: identity.trim().toLowerCase(),
        password: password.trim()
      });

      if (response.data?.accessToken) {
        const token = response.data.accessToken;

        // Save session data
        await AsyncStorage.setItem('user_name', response.data.name || "NEXORA OPERATOR");
        await SecureStore.setItemAsync('userToken', token);
        
        // FIX: Always save these for Biometric trigger
        await AsyncStorage.setItem('biometric_enabled', 'true');
        await SecureStore.setItemAsync('userToken_Vault', token);
        
        if (rememberMe) {
          await AsyncStorage.setItem('remembered_identity', identity.trim().toLowerCase());
        } else {
          await AsyncStorage.removeItem('remembered_identity');
        }

        if (signIn) signIn(token);
        else router.replace('/(tabs)');
      }
    } catch (error: any) {
        const serverResponse = error.response?.data;
        if (serverResponse?.message === "IDENTITY_UNVERIFIED") {
            setSignupEmail(identity.trim().toLowerCase()); 
            setIsSignupMode(true);
            setOtpAlreadySent(true);
            setIsVerifying(true); 
            Alert.alert("⚠️ SECURITY", "Identity pending. Verification frequency dispatched.");
        } else {
            Alert.alert("ACCESS DENIED", serverResponse?.message || "Invalid credentials.");
        }
    } finally {
        setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <View style={[styles.masterWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00F0FF" />
      </View>
    );
  }

  return (
    <View style={styles.masterWrapper}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#0F011A', '#05000a', '#001A1D']} style={StyleSheet.absoluteFill}/>
      
      <Animated.View style={[styles.bubblingOrb, { top: '5%', right: '-15%', backgroundColor: '#FF00FF15', transform: [{ scale: floatAnim.interpolate({inputRange: [0, 1], outputRange: [1, 1.3]}) }] }]} />
      <Animated.View style={[styles.bubblingOrb, { bottom: '10%', left: '-15%', backgroundColor: '#00F0FF10', transform: [{ scale: floatAnim.interpolate({inputRange: [0, 1], outputRange: [1.3, 1]}) }] }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
          <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
            
            <Animated.View style={[styles.header, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
              <View style={styles.logoContainer}>
                <GradientText style={styles.logoTextCustom}>NE</GradientText>
                <GeometricX />
                <GradientText style={styles.logoTextCustom}>ORA</GradientText>
              </View>
              <Text style={styles.terminalText}>PREMIUM ACCESS TERMINAL</Text>
            </Animated.View>

            <Animated.View style={[styles.form, { opacity: formOpacity }]}>
              <View style={styles.sexyCard}>
                <Text style={styles.inputLabel}>IDENTITY</Text>
                <View style={styles.glassInputWrapper}>
                  <View style={styles.iconCircle}><User color={'#00F0FF'} size={18} /></View>
                  <TextInput placeholder="OPERATOR EMAIL" placeholderTextColor="rgba(255,255,255,0.2)" style={styles.input} value={identity} onChangeText={setIdentity} autoCapitalize="none" />
                </View>

                <TouchableOpacity style={styles.rememberMeRow} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.7}>
                  <View style={[styles.checkboxBase, rememberMe && styles.checkboxChecked]}>{rememberMe && <View style={styles.checkboxInner} />}</View>
                  <Text style={styles.rememberText}>REMEMBER COORDINATES</Text>
                </TouchableOpacity>

                <Text style={[styles.inputLabel, {marginTop: 10}]}>SECRET KEY</Text>
                <View style={styles.glassInputWrapper}>
                  <View style={styles.iconCircle}><Lock color={'#FF00FF'} size={18} /></View>
                  <TextInput placeholder="ENCRYPTION PASSWORD" placeholderTextColor="rgba(255,255,255,0.2)" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
                </View>

                <TouchableOpacity style={styles.forgotBtn} onPress={() => {
                  setOtpAlreadySent(false);
                  setIsSignupMode(false);
                  setRecoveryVisible(true);
                }}>
                  <Text style={styles.forgotText}>FORGOT SECRETS?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity activeOpacity={0.8} onPress={handleLogin} style={styles.loginButtonContainer}>
                <LinearGradient colors={['#00F0FF', '#7000FF', '#FF00FF']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.loginButton}>
                  {isLoading ? <ActivityIndicator color="#FFF" /> : (
                    <>
                      <Text style={styles.loginButtonText}>ENTER THE VAULT</Text>
                      <View style={styles.loginIconCircle}><ShieldCheck color="#000" size={20} /></View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {isBiometricAvailable && (
                <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometricAuth} activeOpacity={0.7}>
                  {biometricType === 'FACE ID' ? <ScanFace color="#00F0FF" size={24} /> : <Fingerprint color="#00F0FF" size={24} />}
                  <Text style={styles.biometricText}>SCAN {biometricType}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/signup')} activeOpacity={0.7}>
                <Text style={styles.footerText}>New to the Future? <Text style={styles.signupText}>Join the Club</Text></Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <RecoveryModal visible={recoveryVisible} onClose={() => setRecoveryVisible(false)} />
      <RecoveryModal visible={isVerifying} onClose={() => setIsVerifying(false)} isSignupMode={isSignupMode} signupEmail={signupEmail} otpSent={otpAlreadySent} />
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '85%', backgroundColor: '#0A0A0A', borderRadius: 30, padding: 25, borderWidth: 1, borderColor: '#1A1A1A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: '#00F0FF', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  content: { width: '100%' },
  label: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', marginBottom: 10, letterSpacing: 1 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 15, paddingHorizontal: 15, height: 60, borderWidth: 1, borderColor: '#222' },
  input: { flex: 1, color: '#FFF', marginLeft: 10, fontSize: 14 },
  btn: { backgroundColor: '#00F0FF', height: 55, borderRadius: 15, marginTop: 25, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 1 }
});

const xStyles = StyleSheet.create({
  xContainer: { width: 45, height: 55, marginHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
  leftArm: { position: 'absolute', width: 8, height: '100%', backgroundColor: '#FF00FF', transform: [{ rotate: '45deg' }], borderRadius: 5 },
  rightArm: { position: 'absolute', width: 8, height: '100%', backgroundColor: '#FF00FF', transform: [{ rotate: '-45deg' }], borderRadius: 5 },
  innerGlow: { position: 'absolute', width: 2, height: '80%', backgroundColor: '#FFF', transform: [{ rotate: '45deg' }], opacity: 0.5 },
  corePulse: { width: 6, height: 6, backgroundColor: '#FFF', borderRadius: 3, opacity: 0.6 }
});

const styles = StyleSheet.create({
  masterWrapper: { flex: 1, backgroundColor: '#020105' },
  bubblingOrb: { position: 'absolute', width: 380, height: 380, borderRadius: 190 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 30 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoTextBase: { fontSize: 52, fontWeight: '900' },
  logoTextCustom: { letterSpacing: 2 },
  terminalText: { color: 'rgba(0, 240, 255, 0.4)', fontSize: 9, fontWeight: '900', letterSpacing: 4, marginTop: 10 },
  form: { width: '100%' },
  sexyCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 25, borderRadius: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 25 },
  inputLabel: { color: '#00F0FF', fontSize: 9, fontWeight: '900', letterSpacing: 3, marginBottom: 10, marginLeft: 5, opacity: 0.6 },
  glassInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, height: 70, marginBottom: 18, paddingHorizontal: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '600', marginLeft: 15 },
  rememberMeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginLeft: 5 },
  checkboxBase: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: 'rgba(0, 240, 255, 0.4)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  checkboxChecked: { borderColor: '#00F0FF', backgroundColor: 'rgba(0, 240, 255, 0.1)' },
  checkboxInner: { width: 8, height: 8, borderRadius: 1, backgroundColor: '#00F0FF' },
  rememberText: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 5 },
  forgotText: { color: '#FF00FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  loginButtonContainer: { marginTop: 10 },
  loginButton: { height: 75, borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 30 },
  loginButtonText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  loginIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  biometricBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 25, padding: 18, borderRadius: 25, backgroundColor: 'rgba(0, 240, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(0, 240, 255, 0.2)' },
  biometricText: { color: '#00F0FF', fontSize: 12, fontWeight: '900', letterSpacing: 3, marginLeft: 12 },
  footerLink: { marginTop: 35, alignItems: 'center' },
  footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' },
  signupText: { color: '#00F0FF', fontWeight: '900' }
});