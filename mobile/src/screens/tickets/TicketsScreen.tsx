import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ticket, Calendar, MapPin, ChevronLeft } from 'lucide-react-native';
import { ticketsService } from '../../services/ticketsService';
import { useAuthStore } from '../../store/authStore';
import { useHydrationStore } from '../../store/authStore';
import { format } from 'date-fns';

const COLORS = {
  primary: '#000000',
  accent: '#8B5CF6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  white: '#FFFFFF',
};

export const TicketsScreen = () => {
  const navigation = useNavigation<any>();
  const authHydrated = useHydrationStore((s) => s.authHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  const loadTickets = useCallback(async (refresh = false) => {
    if (!isAuthenticated) return;
    setSessionExpiredMessage(null);
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const userTickets = await ticketsService.getMyTickets();
      setTickets(Array.isArray(userTickets) ? userTickets : []);
    } catch (error: any) {
      const is401 = error?.response?.status === 401;
      if (is401) {
        setSessionExpiredMessage('Session expired. Please sign in again.');
      } else {
        console.error('Failed to load tickets:', error);
      }
      setTickets([]);
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

  const onRefresh = useCallback(() => {
    loadTickets(true);
  }, [loadTickets]);

  const filteredTickets = tickets.filter((ticket) => {
    const eventDate = ticket.event?.startDate ? new Date(ticket.event.startDate) : null;
    const now = new Date();

    if (activeTab === 'Upcoming') {
      return !eventDate || eventDate >= now;
    } else {
      return eventDate && eventDate < now;
    }
  });

  const renderTicket = ({ item }: any) => {
    const event = item.event;
    const eventDate = event?.startDate ? format(new Date(event.startDate), 'EEE, MMM d • h:mm a') : 'Date TBD';
    const location = event?.customLocation
      ? `${event.customLocation.address}, ${event.customLocation.city}`
      : event?.venueId
      ? 'Venue'
      : 'Location TBD';
    const ticketTypeName = item.ticketType?.name || 'Ticket';

    return (
      <TouchableOpacity
        style={styles.ticketCard}
        onPress={() => navigation.navigate('MyTicket', { ticketId: item.id })}
      >
        <View style={styles.ticketHeader}>
          <View style={styles.ticketIcon}>
            <Ticket size={24} color={COLORS.accent} />
          </View>
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketTitle}>{event?.title || 'Event'}</Text>
            <View style={styles.ticketMeta}>
              <Calendar size={12} color={COLORS.textSecondary} />
              <Text style={styles.ticketMetaText}>{eventDate}</Text>
            </View>
            <View style={styles.ticketMeta}>
              <MapPin size={12} color={COLORS.textSecondary} />
              <Text style={styles.ticketMetaText} numberOfLines={1}>{location}</Text>
            </View>
            <Text style={styles.ticketType}>{ticketTypeName}</Text>
          </View>
          <View style={[styles.statusBadge, item.status === 'active' && styles.statusActive]}>
            <Text style={[styles.statusText, item.status === 'active' && styles.statusTextActive]}>
              {item.status === 'active' ? 'Active' : item.status === 'used' ? 'Used' : item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const canGoBack = navigation.canGoBack?.() ?? false;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.headerTitle, canGoBack && styles.headerTitleWithBack]}>
          My Tickets
        </Text>
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
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {!authHydrated || (isAuthenticated && isLoading) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : !isAuthenticated ? (
        <View style={styles.emptyContainer}>
          <Ticket size={48} color={COLORS.textSecondary} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>
            {sessionExpiredMessage || 'Sign in to view your tickets'}
          </Text>
          <Text style={styles.emptySubtext}>
            {sessionExpiredMessage
              ? 'Your session has expired. Sign in to continue.'
              : 'Sign in or create an account to see your event tickets.'}
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => {
              setSessionExpiredMessage(null);
              navigation.navigate('Auth');
            }}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : filteredTickets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No {activeTab.toLowerCase()} tickets</Text>
          <Text style={styles.emptySubtext}>
            {activeTab === 'Upcoming' ? "You don't have any upcoming events" : "You don't have any past tickets"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={item => item.id}
          renderItem={renderTicket}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  headerTitleWithBack: {
    fontSize: 20,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  listContent: {
    padding: 16,
  },
  ticketCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  ticketHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  ticketIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketInfo: {
    flex: 1,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ticketMetaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  ticketType: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statusTextActive: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  signInButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});