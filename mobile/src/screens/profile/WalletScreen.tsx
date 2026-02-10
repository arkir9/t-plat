import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { walletService, WalletTransaction } from '../../services/walletService';

const COLORS = {
  primary: '#000000',
  accent: '#8B5CF6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#1A1A1A',
  success: '#10B981',
  danger: '#EF4444',
  textSecondary: '#666666',
  white: '#FFFFFF'
};

export function WalletScreen({ navigation }: any) {
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('KES');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const balRes = await walletService.getBalance();
      const txRes = await walletService.getTransactions();
      setBalance(Number(balRes.balance));
      setCurrency(balRes.currency);
      setTransactions(txRes);
    } catch (err: any) {
      console.log('Error loading wallet data:', err);
      const message =
        err?.response?.data?.message ||
        'Unable to load your wallet right now. Please pull to refresh in a moment.';
      setError(message);
      Alert.alert('Wallet', message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) return Alert.alert('Error', 'Invalid amount');
    if (amount > balance) return Alert.alert('Error', 'Insufficient funds');
    if (!withdrawPhone || withdrawPhone.length < 9) return Alert.alert('Error', 'Invalid phone number');

    setIsWithdrawing(true);
    try {
      await walletService.withdraw(amount, withdrawPhone);
      Alert.alert('Success', 'Withdrawal initiated. Funds will be sent to your phone shortly.');
      setWithdrawAmount('');
      loadData(); 
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Withdrawal failed');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const renderTransaction = ({ item }: { item: WalletTransaction }) => {
    const isCredit = item.amount > 0;
    return (
      <View style={styles.txItem}>
        <View style={[styles.iconBox, { backgroundColor: isCredit ? '#DCFCE7' : '#FEE2E2' }]}>
          {isCredit ? (
             <ArrowDownLeft size={20} color={COLORS.success} />
          ) : (
             <ArrowUpRight size={20} color={COLORS.danger} />
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.txTitle}>
             {isCredit ? 'Revenue (Ticket Sales)' : 'Withdrawal'}
          </Text>
          <Text style={styles.txDate}>{new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
        </View>
        <Text style={[styles.txAmount, { color: isCredit ? COLORS.success : COLORS.text }]}>
          {isCredit ? '+' : ''}{item.amount} {currency}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Withdrawable Balance</Text>
          <Text style={styles.balanceValue}>{currency} {balance.toLocaleString()}</Text>
          <Text style={styles.balanceSub}>Earnings from Verified Sales</Text>
        </View>

        {/* Withdrawal Form */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Withdraw to M-Pesa</Text>
          <View style={styles.inputRow}>
             <TextInput 
                style={[styles.input, { flex: 2 }]} 
                placeholder="Phone (254...)" 
                keyboardType="phone-pad"
                value={withdrawPhone}
                onChangeText={setWithdrawPhone}
             />
             <TextInput 
                style={[styles.input, { flex: 1 }]} 
                placeholder="Amount" 
                keyboardType="numeric"
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
             />
          </View>
          <TouchableOpacity 
             style={[styles.withdrawBtn, { opacity: (isWithdrawing || balance <= 0) ? 0.7 : 1 }]}
             onPress={handleWithdraw}
             disabled={isWithdrawing || balance <= 0}
          >
             {isWithdrawing ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Withdraw Funds</Text>}
          </TouchableOpacity>
        </View>

        {/* History */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {error && (
          <Text style={{ color: COLORS.danger, marginBottom: 8, fontSize: 13 }}>
            {error}
          </Text>
        )}
        {loading && transactions.length === 0 ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator color={COLORS.accent} />
          </View>
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>
                No transactions yet
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 16 },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  balanceValue: { color: 'white', fontSize: 36, fontWeight: 'bold', marginVertical: 8 },
  balanceSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  
  actionSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: COLORS.text },
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  input: {
      backgroundColor: COLORS.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: COLORS.text
  },
  withdrawBtn: {
      backgroundColor: COLORS.accent,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
  },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  txItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.surface },
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  txTitle: { fontWeight: '600', fontSize: 15, color: COLORS.text },
  txDate: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  txAmount: { fontWeight: 'bold', fontSize: 15 },
});