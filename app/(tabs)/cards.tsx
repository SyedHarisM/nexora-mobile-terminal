import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Eye,
  Globe,
  Layers,
  Lock,
  Settings2,
  ShieldAlert,
  Unlock,
  Zap
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
const { width } = Dimensions.get('window');

// IP CONFIGURATION
const API_BASE_URL = 'http://192.168.18.139:8080/api/v1/cards';

export default function CardsScreen() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardData, setCardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const spin = useSharedValue(0);

  // SEXY MODALS VISIBILITY STATES
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [freezeConfirmVisible, setFreezeConfirmVisible] = useState(false);

  // WORKING STATES
  const [dailyLimit, setDailyLimit] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const currencies = [
    { code: 'USD', symbol: '$', name: 'CORE US TOKEN' },
    { code: 'EUR', symbol: '€', name: 'EURO NET' },
    { code: 'GBP', symbol: '£', name: 'BRITISH QUANTUM' },
    { code: 'PKR', symbol: '₨', name: 'PAK RUPEE MATRIX' }
  ];

  // FETCH CARD DATA
  const fetchCard = async () => {
    try {
      const storedName = await AsyncStorage.getItem('user_name'); 
      if (storedName) {
        const response = await fetch(`${API_BASE_URL}/details/${storedName}`);
        const data = await response.json();
        if (response.ok) {
          setCardData(data);
        }
      } else {
        console.log("No logged-in user found in storage");
      }
    } catch (error) {
      console.error("Card fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
    const loadLocalSettings = async () => {
      try {
        // Saved settings phone se read kar rahe hain
        const savedLimit = await AsyncStorage.getItem('card_daily_limit');
        const savedCurrency = await AsyncStorage.getItem('wallet_selected_currency');
        
        if (savedLimit) {
          setDailyLimit(savedLimit);
        }
        if (savedCurrency) {
          setSelectedCurrency(savedCurrency);
        }
      } catch (error) {
        console.error("Error loading local settings:", error);
      }
    };

    fetchCard();
    loadLocalSettings();
  }, []);

  // CONFIRM FREEZE PROMPT ACTION
  const triggerFreezePrompt = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setFreezeConfirmVisible(true);
  };

  // ACTUAL FREEZE/UNFREEZE EXECUTION
  const handleFreezeToggle = async () => {
    setFreezeConfirmVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (cardData) {
      setCardData({ ...cardData, frozen: !cardData.frozen });
    }
  };

  // REVEAL WITH FACEID PERMISSION LOCK
  const handleRevealAuth = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Check hardware biometrics
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'NEXORA BIOMETRIC VALIDATION',
        fallbackLabel: 'USE ACCESS PIN',
      });

      if (!auth.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        console.log("Biometric verification failed.");
        return; // Flip restricted if biometric cancels
      }
    }

    // Biometric verified or fallback complete -> Trigger Animation
    executeCardFlip();
  };

  const executeCardFlip = () => {
    const nextState = !isFlipped;
    setIsFlipped(nextState);
    spin.value = withTiming(nextState ? 180 : 0, { duration: 500 });
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const spinVal = interpolate(spin.value, [0, 180], [0, 180]);
    return {
      transform: [{ rotateY: `${spinVal}deg` }],
      zIndex: spin.value > 90 ? 0 : 1,
      opacity: spin.value > 90 ? 0 : 1,
    };
  });

