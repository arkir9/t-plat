import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { eventsService } from '../../services/eventsService';

const COLORS = {
  primary: '#000000',
  accent: '#8B5CF6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
};

const EVENT_TYPES = ['nightlife', 'concert', 'festival', 'arts_culture', 'sports', 'business'] as const;

export function PlatProCreateEventScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<typeof EVENT_TYPES[number]>('nightlife');
  const [address, setAddress] = useState('Nairobi');
  const [city, setCity] = useState('Nairobi');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }
    const start = startDate || new Date(Date.now() + 86400000).toISOString();
    const end = endDate || new Date(new Date(start).getTime() + 4 * 3600000).toISOString();
    setLoading(true);
    try {
      await eventsService.createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        eventType,
        startDate: start,
        endDate: end,
        locationType: 'custom',
        customLocation: { address, city, country: 'Kenya', latitude: -1.2921, longitude: 36.8219 },
      });
      Alert.alert('Success', 'Event created!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Event</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.label}>Event Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Friday Night Live"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
        />
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your event..."
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Text style={styles.label}>Type</Text>
        <View style={styles.chipRow}>
          {EVENT_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, eventType === t && styles.chipActive]}
              onPress={() => setEventType(t)}
            >
              <Text style={[styles.chipText, eventType === t && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Start (ISO)</Text>
        <TextInput
          style={styles.input}
          placeholder="2025-03-15T18:00:00Z"
          placeholderTextColor="#999"
          value={startDate}
          onChangeText={setStartDate}
        />
        <Text style={styles.label}>End (ISO)</Text>
        <TextInput
          style={styles.input}
          placeholder="2025-03-15T23:00:00Z"
          placeholderTextColor="#999"
          value={endDate}
          onChangeText={setEndDate}
        />
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Venue or area"
          placeholderTextColor="#999"
          value={address}
          onChangeText={setAddress}
        />
        <Text style={styles.label}>City</Text>
        <TextInput
          style={styles.input}
          placeholder="Nairobi"
          placeholderTextColor="#999"
          value={city}
          onChangeText={setCity}
        />
        <TouchableOpacity
          style={[styles.createBtn, loading && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.createBtnText}>Create Event</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.surface },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  content: { flex: 1, padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  input: { backgroundColor: COLORS.surface, borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 16 },
  textArea: { minHeight: 80 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textSecondary },
  chipTextActive: { color: '#FFF', fontWeight: '600' },
  createBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  createBtnDisabled: { opacity: 0.7 },
  createBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
