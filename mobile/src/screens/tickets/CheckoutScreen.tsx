import React, { useState, useRef, useCallback } from 'react';
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
import { ChevronLeft, CreditCard, Smartphone, ShieldCheck } from 'lucide-react-native';
import { ticketsService } from '../../services/ticketsService';
import { paymentsService } from '../../services/paymentsService';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';

const COLORS = {
  primary: '#000',
  accent: '#8B5CF6',
  accentLight: '#F3E8FF',
  surface: '#F9F9F9',
  border: '#E5E5E5',
  white: '#FFF',
  green: '#10B981',
  red: '#EF4444',
  textSecondary: '#666',
};

const PLATFORM_FEE_PERCENT = 5;
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120_000;

type PaymentMode = 'mpesa' | 'stripe';

interface CheckoutItem {
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export function CheckoutScreen({ navigation, route }: any) {
  const { eventId, event, items, subtotal } = route.params as {
    eventId: string;
    event: any;
    items: CheckoutItem[];
    subtotal: number;
  };

  const { user } = useAuthStore();

  const platformFee = Math.round(subtotal * PLATFORM_FEE_PERCENT) / 100;
  const total = subtotal + platformFee;

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollPaymentStatus = useCallback(
    (paymentId: string, orderId: string, startTime: number) => {
      if (Date.now() - startTime > POLL_TIMEOUT_MS) {
        cleanup();
        setLoading(false);
        Alert.alert(
          'Payment Pending',
          'We haven\'t received confirmation yet. Check your M-Pesa messages and try verifying from your tickets.',
          [
            { text: 'Go to Tickets', onPress: () => navigation.navigate('MainTabs', { screen: 'Tickets' }) },
            { text: 'OK' },
          ],
        );
        return;
      }

      pollTimerRef.current = setTimeout(async () => {
        try {
          const payment = await paymentsService.verifyPayment(paymentId);
          if (payment.paymentStatus === 'completed') {
            cleanup();
            setLoading(false);
            navigation.replace('Success', {
              orderId,
              order: payment.order,
              eventTitle: event?.title,
            });
            return;
          }
          if (payment.paymentStatus === 'failed') {
            cleanup();
            setLoading(false);
            Alert.alert('Payment Failed', payment.failureReason || 'The payment was not completed. Please try again.');
            return;
          }
        } catch {
          // Network blip — keep polling
        }
        pollPaymentStatus(paymentId, orderId, startTime);
      }, POLL_INTERVAL_MS);
    },
    [cleanup, navigation, event],
  );

  const handleMpesaPay = async () => {
    if (!phoneNumber.trim() || phoneNumber.length < 9) {
      Alert.alert('Error', 'Please enter a valid M-Pesa phone number');
      return;
    }

    const fullPhone = `254${phoneNumber}`;

    setLoading(true);
    setLoadingMessage('Creating your order...');

    try {
      const order = await ticketsService.purchaseTickets(
        eventId,
        items.map((i) => ({ ticketTypeId: i.ticketTypeId, quantity: i.quantity })),
        'mpesa',
        fullPhone,
      );

      setLoadingMessage('Sending STK Push to your phone...');

      const payment = await paymentsService.createMpesaPayment(order.id, fullPhone);

      setLoadingMessage('Waiting for M-Pesa confirmation...');
      pollPaymentStatus(payment.paymentId, order.id, Date.now());
    } catch (error: any) {
      setLoading(false);
      const msg = error.response?.data?.message || error.message || 'Payment failed. Please try again.';
      Alert.alert('Payment Error', msg);
    }
  };

  const handleStripePay = async () => {
    setLoading(true);
    setLoadingMessage('Creating your order...');

    try {
      const order = await ticketsService.purchaseTickets(
        eventId,
        items.map((i) => ({ ticketTypeId: i.ticketTypeId, quantity: i.quantity })),
        'stripe',
      );

      setLoadingMessage('Preparing card payment...');

      const payment = await paymentsService.createStripePayment(order.id);

      setLoading(false);
      // TODO: Present Stripe PaymentSheet using payment.clientSecret
      // once @stripe/stripe-react-native is installed.
      Alert.alert(
        'Card Payment',
        'Card payment integration is coming soon. Please use M-Pesa for now.',
        [{ text: 'OK' }],
      );
    } catch (error: any) {
      setLoading(false);
      const msg = error.response?.data?.message || error.message || 'Payment failed. Please try again.';
      Alert.alert('Payment Error', msg);
    }
  };

  const handlePay = () => {
    if (paymentMode === 'mpesa') {
      handleMpesaPay();
    } else {
      handleStripePay();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size={48} color={COLORS.accent} />
        <Text style={styles.loadingTitle}>
          {paymentMode === 'mpesa' ? 'Check your phone' : 'Processing...'}
        </Text>
        <Text style={styles.loadingSub}>{loadingMessage}</Text>
        {paymentMode === 'mpesa' && (
          <Text style={styles.loadingHint}>
            Enter your M-Pesa PIN to confirm{'\n'}payment of KES {total.toLocaleString()}
          </Text>
        )}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => {
            cleanup();
            setLoading(false);
          }}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ChevronLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Event Info */}
        {event && (
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
            {event.startDate && (
              <Text style={styles.eventDate}>
                {format(new Date(event.startDate), 'EEE, MMM d · h:mm a')}
              </Text>
            )}
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.card}>
            {items.map((item) => (
              <View key={item.ticketTypeId} style={styles.lineItem}>
                <Text style={styles.lineItemName}>
                  {item.quantity}× {item.ticketTypeName}
                </Text>
                <Text style={styles.lineItemPrice}>
                  KES {(item.unitPrice * item.quantity).toLocaleString()}
                </Text>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.lineItem}>
              <Text style={styles.subtotalLabel}>Subtotal</Text>
              <Text style={styles.subtotalValue}>KES {subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.lineItem}>
              <Text style={styles.feeLabel}>Service fee ({PLATFORM_FEE_PERCENT}%)</Text>
              <Text style={styles.feeValue}>KES {platformFee.toLocaleString()}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.lineItem}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>KES {total.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <TouchableOpacity
            style={[styles.payOption, paymentMode === 'mpesa' && styles.payOptionActive]}
            onPress={() => setPaymentMode('mpesa')}
            activeOpacity={0.8}
          >
            <View style={[styles.radio, paymentMode === 'mpesa' && styles.radioActive]}>
              {paymentMode === 'mpesa' && <View style={styles.radioInner} />}
            </View>
            <Smartphone color={paymentMode === 'mpesa' ? COLORS.accent : '#999'} size={20} />
            <View style={styles.payOptionText}>
              <Text style={[styles.payOptionTitle, paymentMode === 'mpesa' && styles.payOptionTitleActive]}>
                M-Pesa
              </Text>
              <Text style={styles.payOptionDesc}>Pay via Safaricom STK Push</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.payOption, paymentMode === 'stripe' && styles.payOptionActive]}
            onPress={() => setPaymentMode('stripe')}
            activeOpacity={0.8}
          >
            <View style={[styles.radio, paymentMode === 'stripe' && styles.radioActive]}>
              {paymentMode === 'stripe' && <View style={styles.radioInner} />}
            </View>
            <CreditCard color={paymentMode === 'stripe' ? COLORS.accent : '#999'} size={20} />
            <View style={styles.payOptionText}>
              <Text style={[styles.payOptionTitle, paymentMode === 'stripe' && styles.payOptionTitleActive]}>
                Card (Visa / Mastercard)
              </Text>
              <Text style={styles.payOptionDesc}>Pay with debit or credit card</Text>
            </View>
          </TouchableOpacity>

          {/* M-Pesa Phone Input */}
          {paymentMode === 'mpesa' && (
            <View style={styles.phoneInputContainer}>
              <Text style={styles.phoneLabel}>M-Pesa Phone Number</Text>
              <View style={styles.phoneRow}>
                <View style={styles.prefixBox}>
                  <Text style={styles.prefixText}>+254</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="7XX XXX XXX"
                  placeholderTextColor="#BBB"
                  keyboardType="phone-pad"
                  maxLength={9}
                  value={phoneNumber}
                  onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, '').slice(0, 9))}
                />
              </View>
            </View>
          )}
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <ShieldCheck color={COLORS.green} size={16} />
          <Text style={styles.securityText}>
            Your payment is secured and encrypted
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.payBtn} onPress={handlePay} activeOpacity={0.85}>
          <Text style={styles.payBtnText}>
            Pay KES {total.toLocaleString()}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { flex: 1, paddingHorizontal: 16 },

  eventInfo: { paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  eventTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  eventDate: { fontSize: 14, color: COLORS.textSecondary },

  section: { marginTop: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: COLORS.textSecondary, marginBottom: 12 },

  card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  lineItemName: { fontSize: 15, color: '#333', flex: 1 },
  lineItemPrice: { fontSize: 15, fontWeight: '600', color: '#333' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  subtotalLabel: { fontSize: 14, color: COLORS.textSecondary },
  subtotalValue: { fontSize: 14, color: COLORS.textSecondary },
  feeLabel: { fontSize: 14, color: COLORS.textSecondary },
  feeValue: { fontSize: 14, color: COLORS.textSecondary },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalValue: { fontSize: 16, fontWeight: '700' },

  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 10,
  },
  payOptionActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentLight },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: COLORS.accent },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
  payOptionText: { marginLeft: 8, flex: 1 },
  payOptionTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  payOptionTitleActive: { color: COLORS.primary },
  payOptionDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  phoneInputContainer: { marginTop: 8 },
  phoneLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },
  phoneRow: { flexDirection: 'row', alignItems: 'center' },
  prefixBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 14,
    height: 50,
    justifyContent: 'center',
  },
  prefixText: { fontSize: 16, fontWeight: '600', color: '#444' },
  phoneInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: COLORS.accent,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: COLORS.white,
  },

  securityNote: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 8 },
  securityText: { fontSize: 13, color: COLORS.green },

  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  payBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  payBtnText: { color: COLORS.white, fontSize: 17, fontWeight: '700' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: COLORS.white },
  loadingTitle: { fontSize: 22, fontWeight: '700', marginTop: 28, marginBottom: 8 },
  loadingSub: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },
  loadingHint: { fontSize: 14, color: COLORS.accent, textAlign: 'center', marginTop: 16, lineHeight: 20 },
  cancelBtn: { marginTop: 32, paddingVertical: 12, paddingHorizontal: 24 },
  cancelBtnText: { fontSize: 15, color: COLORS.red, fontWeight: '600' },
});
