import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft, Calendar, MapPin, Plus } from 'lucide-react-native';
import { eventsService, Event } from '../../services/eventsService';
import { format } from 'date-fns';

const COLORS = {
  primary: '#000000',
  accent: '#8B5CF6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
};

export function PlatProEventsScreen({ navigation }: any) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await eventsService.getMyEvents();
        const items = Array.isArray(res?.items ?? res) ? (res.items ?? res) : [];
        setEvents(items);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const renderItem = ({ item }: { item: Event }) => {
    const dateLabel = format(new Date(item.startDate), 'EEE, MMM d • h:mm a');
    const location =
      item.locationType === 'custom' && item.customLocation
        ? `${item.customLocation.address}, ${item.customLocation.city}`
        : 'Venue / TBD';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          // For now, just open user-facing event detail
          navigation.navigate('EventDetail', { eventId: item.id, event: item });
        }}
      >
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          <Calendar size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{dateLabel}</Text>
        </View>
        <View style={styles.metaRow}>
          <MapPin size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {location}
          </Text>
        </View>
        <Text style={styles.statusText}>
          Status:{' '}
          <Text style={{ fontWeight: '600' }}>
            {item.status === 'published'
              ? 'Published'
              : item.status === 'draft'
              ? 'Draft'
              : item.status === 'cancelled'
              ? 'Cancelled'
              : 'Completed'}
          </Text>
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My events</Text>
        <TouchableOpacity onPress={() => navigation.navigate('PlatProCreateEvent')}>
          <Plus color={COLORS.primary} size={20} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No events yet</Text>
          <Text style={styles.emptySub}>
            Create your first event to start selling tickets with Plat Pro.
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  metaText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  statusText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});

