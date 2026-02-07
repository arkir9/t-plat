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
  Alert,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { List, MapPin, Navigation, X } from 'lucide-react-native';
import * as Location from 'expo-location';
import { eventsService, Event } from '../../services/eventsService';
import { format } from 'date-fns';

// Conditionally import MapView only on native platforms
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (e) {
    console.warn('react-native-maps not available:', e);
  }
}

const { width, height } = Dimensions.get('window');
const COLORS = { primary: '#000', accent: '#8B5CF6', white: '#FFF', text: '#1A1A1A' };

// Default Nairobi coordinates
const DEFAULT_LOCATION = {
  latitude: -1.2921,
  longitude: 36.8219,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const mapRef = useRef<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationReady, setLocationReady] = useState(false);
  const [initialRegion, setInitialRegion] = useState(DEFAULT_LOCATION);
  const [showListView, setShowListView] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;

  // Show map immediately; fetch location and events in background
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const coords = await requestLocationPermission();
      if (cancelled) return;
      setLocationReady(true);
      const lat = coords?.latitude ?? DEFAULT_LOCATION.latitude;
      const lng = coords?.longitude ?? DEFAULT_LOCATION.longitude;
      await loadNearbyEvents(lat, lng);
    })();
    return () => { cancelled = true; };
  }, []);

  const requestLocationPermission = async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setInitialRegion(DEFAULT_LOCATION);
        return null;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        mayShowUserSettings: true,
        maxAge: 60000,
        timeout: 10000,
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
      console.error('Location permission error:', error);
      setInitialRegion(DEFAULT_LOCATION);
      return null;
    }
  };

  const loadNearbyEvents = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const response = await eventsService.getNearbyEvents(lat, lng, 25).catch(() => null);
      const list = response?.data ?? [];
      if (Array.isArray(list)) setEvents(list);
    } catch (error: any) {
      console.error('Failed to load nearby events:', error);
      try { Alert.alert('Error', 'Failed to load nearby events. Please try again.'); } catch (_) {}
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price?: number, currency?: string) => {
    if (!price || price === 0) return 'Free';
    const currencySymbol = currency === 'USD' ? '$' : 'KES';
    return `${currencySymbol} ${price.toLocaleString()}`;
  };

  const getEventCoordinate = (event: Event): { latitude: number; longitude: number } | null => {
    const loc = event.customLocation ?? (event as any).custom_location;
    if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
      return { latitude: loc.latitude, longitude: loc.longitude };
    }
    return null;
  };

  const eventsWithCoords = events.filter((e) => getEventCoordinate(e) !== null);

  const onMarkerPress = (event: Event) => {
    setSelectedEvent(event);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSelectedEvent(null));
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' || !MapView ? (
        <View style={[styles.map, styles.mapPlaceholder]}>
          <Text style={styles.mapPlaceholderText}>Map View</Text>
          <Text style={styles.mapPlaceholderSubtext}>Available on mobile devices</Text>
        </View>
      ) : !MapView ? null : (
        <MapView
          ref={mapRef}
          key={`map-${initialRegion.latitude}-${initialRegion.longitude}`}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={initialRegion}
          customMapStyle={mapStyle}
          showsUserLocation={true}
          showsMyLocationButton={true}
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
                  <MapPin size={24} color={COLORS.accent} />
                </View>
              </Marker>
            );
          })}
        </MapView>
      )}

      {isLoading && events.length === 0 && MapView && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color={COLORS.accent} />
          <Text style={styles.loadingOverlayText}>Loading events...</Text>
        </View>
      )}

      {/* Top Filter Bar - same filters as home, apply to nearby events */}
      <View style={styles.filterOverlay}>
        {['All', 'Today', 'This Weekend', 'Music'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={styles.filterChip}
            onPress={() => {
              const today = new Date();
              const startOfDay = new Date(today);
              startOfDay.setHours(0, 0, 0, 0);
              const endOfDay = new Date(today);
              endOfDay.setHours(23, 59, 59, 999);
              const weekend = new Date(today);
              weekend.setDate(today.getDate() + (6 - today.getDay()));
              weekend.setHours(23, 59, 59, 999);
              if (filter === 'All') loadNearbyEvents(initialRegion.latitude, initialRegion.longitude);
              else if (filter === 'Today') eventsService.getEvents({ startDate: startOfDay.toISOString(), endDate: endOfDay.toISOString(), limit: 50 }).then((r) => setEvents(r?.data ?? []));
              else if (filter === 'This Weekend') eventsService.getEvents({ startDate: startOfDay.toISOString(), endDate: weekend.toISOString(), limit: 50 }).then((r) => setEvents(r?.data ?? []));
              else eventsService.getEvents({ category: filter.toLowerCase(), limit: 50 }).then((r) => setEvents(r?.data ?? []));
            }}
          >
            <Text style={styles.filterText}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List View Toggle - shows same events as list on map */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowListView((v) => !v)}
      >
        <List size={20} color={COLORS.primary} />
        <Text style={styles.toggleText}>{showListView ? 'Map View' : 'List View'}</Text>
      </TouchableOpacity>

      {/* List overlay when List View is on */}
      {showListView && (
        <View style={styles.listOverlay}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>Events ({events.length})</Text>
            <TouchableOpacity onPress={() => setShowListView(false)}>
              <Text style={styles.listHeaderClose}>Close</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listRow}
                onPress={() => {
                  setShowListView(false);
                  setSelectedEvent(item);
                  Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
                }}
              >
                {item.image || (item as any).bannerImageUrl || (item as any).images?.[0] ? (
                  <Image source={{ uri: item.image || (item as any).bannerImageUrl || (item as any).images?.[0] }} style={styles.listRowImage} />
                ) : (
                  <View style={[styles.listRowImage, { backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center' }]}>
                    <MapPin size={24} color="#999" />
                  </View>
                )}
                <View style={styles.listRowContent}>
                  <Text style={styles.listRowTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.listRowMeta}>{format(new Date(item.startDate), 'EEE, MMM d • h:mm a')}</Text>
                  <Text style={styles.listRowPrice}>{formatPrice(item.price, item.currency)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Map Controls */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={async () => {
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
              mayShowUserSettings: true,
              maxAge: 30000,
              timeout: 15000,
            });
            const newRegion = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            };
            if (mapRef.current) {
              mapRef.current.animateToRegion(newRegion, 400);
            }
            await loadNearbyEvents(location.coords.latitude, location.coords.longitude);
          } catch (error) {
            Alert.alert('Error', 'Failed to get your location');
          }
        }}
      >
        <Navigation size={24} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Event Preview Bottom Sheet */}
      {selectedEvent && (
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.dragHandle} />
          
          <View style={styles.previewContent}>
            {(selectedEvent.image ?? (selectedEvent as any).images?.[0]) ? (
              <Image source={{ uri: selectedEvent.image ?? (selectedEvent as any).images?.[0] }} style={styles.previewImage} />
            ) : (
              <View style={[styles.previewImage, { backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center' }]}>
                <MapPin size={32} color="#999" />
              </View>
            )}
            
            <View style={styles.previewInfo}>
              <View>
                <Text style={styles.previewTitle} numberOfLines={2}>{selectedEvent.title}</Text>
                <Text style={styles.previewMeta}>
                  {format(new Date(selectedEvent.startDate), 'EEE, MMM d • h:mm a')}
                </Text>
                <Text style={styles.previewMeta} numberOfLines={1}>
                  {(() => {
                    const loc = selectedEvent.customLocation ?? (selectedEvent as any).custom_location;
                    return loc?.address && loc?.city
                      ? `${loc.address}, ${loc.city}`
                      : 'Location TBD';
                  })()}
                </Text>
              </View>
              
              <View>
                <Text style={styles.previewPrice}>
                  {formatPrice(selectedEvent.price, selectedEvent.currency)}
                </Text>
                <TouchableOpacity
                  style={styles.viewDetailsBtn}
                  onPress={() => {
                    closeSheet();
                    navigation?.navigate('EventDetail', { eventId: selectedEvent.id, event: selectedEvent });
                  }}
                >
                  <Text style={styles.viewDetailsText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity style={styles.closeBtn} onPress={closeSheet}>
              <X size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { width: '100%', height: '100%' },
  mapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  mapPlaceholderText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    color: '#999',
    fontSize: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loadingOverlayText: {
    color: COLORS.white,
    fontSize: 13,
  },
  markerContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterOverlay: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: { fontWeight: '600', fontSize: 13 },
  toggleButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleText: { fontWeight: 'bold', fontSize: 14 },
  locationButton: {
    position: 'absolute',
    bottom: 250,
    right: 16,
    backgroundColor: COLORS.white,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCC',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  previewContent: { flexDirection: 'row', padding: 16, gap: 16, flex: 1 },
  previewImage: {
    width: 120,
    height: 140,
    borderRadius: 12,
    backgroundColor: '#EEE',
  },
  previewInfo: { flex: 1, justifyContent: 'space-between', paddingVertical: 4 },
  previewTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 4 },
  previewMeta: { color: '#666', fontSize: 13, marginBottom: 2 },
  previewPrice: { fontWeight: 'bold', fontSize: 18, color: COLORS.primary },
  viewDetailsBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  viewDetailsText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  closeBtn: { position: 'absolute', top: 0, right: 0, padding: 4 },
  listOverlay: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  listHeaderTitle: { fontWeight: 'bold', fontSize: 16 },
  listHeaderClose: { color: COLORS.accent, fontWeight: '600' },
  listRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  listRowImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#EEE',
  },
  listRowContent: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  listRowTitle: { fontWeight: '600', fontSize: 15, marginBottom: 4 },
  listRowMeta: { color: '#666', fontSize: 12, marginBottom: 2 },
  listRowPrice: { fontWeight: 'bold', fontSize: 14 },
});

const mapStyle = [
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
];