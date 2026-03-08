/**
 * EventReviewsScreen.tsx
 *
 * Shows existing reviews for an event and lets verified attendees
 * (users with a 'used' ticket for that event) submit a new one.
 *
 * Navigate here from EventDetailScreen:
 *   navigation.navigate('EventReviews', { eventId, event })
 *
 * Add to RootStackParamList:
 *   EventReviews: { eventId: string; event?: any };
 *
 * Add to RootNavigator:
 *   <Stack.Screen name="EventReviews" component={EventReviewsScreen} />
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Star, ThumbsUp, MessageSquare } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { reviewsService, Review, EventRatingStats } from '../../services/reviewsService';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../design/theme';

const { colors } = theme;

const COLORS = {
  background: colors.dark.background, surface: colors.dark.surface,
  accent: colors.primary[500], text: colors.dark.text,
  textSecondary: colors.dark.textSecondary, white: '#FFFFFF',
  gold: '#F5C518', green: '#1FC98E', red: '#FF4D6A',
  border: 'rgba(255,255,255,0.06)',
};

// ── Star row ──────────────────────────────────────────────────────────────────
function StarRow({ rating, size = 18, interactive = false, onRate }: {
  rating: number; size?: number; interactive?: boolean; onRate?: (n: number) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          disabled={!interactive}
          onPress={() => onRate?.(n)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Star
            size={size}
            color={COLORS.gold}
            fill={n <= rating ? COLORS.gold : 'transparent'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Rating distribution bar ───────────────────────────────────────────────────
function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total === 0 ? 0 : (count / total) * 100;
  return (
    <View style={styles.ratingBarRow}>
      <Text style={styles.ratingBarLabel}>{label}</Text>
      <View style={styles.ratingBarTrack}>
        <View style={[styles.ratingBarFill, { width: `${pct}%` as any }]} />
      </View>
      <Text style={styles.ratingBarCount}>{count}</Text>
    </View>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────
function ReviewCard({ review }: { review: Review }) {
  const name = review.user?.firstName
    ? `${review.user.firstName} ${review.user.lastName ?? ''}`.trim()
    : 'Attendee';
  const avatar = review.user?.profileImageUrl;

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={styles.reviewMeta}>
            <Text style={styles.reviewerName}>{name}</Text>
            {review.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
              </View>
            )}
          </View>
          <StarRow rating={review.rating} size={13} />
          <Text style={styles.reviewDate}>
            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
          </Text>
        </View>
      </View>

      {review.reviewText ? (
        <Text style={styles.reviewText}>{review.reviewText}</Text>
      ) : null}

      {/* Sub-ratings */}
      {(review.venueRating || review.organizerRating) && (
        <View style={styles.subRatings}>
          {review.venueRating && (
            <View style={styles.subRatingPill}>
              <Text style={styles.subRatingLabel}>Venue</Text>
              <StarRow rating={review.venueRating} size={11} />
            </View>
          )}
          {review.organizerRating && (
            <View style={styles.subRatingPill}>
              <Text style={styles.subRatingLabel}>Organiser</Text>
              <StarRow rating={review.organizerRating} size={11} />
            </View>
          )}
        </View>
      )}

      {/* Organiser response */}
      {review.organizerResponse && (
        <View style={styles.orgResponse}>
          <MessageSquare size={13} color={COLORS.accent} />
          <Text style={styles.orgResponseText}>{review.organizerResponse}</Text>
        </View>
      )}
    </View>
  );
}

