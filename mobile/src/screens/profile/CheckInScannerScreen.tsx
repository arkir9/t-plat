/**
 * CheckInScannerScreen
 *
 * CHANGE FROM ORIGINAL:
 * Added full-screen color flash + haptic feedback on scan result.
 * - Valid ticket  → full-screen GREEN flash + success haptic
 * - Duplicate QR  → full-screen RED flash + heavy haptic (not just amber log item)
 * - Invalid       → full-screen RED flash + heavy haptic
 *
 * At a loud venue (Blankets & Wine, Koroga, Kasarani) the organiser at the door
 * needs an immediate, unmissable signal. A subtle card in a list doesn't cut it.
 * The flash is 800ms then fades — scanner is immediately ready for next ticket.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Vibration,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ChevronLeft, Flashlight, ScanLine, CheckCircle, XCircle, AlertTriangle } from 'lucide-react-native';
import { ticketsService } from '../../services/ticketsService';

// Haptic patterns (ms) — works without expo-haptics dependency
const HAPTIC_SUCCESS = [0, 50, 50, 100]; // two short pulses
const HAPTIC_ERROR   = [0, 200];         // one long pulse

const COLORS = {
  bg: '#0A0A0F',
  surface: 'rgba(255,255,255,0.07)',
  accent: '#8B5CF6',
  green: '#10B981',
  red: '#EF4444',
  amber: '#F59E0B',
  white: '#FFF',
  textSecondary: 'rgba(255,255,255,0.6)',
};

type ScanResultType = 'success' | 'duplicate' | 'invalid';

interface ScanResult {
  type: ScanResultType;
  name?: string;
  ticketType?: string;
  message?: string;
}

interface CheckInEntry {
  id: string;
  name: string;
  ticketType: string;
  time: string;
  isDuplicate?: boolean;
}

export function CheckInScannerScreen({ navigation, route }: any) {
  const eventTitle = route.params?.eventTitle || 'Event';
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [log, setLog] = useState<CheckInEntry[]>([]);
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);

  // Flash overlay state
  const flashAnim = useRef(new Animated.Value(0)).current;
  const [flashColor, setFlashColor] = useState(COLORS.green);
  const [flashIcon, setFlashIcon] = useState<ScanResultType>('success');
  const [flashLabel, setFlashLabel] = useState('');

  const triggerFlash = useCallback(
    (type: ScanResultType, label: string) => {
      const color =
        type === 'success' ? COLORS.green
        : type === 'duplicate' ? COLORS.amber
        : COLORS.red;

      setFlashColor(color);
      setFlashIcon(type);
      setFlashLabel(label);

      // Haptic
      if (Platform.OS !== 'web') {
        if (type === 'success') {
          Vibration.vibrate(HAPTIC_SUCCESS);
        } else {
          Vibration.vibrate(HAPTIC_ERROR);
        }
      }

      // Animate: fade in fast, hold, fade out
      flashAnim.setValue(0);
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.delay(700),
        Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setScanned(false);
      });
    },
    [flashAnim],
  );

  const processTicketCode = useCallback(
    async (code: string) => {
      if (processing) return;
      setProcessing(true);
      setScanned(true);

      try {
        const result = await ticketsService.checkInTicket(code);
        const attendeeName = result.attendee?.name || result.holderName || 'Guest';
        const ticketType = result.ticketType?.name || 'General';

        const entry: CheckInEntry = {
          id: code,
          name: attendeeName,
          ticketType,
          time: new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
        };
        setLog((prev) => [entry, ...prev]);
        triggerFlash('success', attendeeName);
      } catch (error: any) {
        const msg: string = error?.response?.data?.message || error?.message || '';
        const isDuplicate =
          msg.toLowerCase().includes('already') ||
          msg.toLowerCase().includes('used') ||
          msg.toLowerCase().includes('checked in');

        const entry: CheckInEntry = {
          id: code,
          name: isDuplicate ? 'Already Checked In' : 'Invalid Ticket',
          ticketType: '',
          time: new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
          isDuplicate,
        };
        setLog((prev) => [entry, ...prev]);
        triggerFlash(
          isDuplicate ? 'duplicate' : 'invalid',
          isDuplicate ? 'Already used' : 'Invalid ticket',
        );
      } finally {
        setProcessing(false);
      }
    },
    [processing, triggerFlash],
  );

  const handleBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (!scanned && !processing) {
        processTicketCode(data);
      }
    },
    [scanned, processing, processTicketCode],
  );

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      processTicketCode(manualCode.trim());
      setManualCode('');
      setShowManual(false);
    }
  };

  // Permission screens
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.permText}>Requesting camera permission…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ScanLine size={64} color={COLORS.accent} />
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permText}>
            Camera access is needed to scan ticket QR codes at the door.
          </Text>
          <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
            <Text style={styles.grantBtnText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Text style={styles.backLinkText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Darkened overlay with scan frame */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <SafeAreaView style={styles.topBar}>
          <TouchableOpacity style={styles.topBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.topTitle}>Check-in</Text>
            <Text style={styles.topSubtitle}>{eventTitle}</Text>
          </View>
          <TouchableOpacity style={styles.topBtn} onPress={() => setTorch((t) => !t)}>
            <Flashlight size={22} color={torch ? '#FBBF24' : '#FFF'} />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Scan frame */}
        <View style={styles.frameWrapper}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.hint}>
            {processing ? 'Verifying…' : 'Align QR code within frame'}
          </Text>
        </View>
      </View>

      {/* ── FULL-SCREEN FLASH OVERLAY ──────────────────────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.flashOverlay,
          { backgroundColor: flashColor, opacity: flashAnim },
        ]}
      >
        <View style={styles.flashContent}>
          {flashIcon === 'success' && <CheckCircle size={72} color="#FFF" />}
          {flashIcon === 'duplicate' && <AlertTriangle size={72} color="#FFF" />}
          {flashIcon === 'invalid' && <XCircle size={72} color="#FFF" />}
          <Text style={styles.flashLabel}>{flashLabel}</Text>
        </View>
      </Animated.View>

      {/* Bottom sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />

        {/* Manual entry toggle */}
        {showManual ? (
          <View style={styles.manualRow}>
            <TextInput
              style={styles.manualInput}
              placeholder="Enter ticket number..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={manualCode}
              onChangeText={setManualCode}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleManualSubmit}
            />
            <TouchableOpacity style={styles.manualSubmit} onPress={handleManualSubmit}>
              <Text style={styles.manualSubmitText}>Check</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => setShowManual(true)}
          >
            <Text style={styles.manualBtnText}>Enter Ticket Number Manually</Text>
          </TouchableOpacity>
        )}

        {/* Recent check-ins */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Recent Check-ins</Text>
          <Text style={styles.listCount}>{log.length} scanned</Text>
        </View>
        <FlatList
          data={log.slice(0, 8)}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          style={{ maxHeight: 180 }}
          renderItem={({ item }) => (
            <View style={[styles.logItem, item.isDuplicate && styles.logItemDuplicate]}>
              <View style={[styles.logDot, { backgroundColor: item.isDuplicate ? COLORS.amber : item.name === 'Invalid Ticket' ? COLORS.red : COLORS.green }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.logName}>{item.name}</Text>
                {item.ticketType ? <Text style={styles.logType}>{item.ticketType}</Text> : null}
              </View>
              <Text style={styles.logTime}>{item.time}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyLog}>No check-ins yet</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  permTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white, marginTop: 20, marginBottom: 8 },
  permText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21 },
  grantBtn: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, marginTop: 24 },
  grantBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  backLink: { marginTop: 16 },
  backLinkText: { color: COLORS.textSecondary, fontSize: 14 },

  overlay: { ...StyleSheet.absoluteFillObject },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20 },
  topTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white, textAlign: 'center' },
  topSubtitle: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },

  frameWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 240, height: 240, position: 'relative' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: COLORS.accent, borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  hint: { marginTop: 20, fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },

  // Full-screen flash
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  flashContent: { alignItems: 'center', gap: 16 },
  flashLabel: { fontSize: 28, fontWeight: '800', color: COLORS.white },

  // Bottom sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10,10,20,0.96)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '45%',
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 14 },

  manualBtn: { backgroundColor: COLORS.surface, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginBottom: 12 },
  manualBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 15 },
  manualRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  manualInput: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 14, fontSize: 14, color: COLORS.white, height: 44 },
  manualSubmit: { backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center' },
  manualSubmitText: { color: COLORS.white, fontWeight: '700' },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  listTitle: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  listCount: { fontSize: 13, color: COLORS.textSecondary },

  logItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  logItemDuplicate: { opacity: 0.75 },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logName: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  logType: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  logTime: { fontSize: 12, color: COLORS.textSecondary },
  emptyLog: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 13, paddingVertical: 12 },
});
