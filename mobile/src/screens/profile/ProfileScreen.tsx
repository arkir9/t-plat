import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ticket, Heart, Clock, Settings, LogOut, ChevronRight, Shield, Star } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { useNavigation } from '@react-navigation/native';

const COLORS = {
  primary: '#000000',
  accent: '#8B5CF6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  white: '#FFFFFF',
};

const menuItems = [
  { icon: Ticket, label: 'My Tickets', badge: null },
  { icon: Heart, label: 'Favorites', badge: null },
  { icon: Clock, label: 'Waitlist', badge: null },
  { icon: Shield, label: 'Safety Center', badge: null },
  { icon: Settings, label: 'Settings', badge: null },
];

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const profileData = await authService.getProfile();
      setProfile(profileData);
      // Keep auth store in sync (e.g. role after creating organizer profile)
      useAuthStore.getState().updateUser(profileData);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authService.logout();
    navigation.navigate('Auth' as never);
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
            </>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                if (item.label === 'My Tickets') {
                  navigation.navigate('Tickets');
                } else if (item.label === 'Favorites') {
                  navigation.navigate('Favorites');
                } else if (item.label === 'Waitlist') {
                  navigation.navigate('Waitlist');
                } else if (item.label === 'Safety Center') {
                  navigation.navigate('SafetyCenter');
                } else if (item.label === 'Settings') {
                  navigation.navigate('Settings');
                }
              }}
            >
              <View style={styles.menuItemLeft}>
                <item.icon size={24} color={COLORS.textPrimary} />
                <Text style={styles.menuItemText}>{item.label}</Text>
              </View>
              <View style={styles.menuItemRight}>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <ChevronRight size={20} color={COLORS.textSecondary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Plat Pro CTA */}
        <View style={styles.proCard}>
          <View style={styles.proCardHeader}>
            <View style={styles.proIcon}>
              <Star size={20} color={COLORS.white} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.proTitle}>Plat Pro for organizers</Text>
              <Text style={styles.proSubtitle}>
                Host events, manage venues, and see your ticket sales in one place.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.proButton}
            onPress={() => navigation.navigate('PlatPro')}
          >
            <Text style={styles.proButtonText}>Sign in to Plat Pro</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <LogOut size={24} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  content: {
    padding: 16,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  menuSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  proCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#050816',
  },
  proCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  proIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  proSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  proButton: {
    marginTop: 8,
    backgroundColor: COLORS.white,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  proButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});