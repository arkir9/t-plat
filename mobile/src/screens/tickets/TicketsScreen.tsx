import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Ticket,
  Calendar,
  MapPin,
  ChevronLeft,
  Wallet,
  Share2,
  User,
  Info,
  WifiOff,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ticketsService } from '../../services/ticketsService';
import { useAuthStore } from '../../store/authStore';
import { useHydrationStore } from '../../store/authStore';
import { format } from 'date-fns';
import { theme } from '../../design/theme';

const { colors } = theme;

const TICKETS_CACHE_KEY = '@tplat_tickets_cache';

const COLORS = {
  background: colors.dark.background,
  surface: colors.dark.surface,
  surfaceVariant: colors.dark.surfaceVariant,
  accent: colors.primary[500],
  text: colors.dark.text,
  textSecondary: colors.dark.textSecondary,
  white: '#FFFFFF',
  warning: colors.warning,
};

const OfflineBanner = () => (
  <View style={styles.offlineBanner}>
    <WifiOff size={16} color={COLORS.warning} />
    <Text style={styles.offlineBannerText}>
      You're viewing cached tickets. Pull to refresh when online.
    </Text>
  </View>
);

export const TicketsScreen = () => {
  const navigation = useNavigation<any>();
  const authHydrated = useHydrationStore((s) => s.authHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past'>('Upcoming');
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  const loadTickets = useCallback(async (refresh = false) => {
    if (!isAuthenticated) return;
    setSessionExpiredMessage(null);
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const userTickets = await ticketsService.getMyTickets();
      const ticketList = Array.isArray(userTickets) ? userTickets : [];
      setTickets(ticketList);
      setIsOffline(false);

      try {
        await AsyncStorage.setItem(TICKETS_CACHE_KEY, JSON.stringify(ticketList));
      } catch {}
    } catch (error: any) {
      const is401 = error?.response?.status === 401;
      if (is401) {
        setSessionExpiredMessage('Session expired. Please sign in again.');
        setTickets([]);
      } else {
        try {
          const cached = await AsyncStorage.getItem(TICKETS_CACHE_KEY);
          if (cached) {
            setTickets(JSON.parse(cached));
            setIsOffline(true);
          } else {
            setTickets([]);
          }
        } catch {
          setTickets([]);
        }
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authHydrated) return;
    if (!isAuthenticated) {
      setTickets([]);
      setIsLoading(false);
      return;
    }
    loadTickets();
  }, [authHydrated, isAuthenticated, loadTickets]);

  const filteredTickets = tickets.filter((ticket) => {
    const eventDate = ticket.event?.startDate ? new Date(ticket.event.startDate) : null;
    const now = new Date();
    if (activeTab === 'Upcoming') return !eventDate || eventDate >= now;
    return eventDate && eventDate < now;
  });

  const renderExpandedTicket = (item: any) => {
    const event = item.event || {};
    const dateStr = event.startDate ? format(new Date(event.startDate), 'MMM d, yyyy • h:mm a') : 'TBD';
    const eventType = (event.eventType || 'MUSIC FESTIVAL').toUpperCase().replace('_', ' ');
    const imageUri = event.images?.[0] || event.images?.[1] || 'https://via.placeholder.com/80';
    const ticketId = item.id?.slice(-8) || 'ND-98213-XP';

    return (
      <TouchableOpacity
        style={styles.expandedCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id, ticket: item })}
      >
        <View style={styles.expandedHeader}>
          <Image source={{ uri: imageUri }} style={styles.eventThumb} />
          <View style={styles.expandedHeaderRight}>
            <View style={styles.eventTypeBadge}>
              <Text style={styles.eventTypeText}>{eventType}</Text>
            </View>
            <Text style={styles.expandedTitle}>{event.title || 'Neon Dreams 2024'}</Text>
            <View style={styles.expandedDateRow}>
              <Calendar size={14} color={COLORS.textSecondary} />
              <Text style={styles.expandedDateText}>{dateStr}</Text>
            </View>
          </View>
        </View>
        <View style={styles.qrSection}>
          <View style={styles.qrBox}>
            <Text style={styles.entryLabel}>ENTRY</Text>
            <QRCode value={item.id || 'TICKET'} size={140} backgroundColor="#FFF" color="#000" />
          </View>
          <Text style={styles.ticketIdText}>TICKET ID: {ticketId}</Text>
          <View style={styles.seatBadges}>
            <View style={styles.seatBadge}>
              <Text style={styles.seatLabel}>SECTION</Text>
              <Text style={styles.seatValue}>A2</Text>
            </View>
            <View style={styles.seatBadge}>
              <Text style={styles.seatLabel}>ROW</Text>
              <Text style={styles.seatValue}>12</Text>
            </View>
            <View style={styles.seatBadge}>
              <Text style={styles.seatLabel}>SEAT</Text>
              <Text style={styles.seatValue}>42</Text>
            </View>
          </View>
          <View style={styles.ticketActions}>
            <TouchableOpacity style={styles.addToWalletBtn}>
              <Wallet size={20} color={COLORS.white} />
              <Text style={styles.addToWalletText}>Add to Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn}>
              <Share2 size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCompactTicket = (item: any) => {
    const event = item.event || {};
    const dateStr = event.startDate ? format(new Date(event.startDate), 'NOV 04') : 'TBD';
    const eventType = (event.eventType || 'EXHIBITION').toUpperCase().replace('_', ' ');
    const location = event.customLocation?.city
      ? `${event.customLocation.address || ''}, ${event.customLocation.city}`
      : event.venue?.name || 'MOMA, New York';
    const imageUri = event.images?.[0] || event.images?.[1] || 'https://via.placeholder.com/80';

    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id, ticket: item })}
      >
        <Image source={{ uri: imageUri }} style={styles.compactImage} />
        <View style={styles.compactContent}>
          <View style={styles.compactTypeBadge}>
            <Text style={styles.compactTypeText}>{eventType}</Text>
          </View>
          <Text style={styles.compactTitle}>{event.title || 'Digital Soul Art Expo'}</Text>
          <View style={styles.compactMeta}>
            <MapPin size={14} color={COLORS.textSecondary} />
            <Text style={styles.compactMetaText} numberOfLines={1}>{location}</Text>
          </View>
          <View style={styles.compactRight}>
            <Text style={styles.compactDate}>{dateStr}</Text>
            <Text style={styles.viewDetailsLink}>View Entry Details &gt;</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const canGoBack = navigation.canGoBack?.() ?? false;

  if (!authHydrated || (isAuthenticated && isLoading)) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Tickets</Text>
          <TouchableOpacity style={styles.profileIcon}>
            <User size={22} color={COLORS.accent} />
          </TouchableOpacity>
        </View>
        <View style={[styles.center, styles.emptyContainer]}>
          <Ticket size={48} color={COLORS.textSecondary} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>{sessionExpiredMessage || 'Sign in to view your tickets'}</Text>
          <Text style={styles.emptySubtext}>
            {sessionExpiredMessage
              ? 'Your session has expired. Sign in to continue.'
              : 'Sign in or create an account to see your event tickets.'}
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => {
              setSessionExpiredMessage(null);
              useAuthStore.getState().logout();
            }}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top'] as const}>
      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.headerTitle, canGoBack && styles.headerTitleSmall]}>My Tickets</Text>
        <TouchableOpacity style={styles.profileIcon}>
          <User size={22} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('Upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'Upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Past' && styles.tabActive]}
          onPress={() => setActiveTab('Past')}
        >
          <Text style={[styles.tabText, activeTab === 'Past' && styles.tabTextActive]}>
            Past Events
          </Text>
        </TouchableOpacity>
      </View>

      {isOffline && <OfflineBanner />}

      {filteredTickets.length === 0 ? (
        <View style={[styles.center, styles.emptyContainer]}>
          <Text style={styles.emptyText}>No {activeTab.toLowerCase()} tickets</Text>
          <Text style={styles.emptySubtext}>
            {activeTab === 'Upcoming'
              ? "You don't have any upcoming events"
              : "You don't have any past tickets"}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => loadTickets(true)} tintColor={COLORS.accent} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredTickets[0] && renderExpandedTicket(filteredTickets[0])}
          {filteredTickets.slice(1).map((item) => (
            <View key={item.id}>{renderCompactTicket(item)}</View>
          ))}
          <View style={styles.infoBanner}>
            <Info size={20} color={COLORS.accent} />
            <Text style={styles.infoBannerText}>
              Keep your tickets ready! We recommend adding them to your digital wallet for faster
              access at the venue entrance.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  headerTitleSmall: { fontSize: 20 },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  expandedCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  expandedHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  eventThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceVariant,
  },
  expandedHeaderRight: { flex: 1, marginLeft: 12 },
  eventTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    marginBottom: 4,
  },
  eventTypeText: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary },
  expandedTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  expandedDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  expandedDateText: { fontSize: 14, color: COLORS.textSecondary },
  qrSection: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceVariant,
    borderStyle: 'dashed',
  },
  qrBox: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  entryLabel: { fontSize: 12, fontWeight: '700', color: '#000', marginBottom: 8 },
  ticketIdText: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  seatBadges: { flexDirection: 'row', gap: 12 },
  seatBadge: {
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  seatLabel: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 4 },
  seatValue: { fontSize: 16, fontWeight: '700', color: COLORS.accent },
  ticketActions: { flexDirection: 'row', marginTop: 16, gap: 12, alignItems: 'center' },
  addToWalletBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addToWalletText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  shareBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  compactImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceVariant,
  },
  compactContent: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  compactTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  compactTypeText: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary },
  compactTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  compactMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  compactMetaText: { fontSize: 12, color: COLORS.textSecondary },
  compactRight: { alignItems: 'flex-end' },
  compactDate: { fontSize: 18, fontWeight: '700', color: COLORS.accent },
  viewDetailsLink: { fontSize: 12, fontWeight: '600', color: COLORS.accent, marginTop: 4 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  emptyContainer: { flex: 1, paddingVertical: 40 },
  emptyText: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 },
  signInButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  signInButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.12)',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 10,
  },
  offlineBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.warning,
    fontWeight: '500',
    lineHeight: 18,
  },
});
