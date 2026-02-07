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
import { ChevronLeft } from 'lucide-react-native';
import { ticketsService, TicketType } from '../../services/ticketsService';
import { eventsService } from '../../services/eventsService';
import { format } from 'date-fns';

const COLORS = { primary: '#000', accent: '#8B5CF6', surface: '#F5F5F5', white: '#FFF' };

export function TicketSelectionScreen({ navigation, route }: any) {
  const { eventId, event: eventParam } = route.params;
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
      // Load event if only eventId provided
      if (eventId && !event) {
        const eventData = await eventsService.getEventById(eventId);
        setEvent(eventData);
      }

      // Load ticket types
      const ticketTypesData = await ticketsService.getTicketTypes(eventId || event?.id);
      setTicketTypes(ticketTypesData);

      // Initialize quantities
      const initialQuantities: Record<string, number> = {};
      ticketTypesData.forEach((tt) => {
        initialQuantities[tt.id] = 0;
      });
      setQuantities(initialQuantities);
    } catch (error: any) {
      console.error('Failed to load ticket types:', error);
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
      const maxAvailable = ticketType ? ticketType.availableQuantity : 0;
      const newQty = Math.max(0, Math.min(maxAvailable, current + delta));
      return { ...prev, [id]: newQty };
    });
  };

  const total = ticketTypes.reduce((sum, t) => {
    const qty = quantities[t.id] || 0;
    return sum + (Number(t.price) * qty);
  }, 0);

  const formatPrice = (price: number, currency: string = 'KES') => {
    const symbol = currency === 'USD' ? '$' : 'KES';
    return `${symbol} ${price.toLocaleString()}`;
  };

  const handleCheckout = () => {
    const items = ticketTypes
      .filter(tt => (quantities[tt.id] || 0) > 0)
      .map(tt => ({
        ticketTypeId: tt.id,
        quantity: quantities[tt.id],
      }));

    if (items.length === 0) {
      Alert.alert('Error', 'Please select at least one ticket');
      return;
    }

    navigation.navigate('Checkout', {
      eventId: eventId || event?.id,
      event,
      items,
      total,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ChevronLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Tickets</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loadingText}>Loading ticket types...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.eventTitle}>{event?.title || 'Event'}</Text>
            {event?.startDate && (
              <Text style={styles.dateSub}>
                {format(new Date(event.startDate), 'EEE, MMM d • h:mm a')}
              </Text>
            )}

            {ticketTypes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No ticket types available</Text>
                <Text style={styles.emptySubtext}>Tickets may not be on sale yet</Text>
              </View>
            ) : (
              ticketTypes.map(ticket => {
                const qty = quantities[ticket.id] || 0;
                const isSoldOut = ticket.availableQuantity <= 0;
                const isMaxReached = qty >= ticket.availableQuantity;

                return (
                  <View key={ticket.id} style={styles.ticketCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ticketName}>{ticket.name}</Text>
                      {ticket.description && (
                        <Text style={styles.ticketDesc}>{ticket.description}</Text>
                      )}
                      <Text style={styles.ticketPrice}>
                        {formatPrice(Number(ticket.price), ticket.currency)}
                      </Text>
                      {!isSoldOut && (
                        <Text style={styles.ticketAvailability}>
                          {ticket.availableQuantity} available
                        </Text>
                      )}
                      {isSoldOut && (
                        <Text style={styles.soldOutText}>Sold Out</Text>
                      )}
                    </View>
                    
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        onPress={() => updateQty(ticket.id, -1)}
                        style={[styles.stepBtn, qty === 0 && styles.stepBtnDisabled]}
                        disabled={qty === 0}
                      >
                        <Text style={styles.stepTxt}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyTxt}>{qty}</Text>
                      <TouchableOpacity
                        onPress={() => updateQty(ticket.id, 1)}
                        style={[styles.stepBtn, (isSoldOut || isMaxReached) && styles.stepBtnDisabled]}
                        disabled={isSoldOut || isMaxReached}
                      >
                        <Text style={styles.stepTxt}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>KES {total.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={[styles.primaryBtn, { opacity: total > 0 ? 1 : 0.5 }]}
          disabled={total === 0 || isLoading}
          onPress={handleCheckout}
        >
          <Text style={styles.btnText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  eventTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  dateSub: { color: '#666', marginBottom: 24 },
  ticketCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  ticketName: { fontSize: 16, fontWeight: 'bold' },
  ticketDesc: { fontSize: 12, color: '#666', marginTop: 2 },
  ticketPrice: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 8 },
  stepBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  stepBtnDisabled: { opacity: 0.3 },
  stepTxt: { fontSize: 18, fontWeight: '600' },
  qtyTxt: { width: 30, textAlign: 'center', fontWeight: 'bold' },
  ticketAvailability: { fontSize: 12, color: '#666', marginTop: 4 },
  soldOutText: { fontSize: 12, color: '#EF4444', marginTop: 4, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, color: '#666' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#666', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#999' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 12, color: '#666' },
  totalValue: { fontSize: 20, fontWeight: 'bold' },
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 30, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});