const backAnimatedStyle = useAnimatedStyle(() => {
    const spinVal = interpolate(spin.value, [0, 180], [180, 360]);
    return {
      transform: [{ rotateY: `${spinVal}deg` }],
      zIndex: spin.value > 90 ? 1 : 0, // Fixed here
      opacity: spin.value > 90 ? 1 : 0,
    };
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7000FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient 
          colors={['#05010A', '#02050A', '#000']} 
          style={{ flex: 1 }} 
        />
        <View style={styles.ambientStreak1} />
        <View style={styles.ambientStreak2} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>NEXUS <Text style={{color: '#00F0FF'}}>PRIME</Text></Text>
            <View style={styles.statusRow}>
               <View style={[styles.pulseDot, { backgroundColor: cardData?.frozen ? '#FF4B4B' : '#00FF41' }]} />
               <Text style={[styles.statusText, { color: cardData?.frozen ? '#FF4B4B' : '#00FF41' }]}>
                 {cardData?.frozen ? 'TERMINAL LOCKED' : 'TERMINAL ACTIVE'}
               </Text>
            </View>
          </View>
          <BlurView intensity={20} tint="dark" style={styles.headerIcon}>
             <Layers color="#7000FF" size={20} />
          </BlurView>
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity activeOpacity={1} onPress={handleRevealAuth}>
            <View style={styles.cardWrapper}>
              
              {/* FRONT SIDE */}
              <Animated.View style={[styles.cardSide, frontAnimatedStyle]}>
                <LinearGradient 
                  colors={cardData?.frozen ? ['#2A2A2A', '#4A4A4A', '#1A1A1A'] : ['#1A0B40', '#7000FF', '#FF007A']} 
                  style={styles.cardGradient}
                >
                  <View style={styles.cardTop}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Zap color="#00F0FF" size={20} fill="#00F0FF" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 }}>
                        NEX<Text style={{color: '#00F0FF'}}>ORA</Text>
                      </Text>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' }}>VIRTUAL</Text>
                  </View>

                  <View style={{ marginTop: 20 }}>
                    <Text style={{ 
                      color: '#FFF', 
                      fontSize: 17, 
                      fontWeight: '800', 
                      letterSpacing: 1.5,
                      opacity: 0.95
                    }}>
                      {cardData?.holderName?.toUpperCase() || 'NEXORA OPERATOR'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 5 }}>
                    <View>
                      <Text style={{ 
                        color: '#FFF', 
                        fontSize: 18, 
                        fontWeight: '700', 
                        letterSpacing: 2,
                        opacity: 0.8 
                      }}>
                        {cardData?.cardNumber ? `**** ${cardData.cardNumber.slice(-4)}` : '**** 0000'}
                      </Text>
                    </View>
                    <View style={{ marginRight: 10 }}>
                       <Text style={{ 
                         color: '#FFF', 
                         fontSize: 22, 
                         fontWeight: '900', 
                         fontStyle: 'italic'
                       }}>VISA</Text>
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* BACK SIDE */}
              <Animated.View style={[styles.cardSide, styles.cardBack, backAnimatedStyle]}>
                <LinearGradient 
                  colors={cardData?.frozen ? ['#2A2A2A', '#4A4A4A', '#1A1A1A'] : ['#1A0B40', '#7000FF', '#FF007A']} 
                  style={[styles.cardGradient, { padding: 25 }]} 
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Zap color="#00F0FF" size={18} fill="#00F0FF" />
                    <Text style={{ 
                      color: '#FFF', 
                      fontSize: 16, 
                      fontWeight: '900', 
                      marginLeft: 6,
                      letterSpacing: 1.5
                    }}>NEXORA</Text>
                  </View>

                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text 
                      numberOfLines={1} 
                      adjustsFontSizeToFit 
                      style={{ 
                        color: '#FFF', 
                        fontSize: 20, 
                        fontWeight: '700', 
                        letterSpacing: 2.5,
                        textAlign: 'center',
                        width: '100%'
                      }}
                    >
                      {cardData?.cardNumber ? cardData.cardNumber.replace(/(\d{4})/g, '$1 ').trim() : '0000 0000 0000 0000'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <View>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '800' }}>EXPIRY</Text>
                      <Text style={{ 
                        color: '#FFF', 
                        fontSize: 16, 
                        fontWeight: '700', 
                        marginTop: 5, 
                        letterSpacing: 1 
                      }}>
                        {cardData?.expiryDate || 'MM/YY'}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '800' }}>CVV</Text>
                      <Text style={{ 
                        color: '#FFF', 
                        fontSize: 16, 
                        fontWeight: '900', 
                        marginTop: 5, 
                        letterSpacing: 2
                      }}>
                        {cardData?.cvv || '798'}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>

            </View>
          </TouchableOpacity>
          <View style={[styles.cardShadow, { backgroundColor: cardData?.frozen ? '#444' : '#7000FF' }]} />
        </View>

        <Text style={styles.sectionLabel}>SYSTEM CONTROLS</Text>
        <View style={styles.grid}>
          <ControlTile 
            icon={cardData?.frozen ? <Unlock color="#00FF41" size={24} /> : <Lock color="#FF4B4B" size={24} />} 
            title={cardData?.frozen ? "UNFREEZE" : "FREEZE"} 
            color={cardData?.frozen ? "#00FF41" : "#FF4B4B"} 
            onPress={triggerFreezePrompt}
          />
          <ControlTile 
            icon={isFlipped ? <ChevronRight color="#00F0FF" size={24} /> : <Eye color="#00F0FF" size={24} />} 
            title={isFlipped ? "FRONT" : "REVEAL"} 
            color="#00F0FF" 
            onPress={handleRevealAuth}
          />
          <ControlTile icon={<ShieldAlert color="#FAFF00" size={24} />} onPress={() => setLimitModalVisible(true)} title="LIMITS" color="#FAFF00" />
          <ControlTile icon={<Settings2 color="#7000FF" size={24} />} onPress={() => setConfigModalVisible(true)} title="CONFIG" color="#7000FF" />
        </View>

        <BlurView intensity={10} tint="dark" style={styles.securityPanel}>
           <Activity color={cardData?.frozen ? "#FF4B4B" : "#00FF41"} size={16} />
           <Text style={[styles.securityText, { color: cardData?.frozen ? "#FF4B4B" : "#00FF41" }]}>
             {cardData?.frozen ? 'PROTOCOL: CARD ACCESS RESTRICTED' : 'PROTOCOL ACTIVE: SECURE QUANTUM ENCRYPTION'}
           </Text>
        </BlurView>

        {/* ================================== SEXY ULTRA LIMITS MODAL ================================== */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={limitModalVisible}
          onRequestClose={() => setLimitModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={40} tint="dark" style={styles.sexyBlurContainer}>
              <View style={[styles.modalContent, { borderColor: '#FAFF00' }]}>
                <View style={styles.glowIndicatorYellow} />
                <View style={styles.modalHeaderRow}>
                  <ShieldAlert color="#FAFF00" size={20} />
                  <Text style={styles.modalTitle}>LIMIT CONFIG</Text>
                </View>
                
                <Text style={styles.inputLabel}>DAILY SPENDING THRESHOLD ($)</Text>
                <TextInput
                  style={[styles.modalInput, { borderColor: 'rgba(250, 255, 0, 0.2)' }]}
                  placeholder="ENTER AMOUNT"
                  placeholderTextColor="rgba(255,255,255,0.15)"
                  keyboardType="numeric"
                  value={dailyLimit}
                  onChangeText={setDailyLimit}
                />

                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity style={styles.sexyCancelBtn} onPress={() => setLimitModalVisible(false)}>
                    <Text style={styles.btnText}>DISMISS</Text>
                  </TouchableOpacity>
                 <TouchableOpacity 
  style={[styles.sexySaveBtn, { backgroundColor: '#FAFF00' }]} 
  onPress={async () => {
    if (!dailyLimit) {
      setLimitModalVisible(false);
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Local phone memory mein store kar rahe hain
      await AsyncStorage.setItem('card_daily_limit', dailyLimit);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Local UI state ko foran update kar rahe hain
      setCardData({ ...cardData, dailyLimit: parseFloat(dailyLimit) });
      
    } catch (error) {
      console.error("Failed to save limit locally:", error);
    } finally {
      setLimitModalVisible(false);
    }
  }}
>
  <Text style={[styles.btnText, { color: '#000', fontWeight: '900' }]}>INITIALIZE</Text>
</TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </View>
        </Modal>

        {/* ================================== SEXY ULTRA CONFIG MODAL (CURRENCY MATRIX) ================================== */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={configModalVisible}
          onRequestClose={() => setConfigModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={40} tint="dark" style={styles.sexyBlurContainer}>
              <View style={[styles.modalContent, { borderColor: '#7000FF' }]}>
                <View style={styles.glowIndicatorPurple} />
                <View style={styles.modalHeaderRow}>
                  <Globe color="#7000FF" size={20} />
                  <Text style={[styles.modalTitle, { color: '#7000FF' }]}>CORE TOKENS</Text>
                </View>
                
                <Text style={styles.inputLabel}>SELECT OPERATING NETWORK CURRENCY</Text>
                
                {/* CYBERPUNK CHIPS GRID PICKER */}
                <View style={styles.currencyGrid}>
                  {currencies.map((curr) => {
                    const isSelected = selectedCurrency === curr.code;
                    return (
                      <TouchableOpacity
                        key={curr.code}
                        activeOpacity={0.8}
                        style={[
                          styles.currencyNode,
                          isSelected && styles.currencyNodeSelected
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedCurrency(curr.code);
                        }}
                      >
                        <Text style={[styles.nodeSymbol, isSelected && { color: '#00F0FF' }]}>{curr.symbol}</Text>
                        <View style={{ marginLeft: 10 }}>
                          <Text style={styles.nodeCode}>{curr.code}</Text>
                          <Text style={styles.nodeName}>{curr.name}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity style={styles.sexyCancelBtn} onPress={() => setConfigModalVisible(false)}>
                    <Text style={styles.btnText}>ABORT</Text>
                  </TouchableOpacity>
                <TouchableOpacity 
  style={[styles.sexySaveBtn, { backgroundColor: '#7000FF' }]} 
  onPress={async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Selected currency code ko phone memory mein bind kar rahe hain
      await AsyncStorage.setItem('wallet_selected_currency', selectedCurrency);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Local state mein card data ke currency display ko sync kar rahe hain
      if (cardData) {
        setCardData({ ...cardData, preferredCurrency: selectedCurrency });
      }
    } catch (error) {
      console.error("Failed to bind currency matrix:", error);
    } finally {
      setConfigModalVisible(false);
    }
  }}
>
  <Text style={styles.btnText}>BIND MATRIX</Text>
</TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </View>
        </Modal>

        {/* ================================== FUNKY TERMINAL FREEZE CONFIRM PROMPT ================================== */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={freezeConfirmVisible}
          onRequestClose={() => setFreezeConfirmVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={50} tint="dark" style={styles.sexyBlurContainer}>
              <View style={[styles.modalContent, { borderColor: '#FF4B4B', width: '80%' }]}>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#FF4B4B' }} />
                <View style={{ alignItems: 'center', marginBottom: 15 }}>
                  <AlertTriangle color="#FF4B4B" size={32} />
                  <Text style={[styles.modalTitle, { color: '#FF4B4B', marginTop: 10, marginBottom: 5 }]}>CRITICAL COMMAND</Text>
                  <Text style={styles.funkyPromptText}>
                    {cardData?.frozen ? 'EXECUTE OVERRIDE TO ACTIVATE TERMINAL CORE?' : 'HALT ALL CHIP OPS AND INITIATE CARD-FREEZE?'}
                  </Text>
                </View>

                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity style={styles.sexyCancelBtn} onPress={() => setFreezeConfirmVisible(false)}>
                    <Text style={styles.btnText}>NEGATE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.sexySaveBtn, { backgroundColor: '#FF4B4B' }]} 
                    onPress={handleFreezeToggle}
                  >
                    <Text style={[styles.btnText, { fontWeight: '900' }]}>EXECUTE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </View>
        </Modal>

      </ScrollView>
    </View>
  );
}

const ControlTile = ({ icon, title, color, onPress }: any) => (
  <TouchableOpacity style={styles.tile} activeOpacity={0.8} onPress={onPress}>
    <BlurView intensity={20} tint="dark" style={styles.tileBlur}>
      <View style={[styles.tileIcon, { borderColor: `${color}44`, backgroundColor: `${color}10` }]}>
        {icon}
      </View>
      <Text style={[styles.tileTitle, { color: color }]}>{title}</Text>
    </BlurView>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  ambientStreak1: { position: 'absolute', top: '15%', right: -100, width: 400, height: 200, backgroundColor: '#7000FF', opacity: 0.08, transform: [{ rotate: '45deg' }], borderRadius: 100 },
  ambientStreak2: { position: 'absolute', bottom: '10%', left: -100, width: 400, height: 200, backgroundColor: '#00F0FF', opacity: 0.08, transform: [{ rotate: '-45deg' }], borderRadius: 100 },
  header: { marginTop: 60, paddingHorizontal: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 35 },
  headerTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8, shadowRadius: 4, shadowOpacity: 1 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  headerIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cardContainer: { paddingHorizontal: 25, height: 235, marginBottom: 50 },
  cardWrapper: { width: '100%', height: '100%' },
  cardSide: { width: '100%', height: '100%', position: 'absolute', backfaceVisibility: 'hidden' },
  cardBack: { transform: [{ rotateY: '180deg' }] },
  cardGradient: { flex: 1, borderRadius: 28, padding: 28, justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  virtualText: { color: '#FFF', fontSize: 12, fontWeight: '800', opacity: 0.9, letterSpacing: 1 },
  cardMiddle: { marginVertical: 15 },
  holderName: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardDigits: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  visaLogo: { color: '#FFF', fontSize: 30, fontWeight: '900', fontStyle: 'italic' },
  blackStrip: { width: '125%', height: 50, backgroundColor: 'rgba(0,0,0,0.8)', alignSelf: 'center', marginTop: 10 },
  detailsBox: { marginTop: 20 },
  detailItem: { marginBottom: 18 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', marginBottom: 5 },
  detailVal: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1.5 },
  chipBack: { position: 'absolute', bottom: 25, right: 25, opacity: 0.5 },
  cardShadow: { position: 'absolute', width: '85%', height: '70%', alignSelf: 'center', bottom: -10, opacity: 0.2, borderRadius: 40, zIndex: -1 },
  sectionLabel: { color: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: '900', letterSpacing: 3, paddingHorizontal: 25, marginBottom: 20 },
  grid: { paddingHorizontal: 25, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { width: '47%', height: 115, marginBottom: 20 },
  tileBlur: { flex: 1, borderRadius: 25, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tileIcon: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1.5 },
  tileTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  securityPanel: { marginHorizontal: 25, flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(0, 255, 65, 0.1)', marginTop: 10 },
  securityText: { fontSize: 8, fontWeight: '800', marginLeft: 12, letterSpacing: 0.5 },
  
  // SEXY CYBERPUNK MODAL OVERLAYS & CONTAINER STYLING
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sexyBlurContainer: {
    width: '88%',
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'rgba(10, 4, 18, 0.92)',
    padding: 24,
    borderWidth: 1.5,
    alignItems: 'stretch',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: '#FAFF00',
    marginLeft: 10,
    textAlign: 'center',
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 10,
    textAlign: 'center'
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    color: '#00F0FF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 24,
    textAlign: 'center',
    shadowColor: '#00F0FF',
    shadowRadius: 5,
    shadowOpacity: 0.1
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5
  },
  sexyCancelBtn: {
    flex: 0.46,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sexySaveBtn: {
    flex: 0.46,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },

  // GLOW LINES
  glowIndicatorYellow: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#FAFF00' },
  glowIndicatorPurple: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#7000FF' },

  // CURRENCY MATRIX STYLING
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  currencyNode: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  currencyNodeSelected: {
    borderColor: '#00F0FF',
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  nodeSymbol: {
    color: '#rgba(255,255,255,0.4)',
    fontSize: 20,
    fontWeight: '800',
  },
  nodeCode: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  nodeName: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 7,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // FUNKY FLASH MESSAGE PROMPT
  funkyPromptText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 18,
    paddingHorizontal: 10,
    opacity: 0.85
  }
});