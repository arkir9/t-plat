import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Check, Ticket } from 'lucide-react-native';
import { ticketsService } from '../../services/ticketsService';

const COLORS = { primary: '#000', accent: '#8B5CF6', success: '#10B981', white: '#FFF' };

export function SuccessScreen({ navigation, route }: any) {
  const { orderId, order, eventTitle } = route.params;
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    if (order?.tickets) {
      setTickets(order.tickets);
    } else if (orderId) {
      loadTickets();
    }
  }, [orderId, order]);

  const loadTickets = async () => {
    try {
      const userTickets = await ticketsService.getMyTickets();
      if (orderId) {
        const orderTickets = userTickets.filter((t: any) => t.orderId === orderId);
        setTickets(orderTickets);
      }
    } catch {
      // Tickets will load from the Tickets tab
    }
  };

  const handleViewTickets = () => {
    if (tickets.length > 0) {
      navigation.navigate('MainTabs', { screen: 'Tickets' });
    } else {
      navigation.navigate('MainTabs', { screen: 'Tickets' });
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.successCircle}>
        <Check color="#FFF" size={48} strokeWidth={3} />
      </View>

      <Text style={styles.successTitle}>You're going!</Text>
      <Text style={styles.successSub}>
        {eventTitle
          ? `Your tickets for ${eventTitle} have been confirmed.`
          : 'Your tickets have been confirmed.'}
      </Text>

      <View style={styles.orderInfo}>
        <Text style={styles.orderLabel}>Order Number</Text>
        <Text style={styles.orderNumber}>
          {order?.orderNumber || orderId?.slice(0, 8)?.toUpperCase() || '—'}
        </Text>
        {tickets.length > 0 && (
          <View style={styles.ticketCount}>
            <Ticket size={16} color={COLORS.accent} />
            <Text style={styles.ticketCountText}>
              {tickets.length} ticket{tickets.length > 1 ? 's' : ''} purchased
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleViewTickets}>
        <Text style={styles.btnText}>View My Tickets</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
      >
        <Text style={styles.secondaryBtnText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.white,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  successTitle: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  successSub: { color: '#666', fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
  orderInfo: {
    marginTop: 28,
    padding: 20,
    backgroundColor: '#F9F9F9',
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  orderLabel: { fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  orderNumber: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  ticketCount: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  ticketCountText: { fontSize: 14, color: COLORS.accent, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    marginTop: 36,
  },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  secondaryBtn: { marginTop: 16, paddingVertical: 12 },
  secondaryBtnText: { color: '#666', fontSize: 14, fontWeight: '500' },
});
