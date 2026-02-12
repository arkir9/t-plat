import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ChevronLeft, Star } from 'lucide-react-native';
import { organizersService, OrganizerProfile } from '../../services/organizersService';

const COLORS = {
  primary: '#000000',
  accent: '#8B5CF6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E5E5E5',
};

export function PlatProScreen({ navigation }: any) {
  const [profiles, setProfiles] = useState<OrganizerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [profileType, setProfileType] = useState<'event_organizer' | 'venue_organizer'>(
    'event_organizer',
  );
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');

  useEffect(() => {
    (async () => {
      try {
        let list = await organizersService.getMyProfiles();
        const pendingCount = (Array.isArray(list) ? list : []).filter(
          (p) => p.verificationStatus === 'pending',
        ).length;
        if (pendingCount > 0) {
          try {
            await organizersService.verifyMyPending();
            list = await organizersService.getMyProfiles();
          } catch (_) {}
        }
        setProfiles(Array.isArray(list) ? list : []);
      } catch (e) {
        // ignore – show empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Missing info', 'Please enter a name for your organizer profile.');
      return;
    }
    setCreating(true);
    try {
      const created = await organizersService.createProfile({
        profileType,
        name: name.trim(),
        bio: bio.trim() || undefined,
        website: website.trim() || undefined,
      });
      setProfiles((prev) => [...prev, created]);
      setName('');
      setBio('');
      setWebsite('');
      Alert.alert('Plat Pro created', 'Your organizer profile has been submitted for review.');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || error?.message || 'Failed to create organizer profile.',
      );
    } finally {
      setCreating(false);
    }
  };

  const renderBadge = (type: 'event_organizer' | 'venue_organizer') => {
    if (type === 'event_organizer') return 'Event Organizer';
    return 'Venue Organizer';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plat Pro</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Star size={24} color="#FFF" />
          </View>
          <Text style={styles.heroTitle}>For organizers & venues</Text>
          <Text style={styles.heroSubtitle}>
            Create a Plat Pro profile to post events, manage venues, and see your ticket sales.
          </Text>
        </View>

        {/* Existing profiles and link to dashboard */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={COLORS.accent} />
          </View>
        ) : profiles.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Pro profiles</Text>
            {profiles.map((p) => (
              <View key={p.id} style={styles.profileCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.profileName}>{p.name}</Text>
                  <Text style={styles.profileBadge}>{renderBadge(p.profileType)}</Text>
                </View>
                {p.bio ? <Text style={styles.profileBio}>{p.bio}</Text> : null}
                <Text style={styles.profileStatus}>
                  Status:{' '}
                  <Text style={{ fontWeight: '600' }}>
                    {p.verificationStatus === 'verified'
                      ? 'Verified'
                      : p.verificationStatus === 'rejected'
                      ? 'Rejected'
                      : 'Pending review'}
                  </Text>
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('PlatProDashboard')}
            >
              <Text style={styles.secondaryButtonText}>Open organizer dashboard</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Create new profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {profiles.length ? 'Add another profile' : 'Get started as Plat Pro'}
          </Text>

          <View style={styles.toggleGroup}>
            <TouchableOpacity
              style={[
                styles.togglePill,
                profileType === 'event_organizer' && styles.togglePillActive,
              ]}
              onPress={() => setProfileType('event_organizer')}
            >
              <Text
                style={[
                  styles.toggleText,
                  profileType === 'event_organizer' && styles.toggleTextActive,
                ]}
              >
                Event organizer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.togglePill,
                profileType === 'venue_organizer' && styles.togglePillActive,
              ]}
              onPress={() => setProfileType('venue_organizer')}
            >
              <Text
                style={[
                  styles.toggleText,
                  profileType === 'venue_organizer' && styles.toggleTextActive,
                ]}
              >
                Venue / club
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder={
              profileType === 'event_organizer' ? 'Brand / organizer name *' : 'Venue name *'
            }
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            placeholder="Short bio / what you host"
            multiline
            value={bio}
            onChangeText={setBio}
          />
          <TextInput
            style={styles.input}
            placeholder="Website or Instagram (optional)"
            autoCapitalize="none"
            value={website}
            onChangeText={setWebsite}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleCreate}
            disabled={creating}
          >
            <Text style={styles.primaryButtonText}>
              {creating ? 'Submitting…' : 'Apply for Plat Pro'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  hero: {
    backgroundColor: '#050816',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  profileBadge: {
    fontSize: 11,
    color: COLORS.accent,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  profileBio: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  profileStatus: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    padding: 4,
    marginBottom: 12,
  },
  togglePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  togglePillActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#FFF',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  loadingBox: {
    paddingVertical: 16,
  },
});

