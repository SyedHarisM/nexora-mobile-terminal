import axios from 'axios';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ArrowLeft, CheckCircle2, CreditCard, Send, ShieldCheck, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BACKEND_URL = "http://192.168.18.139:8080"; 

export default function TransferScreen() {
    const [value, setValue] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [recipientName, setRecipientName] = useState(''); 
    const [isVerifying, setIsVerifying] = useState(false);
    
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const mask = "XXXXXX"; 

    useEffect(() => {
        if (value.length === 6) {
            handleLookup(`NEX-${value}`);
        } else {
            setRecipientName('');
        }
    }, [value]);

    const handleLookup = async (fullId: string) => {
        setIsVerifying(true);
        try {
            const res = await axios.get(`${BACKEND_URL}/api/accounts/lookup/${fullId}`);
            setRecipientName(res.data);
        } catch (error) {
            setRecipientName('INVALID ACCOUNT ID');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleTransfer = async () => {
        if (value.length < 6 || !amount.trim() || recipientName === 'INVALID ACCOUNT ID') {
            Alert.alert("⚠️ SYSTEM ERROR", "Valid Recipient ID and Amount are required.");
            return;
        }

        const transferAmount = parseFloat(amount);
        if (isNaN(transferAmount) || transferAmount <= 0) {
            Alert.alert("⚠️ INVALID DATA", "Please enter a valid transaction amount.");
            return;
        }

        setIsLoading(true);

        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                router.replace('/');
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            const response = await axios.post(
                `${BACKEND_URL}/api/accounts/transfer`, 
                {
                    targetAccountNumber: `NEX-${value}`,
                    amount: transferAmount
                }, 
                { headers, timeout: 10000 }
            );

            if (response.status === 200 || response.status === 201) {
                Alert.alert(
                    "✅ TRANSACTION SUCCESSFUL", 
                    `RS. ${amount} has been securely transmitted to ${recipientName}.`,
                    [{ text: "ACKNOWLEDGE", onPress: () => router.back() }]
                );
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Transfer failed. Check balance or ID.";
            Alert.alert("❌ ACCESS DENIED", errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={['#0F011A', '#020A12', '#000000']} style={StyleSheet.absoluteFill} />

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} 
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView 
                        contentContainerStyle={{ flexGrow: 1 }}
                        bounces={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: 40 }]}>
                            
                            <View style={styles.header}>
                                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                                    <ArrowLeft color="#FFF" size={24} />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>SECURE TRANSFER</Text>
                                <View style={{ width: 45 }} /> 
                            </View>

                            <View style={styles.formContainer}>
                                <Text style={styles.inputLabel}>RECIPIENT NEX-ID</Text>
                                
                                <View style={styles.maskWrapper}>
                                    <User color="#7000FF" size={20} />
                                    
                                    <View style={styles.inputRow}>
                                        <Text style={styles.prefixText}>NEX-</Text>
                                        
                                        <View style={styles.inputStack}>
                                            <Text style={styles.placeholderLayer} pointerEvents="none">
                                                <Text style={{ color: 'transparent' }}>{value}</Text>
                                                {mask.slice(value.length)}
                                            </Text>

                                            <TextInput 
                                                style={styles.realInput}
                                                value={value}
                                                onChangeText={(text) => {
                                                    if (text.length <= 6) setValue(text.toUpperCase());
                                                }}
                                                maxLength={6}
                                                autoCapitalize="characters"
                                                selectionColor="#00F0FF"
                                                cursorColor="#00F0FF"
                                                editable={!isLoading}
                                            />
                                        </View>
                                    </View>
                                    {isVerifying && <ActivityIndicator size="small" color="#00F0FF" />}
                                </View>

                                {recipientName ? (
                                    <View style={styles.nameBadge}>
                                        <CheckCircle2 color={recipientName === 'INVALID ACCOUNT ID' ? '#FF4D4D' : '#00FF00'} size={14} />
                                        <Text style={[styles.nameText, { color: recipientName === 'INVALID ACCOUNT ID' ? '#FF4D4D' : '#00FF00' }]}>
                                            {recipientName}
                                        </Text>
                                    </View>
                                ) : null}

                                <Text style={[styles.inputLabel, { marginTop: 25 }]}>AMOUNT (RS)</Text>
                                <View style={styles.glassInput}>
                                    <CreditCard color="#FF00FF" size={20} />
                                    <TextInput 
                                        placeholder="0.00" 
                                        placeholderTextColor="rgba(255,255,255,0.1)"
                                        style={styles.amountInput}
                                        value={amount}
                                        onChangeText={setAmount}
                                        keyboardType="numeric"
                                        editable={!isLoading}
                                    />
                                </View>

                                <BlurView intensity={10} style={styles.infoBadge}>
                                    <ShieldCheck color="#00F0FF" size={16} />
                                    <Text style={styles.infoText}>Verified & encrypted transaction active.</Text>
                                </BlurView>

                                <TouchableOpacity 
                                    style={[styles.sendButtonContainer, (isLoading || (value.length === 6 && recipientName === 'INVALID ACCOUNT ID')) && { opacity: 0.6 }]} 
                                    activeOpacity={0.8}
                                    onPress={handleTransfer}
                                    disabled={isLoading || recipientName === 'INVALID ACCOUNT ID'}
                                >
                                    <LinearGradient 
                                        colors={['#7000FF', '#FF00FF']} 
                                        start={{x: 0, y: 0}} 
                                        end={{x: 1, y: 0}}
                                        style={styles.sendButton}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#FFF" />
                                        ) : (
                                            <>
                                                <Text style={styles.sendBtnText}>AUTHORIZE SEND</Text>
                                                <Send color="#FFF" size={20} />
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    content: { flex: 1, paddingHorizontal: 25 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
    backBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
    formContainer: { width: '100%', paddingVertical: 10 },
    inputLabel: { color: 'rgba(0, 240, 255, 0.7)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12, marginLeft: 5 },
    maskWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, height: 65, paddingHorizontal: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    inputRow: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 15 },
    prefixText: { fontSize: 18, fontWeight: '800', color: '#7000FF', letterSpacing: 1 },
    inputStack: { flex: 1, justifyContent: 'center' },
    placeholderLayer: { position: 'absolute', fontSize: 18, fontWeight: '800', color: 'rgba(255,255,255,0.1)', letterSpacing: 2 },
    realInput: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: 2, padding: 0, margin: 0 },
    nameBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 10 },
    nameText: { fontSize: 12, fontWeight: '800', marginLeft: 5, letterSpacing: 0.5 },
    glassInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, height: 65, paddingHorizontal: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    amountInput: { flex: 1, color: '#FFF', fontSize: 18, fontWeight: '700', marginLeft: 15 },
    infoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 240, 255, 0.05)', padding: 15, borderRadius: 15, marginTop: 25, marginBottom: 40, borderWidth: 0.5, borderColor: 'rgba(0, 240, 255, 0.2)' },
    infoText: { color: '#00F0FF', fontSize: 11, fontWeight: '700', marginLeft: 10, opacity: 0.8 },
    sendButtonContainer: { height: 65, borderRadius: 20, overflow: 'hidden', elevation: 10, shadowColor: '#7000FF', shadowOpacity: 0.5, shadowRadius: 15 },
    sendButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    sendBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 2, marginRight: 12 }
});