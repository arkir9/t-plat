import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  MapPin,
  Calendar,
  Search,
  Filter,
  ShieldCheck,
  Globe,
  Music,
  Palette,
  Activity,
  Bell,
  Ticket,
} from 'lucide-react-native';
import { eventsService } from '../../services/eventsService';
import type { Event } from '../../types';
import { format } from 'date-fns';
import { theme } from '../../design/theme';

const { colors, spacing, borderRadius } = theme;

// Dark theme colors
const COLORS = {
  primary: colors.dark.background,
  accent: colors.primary[500],
  background: colors.dark.background,
  surface: colors.dark.surface,
  surfaceVariant: colors.dark.surfaceVariant,
  textPrimary: colors.dark.text,
  textSecondary: colors.dark.textSecondary,
  textLight: colors.dark.textTertiary,
  white: '#FFFFFF',
  verified: '#10B981',
  unverified: 'rgba(255,255,255,0.4)',
};

const SPACING = spacing;
const CATEGORIES = [
  { label: 'All', value: undefined, icon: null },
  { label: 'Nightlife', value: 'nightlife', icon: null },
  { label: 'Concerts', value: 'concert', icon: Music },
  { label: 'Festivals', value: 'festival', icon: Music },
  { label: 'Arts', value: 'arts_culture', icon: Palette },
  { label: 'Sports', value: 'sports', icon: Activity },
  { label: 'Business', value: 'business', icon: null },
  { label: 'Community', value: 'community', icon: null },
];

const formatEventDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, 'EEE, MMM d • h:mm a');
  } catch {
    return dateString;
  }
};

const getLocationString = (event: Event) => {
  if (event.customLocation) {
    const { address, city } = event.customLocation;
    if (address && city && address.includes(city)) return address;
    if (address && city) return `${address}, ${city}`;
    return address || city || 'Nairobi';
  }
  if (event.locationType === 'venue' && event.venue) {
    return event.venue.name || event.venue.venueCity || 'Venue';
  }
  return 'Location TBD';
};

const CategoryChip = ({
  label,
  active,
  onPress,
  Icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  Icon?: any;
}) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
  >
    {Icon && <Icon size={18} color={active ? COLORS.white : COLORS.textSecondary} style={{ marginRight: 6 }} />}
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const EventCard = ({ event, onPress, showFeatured }: { event: Event; onPress: () => void; showFeatured?: boolean }) => {
  const location = getLocationString(event);
  const formattedDate = formatEventDate(event.startDate);

  let priceDisplay: string | null = null;
  if (event.ticketTypes && event.ticketTypes.length > 0) {
    const minPrice = Math.min(...event.ticketTypes.map((t: any) => Number(t.price)));
    if (minPrice > 0) priceDisplay = event.ticketTypes.length > 1 ? `From KES ${minPrice.toLocaleString()}` : `KES ${minPrice.toLocaleString()}`;
  } else if (event.price != null && event.price > 0) {
    priceDisplay = `KES ${event.price.toLocaleString()}`;
  }

  const isOfficial = event.isClaimed || event.source === 'internal';
  const imageUri = event.images?.[0];
  const dateTag = event.startDate ? format(new Date(event.startDate), 'dd MMM') : '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardImageWrapper}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Calendar size={40} color={COLORS.textLight} />
          </View>
        )}
        {showFeatured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>FEATURED</Text>
          </View>
        )}
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{dateTag}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.cardMetaRow}>
          <MapPin size={14} color={COLORS.accent} />
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {location}
          </Text>
        </View>
        <View style={styles.cardMetaRow}>
          <Ticket size={14} color={COLORS.accent} />
          <Text style={styles.cardMetaText}>{priceDisplay ?? 'FREE ENTRY'}</Text>
        </View>
        <View style={styles.cardFooter}>
          <TouchableOpacity style={styles.bookButton} onPress={onPress} activeOpacity={0.9}>
            <Text style={styles.bookButtonText}>Book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
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

        const featuredResponse = await eventsService.getFeaturedEvents({ limit: 5 }).catch(() => null);
        if (featuredResponse?.data) setFeaturedEvents(featuredResponse.data);

        const params: any = { page: 1, limit: 20, status: 'published' };
        if (activeCategory) params.eventType = activeCategory;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const response = await eventsService.getEvents(params).catch(() => null);
        if (response?.data) setEvents(response.data);
      } catch (error: any) {
        console.error('Failed to load events:', error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeCategory, searchQuery]
  );

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>P</Text>
          </View>
          <Text style={styles.logoText}>Plat</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Bell size={22} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.locationRow}>
        <Text style={styles.locationLabel}>CURRENT LOCATION</Text>
      </View>
      <View style={styles.locationSelector}>
        <MapPin size={18} color={COLORS.textPrimary} />
        <Text style={styles.locationText}>Nairobi, Kenya</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => loadEvents()}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => loadEvents()}>
          <Filter size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesSection}>
        <Text style={styles.sectionLabel}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.label}
              label={cat.label}
              active={activeCategory === cat.value}
              onPress={() => setActiveCategory(cat.value)}
              Icon={cat.icon}
            />
          ))}
        </ScrollView>
      </View>

      {featuredEvents.length > 0 && (
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Events</Text>
            <TouchableOpacity onPress={() => loadEvents()}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
            {featuredEvents.map((event, idx) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => navigation.navigate('EventDetail', { eventId: event.id, event })}
                showFeatured={idx === 0}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => navigation.navigate('EventDetail', { eventId: item.id, event: item })}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadEvents(true)}
              tintColor={COLORS.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No events found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  logoText: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationRow: { paddingHorizontal: SPACING.md, marginTop: SPACING.xs },
  locationLabel: { fontSize: 10, color: COLORS.textLight, letterSpacing: 1, marginBottom: 4 },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
  },
  locationText: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginVertical: SPACING.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderRadius: borderRadius.xl,
    gap: SPACING.sm,
  },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.textPrimary },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.primary[500],
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesSection: { marginBottom: SPACING.md },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
    marginBottom: SPACING.sm,
  },
  categoriesList: { paddingHorizontal: SPACING.md, gap: SPACING.sm, paddingRight: SPACING.md },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: borderRadius.xl,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipActive: { backgroundColor: theme.colors.primary[500] },
  chipText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  chipTextActive: { color: COLORS.white },
  featuredSection: { marginBottom: SPACING.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  seeAllText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary[400] },
  featuredList: { paddingHorizontal: SPACING.md, gap: SPACING.md, paddingRight: SPACING.md },
  listContent: { paddingHorizontal: SPACING.md, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  cardImageWrapper: { height: 180, position: 'relative' },
  cardImage: { width: '100%', height: '100%', backgroundColor: COLORS.surfaceVariant },
  cardImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  featuredBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.white },
  dateBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  dateBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.white },
  cardContent: { padding: SPACING.md },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  cardMetaText: { fontSize: 13, color: COLORS.textSecondary },
  cardFooter: { marginTop: 12 },
  bookButton: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
  },
  bookButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', height: 200 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: COLORS.textSecondary },
});
