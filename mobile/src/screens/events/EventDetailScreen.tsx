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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Share,
  Heart,
  Calendar,
  MapPin,
  ShieldCheck,
  Globe,
  CheckCircle,
  AlertCircle,
  Navigation,
  Info,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { SocialShareModal } from '../../components/SocialShareModal';
import { eventsService } from '../../services/eventsService';
import { favoritesService } from '../../services/favoritesService';
import { ticketsService } from '../../services/ticketsService';
import { Event } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../design/theme';

const { colors } = theme;

const COLORS = {
  background: colors.dark.background,
  surface: colors.dark.surface,
  surfaceVariant: colors.dark.surfaceVariant,
  accent: colors.primary[500],
  text: colors.dark.text,
  textSecondary: colors.dark.textSecondary,
  verified: '#10B981',
  unverified: 'rgba(255,255,255,0.4)',
  white: '#FFFFFF',
};

const SPACING = theme.spacing;

export function EventDetailScreen({ route, navigation }: any) {
  const { eventId, event: eventParam } = route.params || {};
  const { user } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(eventParam || null);
  const [isLoading, setIsLoading] = useState(!eventParam);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const isOrganizer = user?.role === 'organizer';
  const canClaim = isOrganizer && event && !event.isClaimed && event.source !== 'internal';

  useEffect(() => {
    if (typeof eventId === 'string' && eventId.length > 0 && !eventParam) {
      loadEvent();
    }
  }, [eventId, eventParam]);

  useEffect(() => {
    if (eventId) {
      eventsService.trackView?.(eventId).catch(() => {});
      favoritesService.isFavorite(eventId).then(setIsFavorite).catch(() => setIsFavorite(false));
    }
  }, [eventId]);

  const loadEvent = async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const eventData = await eventsService.getEventById(eventId);
      setEvent(eventData);
    } catch {
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
    } catch (_) {} finally {
      setFavoriteLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!event) return;
    setJoiningWaitlist(true);
    try {
      await ticketsService.joinWaitlist(event.id);
      Alert.alert('Success', 'You have joined the waitlist.');
    } catch {
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
              loadEvent();
            } catch {
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
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const formattedDate = format(new Date(event.startDate), 'EEEE, MMMM d, yyyy');
  const timeRange = event.endDate
    ? `${format(new Date(event.startDate), 'h:mm a')} - ${format(new Date(event.endDate), 'h:mm a')}`
    : format(new Date(event.startDate), 'h:mm a');
  const locationText = (() => {
    if (event.customLocation) {
      const { address, city } = event.customLocation;
      if (address && city) return `${address}, ${city}`;
      return address || city || 'Location TBD';
    }
    if (event.venue) {
      return `${event.venue.name}, ${event.venue.venueCity || 'Nairobi'}`;
    }
    return 'Location TBD';
  })();
  const addressLine = event.customLocation?.address || event.venue?.venueAddress || '';

  const priceDisplay = (() => {
    if (event.ticketTypes && event.ticketTypes.length > 0) {
      const min = Math.min(...event.ticketTypes.map((t: any) => Number(t.price)));
      if (min > 0)
        return event.ticketTypes.length > 1 ? `From KES ${min.toLocaleString()}` : `KES ${min.toLocaleString()}`;
    }
    if (event.price != null && event.price > 0) return `KES ${event.price.toLocaleString()}`;
    return null;
  })();

  const imageUri = event.images?.[0] ?? event.images?.[1];
  const organizerName = event.organizer?.name || 'Electric Dreams Collective';
  const eventTypeLabel = (event.eventType || 'music').toUpperCase().replace('_', ' & ');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Text style={styles.heroPlaceholderText}>EVENT BANNER</Text>
            </View>
          )}
          <View style={styles.heroOverlay} />
          <SafeAreaView style={styles.heroHeader} edges={['top']}>
            <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.goBack()}>
              <ChevronLeft size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.platLabel}>Plat</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconCircle} onPress={toggleFavorite} disabled={favoriteLoading}>
                <Heart size={20} color={isFavorite ? '#EF4444' : COLORS.accent} fill={isFavorite ? '#EF4444' : 'transparent'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconCircle} onPress={() => setShareModalVisible(true)}>
                <Share size={20} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <View style={styles.badgeContainer}>
            <View style={[styles.categoryBadge, { backgroundColor: COLORS.accent }]}>
              <Text style={styles.badgeText}>{eventTypeLabel}</Text>
            </View>
            <View style={styles.viewsRow}>
              <Text style={styles.viewsText}>1.2k viewed</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailContent}>
          <Text style={styles.detailTitle}>{event.title}</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoIconCircle}>
              <Calendar size={22} color={COLORS.white} />
            </View>
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoValue}>{formattedDate}</Text>
              <Text style={styles.infoSub}>{timeRange}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconCircle}>
              <MapPin size={22} color={COLORS.white} />
            </View>
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoValue}>{locationText.split(',')[0]}</Text>
              <Text style={styles.infoSub}>{addressLine || locationText}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.mapCard}>
            <View style={styles.mapThumbnail} />
            <View style={styles.getDirectionsBtn}>
              <Navigation size={18} color={COLORS.accent} />
              <Text style={styles.getDirectionsText}>GET DIRECTIONS</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.organizerCard}>
            <View style={styles.organizerAvatar} />
            <View style={styles.organizerInfo}>
              <Text style={styles.organizerLabel}>ORGANIZED BY</Text>
              <Text style={styles.organizerName}>{organizerName}</Text>
            </View>
            <TouchableOpacity style={styles.followBtn}>
              <Text style={styles.followBtnText}>FOLLOW</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeader}>ABOUT THIS EVENT</Text>
          <View style={styles.descriptionBlock}>
            {(event.description || 'No description available.')
              .split(/\n\n+/)
              .filter(Boolean)
              .map((para, i) => (
                <Text key={i} style={styles.descriptionText}>
                  {para.trim()}
                </Text>
              ))}
          </View>

          <TouchableOpacity>
            <Text style={styles.readMoreLink}>READ MORE</Text>
          </TouchableOpacity>

          <View style={styles.policyCard}>
            <View style={styles.infoIconCircle}>
              <CheckCircle size={20} color={COLORS.white} />
            </View>
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoValue}>Verified Tickets</Text>
              <Text style={styles.infoSub}>Secure entry with our digital verification system.</Text>
            </View>
          </View>
          <View style={styles.policyCard}>
            <View style={[styles.infoIconCircle, { backgroundColor: COLORS.accent }]}>
              <Info size={20} color={COLORS.white} />
            </View>
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoValue}>Refund Policy</Text>
              <Text style={styles.infoSub}>Up to 7 days before event start date.</Text>
            </View>
          </View>

          {canClaim && (
            <View style={styles.claimBanner}>
              <View style={styles.claimTextContainer}>
                <Text style={styles.claimTitle}>Are you the organizer?</Text>
                <Text style={styles.claimSubtitle}>Claim this event to manage tickets & details.</Text>
              </View>
              <TouchableOpacity style={styles.claimButton} onPress={handleClaimEvent} disabled={isClaiming}>
                {isClaiming ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.claimButtonText}>Claim</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {!event.isClaimed && event.externalUrl && (
            <TouchableOpacity style={styles.sourceLinkButton} onPress={() => Linking.openURL(event.externalUrl!)}>
              <Text style={styles.sourceLinkText}>View Original Listing</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>TICKETS FROM</Text>
          <Text style={styles.priceValue}>{priceDisplay ?? 'Free'}</Text>
        </View>
        {event.isClaimed ? (
          <>
            {event.ticketTypes?.length ? (
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => navigation.navigate('TicketSelection', { eventId: event.id, event })}
              >
                <Text style={styles.bookButtonText}>BOOK NOW</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.bookButton} onPress={handleJoinWaitlist} disabled={joiningWaitlist}>
                <Text style={styles.bookButtonText}>{joiningWaitlist ? 'Joining...' : 'Join Waitlist'}</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity
            style={[styles.bookButton, { backgroundColor: COLORS.textSecondary }]}
            onPress={() => event.externalUrl && Linking.openURL(event.externalUrl)}
          >
            <Text style={styles.bookButtonText}>Visit Website</Text>
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
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  heroContainer: { height: 280, position: 'relative' },
  heroImage: { width: '100%', height: '100%', backgroundColor: COLORS.surfaceVariant },
  heroPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  heroPlaceholderText: { fontSize: 18, fontWeight: '700', color: COLORS.textSecondary },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  heroHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platLabel: { fontSize: 18, fontWeight: '700', color: COLORS.accent, marginLeft: 12 },
  headerRight: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  badgeContainer: {
    position: 'absolute',
    bottom: 24,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  viewsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewsText: { fontSize: 13, color: COLORS.textSecondary },
  detailContent: { padding: SPACING.md },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  infoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoTextBlock: { flex: 1 },
  infoValue: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  infoSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  mapCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  mapThumbnail: {
    height: 120,
    backgroundColor: COLORS.surfaceVariant,
  },
  getDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: SPACING.md,
  },
  getDirectionsText: { fontSize: 14, fontWeight: '700', color: COLORS.accent },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    marginRight: SPACING.md,
  },
  organizerInfo: { flex: 1 },
  organizerLabel: { fontSize: 10, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 2 },
  organizerName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  followBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  followBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.white },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  descriptionBlock: {},
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  readMoreLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: SPACING.lg,
  },
  policyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  claimBanner: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  claimTextContainer: { flex: 1, marginRight: 12 },
  claimTitle: { fontSize: 14, fontWeight: '700', color: COLORS.accent },
  claimSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  claimButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  claimButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  sourceLinkButton: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    alignItems: 'center',
  },
  sourceLinkText: { color: COLORS.textSecondary, fontWeight: '600' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceVariant,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  priceBlock: {},
  priceLabel: { fontSize: 12, color: COLORS.textSecondary },
  priceValue: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  bookButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 28,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});
