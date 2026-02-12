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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { List, MapPin, Navigation, X } from 'lucide-react-native';
import * as Location from 'expo-location';
import { eventsService, Event } from '../../services/eventsService';
import { format } from 'date-fns';

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
  const [initialRegion, setInitialRegion] = useState(DEFAULT_LOCATION);
  const [showListView, setShowListView] = useState(false);
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
    return () => { cancelled = true; };
  }, []);

  const requestLocationPermission = async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setInitialRegion(DEFAULT_LOCATION);
        return null;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setInitialRegion(newRegion);
      return { latitude: location.coords.latitude, longitude: location.coords.longitude };
    } catch (error) {
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

  const getPriceDisplay = (event: Event): string | null => {
    if (event.ticketTypes?.length) {
      const min = Math.min(...event.ticketTypes.map((t: any) => Number(t.price)));
      if (min > 0) return event.ticketTypes.length > 1 ? `From KES ${min.toLocaleString()}` : `KES ${min.toLocaleString()}`;
    }
    if (event.price != null && event.price > 0) return `KES ${event.price.toLocaleString()}`;
    return null;
  };

  const getEventCoordinate = (event: Event): { latitude: number; longitude: number } | null => {
    if (event.customLocation?.latitude && event.customLocation?.longitude) {
      return { 
        latitude: Number(event.customLocation.latitude), 
        longitude: Number(event.customLocation.longitude) 
      };
    }
    if (event.venue && event.venue.venueLatitude && event.venue.venueLongitude) {
      return { 
        latitude: Number(event.venue.venueLatitude), 
        longitude: Number(event.venue.venueLongitude) 
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
    Animated.timing(slideAnim, { toValue: height, duration: 300, useNativeDriver: true }).start(() => setSelectedEvent(null));
  };

  return (
    <View style={styles.container}>
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
                  <MapPin size={30} color={event.source === 'internal' ? COLORS.accent : '#F59E0B'} fill={COLORS.white} />
                </View>
              </Marker>
            );
          })}
        </MapView>
      )}

      <View style={styles.filterOverlay}>
        {['All', 'Nightlife', 'Concerts'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={styles.filterChip}
            onPress={() => {
                if (filter === 'All') {
                    loadNearbyEvents(initialRegion.latitude, initialRegion.longitude);
                } else {
                    const filtered = events.filter(e => e.eventType === filter.toLowerCase() || e.category === filter.toLowerCase());
                    if (filtered.length > 0) setEvents(filtered);
                }
            }}
          >
            <Text style={styles.filterText}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowListView((v) => !v)}
      >
        <List size={20} color={COLORS.primary} />
        <Text style={styles.toggleText}>{showListView ? 'Map' : 'List'}</Text>
      </TouchableOpacity>

      {showListView && (
        <View style={styles.listOverlay}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>Nearby Events ({events.length})</Text>
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
                <Image 
                    source={{ uri: (item.images?.[1] ?? item.images?.[0]) || 'https://via.placeholder.com/100' }} 
                    style={styles.listRowImage} 
                />
                <View style={styles.listRowContent}>
                  <Text style={styles.listRowTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.listRowMeta}>
                      {item.customLocation?.address || item.venue?.name || 'Nairobi'}
                  </Text>
                  {getPriceDisplay(item) != null && <Text style={styles.listRowPrice}>{getPriceDisplay(item)}</Text>}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <TouchableOpacity
        style={styles.locationButton}
        onPress={async () => {
          const loc = await Location.getCurrentPositionAsync({});
          mapRef.current?.animateToRegion({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05
          });
          loadNearbyEvents(loc.coords.latitude, loc.coords.longitude);
        }}
      >
        <Navigation size={24} color={COLORS.primary} />
      </TouchableOpacity>

      {selectedEvent && (
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.dragHandle} />
          <View style={styles.previewContent}>
            <Image source={{ uri: (selectedEvent.images?.[1] ?? selectedEvent.images?.[0]) || 'https://via.placeholder.com/150' }} style={styles.previewImage} />
            <View style={styles.previewInfo}>
              <Text style={styles.previewTitle} numberOfLines={1}>{selectedEvent.title}</Text>
              <Text style={styles.previewMeta}>
                  {format(new Date(selectedEvent.startDate), 'MMM d • h:mm a')}
              </Text>
              <Text style={styles.previewMeta}>
                  {selectedEvent.customLocation?.address || selectedEvent.venue?.name || 'Location TBD'}
              </Text>
              <View style={{flexDirection:'row', justifyContent:'space-between', marginTop: 10, alignItems:'center'}}>
                  {getPriceDisplay(selectedEvent) != null && <Text style={styles.previewPrice}>{getPriceDisplay(selectedEvent)}</Text>}
                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => {
                        navigation.navigate('EventDetail', { eventId: selectedEvent.id, event: selectedEvent });
                    }}
                  >
                    <Text style={styles.viewDetailsText}>View</Text>
                  </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={closeSheet}>
              <X size={24} color="#000" />
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
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' },
  mapPlaceholderText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  mapPlaceholderSubtext: { color: '#888', marginTop: 8 },
  markerContainer: { shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: {width:0, height:2} },
  filterOverlay: { position: 'absolute', top: 60, left: 16, flexDirection: 'row', gap: 8 },
  filterChip: { backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, shadowColor:'#000', shadowOpacity:0.1, elevation:3 },
  filterText: { fontWeight: '600' },
  toggleButton: { position: 'absolute', top: 60, right: 16, backgroundColor: 'white', padding: 10, borderRadius: 25, flexDirection:'row', gap:6, alignItems:'center', shadowColor:'#000', shadowOpacity:0.1, elevation:3 },
  toggleText: { fontWeight: 'bold' },
  locationButton: { position: 'absolute', bottom: 240, right: 16, backgroundColor: 'white', width: 50, height: 50, borderRadius: 25, justifyContent:'center', alignItems:'center', shadowColor:'#000', shadowOpacity:0.2, elevation:4 },
  listOverlay: { position: 'absolute', top: 110, bottom: 20, left: 16, right: 16, backgroundColor: 'white', borderRadius: 16, padding: 16, elevation: 10 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  listHeaderTitle: { fontWeight: 'bold', fontSize: 16 },
  listHeaderClose: { color: COLORS.accent, fontWeight: 'bold' },
  listRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' },
  listRowImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#eee' },
  listRowContent: { marginLeft: 12, flex: 1, justifyContent: 'center' },
  listRowTitle: { fontWeight: 'bold', fontSize: 14 },
  listRowMeta: { color: '#666', fontSize: 12 },
  listRowPrice: { fontWeight: 'bold', color: COLORS.accent, marginTop: 4 },
  bottomSheet: { position: 'absolute', bottom: 0, width: '100%', height: 220, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOpacity: 0.2, elevation: 20 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#ddd', borderRadius: 10, alignSelf: 'center', marginTop: 10 },
  previewContent: { flexDirection: 'row', padding: 20, gap: 16 },
  previewImage: { width: 100, height: 120, borderRadius: 12, backgroundColor: '#eee' },
  previewInfo: { flex: 1, justifyContent:'center' },
  previewTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 4 },
  previewMeta: { color: '#666', fontSize: 13, marginBottom: 2 },
  previewPrice: { fontWeight: 'bold', fontSize: 16, color: COLORS.primary },
  viewDetailsBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  viewDetailsText: { color: 'white', fontWeight: 'bold' },
  closeBtn: { position: 'absolute', top: 10, right: 10 },
});