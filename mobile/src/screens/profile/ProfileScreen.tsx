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
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { organizersService, ApplicationStatus } from '../../services/organizersService';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../design/theme';

const { colors } = theme;
const COLORS = {
  accent: colors.primary[500],
  background: colors.dark.background,
  surface: colors.dark.surface,
  textPrimary: colors.dark.text,
  textSecondary: colors.dark.textSecondary,
  white: '#FFFFFF',
  green: colors.success,
  amber: '#F59E0B',
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
  const { user, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [appStatus, setAppStatus] = useState<ApplicationStatus | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadApplicationStatus();
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

  const menuItems = [
    { icon: Ticket, label: 'My Tickets', route: 'Tickets' },
    { icon: Heart, label: 'Favorites', route: 'Favorites' },
    { icon: Clock, label: 'Waitlist', route: 'Waitlist' },
    { icon: Shield, label: 'Safety Center', route: 'SafetyCenter' },
    { icon: Settings, label: 'Settings', route: 'Settings' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.textPrimary} />
          ) : (
            <>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'No email'}</Text>
              {(isOrganizer || isAdmin) && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {isAdmin ? 'ADMIN' : 'ORGANIZER'}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={styles.menuItemLeft}>
                <item.icon size={24} color={COLORS.textPrimary} />
                <Text style={styles.menuItemText}>{item.label}</Text>
              </View>
              <ChevronRight size={20} color={COLORS.textSecondary} />
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
          <LogOut size={24} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
  content: { padding: 16 },

  profileSection: {
    alignItems: 'center', paddingVertical: 32,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginBottom: 24,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: COLORS.white },
  profileName: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
  profileEmail: { fontSize: 14, color: COLORS.textSecondary },
  roleBadge: {
    marginTop: 8, backgroundColor: COLORS.accent, paddingHorizontal: 12,
    paddingVertical: 3, borderRadius: 999,
  },
  roleBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },

  menuSection: {
    backgroundColor: COLORS.surface, borderRadius: 12, overflow: 'hidden', marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuItemText: { fontSize: 16, color: COLORS.textPrimary },

  // Admin card
  adminCard: {
    marginBottom: 16, borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)',
  },
  adminCardInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  adminIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B82F6',
    justifyContent: 'center', alignItems: 'center',
  },
  adminTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  adminSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },

  // Plat Pro card
  proCard: { marginTop: 0, marginBottom: 24, padding: 16, borderRadius: 16, backgroundColor: '#050816' },
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444',
  },
  signOutText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
});
