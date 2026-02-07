import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';

export type PushPlatform = 'ios' | 'android' | 'web';

async function getExpoPushTokenAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

function getPlatform(): PushPlatform {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

export const notificationService = {
  /**
   * Request notification permission, get Expo push token, and register it with the backend.
   */
  async registerForPushNotifications() {
    try {
      const token = await getExpoPushTokenAsync();
      if (!token) return;

      await api.post('/notifications/register-device', {
        token,
        platform: getPlatform(),
      });
    } catch (error) {
      // Silently ignore – app should still work without push
      console.warn('Failed to register for push notifications', error);
    }
  },
};

