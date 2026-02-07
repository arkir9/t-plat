import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Check, Ticket } from 'lucide-react-native';
import { ticketsService } from '../../services/ticketsService';
import { format } from 'date-fns';

const COLORS = { primary: '#000', accent: '#8B5CF6', success: '#10B981', white: '#FFF' };

export function SuccessScreen({ navigation, route }: any) {
  const { orderId, order } = route.params;
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    if (order?.tickets) {
      setTickets(order.tickets);
    } else if (orderId) {
      // Fetch tickets for the order
      loadTickets();
    }
  }, [orderId, order]);

  const loadTickets = async () => {
    try {
      const userTickets = await ticketsService.getMyTickets();
      // Filter tickets for this order
      if (orderId) {
        const orderTickets = userTickets.filter((t: any) => t.orderId === orderId);
        setTickets(orderTickets);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const handleViewTickets = () => {
    if (tickets.length > 0) {
      navigation.navigate('MyTicket', { ticketId: tickets[0].id });
    } else {
      navigation.navigate('MainTabs', { screen: 'Tickets' });
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20, minHeight: '100%' }]}>
      <View style={styles.successCircle}>
        <Check color="#FFF" size={48} strokeWidth={3} />
      </View>
      <Text style={styles.successTitle}>You're going!</Text>
      <Text style={styles.successSub}>Tickets sent to your email.</Text>
      
      {order && (
        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>Order Number</Text>
          <Text style={styles.orderNumber}>{order.orderNumber || orderId}</Text>
          {tickets.length > 0 && (
            <View style={styles.ticketCount}>
              <Ticket size={16} color={COLORS.accent} />
              <Text style={styles.ticketCountText}>{tickets.length} ticket{tickets.length > 1 ? 's' : ''} purchased</Text>
            </View>
          )}
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.primaryBtn, { width: '100%', marginTop: 40 }]}
        onPress={handleViewTickets}
      >
        <Text style={styles.btnText}>View {tickets.length > 1 ? 'Tickets' : 'Ticket'}</Text>
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
  container: { flex: 1, backgroundColor: COLORS.white },
  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  successSub: { color: '#666', fontSize: 16 },
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 30, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  orderInfo: { marginTop: 24, padding: 16, backgroundColor: '#F9F9F9', borderRadius: 12, width: '100%', alignItems: 'center' },
  orderLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  orderNumber: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  ticketCount: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  ticketCountText: { fontSize: 14, color: COLORS.accent, fontWeight: '600' },
  secondaryBtn: { marginTop: 16, paddingVertical: 12 },
  secondaryBtnText: { color: '#666', fontSize: 14 },
});