/**
 * notificationService.ts
 *
 * Handles scheduling and sending of push notifications:
 * 1. Friday 4pm "Tonight in Nairobi" notification — weekly habit builder
 *    Deep links → MainTabs with Tonight filter active on Map
 * 2. Event reminders (24h and 2h before events the user has tickets for)
 * 3. Waitlist notifications (when a spot opens up)
 * 4. Price drop alerts (for favourited events)
 *
 * Uses expo-notifications for local scheduling and FCM tokens for
 * server-sent push via the backend.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

// ── Notification handler (shown when app is foregrounded) ─────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── Permission & Token ────────────────────────────────────────────────────

/**
 * Request push permission and register FCM/APNs token with backend.
 * Call once after login, or when user enables notifications in Settings.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[notifications] Skipping — not a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[notifications] Permission not granted');
    return null;
  }

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Plat',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
    await Notifications.setNotificationChannelAsync('tonight', {
      name: 'Tonight in Nairobi',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 100],
    });
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Register with backend so server-sent pushes reach this device
    await api.post('/notifications/register-token', { token, platform: Platform.OS });

    // Schedule weekly Friday notification now that we have permission
    await scheduleFridayTonightNotification();

    return token;
  } catch (error) {
    console.error('[notifications] Token registration failed:', error);
    return null;
  }
}

// ── Friday 4pm "Tonight" Notification ────────────────────────────────────

/**
 * Schedules a recurring local notification every Friday at 4:00 PM local time.
 * Deep links to the map with the Tonight filter pre-applied.
 *
 * Strategy: Cancel any existing friday-tonight identifier, then reschedule.
 * This ensures the schedule stays correct even if the user changes timezone.
 */
export async function scheduleFridayTonightNotification() {
  const IDENTIFIER = 'friday-tonight-weekly';

  // Cancel existing to avoid duplicates
  try {
    await Notifications.cancelScheduledNotificationAsync(IDENTIFIER);
  } catch {
    // May not exist yet — that's fine
  }

  await Notifications.scheduleNotificationAsync({
    identifier: IDENTIFIER,
    content: {
      title: "🌃 What's happening tonight?",
      body: 'See what events are on in Nairobi tonight.',
      data: {
        // Deep link params — read by notification response handler
        screen: 'MainTabs',
        tabScreen: 'Map',
        filter: 'tonight',
      },
      categoryIdentifier: 'tonight',
    },
    trigger: {
      // Every Friday at 16:00 local time
      weekday: 6, // 1=Sunday ... 6=Friday in Expo's convention
      hour: 16,
      minute: 0,
      repeats: true,
    } as Notifications.WeeklyTriggerInput,
  });

  console.log('[notifications] Friday 4pm notification scheduled');
}

export async function cancelFridayTonightNotification() {
  try {
    await Notifications.cancelScheduledNotificationAsync('friday-tonight-weekly');
  } catch {}
}

// ── Event Reminders ───────────────────────────────────────────────────────

interface EventReminder {
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  venueName?: string;
}

/**
 * Schedule 24h and 2h reminder notifications for a purchased event.
 * Call from SuccessScreen after ticket purchase.
 */
export async function scheduleEventReminders(event: EventReminder) {
  const now = new Date();
  const eventTime = new Date(event.eventDate);

  const reminders = [
    { offset: 24 * 60 * 60 * 1000, label: 'tomorrow' },
    { offset: 2  * 60 * 60 * 1000, label: 'in 2 hours' },
  ];

  for (const { offset, label } of reminders) {
    const fireAt = new Date(eventTime.getTime() - offset);
    if (fireAt <= now) continue; // Already past

    const identifier = `event-reminder-${event.eventId}-${offset}`;
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch {}

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `🎟 ${event.eventTitle} is ${label}`,
        body: event.venueName
          ? `Starting at ${eventTime.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })} at ${event.venueName}`
          : `Starting at ${eventTime.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}`,
        data: { screen: 'TicketDetail', eventId: event.eventId },
      },
      trigger: { date: fireAt } as Notifications.DateTriggerInput,
    });
  }
}

export async function cancelEventReminders(eventId: string) {
  const offsets = [24 * 60 * 60 * 1000, 2 * 60 * 60 * 1000];
  for (const offset of offsets) {
    try {
      await Notifications.cancelScheduledNotificationAsync(`event-reminder-${eventId}-${offset}`);
    } catch {}
  }
}

// ── Notification Response Handler ─────────────────────────────────────────

/**
 * Set up handler in App.tsx to navigate based on notification tap.
 *
 * Usage in App.tsx:
 *   import { setupNotificationResponseHandler } from './src/services/notificationService';
 *   setupNotificationResponseHandler(navigationRef);
 */
export function setupNotificationResponseHandler(navigationRef: React.RefObject<any>) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as any;

    if (!data || !navigationRef.current) return;

    try {
      if (data.screen === 'MainTabs') {
        navigationRef.current.navigate('MainTabs', {
          screen: data.tabScreen || 'Home',
          params: data.filter ? { initialFilter: data.filter } : undefined,
        });
      } else if (data.screen === 'TicketDetail' && data.eventId) {
        navigationRef.current.navigate('MainTabs', { screen: 'Tickets' });
      } else if (data.screen) {
        navigationRef.current.navigate(data.screen, data.params || {});
      }
    } catch (e) {
      console.log('[notifications] Navigation from notification failed:', e);
    }
  });
}

// ── Backend-triggered notifications (server → FCM → device) ──────────────
// These are handled server-side via Firebase Admin SDK.
// The backend sends them for:
//   - Waitlist spot available
//   - Price drop on favourited event
//   - Plat Pro application approved/rejected
//   - New ticket sale (to organiser)
//   - Refund request (to organiser)
// No client code needed beyond having a registered token.
