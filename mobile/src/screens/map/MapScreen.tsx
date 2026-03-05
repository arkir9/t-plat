import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Platform,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { List, MapPin, Navigation, X, Search, Filter } from 'lucide-react-native';
import * as Location from 'expo-location';
import { eventsService, Event } from '../../services/eventsService';
import { format } from 'date-fns';
import { theme } from '../../design/theme';

let MapView: any = null;
let Marker: any = null;
let Callout: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Callout = Maps.Callout;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (e) {
    console.warn('react-native-maps not available:', e);
  }
}

const { width, height } = Dimensions.get('window');
const { colors } = theme;

const COLORS = {
  background: colors.dark.background,
  surface: colors.dark.surface,
  surfaceVariant: colors.dark.surfaceVariant,
  accent: colors.primary[500],
  text: colors.dark.text,
  textSecondary: colors.dark.textSecondary,
  white: '#FFFFFF',
};

const DEFAULT_LOCATION = {
  latitude: -1.2921,
  longitude: 36.8219,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

const MAP_CATEGORIES = [
  { label: 'All Events', value: 'all' },
  { label: 'Music', value: 'music' },
  { label: 'Workshops', value: 'workshops' },
  { label: 'Food', value: 'food' },
];

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const mapRef = useRef<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialRegion, setInitialRegion] = useState(DEFAULT_LOCATION);
  const [showListView, setShowListView] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const coords = await requestLocationPermission();
      if (cancelled) return;
      const lat = coords?.latitude ?? DEFAULT_LOCATION.latitude;
      const lng = coords?.longitude ?? DEFAULT_LOCATION.longitude;
      await loadNearbyEvents(lat, lng);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const requestLocationPermission = async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setInitialRegion(DEFAULT_LOCATION);
        Alert.alert(
          'Location permission needed',
          'We could not access your location. Showing events near Nairobi instead.'
        );
        return null;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setInitialRegion(newRegion);
      return { latitude: location.coords.latitude, longitude: location.coords.longitude };
    } catch (error) {
      console.error('Failed to get current location:', error);
      Alert.alert(
        'Location unavailable',
        'Your current location could not be determined in time. Showing events near Nairobi instead.'
      );
      setInitialRegion(DEFAULT_LOCATION);
      return null;
    }
  };

  const loadNearbyEvents = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const response = await eventsService.getNearbyEvents(lat, lng, 50).catch(() => null);
      const list = response?.data ?? [];
      if (Array.isArray(list)) setEvents(list);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriceDisplay = (event: Event): string => {
    if (event.ticketTypes?.length) {
      const min = Math.min(...event.ticketTypes.map((t: any) => Number(t.price)));
      if (min > 0) return event.ticketTypes.length > 1 ? `From KES ${min.toLocaleString()}` : `KES ${min.toLocaleString()}`;
    }
    if (event.price != null && event.price > 0) return `KES ${event.price.toLocaleString()}`;
    return 'Free';
  };

  const getEventCoordinate = (event: Event): { latitude: number; longitude: number } | null => {
    if (event.customLocation?.latitude && event.customLocation?.longitude) {
      return {
        latitude: Number(event.customLocation.latitude),
        longitude: Number(event.customLocation.longitude),
      };
    }
    if (event.venue?.venueLatitude && event.venue?.venueLongitude) {
      return {
        latitude: Number(event.venue.venueLatitude),
        longitude: Number(event.venue.venueLongitude),
      };
    }
    return null;
  };

  const eventsWithCoords = events.filter((e) => getEventCoordinate(e) !== null);

  const onMarkerPress = (event: Event) => {
    setSelectedEvent(event);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, { toValue: height, duration: 300, useNativeDriver: true }).start(() =>
      setSelectedEvent(null)
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeTop} edges={['top']} />
      <View style={styles.header}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoIconText}>P</Text>
        </View>
        <View style={styles.searchBar}>
          <Search size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Explore activities..."
            placeholderTextColor={COLORS.textSecondary}
          />
          <TouchableOpacity>
            <Filter size={20} color={COLORS.accent} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterRow}>
        {MAP_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[styles.filterChip, activeFilter === cat.value && styles.filterChipActive]}
            onPress={() => setActiveFilter(cat.value)}
          >
            <Text style={[styles.filterText, activeFilter === cat.value && styles.filterTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {Platform.OS === 'web' || !MapView ? (
        <View style={[styles.map, styles.mapPlaceholder]}>
          <Text style={styles.mapPlaceholderText}>Map View</Text>
          <Text style={styles.mapPlaceholderSubtext}>Not available on web</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {eventsWithCoords.map((event) => {
            const coordinate = getEventCoordinate(event)!;
            return (
              <Marker
                key={event.id}
                coordinate={coordinate}
                onPress={() => onMarkerPress(event)}
              >
                <View style={styles.markerContainer}>
                  <View style={styles.markerInner}>
                    <MapPin size={24} color={COLORS.white} />
                  </View>
                </View>
                {Callout && (
                  <Callout tooltip onPress={() => navigation.navigate('EventDetail', { eventId: event.id, event })}>
                    <View style={styles.calloutContainer}>
                      <Image
                        source={{ uri: event.images?.[0] || 'https://via.placeholder.com/100' }}
                        style={styles.calloutImage}
                      />
                      <View style={styles.calloutTextContainer}>
                        <Text style={styles.calloutTitle} numberOfLines={1}>
                          {event.title}
                        </Text>
                        <Text style={styles.calloutPrice}>{getPriceDisplay(event)}</Text>
                      </View>
                    </View>
                  </Callout>
                )}
              </Marker>
            );
          })}
        </MapView>
      )}

      <View style={styles.activitiesSection}>
        <View style={styles.activitiesHeader}>
          <Text style={styles.activitiesTitle}>Activities Near You</Text>
          <TouchableOpacity onPress={() => setShowListView((v) => !v)}>
            <Text style={styles.listViewToggle}>LIST VIEW</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={events.slice(0, 10)}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activitiesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.activityCard}
              onPress={() => navigation.navigate('EventDetail', { eventId: item.id, event: item })}
            >
              <View style={styles.activityImageWrapper}>
                <Image
                  source={{ uri: item.images?.[0] || 'https://via.placeholder.com/200' }}
                  style={styles.activityImage}
                />
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>TODAY</Text>
                </View>
              </View>
              <Text style={styles.activityTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.activityMeta}>
                <Text style={styles.activityMetaText}>0.5 mi</Text>
                <Text style={styles.activityMetaText}>
                  {item.startDate ? format(new Date(item.startDate), 'h:mm a') : '--'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.getTicketsBtn}
                onPress={() => navigation.navigate('EventDetail', { eventId: item.id, event: item })}
              >
                <Text style={styles.getTicketsText}>GET TICKETS</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      </View>

      <TouchableOpacity
        style={styles.locationButton}
        onPress={async () => {
          try {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            const region = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            };
            mapRef.current?.animateToRegion(region);
            loadNearbyEvents(loc.coords.latitude, loc.coords.longitude);
          } catch (error) {
            console.error('Failed to recenter on current location:', error);
            Alert.alert(
              'Location timeout',
              'We could not get your current location in time. Showing events near Nairobi instead.'
            );
            mapRef.current?.animateToRegion(DEFAULT_LOCATION);
            loadNearbyEvents(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
          }
        }}
      >
        <Navigation size={24} color={COLORS.white} />
      </TouchableOpacity>

      {selectedEvent && (
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.dragHandle} />
          <View style={styles.previewContent}>
            <Image
              source={{ uri: selectedEvent.images?.[0] || 'https://via.placeholder.com/150' }}
              style={styles.previewImage}
            />
            <View style={styles.previewInfo}>
              <Text style={styles.previewTitle} numberOfLines={1}>
                {selectedEvent.title}
              </Text>
              <Text style={styles.previewMeta}>
                {format(new Date(selectedEvent.startDate), 'MMM d • h:mm a')}
              </Text>
              <Text style={styles.previewMeta}>
                {selectedEvent.customLocation?.address || selectedEvent.venue?.name || 'Location TBD'}
              </Text>
              <View style={styles.previewFooter}>
                <Text style={styles.previewPrice}>{getPriceDisplay(selectedEvent)}</Text>
                <TouchableOpacity
                  style={styles.viewDetailsBtn}
                  onPress={() =>
                    navigation.navigate('EventDetail', { eventId: selectedEvent.id, event: selectedEvent })
                  }
                >
                  <Text style={styles.viewDetailsText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={closeSheet}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeTop: { backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIconText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  filterChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipActive: { backgroundColor: COLORS.accent },
  filterText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  filterTextActive: { color: COLORS.white },
  map: { width: '100%', flex: 1 },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceVariant,
  },
  mapPlaceholderText: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  mapPlaceholderSubtext: { color: COLORS.textSecondary, marginTop: 8 },
  markerContainer: { alignItems: 'center', justifyContent: 'center' },
  markerInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calloutContainer: {
    width: 180,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 8,
  },
  calloutImage: { width: '100%', height: 90, borderRadius: 8, marginBottom: 8, backgroundColor: COLORS.surfaceVariant },
  calloutTextContainer: { paddingHorizontal: 4 },
  calloutTitle: { fontWeight: 'bold', fontSize: 13, color: COLORS.text, marginBottom: 2 },
  calloutPrice: { fontSize: 12, color: COLORS.accent, fontWeight: '600' },
  activitiesSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    maxHeight: 260,
  },
  activitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  activitiesTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  listViewToggle: { fontSize: 12, fontWeight: '700', color: COLORS.accent },
  activitiesList: { paddingHorizontal: 16, paddingBottom: 24, gap: 16 },
  activityCard: {
    width: 200,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  activityImageWrapper: { height: 100, position: 'relative' },
  activityImage: { width: '100%', height: '100%', backgroundColor: COLORS.surfaceVariant },
  todayBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  todayBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.white },
  activityTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 10, paddingHorizontal: 12 },
  activityMeta: { flexDirection: 'row', gap: 12, paddingHorizontal: 12, marginTop: 4 },
  activityMetaText: { fontSize: 12, color: COLORS.textSecondary },
  getTicketsBtn: {
    margin: 12,
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  getTicketsText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  locationButton: {
    position: 'absolute',
    bottom: 280,
    right: 16,
    backgroundColor: COLORS.surface,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 220,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 10,
  },
  previewContent: { flexDirection: 'row', padding: 20, gap: 16 },
  previewImage: { width: 100, height: 120, borderRadius: 12, backgroundColor: COLORS.surfaceVariant },
  previewInfo: { flex: 1, justifyContent: 'center' },
  previewTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 4, color: COLORS.text },
  previewMeta: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 2 },
  previewPrice: { fontWeight: 'bold', fontSize: 16, color: COLORS.text },
  previewFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' },
  viewDetailsBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewDetailsText: { color: COLORS.white, fontWeight: 'bold' },
  closeBtn: { position: 'absolute', top: 10, right: 10 },
});
