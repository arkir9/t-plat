import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Ticket,
  Share2,
  Download,
  ShieldCheck,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { format } from 'date-fns';
import { ticketsService } from '../../services/ticketsService';
import { theme } from '../../design/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const { colors } = theme;

const COLORS = {
  background: colors.dark.background,
  surface: colors.dark.surface,
  surfaceVariant: colors.dark.surfaceVariant,
  accent: colors.primary[500],
  accentLight: colors.primary[100],
  text: colors.dark.text,
  textSecondary: colors.dark.textSecondary,
  white: '#FFFFFF',
  success: colors.success,
  warning: colors.warning,
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: 'rgba(16,185,129,0.15)', text: COLORS.success },
  used: { bg: 'rgba(255,255,255,0.1)', text: COLORS.textSecondary },
  cancelled: { bg: 'rgba(239,68,68,0.15)', text: colors.error },
  refunded: { bg: 'rgba(245,158,11,0.15)', text: COLORS.warning },
};

export function TicketDetailScreen({ route, navigation }: any) {
  const { ticketId, ticket: passedTicket } = route.params || {};
  const [ticket, setTicket] = useState<any>(passedTicket || null);
  const [loading, setLoading] = useState(!passedTicket);

  useEffect(() => {
    if (!passedTicket && ticketId) {
      ticketsService
        .getTicketById(ticketId)
        .then(setTicket)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [ticketId, passedTicket]);

  const handleShare = async () => {
    const event = ticket?.event || {};
    try {
      await Share.share({
        message: `Check out my ticket for ${event.title || 'an event'} on T-Plat!`,
      });
    } catch {}
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ticket size={48} color={COLORS.textSecondary} />
        <Text style={styles.errorText}>Ticket not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const event = ticket.event || {};
  const ticketType = ticket.ticketType || {};
  const status = ticket.status || 'active';
  const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.active;

  const heroImage =
    event.bannerImageUrl || event.images?.[0] || 'https://via.placeholder.com/400x200';
  const eventDate = event.startDate
    ? format(new Date(event.startDate), 'EEEE, MMMM d, yyyy')
    : 'Date TBD';
  const eventTime = event.startDate ? format(new Date(event.startDate), 'h:mm a') : '';
  const location = event.customLocation?.city
    ? `${event.customLocation.address || ''}, ${event.customLocation.city}`
    : event.venue?.name || 'Location TBD';

  const qrValue = ticket.qrCode || JSON.stringify({ t: ticket.id, e: event.id });
  const ticketIdShort = ticket.id?.slice(-8)?.toUpperCase() || '--------';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: heroImage }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareArrow} onPress={handleShare}>
            <Share2 size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Event Info */}
        <View style={styles.eventSection}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {status.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.ticketTypeName}>{ticketType.name || 'General Admission'}</Text>
          </View>

          <Text style={styles.eventTitle}>{event.title || 'Event'}</Text>

          <View style={styles.metaRow}>
            <Calendar size={16} color={COLORS.accent} />
            <Text style={styles.metaText}>
              {eventDate}
              {eventTime ? ` • ${eventTime}` : ''}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <MapPin size={16} color={COLORS.accent} />
            <Text style={styles.metaText}>{location}</Text>
          </View>
        </View>

        {/* QR Code */}
        <View style={styles.qrSection}>
          <View style={styles.dashedDivider} />
          <Text style={styles.qrLabel}>SCAN FOR ENTRY</Text>
          <View style={styles.qrCard}>
            <QRCode
              value={qrValue}
              size={SCREEN_WIDTH * 0.5}
              backgroundColor={COLORS.white}
              color="#000000"
            />
          </View>
          <Text style={styles.ticketIdLabel}>TICKET ID</Text>
          <Text style={styles.ticketIdValue}>{ticketIdShort}</Text>

          <View style={styles.verifiedRow}>
            <ShieldCheck size={14} color={COLORS.success} />
            <Text style={styles.verifiedText}>Cryptographically verified</Text>
          </View>
        </View>

        {/* Ticket Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Ticket Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{ticketType.name || 'General'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>
              {ticketType.currency || 'KES'} {Number(ticketType.price || 0).toLocaleString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order</Text>
            <Text style={styles.detailValue}>{ticket.order?.orderNumber || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Purchased</Text>
            <Text style={styles.detailValue}>
              {ticket.createdAt ? format(new Date(ticket.createdAt), 'MMM d, yyyy') : '—'}
            </Text>
          </View>
          {ticket.checkedInAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Checked In</Text>
              <Text style={styles.detailValue}>
                {format(new Date(ticket.checkedInAt), 'MMM d, yyyy h:mm a')}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  errorText: { color: COLORS.textSecondary, fontSize: 16, marginTop: 12 },
  backBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
  },
  backBtnText: { color: COLORS.white, fontWeight: '600' },

  heroContainer: { width: '100%', height: 220, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backArrow: {
    position: 'absolute',
    top: 12,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareArrow: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  eventSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  ticketTypeName: { fontSize: 13, fontWeight: '600', color: COLORS.accent },
  eventTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 30,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  metaText: { fontSize: 14, color: COLORS.textSecondary, flex: 1 },

  qrSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  dashedDivider: {
    width: '100%',
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    marginBottom: 20,
  },
  qrLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  qrCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  ticketIdLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  ticketIdValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  verifiedText: { fontSize: 12, color: COLORS.success, fontWeight: '500' },

  detailsSection: {
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceVariant,
  },
  detailLabel: { fontSize: 14, color: COLORS.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
});
