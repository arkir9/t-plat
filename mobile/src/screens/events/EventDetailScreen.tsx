// mobile/src/screens/events/EventDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking, // Added for external URLs
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Share, 
  Heart, 
  Calendar, 
  MapPin, 
  ShieldCheck,
  Globe,        // New icon for web sources
  CheckCircle,  // New icon for verified
  AlertCircle   // New icon for unverified
} from 'lucide-react-native';
import { format } from 'date-fns';
import { SocialShareModal } from '../../components/SocialShareModal';
import { eventsService } from '../../services/eventsService';
import { favoritesService } from '../../services/favoritesService';
import { ticketsService } from '../../services/ticketsService';
import { Event } from '../../types';
import { useAuthStore } from '../../store/authStore'; // Ensure this exists

const COLORS = {
  primary: '#000000',
  accent: '#8B5CF6',
  verified: '#10B981', // Green
  unverified: '#F59E0B', // Orange
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textLight: '#999999',
  white: '#FFFFFF',
};

const SPACING = {
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
};

export function EventDetailScreen({ route, navigation }: any) {
  const { eventId, event: eventParam } = route.params || {};
  const { user } = useAuthStore(); // Get current user
  
  const [event, setEvent] = useState<Event | null>(eventParam || null);
  const [isLoading, setIsLoading] = useState(!eventParam);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Computed Check: Can this user claim this event?
  // Logic: User is organizer + Event is not claimed + Event is not internal (manually created)
  const isOrganizer = user?.role === 'organizer';
  const canClaim = isOrganizer && event && !event.isClaimed && event.source !== 'internal';

  useEffect(() => {
    if (typeof eventId === 'string' && eventId.length > 0 && !eventParam) {
      loadEvent();
    }
  }, [eventId, eventParam]);

  useEffect(() => {
    if (eventId) {
      // Fire-and-forget view tracking
      eventsService.trackView?.(eventId).catch(() => {});
      favoritesService.isFavorite(eventId).then(setIsFavorite).catch(() => setIsFavorite(false));
    }
  }, [eventId]);

  const loadEvent = async () => {
    if (typeof eventId !== 'string' || !eventId.length) {
      Alert.alert('Error', 'Missing event identifier.');
      navigation.goBack();
      return;
    }
    setIsLoading(true);
    try {
      const eventData = await eventsService.getEventById(eventId);
      setEvent(eventData);
    } catch (error: any) {
      console.error('Failed to load event:', error);
      Alert.alert('Error', 'Failed to load event details.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!eventId || favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await favoritesService.remove(eventId);
        setIsFavorite(false);
      } else {
        await favoritesService.add(eventId);
        setIsFavorite(true);
      }
    } catch (_) {
      // ignore
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!event) return;
    try {
      setJoiningWaitlist(true);
      await ticketsService.joinWaitlist(event.id);
      Alert.alert('Success', 'You have joined the waitlist.');
    } catch (error: any) {
      Alert.alert('Error', 'Could not join waitlist.');
    } finally {
      setJoiningWaitlist(false);
    }
  };

  const handleClaimEvent = async () => {
    Alert.alert(
      'Claim Event',
      'Are you the official organizer? Claiming this event gives you full control.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Claim it',
          onPress: async () => {
            setIsClaiming(true);
            try {
              await eventsService.claimEvent(event!.id);
              Alert.alert('Success', 'You now own this event listing!');
              loadEvent(); // Reload to update UI state
            } catch (error) {
              Alert.alert('Error', 'Failed to claim event.');
            } finally {
              setIsClaiming(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading || !event) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const formattedDate = format(new Date(event.startDate), 'EEE, MMM d • h:mm a');
  const locationText = event.location?.address 
    ? event.location.address 
    : event.venue?.address 
    ? event.venue.address 
    : 'Location TBD';
    
  const price = event.ticketTypes?.[0]?.price 
    ? `${event.ticketTypes[0].currency === 'USD' ? '$' : 'KES'} ${event.ticketTypes[0].price}` 
    : 'See details';

  const imageUri = event.images?.[0];
  const organizerName = event.organizer?.name || 'Unknown Organizer';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' }]}>
              <Calendar size={48} color={COLORS.textLight} />
            </View>
          )}
          
          <View style={styles.heroOverlay} />

          {/* Header Actions */}
          <SafeAreaView style={styles.heroHeader}>
            <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.goBack()}>
              <ChevronLeft size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={styles.iconCircle} onPress={() => setShareModalVisible(true)}>
                <Share size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconCircle} onPress={toggleFavorite} disabled={favoriteLoading}>
                <Heart size={20} color={isFavorite ? '#EF4444' : COLORS.primary} fill={isFavorite ? '#EF4444' : 'transparent'} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Verification Badge */}
          <View style={styles.badgeContainer}>
            {event.isClaimed || event.source === 'internal' ? (
              <View style={[styles.badge, { backgroundColor: COLORS.verified }]}>
                <ShieldCheck size={14} color="white" />
                <Text style={styles.badgeText}>Official Event</Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: COLORS.unverified }]}>
                <Globe size={14} color="white" />
                <Text style={styles.badgeText}>Sourced from Web</Text>
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.detailContent}>
          <Text style={styles.detailTitle}>{event.title}</Text>
          
          <View style={styles.organizerRow}>
            {event.isClaimed ? (
              <>
                <CheckCircle size={16} color={COLORS.verified} />
                <Text style={styles.organizerName}>By {organizerName}</Text>
              </>
            ) : (
              <>
                <AlertCircle size={16} color={COLORS.textLight} />
                <Text style={styles.organizerName}>Listed via {event.source}</Text>
              </>
            )}
          </View>

          {/* CLAIM BANNER (Only visible to relevant organizers) */}
          {canClaim && (
            <View style={styles.claimBanner}>
              <View style={styles.claimTextContainer}>
                <Text style={styles.claimTitle}>Are you the organizer?</Text>
                <Text style={styles.claimSubtitle}>Claim this event to manage tickets & details.</Text>
              </View>
              <TouchableOpacity 
                style={styles.claimButton} 
                onPress={handleClaimEvent}
                disabled={isClaiming}
              >
                {isClaiming ? <ActivityIndicator color="white" size="small"/> : <Text style={styles.claimButtonText}>Claim</Text>}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />

          {/* Details */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Calendar size={24} color={COLORS.accent} />
            </View>
            <View>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>{formattedDate}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <MapPin size={24} color={COLORS.accent} />
            </View>
            <View>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{locationText}</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>About this event</Text>
          <Text style={styles.descriptionText}>
            {event.description || 'No description available.'}
          </Text>

          {/* External Link for Unclaimed Events */}
          {!event.isClaimed && event.externalUrl && (
            <TouchableOpacity 
              style={styles.sourceLinkButton}
              onPress={() => Linking.openURL(event.externalUrl!)}
            >
              <Text style={styles.sourceLinkText}>View Original Listing on {event.source}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>{price}</Text>
          {event.isClaimed && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleJoinWaitlist}
              disabled={joiningWaitlist}
            >
              <Text style={styles.secondaryButtonText}>
                {joiningWaitlist ? 'Joining...' : 'Join Waitlist'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {event.isClaimed ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('TicketSelection', { eventId: event.id, event })}
          >
            <Text style={styles.primaryButtonText}>Select Tickets</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: COLORS.textSecondary }]}
            onPress={() => event.externalUrl && Linking.openURL(event.externalUrl)}
          >
            <Text style={styles.primaryButtonText}>Visit Website</Text>
          </TouchableOpacity>
        )}
      </View>

      <SocialShareModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        event={{
          id: event.id,
          title: event.title,
          date: formattedDate,
          image: imageUri || '',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  heroContainer: { height: 300, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
  heroHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.m,
  },
  iconCircle: {
    width: 40, height: 40, backgroundColor: COLORS.white, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  badgeContainer: { position: 'absolute', bottom: 40, left: SPACING.m },
  badge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, gap: 6,
  },
  badgeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  detailContent: {
    padding: SPACING.m, backgroundColor: COLORS.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24,
  },
  detailTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.l },
  organizerName: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  
  // Claim Banner
  claimBanner: {
    backgroundColor: '#F3E8FF', borderRadius: 12, padding: SPACING.m, marginBottom: SPACING.l,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#D8B4FE',
  },
  claimTextContainer: { flex: 1, marginRight: 12 },
  claimTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.accent },
  claimSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  claimButton: { backgroundColor: COLORS.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  claimButtonText: { color: 'white', fontWeight: 'bold', fontSize: 12 },

  divider: { height: 1, backgroundColor: COLORS.surface, marginBottom: SPACING.l },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.l, gap: SPACING.m },
  detailIconBox: {
    width: 48, height: 48, backgroundColor: COLORS.surface, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  detailLabel: { fontSize: 12, color: COLORS.textLight, marginBottom: 2 },
  detailValue: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginTop: SPACING.m, marginBottom: SPACING.s },
  descriptionText: { fontSize: 15, lineHeight: 24, color: COLORS.textSecondary },
  
  sourceLinkButton: { marginTop: SPACING.l, padding: SPACING.m, backgroundColor: COLORS.surface, borderRadius: 8, alignItems: 'center' },
  sourceLinkText: { color: COLORS.textSecondary, fontWeight: '600' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white,
    padding: SPACING.m, paddingBottom: 32, borderTopWidth: 1, borderTopColor: COLORS.surface,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12
  },
  priceLabel: { fontSize: 12, color: COLORS.textLight },
  priceValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  primaryButton: {
    backgroundColor: COLORS.primary, paddingHorizontal: 24, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center', minWidth: 140
  },
  primaryButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  secondaryButton: { marginTop: 4 },
  secondaryButtonText: { color: COLORS.accent, fontSize: 12, fontWeight: '600' },
});