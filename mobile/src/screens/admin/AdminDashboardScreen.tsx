import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  ChevronLeft,
  ShieldCheck,
  Check,
  X,
  Mail,
  Phone,
  Briefcase,
  Inbox,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { organizersService, OrganizerApplication } from '../../services/organizersService';
import { theme } from '../../design/theme';

const { colors } = theme;

const C = {
  bg: colors.dark.background,
  surface: colors.dark.surface,
  surfaceAlt: colors.dark.surfaceVariant,
  accent: colors.primary[500],
  text: colors.dark.text,
  textSec: colors.dark.textSecondary,
  border: colors.dark.border,
  green: colors.success,
  red: colors.error,
  white: '#FFFFFF',
  blue: '#3B82F6',
};

export function AdminDashboardScreen({ navigation }: any) {
  const [applications, setApplications] = useState<OrganizerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchApplications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await organizersService.getAdminApplications();
      setApplications(data);
    } catch (error: any) {
      if (!isRefresh) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to load applications.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchApplications();
    }, [fetchApplications]),
  );

  const handleApprove = (app: OrganizerApplication) => {
    Alert.alert(
      'Approve Application',
      `Approve "${app.businessName}" as an organizer?\n\nThis will create their organizer profile.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setProcessingId(app.id);
            try {
              const res = await organizersService.approveApplication(app.id);
              Alert.alert('Approved', res.message);
              setApplications((prev) => prev.filter((a) => a.id !== app.id));
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to approve.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  const handleReject = (app: OrganizerApplication) => {
    Alert.alert(
      'Reject Application',
      `Reject "${app.businessName}"?\n\nThey can reapply later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(app.id);
            try {
              await organizersService.rejectApplication(app.id);
              setApplications((prev) => prev.filter((a) => a.id !== app.id));
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to reject.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  const renderDomainHighlight = (email: string) => {
    const parts = email.split('@');
    if (parts.length !== 2) return <Text style={s.emailText}>{email}</Text>;
    return (
      <Text style={s.emailText}>
        {parts[0]}@<Text style={s.emailDomain}>{parts[1]}</Text>
      </Text>
    );
  };

  const renderItem = ({ item }: { item: OrganizerApplication }) => {
    const isProcessing = processingId === item.id;

    return (
      <View style={s.card}>
        {/* Business name */}
        <View style={s.cardHeader}>
          <View style={s.cardIcon}>
            <Briefcase size={18} color={C.accent} />
          </View>
          <Text style={s.cardTitle} numberOfLines={1}>{item.businessName}</Text>
        </View>

        {/* Details */}
        <View style={s.detailRow}>
          <Mail size={14} color={C.textSec} />
          {renderDomainHighlight(item.email)}
        </View>
        <View style={s.detailRow}>
          <Phone size={14} color={C.textSec} />
          <Text style={s.detailText}>{item.phone}</Text>
        </View>

        {/* Domain verification hint */}
        <View style={s.domainHint}>
          <Text style={s.domainHintText}>
            Verify the email domain matches a real business before approving.
          </Text>
        </View>

        {/* Actions */}
        {isProcessing ? (
          <View style={s.processingRow}>
            <ActivityIndicator size="small" color={C.accent} />
            <Text style={s.processingText}>Processing...</Text>
          </View>
        ) : (
          <View style={s.actionsRow}>
            <TouchableOpacity
              style={s.rejectBtn}
              onPress={() => handleReject(item)}
              activeOpacity={0.8}
            >
              <X size={16} color={C.red} />
              <Text style={s.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.approveBtn}
              onPress={() => handleApprove(item)}
              activeOpacity={0.8}
            >
              <Check size={16} color={C.white} />
              <Text style={s.approveBtnText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={s.emptyContainer}>
      <View style={s.emptyIcon}>
        <Inbox size={36} color={C.textSec} />
      </View>
      <Text style={s.emptyTitle}>No pending applications</Text>
      <Text style={s.emptySub}>All organizer applications have been processed.</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ChevronLeft color={C.text} size={24} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <ShieldCheck size={18} color={C.blue} />
          <Text style={s.headerTitle}>Admin Panel</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats bar */}
      <View style={s.statsBar}>
        <Text style={s.statsText}>
          {loading ? '...' : `${applications.length} pending`} application{applications.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchApplications(true)}
              tintColor={C.accent}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },

  statsBar: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  statsText: { fontSize: 13, color: C.textSec, fontWeight: '500' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: C.surface, borderRadius: 16, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: C.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardIcon: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: C.text, flex: 1 },

  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  detailText: { fontSize: 14, color: C.textSec },
  emailText: { fontSize: 14, color: C.textSec },
  emailDomain: { color: C.accent, fontWeight: '700', fontSize: 14 },

  domainHint: {
    backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, marginTop: 6, marginBottom: 14,
  },
  domainHintText: { fontSize: 12, color: C.blue, lineHeight: 17 },

  actionsRow: { flexDirection: 'row', gap: 10 },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: C.green, paddingVertical: 12, borderRadius: 12,
  },
  approveBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: C.red, paddingVertical: 12, borderRadius: 12,
  },
  rejectBtnText: { color: C.red, fontWeight: '700', fontSize: 14 },

  processingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  processingText: { fontSize: 14, color: C.textSec },

  // Empty
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: C.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySub: { fontSize: 14, color: C.textSec, textAlign: 'center' },
});
