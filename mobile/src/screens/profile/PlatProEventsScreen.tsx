import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ChevronLeft, Calendar, MapPin, Plus, Globe, CheckCircle } from 'lucide-react-native';
import { eventsService, Event } from '../../services/eventsService';
import { format } from 'date-fns';

const COLORS = {
  primary: '#000000',
  accent: '#8B5CF6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  verified: '#10B981',
};

export function PlatProEventsScreen({ navigation }: any) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMyEvents();
  }, []);

  const loadMyEvents = async () => {
      try {
        const res = await eventsService.getMyEvents();
        const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setEvents(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
  };

  const renderItem = ({ item }: { item: Event }) => {
    const dateLabel = format(new Date(item.startDate), 'EEE, MMM d • h:mm a');
    let location = 'Location TBD';
    if (item.customLocation?.address) {
        location = item.customLocation.address;
    } else if (item.venue?.name) {
        location = item.venue.name;
    }

    const isImported = item.source !== 'internal';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id, event: item })}
      >
        <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            {isImported ? (
                <View style={styles.sourceTag}>
                    <Globe size={12} color={COLORS.accent} />
                    <Text style={styles.sourceTagText}>Imported</Text>
                </View>
            ) : (
                <View style={[styles.sourceTag, {backgroundColor: '#DCFCE7'}]}>
                    <CheckCircle size={12} color={COLORS.verified} />
                    <Text style={[styles.sourceTagText, {color: COLORS.verified}]}>Manual</Text>
                </View>
            )}
        </View>

        <View style={styles.metaRow}>
          <Calendar size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{dateLabel}</Text>
        </View>
        <View style={styles.metaRow}>
          <MapPin size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>{location}</Text>
        </View>

        <View style={styles.footerRow}>
            <Text style={styles.statusText}>
               Status: <Text style={styles.statusValue}>{item.status || 'Draft'}</Text>
            </Text>
            {isImported && <Text style={styles.sourceFooterText}>via {item.source}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft color={COLORS.primary} size={24} /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Events</Text>
        <TouchableOpacity onPress={() => navigation.navigate('PlatProCreateEvent')}><Plus color={COLORS.primary} size={20} /></TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.accent} /></View>
      ) : events.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No events yet</Text>
          <Text style={styles.emptySub}>Create your first event or claim one from the discovery feed.</Text>
          <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate('PlatProCreateEvent')}>
              <Text style={styles.createButtonText}>Create Event</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMyEvents(); }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.surface },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, flex: 1, marginRight: 8 },
  sourceTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE9FE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 4 },
  sourceTagText: { fontSize: 10, color: COLORS.accent, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  metaText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  statusText: { fontSize: 12, color: COLORS.textSecondary },
  statusValue: { fontWeight: '600', color: COLORS.primary, textTransform: 'capitalize' },
  sourceFooterText: { fontSize: 10, color: COLORS.textSecondary, fontStyle: 'italic' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 },
  createButton: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  createButtonText: { color: 'white', fontWeight: '600' },
});