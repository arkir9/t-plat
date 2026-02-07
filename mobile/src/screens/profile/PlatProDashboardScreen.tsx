import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft, BarChart3, Calendar, Ticket, Plus } from 'lucide-react-native';
import { eventsService, Event } from '../../services/eventsService';
import { organizersService, OrganizerProfile } from '../../services/organizersService';

const COLORS = {
  primary: '#000000',
  accent: '#8B5CF6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
};

export function PlatProDashboardScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<OrganizerProfile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [p, myEvents] = await Promise.all([
          organizersService.getMyProfiles().catch(() => []),
          eventsService.getMyEvents().catch(() => []),
        ]);
        setProfiles(Array.isArray(p) ? p : []);
        setEvents(Array.isArray(myEvents?.items ?? myEvents) ? (myEvents.items ?? myEvents) : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const upcoming = events.filter((e) => new Date(e.startDate) > new Date());
  const past = events.filter((e) => new Date(e.startDate) <= new Date());

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plat Pro dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Summary cards */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Upcoming events</Text>
              <Text style={styles.summaryValue}>{upcoming.length}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Past events</Text>
              <Text style={styles.summaryValue}>{past.length}</Text>
            </View>
          </View>

          {/* Profiles quick view */}
          {profiles.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Plat Pro profiles</Text>
              {profiles.map((p) => (
                <View key={p.id} style={styles.profileRow}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>{p.name[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>{p.name}</Text>
                    <Text style={styles.profileMeta}>
                      {p.profileType === 'event_organizer' ? 'Event organizer' : 'Venue / club'} ·{' '}
                      {p.verificationStatus === 'verified'
                        ? 'Verified'
                        : p.verificationStatus === 'rejected'
                        ? 'Rejected'
                        : 'Pending review'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Quick links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manage</Text>
            <TouchableOpacity
              style={styles.rowButton}
              onPress={() => navigation.navigate('PlatProEvents')}
            >
              <View style={styles.rowLeft}>
                <Calendar size={20} color={COLORS.primary} />
                <Text style={styles.rowLabel}>My events</Text>
              </View>
              <Text style={styles.rowMeta}>{events.length} total</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rowButton}
              onPress={() => navigation.navigate('PlatProCreateEvent')}
            >
              <View style={styles.rowLeft}>
                <Plus size={20} color={COLORS.primary} />
                <Text style={styles.rowLabel}>Create new event</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Simple placeholder analytics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights (coming soon)</Text>
            <View style={styles.analyticsCard}>
              <BarChart3 size={20} color={COLORS.accent} />
              <Text style={styles.analyticsText}>
                You’ll soon see attendees, revenue, and top events here.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 32 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
  },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: COLORS.textPrimary },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileAvatarText: { fontWeight: '700', color: COLORS.textPrimary },
  profileName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  profileMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  rowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { fontSize: 15, color: COLORS.textPrimary },
  rowMeta: { fontSize: 13, color: COLORS.textSecondary },
  analyticsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  analyticsText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
});

