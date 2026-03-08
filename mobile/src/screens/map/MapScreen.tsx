/**
 * MapScreen.tsx — full replacement with supercluster clustering
 *
 * Dep to add: npm install supercluster @types/supercluster
 * (supercluster is a pure-JS library, no native linking needed)
 *
 * Clustering behaviour:
 *  - Markers cluster when zoom is low (latDelta > ~0.05)
 *  - Tap a cluster → map zooms in to expand it
 *  - Tap an individual marker → bottom sheet preview
 *  - "Tonight" filter chip wired to getTonightEvents()
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Image,
  Dimensions, Animated, Platform, ActivityIndicator,
  FlatList, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { List, MapPin, Navigation, X, Search } from 'lucide-react-native';
import * as Location from 'expo-location';
import Supercluster from 'supercluster';
import { eventsService, Event } from '../../services/eventsService';
import { format } from 'date-fns';
import { theme } from '../../design/theme';

let MapView: any = null, Marker: any = null, Callout: any = null, PROVIDER_GOOGLE: any = null;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default; Marker = Maps.Marker;
    Callout = Maps.Callout; PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch {}
}

const { width, height } = Dimensions.get('window');
const { colors } = theme;

const COLORS = {
  background: colors.dark.background, surface: colors.dark.surface,
  surfaceVariant: colors.dark.surfaceVariant, accent: colors.primary[500],
  text: colors.dark.text, textSecondary: colors.dark.textSecondary,
  white: '#FFFFFF', amber: '#F5A623', green: '#1FC98E',
};

const DEFAULT_REGION = { latitude: -4.0435, longitude: 39.6682, latitudeDelta: 0.15, longitudeDelta: 0.15 };
const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: '🌙 Tonight', value: 'tonight' },
  { label: 'Music', value: 'music' },
  { label: 'Food', value: 'food' },
  { label: 'Sports', value: 'sports' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getCoord(event: Event): { latitude: number; longitude: number } | null {
  const loc = (event as any).location;
  if (loc?.latitude && loc?.longitude) return { latitude: +loc.latitude, longitude: +loc.longitude };
  if ((event as any).latitude && (event as any).longitude)
    return { latitude: +(event as any).latitude, longitude: +(event as any).longitude };
  return null;
}

function getPriceDisplay(event: Event): string {
  const types = (event as any).ticketTypes ?? [];
  if (!types.length) return '';
  const min = Math.min(...types.map((t: any) => t.price ?? 0));
  return min === 0 ? 'Free' : `KES ${min.toLocaleString()}`;
}

// ── Supercluster setup ────────────────────────────────────────────────────────
const clusterIndex = new Supercluster({ radius: 60, maxZoom: 16 });

function regionToBox(region: any) {
  return [
    region.longitude - region.longitudeDelta / 2,
    region.latitude - region.latitudeDelta / 2,
    region.longitude + region.longitudeDelta / 2,
    region.latitude + region.latitudeDelta / 2,
  ] as [number, number, number, number];
}

function regionToZoom(region: any): number {
  // Approximate zoom level from latitudeDelta
  return Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MapScreen() {
  const navigation = useNavigation<any>();
  const mapRef = useRef<any>(null);

  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [clusters, setClusters] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showListView, setShowListView] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const slideAnim = useRef(new Animated.Value(height)).current;

  // ── Load events ─────────────────────────────────────────────────────────────
  const loadEvents = useCallback(async (filter: string, search: string) => {
    setIsLoading(true);
    try {
      let res;
      if (filter === 'tonight') {
        res = await eventsService.getTonightEvents({ limit: 100 }).catch(() => null);
      } else {
        const params: any = { limit: 100, status: 'published' };
        if (filter !== 'all') params.eventType = filter;
        if (search.trim()) params.search = search.trim();
        res = await eventsService.getEvents(params).catch(() => null);
      }
      const events = res?.data ?? [];
      setAllEvents(events);

      // Feed events with coords into supercluster
      const points = events
        .map((e) => {
          const coord = getCoord(e);
          if (!coord) return null;
          return {
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [coord.longitude, coord.latitude] },
            properties: { eventId: e.id, event: e },
          };
        })
        .filter(Boolean) as Supercluster.PointFeature<{ eventId: string; event: Event }>[];

      clusterIndex.load(points);
      updateClusters(region, points.length);
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { loadEvents(activeFilter, searchQuery); }, [activeFilter]);

  // ── Re-cluster on region change ─────────────────────────────────────────────
  const updateClusters = useCallback((r: typeof DEFAULT_REGION, _count?: number) => {
    const zoom = regionToZoom(r);
    const box = regionToBox(r);
    const c = clusterIndex.getClusters(box, zoom);
    setClusters(c);
  }, []);

  const onRegionChangeComplete = useCallback((r: any) => {
    setRegion(r);
    updateClusters(r);
  }, [updateClusters]);

  // ── Get user location ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const newRegion = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 600);
      }
    })();
  }, []);

  // ── Bottom sheet animation ──────────────────────────────────────────────────
  const showSheet = (event: Event) => {
    setSelectedEvent(event);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 9 }).start();
  };

  const hideSheet = () => {
    Animated.timing(slideAnim, { toValue: height, useNativeDriver: true, duration: 200 }).start(() =>
      setSelectedEvent(null),
    );
  };

  // ── Cluster tap: zoom in ────────────────────────────────────────────────────
  const onClusterPress = (cluster: any) => {
    const [lng, lat] = cluster.geometry.coordinates;
    const expansionZoom = Math.min(clusterIndex.getClusterExpansionZoom(cluster.id), 18);
    const newDelta = 360 / Math.pow(2, expansionZoom);
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: newDelta, longitudeDelta: newDelta },
      400,
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const eventsWithCoords = useMemo(() => allEvents.filter((e) => getCoord(e)), [allEvents]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>p</Text>
        </View>
        <View style={styles.searchBar}>
          <Search size={14} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events on map…"
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={() => loadEvents(activeFilter, searchQuery)}
          />
        </View>
        <TouchableOpacity onPress={() => setShowListView((v) => !v)} style={styles.listToggle}>
          <List size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Category chips */}
      <View style={styles.filterRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.filterChip,
              activeFilter === cat.value && styles.filterChipActive,
              cat.value === 'tonight' && activeFilter !== 'tonight' && styles.filterChipTonight,
            ]}
            onPress={() => setActiveFilter(cat.value)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === cat.value && styles.filterTextActive,
                cat.value === 'tonight' && activeFilter !== 'tonight' && { color: COLORS.amber },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map / List toggle */}
      {showListView ? (
        <FlatList
          data={allEvents}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listCard}
              onPress={() => navigation.navigate('EventDetail', { eventId: item.id, event: item })}
            >
              <Image
                source={{ uri: (item as any).bannerImageUrl || item.images?.[0] || 'https://via.placeholder.com/100' }}
                style={styles.listCardImage}
              />
              <View style={styles.listCardInfo}>
                <Text style={styles.listCardTitle} numberOfLines={2}>{item.title}</Text>
                {item.startDate && (
                  <Text style={styles.listCardMeta}>{format(new Date(item.startDate), 'EEE d MMM · h:mm a')}</Text>
                )}
                <Text style={styles.listCardPrice}>{getPriceDisplay(item)}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            isLoading ? <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} /> : null
          }
        />
      ) : Platform.OS === 'web' || !MapView ? (
        <View style={[styles.map, styles.mapPlaceholder]}>
          <Text style={styles.mapPlaceholderText}>Map not available on web</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton={false}
          onRegionChangeComplete={onRegionChangeComplete}
        >
          {clusters.map((cluster, index) => {
            const [lng, lat] = cluster.geometry.coordinates;
            const isCluster = cluster.properties.cluster;

            if (isCluster) {
              const count = cluster.properties.point_count;
              const size = Math.min(20 + count * 3, 58); // scale with count
              return (
                <Marker
                  key={`cluster-${cluster.id ?? index}`}
                  coordinate={{ latitude: lat, longitude: lng }}
                  onPress={() => onClusterPress(cluster)}
                >
                  <View style={[styles.clusterMarker, { width: size, height: size, borderRadius: size / 2 }]}>
                    <Text style={styles.clusterCount}>{count}</Text>
                  </View>
                </Marker>
              );
            }

            const event: Event = cluster.properties.event;
            return (
              <Marker
                key={`event-${cluster.properties.eventId}`}
                coordinate={{ latitude: lat, longitude: lng }}
                onPress={() => showSheet(event)}
              >
                <View style={styles.markerContainer}>
                  <View style={styles.markerInner}>
                    <MapPin size={18} color={COLORS.white} />
                  </View>
                  <View style={styles.markerTail} />
                </View>
              </Marker>
            );
          })}
        </MapView>
      )}

      {/* My location FAB */}
      {!showListView && (
        <TouchableOpacity
          style={styles.locationFab}
          onPress={async () => {
            const loc = await Location.getCurrentPositionAsync({}).catch(() => null);
            if (loc) {
              const r = { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 };
              mapRef.current?.animateToRegion(r, 500);
            }
          }}
        >
          <Navigation size={20} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Bottom sheet preview */}
      {selectedEvent && (
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sheetHandle} />
          <TouchableOpacity style={styles.sheetClose} onPress={hideSheet}>
            <X size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <View style={styles.sheetContent}>
            <Image
              source={{ uri: (selectedEvent as any).bannerImageUrl || selectedEvent.images?.[0] || 'https://via.placeholder.com/120' }}
              style={styles.sheetImage}
            />
            <View style={styles.sheetInfo}>
              <Text style={styles.sheetTitle} numberOfLines={2}>{selectedEvent.title}</Text>
              {selectedEvent.startDate && (
                <Text style={styles.sheetMeta}>{format(new Date(selectedEvent.startDate), 'EEE d MMM · h:mm a')}</Text>
              )}
              <Text style={styles.sheetPrice}>{getPriceDisplay(selectedEvent)}</Text>
              <TouchableOpacity
                style={styles.sheetBtn}
                onPress={() => { hideSheet(); navigation.navigate('EventDetail', { eventId: selectedEvent.id, event: selectedEvent }); }}
              >
                <Text style={styles.sheetBtnText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={COLORS.accent} size="large" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  logoBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 16, fontWeight: '800', color: COLORS.white, fontStyle: 'italic' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: 12, height: 40, borderRadius: 20, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  listToggle: { width: 36, height: 36, backgroundColor: COLORS.surface, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  filterRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.surface },
  filterChipActive: { backgroundColor: COLORS.accent },
  filterChipTonight: { borderWidth: 1.5, borderColor: COLORS.amber, backgroundColor: 'rgba(245,166,35,0.08)' },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.white },

  map: { flex: 1 },
  mapPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surfaceVariant },
  mapPlaceholderText: { color: COLORS.text, fontSize: 16 },

  // Cluster marker
  clusterMarker: { backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  clusterCount: { color: COLORS.white, fontSize: 12, fontWeight: '800' },

  // Individual marker
  markerContainer: { alignItems: 'center' },
  markerInner: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.white },
  markerTail: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent, marginTop: -2 },

  locationFab: { position: 'absolute', bottom: 200, right: 16, width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },

  // Bottom sheet
  sheet: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
  sheetHandle: { width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  sheetClose: { position: 'absolute', top: 14, right: 16 },
  sheetContent: { flexDirection: 'row', padding: 20, gap: 14, marginTop: 6 },
  sheetImage: { width: 100, height: 110, borderRadius: 12 },
  sheetInfo: { flex: 1, justifyContent: 'center' },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  sheetMeta: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  sheetPrice: { fontSize: 13, fontWeight: '700', color: COLORS.green, marginBottom: 10 },
  sheetBtn: { alignSelf: 'flex-start', backgroundColor: COLORS.accent, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20 },
  sheetBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },

  // List view
  listCard: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 14, overflow: 'hidden', gap: 0 },
  listCardImage: { width: 90, height: 90 },
  listCardInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  listCardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  listCardMeta: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  listCardPrice: { fontSize: 13, fontWeight: '700', color: COLORS.green },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,7,15,0.5)', justifyContent: 'center', alignItems: 'center' },
});
