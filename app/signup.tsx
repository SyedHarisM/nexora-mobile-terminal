import MaskedView from '@react-native-masked-view/masked-view';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Lock, Mail, ShieldCheck, User } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
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
import { RecoveryModal } from './index';

const BACKEND_URL = "http://192.168.18.139:8080"; 

// YEH RAHI ALLOWED DOMAINS KI LIST
const ALLOWED_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];

const GeometricX = () => (
  <View style={xStyles.xContainer}>
    <View style={xStyles.leftArm} /><View style={xStyles.rightArm} /><View style={xStyles.innerGlow} /><View style={xStyles.corePulse} />
  </View>
);

const GradientText = ({ children, style }: { children: string, style?: any }) => (
  <MaskedView maskElement={<Text style={[styles.logoTextBase, style]}>{children}</Text>}>
    <LinearGradient colors={['#FFFFFF', '#00F0FF', '#7000FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={[styles.logoTextBase, style, { opacity: 0 }]}>{children}</Text>
    </LinearGradient>
  </MaskedView>
);

export default function SignupPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [countryCode] = useState('+92');
  const [countryFlag] = useState('🇵🇰');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const [isVerifying, setIsVerifying] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleSignup = async () => {
    if (!name || !phone || !email || !password) {
        Alert.alert("⚠️ NEXORA SYSTEM", "All fields are mandatory.");
        return;
    }

    // 1. Phone validation (11 digits)
    if (phone.length !== 11) {
        Alert.alert("SIGNAL ERROR", "Frequency must be exactly 11 digits.");
        return;
    }

    // 2. EMAIL DOMAIN VALIDATION (FIX)
    const userEmail = email.toLowerCase().trim();
    const domain = userEmail.split('@')[1]; // '@' ke baad wala hissa

    if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
        Alert.alert(
          "🚨 ACCESS DENIED", 
          "Only verified coordinates (Gmail, Yahoo, Hotmail, iCloud) are permitted. Temporary or unverified domains are blocked."
        );
        return;
    }

    setLoading(true);
    try {
        const response = await axios.post(`${BACKEND_URL}/api/users/register`, {
            email: userEmail,
            phoneNumber: phone,
            password: password,
            name: name,
        });

        if (response.status === 201 || response.status === 200) {
            setSignupEmail(userEmail);
            setTimeout(() => {
                setIsVerifying(true);
            }, 150);
            Alert.alert("✅ DISPATCHED", "Security frequency sent to your mail.");
        }
    } catch (error: any) {
        Alert.alert("🚨 ERROR", error.response?.data?.message || "Registration failed.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <View style={styles.masterWrapper}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#0F011A', '#05000a', '#001A1D']} style={StyleSheet.absoluteFill}/>

      <Animated.View style={[styles.bubblingOrb, { top: '2%', right: '-10%', backgroundColor: '#00F0FF10', transform: [{ scale: floatAnim.interpolate({inputRange: [0, 1], outputRange: [1, 1.2]}) }] }]} />
      <Animated.View style={[styles.bubblingOrb, { bottom: '5%', left: '-10%', backgroundColor: '#FF00FF08', transform: [{ scale: floatAnim.interpolate({inputRange: [0, 1], outputRange: [1.2, 1]}) }] }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
              <ArrowLeft color="#00F0FF" size={24} />
            </TouchableOpacity>

            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.logoContainer}>
                <GradientText style={styles.logoTextCustom}>NE</GradientText>
                <GeometricX />
                <GradientText style={styles.logoTextCustom}>ORA</GradientText>
              </View>
              <Text style={styles.signupSubtitle}>ESTABLISH YOUR PRESENCE</Text>
            </Animated.View>

            <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
              <View style={styles.sexyCard}>
                <Text style={styles.inputLabel}>CITIZEN IDENTITY</Text>
                <View style={styles.glassInputWrapper}>
                  <View style={styles.iconCircle}><User color={'#00F0FF'} size={18} /></View>
                  <TextInput placeholder="FULL NAME" placeholderTextColor="rgba(255,255,255,0.2)" style={styles.input} value={name} onChangeText={setName} selectionColor="#00F0FF" />
                </View>

                <Text style={styles.inputLabel}>SECURE FREQUENCY</Text>
                <View style={styles.customPhoneWrapper}>
                  <View style={styles.countryBadge}>
                    <Text style={styles.flagStyle}>{countryFlag}</Text>
                    <Text style={styles.codeStyle}>{countryCode}</Text>
                  </View>
                  <TextInput 
                    placeholder="03XXXXXXXXX" 
                    placeholderTextColor="rgba(255,255,255,0.2)" 
                    style={styles.phoneInputMain} 
                    value={phone} 
                    onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))} 
                    keyboardType="numeric"
                    maxLength={11}
                    selectionColor="#00F0FF"
                  />
                </View>

                <Text style={styles.inputLabel}>DIGITAL COORDINATE</Text>
                <View style={styles.glassInputWrapper}>
                  <View style={styles.iconCircle}><Mail color={'#FF00FF'} size={18} /></View>
                  <TextInput placeholder="EMAIL ADDRESS" placeholderTextColor="rgba(255,255,255,0.2)" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" selectionColor="#FF00FF" />
                </View>

                <Text style={styles.inputLabel}>ENCRYPTION KEY</Text>
                <View style={styles.glassInputWrapper}>
                  <View style={styles.iconCircle}><Lock color={'#FFF'} size={18} /></View>
                  <TextInput placeholder="CREATE PASSWORD" placeholderTextColor="rgba(255,255,255,0.2)" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry selectionColor="#FFF" />
                </View>
              </View>

              <TouchableOpacity activeOpacity={0.9} onPress={handleSignup} style={styles.buttonShadow} disabled={loading}>
                <LinearGradient colors={['#FF00FF', '#7000FF', '#00F0FF']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.signupButton}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>INITIALIZE ACCOUNT</Text>}
                  <View style={styles.shieldCircle}><ShieldCheck color="#000" size={18} /></View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.footerLink} onPress={() => router.replace("/")} activeOpacity={0.7}>
                <Text style={styles.footerText}>ALREADY A MEMBER? <Text style={styles.loginText}>ENTER THE VAULT</Text></Text>
              </TouchableOpacity>
            </Animated.View>
             
            <RecoveryModal visible={isVerifying} onClose={() => setIsVerifying(false)} isSignupMode={true} signupEmail={signupEmail} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const xStyles = StyleSheet.create({
  xContainer: { width: 45, height: 55, marginHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
  leftArm: { position: 'absolute', width: 8, height: '100%', backgroundColor: '#00F0FF', transform: [{ rotate: '45deg' }], borderRadius: 5 },
  rightArm: { position: 'absolute', width: 8, height: '100%', backgroundColor: '#00F0FF', transform: [{ rotate: '-45deg' }], borderRadius: 5 },
  innerGlow: { position: 'absolute', width: 2, height: '80%', backgroundColor: '#FFF', transform: [{ rotate: '45deg' }], opacity: 0.5 },
  corePulse: { width: 6, height: 6, backgroundColor: '#FFF', borderRadius: 3, opacity: 0.6 }
});

const styles = StyleSheet.create({
  masterWrapper: { flex: 1, backgroundColor: '#020105' },
  bubblingOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  content: { flex: 1, paddingHorizontal: 30 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  header: { alignItems: 'center', marginBottom: 30 },
  signupSubtitle: { color: '#FF00FF', fontSize: 9, fontWeight: '900', letterSpacing: 3, marginTop: 10, opacity: 0.8 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoTextBase: { fontSize: 52, fontWeight: '900' },
  logoTextCustom: { letterSpacing: 2 },
  form: { width: '100%' },
  sexyCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 25, borderRadius: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 25 },
  inputLabel: { color: '#00F0FF', fontSize: 9, fontWeight: '900', letterSpacing: 3, marginBottom: 10, marginLeft: 5, opacity: 0.6 },
  glassInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, height: 70, marginBottom: 18, paddingHorizontal: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '600', marginLeft: 15 },
  
  customPhoneWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.04)', 
    borderRadius: 24, 
    height: 70, 
    marginBottom: 18, 
    paddingHorizontal: 15, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)' 
  },
  countryBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 15,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
    marginRight: 10
  },
  flagStyle: { fontSize: 18 },
  codeStyle: { color: '#00F0FF', fontWeight: '900', marginLeft: 5, fontSize: 14 },
  phoneInputMain: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '600' },

  buttonShadow: { marginTop: 5 },
  signupButton: { height: 70, borderRadius: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25 },
  buttonText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  shieldCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  footerLink: { marginTop: 35, marginBottom: 30, alignItems: 'center' },
  footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' },
  loginText: { color: '#FF00FF', fontWeight: '900' },
});