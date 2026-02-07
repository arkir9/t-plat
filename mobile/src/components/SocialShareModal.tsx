import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { X, Link as LinkIcon, Copy, Instagram, MessageCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const COLORS = { primary: '#000', surface: '#F5F5F5', white: '#FFF' };

interface Event {
  title: string;
  date: string;
  image: string;
  id?: string;
}

interface SocialShareModalProps {
  visible: boolean;
  onClose: () => void;
  event: Event | null;
}

export function SocialShareModal({ visible, onClose, event }: SocialShareModalProps) {
  if (!visible || !event) return null;

  const handleCopyLink = async () => {
    const eventLink = `https://plat.app/events/${event.id || 'event'}`;
    try {
      if (Platform.OS === 'web') {
        // For web, use the Web Share API or fallback
        if (navigator.share) {
          await navigator.share({
            title: event.title,
            text: `Check out this event: ${event.title}`,
            url: eventLink,
          });
        } else {
          // Fallback: copy to clipboard using modern API
          await navigator.clipboard.writeText(eventLink);
          Alert.alert('Link Copied', 'Event link has been copied to clipboard');
        }
      } else {
        // For native, use React Native Share
        await Share.share({
          message: `Check out this event: ${event.title}\n${eventLink}`,
          url: eventLink,
        });
      }
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share link');
      }
    }
  };

  const handleShare = (platform: string) => {
    // In a real app, you would integrate with native sharing APIs
    Alert.alert('Share', `Sharing to ${platform}...`);
  };

  const SocialButton = ({
    label,
    color,
    icon,
    onPress,
  }: {
    label: string;
    color: string;
    icon: React.ReactNode;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.gridItem} onPress={onPress}>
      <View style={[styles.iconCircle, { backgroundColor: color }]}>
        {icon}
      </View>
      <Text style={styles.gridLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Share Event</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Event Preview Card */}
          <View style={styles.previewCard}>
            <Image source={{ uri: event.image }} style={styles.previewImage} />
            <View style={styles.previewContent}>
              <Text style={styles.previewTitle} numberOfLines={1}>
                {event.title}
              </Text>
              <Text style={styles.previewDate}>{event.date}</Text>
            </View>
          </View>

          {/* Social Grid */}
          <View style={styles.gridContainer}>
            {/* Instagram Stories */}
            <SocialButton
              label="Stories"
              color="#E1306C"
              icon={<Instagram color="#FFF" size={24} />}
              onPress={() => handleShare('Instagram Stories')}
            />
            {/* Snapchat (Yellow) */}
            <SocialButton
              label="Snapchat"
              color="#FFFC00"
              icon={
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: '#FFF',
                  }}
                />
              }
              onPress={() => handleShare('Snapchat')}
            />
            {/* Locket (Gold) */}
            <SocialButton
              label="Locket"
              color="#FAAD14"
              icon={
                <View
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: '#FFF',
                    borderRadius: 4,
                  }}
                />
              }
              onPress={() => handleShare('Locket')}
            />
            {/* WhatsApp (Green) */}
            <SocialButton
              label="WhatsApp"
              color="#25D366"
              icon={<MessageCircle color="#FFF" size={24} />}
              onPress={() => handleShare('WhatsApp')}
            />
          </View>

          {/* Copy Link Action */}
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
            <Copy size={20} color="#000" style={{ marginRight: 12 }} />
            <Text style={styles.copyText}>Copy Link</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#EEE',
  },
  previewContent: {
    marginLeft: 12,
    justifyContent: 'center',
    flex: 1,
  },
  previewTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  previewDate: {
    color: '#666',
    fontSize: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gridItem: {
    width: width / 4 - 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 12,
    color: '#333',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
  },
  copyText: {
    fontWeight: '600',
    fontSize: 16,
  },
});
