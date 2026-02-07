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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronLeft, Calendar, MapPin } from 'lucide-react-native';
import { eventsService } from '../../services/eventsService';

const COLORS = {
  primary: '#000000',
  accent: '#8B5CF6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E5E5E5',
};

export function PlatProCreateEventScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('Nairobi');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() + 2 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 5 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing info', 'Please add a title for your event.');
      return;
    }
    if (!address.trim() || !city.trim()) {
      Alert.alert('Missing info', 'Please add a location (address and city).');
      return;
    }
    if (endDate <= startDate) {
      Alert.alert('Invalid time', 'End time must be after the start time.');
      return;
    }

    setSaving(true);
    try {
      await eventsService.createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timezone: 'Africa/Nairobi',
        locationType: 'custom',
        customLocation: {
          address: address.trim(),
          city: city.trim(),
          country: 'Kenya',
          latitude: -1.2921,
          longitude: 36.8219,
        } as any,
      } as any);
      Alert.alert('Event created', 'Your event has been saved as a draft.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || error?.message || 'Failed to create event. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create event</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Event title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Friday Night at Alchemist"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
          placeholder="Tell people what to expect…"
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. music, club_night"
          value={category}
          onChangeText={setCategory}
        />

        <Text style={styles.label}>When</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.chip, { flex: 1 }]}
            onPress={() => setShowStartPicker(true)}
          >
            <Calendar size={16} color={COLORS.textSecondary} />
            <Text style={styles.chipText}>{startDate.toLocaleString()}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.chip, { flex: 1 }]} onPress={() => setShowEndPicker(true)}>
            <Calendar size={16} color={COLORS.textSecondary} />
            <Text style={styles.chipText}>{endDate.toLocaleString()}</Text>
          </TouchableOpacity>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="datetime"
            onChange={(_, date) => {
              setShowStartPicker(false);
              if (date) setStartDate(date);
            }}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="datetime"
            onChange={(_, date) => {
              setShowEndPicker(false);
              if (date) setEndDate(date);
            }}
          />
        )}

        <Text style={styles.label}>Location</Text>
        <View style={styles.row}>
          <MapPin size={16} color={COLORS.textSecondary} />
          <TextInput
            style={[styles.input, { flex: 1, marginLeft: 8 }]}
            placeholder="Street address"
            value={address}
            onChangeText={setAddress}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="City"
          value={city}
          onChangeText={setCity}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Save event as draft'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  content: { padding: 16, paddingBottom: 32 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    gap: 6,
  },
  chipText: { fontSize: 13, color: COLORS.textSecondary },
  primaryButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
});

