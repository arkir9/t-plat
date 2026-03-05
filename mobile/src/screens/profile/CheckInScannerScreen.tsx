import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  ScanLine,
  Flashlight,
} from 'lucide-react-native';
import { ticketsService } from '../../services/ticketsService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_SIZE = SCREEN_WIDTH * 0.7;

type ScanResult = {
  type: 'success' | 'error';
  title: string;
  message: string;
  ticketType?: string;
  eventTitle?: string;
};

export function CheckInScannerScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [torch, setTorch] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showResult = useCallback(
    (scanResult: ScanResult) => {
      setResult(scanResult);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    },
    [fadeAnim],
  );

  const handleScanNext = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setResult(null);
      setScanned(false);
    });
  }, [fadeAnim]);

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanned || processing) return;
      setScanned(true);
      setProcessing(true);

      try {
        const response = await ticketsService.checkIn(data);
        showResult({
          type: 'success',
          title: 'Valid Ticket',
          message: response.message || 'Check-in successful',
          ticketType: response.ticket?.ticketType?.name,
          eventTitle: response.ticket?.event?.title,
        });
      } catch (error: any) {
        const msg =
          error?.response?.data?.message || error?.message || 'Unknown error';
        const isAlreadyScanned =
          typeof msg === 'string' && msg.toLowerCase().includes('already scanned');

        showResult({
          type: 'error',
          title: isAlreadyScanned ? 'Already Scanned!' : 'Invalid Ticket',
          message: typeof msg === 'string' ? msg : JSON.stringify(msg),
        });
      } finally {
        setProcessing(false);
      }
    },
    [scanned, processing, showResult],
  );

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
          <ScanLine size={64} color="#8B5CF6" />
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permText}>
            We need camera access to scan ticket QR codes at the door.
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
      <StatusBar barStyle="light-content" />

      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <SafeAreaView edges={['top']} style={styles.topBar}>
          <TouchableOpacity style={styles.topBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Check-in Scanner</Text>
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

      {/* Result modal */}
      {result && (
        <Animated.View style={[styles.resultOverlay, { opacity: fadeAnim }]}>
          <View
            style={[
              styles.resultCard,
              result.type === 'success' ? styles.resultSuccess : styles.resultError,
            ]}
          >
            {result.type === 'success' ? (
              <CheckCircle2 size={72} color="#10B981" />
            ) : (
              <XCircle size={72} color="#EF4444" />
            )}

            <Text style={styles.resultTitle}>{result.title}</Text>
            <Text style={styles.resultMessage}>{result.message}</Text>

            {result.eventTitle && (
              <View style={styles.resultMeta}>
                <Text style={styles.resultMetaLabel}>Event</Text>
                <Text style={styles.resultMetaValue}>{result.eventTitle}</Text>
              </View>
            )}
            {result.ticketType && (
              <View style={styles.resultMeta}>
                <Text style={styles.resultMetaLabel}>Ticket</Text>
                <Text style={styles.resultMetaValue}>{result.ticketType}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.scanNextBtn} onPress={handleScanNext}>
              <ScanLine size={20} color="#FFF" />
              <Text style={styles.scanNextText}>Scan Next</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const CORNER = 28;
const CORNER_W = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  permTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 8,
  },
  permText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  grantBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  grantBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  backLink: { padding: 8 },
  backLinkText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'space-between',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },

  frameWrapper: { alignItems: 'center', marginBottom: SCREEN_HEIGHT * 0.2 },
  scanFrame: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderColor: '#8B5CF6',
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_W,
    borderRightWidth: CORNER_W,
    borderColor: '#8B5CF6',
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderColor: '#8B5CF6',
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_W,
    borderRightWidth: CORNER_W,
    borderColor: '#8B5CF6',
    borderBottomRightRadius: 8,
  },
  hint: {
    marginTop: 20,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },

  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  resultCard: {
    width: '100%',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  resultSuccess: { backgroundColor: '#064E3B' },
  resultError: { backgroundColor: '#7F1D1D' },
  resultTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 16,
  },
  resultMessage: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  resultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  resultMetaLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  resultMetaValue: { fontSize: 14, fontWeight: '600', color: '#FFF', flexShrink: 1, textAlign: 'right' },

  scanNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 28,
  },
  scanNextText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
