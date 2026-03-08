import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  ChevronLeft,
  Settings,
  Calendar,
  BarChart3,
  Wallet,
  Users,
  ScanLine,
  ChevronRight,
  Plus,
  TrendingUp,
  Ticket,
  DollarSign,
  Clock,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import {
  organizersService,
  OrganizerAnalytics,
} from '../../services/organizersService';
import { format } from 'date-fns';

const COLORS = {
  primary: '#000000',
  accent: '#8B5CF6',
  accentLight: '#EDE9FE',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E5E7EB',
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  info: '#3B82F6',
  infoBg: '#EFF6FF',
};

const formatCurrency = (amount: number, currency = 'KES') =>
  `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export function PlatProDashboardScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const organizerName = user?.firstName
    ? `${user.firstName}'s Dashboard`
    : 'Organizer Dashboard';

  const [analytics, setAnalytics] = useState<OrganizerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await organizersService.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [loadAnalytics]),
  );

  const cur = analytics?.currency || 'KES';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color={COLORS.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plat Pro</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Settings color={COLORS.primary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAnalytics(true)}
            tintColor={COLORS.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Summary */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0] || 'O'}
              </Text>
            </View>
            <View>
              <Text style={styles.profileName}>{organizerName}</Text>
              <Text style={styles.profileRole}>Verified Organizer</Text>
            </View>
          </View>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('PlatProCreateEvent')}
            >
              <Plus color="white" size={20} />
              <Text style={styles.createButtonText}>New Event</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.refundsButton}
              onPress={() => navigation.navigate('RefundManagement')}
            >
              <DollarSign color={COLORS.primary} size={18} />
              <Text style={styles.refundsButtonText}>Refunds</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Financial Metrics Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        ) : (
          <>
            <View style={styles.metricsGrid}>
              {/* Current Balance — highlighted */}
              <View style={[styles.metricCard, styles.metricCardHighlight]}>
                <View style={styles.metricIconBox}>
                  <Wallet size={20} color={COLORS.accent} />
                </View>
                <Text style={styles.metricLabel}>Current Balance</Text>
                <Text style={[styles.metricValue, styles.metricValueHighlight]}>
                  {formatCurrency(analytics?.currentBalance ?? 0, cur)}
                </Text>
              </View>

              {/* Total Tickets Sold */}
              <View style={styles.metricCard}>
                <View style={[styles.metricIconBox, { backgroundColor: COLORS.successBg }]}>
                  <Ticket size={20} color={COLORS.success} />
                </View>
                <Text style={styles.metricLabel}>Tickets Sold</Text>
                <Text style={styles.metricValue}>
                  {(analytics?.totalTicketsSold ?? 0).toLocaleString()}
                </Text>
              </View>

              {/* Projected Income */}
              <View style={styles.metricCard}>
                <View style={[styles.metricIconBox, { backgroundColor: COLORS.infoBg }]}>
                  <TrendingUp size={20} color={COLORS.info} />
                </View>
                <Text style={styles.metricLabel}>Projected</Text>
                <Text style={styles.metricValue}>
                  {formatCurrency(analytics?.projectedIncome ?? 0, cur)}
                </Text>
              </View>

              {/* Past Income */}
              <View style={styles.metricCard}>
                <View style={[styles.metricIconBox, { backgroundColor: COLORS.warningBg }]}>
                  <DollarSign size={20} color={COLORS.warning} />
                </View>
                <Text style={styles.metricLabel}>Past Income</Text>
                <Text style={styles.metricValue}>
                  {formatCurrency(analytics?.pastIncome ?? 0, cur)}
                </Text>
              </View>
            </View>

            {/* Active Events */}
            {(analytics?.activeEvents?.length ?? 0) > 0 && (
              <>
                <Text style={styles.sectionTitle}>Your Events</Text>
                <View style={styles.eventsContainer}>
                  {analytics!.activeEvents.map((event) => {
                    const isUpcoming = new Date(event.startDate) > new Date();
                    return (
                      <TouchableOpacity
                        key={event.id}
                        style={styles.eventRow}
                        activeOpacity={0.7}
                        onPress={() =>
                          navigation.navigate('EventDetail', {
                            eventId: event.id,
                          })
                        }
                      >
                        <Image
                          source={{
                            uri:
                              event.bannerImageUrl ||
                              'https://via.placeholder.com/60',
                          }}
                          style={styles.eventImage}
                        />
                        <View style={styles.eventInfo}>
                          <Text style={styles.eventTitle} numberOfLines={1}>
                            {event.title}
                          </Text>
                          <View style={styles.eventMeta}>
                            <Clock size={12} color={COLORS.textSecondary} />
                            <Text style={styles.eventMetaText}>
                              {format(
                                new Date(event.startDate),
                                'MMM d, yyyy',
                              )}
                            </Text>
                            <View
                              style={[
                                styles.statusDot,
                                {
                                  backgroundColor: isUpcoming
                                    ? COLORS.success
                                    : COLORS.textSecondary,
                                },
                              ]}
                            />
                            <Text style={styles.eventMetaText}>
                              {isUpcoming ? 'Upcoming' : 'Past'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.eventStats}>
                          <Text style={styles.eventStatValue}>
                            {event.ticketsSold}
                          </Text>
                          <Text style={styles.eventStatLabel}>sold</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}

        {/* Management Menu */}
        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('PlatProEvents')}
          >
            <View
              style={[styles.menuIconBox, { backgroundColor: COLORS.accentLight }]}
            >
              <Calendar size={24} color={COLORS.accent} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>My Events</Text>
              <Text style={styles.menuSubtitle}>Manage listings & details</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Wallet')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#F0FDF4' }]}>
              <Wallet size={24} color="#16A34A" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>My Wallet</Text>
              <Text style={styles.menuSubtitle}>Withdraw earnings</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <View style={[styles.menuIconBox, { backgroundColor: '#E0F2FE' }]}>
              <BarChart3 size={24} color="#0284C7" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Analytics</Text>
              <Text style={styles.menuSubtitle}>Sales & traffic insights</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('CheckInScanner')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#FEF3C7' }]}>
              <ScanLine size={24} color="#D97706" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Check-in Scanner</Text>
              <Text style={styles.menuSubtitle}>Scan attendee tickets</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('RefundManagement')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#FCE7F3' }]}>
              <DollarSign size={24} color="#BE185D" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Refund Requests</Text>
              <Text style={styles.menuSubtitle}>Review and process refunds</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('SafetyCenter')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Users size={24} color="#DC2626" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Organizer Support</Text>
              <Text style={styles.menuSubtitle}>Help & resources</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    borderBottomColor: COLORS.border,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  content: { padding: 16, paddingBottom: 40 },

  profileCard: {
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  profileName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  profileRole: { fontSize: 13, color: COLORS.textSecondary },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: { color: 'white', fontWeight: '600', fontSize: 13 },
  refundsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  refundsButtonText: { color: COLORS.text, fontWeight: '600', fontSize: 13 },

  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  metricCardHighlight: {
    backgroundColor: COLORS.accentLight,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  metricValue: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  metricValueHighlight: { color: COLORS.accent },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.text,
  },

  eventsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  eventImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  eventInfo: { flex: 1, marginLeft: 12 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  eventMetaText: { fontSize: 12, color: COLORS.textSecondary },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 6 },
  eventStats: { alignItems: 'center', marginLeft: 8, minWidth: 40 },
  eventStatValue: { fontSize: 18, fontWeight: '700', color: COLORS.accent },
  eventStatLabel: { fontSize: 11, color: COLORS.textSecondary },

  menuContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  menuSubtitle: { fontSize: 13, color: COLORS.textSecondary },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 72 },
});
