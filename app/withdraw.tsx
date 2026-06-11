import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BACKEND_URL = "http://192.168.18.139:8080";

export default function WithdrawScreen() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("SECURITY BREACH", "Invalid amount. Vault requires a numeric value.");
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      // Backend Fix: Sending as JSON body to match your @RequestBody Map
      await axios.post(
        `${BACKEND_URL}/api/accounts/withdraw`,
        { amount: parseFloat(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert(
        "TRANSACTION VERIFIED", 
        "Assets successfully debited from your Nexora vault.", 
        [{ text: "TERMINATE", onPress: () => router.back() }]
      );
    } catch (error: any) {
      const msg = error.response?.data?.message || "Protocol Failure: Could not process withdrawal.";
      Alert.alert("VOID TRANSACTION", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0F011A', '#000000']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          
          {/* Custom Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#FF00FF" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>WITHDRAWAL</Text>
              <View style={styles.neonLine} />
            </View>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.content}>
            <BlurView intensity={10} tint="dark" style={styles.glassCard}>
              <MaterialCommunityIcons name="shield-key-outline" size={40} color="#FF00FF" style={{alignSelf: 'center', marginBottom: 20}} />
              
              <Text style={styles.label}>ENTER VAULT AMOUNT</Text>
              
              <View style={styles.inputBox}>
                <Text style={styles.currency}>RS.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="rgba(255, 0, 255, 0.2)"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus
                />
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.4)" />
                <Text style={styles.infoText}>256-bit Encrypted Transaction</Text>
              </View>
            </BlurView>

            <TouchableOpacity 
              style={[styles.withdrawBtn, loading && { opacity: 0.5 }]} 
              onPress={handleWithdraw}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={['#FF00FF', '#7000FF']} 
                start={{x: 0, y: 0}} 
                end={{x: 1, y: 0}} 
                style={styles.gradientBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.btnText}>EXECUTE WITHDRAWAL</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255, 0, 255, 0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 0, 255, 0.2)' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  neonLine: { height: 2, backgroundColor: '#FF00FF', width: '60%', marginTop: 2, shadowColor: '#FF00FF', shadowOpacity: 1, shadowRadius: 5, elevation: 5 },
  content: { flex: 1, paddingHorizontal: 25, justifyContent: 'center' },
  glassCard: { padding: 30, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', overflow: 'hidden', backgroundColor: 'rgba(255, 255, 255, 0.02)' },
  label: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center', marginBottom: 10 },
  inputBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 0, 255, 0.3)', paddingBottom: 10 },
  currency: { color: '#FF00FF', fontSize: 28, fontWeight: '900', marginRight: 10 },
  input: { color: '#FFF', fontSize: 48, fontWeight: '900', textAlign: 'center', width: '70%' },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  infoText: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginLeft: 5, fontWeight: '600' },
  withdrawBtn: { marginTop: 40, borderRadius: 15, overflow: 'hidden', height: 65, shadowColor: '#FF00FF', shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 2 }
});