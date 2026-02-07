import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { ChevronLeft, Clock } from 'lucide-react-native';
import { format } from 'date-fns';
import { ticketsService } from '../../services/ticketsService';

const COLORS = {
  primary: '#000000',
  accent: '#8B5CF6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
};

export function WaitlistScreen({ navigation }: any) {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  const loadWaitlist = async () => {
    try {
      setIsLoading(true);
      const data = await ticketsService.getMyWaitlist();
      setItems(data || []);
    } catch (error: any) {
      console.error('Failed to load waitlist', error);
      Alert.alert('Error', 'Failed to load your waitlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await ticketsService.cancelWaitlistEntry(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error: any) {
      console.error('Failed to cancel waitlist entry', error);
      Alert.alert('Error', 'Could not remove this waitlist entry. Please try again.');
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadWaitlist);
    return unsubscribe;
  }, [navigation]);

  const renderItem = ({ item }: { item: any }) => {
    const event = item.event;
    const title = event?.title ?? 'Event';
    const date = event?.startDate ? format(new Date(event.startDate), 'EEE, MMM d • h:mm a') : '';
    const ticketTypeName = item.ticketType?.name;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.chip}>Waiting</Text>
        </View>
        {!!date && <Text style={styles.cardSubtitle}>{date}</Text>}
        {ticketTypeName && (
          <Text style={styles.cardMeta}>
            {ticketTypeName} • Qty {item.quantity ?? 1}
          </Text>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.cardFooterText}>We’ll notify you if tickets free up.</Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancel(item.id)}
          >
            <Text style={styles.cancelButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Waitlist</Text>
      </View>
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        ) : items.length === 0 ? (
          <ScrollView contentContainerStyle={styles.emptyContent}>
            <View style={styles.emptyState}>
              <Clock size={64} color={COLORS.textSecondary} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>No waitlists yet</Text>
              <Text style={styles.emptySubtext}>
                When you join a waitlist for a sold-out event, it will show here.
              </Text>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={renderItem}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardFooterText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  chip: {
    fontSize: 11,
    color: COLORS.accent,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  cancelButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
