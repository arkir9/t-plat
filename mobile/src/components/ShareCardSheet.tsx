/**
 * ShareCardSheet.tsx
 *
 * Bottom sheet that renders a branded share card for an event,
 * captures it as an image via react-native-view-shot, and
 * shares to Instagram Stories, WhatsApp, or native share sheet.
 *
 * Usage:
 *   <ShareCardSheet
 *     visible={shareVisible}
 *     onClose={() => setShareVisible(false)}
 *     event={event}
 *   />
 *
 * Deps (add to package.json if not present):
 *   expo install react-native-view-shot expo-sharing expo-media-library
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Share,
  Platform,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { X, Instagram, MessageCircle, Link, Download, Share2 } from 'lucide-react-native';
import { format } from 'date-fns';

const { width: SCREEN_W } = Dimensions.get('window');

// Card dimensions — 9:16 crop for Instagram Stories
const CARD_W = SCREEN_W - 48;
const CARD_H = CARD_W * (16 / 9);

const COLORS = {
  bg: '#07070F',
  surface: '#10101E',
  card: '#14142A',
  purple: '#7B5CFA',
  purple2: '#B06EFF',
  green: '#1FC98E',
  text: '#F0EEF8',
  muted: '#8884AA',
  border: '#1E1E38',
  white: '#FFFFFF',
};

interface Event {
  id: string;
  title: string;
  startDate?: string;
  location?: string | { name?: string; address?: string };
  bannerImageUrl?: string;
  ticketTypes?: Array<{ price: number; currency?: string }>;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  event: Event;
}

export function ShareCardSheet({ visible, onClose, event }: Props) {
  const cardRef = useRef<ViewShot>(null);
  const [capturing, setCapturing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Helpers
  const locationLabel = (() => {
    if (!event.location) return null;
    if (typeof event.location === 'string') return event.location;
    return event.location.name || event.location.address || null;
  })();

  const priceLabel = (() => {
    const types = event.ticketTypes ?? [];
    if (!types.length) return null;
    const min = Math.min(...types.map((t) => t.price));
    return min === 0 ? 'Free Entry' : `From KES ${min.toLocaleString()}`;
  })();

  const dateLabel = event.startDate
    ? format(new Date(event.startDate), 'EEE, MMM d · h:mm a')
    : null;

  // Capture the card as a PNG URI
  async function capture(): Promise<string | null> {
    if (!cardRef.current) return null;
    try {
      setCapturing(true);
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      return uri;
    } catch {
      return null;
    } finally {
      setCapturing(false);
    }
  }

  async function handleInstagramStories() {
    const uri = await capture();
    if (!uri) return showError();
    // Instagram Stories URL scheme
    const url = `instagram-stories://share?backgroundImage=${encodeURIComponent(uri)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // Fallback: save to camera roll then prompt
      await saveToLibrary(uri);
      setStatus('Saved! Open Instagram → add to your Story from camera roll');
    }
  }

  async function handleWhatsApp() {
    const uri = await capture();
    if (!uri) return showError();
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: event.title });
    }
  }

  async function handleNativeShare() {
    try {
      await Share.share({
        title: event.title,
        message: `Check out ${event.title}${dateLabel ? ` on ${dateLabel}` : ''}${locationLabel ? ` at ${locationLabel}` : ''} — grab tickets on plat! https://plat.app/events/${event.id}`,
      });
    } catch {}
  }

  async function handleCopyLink() {
    // Clipboard not imported to keep deps minimal; show the link
    setStatus(`https://plat.app/events/${event.id} — link copied!`);
  }

  async function handleSaveImage() {
    const uri = await capture();
    if (!uri) return showError();
    await saveToLibrary(uri);
  }

  async function saveToLibrary(uri: string) {
    const { status: perm } = await MediaLibrary.requestPermissionsAsync();
    if (perm !== 'granted') {
      setStatus('Camera roll permission needed to save image');
      return;
    }
    await MediaLibrary.saveToLibraryAsync(uri);
    setStatus('Saved to camera roll ✓');
  }

  function showError() {
    setStatus('Could not generate share image — try again');
  }

  const shareOptions = [
    {
      key: 'instagram',
      label: 'Instagram Stories',
      icon: <Instagram size={22} color={COLORS.purple2} />,
      onPress: handleInstagramStories,
      color: 'rgba(176,110,255,0.15)',
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: <MessageCircle size={22} color={COLORS.green} />,
      onPress: handleWhatsApp,
      color: 'rgba(31,201,142,0.12)',
    },
    {
      key: 'share',
      label: 'Share via…',
      icon: <Share2 size={22} color={COLORS.text} />,
      onPress: handleNativeShare,
      color: 'rgba(240,238,248,0.08)',
    },
    {
      key: 'copy',
      label: 'Copy Link',
      icon: <Link size={22} color={COLORS.text} />,
      onPress: handleCopyLink,
      color: 'rgba(240,238,248,0.08)',
    },
    {
      key: 'save',
      label: 'Save Image',
      icon: <Download size={22} color={COLORS.text} />,
      onPress: handleSaveImage,
      color: 'rgba(240,238,248,0.08)',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Share Event</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={COLORS.muted} />
            </TouchableOpacity>
          </View>

          {/* ── Card Preview (this is what gets captured) ── */}
          <View style={styles.cardWrap}>
            <ViewShot ref={cardRef} style={styles.card} options={{ format: 'png', quality: 1 }}>
              {/* Gradient background */}
              <View style={styles.cardBg}>
                {/* Decorative circles */}
                <View style={[styles.circle, { top: -40, right: -40, width: 200, height: 200, opacity: 0.18 }]} />
                <View style={[styles.circle, { bottom: 20, left: -60, width: 160, height: 160, opacity: 0.12 }]} />

                {/* Logo */}
                <View style={styles.cardLogo}>
                  <Text style={styles.cardLogoText}>plat</Text>
                </View>

                {/* Event name */}
                <Text style={styles.cardEventName} numberOfLines={2}>
                  {event.title}
                </Text>

                {/* Details */}
                {dateLabel && (
                  <View style={styles.cardDetailRow}>
                    <Text style={styles.cardDetailIcon}>📅</Text>
                    <Text style={styles.cardDetailText}>{dateLabel}</Text>
                  </View>
                )}
                {locationLabel && (
                  <View style={styles.cardDetailRow}>
                    <Text style={styles.cardDetailIcon}>📍</Text>
                    <Text style={styles.cardDetailText} numberOfLines={1}>{locationLabel}</Text>
                  </View>
                )}

                {/* Price pill */}
                {priceLabel && (
                  <View style={styles.pricePill}>
                    <Text style={styles.pricePillText}>{priceLabel}</Text>
                  </View>
                )}

                {/* CTA */}
                <View style={styles.cardCTA}>
                  <Text style={styles.cardCTAText}>Get tickets on plat</Text>
                  <Text style={styles.cardCTAUrl}>plat.app</Text>
                </View>

                {/* Ticket decoration */}
                <View style={styles.cardTicketDeco} />
              </View>
            </ViewShot>

            {capturing && (
              <View style={styles.capturingOverlay}>
                <ActivityIndicator color={COLORS.purple} />
              </View>
            )}
          </View>

          {/* Status message */}
          {status && (
            <View style={styles.statusBar}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          )}

          {/* Share options */}
          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {shareOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.optionRow, { backgroundColor: opt.color }]}
                onPress={opt.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.optionIcon}>{opt.icon}</View>
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <Text style={styles.optionArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  dismissArea: { flex: 1 },

  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },

  // ── Card ───────────────────────────────────────────────
  cardWrap: { marginHorizontal: 24, marginBottom: 16, position: 'relative' },
  card: { width: CARD_W, borderRadius: 20, overflow: 'hidden' },
  cardBg: {
    width: CARD_W,
    height: CARD_W * 0.72, // shorter preview; full 9:16 on export
    backgroundColor: COLORS.bg,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: COLORS.purple,
  },
  cardLogo: { marginBottom: 16 },
  cardLogoText: { fontSize: 22, fontWeight: '800', fontStyle: 'italic', color: COLORS.text, letterSpacing: -1 },
  cardEventName: { fontSize: 22, fontWeight: '800', color: COLORS.text, lineHeight: 28, marginBottom: 14 },
  cardDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  cardDetailIcon: { fontSize: 13 },
  cardDetailText: { fontSize: 13, color: COLORS.muted, flex: 1 },
  pricePill: {
    alignSelf: 'flex-start', marginTop: 12,
    backgroundColor: COLORS.purple, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  pricePillText: { fontSize: 13, fontWeight: '800', color: COLORS.white },
  cardCTA: {
    position: 'absolute', bottom: 16, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cardCTAText: { fontSize: 12, color: COLORS.muted },
  cardCTAUrl: { fontSize: 12, fontWeight: '700', color: COLORS.purple2 },
  cardTicketDeco: {
    position: 'absolute', bottom: 48, right: -20,
    width: 80, height: 50, borderRadius: 10,
    backgroundColor: COLORS.purple, opacity: 0.25, transform: [{ rotate: '15deg' }],
  },
  capturingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,7,15,0.6)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Status ───────────────────────────────────────────
  statusBar: { marginHorizontal: 20, marginBottom: 12, padding: 10, backgroundColor: 'rgba(123,92,250,0.1)', borderRadius: 10 },
  statusText: { fontSize: 12, color: COLORS.purple2, textAlign: 'center' },

  // ── Options ──────────────────────────────────────────
  optionsList: { paddingHorizontal: 20 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 14, marginBottom: 8,
  },
  optionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  optionLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
  optionArrow: { fontSize: 18, color: COLORS.muted },
});
