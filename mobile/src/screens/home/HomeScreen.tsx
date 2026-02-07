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
  Home,
  MapPin,
  Ticket,
  Heart,
  User,
  Search,
  Filter,
  ChevronLeft,
  Share,
  Calendar,
  ShieldCheck,
} from 'lucide-react-native';
import { eventsService, Event } from '../../services/eventsService';
import { format } from 'date-fns';

const COLORS = {
  primary: '#000000',
  accent: '#8B5CF6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textLight: '#999999',
  success: '#10B981',
  error: '#EF4444',
  white: '#FFFFFF',
};

const SPACING = {
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
};

const CATEGORIES = ['All', 'Recommended', 'Today', 'This Weekend', 'Music', 'Tech', 'Arts', 'Food'];

// Helper function to format event date
const formatEventDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, 'EEE, MMM d • h:mm a');
  } catch {
    return dateString;
  }
};

// Helper function to format price
const formatPrice = (price?: number, currency?: string) => {
  if (!price || price === 0) return 'Free';
  const currencySymbol = currency === 'USD' ? '$' : 'KES';
  return `${currencySymbol} ${price.toLocaleString()}`;
};

// Helper function to get location string
const getLocationString = (event: Event) => {
  if (event.locationType === 'venue' && event.venueId) {
    return 'Venue'; // Would need to fetch venue details
  }
  if (event.customLocation) {
    return `${event.customLocation.address}, ${event.customLocation.city}`;
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
  const price = formatPrice(event.price, event.currency);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {event.image ? (
        <Image source={{ uri: event.image }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, { backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' }]}>
          <Calendar size={32} color={COLORS.textLight} />
        </View>
      )}
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
          {event.category && (
            <Text style={styles.cardOrganizer}>{event.category}</Text>
          )}
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
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Load featured events (backend returns { data, total, page, limit })
      const featuredResponse = await eventsService.getFeaturedEvents({ limit: 5 }).catch(() => null);
      const featured = featuredResponse?.data ?? [];
      if (Array.isArray(featured)) setFeaturedEvents(featured);

      // Special case: Recommended category uses personalized endpoint
      if (activeCategory === 'Recommended') {
        const response = await eventsService.getRecommendedEvents(20).catch(() => null);
        const list = response?.data ?? [];
        if (Array.isArray(list)) setEvents(list);
        return;
      }

      // Build query params for regular discovery feed
      const params: any = {
        page: 1,
        limit: 20,
        status: 'published',
      };

      // Apply category filter (backend accepts startDate = startDateFrom, endDate = startDateTo)
      if (activeCategory !== 'All') {
        if (activeCategory === 'Today') {
          const today = new Date();
          const startOfDay = new Date(today);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(today);
          endOfDay.setHours(23, 59, 59, 999);
          params.startDate = startOfDay.toISOString();
          params.endDate = endOfDay.toISOString();
        } else if (activeCategory === 'This Weekend') {
          const today = new Date();
          const startOfDay = new Date(today);
          startOfDay.setHours(0, 0, 0, 0);
          const weekend = new Date(today);
          weekend.setDate(today.getDate() + (6 - today.getDay())); // Next Saturday
          weekend.setHours(23, 59, 59, 999);
          params.startDate = startOfDay.toISOString();
          params.endDate = weekend.toISOString();
        } else if (activeCategory !== 'Recommended') {
          params.category = activeCategory.toLowerCase();
        }
      }

      // Apply search
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await eventsService.getEvents(params).catch(() => null);
      const list = response?.data ?? [];
      if (Array.isArray(list)) setEvents(list);
    } catch (error: any) {
      console.error('Failed to load events:', error);
      try {
        Alert.alert('Error', 'Failed to load events. Please try again.');
      } catch (_) {}
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = useCallback(() => {
    loadEvents(true);
  }, [loadEvents]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // Debounce search - reload after user stops typing
    const timer = setTimeout(() => {
      loadEvents();
    }, 500);
    return () => clearTimeout(timer);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>plat</Text>
        <View style={styles.locationContainer}>
          <MapPin size={16} color={COLORS.accent} />
          <Text style={styles.locationText}>Nairobi, Kenya</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events, venues..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Categories */}
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

      {/* Featured Events Section */}
      {featuredEvents.length > 0 && (
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured Events</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
            {featuredEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.featuredCard}
                onPress={() => navigation.navigate('EventDetail', { eventId: event.id, event })}
              >
                {event.image ? (
                  <Image source={{ uri: event.image }} style={styles.featuredImage} />
                ) : (
                  <View style={[styles.featuredImage, { backgroundColor: COLORS.surface }]} />
                )}
                <View style={styles.featuredContent}>
                  <Text style={styles.featuredTitle} numberOfLines={2}>{event.title}</Text>
                  <Text style={styles.featuredDate}>{formatEventDate(event.startDate)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Event List */}
      {isLoading && events.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No events found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
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
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          initialNumToRender={8}
          windowSize={5}
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    fontStyle: 'italic',
    color: COLORS.primary,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    padding: 6,
    borderRadius: 16,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.m,
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.m,
    height: 48,
    borderRadius: 24,
    gap: SPACING.s,
  },
  placeholderText: {
    color: COLORS.textLight,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesList: {
    paddingHorizontal: SPACING.m,
    paddingBottom: SPACING.m,
    gap: SPACING.s,
  },
  chip: {
    paddingHorizontal: SPACING.m,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: SPACING.m,
    paddingBottom: 80,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
    paddingBottom: SPACING.m,
  },
  cardImage: {
    width: 120,
    height: 140,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  cardContent: {
    flex: 1,
    marginLeft: SPACING.m,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardMetaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  cardFooter: {
    marginTop: 4,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  cardOrganizer: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  featuredSection: {
    marginBottom: SPACING.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.s,
  },
  featuredList: {
    paddingHorizontal: SPACING.m,
    gap: SPACING.m,
  },
  featuredCard: {
    width: 280,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: SPACING.m,
  },
  featuredImage: {
    width: '100%',
    height: 160,
    backgroundColor: COLORS.surface,
  },
  featuredContent: {
    padding: SPACING.m,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  featuredDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.m,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.s,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});