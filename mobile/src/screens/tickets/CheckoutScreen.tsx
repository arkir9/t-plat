import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { ChevronLeft, CreditCard, Smartphone } from 'lucide-react-native';
import { ticketsService } from '../../services/ticketsService';
import { paymentsService } from '../../services/paymentsService';
import { useAuthStore } from '../../store/authStore';

const COLORS = { primary: '#000', accent: '#8B5CF6', surface: '#F5F5F5', white: '#FFF' };

export function CheckoutScreen({ navigation, route }: any) {
  const { eventId, event, items, total } = route.params;
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  // For now we only support M-Pesa (Stripe/card can be added later)
  const [mode] = useState<'mpesa'>('mpesa');
  const [fullName, setFullName] = useState(user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handlePay = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your M-Pesa phone number');
      return;
    }

    setLoading(true);
    try {
      // Create order
      const order = await ticketsService.purchaseTickets(eventId, items, 'mpesa', phoneNumber);

      // Process payment via M-Pesa STK Push
      await paymentsService.createMpesaPayment(order.id, phoneNumber);

      // Show loading and give the user time to confirm on their phone.
      // In production, you would poll the verify endpoint or listen for push.
      setTimeout(() => {
        setLoading(false);
        navigation.replace('Success', { orderId: order.id, order });
      }, 5000);
    } catch (error: any) {
      setLoading(false);
      const errorMessage = error.response?.data?.message || error.message || 'Payment failed. Please try again.';
      Alert.alert('Payment Error', errorMessage);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={40} color={COLORS.accent} />
        <Text style={styles.loadingTitle}>Check your phone</Text>
        <Text style={styles.loadingSub}>Enter your M-Pesa PIN to confirm payment of KES {total.toLocaleString()}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.guestToggle}>
          <TouchableOpacity style={[styles.toggleOption, styles.toggleActive]}>
            <Text style={[styles.toggleText, { color: '#FFF' }]}>Guest Checkout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toggleOption}>
            <Text style={styles.toggleText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Contact Info</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#999"
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Payment Method</Text>

          <TouchableOpacity
            style={[styles.payMethod, styles.payMethodActive]}
            activeOpacity={0.9}
          >
            <View style={styles.radio}>
              <View style={styles.radioInner} />
            </View>
            <Smartphone color="#000" size={20} />
            <Text style={styles.payText}>M-Pesa (Safaricom)</Text>
          </TouchableOpacity>

          <View style={styles.mpesaInputBox}>
            <Text style={styles.prefix}>+254</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="7XX XXX XXX"
              keyboardType="phone-pad"
              autoFocus
              value={phoneNumber}
              onChangeText={(text) => {
                // Format phone number (remove non-digits, limit to 9 digits)
                const cleaned = text.replace(/\D/g, '').slice(0, 9);
                setPhoneNumber(cleaned);
              }}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: '#666' }}>Subtotal</Text>
          <Text style={{ fontWeight: 'bold' }}>KES {total.toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={handlePay}>
          <Text style={styles.btnText}>Pay KES {total.toLocaleString()}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 16 },
  guestToggle: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 8, padding: 4, marginBottom: 24 },
  toggleOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleText: { fontWeight: '600' },
  section: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 16 },
  payMethod: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 12, marginBottom: 12 },
  payMethodActive: { borderColor: COLORS.accent, backgroundColor: '#F3E8FF' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#000', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  payText: { marginLeft: 12, fontWeight: '600', fontSize: 16 },
  mpesaInputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 16, marginBottom: 16, marginTop: -4 },
  prefix: { fontSize: 16, fontWeight: '600', marginRight: 8 },
  phoneInput: { flex: 1, height: 50, fontSize: 16 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 30, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 24, marginBottom: 8 },
  loadingSub: { textAlign: 'center', color: '#666' },
});