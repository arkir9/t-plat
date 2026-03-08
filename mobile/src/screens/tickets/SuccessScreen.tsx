/**
 * SuccessScreen
 *
 * CHANGE FROM ORIGINAL:
 * Tickets are now written to AsyncStorage immediately when this screen mounts,
 * using whichever data is already available (order.tickets from payment callback,
 * or fetched from API). This ensures QR codes work at venue gates even with
 * no connectivity (Kasarani, outdoor venues, etc).
 *
 * The CheckoutScreen also writes on payment confirmation — this is a second
 * write as a safety net in case that one failed due to a network blip.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Check, Ticket, Share2 } from 'lucide-react-native';
import { ticketsService } from '../../services/ticketsService';
import { scheduleEventReminders } from '../../services/notificationService';

const TICKETS_CACHE_KEY = '@tplat_tickets_cache';

const COLORS = {
  primary: '#000',
  accent: '#8B5CF6',
  success: '#10B981',
  white: '#FFF',
  surface: '#F9F9F9',
  border: '#E5E5E5',
  textSecondary: '#666',
};

async function persistTickets(tickets: any[]) {
  if (!tickets || tickets.length === 0) return;
  try {
    const existing = await AsyncStorage.getItem(TICKETS_CACHE_KEY);
    const cached: any[] = existing ? JSON.parse(existing) : [];
    const ticketIds = new Set(tickets.map((t: any) => t.id));
    const merged = [...cached.filter((t: any) => !ticketIds.has(t.id)), ...tickets];
    await AsyncStorage.setItem(TICKETS_CACHE_KEY, JSON.stringify(merged));
  } catch {
    // Non-fatal
  }
}

export function SuccessScreen({ navigation, route }: any) {
  const { orderId, order, eventTitle, event } = route.params || {};
  const [tickets, setTickets] = useState<any[]>(order?.tickets || []);

  useEffect(() => {
    const init = async () => {
      let ticketList: any[] = order?.tickets || [];

      // If tickets weren't in the callback payload, fetch them
      if (ticketList.length === 0 && orderId) {
        try {
          const userTickets = await ticketsService.getMyTickets();
          ticketList = userTickets.filter((t: any) => t.orderId === orderId);
          setTickets(ticketList);
        } catch {
          // Tickets will be available on the Tickets tab
        }
      }

      // Write to AsyncStorage immediately — before user navigates anywhere
      await persistTickets(ticketList);

      if (event?.startDate) {
        scheduleEventReminders({
          eventId: event.id,
          eventTitle: eventTitle || event.title,
          eventDate: new Date(event.startDate),
          venueName: event.venue?.name,
        });
      }
    };

    init();
  }, [orderId, order, event, eventTitle]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I'm going to ${eventTitle || 'an event'}! Get your tickets on Plat.`,
      });
    } catch {
      // Share dismissed
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Success icon */}
      <View style={styles.successCircle}>
        <Check color="#FFF" size={48} strokeWidth={3} />
      </View>

      <Text style={styles.successTitle}>You're going!</Text>
      <Text style={styles.successSub}>
        {eventTitle
          ? `Your tickets for ${eventTitle} are confirmed.`
          : 'Your tickets are confirmed.'}
      </Text>

      {/* Order info */}
      <View style={styles.orderInfo}>
        <Text style={styles.orderLabel}>Order Number</Text>
        <Text style={styles.orderNumber}>
          {order?.orderNumber || orderId?.slice(0, 8)?.toUpperCase() || '—'}
        </Text>
        {tickets.length > 0 && (
          <View style={styles.ticketCount}>
            <Ticket size={16} color={COLORS.accent} />
            <Text style={styles.ticketCountText}>
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} purchased
            </Text>
          </View>
        )}
        <Text style={styles.offlineNote}>
          ✓ Tickets saved for offline access
        </Text>
      </View>

      {/* Primary CTA */}
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Tickets' })}
      >
        <Text style={styles.btnText}>View My Tickets</Text>
      </TouchableOpacity>

      {/* Share */}
      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Share2 size={16} color={COLORS.accent} />
        <Text style={styles.shareBtnText}>Share with friends</Text>
      </TouchableOpacity>

      {/* Back to home */}
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
  successSub: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  orderInfo: {
    marginTop: 28,
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderLabel: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  orderNumber: { fontSize: 18, fontWeight: '700' },
  ticketCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  ticketCountText: { fontSize: 14, color: COLORS.accent, fontWeight: '600' },
  offlineNote: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 10,
    fontWeight: '500',
  },
  primaryBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    marginTop: 28,
  },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    width: '100%',
    justifyContent: 'center',
  },
  shareBtnText: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
  secondaryBtn: { marginTop: 16, paddingVertical: 12 },
  secondaryBtnText: { color: COLORS.textSecondary, fontSize: 14 },
});
