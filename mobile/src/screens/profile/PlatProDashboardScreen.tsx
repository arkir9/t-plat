import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Settings, 
  Calendar, 
  BarChart3, 
  Wallet, // <--- NEW IMPORT
  Users, 
  ScanLine, 
  ChevronRight,
  Plus 
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';

const COLORS = {
  primary: '#000000',
  accent: '#8B5CF6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E5E7EB',
};

export function PlatProDashboardScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const organizerName = user?.firstName ? `${user.firstName}'s Dashboard` : 'Organizer Dashboard';

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

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Summary */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user?.firstName?.[0] || 'O'}</Text>
            </View>
            <View>
              <Text style={styles.profileName}>{organizerName}</Text>
              <Text style={styles.profileRole}>Verified Organizer</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => navigation.navigate('PlatProCreateEvent')}
          >
            <Plus color="white" size={20} />
            <Text style={styles.createButtonText}>New Event</Text>
          </TouchableOpacity>
        </View>

        {/* Analytics Preview (Mock) */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Sales</Text>
            <Text style={styles.statValue}>KES 0</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Tickets Sold</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
        </View>

        {/* Menu Items */}
        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.menuContainer}>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('PlatProEvents')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#EDE9FE' }]}>
              <Calendar size={24} color={COLORS.accent} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>My Events</Text>
              <Text style={styles.menuSubtitle}>Manage listings & details</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* --- NEW WALLET BUTTON --- */}
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
          {/* ------------------------- */}

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

          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <View style={[styles.menuIconBox, { backgroundColor: '#FEF3C7' }]}>
              <ScanLine size={24} color="#D97706" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Check-in Scanner</Text>
              <Text style={styles.menuSubtitle}>Scan attendee tickets</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

        </View>

        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.menuContainer}>
             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SafetyCenter')}>
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
    marginBottom: 24,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  profileName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  profileRole: { fontSize: 13, color: COLORS.textSecondary },
  createButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: { color: 'white', fontWeight: '600', fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface,
    padding: 16, borderRadius: 16,
    alignItems: 'center',
  },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: COLORS.text },
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
    width: 40, height: 40,
    borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
  },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  menuSubtitle: { fontSize: 13, color: COLORS.textSecondary },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 72 },
});