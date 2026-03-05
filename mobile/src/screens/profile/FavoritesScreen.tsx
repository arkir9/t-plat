import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChevronLeft, Heart, Calendar, MapPin } from 'lucide-react-native';
import { format } from 'date-fns';
import { favoritesService } from '../../services/favoritesService';
import { eventsService, Event } from '../../services/eventsService';
import { theme } from '../../design/theme';

const { colors } = theme;
const COLORS = {
  accent: colors.primary[500],
  background: colors.dark.background,
  surface: colors.dark.surface,
  surfaceVariant: colors.dark.surfaceVariant,
  textPrimary: colors.dark.text,
  textSecondary: colors.dark.textSecondary,
};

export function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const list = await favoritesService.list();
      setEvents(Array.isArray(list) ? list : []);
    } catch (_) {
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites]),
  );

  const getPriceDisplay = (event: Event): string | null => {
    if (event.ticketTypes?.length) {
      const min = Math.min(...event.ticketTypes.map((t: any) => Number(t.price)));
      if (min > 0) return event.ticketTypes.length > 1 ? `From KES ${min.toLocaleString()}` : `KES ${min.toLocaleString()}`;
    }
    if (event.price != null && event.price > 0) {
      const sym = event.currency === 'USD' ? '$' : 'KES';
      return `${sym} ${event.price.toLocaleString()}`;
    }
    return null;
  };

  const getLocation = (event: Event) => {
    if (event.customLocation) return `${event.customLocation.address}, ${event.customLocation.city}`;
    return 'Location TBD';
  };

  const imageUri = (event: Event) =>
    (event as any).bannerImageUrl ?? event.images?.[1] ?? event.images?.[0];

  if (loading && events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved</Text>
      </View>
      {events.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadFavorites(true)} />}
        >
          <Heart size={64} color={COLORS.textSecondary} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySubtext}>
            Events you save will appear here. Tap the heart on an event to add it.
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadFavorites(true)} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('EventDetail', { eventId: item.id, event: item })}
              activeOpacity={0.9}
            >
              {imageUri(item) ? (
                <Image source={{ uri: imageUri(item) }} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, { backgroundColor: COLORS.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
                  <Calendar size={32} color={COLORS.textSecondary} />
                </View>
              )}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.metaRow}>
                  <Calendar size={14} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{format(new Date(item.startDate), 'EEE, MMM d • h:mm a')}</Text>
                </View>
                <View style={styles.metaRow}>
                  <MapPin size={14} color={COLORS.textSecondary} />
                  <Text style={styles.metaText} numberOfLines={1}>{getLocation(item)}</Text>
                </View>
                {getPriceDisplay(item) != null && <Text style={styles.cardPrice}>{getPriceDisplay(item)}</Text>}
              </View>
            </TouchableOpacity>
          )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backButton: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: COLORS.textSecondary },
  emptyContainer: { flexGrow: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtext: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardImage: { width: 100, height: 100, backgroundColor: COLORS.surfaceVariant },
  cardContent: { flex: 1, padding: 12, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  metaText: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  cardPrice: { fontSize: 14, fontWeight: 'bold', color: COLORS.accent, marginTop: 4 },
});
