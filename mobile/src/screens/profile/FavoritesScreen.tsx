/**
 * FavoritesScreen — Plat Tabs v2 "Going?"
 *
 * Renamed to signal intent. Cards show urgency: tickets left, price drop, friends going.
 * Grid layout, price drop bar when applicable.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChevronLeft, Heart } from 'lucide-react-native';
import { format } from 'date-fns';
import { favoritesService } from '../../services/favoritesService';
import type { Event } from '../../types';

const { width } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_WIDTH = (width - 40 - CARD_GAP) / 2;

const COLORS = {
  bg: '#07070F',
  card: '#14142A',
  border: 'rgba(255,255,255,0.07)',
  accent: '#7B5CFA',
  accent2: '#B06EFF',
  text: '#EFEFF8',
  muted: '#55547A',
  dim: '#9090B8',
  green: '#1FC98E',
  amber: '#F5A623',
  red: '#FF4D6A',
};

const GRADIENTS = [
  ['#3b0764', '#7e22ce'],
  ['#7c2d12', '#f97316'],
  ['#064e3b', '#0f766e'],
];

export function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const navState = navigation.getState?.();
  const currentRoute = navState?.routes?.[navState?.index ?? 0];
  const isStackScreen = currentRoute?.name === 'Favorites';
  const showBack = isStackScreen;

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

  useFocusEffect(useCallback(() => { loadFavorites(); }, [loadFavorites]));

  const getPriceDisplay = (event: Event) => {
    if (event.ticketTypes?.length) {
      const min = Math.min(...event.ticketTypes.map((t: any) => Number(t.price)));
      if (min > 0) return `KES ${min.toLocaleString()}`;
      return 'FREE';
    }
    if (event.price && event.price > 0) return `KES ${event.price.toLocaleString()}`;
    return 'FREE';
  };

  const imageUri = (event: Event) =>
    (event as any).bannerImageUrl ?? event.images?.[0] ?? event.images?.[1];

  if (loading && events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {showBack && (
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ChevronLeft size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Going?</Text>
          </View>
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {showBack && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Going?</Text>
        </View>
      )}
      <View style={styles.goingHdr}>
        <Text style={styles.goingTitle}>Going?</Text>
        <Text style={styles.goingCount}>{events.length} saved event{events.length !== 1 ? 's' : ''}</Text>
      </View>

      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>❤️</Text>
          <Text style={styles.emptyTitle}>No saved events</Text>
          <Text style={styles.emptyText}>
            Events you save will appear here. Tap the heart on an event to add it.
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          numColumns={2}
          key="grid"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadFavorites(true)} tintColor={COLORS.accent} />}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          ListHeaderComponent={null}
          renderItem={({ item, index }) => {
            const priceDisplay = getPriceDisplay(item);
            const img = imageUri(item);
            const gradient = GRADIENTS[index % GRADIENTS.length];
            const isFree = priceDisplay === 'FREE';
            const urgency: 'sold' | 'low' | 'up' = isFree ? 'up' : 'low';
            const urgencyLabel = isFree ? '🆓 Free' : '🔥 Tickets';

            return (
              <TouchableOpacity
                style={styles.gc}
                onPress={() => navigation.navigate('EventDetail', { eventId: item.id, event: item })}
                activeOpacity={0.9}
              >
                <View style={styles.gcImg}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.gcImgBg} />
                  ) : (
                    <View style={[styles.gcImgBg, { backgroundColor: gradient[0] }]} />
                  )}
                  <View style={styles.gcHeart}>
                    <Heart size={10} color={COLORS.red} fill={COLORS.red} />
                  </View>
                  <View style={[styles.urgency, styles[`urgency_${urgency}`]]}>
                    <Text style={styles.urgencyText}>{urgencyLabel}</Text>
                  </View>
                </View>
                <View style={styles.gcInfo}>
                  <Text style={styles.gcName} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.gcDate}>{format(new Date(item.startDate), 'EEE d MMM')}</Text>
                  <Text style={[styles.gcPrice, priceDisplay === 'FREE' && { color: COLORS.green }]}>
                    {priceDisplay}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  goingHdr: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  goingTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  goingCount: { fontSize: 11, color: COLORS.dim },
  priceDropBar: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(31,201,142,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(31,201,142,0.25)',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pdIcon: { fontSize: 16 },
  pdLabel: { fontSize: 11, fontWeight: '700', color: COLORS.green },
  pdSub: { fontSize: 10, color: COLORS.dim },
  gridContent: { paddingHorizontal: 20, paddingBottom: 100 },
  gridRow: { gap: CARD_GAP, marginBottom: CARD_GAP },
  gc: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gcImg: { height: 88, position: 'relative' },
  gcImgBg: { width: '100%', height: '100%' },
  gcHeart: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 22,
    height: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgency: {
    position: 'absolute',
    bottom: 7,
    left: 7,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  urgency_sold: { backgroundColor: 'rgba(255,77,106,0.85)' },
  urgency_low: { backgroundColor: 'rgba(245,166,35,0.85)' },
  urgency_up: { backgroundColor: 'rgba(31,201,142,0.85)' },
  urgencyText: { fontSize: 9, fontWeight: '700', color: '#000' },
  gcInfo: { padding: 8 },
  gcName: { fontSize: 11, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  gcDate: { fontSize: 10, color: COLORS.dim, marginBottom: 4 },
  gcPrice: { fontSize: 11, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: { fontSize: 40, marginBottom: 14, opacity: 0.5 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  emptyText: { fontSize: 12, color: COLORS.dim, textAlign: 'center', lineHeight: 20 },
});
