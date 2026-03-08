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
  MapPin,
  ChevronLeft,
  User,
  Info,
  WifiOff,
  QrCode,
  Phone,
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
  amber: '#F5A623',
  red: '#FF4D6A',
  green: '#1FC98E',
  background: '#07070F',
  surfaceVariant: '#14142A',
  textSecondary: '#9090B8',
  white: '#FFFFFF',
  warning: '#F5A623',
};

const TAB_BAR_HEIGHT = 72;

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
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past' | 'Waitlist'>('Upcoming');
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
    if (activeTab === 'Waitlist') return false; // placeholder - no waitlist data yet
    if (activeTab === 'Upcoming') return !eventDate || eventDate >= now;
    return eventDate && eventDate < now;
  });

  const hoursUntil = (d: Date) => (d.getTime() - Date.now()) / (1000 * 60 * 60);
  const isWithin24h = (ticket: any) => {
    const d = ticket.event?.startDate ? new Date(ticket.event.startDate) : null;
    if (!d) return false;
    const h = hoursUntil(d);
    return h > 0 && h <= 24;
  };
  const showCountdown = activeTab === 'Upcoming' && filteredTickets.some(isWithin24h);
  const countdownTicket = filteredTickets.find(isWithin24h);

  const isEventActive = (ticket: any) => {
    const start = ticket.event?.startDate ? new Date(ticket.event.startDate) : null;
    const end = ticket.event?.endDate ? new Date(ticket.event.endDate) : null;
    if (!start) return false;
    const now = new Date();
    const twoHoursBefore = new Date(start.getTime() - 2 * 60 * 60 * 1000);
    const eventEnd = end || new Date(start.getTime() + 4 * 60 * 60 * 1000);
    return now >= twoHoursBefore && now <= eventEnd;
  };
  const showSos = activeTab === 'Upcoming' && filteredTickets.some(isEventActive);

  const formatCountdown = (d: Date) => {
    const h = Math.floor((d.getTime() - Date.now()) / (1000 * 60 * 60));
    const m = Math.floor(((d.getTime() - Date.now()) % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
  };

  const getBadgeType = (ticket: any): 'live' | 'up' | 'past' => {
    const start = ticket.event?.startDate ? new Date(ticket.event.startDate) : null;
    const end = ticket.event?.endDate ? new Date(ticket.event.endDate) : null;
    if (!start) return 'up';
    const now = new Date();
    if (now < start) return 'up';
    const eventEnd = end || new Date(start.getTime() + 4 * 60 * 60 * 1000);
    return now <= eventEnd ? 'live' : 'past';
  };

  const renderTicketCard = (item: any) => {
    const event = item.event || {};
    const dateStr = event.startDate ? format(new Date(event.startDate), 'MMM d • h:mm a') : 'TBD';
    const location = event.customLocation?.address || event.venue?.name || 'Location TBD';
    const imageUri = event.images?.[0] || event.images?.[1] || 'https://via.placeholder.com/80';
    const ticketType = item.ticketType?.name || item.ticketTypeName || 'General Admission';
    const badge = getBadgeType(item);

    return (
      <TouchableOpacity
        style={styles.tktCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id, ticket: item })}
      >
        <View style={styles.tktTop}>
          <Image source={{ uri: imageUri }} style={styles.tktThumb} />
          <View style={styles.tktInfo}>
            <Text style={styles.tktName} numberOfLines={1}>{event.title || 'Event'}</Text>
            <Text style={styles.tktMeta} numberOfLines={1}>{dateStr}</Text>
            <Text style={styles.tktMeta} numberOfLines={1}>{location}</Text>
            <View style={[styles.tktBadge, styles[`tktBadge${badge.charAt(0).toUpperCase() + badge.slice(1)}`]]}>
              <Text style={[styles.tktBadgeText, badge === 'live' && styles.tktBadgeTextRed, badge === 'up' && styles.tktBadgeTextAccent, badge === 'past' && styles.tktBadgeTextMuted]}>
                {badge === 'live' ? 'Live' : badge === 'up' ? 'Upcoming' : 'Past'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.tktDivider} />
        <View style={styles.tktBottom}>
          <Text style={styles.tktType}>
            <Text style={styles.tktTypeStrong}>{ticketType}</Text>
          </Text>
          <TouchableOpacity
            style={styles.tktQr}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate('TicketDetail', { ticketId: item.id, ticket: item });
            }}
          >
            <QrCode size={14} color={COLORS.accent2} />
            <Text style={styles.tktQrText}>View QR</Text>
          </TouchableOpacity>
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

      <View style={styles.seg}>
        {(['Upcoming', 'Past', 'Waitlist'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.segT, activeTab === tab && styles.segTOn]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.segTText, activeTab === tab && styles.segTTextOn]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {showCountdown && countdownTicket && (
        <View style={styles.countdownChip}>
          <Text style={styles.countdownChipText}>
            {formatCountdown(new Date(countdownTicket.event.startDate))} until next event
          </Text>
        </View>
      )}

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
        <>
          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={() => loadTickets(true)} tintColor={COLORS.accent} />
            }
            showsVerticalScrollIndicator={false}
          >
            {filteredTickets.map((item) => (
              <View key={item.id}>{renderTicketCard(item)}</View>
            ))}
            <View style={styles.infoBanner}>
              <Info size={20} color={COLORS.accent} />
              <Text style={styles.infoBannerText}>
                Keep your tickets ready! We recommend adding them to your digital wallet for faster
                access at the venue entrance.
              </Text>
            </View>
          </ScrollView>
          {showSos && (
            <TouchableOpacity
              style={styles.sosBtn}
              onPress={() => {
                // TODO: Open SOS / help flow (e.g. call support, emergency contacts)
              }}
            >
              <Phone size={20} color={COLORS.white} />
              <Text style={styles.sosBtnText}>SOS</Text>
            </TouchableOpacity>
          )}
        </>
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
  seg: {
    marginHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segT: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  segTOn: { backgroundColor: COLORS.accent },
  segTText: { fontSize: 11, fontWeight: '600', color: COLORS.muted, textAlign: 'center' },
  segTTextOn: { color: COLORS.white },
  countdownChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: 'rgba(245,166,35,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.25)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  countdownChipText: { fontSize: 10, fontWeight: '700', color: COLORS.amber },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  tktCard: {
    marginBottom: 12,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tktTop: { flexDirection: 'row', gap: 11, padding: 13 },
  tktThumb: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceVariant,
  },
  tktInfo: { flex: 1 },
  tktName: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  tktMeta: { fontSize: 10, color: COLORS.dim, marginBottom: 4 },
  tktBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    marginTop: 4,
  },
  tktBadgeLive: { backgroundColor: 'rgba(255,77,106,0.12)' },
  tktBadgeUp: { backgroundColor: 'rgba(123,92,250,0.12)' },
  tktBadgePast: { backgroundColor: 'rgba(255,255,255,0.05)' },
  tktBadgeText: { fontSize: 9, fontWeight: '700' },
  tktBadgeTextRed: { color: COLORS.red },
  tktBadgeTextAccent: { color: COLORS.accent2 },
  tktBadgeTextMuted: { color: COLORS.muted },
  tktDivider: {
    marginHorizontal: 13,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    borderStyle: 'dashed',
  },
  tktBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 13,
    paddingBottom: 11,
  },
  tktType: { fontSize: 10, color: COLORS.dim },
  tktTypeStrong: { color: COLORS.text, fontWeight: '600' },
  tktQr: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tktQrText: { fontSize: 10, color: COLORS.accent2, fontWeight: '600' },
  sosBtn: {
    position: 'absolute',
    bottom: TAB_BAR_HEIGHT + 14,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sosBtnText: { fontSize: 11, fontWeight: '800', color: COLORS.white, letterSpacing: 0.5 },
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
