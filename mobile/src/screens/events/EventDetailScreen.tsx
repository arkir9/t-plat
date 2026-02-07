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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Share, Heart, Calendar, MapPin, ShieldCheck } from 'lucide-react-native';
import { format } from 'date-fns';
import { SocialShareModal } from '../../components/SocialShareModal';
import { eventsService, Event } from '../../services/eventsService';
import { favoritesService } from '../../services/favoritesService';
import { ticketsService } from '../../services/ticketsService';

const COLORS = {
  primary: '#000000',
  accent: '#8B5CF6',
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
  const { eventId, event: eventParam } = route.params;
  const [event, setEvent] = useState<Event | null>(eventParam || null);
  const [isLoading, setIsLoading] = useState(!eventParam);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);

  useEffect(() => {
    if (eventId && !eventParam) {
      loadEvent();
    }
  }, [eventId, eventParam]);

  useEffect(() => {
    // Fire-and-forget behavior logging for personalization
    if (eventId) {
      eventsService
        .getEventById(eventId) // ensure event exists; backend will track separately
        .catch(() => null);
      // In addition, explicitly call track-view endpoint (does nothing if fails)
      (async () => {
        try {
          await eventsService.trackView?.(eventId);
        } catch (_) {
          // ignore
        }
      })();
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      favoritesService.isFavorite(eventId).then(setIsFavorite).catch(() => setIsFavorite(false));
    }
  }, [eventId]);

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

  const loadEvent = async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const eventData = await eventsService.getEventById(eventId);
      setEvent(eventData);
    } catch (error: any) {
      console.error('Failed to load event:', error);
      Alert.alert('Error', 'Failed to load event details. Please try again.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!event) return;
    try {
      setJoiningWaitlist(true);
      await ticketsService.joinWaitlist(event.id);
      Alert.alert(
        'Waitlist joined',
        'You will be notified if tickets become available for this event.',
      );
    } catch (error: any) {
      console.error('Failed to join waitlist', error);
      Alert.alert(
        'Could not join waitlist',
        'Please try again in a moment.',
      );
    } finally {
      setJoiningWaitlist(false);
    }
  };

  if (isLoading || !event) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const formattedDate = format(new Date(event.startDate), 'EEE, MMM d • h:mm a');
  const location = event.locationType === 'venue' && event.venueId
    ? 'Venue'
    : event.customLocation
    ? `${event.customLocation.address}, ${event.customLocation.city}`
    : 'Location TBD';
  const price = event.price && event.price > 0
    ? `${event.currency === 'USD' ? '$' : 'KES'} ${event.price.toLocaleString()}`
    : 'Free';
  const imageUri = (event as any).bannerImageUrl ?? (event as any).images?.[0] ?? event.image;
  const organizerName = (event as any).organizer?.name;

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
          
          {/* Header Actions Overlay */}
          <SafeAreaView style={styles.heroHeader}>
            <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.goBack()}>
              <ChevronLeft size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={styles.iconCircle}
                onPress={() => setShareModalVisible(true)}
              >
                <Share size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconCircle}
                onPress={toggleFavorite}
                disabled={favoriteLoading}
              >
                <Heart size={20} color={isFavorite ? '#EF4444' : COLORS.primary} fill={isFavorite ? '#EF4444' : 'transparent'} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View style={styles.detailContent}>
          <Text style={styles.detailTitle}>{event.title}</Text>
          {organizerName && (
            <Text style={styles.detailOrganizer}>By {organizerName}</Text>
          )}

          <View style={styles.divider} />

          {/* Key Details Grid */}
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
              <Text style={styles.detailValue}>{location}</Text>
            </View>
          </View>

          {/* Safety Feature (Nightlife) */}
          <View style={styles.safetyCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <ShieldCheck size={24} color={COLORS.white} />
              <View>
                <Text style={styles.safetyTitle}>Verified Safe Venue</Text>
                <Text style={styles.safetySubtitle}>Emergency contacts active</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>About this event</Text>
          <Text style={styles.descriptionText}>
            {event.description || 'No description available.'}
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>{price}</Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleJoinWaitlist}
            disabled={joiningWaitlist}
          >
            <Text style={styles.secondaryButtonText}>
              {joiningWaitlist ? 'Joining waitlist…' : 'Join waitlist for this event'}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('TicketSelection', { eventId: event.id, event })}
        >
          <Text style={styles.primaryButtonText}>Select Tickets</Text>
        </TouchableOpacity>
      </View>

      {/* Social Share Modal */}
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.m,
  },
  iconCircle: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailContent: {
    padding: SPACING.m,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  detailOrganizer: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.l,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.l,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.l,
    gap: SPACING.m,
  },
  detailIconBox: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: SPACING.m,
    marginBottom: SPACING.s,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },
  safetyCard: {
    backgroundColor: COLORS.accent,
    padding: SPACING.m,
    borderRadius: 12,
    marginBottom: SPACING.l,
  },
  safetyTitle: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  safetySubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});