/**
 * TicketSelectionScreen
 *
 * CHANGE FROM ORIGINAL:
 * Added auth gate at the top of handleCheckout().
 * Unauthenticated users are redirected to Login with returnTo params.
 * After login, LoginScreen navigates back here automatically.
 *
 * This is the only place auth is enforced — browsing events and viewing
 * details remains fully open to guests.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ChevronLeft, Lock } from 'lucide-react-native';
import { ticketsService, TicketType } from '../../services/ticketsService';
import { eventsService } from '../../services/eventsService';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';

const COLORS = {
  primary: '#000',
  accent: '#8B5CF6',
  accentLight: '#F3E8FF',
  surface: '#F5F5F5',
  border: '#E5E5E5',
  white: '#FFF',
  green: '#10B981',
  red: '#EF4444',
  textSecondary: '#666',
};

export function TicketSelectionScreen({ navigation, route }: any) {
  const { eventId, event: eventParam } = route.params;
  const { isAuthenticated } = useAuthStore();

  const [event, setEvent] = useState(eventParam);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (eventId && !event) {
        const eventData = await eventsService.getEventById(eventId);
        setEvent(eventData);
      }
      const ticketTypesData = await ticketsService.getTicketTypes(eventId || event?.id);
      setTicketTypes(Array.isArray(ticketTypesData) ? ticketTypesData : []);

      const initialQuantities: Record<string, number> = {};
      (Array.isArray(ticketTypesData) ? ticketTypesData : []).forEach((tt: TicketType) => {
        initialQuantities[tt.id] = 0;
      });
      setQuantities(initialQuantities);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load ticket types. Please try again.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const ticketType = ticketTypes.find(tt => tt.id === id);
      const maxAvailable = ticketType?.availableQuantity ?? 0;
      const newQty = Math.max(0, Math.min(maxAvailable, current + delta));
      return { ...prev, [id]: newQty };
    });
  };

  const total = ticketTypes.reduce((sum, t) => {
    return sum + (Number(t.price) * (quantities[t.id] || 0));
  }, 0);

  const selectedCount = Object.values(quantities).reduce((a, b) => a + b, 0);

  const formatPrice = (price: number, currency = 'KES') => {
    return `${currency === 'USD' ? '$' : 'KES'} ${price.toLocaleString()}`;
  };

  const handleCheckout = () => {
    const items = ticketTypes
      .filter(tt => (quantities[tt.id] || 0) > 0)
      .map(tt => ({
        ticketTypeId: tt.id,
        ticketTypeName: tt.name,
        quantity: quantities[tt.id],
        unitPrice: Number(tt.price),
        currency: tt.currency || 'KES',
      }));

    if (items.length === 0) {
      Alert.alert('No tickets selected', 'Please select at least one ticket to continue.');
      return;
    }

    // ── AUTH GATE ──────────────────────────────────────────────────────────
    // This is the only place in the app that requires authentication.
    // Guests can browse freely — they hit this wall when they try to pay.
    if (!isAuthenticated) {
      navigation.navigate('Login', {
        returnTo: 'TicketSelection',
        returnParams: { eventId: eventId || event?.id, event },
      });
      return;
    }
    // ──────────────────────────────────────────────────────────────────────

    navigation.navigate('Checkout', {
      eventId: eventId || event?.id,
      event,
      items,
      subtotal: total,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ChevronLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Tickets</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loadingText}>Loading tickets...</Text>
          </View>
        ) : (
          <>
            {/* Event summary */}
            <View style={styles.eventSummary}>
              <Text style={styles.eventTitle}>{event?.title || 'Event'}</Text>
              {event?.startDate && (
                <Text style={styles.eventDate}>
                  {format(new Date(event.startDate), 'EEE, MMM d • h:mm a')}
                </Text>
              )}
            </View>

            {/* Ticket types */}
            {ticketTypes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No tickets available for this event.</Text>
              </View>
            ) : (
              ticketTypes.map(tt => {
                const qty = quantities[tt.id] || 0;
                const available = tt.availableQuantity ?? 0;
                const soldOut = available <= 0;

                return (
                  <View
                    key={tt.id}
                    style={[styles.ticketCard, soldOut && styles.ticketCardDisabled]}
                  >
                    <View style={styles.ticketInfo}>
                      <Text style={styles.ticketName}>{tt.name}</Text>
                      {tt.description ? (
                        <Text style={styles.ticketDesc}>{tt.description}</Text>
                      ) : null}
                      <Text style={styles.ticketPrice}>
                        {formatPrice(Number(tt.price), tt.currency)}
                      </Text>
                      {!soldOut && available <= 20 && (
                        <Text style={styles.scarcityBadge}>
                          Only {available} left
                        </Text>
                      )}
                      {soldOut && (
                        <Text style={styles.soldOutBadge}>Sold out</Text>
                      )}
                    </View>

                    {/* Quantity stepper */}
                    {!soldOut && (
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={[styles.stepBtn, qty === 0 && styles.stepBtnDisabled]}
                          onPress={() => updateQty(tt.id, -1)}
                          disabled={qty === 0}
                        >
                          <Text style={styles.stepBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepCount}>{qty}</Text>
                        <TouchableOpacity
                          style={[styles.stepBtn, qty >= available && styles.stepBtnDisabled]}
                          onPress={() => updateQty(tt.id, 1)}
                          disabled={qty >= available}
                        >
                          <Text style={styles.stepBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}

            {/* Guest nudge — shown only when items selected and not logged in */}
            {!isAuthenticated && selectedCount > 0 && (
              <View style={styles.authNudge}>
                <Lock size={16} color={COLORS.accent} />
                <Text style={styles.authNudgeText}>
                  You'll need to sign in to complete your purchase
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Footer */}
      {!isLoading && ticketTypes.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {selectedCount > 0 ? `${selectedCount} ticket${selectedCount !== 1 ? 's' : ''}` : 'Total'}
            </Text>
            <Text style={styles.totalAmount}>
              {total > 0 ? `KES ${total.toLocaleString()}` : '—'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutBtn, selectedCount === 0 && styles.checkoutBtnDisabled]}
            onPress={handleCheckout}
            disabled={selectedCount === 0}
          >
            <Text style={styles.checkoutBtnText}>
              {isAuthenticated ? 'Continue to Payment' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  iconButton: { width: 40, height: 40, justifyContent: 'center' },

  content: { padding: 16, paddingBottom: 120 },

  loadingContainer: { paddingTop: 60, alignItems: 'center', gap: 12 },
  loadingText: { color: COLORS.textSecondary, fontSize: 14 },

  eventSummary: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  eventTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  eventDate: { fontSize: 13, color: COLORS.textSecondary },

  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ticketCardDisabled: { opacity: 0.5 },
  ticketInfo: { flex: 1, marginRight: 12 },
  ticketName: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  ticketDesc: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, lineHeight: 18 },
  ticketPrice: { fontSize: 15, fontWeight: '800', color: COLORS.accent },
  scarcityBadge: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 4,
  },
  soldOutBadge: {
    fontSize: 11,
    color: COLORS.red,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: { borderColor: COLORS.border, opacity: 0.4 },
  stepBtnText: { fontSize: 18, fontWeight: '600', color: COLORS.accent, lineHeight: 22 },
  stepCount: { fontSize: 16, fontWeight: '700', minWidth: 20, textAlign: 'center' },

  authNudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accentLight,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  authNudgeText: { fontSize: 13, color: COLORS.accent, flex: 1, lineHeight: 18 },

  emptyState: { paddingTop: 40, alignItems: 'center' },
  emptyText: { color: COLORS.textSecondary, fontSize: 15 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  totalAmount: { fontSize: 16, fontWeight: '800' },
  checkoutBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  checkoutBtnDisabled: { opacity: 0.4 },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
