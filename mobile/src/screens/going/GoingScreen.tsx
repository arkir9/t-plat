/**
 * GoingScreen.tsx
 *
 * The "Going?" tab — shows:
 *  • Events your phone contacts (who have Plat) are attending
 *  • People you follow who are going to upcoming events
 *  • Quick "I'm Going" RSVP on any event card
 *
 * Wiring:
 *  1. Add to MainTabNavigator as the 4th tab (replace Going? placeholder)
 *  2. Add goingService methods to backend (stubs below, endpoints listed)
 *  3. Install: expo install expo-contacts
 *
 * Backend endpoints needed (add to a social.controller.ts):
 *   POST   /social/sync-contacts         body: { phoneHashes: string[] }
 *           → returns matched users with their upcoming events
 *   GET    /social/feed                  → activity feed (friends going)
 *   POST   /social/rsvp/:eventId         → mark "I'm going"
 *   DELETE /social/rsvp/:eventId         → un-RSVP
 *   GET    /social/event/:eventId/going  → who is going (public count + friends)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Contacts from 'expo-contacts';
import { Users, Calendar, MapPin, CheckCircle, Plus } from 'lucide-react-native';
import { format, isPast } from 'date-fns';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../design/theme';

const { colors } = theme;

const COLORS = {
  background: colors.dark.background, surface: colors.dark.surface,
  accent: colors.primary[500], text: colors.dark.text,
  textSecondary: colors.dark.textSecondary, white: '#FFFFFF',
  green: '#1FC98E', border: 'rgba(255,255,255,0.06)',
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface FriendActivity {
  friend: { id: string; firstName: string; lastName?: string; profileImageUrl?: string };
  event: {
    id: string; title: string; startDate?: string;
    bannerImageUrl?: string; images?: string[];
    location?: any; ticketTypes?: any[];
  };
  rsvpAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function hashPhone(phone: string): Promise<string> {
  // Simple SHA-256 via SubtleCrypto (available in Hermes)
  const encoder = new TextEncoder();
  const data = encoder.encode(phone.replace(/\D/g, ''));
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function syncContacts(): Promise<string[]> {
  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') return [];
  const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
  const hashes: string[] = [];
  await Promise.all(
    data.flatMap((contact) =>
      (contact.phoneNumbers ?? []).map(async (p) => {
        if (p.number) hashes.push(await hashPhone(p.number));
      }),
    ),
  );
  return [...new Set(hashes)];
}

// ── goingService (inline — move to services/goingService.ts) ──────────────────
const goingService = {
  async syncContacts(phoneHashes: string[]): Promise<FriendActivity[]> {
    try {
      const res = await api.post('/social/sync-contacts', { phoneHashes });
      return res.data ?? [];
    } catch { return []; }
  },

  async getFeed(): Promise<FriendActivity[]> {
    try {
      const res = await api.get('/social/feed');
      return res.data ?? [];
    } catch { return []; }
  },

  async rsvp(eventId: string): Promise<void> {
    await api.post(`/social/rsvp/${eventId}`);
  },

  async unRsvp(eventId: string): Promise<void> {
    await api.delete(`/social/rsvp/${eventId}`);
  },
};

// ── Friend avatar stack ───────────────────────────────────────────────────────
function AvatarStack({ friends, max = 3 }: { friends: FriendActivity['friend'][]; max?: number }) {
  const shown = friends.slice(0, max);
  const extra = friends.length - max;
  return (
    <View style={styles.avatarStack}>
      {shown.map((f, i) => (
        <View key={f.id} style={[styles.avatarWrap, { marginLeft: i === 0 ? 0 : -10, zIndex: max - i }]}>
          {f.profileImageUrl ? (
            <Image source={{ uri: f.profileImageUrl }} style={styles.avatarSm} />
          ) : (
            <View style={[styles.avatarSm, styles.avatarSmPlaceholder]}>
              <Text style={styles.avatarSmInitial}>{f.firstName.charAt(0)}</Text>
            </View>
          )}
        </View>
      ))}
      {extra > 0 && (
        <View style={[styles.avatarSm, styles.avatarSmExtra, { marginLeft: -10 }]}>
          <Text style={styles.avatarSmInitial}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

// ── Activity card ─────────────────────────────────────────────────────────────
function ActivityCard({
  activities,
  onEventPress,
  onRsvp,
}: {
  activities: FriendActivity[];
  onEventPress: (event: FriendActivity['event']) => void;
  onRsvp: (eventId: string, isGoing: boolean) => void;
}) {
  const event = activities[0].event;
  const friends = activities.map((a) => a.friend);
  const [isGoing, setIsGoing] = useState(false);
  const image = event.bannerImageUrl ?? event.images?.[0];
  const location = typeof event.location === 'string' ? event.location : event.location?.name;

  const friendLabel = friends.length === 1
    ? friends[0].firstName
    : friends.length === 2
    ? `${friends[0].firstName} & ${friends[1].firstName}`
    : `${friends[0].firstName} & ${friends.length - 1} others`;

  const handleRsvp = async () => {
    const next = !isGoing;
    setIsGoing(next); // optimistic
    try { await onRsvp(event.id, next); }
    catch { setIsGoing(!next); } // revert
  };

  return (
    <TouchableOpacity style={styles.actCard} onPress={() => onEventPress(event)} activeOpacity={0.85}>
      <Image
        source={{ uri: image || 'https://via.placeholder.com/300x140' }}
        style={styles.actCardImage}
      />
      <View style={styles.actCardBody}>
        {/* Friend context */}
        <View style={styles.friendRow}>
          <AvatarStack friends={friends} />
          <Text style={styles.friendLabel} numberOfLines={1}>
            <Text style={styles.friendName}>{friendLabel}</Text>
            {' '}going
          </Text>
        </View>

        {/* Event info */}
        <Text style={styles.actCardTitle} numberOfLines={2}>{event.title}</Text>
        {event.startDate && (
          <View style={styles.metaRow}>
            <Calendar size={12} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{format(new Date(event.startDate), 'EEE d MMM · h:mm a')}</Text>
          </View>
        )}
        {location && (
          <View style={styles.metaRow}>
            <MapPin size={12} color={COLORS.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>{location}</Text>
          </View>
        )}

        {/* RSVP button */}
        {event.startDate && !isPast(new Date(event.startDate)) && (
          <TouchableOpacity
            style={[styles.rsvpBtn, isGoing && styles.rsvpBtnActive]}
            onPress={handleRsvp}
            activeOpacity={0.8}
          >
            {isGoing
              ? <CheckCircle size={14} color={COLORS.green} />
              : <Plus size={14} color={COLORS.accent} />}
            <Text style={[styles.rsvpBtnText, isGoing && styles.rsvpBtnTextActive]}>
              {isGoing ? "I'm Going!" : "I'm Going"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export function GoingScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuthStore();

  const [feed, setFeed] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contactsSynced, setContactsSynced] = useState(false);
  const [permDenied, setPermDenied] = useState(false);

  const loadFeed = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const activities = await goingService.getFeed();
      setFeed(activities);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const runContactSync = useCallback(async () => {
    const hashes = await syncContacts();
    if (hashes.length === 0) {
      setPermDenied(true);
      return;
    }
    setContactsSynced(true);
    const matched = await goingService.syncContacts(hashes);
    // Merge into feed, dedupe by event id + friend id
    setFeed((prev) => {
      const existing = new Set(prev.map((a) => `${a.event.id}:${a.friend.id}`));
      const fresh = matched.filter((a) => !existing.has(`${a.event.id}:${a.friend.id}`));
      return [...prev, ...fresh];
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    loadFeed();
  }, [loadFeed, isAuthenticated]);

  // ── Group activities by event ─────────────────────────────────────────────
  const eventGroups = Object.values(
    feed.reduce<Record<string, FriendActivity[]>>((acc, a) => {
      if (!acc[a.event.id]) acc[a.event.id] = [];
      acc[a.event.id].push(a);
      return acc;
    }, {}),
  );

  const handleRsvp = async (eventId: string, isGoing: boolean) => {
    if (isGoing) await goingService.rsvp(eventId);
    else await goingService.unRsvp(eventId);
  };

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.gateContainer}>
          <Users size={48} color={COLORS.textSecondary} />
          <Text style={styles.gateTitle}>See who's going</Text>
          <Text style={styles.gateSub}>Sign in to see which of your contacts are attending events on plat.</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Going?</Text>
        {!contactsSynced && !permDenied && (
          <TouchableOpacity style={styles.syncBtn} onPress={runContactSync}>
            <Users size={14} color={COLORS.white} />
            <Text style={styles.syncBtnText}>Find Friends</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contacts permission nudge */}
      {!contactsSynced && !permDenied && feed.length === 0 && !loading && (
        <TouchableOpacity style={styles.contactsBanner} onPress={runContactSync} activeOpacity={0.8}>
          <Users size={20} color={COLORS.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactsBannerTitle}>Connect with friends</Text>
            <Text style={styles.contactsBannerSub}>Find contacts who use plat and see what they're going to</Text>
          </View>
          <Text style={styles.contactsBannerArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Feed */}
      {loading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={eventGroups}
          keyExtractor={(group) => group[0].event.id}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadFeed(true)} tintColor={COLORS.accent} />
          }
          renderItem={({ item: group }) => (
            <ActivityCard
              activities={group}
              onEventPress={(event) => navigation.navigate('EventDetail', { eventId: event.id, event })}
              onRsvp={handleRsvp}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>Nothing yet</Text>
              <Text style={styles.emptySubtitle}>
                {contactsSynced
                  ? 'None of your contacts are going to events right now'
                  : 'Sync your contacts to see what friends are up to'}
              </Text>
              {!contactsSynced && !permDenied && (
                <TouchableOpacity style={styles.syncBtnLg} onPress={runContactSync}>
                  <Text style={styles.syncBtnLgText}>Sync Contacts</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  syncBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  syncBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white },

  contactsBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 16, padding: 14, backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  contactsBannerTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  contactsBannerSub: { fontSize: 12, color: COLORS.textSecondary },
  contactsBannerArrow: { fontSize: 20, color: COLORS.textSecondary },

  actCard: { backgroundColor: COLORS.surface, borderRadius: 16, overflow: 'hidden' },
  actCardImage: { width: '100%', height: 140, resizeMode: 'cover' },
  actCardBody: { padding: 14 },

  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatarStack: { flexDirection: 'row' },
  avatarWrap: {},
  avatarSm: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: COLORS.surface },
  avatarSmPlaceholder: { backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  avatarSmExtra: { backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  avatarSmInitial: { fontSize: 10, fontWeight: '700', color: COLORS.white },
  friendLabel: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
  friendName: { fontWeight: '700', color: COLORS.text },

  actCardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  metaText: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },

  rsvpBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.accent, backgroundColor: 'rgba(123,92,250,0.08)' },
  rsvpBtnActive: { borderColor: COLORS.green, backgroundColor: 'rgba(31,201,142,0.1)' },
  rsvpBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  rsvpBtnTextActive: { color: COLORS.green },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  syncBtnLg: { marginTop: 6, backgroundColor: COLORS.accent, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 30 },
  syncBtnLgText: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  gateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  gateTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  gateSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  signInBtn: { marginTop: 8, backgroundColor: COLORS.accent, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  signInBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
