import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {
  Ticket,
  Heart,
  Clock,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  Star,
  Briefcase,
  ShieldCheck,
  User,
  CreditCard,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { organizersService, ApplicationStatus } from '../../services/organizersService';
import { favoritesService } from '../../services/favoritesService';
import { ticketsService } from '../../services/ticketsService';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../design/theme';

// v2 design tokens
const COLORS = {
  bg: '#07070F',
  surface: '#10101E',
  card: '#14142A',
  border: 'rgba(255,255,255,0.07)',
  accent: '#7B5CFA',
  accent2: '#B06EFF',
  text: '#EFEFF8',
  muted: '#55547A',
  dim: '#9090B8',
  green: '#1FC98E',
  amber: '#F5A623',
  red: '#FF4D6A',
  background: '#07070F',
  textPrimary: '#EFEFF8',
  textSecondary: '#9090B8',
  white: '#FFFFFF',
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending_email: 'Verify your email',
  pending_admin: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected — reapply',
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending_email: '#F59E0B',
  pending_admin: '#3B82F6',
  approved: '#10B981',
  rejected: '#EF4444',
};

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [appStatus, setAppStatus] = useState<ApplicationStatus | null>(null);
  const [stats, setStats] = useState({ attended: 0, upcoming: 0, saved: 0 });

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadApplicationStatus();
      loadStats();
    }, []),
  );

  const loadProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const profileData = await authService.getProfile();
      useAuthStore.getState().updateUser(profileData);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const loadApplicationStatus = async () => {
    try {
      const res = await organizersService.getMyApplication();
      setAppStatus(res.application?.status ?? null);
    } catch {
      // silent
    }
  };

  const loadStats = async () => {
    try {
      const [tickets, favorites] = await Promise.all([
        ticketsService.getMyTickets().catch(() => []),
        favoritesService.list().catch(() => []),
      ]);
      const list = Array.isArray(tickets) ? tickets : [];
      const now = new Date();
      let attended = 0;
      let upcoming = 0;
      for (const t of list) {
        const d = t.event?.startDate ? new Date(t.event.startDate) : null;
        if (!d) continue;
        if (d < now) attended++;
        else upcoming++;
      }
      setStats({
        attended,
        upcoming,
        saved: Array.isArray(favorites) ? favorites.length : 0,
      });
    } catch {
      // silent
    }
  };

  const handleSignOut = async () => {
    await authService.logout();
  };

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const role = (user as any)?.role ?? 'user';
  const isOrganizer = role === 'organizer';
  const isAdmin = role === 'admin';

  const accountItems = [
    { icon: Ticket, label: 'My Tickets', route: 'Tickets' as const, iconColor: 'pu' as const },
    { icon: Heart, label: 'Going?', route: 'Favorites' as const, iconColor: 'gr' as const },
    { icon: Clock, label: 'Waitlist', route: 'Waitlist' as const, iconColor: 'or' as const },
    { icon: CreditCard, label: 'Wallet & Payments', route: 'Wallet' as const, iconColor: 'gr' as const },
    { icon: Settings, label: 'Settings', route: 'Settings' as const, iconColor: 'gr' as const },
  ];
  const safetyItems = [
    { icon: Shield, label: 'Safety Center', route: 'SafetyCenter' as const, iconColor: 'pk' as const },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profHdr}>
        <Text style={styles.profHdrTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* prof-hero v2 */}
        <View style={styles.profHero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profInfo}>
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.text} />
            ) : (
              <>
                <Text style={styles.profName}>{displayName}</Text>
                <Text style={styles.profEmail}>{user?.email || 'No email'}</Text>
                {(isOrganizer || isAdmin) && (
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>
                      {isAdmin ? 'ADMIN' : 'ORGANIZER'}
                    </Text>
                  </View>
                )}
                <View style={styles.profStats}>
                  <View style={styles.ps}>
                    <Text style={styles.psN}>{stats.attended}</Text>
                    <Text style={styles.psL}>Attended</Text>
                  </View>
                  <View style={styles.ps}>
                    <Text style={styles.psN}>{stats.upcoming}</Text>
                    <Text style={styles.psL}>Upcoming</Text>
                  </View>
                  <View style={styles.ps}>
                    <Text style={styles.psN}>{stats.saved}</Text>
                    <Text style={styles.psL}>Saved</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Menu sections - Account */}
        <View style={styles.menuSec}>
          <Text style={styles.menuSecLabel}>Account</Text>
          {accountItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.mi}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={[styles.miIcon, item.iconColor === 'pu' && styles.miIconPu, item.iconColor === 'gr' && styles.miIconGr, item.iconColor === 'pk' && styles.miIconPk, item.iconColor === 'or' && styles.miIconOr]}>
                <item.icon size={14} color={item.iconColor === 'pu' ? COLORS.accent2 : item.iconColor === 'gr' ? COLORS.green : item.iconColor === 'pk' ? COLORS.red : COLORS.amber} />
              </View>
              <Text style={styles.miLabel}>{item.label}</Text>
              <ChevronRight size={14} color={COLORS.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Menu sections - Safety */}
        <View style={styles.menuSec}>
          <Text style={styles.menuSecLabel}>Safety</Text>
          {safetyItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.mi}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={[styles.miIcon, styles.miIconPk]}>
                <item.icon size={14} color={COLORS.red} />
              </View>
              <Text style={styles.miLabel}>{item.label}</Text>
              <ChevronRight size={14} color={COLORS.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Admin Panel (admin only) */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.adminCard}
            onPress={() => navigation.navigate('AdminDashboard')}
            activeOpacity={0.8}
          >
            <View style={styles.adminCardInner}>
              <View style={styles.adminIcon}>
                <ShieldCheck size={20} color={COLORS.white} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.adminTitle}>Admin Panel</Text>
                <Text style={styles.adminSub}>Review organizer applications</Text>
              </View>
              <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
            </View>
          </TouchableOpacity>
        )}

        {/* Organizer CTA — conditional on role + application status */}
        {isOrganizer ? (
          /* Already an organizer: show Plat Pro dashboard link */
          <TouchableOpacity
            style={styles.proCard}
            onPress={() => navigation.navigate('PlatPro')}
            activeOpacity={0.8}
          >
            <View style={styles.proCardHeader}>
              <View style={styles.proIcon}>
                <Star size={20} color={COLORS.white} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.proTitle}>Plat Pro</Text>
                <Text style={styles.proSubtitle}>Manage events, venues & sales</Text>
              </View>
              <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
            </View>
          </TouchableOpacity>
        ) : appStatus && appStatus !== 'rejected' ? (
          /* Has a pending/approved application */
          <TouchableOpacity
            style={styles.proCard}
            onPress={() => navigation.navigate('PlatProApply')}
            activeOpacity={0.8}
          >
            <View style={styles.proCardHeader}>
              <View style={styles.proIcon}>
                <Briefcase size={20} color={COLORS.white} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.proTitle}>Organizer Application</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[appStatus] }]} />
                  <Text style={styles.proSubtitle}>{STATUS_LABELS[appStatus]}</Text>
                </View>
              </View>
              <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
            </View>
          </TouchableOpacity>
        ) : (
          /* No application or rejected: show "Become an Organizer" */
          <View style={styles.proCard}>
            <View style={styles.proCardHeader}>
              <View style={styles.proIcon}>
                <Star size={20} color={COLORS.white} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.proTitle}>Plat Pro for organizers</Text>
                <Text style={styles.proSubtitle}>
                  Host events, manage venues, and see your ticket sales.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.proButton}
              onPress={() => navigation.navigate('PlatProApply')}
            >
              <Text style={styles.proButtonText}>Become an Organizer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={24} color={COLORS.red} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  profHdr: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 0 },
  profHdrTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  content: { paddingBottom: 32 },

  profHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 14,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  profInfo: { flex: 1 },
  profName: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  profEmail: { fontSize: 11, color: COLORS.dim, marginBottom: 8 },
  roleBadge: {
    marginBottom: 8,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  profStats: { flexDirection: 'row', gap: 16, marginTop: 4 },
  ps: { alignItems: 'center' },
  psN: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  psL: { fontSize: 9, color: COLORS.muted, marginTop: 1 },

  menuSec: { paddingHorizontal: 20, paddingBottom: 10 },
  menuSecLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.12,
    textTransform: 'uppercase',
    color: COLORS.muted,
    marginBottom: 7,
  },
  mi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  miIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miIconPu: { backgroundColor: 'rgba(123,92,250,0.18)' },
  miIconGr: { backgroundColor: 'rgba(31,201,142,0.12)' },
  miIconPk: { backgroundColor: 'rgba(255,77,106,0.12)' },
  miIconOr: { backgroundColor: 'rgba(245,166,35,0.12)' },
  miLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: COLORS.text },

  // Admin card
  adminCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  adminCardInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  adminIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B82F6',
    justifyContent: 'center', alignItems: 'center',
  },
  adminTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  adminSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },

  // Plat Pro card (no money-first banner — user excluded)
  proCard: {
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 24,
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  proCardHeader: { flexDirection: 'row', alignItems: 'center' },
  proIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  proTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  proSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  proButton: {
    marginTop: 14, backgroundColor: COLORS.white, borderRadius: 999,
    paddingVertical: 10, alignItems: 'center',
  },
  proButtonText: { color: '#000000', fontWeight: '600', fontSize: 14 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  signOutButton: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.red,
  },
  signOutText: { fontSize: 16, fontWeight: '600', color: COLORS.red },
});
