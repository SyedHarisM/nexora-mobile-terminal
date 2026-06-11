import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  ArrowDownLeft,
  Eye,
  EyeOff,
  FileX,
  Plus,
  Send,
  Wallet,
  Zap
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert, Animated, Easing, LayoutAnimation,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../_layout'; // Path sahi hai

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const BACKEND_URL = "http://192.168.18.139:8080"; 

export default function Dashboard() {
  // FIX: Destructure correctly with brackets
  const { signOut } = useAuth(); 
  
  const [showPrivacy, setShowPrivacy] = useState(true);
  const [account, setAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const spinValue = React.useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const router = useRouter();

useFocusEffect(
    useCallback(() => {
      console.log("Auto-refreshing Dashboard...");
      
      // Aapka function jo balance aur history refresh karta hai
      fetchHomeData(); 

    }, [])
  );
const handleLogout = async () => {
    console.log("DASHBOARD: Triggering Global SignOut...");
    await signOut(); // Yeh layout wala signOut call karega jo state null karega
  };

  const startSpin = () => {
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 800,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  const fetchHomeData = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        handleLogout();
        return;
      }

      const privMode = await SecureStore.getItemAsync('privacyMode');
      setShowPrivacy(privMode !== 'false');

      const headers = { Authorization: `Bearer ${token}` };
      const accountRes = await axios.get(`${BACKEND_URL}/api/accounts/my-account`, { headers });
      setAccount(accountRes.data);

      const transRes = await axios.get(`${BACKEND_URL}/api/accounts/transactions?page=0&size=10`, { headers });
      setTransactions(transRes.data);
    } catch (error: any) {
      if (error.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchHomeData(); }, []);

  const onRefresh = async () => {
    startSpin();
    setRefreshing(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await fetchHomeData();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setRefreshing(false);
    }
  };  

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const togglePrivacy = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newState = !showPrivacy;
    setShowPrivacy(newState);
    await SecureStore.setItemAsync('privacyMode', newState ? 'true' : 'false');
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleLogoutPress = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("TERMINATE SESSION?", "Ghost Operator, are you sure you want to go dark?", [
      { text: "STAY ACTIVE", style: "cancel" },
      { text: "GO DARK", onPress: handleLogout, style: "destructive" },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00F0FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={['#0F011A', '#020A12', '#000000']} style={{ flex: 1 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingTop: insets.top + 10, paddingBottom: 130 } 
        ]}
        showsVerticalScrollIndicator={false}
      >
<View style={styles.header}>
  <View>
    <View style={styles.statusRow}>
       <Text style={styles.welcomeText}>SECURE SESSION</Text>
       <Text style={styles.activeDot}> • </Text>
       <Text style={styles.activeText}>ACTIVE</Text>
    </View>
    <Text style={styles.userName}>
      {account?.user?.name ? account.user.name.toUpperCase() : "GHOST OPERATOR"}
    </Text>
  </View>
  
  {/* Naya Notification Icon (NEXUS Blue Theme) */}
  <TouchableOpacity 
    style={styles.neonProfile} 
    activeOpacity={0.7} 
    onPress={() => alert('SYSTEM: All protocols normal.')}
  >
     <Ionicons name="notifications-outline" size={20} color="#00F0FF" />
  </TouchableOpacity>
</View>

        <View style={styles.cardContainer}>
          <LinearGradient colors={['#7000FF', '#FF00FF']} style={styles.balanceCard}>
            <View style={styles.cardHeader}>
              <View style={styles.labelBadge}>
                <Wallet size={12} color="#000" />
                <Text style={styles.cardLabel}>CURRENT BALANCE</Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                <TouchableOpacity onPress={onRefresh} activeOpacity={0.6}>
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Ionicons name="refresh-outline" size={20} color="#000" />
                  </Animated.View>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={togglePrivacy} activeOpacity={0.6}>
                  {showPrivacy ? <Eye size={20} color="#000" /> : <EyeOff size={20} color="#000" />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 5 }}>
               <Text style={{ color: '#000', fontSize: 24, opacity: 0.8, fontWeight: '700' }}>RS. </Text>
               <Text style={[styles.balanceText, { opacity: refreshing ? 0.5 : 1 }]}>
                 {showPrivacy ? (account?.balance?.toLocaleString() || "0") : "••••••"}
               </Text>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.tagText}>
                {showPrivacy ? (account?.accountNumber || "NEX-0YO4AQ") : "NEX-ID-HIDDEN"}
              </Text>
              <View style={styles.innerChip}>
                <Text style={styles.innerChipText}>VERIFIED</Text>
              </View>
            </View>
          </LinearGradient>
          <View style={styles.cardShadow} />
        </View>

        <View style={styles.actionRow}>
          <FunkyButton icon={<Plus color="#00F0FF" size={24} />} label="DEPOSIT" border="#00F0FF" onPress={() => router.push('/deposit' as any)} />
          <FunkyButton icon={<Send color="#7000FF" size={24} />} label="TRANSFER" border="#7000FF" onPress={() => router.push('/transfer' as any)} />
          <FunkyButton icon={<ArrowDownLeft color="#FF00FF" size={24} />} label="WITHDRAW" border="#FF00FF"  onPress={() => router.push('/withdraw' as any)} />
          <FunkyButton icon={<Zap color="#FAFF00" size={24} />} label="HISTORY" border="#FAFF00"  onPress={() => router.push('/history' as any)} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
          <View style={styles.titleLine as any} />
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <BlurView intensity={5} tint="dark" style={styles.emptyBlur}>
              <FileX color="rgba(0, 240, 255, 0.2)" size={50} />
              <Text style={styles.noLogsText}>NO LOGS HERE</Text>
              <Text style={styles.noLogsSub}>The ledger is clean, Operator.</Text>
            </BlurView>
          </View>
        ) : (
          transactions.slice(0, 5).map((item: any, index: number) => {
            const isExpanded = expandedId === item.id;
            const itemKey = item.id ? `tran-${item.id}` : `tran-idx-${index}`;
            
            let statusLabel = "";
            let statusColor = "";
            let amountPrefix = "";
            let personName = "";

            switch (item.type) {
                case 'DEPOSIT':
                    statusLabel = "FUNDS DEPOSITED";
                    statusColor = "#00FF00";
                    amountPrefix = "+";
                    personName = "CORE INBOUND";
                    break;
                case 'WITHDRAW':
                    statusLabel = "ASSETS WITHDRAWN";
                    statusColor = "#FF4B4B";
                    amountPrefix = "-";
                    personName = "VAULT OUTBOUND";
                    break;
                case 'RECEIVED':
                    statusLabel = "PAYMENT RECEIVED";
                    statusColor = "#00FF00";
                    amountPrefix = "+";
                    personName = `FROM: ${item.senderEmail}`;
                    break;
                case 'SENT':
                    statusLabel = "PAYMENT SENT";
                    statusColor = "#FF4B4B";
                    amountPrefix = "-";
                    personName = `TO: ${item.receiverEmail}`;
                    break;
                default:
                    statusLabel = "TRANSACTION";
                    statusColor = "#FFF";
                    personName = "NEXORA OPERATOR";
            }

            return (
              <TouchableOpacity 
                key={itemKey} 
                activeOpacity={0.8} 
                onPress={() => toggleExpand(item.id)}
                style={[styles.transactionCard, isExpanded && styles.expandedCard]}
              >
                <View style={[styles.statusLine, { backgroundColor: statusColor }]} />
                <View style={styles.tranBody}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tranTitle, { color: statusColor }]}>{statusLabel}</Text>
                    <View style={styles.expandedContent}>
                        <Text style={styles.tranMeta}>{personName.toUpperCase()}</Text>
                        {isExpanded && (
                          <View style={{ marginTop: 4 }}>
                            <Text style={styles.tranMeta}>
                              {`TX_LOG: ${new Date(item.timestamp).toLocaleDateString()} | ${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </Text>
                          </View>
                        )}
                    </View>
                  </View>
                  <Text style={[styles.tranAmount, { color: statusColor }]}>
                    {showPrivacy ? `${amountPrefix} RS. ${item.amount}` : "••••"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {transactions.length > 5 && (
          <TouchableOpacity 
            style={styles.viewAllBtn} 
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/history'); 
            }}
          >
            <Text style={styles.viewAllText}>VIEW ALL ACTIVITY</Text>
          </TouchableOpacity>        
        )}
      </ScrollView>
    </View>
  );
}

// ... (Styles and FunkyButton remain same as provided)

const FunkyButton = ({ icon, label, border, onPress }: any) => (
  <TouchableOpacity style={styles.fButton} onPress={onPress} activeOpacity={0.7}>
    <BlurView intensity={12} tint="dark" style={[styles.fIconBox, { borderColor: `${border}33` }]}>{icon}</BlurView>
    <Text style={[styles.fLabel, { color: `${border}99` }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  viewAllBtn: { width: '100%', paddingVertical: 20, alignItems: 'center', justifyContent: 'center', marginTop: 5, borderTopWidth: 1, borderTopColor: '#111' },
  viewAllText: { color: '#00F0FF', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  scrollContent: { paddingHorizontal: 22 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 35 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  welcomeText: { color: 'rgba(0, 240, 255, 0.7)', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  activeDot: { color: '#00FF41', fontSize: 14, fontWeight: '900' },
  activeText: { color: '#00FF41', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  userName: { color: '#FFF', fontSize: 26, fontWeight: '900', marginTop: 2 },
  neonProfile: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#080808', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 75, 75, 0.3)' },
  cardContainer: { marginBottom: 35 },
  balanceCard: { padding: 28, borderRadius: 32, overflow: 'hidden' },
  cardShadow: { position: 'absolute', bottom: -10, left: '10%', width: '80%', height: 20, backgroundColor: '#7000FF', borderRadius: 40, opacity: 0.12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  labelBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  cardLabel: { color: '#000', fontSize: 9, fontWeight: '900', marginLeft: 6 },
  balanceText: { color: '#000', fontSize: 38, fontWeight: '900', letterSpacing: -1.5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25 },
  tagText: { color: '#000', fontSize: 13, fontWeight: '800', opacity: 0.6 },
  innerChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.15)' },
  innerChipText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  fButton: { alignItems: 'center', width: '22%' },
  fIconBox: { width: 62, height: 62, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, overflow: 'hidden' },
  fLabel: { fontSize: 9, fontWeight: '900', marginTop: 10, letterSpacing: 0.5 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  sectionTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '900', marginRight: 15 },
  titleLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  transactionCard: { flexDirection: 'row', minHeight: 85, marginBottom: 15, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.02)', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  expandedCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(0, 240, 255, 0.2)' },
  statusLine: { width: 5 },
  tranBody: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  tranTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  expandedContent: { marginTop: 4 },
  tranMeta: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700' },
  tranAmount: { fontSize: 15, fontWeight: '900' },
  emptyContainer: { paddingVertical: 40, alignItems: 'center' },
  emptyBlur: { padding: 30, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
  noLogsText: { color: 'rgba(0, 240, 255, 0.5)', fontSize: 14, fontWeight: '900', marginTop: 15, letterSpacing: 2 },
  noLogsSub: { color: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: '700', marginTop: 5 }
});