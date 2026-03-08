/**
 * RefundRequestScreen — User side
 *
 * NEW FILE. Wire from TicketDetailScreen:
 *   navigation.navigate('RefundRequest', { ticketId, ticket })
 *
 * Add to RootStackParamList:
 *   RefundRequest: { ticketId: string; ticket?: any }
 *
 * Backend endpoint: POST /tickets/:id/refund-request
 * Body: { reason: string }
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react-native';
import { ticketsService } from '../../services/ticketsService';

const COLORS = {
  accent: '#8B5CF6',
  accentLight: '#F3E8FF',
  surface: '#F5F5F5',
  border: '#E5E5E5',
  white: '#FFF',
  red: '#EF4444',
  redLight: '#FEF2F2',
  green: '#10B981',
  greenLight: '#ECFDF5',
  textSecondary: '#666',
  text: '#111',
};

const REFUND_REASONS = [
  { id: 'cant_attend', label: "I can't attend" },
  { id: 'duplicate', label: 'Duplicate purchase' },
  { id: 'event_cancelled', label: 'Event was cancelled' },
  { id: 'event_changed', label: 'Event details changed significantly' },
  { id: 'technical', label: 'Technical / payment issue' },
  { id: 'other', label: 'Other reason' },
];

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function RefundRequestScreen({ navigation, route }: any) {
  const { ticketId, ticket } = route.params;

  const [selectedReason, setSelectedReason] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Select a reason', 'Please choose a reason for your refund request.');
      return;
    }

    const reason = selectedReason === 'other' && notes.trim()
      ? `Other: ${notes.trim()}`
      : REFUND_REASONS.find(r => r.id === selectedReason)?.label ?? selectedReason;

    setStatus('submitting');
    try {
      await ticketsService.requestRefund(ticketId, reason);
      setStatus('success');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to submit request';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  // ── Success state ──────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} style={styles.iconBtn}>
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.centred}>
          <View style={styles.successIcon}>
            <CheckCircle size={40} color={COLORS.green} />
          </View>
          <Text style={styles.successTitle}>Request Submitted</Text>
          <Text style={styles.successSub}>
            Your refund request has been sent to the organiser. You'll be notified once it's reviewed — this usually takes 24–48 hours.
          </Text>
          <View style={styles.infoCard}>
            <Row label="Ticket" value={ticket?.ticketType?.name ?? `#${ticket?.ticketNumber ?? '—'}`} />
            <Row label="Status" value="Pending Review" highlight />
          </View>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.primaryBtnText}>Back to Tickets</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ChevronLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Refund</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Ticket summary */}
        <View style={styles.ticketCard}>
          <Text style={styles.ticketEvent} numberOfLines={1}>
            {ticket?.event?.title ?? 'Event'}
          </Text>
          <Text style={styles.ticketType}>
            {ticket?.ticketType?.name ?? 'Ticket'} · #{ticket?.ticketNumber ?? '—'}
          </Text>
          {ticket?.ticketType?.price && (
            <Text style={styles.ticketPrice}>
              KES {Number(ticket.ticketType.price).toLocaleString()}
            </Text>
          )}
        </View>

        {/* Policy note */}
        <View style={styles.policyNote}>
          <AlertCircle size={16} color="#D97706" />
          <Text style={styles.policyText}>
            Refund requests are reviewed by the event organiser. Approval is at their discretion based on their refund policy.
          </Text>
        </View>

        {/* Reason selector */}
        <Text style={styles.sectionLabel}>Reason for refund</Text>
        {REFUND_REASONS.map(reason => (
          <TouchableOpacity
            key={reason.id}
            style={[
              styles.reasonOption,
              selectedReason === reason.id && styles.reasonOptionSelected,
            ]}
            onPress={() => setSelectedReason(reason.id)}
          >
            <View style={[
              styles.radioOuter,
              selectedReason === reason.id && styles.radioOuterSelected,
            ]}>
              {selectedReason === reason.id && <View style={styles.radioInner} />}
            </View>
            <Text style={[
              styles.reasonText,
              selectedReason === reason.id && styles.reasonTextSelected,
            ]}>
              {reason.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Extra notes (shown for 'other', optional for rest) */}
        <Text style={styles.sectionLabel} numberOfLines={1}>
          Additional notes{selectedReason !== 'other' ? ' (optional)' : ''}
        </Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Provide any extra context for the organiser..."
          placeholderTextColor="#AAA"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Error */}
        {status === 'error' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, status === 'submitting' && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={status === 'submitting'}
        >
          {status === 'submitting' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Refund Request</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelLink}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  iconBtn: { width: 40, height: 40, justifyContent: 'center' },

  content: { padding: 16, paddingBottom: 120 },

  ticketCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ticketEvent: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  ticketType: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  ticketPrice: { fontSize: 14, fontWeight: '700', color: COLORS.accent },

  policyNote: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  policyText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 8,
    backgroundColor: COLORS.white,
  },
  reasonOptionSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: COLORS.accent },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },
  reasonText: { fontSize: 15, color: COLORS.text },
  reasonTextSelected: { fontWeight: '600', color: COLORS.accent },

  notesInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 100,
    marginBottom: 16,
  },

  errorBox: {
    backgroundColor: COLORS.redLight,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { fontSize: 13, color: COLORS.red },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  submitBtn: {
    backgroundColor: COLORS.red,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelLink: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 14, color: COLORS.textSecondary },

  // Success state
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: { fontSize: 24, fontWeight: '800', marginBottom: 10 },
  successSub: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  infoCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600' },
  infoValueHighlight: { color: '#D97706' },
  primaryBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
