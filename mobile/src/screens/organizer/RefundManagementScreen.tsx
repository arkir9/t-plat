/**
 * RefundManagementScreen — Plat Pro Organizer
 *
 * NEW SCREEN — the activity feed in PlatProDashboard showed refund requests
 * as line items but there was nowhere to action them. This is that screen.
 *
 * Features:
 * - Pending / Approved / Denied tabs
 * - Approve with optional note (credited back to buyer via M-Pesa)
 * - Deny with required reason (shown to buyer)
 * - Shows ticket type, purchase amount, request reason
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { api } from '../../services/api';

const COLORS = {
  bg: '#07070F',
  surface: '#10101E',
  card: '#14142A',
  accent: '#7B5CFA',
  green: '#1FC98E',
  red: '#FF4D6A',
  amber: '#F5A623',
  white: '#FFF',
  textSecondary: 'rgba(255,255,255,0.55)',
  border: 'rgba(255,255,255,0.08)',
};

type TabName = 'Pending' | 'Approved' | 'Denied';

interface RefundRequest {
  id: string;
  ticketId: string;
  ticket: {
    id: string;
    ticketNumber: string;
    ticketType?: { name: string };
    order?: { orderNumber: string; totalAmount: number; currency: string };
  };
  buyer: { firstName?: string; lastName?: string; email: string };
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  organizerNote?: string;
  createdAt: string;
  amount: number;
  currency: string;
}

export function RefundManagementScreen({ navigation, route }: any) {
  const eventId = route.params?.eventId;
  const [tab, setTab] = useState<TabName>('Pending');
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Action modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'deny'>('approve');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = eventId ? `?eventId=${eventId}` : '';
      const response = await api.get(`/refunds/organizer${params}`);
      setRequests(response.data || []);
    } catch {
      // Show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const filtered = requests.filter((r) => {
    if (tab === 'Pending') return r.status === 'pending';
    if (tab === 'Approved') return r.status === 'approved';
    return r.status === 'denied';
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const openModal = (request: RefundRequest, action: 'approve' | 'deny') => {
    setSelectedRequest(request);
    setModalAction(action);
    setNote('');
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!selectedRequest) return;
    if (modalAction === 'deny' && !note.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for denying this refund request.');
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/refunds/${selectedRequest.id}`, {
        action: modalAction,
        organizerNote: note.trim() || undefined,
      });
      setModalVisible(false);
      await loadRequests(true);
      Alert.alert(
        modalAction === 'approve' ? 'Refund Approved' : 'Refund Denied',
        modalAction === 'approve'
          ? 'The refund has been processed. Funds will be returned to the buyer within 1-3 business days.'
          : 'The buyer has been notified.',
      );
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRequest = ({ item }: { item: RefundRequest }) => {
    const buyerName =
      [item.buyer?.firstName, item.buyer?.lastName].filter(Boolean).join(' ') ||
      item.buyer?.email ||
      'Unknown';
    const amount = `${item.currency || 'KES'} ${Number(item.amount || item.ticket?.order?.totalAmount || 0).toLocaleString()}`;
    const date = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.buyerName}>{buyerName}</Text>
          <Text style={styles.amount}>{amount}</Text>
        </View>
        <Text style={styles.ticketInfo}>
          {item.ticket?.ticketType?.name || 'General'} · {item.ticket?.ticketNumber || item.ticketId?.slice(0, 8)}
        </Text>
        <Text style={styles.requestDate}>{date}</Text>
        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>Reason</Text>
          <Text style={styles.reasonText}>{item.reason || 'No reason provided'}</Text>
        </View>

        {item.status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.denyBtn}
              onPress={() => openModal(item, 'deny')}
            >
              <XCircle size={15} color={COLORS.red} />
              <Text style={styles.denyBtnText}>Deny</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={() => openModal(item, 'approve')}
            >
              <CheckCircle size={15} color={COLORS.white} />
              <Text style={styles.approveBtnText}>Approve Refund</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status !== 'pending' && item.organizerNote && (
          <View style={[styles.reasonBox, { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.04)' }]}>
            <Text style={styles.reasonLabel}>Your note</Text>
            <Text style={styles.reasonText}>{item.organizerNote}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refund Requests</Text>
        <TouchableOpacity onPress={() => { setRefreshing(true); loadRequests(); }}>
          <RefreshCw size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['Pending', 'Approved', 'Denied'] as TabName[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t}
              {t === 'Pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadRequests(); }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <AlertCircle size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>No {tab.toLowerCase()} requests</Text>
              <Text style={styles.emptySubtitle}>
                {tab === 'Pending'
                  ? "You're all caught up. Any new refund requests will appear here."
                  : `No ${tab.toLowerCase()} refunds yet.`}
              </Text>
            </View>
          }
        />
      )}

      {/* Action Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {modalAction === 'approve' ? '✓ Approve Refund' : '✗ Deny Refund'}
            </Text>
            {selectedRequest && (
              <Text style={styles.modalSubtitle}>
                {[selectedRequest.buyer?.firstName, selectedRequest.buyer?.lastName].filter(Boolean).join(' ') || selectedRequest.buyer?.email}
                {' · '}
                {selectedRequest.currency || 'KES'} {Number(selectedRequest.amount || 0).toLocaleString()}
              </Text>
            )}

            <Text style={styles.modalLabel}>
              {modalAction === 'approve' ? 'Note for buyer (optional)' : 'Reason for denial (required)'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder={
                modalAction === 'approve'
                  ? 'e.g. Approved due to event cancellation'
                  : 'e.g. Tickets are non-refundable per our policy'
              }
              placeholderTextColor={COLORS.textSecondary}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirm,
                  { backgroundColor: modalAction === 'approve' ? COLORS.green : COLORS.red },
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    {modalAction === 'approve' ? 'Approve' : 'Deny'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.white },

  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: COLORS.surface },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  tabTextActive: { color: COLORS.white },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  buyerName: { fontSize: 15, fontWeight: '700', color: COLORS.white, flex: 1 },
  amount: { fontSize: 15, fontWeight: '700', color: COLORS.green },
  ticketInfo: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
  requestDate: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
  reasonBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 10 },
  reasonLabel: { fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  reasonText: { fontSize: 13, color: COLORS.white, lineHeight: 18 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  denyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.red,
  },
  denyBtnText: { color: COLORS.red, fontWeight: '700', fontSize: 14 },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.green,
  },
  approveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 260 },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 19, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 },
  modalLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  modalInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  modalCancelText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 15 },
  modalConfirm: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalConfirmText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});
