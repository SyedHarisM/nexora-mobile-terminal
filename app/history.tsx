import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BACKEND_URL = "http://192.168.18.139:8080";

export default function HistoryScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(true); // Shared Privacy State[cite: 2]

  const fetchAllData = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        router.back();
        return;
      }

      // Read Shared Privacy Mode from Dashboard Switch[cite: 2]
      const privMode = await SecureStore.getItemAsync('privacyMode');
      setShowPrivacy(privMode !== 'false');
      
      const headers = { Authorization: `Bearer ${token}` };
      const accountRes = await axios.get(`${BACKEND_URL}/api/accounts/my-account`, { headers });
      setAccount(accountRes.data);

      const res = await axios.get(`${BACKEND_URL}/api/accounts/transactions?page=0&size=100`, { headers });
      setTransactions(res.data);
    } catch (error) {
      console.error("History Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TRANSACTION LOGS</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00F0FF" />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchAllData();}} tintColor="#00F0FF" />}
        >
          {transactions.length === 0 ? (
            <View style={styles.emptyContainer}><Text style={styles.emptyText}>NO TRANSACTIONS YET</Text></View>
          ) : (
            transactions.map((item: any, index: number) => {
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
              }

              return (
                <View key={item.id || index.toString()} style={styles.historyCard}>
                  <View style={[styles.statusLine, { backgroundColor: statusColor }]} />
                  <View style={styles.cardBody}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.txType, { color: statusColor }]}>{statusLabel}</Text>
                      <Text style={styles.txMeta}>{personName.toUpperCase()}</Text>
                      <Text style={styles.txDate}>{new Date(item.timestamp).toLocaleString()}</Text>
                    </View>
                    {/* Synchronized Privacy logic applied here[cite: 2] */}
                    <Text style={[styles.txAmount, { color: statusColor }]}>
                      {showPrivacy ? `${amountPrefix} RS. ${item.amount}` : "••••"}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020105' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  backBtn: { padding: 10, backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#222' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  scrollContent: { padding: 20 },
  historyCard: { backgroundColor: '#0A0A0A', borderRadius: 15, marginBottom: 12, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: '#111' },
  statusLine: { width: 5 },
  cardBody: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  txType: { fontWeight: '900', fontSize: 13 },
  txMeta: { color: '#666', fontSize: 10, marginTop: 2, fontWeight: '700' },
  txDate: { color: '#444', fontSize: 9, marginTop: 4 },
  txAmount: { fontWeight: '900', fontSize: 16, marginLeft: 10 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#333', fontWeight: '900', letterSpacing: 2 }
});