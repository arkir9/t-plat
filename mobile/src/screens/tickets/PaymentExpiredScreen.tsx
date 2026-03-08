/**
 * PaymentExpiredScreen
 *
 * NEW SCREEN — replaces the Alert.alert that fired on M-Pesa STK push timeout.
 *
 * Why: Alerts get dismissed accidentally at loud venues. Users close them and
 * assume something is wrong with their M-Pesa account, then never return.
 * This screen:
 *   1. Makes it unmistakably clear what happened (not a payment failure)
 *   2. Shows which phone number the request was sent to
 *   3. Provides one decisive action: Try Again
 *   4. Gives an escape hatch: Check My Tickets (in case it actually went through)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, RefreshCw, Ticket } from 'lucide-react-native';
import { paymentsService } from '../../services/paymentsService';

const COLORS = {
  accent: '#8B5CF6',
  amber: '#F59E0B',
  amberLight: '#FFFBEB',
  amberBorder: '#FDE68A',
  red: '#EF4444',
  green: '#10B981',
  white: '#FFF',
  surface: '#F9F9F9',
  text: '#111',
  textSecondary: '#666',
  border: '#E5E5E5',
};

export function PaymentExpiredScreen({ navigation, route }: any) {
  const params = route?.params ?? {};
  const {
    phoneNumber,    // full number e.g. "254712345678"
    paymentId,
    orderId,
    eventTitle,
    eventId,
    event,
    items,
    subtotal,
  } = params;

  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'found' | 'not_found' | null>(null);

  const displayPhone = phoneNumber
    ? phoneNumber.replace(/^254/, '+254 ').replace(/(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3')
    : 'your phone';

  /**
   * "Check My Tickets" — poll once to see if payment actually completed
   * despite the timeout (race condition where STK completed at 119s)
   */
  const handleCheckTickets = async () => {
    if (!paymentId) {
      setCheckResult('not_found');
      return;
    }
    setChecking(true);
    try {
      const payment = await paymentsService.verifyPayment(paymentId);
      if (payment.paymentStatus === 'completed') {
        setCheckResult('found');
        setTimeout(() => {
          navigation.navigate('MainTabs', { screen: 'Tickets' });
        }, 1800);
      } else {
        setCheckResult('not_found');
      }
    } catch {
      setCheckResult('not_found');
    } finally {
      setChecking(false);
    }
  };

  const handleTryAgain = () => {
    // Go back to checkout with same params so user doesn't re-select tickets
    if (eventId && items && subtotal != null) {
      navigation.replace('Checkout', {
        eventId,
        event,
        items,
        subtotal,
      });
    } else {
      // Fallback: go to home if params missing (shouldn't happen in normal flow)
      navigation.navigate('MainTabs', { screen: 'Home' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Clock size={40} color={COLORS.amber} />
        </View>

        {/* Heading */}
        <Text style={styles.title}>Request Timed Out</Text>
        <Text style={styles.subtitle}>
          The M-Pesa request sent to{'\n'}
          <Text style={styles.phone}>{displayPhone}</Text>
          {'\n'}wasn't responded to in time.
        </Text>

        {/* Explanation box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            No money has been taken from your account. M-Pesa push requests expire after 2 minutes if not confirmed.
          </Text>
        </View>

        {/* Check result feedback */}
        {checkResult === 'found' && (
          <View style={styles.successBadge}>
            <Text style={styles.successBadgeText}>✓ Payment found — taking you to your tickets</Text>
          </View>
        )}
        {checkResult === 'not_found' && (
          <View style={styles.notFoundBadge}>
            <Text style={styles.notFoundBadgeText}>No completed payment found. Please try again.</Text>
          </View>
        )}

        {/* Primary CTA */}
        <TouchableOpacity style={styles.tryAgainBtn} onPress={handleTryAgain}>
          <RefreshCw size={18} color={COLORS.white} />
          <Text style={styles.tryAgainText}>Try Again</Text>
        </TouchableOpacity>

        {/* Secondary CTA */}
        <TouchableOpacity
          style={styles.checkBtn}
          onPress={handleCheckTickets}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator size="small" color={COLORS.accent} />
          ) : (
            <>
              <Ticket size={16} color={COLORS.accent} />
              <Text style={styles.checkBtnText}>Check My Tickets</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Tertiary — go home */}
        <TouchableOpacity
          style={styles.homeLink}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        >
          <Text style={styles.homeLinkText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 32,
  },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: COLORS.amberBorder,
  },

  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  phone: { fontWeight: '700', color: COLORS.text },

  infoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, textAlign: 'center' },

  successBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successBadgeText: { color: COLORS.green, fontWeight: '600', fontSize: 14 },

  notFoundBadge: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  notFoundBadgeText: { color: COLORS.red, fontWeight: '600', fontSize: 14 },

  tryAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tryAgainText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

  checkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkBtnText: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },

  homeLink: { paddingVertical: 12 },
  homeLinkText: { color: COLORS.textSecondary, fontSize: 14 },
});
