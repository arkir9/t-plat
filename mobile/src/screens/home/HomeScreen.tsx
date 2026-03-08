/**
 * HomeScreen.tsx  — drop-in replacement
 *
 * Changes vs previous version:
 *  • FILTER_CHIPS now includes "Tonight" as a first-class chip
 *  • loadEvents dispatches to eventsService.getTonightEvents() when
 *    activeFilter === 'tonight', otherwise uses getEvents() with
 *    eventType / search params as before
 *  • "Tonight" chip styled with an amber glow to make it pop
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, MapPin } from 'lucide-react-native';
import { eventsService, Event } from '../../services/eventsService';
import { format } from 'date-fns';
import { theme } from '../../design/theme';

const { colors } = theme;

const COLORS = {
  background: colors.dark.background,
  surface: colors.dark.surface,
  accent: colors.primary[500],
  text: colors.dark.text,
  textSecondary: colors.dark.textSecondary,
  white: '#FFFFFF',
  amber: '#F5A623',
  green: '#1FC98E',
};

// ── Filter definitions ────────────────────────────────────────────────────────
type FilterKey = 'all' | 'tonight' | 'music' | 'food' | 'sports' | 'comedy' | 'arts' | 'free';

const FILTER_CHIPS: Array<{ key: FilterKey; label: string; tonight?: boolean; freeOnly?: boolean; eventType?: string }> = [
  { key: 'all',     label: 'All' },
  { key: 'tonight', label: '🌙 Tonight', tonight: true },
  { key: 'music',   label: 'Music',   eventType: 'music' },
  { key: 'food',    label: 'Food',    eventType: 'food' },
  { key: 'sports',  label: 'Sports',  eventType: 'sports' },
  { key: 'comedy',  label: 'Comedy',  eventType: 'comedy' },
  { key: 'arts',    label: 'Arts',    eventType: 'arts' },
  { key: 'free',    label: 'Free',    freeOnly: true },
];

// ── Event Card ────────────────────────────────────────────────────────────────
function getPriceLabel(event: Event): string {
  const types = (event as any).ticketTypes ?? [];
  if (!types.length) return 'View event';
  const min = Math.min(...types.map((t: any) => t.price ?? 0));
  return min === 0 ? 'Free Entry' : `From KES ${min.toLocaleString()}`;
}

const EventCard = ({ event, onPress }: { event: Event; onPress: () => void }) => {
  const image = (event as any).bannerImageUrl ?? event.images?.[0];
  const location =
    typeof (event as any).location === 'string'
      ? (event as any).location
      : (event as any).location?.name ?? (event as any).customLocation?.address ?? 'Nairobi';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={{ uri: image || 'https://via.placeholder.com/300x160' }}
        style={styles.cardImage}
      />
      {(event as any).isFeatured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>Featured</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>
        {event.startDate && (
          <Text style={styles.cardMeta}>
            {format(new Date(event.startDate), 'EEE, MMM d · h:mm a')}
          </Text>
        )}
        <View style={styles.cardRow}>
          <MapPin size={12} color={COLORS.textSecondary} />
          <Text style={styles.cardMeta} numberOfLines={1}>{location}</Text>
        </View>
        <Text style={styles.cardPrice}>{getPriceLabel(event)}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export function HomeScreen() {
  const navigation = useNavigation<any>();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadEvents = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) setIsRefreshing(true);
        else setIsLoading(true);

        // Featured always loads normally
        const featuredRes = await eventsService.getFeaturedEvents({ limit: 5 }).catch(() => null);
        if (featuredRes?.data) setFeaturedEvents(featuredRes.data);

        const chip = FILTER_CHIPS.find((c) => c.key === activeFilter);

        let res;
        if (chip?.tonight) {
          // ── Tonight: dedicated endpoint ──────────────────────────────
          res = await eventsService.getTonightEvents({
            limit: 30,
            ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
          }).catch(() => null);
        } else {
          // ── Standard filters ─────────────────────────────────────────
          const params: any = { page: 1, limit: 30, status: 'published' };
          if (chip?.eventType) params.eventType = chip.eventType;
          if (chip?.freeOnly) params.minPrice = 0, params.maxPrice = 0;
          if (searchQuery.trim()) params.search = searchQuery.trim();
          res = await eventsService.getEvents(params).catch(() => null);
        }

        if (res?.data) setEvents(res.data);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeFilter, searchQuery],
  );

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const onFilterPress = (key: FilterKey) => {
    setActiveFilter(key);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>plat</Text>
        <View style={styles.locationRow}>
          <MapPin size={13} color={COLORS.textSecondary} />
          <Text style={styles.locationText}>Mombasa, Kenya</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Search size={16} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events, artists, venues…"
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={() => loadEvents()}
        />
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {FILTER_CHIPS.map((chip) => {
          const isActive = activeFilter === chip.key;
          const isTonightChip = chip.tonight;
          return (
            <TouchableOpacity
              key={chip.key}
              style={[
                styles.chip,
                isActive && styles.chipActive,
                isTonightChip && !isActive && styles.chipTonight,
                isTonightChip && isActive && styles.chipTonightActive,
              ]}
              onPress={() => onFilterPress(chip.key)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.chipText,
                  isActive && styles.chipTextActive,
                  isTonightChip && !isActive && styles.chipTextTonight,
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Featured carousel (hidden when Tonight is active — tonight events are more curated) */}
      {featuredEvents.length > 0 && activeFilter !== 'tonight' && (
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {featuredEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.featuredCard}
                onPress={() => navigation.navigate('EventDetail', { eventId: event.id, event })}
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: (event as any).bannerImageUrl || event.images?.[0] || 'https://via.placeholder.com/200x120' }}
                  style={styles.featuredImage}
                />
                <Text style={styles.featuredTitle} numberOfLines={1}>{event.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Tonight banner */}
      {activeFilter === 'tonight' && (
        <View style={styles.tonightBanner}>
          <Text style={styles.tonightBannerText}>🌙 Happening tonight in Mombasa</Text>
        </View>
      )}

      {/* Event list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 40, gap: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => loadEvents(true)} tintColor={COLORS.accent} />
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => navigation.navigate('EventDetail', { eventId: item.id, event: item })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{activeFilter === 'tonight' ? '🌙' : '🎟'}</Text>
              <Text style={styles.emptyTitle}>
                {activeFilter === 'tonight' ? 'Nothing on tonight' : 'No events found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'tonight'
                  ? 'Check back later or explore all events'
                  : 'Try a different filter or search'}
              </Text>
              {activeFilter !== 'all' && (
                <TouchableOpacity onPress={() => setActiveFilter('all')}>
                  <Text style={styles.emptyAction}>Show all events</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  logo: { fontSize: 26, fontWeight: '800', fontStyle: 'italic', color: COLORS.text, letterSpacing: -1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: COLORS.textSecondary },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 14, backgroundColor: COLORS.surface, borderRadius: 22, paddingHorizontal: 14, height: 44 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },

  chipRow: { maxHeight: 44, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface },
  chipActive: { backgroundColor: COLORS.accent },
  chipTonight: { borderWidth: 1.5, borderColor: COLORS.amber, backgroundColor: 'rgba(245,166,35,0.08)' },
  chipTonightActive: { backgroundColor: COLORS.amber },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
  chipTextTonight: { color: COLORS.amber },

  featuredSection: { marginTop: 16, marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginLeft: 16, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  featuredCard: { width: 160 },
  featuredImage: { width: 160, height: 100, borderRadius: 12, marginBottom: 6 },
  featuredTitle: { fontSize: 12, fontWeight: '600', color: COLORS.text },

  tonightBanner: { marginHorizontal: 16, marginTop: 12, marginBottom: 4, padding: 10, backgroundColor: 'rgba(245,166,35,0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(245,166,35,0.3)' },
  tonightBannerText: { fontSize: 13, color: COLORS.amber, fontWeight: '600', textAlign: 'center' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, overflow: 'hidden' },
  cardImage: { width: '100%', height: 110, resizeMode: 'cover' },
  featuredBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  featuredBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.white },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 4, lineHeight: 18 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardMeta: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 2 },
  cardPrice: { fontSize: 12, fontWeight: '700', color: COLORS.green, marginTop: 4 },

  emptyState: { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16 },
  emptyAction: { fontSize: 14, color: COLORS.accent, fontWeight: '700' },
});