// ── Write review panel ────────────────────────────────────────────────────────
function WriteReviewPanel({ eventId, onSubmitted }: { eventId: string; onSubmitted: () => void }) {
  const { isAuthenticated } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [venueRating, setVenueRating] = useState(0);
  const [orgRating, setOrgRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  if (!isAuthenticated) {
    return (
      <View style={styles.writePanel}>
        <Text style={styles.writePanelHint}>Sign in to leave a review</Text>
      </View>
    );
  }

  if (!showForm) {
    return (
      <TouchableOpacity style={styles.writeBtn} onPress={() => setShowForm(true)}>
        <Star size={16} color={COLORS.gold} />
        <Text style={styles.writeBtnText}>Write a Review</Text>
      </TouchableOpacity>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) { Alert.alert('Rating required', 'Please select a star rating'); return; }
    setSubmitting(true);
    try {
      await reviewsService.createReview({
        eventId,
        rating,
        reviewText: text.trim() || undefined,
        venueRating: venueRating || undefined,
        organizerRating: orgRating || undefined,
      });
      Alert.alert('Thanks!', 'Your review has been submitted');
      onSubmitted();
      setShowForm(false);
      setRating(0); setVenueRating(0); setOrgRating(0); setText('');
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Could not submit review. Have you attended this event?';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.writePanel}>
      <Text style={styles.writePanelTitle}>Your Review</Text>

      <View style={styles.writePanelSection}>
        <Text style={styles.writePanelLabel}>Overall</Text>
        <StarRow rating={rating} size={28} interactive onRate={setRating} />
      </View>

      <View style={styles.writePanelSection}>
        <Text style={styles.writePanelLabel}>Venue experience</Text>
        <StarRow rating={venueRating} size={20} interactive onRate={setVenueRating} />
      </View>

      <View style={styles.writePanelSection}>
        <Text style={styles.writePanelLabel}>Organiser</Text>
        <StarRow rating={orgRating} size={20} interactive onRate={setOrgRating} />
      </View>

      <TextInput
        style={styles.textArea}
        placeholder="Tell others what you thought…"
        placeholderTextColor={COLORS.textSecondary}
        multiline
        numberOfLines={4}
        value={text}
        onChangeText={setText}
      />

      <View style={styles.writePanelActions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting
            ? <ActivityIndicator size="small" color={COLORS.white} />
            : <Text style={styles.submitBtnText}>Submit</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export function EventReviewsScreen({ route, navigation }: any) {
  const { eventId, event } = route.params ?? {};
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<EventRatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [r, s] = await Promise.all([
        reviewsService.getEventReviews(eventId),
        reviewsService.getEventAverageRating(eventId),
      ]);
      setReviews(r);
      setStats(s);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ChevronLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{event?.title ?? 'Reviews'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.accent} />}
      >
        {/* Stats summary */}
        {stats && stats.totalReviews > 0 && (
          <View style={styles.statsCard}>
            <View style={styles.statsLeft}>
              <Text style={styles.avgRating}>{stats.averageRating.toFixed(1)}</Text>
              <StarRow rating={Math.round(stats.averageRating)} size={16} />
              <Text style={styles.totalReviews}>{stats.totalReviews} reviews</Text>
            </View>
            <View style={styles.statsRight}>
              {([5, 4, 3, 2, 1] as const).map((n) => (
                <RatingBar
                  key={n}
                  label={`${n}★`}
                  count={stats.ratingDistribution[n]}
                  total={stats.totalReviews}
                />
              ))}
            </View>
          </View>
        )}

        {/* Write review */}
        <WriteReviewPanel eventId={eventId} onSubmitted={load} />

        {/* Reviews list */}
        <View style={styles.reviewsList}>
          <Text style={styles.sectionTitle}>
            {reviews.length > 0 ? `${reviews.length} Review${reviews.length > 1 ? 's' : ''}` : 'No reviews yet'}
          </Text>

          {loading ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
          ) : reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <ThumbsUp size={36} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>Be the first to review</Text>
              <Text style={styles.emptySubtitle}>Share your experience to help others decide</Text>
            </View>
          ) : (
            reviews.map((r) => <ReviewCard key={r.id} review={r} />)
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: COLORS.text, marginHorizontal: 8 },

  statsCard: { flexDirection: 'row', margin: 16, padding: 16, backgroundColor: COLORS.surface, borderRadius: 16, gap: 16 },
  statsLeft: { alignItems: 'center', justifyContent: 'center', width: 80 },
  avgRating: { fontSize: 40, fontWeight: '800', color: COLORS.text },
  totalReviews: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  statsRight: { flex: 1, justifyContent: 'center', gap: 4 },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingBarLabel: { width: 22, fontSize: 11, color: COLORS.textSecondary, textAlign: 'right' },
  ratingBarTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  ratingBarFill: { height: '100%', backgroundColor: COLORS.gold, borderRadius: 3 },
  ratingBarCount: { width: 20, fontSize: 11, color: COLORS.textSecondary },

  writeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginBottom: 16, paddingVertical: 13, backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  writeBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.text },

  writePanel: { margin: 16, padding: 16, backgroundColor: COLORS.surface, borderRadius: 16 },
  writePanelTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  writePanelSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  writePanelLabel: { fontSize: 13, color: COLORS.textSecondary },
  writePanelHint: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', padding: 8 },
  textArea: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.text, marginTop: 4, minHeight: 90, textAlignVertical: 'top' },
  writePanelActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' },
  cancelBtnText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  submitBtn: { flex: 2, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: COLORS.accent },
  submitBtnText: { fontSize: 14, color: COLORS.white, fontWeight: '700' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  reviewsList: { paddingHorizontal: 16 },

  reviewCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  reviewMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  reviewerName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  verifiedBadge: { backgroundColor: 'rgba(31,201,142,0.15)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  verifiedBadgeText: { fontSize: 10, color: COLORS.green, fontWeight: '700' },
  reviewDate: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },
  reviewText: { fontSize: 14, color: COLORS.text, lineHeight: 20, marginBottom: 8 },
  subRatings: { flexDirection: 'row', gap: 10, marginTop: 6 },
  subRatingPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  subRatingLabel: { fontSize: 11, color: COLORS.textSecondary },
  orgResponse: { flexDirection: 'row', gap: 8, marginTop: 10, padding: 10, backgroundColor: 'rgba(123,92,250,0.08)', borderRadius: 10, borderLeftWidth: 2, borderLeftColor: COLORS.accent },
  orgResponseText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic' },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
});
