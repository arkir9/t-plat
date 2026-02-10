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
  Alert,
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
} from 'lucide-react-native';
import { eventsService } from '../../services/eventsService';
import type { Event } from '../../types';
import { format } from 'date-fns';

const COLORS = {
  primary: '#000000',
  accent: '#8B5CF6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textLight: '#999999',
  white: '#FFFFFF',
  verified: '#10B981',
  unverified: 'rgba(0,0,0,0.6)', 
};

const SPACING = { s: 8, m: 16, l: 24, xl: 32 };

// --- UPDATED CATEGORIES ---
const CATEGORIES = [
    'All', 
    'Recommended', 
    'Nightlife', 
    'Concerts', 
    'Festivals', 
    'Arts', 
    'Sports', 
    'Business'
];

const formatEventDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, 'EEE, MMM d • h:mm a');
  } catch {
    return dateString;
  }
};

const formatPrice = (price?: number, currency?: string) => {
  if (!price || price === 0) return 'Free';
  const currencySymbol = currency === 'USD' ? '$' : 'KES';
  return `${currencySymbol} ${price.toLocaleString()}`;
};

const getLocationString = (event: Event) => {
  if (event.locationType === 'venue' && event.venueId) {
    return 'Venue'; 
  }
  if (event.customLocation) {
    const { address, city } = event.customLocation;
    if (address && city) return `${address}, ${city}`;
    if (address) return address;
    if (city) return city;
  }
  return 'Location TBD';
};

const CategoryChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const EventCard = ({ event, onPress }: { event: Event; onPress: () => void }) => {
  const location = getLocationString(event);
  const formattedDate = formatEventDate(event.startDate);
  // Support both price field or ticketTypes array
  const price = event.ticketTypes?.[0]?.price 
    ? `KES ${event.ticketTypes[0].price}` 
    : formatPrice(event.price, event.currency);

  const isOfficial = event.isClaimed || event.source === 'internal';
  const imageUri = event.images?.[0];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' }]}>
            <Calendar size={32} color={COLORS.textLight} />
          </View>
        )}
        <View style={[styles.badge, { backgroundColor: isOfficial ? COLORS.verified : COLORS.unverified }]}>
          {isOfficial ? <ShieldCheck size={14} color="white" /> : <Globe size={14} color="white" />}
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>
        
        <View style={styles.cardMetaRow}>
          <Calendar size={14} color={COLORS.textSecondary} />
          <Text style={styles.cardMetaText}>{formattedDate}</Text>
        </View>
        
        <View style={styles.cardMetaRow}>
          <MapPin size={14} color={COLORS.textSecondary} />
          <Text style={styles.cardMetaText} numberOfLines={1}>{location}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>{price}</Text>
          {!isOfficial && <Text style={styles.sourceText}>via {event.source}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const [activeCategory, setActiveCategory] = useState('All');
  const [events, setEvents] = useState<Event[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadEvents = useCallback(async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const featuredResponse = await eventsService.getFeaturedEvents({ limit: 5 }).catch(() => null);
      if (featuredResponse?.data) setFeaturedEvents(featuredResponse.data);

      if (activeCategory === 'Recommended') {
        const response = await eventsService.getRecommendedEvents(20).catch(() => null);
        if (response?.data) setEvents(response.data);
        return;
      }

      const params: any = { page: 1, limit: 20, status: 'published' };

      if (activeCategory !== 'All') {
          let typeParam = activeCategory.toLowerCase();
          
          if (activeCategory === 'Arts') typeParam = 'arts_culture';
          if (activeCategory === 'Concerts') typeParam = 'concert';
          if (activeCategory === 'Festivals') typeParam = 'festival';
          // Nightlife maps directly to 'nightlife', Sports to 'sports', etc.
          
          // Use the new EventType column for filtering
          params.eventType = typeParam;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await eventsService.getEvents(params).catch(() => null);
      if (response?.data) setEvents(response.data);
    } catch (error: any) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSearch = (text: string) => {
    // Just update the search query; the debounced effect is handled
    // by the memoized `loadEvents` function and the useEffect above.
    setSearchQuery(text);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>plat</Text>
        <View style={styles.locationContainer}>
          <MapPin size={16} color={COLORS.accent} />
          <Text style={styles.locationText}>Nairobi, Kenya</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onPress={() => setActiveCategory(cat)}
            />
          ))}
        </ScrollView>
      </View>

      {featuredEvents.length > 0 && (
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
            {featuredEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.featuredCard}
                onPress={() => navigation.navigate('EventDetail', { eventId: event.id, event })}
              >
                <Image source={{ uri: event.images?.[0] || 'https://via.placeholder.com/200' }} style={styles.featuredImage} />
                <View style={styles.featuredContent}>
                  <Text style={styles.featuredTitle} numberOfLines={1}>{event.title}</Text>
                </View>
              </TouchableOpacity>
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
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadEvents(true)} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No events found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.m, paddingVertical: SPACING.s },
  logoText: { fontSize: 28, fontWeight: '800', fontStyle: 'italic', color: COLORS.primary },
  locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.surface, padding: 6, borderRadius: 16 },
  locationText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  searchContainer: { flexDirection: 'row', paddingHorizontal: SPACING.m, gap: SPACING.s, marginBottom: SPACING.m },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: SPACING.m, height: 48, borderRadius: 24, gap: SPACING.s },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.textPrimary },
  filterButton: { width: 48, height: 48, backgroundColor: COLORS.surface, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  categoriesList: { paddingHorizontal: SPACING.m, paddingBottom: SPACING.m, gap: SPACING.s },
  chip: { paddingHorizontal: SPACING.m, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { color: COLORS.textPrimary, fontWeight: '500' },
  chipTextActive: { color: COLORS.white },
  listContent: { paddingHorizontal: SPACING.m, paddingBottom: 80 },
  card: { flexDirection: 'row', backgroundColor: COLORS.white, marginBottom: SPACING.m, borderBottomWidth: 1, borderBottomColor: COLORS.surface, paddingBottom: SPACING.m },
  imageContainer: { width: 120, height: 140, position: 'relative' },
  cardImage: { width: '100%', height: '100%', borderRadius: 12, backgroundColor: COLORS.surface },
  badge: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, marginLeft: SPACING.m, justifyContent: 'space-between', paddingVertical: 4 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaText: { fontSize: 13, color: COLORS.textSecondary },
  cardFooter: { marginTop: 4 },
  cardPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  sourceText: { fontSize: 11, color: COLORS.textLight, fontStyle: 'italic', marginTop: 2 },
  featuredSection: { marginBottom: SPACING.m },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: SPACING.m, marginBottom: SPACING.s },
  featuredList: { paddingHorizontal: SPACING.m },
  featuredCard: { marginRight: SPACING.m, width: 200 },
  featuredImage: { width: 200, height: 120, borderRadius: 12, marginBottom: 4 },
  featuredContent: {},
  featuredTitle: { fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', height: 200 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: COLORS.textSecondary },
});