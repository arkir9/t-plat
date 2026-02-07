import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { ChevronLeft, Share2, Download } from 'lucide-react-native';
import { ticketsService } from '../../services/ticketsService';
import { format } from 'date-fns';

// Conditionally import QRCode only on native platforms - lazy load to avoid import errors
const getQRCode = () => {
  if (Platform.OS === 'web') return null;
  try {
    return require('react-native-qrcode-svg').default;
  } catch (e) {
    console.warn('react-native-qrcode-svg not available:', e);
    return null;
  }
};

const COLORS = { primary: '#000', accent: '#8B5CF6', white: '#FFF' };

export function MyTicketScreen({ navigation, route }: any) {
  const { ticketId, ticket: ticketParam } = route.params;
  const [ticket, setTicket] = useState(ticketParam);
  const [isLoading, setIsLoading] = useState(!ticketParam);

  useEffect(() => {
    if (ticketId && !ticketParam) {
      loadTicket();
    }
  }, [ticketId]);

  const loadTicket = async () => {
    if (!ticketId) return;
    setIsLoading(true);
    try {
      const ticketData = await ticketsService.getTicketById(ticketId);
      setTicket(ticketData);
    } catch (error: any) {
      console.error('Failed to load ticket:', error);
      Alert.alert('Error', 'Failed to load ticket. Please try again.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !ticket) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#1A1A1A' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading ticket...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const event = ticket.event;
  const ticketType = ticket.ticketType;
  const eventDate = event?.startDate ? format(new Date(event.startDate), 'EEE, MMM d • h:mm a') : 'Date TBD';
  const location = event?.customLocation
    ? `${event.customLocation.address}, ${event.customLocation.city}`
    : event?.venueId
    ? 'Venue'
    : 'Location TBD';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#1A1A1A' }]}>
      <View style={[styles.header, { borderBottomColor: '#333' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFF' }]}>My Ticket</Text>
        <TouchableOpacity onPress={() => {/* Share functionality */}}>
          <Share2 color="#FFF" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
        <View style={styles.ticketContainer}>
          {event?.image ? (
            <Image source={{ uri: event.image }} style={styles.ticketImage} />
          ) : (
            <View style={styles.ticketImagePlaceholder} />
          )}
          
          <View style={styles.ticketBody}>
            <Text style={styles.ticketEvent}>{event?.title || 'Event'}</Text>
            <Text style={styles.ticketMeta}>{eventDate}</Text>
            <Text style={styles.ticketMeta}>{location}</Text>
            
            <View style={styles.dividerDashed} />
            
            <View style={styles.qrContainer}>
              {(() => {
                const QRCodeComponent = getQRCode();
                if (!QRCodeComponent) {
                  return (
                    <View style={styles.qrPlaceholder}>
                      <Text style={styles.qrPlaceholderText}>QR Code</Text>
                      <Text style={styles.qrPlaceholderSubtext}>{ticket.qrCodeHash?.slice(0, 12) || ticket.id.slice(0, 12)}</Text>
                    </View>
                  );
                }
                return <QRCodeComponent value={ticket.qrCode || ticket.id} size={200} />;
              })()}
            </View>
            <Text style={styles.ticketCode}>#{ticket.id.slice(0, 8).toUpperCase()}</Text>

            <View style={styles.admitRow}>
              <View>
                <Text style={styles.admitLabel}>TICKET</Text>
                <Text style={styles.admitVal}>{ticketType?.name || 'General'}</Text>
              </View>
              <View>
                <Text style={styles.admitLabel}>STATUS</Text>
                <Text style={styles.admitVal}>{ticket.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.downloadBtn}>
          <Download color="#FFF" size={20} />
          <Text style={{ color: '#FFF', fontWeight: '600', marginLeft: 8 }}>Save to Photos</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  ticketContainer: { backgroundColor: '#FFF', width: '100%', borderRadius: 16, overflow: 'hidden' },
  ticketImage: { width: '100%', height: 150 },
  ticketImagePlaceholder: { height: 150, backgroundColor: '#333' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FFF', marginTop: 12 },
  ticketBody: { padding: 24, alignItems: 'center' },
  ticketEvent: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  ticketMeta: { color: '#666', marginBottom: 4 },
  dividerDashed: { width: '100%', height: 1, borderWidth: 1, borderColor: '#DDD', borderStyle: 'dashed', marginVertical: 24 },
  qrContainer: { padding: 10, backgroundColor: '#FFF' },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  qrPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  qrPlaceholderSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  ticketCode: { marginTop: 16, fontWeight: 'bold', color: '#666', letterSpacing: 2 },
  admitRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginTop: 24, backgroundColor: '#F9F9F9', padding: 16, borderRadius: 8 },
  admitLabel: { fontSize: 10, color: '#999', fontWeight: 'bold' },
  admitVal: { fontWeight: 'bold', fontSize: 14, marginTop: 4 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 32, backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20 },
});