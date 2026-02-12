import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QrCode, Calendar, MapPin, Clock } from 'lucide-react-native';
import { ticketsService } from '../../services/ticketsService'; 
import { format } from 'date-fns';

const COLORS = {
  primary: '#000000',
  background: '#F8F9FA',
  cardBg: '#FFFFFF',
  text: '#1A1A1A',
  textSec: '#666666',
  accent: '#8B5CF6',
};

export function MyTicketScreen({ navigation }: any) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      const data = await ticketsService.getMyTickets(); 
      setTickets(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      console.log('Failed to load tickets', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  const renderTicketItem = ({ item }: { item: any }) => {
    const event = item.event || {};
    const dateStr = event.startDate ? format(new Date(event.startDate), 'EEE, MMM d') : 'TBD';
    const timeStr = event.startDate ? format(new Date(event.startDate), 'h:mm a') : '';
    
    // --- FIX: Hybrid Location Logic ---
    const location = event.customLocation?.city 
        ? `${event.customLocation.address || ''}, ${event.customLocation.city}` 
        : (event.venue?.name || 'Nairobi');
    // ----------------------------------

    const imageUri = event.images?.[1] ?? event.images?.[0] || 'https://via.placeholder.com/100';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id, ticket: item })}
      >
        <View style={styles.cardLeft}>
          <Image source={{ uri: imageUri }} style={styles.cardImage} />
          <View style={styles.dateBadge}>
            <Text style={styles.dateMonth}>{dateStr.split(',')[1]?.trim().split(' ')[0]}</Text>
            <Text style={styles.dateDay}>{dateStr.split(',')[1]?.trim().split(' ')[1]}</Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={styles.eventTitle} numberOfLines={2}>{event.title || 'Event Name'}</Text>
          
          <View style={styles.infoRow}>
            <Clock size={14} color={COLORS.textSec} />
            <Text style={styles.infoText}>{dateStr} • {timeStr}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MapPin size={14} color={COLORS.textSec} />
            <Text style={styles.infoText} numberOfLines={1}>{location}</Text>
          </View>

          <View style={styles.ticketFooter}>
            <View style={styles.ticketPill}>
              <Text style={styles.ticketPillText}>
                {item.ticketType?.name || 'General Admission'}
              </Text>
            </View>
            <TouchableOpacity 
               style={styles.qrButton}
               onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id, ticket: item })}
            >
               <QrCode size={20} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tickets</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.accent} /></View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <QrCode size={64} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No tickets yet</Text>
              <Text style={styles.emptyText}>Upcoming tickets you purchase will appear here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: COLORS.cardBg, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  card: { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  cardLeft: { width: 100, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  dateBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 8, padding: 6, alignItems: 'center', justifyContent: 'center', width: 44 },
  dateMonth: { fontSize: 10, fontWeight: 'bold', color: COLORS.accent, textTransform: 'uppercase' },
  dateDay: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  cardRight: { flex: 1, padding: 12, justifyContent: 'space-between' },
  eventTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoText: { fontSize: 12, color: COLORS.textSec },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  ticketPill: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  ticketPillText: { fontSize: 11, color: COLORS.textSec, fontWeight: '600' },
  qrButton: { width: 36, height: 36, backgroundColor: '#F5F3FF', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 16 },
  emptyText: { textAlign: 'center', color: COLORS.textSec, marginTop: 8, lineHeight: 20 },
});