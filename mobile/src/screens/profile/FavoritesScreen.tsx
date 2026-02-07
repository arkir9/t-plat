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

const COLORS = {
  primary: '#000000',
  accent: '#8B5CF6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
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

  const formatPrice = (price?: number, currency?: string) => {
    if (!price || price === 0) return 'Free';
    return `${currency === 'USD' ? '$' : 'KES'} ${price?.toLocaleString()}`;
  };

  const getLocation = (event: Event) => {
    if (event.customLocation) return `${event.customLocation.address}, ${event.customLocation.city}`;
    return 'Location TBD';
  };

  const imageUri = (event: Event) =>
    (event as any).bannerImageUrl ?? (event as any).images?.[0] ?? event.image;

  if (loading && events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Favorites</Text>
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
          <ChevronLeft size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
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
                <View style={[styles.cardImage, { backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' }]}>
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
                <Text style={styles.cardPrice}>{formatPrice(item.price, item.currency)}</Text>
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
    borderBottomColor: COLORS.surface,
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
  cardImage: { width: 100, height: 100, backgroundColor: '#EEE' },
  cardContent: { flex: 1, padding: 12, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  metaText: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  cardPrice: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary, marginTop: 4 },
});
