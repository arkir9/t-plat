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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Ticket,
  Share2,
  Download,
  RefreshCcw,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { format, isPast } from 'date-fns';
import { ticketsService } from '../../services/ticketsService';
import { ShareCardSheet } from '../../components/ShareCardSheet';
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
  red: '#FF4D6A',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:    { bg: 'rgba(16,185,129,0.15)',  text: COLORS.success },
  used:      { bg: 'rgba(255,255,255,0.1)',   text: COLORS.textSecondary },
  cancelled: { bg: 'rgba(239,68,68,0.15)',    text: colors.error },
  refunded:  { bg: 'rgba(245,158,11,0.15)',   text: COLORS.warning },
};

export function TicketDetailScreen({ route, navigation }: any) {
  const { ticketId, ticket: passedTicket } = route.params || {};
  const [ticket, setTicket] = useState<any>(passedTicket || null);
  const [loading, setLoading] = useState(!passedTicket);
  const [shareVisible, setShareVisible] = useState(false);

  useEffect(() => {
    if (!passedTicket && ticketId) {
      ticketsService
        .getTicketById(ticketId)
        .then(setTicket)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [ticketId, passedTicket]);

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

  const heroImage = event.bannerImageUrl || event.images?.[0];

  // Show refund button: ticket must be active AND event must not have started yet
  const eventStarted = event.startDate ? isPast(new Date(event.startDate)) : false;
  const canRefund = status === 'active' && !eventStarted;

  const handleRefund = () => {
    navigation.navigate('RefundRequest', { ticketId: ticket.id, ticket });
  };

  const handleDownload = () => {
    // TODO: trigger offline PDF/pass download
    // ticketsService.downloadTicket(ticket.id)
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket</Text>
        <TouchableOpacity
          onPress={() => setShareVisible(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Share2 color={COLORS.text} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        {heroImage ? (
          <Image source={{ uri: heroImage }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ticket size={40} color={COLORS.textSecondary} />
          </View>
        )}

        {/* Status badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          {ticket.qrCode ? (
            <QRCode
              value={ticket.qrCode}
              size={SCREEN_WIDTH * 0.55}
              color={COLORS.background}
              backgroundColor={COLORS.white}
            />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderText}>QR code unavailable</Text>
            </View>
          )}
          {ticket.ticketNumber && (
            <Text style={styles.ticketNumber}>#{ticket.ticketNumber}</Text>
          )}
        </View>

        {/* Event Info */}
        <View style={styles.infoCard}>
          <Text style={styles.eventTitle}>{event.title || 'Event'}</Text>

          {event.startDate && (
            <View style={styles.infoRow}>
              <Calendar size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>
                {format(new Date(event.startDate), 'EEE, MMM d yyyy · h:mm a')}
              </Text>
            </View>
          )}

          {(event.location?.name || event.location?.address || typeof event.location === 'string') && (
            <View style={styles.infoRow}>
              <MapPin size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>
                {typeof event.location === 'string'
                  ? event.location
                  : event.location?.name || event.location?.address}
              </Text>
            </View>
          )}

          {ticketType.name && (
            <View style={styles.infoRow}>
              <Ticket size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{ticketType.name}</Text>
            </View>
          )}

          {ticket.orderNumber && (
            <Text style={styles.orderNumber}>Order #{ticket.orderNumber}</Text>
          )}
        </View>

        {/* ── Actions ─────────────────────────────────────────── */}
        <View style={styles.actions}>
          {/* Download */}
          <TouchableOpacity style={styles.actionBtn} onPress={handleDownload} activeOpacity={0.8}>
            <Download size={18} color={COLORS.text} />
            <Text style={styles.actionBtnText}>Download</Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShareVisible(true)}
            activeOpacity={0.8}
          >
            <Share2 size={18} color={COLORS.text} />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* ── Request Refund ──────────────────────────────────── */}
        {canRefund && (
          <TouchableOpacity style={styles.refundBtn} onPress={handleRefund} activeOpacity={0.8}>
            <RefreshCcw size={15} color={COLORS.red} />
            <Text style={styles.refundBtnText}>Request Refund</Text>
          </TouchableOpacity>
        )}

        {/* Valid notice */}
        <Text style={styles.validNote}>
          This ticket is valid for one entry. Present QR code at the door.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Share card sheet */}
      <ShareCardSheet
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        event={event}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },

  heroImage: { width: '100%', height: 200, resizeMode: 'cover' },
  heroPlaceholder: {
    width: '100%', height: 160,
    backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
  },

  statusRow: { paddingHorizontal: 20, paddingTop: 16, alignItems: 'flex-start' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },

  qrContainer: {
    alignItems: 'center',
    paddingVertical: 28,
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  qrPlaceholder: {
    width: SCREEN_WIDTH * 0.55, height: SCREEN_WIDTH * 0.55,
    backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', borderRadius: 8,
  },
  qrPlaceholderText: { color: '#999', fontSize: 13 },
  ticketNumber: { marginTop: 12, fontSize: 13, color: '#999', letterSpacing: 1 },

  infoCard: {
    margin: 20, padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  eventTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoText: { fontSize: 14, color: COLORS.textSecondary, flex: 1 },
  orderNumber: { marginTop: 8, fontSize: 12, color: COLORS.textSecondary, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 10 },

  actions: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.text },

  // Refund button — subtle, destructive-adjacent
  refundBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 16,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,77,106,0.35)',
    backgroundColor: 'rgba(255,77,106,0.06)',
  },
  refundBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.red },

  validNote: {
    textAlign: 'center', fontSize: 12, color: COLORS.textSecondary,
    marginHorizontal: 32, lineHeight: 18,
  },

  errorText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 16 },
  backBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: COLORS.surface, borderRadius: 12 },
  backBtnText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
});
