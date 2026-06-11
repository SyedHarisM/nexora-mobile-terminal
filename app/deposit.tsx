import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ArrowLeft, CheckCircle2, Wallet } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert,
  Keyboard,
  KeyboardAvoidingView, Platform,
  SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

export default function DepositScreen() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleDeposit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return Alert.alert("INVALID AMOUNT", "Please enter a valid deposit figure.");
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await axios.post("http://192.168.18.139:8080/api/accounts/deposit", 
        { amount: Number(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        setSuccess(true);
        setTimeout(() => {
          router.back();
        }, 2000);
      }
    } catch (error: any) {
      Alert.alert("DEPOSIT FAILED", error.response?.data?.message || "Server connection lost.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <CheckCircle2 color="#00FF41" size={80} />
          <Text style={styles.successTitle}>DEPOSIT INITIALIZED</Text>
          <Text style={styles.successSub}>Updating your ledger...</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft color="#FFF" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>ADD FUNDS</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Wallet color="#00F0FF" size={40} />
            </View>
            
            <Text style={styles.label}>ENTER AMOUNT (RS)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#333"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Funds will be added instantly to your Nexora account balance.</Text>
            </View>

            <View style={{ flex: 1 }} />

            <TouchableOpacity 
              style={[styles.depositBtn, loading && { opacity: 0.7 }]} 
              onPress={handleDeposit}
              disabled={loading}
            >
              <LinearGradient 
                colors={['#7000FF', '#FF00FF']} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 0 }} 
                style={styles.gradient}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>CONFIRM DEPOSIT</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020105' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  backBtn: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  content: { flex: 1, paddingHorizontal: 30, alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,240,255,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: 'rgba(0,240,255,0.1)' },
  label: { color: '#555', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 15 },
  input: { color: '#FFF', fontSize: 48, fontWeight: '900', textAlign: 'center', width: '100%', marginBottom: 20 },
  infoBox: { backgroundColor: '#080808', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#111', width: '100%' },
  infoText: { color: '#888', textAlign: 'center', fontSize: 13, lineHeight: 20 },
  depositBtn: { width: '100%', height: 65, borderRadius: 20, overflow: 'hidden', marginBottom: 10 },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  successTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 20 },
  successSub: { color: '#555', fontSize: 14, marginTop: 5 }
});