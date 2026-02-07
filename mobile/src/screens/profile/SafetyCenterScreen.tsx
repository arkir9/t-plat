import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Phone, Plus, MapPin, ChevronLeft, X } from 'lucide-react-native';
import { safetyService, EmergencyContact } from '../../services/safetyService';
import * as Location from 'expo-location';

const COLORS = {
  primary: '#000',
  accent: '#8B5CF6',
  success: '#10B981',
  error: '#EF4444',
  surface: '#F5F5F5',
  white: '#FFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
};

export function SafetyCenterScreen({ navigation, route }: any) {
  const { eventId } = route.params || {};
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContact, setNewContact] = useState({ contactName: '', contactPhone: '', contactEmail: '', relationship: '' });

  useEffect(() => {
    loadContacts();
    if (eventId) {
      checkCheckInStatus();
    }
  }, [eventId]);

  const loadContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const contactsData = await safetyService.getEmergencyContacts();
      setContacts(contactsData);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const checkCheckInStatus = async () => {
    if (!eventId) return;
    try {
      const status = await safetyService.getCheckInStatus(eventId);
      setIsCheckedIn(status.checkedIn);
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!eventId) {
      Alert.alert('Error', 'No event specified');
      return;
    }

    try {
      // Get user location
      const { status } = await Location.requestForegroundPermissionsAsync();
      let location = null;
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        location = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
      }

      await safetyService.checkIn({
        eventId,
        latitude: location?.latitude,
        longitude: location?.longitude,
        shareWithContacts: true,
      });

      setIsCheckedIn(true);
      Alert.alert(
        'You are checked in!',
        'Your emergency contacts have been notified of your location.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check in. Please try again.');
    }
  };

  const handleCheckOut = async () => {
    if (!eventId) return;
    try {
      await safetyService.checkOut(eventId);
      setIsCheckedIn(false);
      Alert.alert('Checked Out', 'You have been checked out from the event.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check out. Please try again.');
    }
  };

  const handleAddContact = async () => {
    if (!newContact.contactName.trim() || !newContact.contactPhone.trim()) {
      Alert.alert('Error', 'Please fill in name and phone number');
      return;
    }

    try {
      await safetyService.addEmergencyContact({
        contactName: newContact.contactName,
        contactPhone: newContact.contactPhone,
        contactEmail: newContact.contactEmail || undefined,
        relationship: newContact.relationship || undefined,
      });
      setShowAddContactModal(false);
      setNewContact({ contactName: '', contactPhone: '', contactEmail: '', relationship: '' });
      loadContacts();
      Alert.alert('Success', 'Emergency contact added');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add contact. Please try again.');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await safetyService.deleteEmergencyContact(contactId);
              loadContacts();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete contact.');
            }
          },
        },
      ]
    );
  };

  const handleCallContact = (contact: EmergencyContact) => {
    Alert.alert('Call', `Calling ${contact.contactName} at ${contact.contactPhone}`);
    // In production, use Linking to make phone call
  };

  const handleReportIssue = async () => {
    if (!eventId) {
      Alert.alert('Error', 'No event specified');
      return;
    }

    Alert.prompt(
      'Report Safety Issue',
      'Please describe the safety concern:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async (description) => {
            if (!description || !description.trim()) {
              Alert.alert('Error', 'Please provide a description');
              return;
            }

            try {
              await safetyService.reportSafetyIssue({
                eventId,
                reportType: 'safety_concern',
                description: description.trim(),
              });
              Alert.alert('Success', 'Your safety report has been submitted. We will review it shortly.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to submit report. Please try again.');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Center</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* 1. Event Check-in */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MapPin size={20} color={COLORS.accent} />
            <Text style={styles.cardTitle}>Event Check-in</Text>
          </View>
          <Text style={styles.cardDesc}>
            Let your friends know you've arrived safely at "Nairobi Tech Week".
          </Text>

          {!isCheckedIn ? (
            <TouchableOpacity style={styles.checkInButton} onPress={handleCheckIn}>
              <Text style={styles.checkInText}>I'm Here & Safe</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.checkedInState}>
              <Text style={{ color: COLORS.success, fontWeight: 'bold' }}>
                Checked In
              </Text>
              <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                Auto-checkout at event end
              </Text>
              <TouchableOpacity
                style={styles.checkOutButton}
                onPress={handleCheckOut}
              >
                <Text style={styles.checkOutText}>Check Out</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 2. Emergency Contacts */}
        <View style={styles.section}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddContactModal(true)}
            >
              <Plus size={16} color="#FFF" />
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
          </View>

          {isLoadingContacts ? (
            <ActivityIndicator size="small" color={COLORS.accent} style={{ marginVertical: 20 }} />
          ) : contacts.length === 0 ? (
            <View style={styles.emptyContacts}>
              <Text style={styles.emptyContactsText}>No emergency contacts</Text>
              <Text style={styles.emptyContactsSubtext}>Add contacts to share your location during events</Text>
            </View>
          ) : (
            contacts.map((contact) => (
              <View key={contact.id} style={styles.contactRow}>
                <View style={styles.avatar}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                    {contact.contactName[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>
                    {contact.contactName}
                    {contact.isPrimary && (
                      <Text style={{ color: COLORS.accent, fontSize: 12 }}> (Primary)</Text>
                    )}
                  </Text>
                  <Text style={styles.contactPhone}>{contact.contactPhone}</Text>
                  {contact.relationship && (
                    <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                      {contact.relationship}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCallContact(contact)}
                >
                  <Phone size={16} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* 3. Report Issues */}
        <TouchableOpacity
          style={styles.reportButton}
          onPress={handleReportIssue}
          disabled={!eventId}
        >
          <Shield size={20} color="#FFF" />
          <Text style={styles.reportText}>Report Safety Issue</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal
        visible={showAddContactModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddContactModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Emergency Contact</Text>
              <TouchableOpacity onPress={() => setShowAddContactModal(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Name *"
              value={newContact.contactName}
              onChangeText={(text) => setNewContact({ ...newContact, contactName: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Phone Number *"
              keyboardType="phone-pad"
              value={newContact.contactPhone}
              onChangeText={(text) => setNewContact({ ...newContact, contactPhone: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Email (optional)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={newContact.contactEmail}
              onChangeText={(text) => setNewContact({ ...newContact, contactEmail: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Relationship (optional)"
              value={newContact.relationship}
              onChangeText={(text) => setNewContact({ ...newContact, relationship: text })}
            />

            <TouchableOpacity style={styles.modalButton} onPress={handleAddContact}>
              <Text style={styles.modalButtonText}>Add Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },

  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardDesc: {
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },

  checkInButton: {
    backgroundColor: COLORS.success,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkInText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkedInState: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },

  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  addText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactName: {
    fontWeight: '600',
    fontSize: 16,
  },
  contactPhone: {
    color: '#999',
    fontSize: 12,
  },
  callButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  reportButton: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  reportText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkOutButton: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  checkOutText: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContacts: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContactsText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptyContactsSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
