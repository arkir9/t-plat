/**
 * App.tsx
 *
 * CHANGES FROM ORIGINAL:
 * 1. Added useEffect to wire setupNotificationResponseHandler() —
 *    handles taps on push notifications and routes to the correct screen.
 * 2. Added `linking` config for deep links (tplat://event/123, https://plat.app/events/123)
 *    so share card links open the right screen even when the app is closed.
 *
 * navigationRef was already present — no structural changes needed.
 */

import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, NavigationContainerRef, LinkingOptions } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, StyleSheet } from 'react-native';

import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { setupNotificationResponseHandler } from './src/services/notificationService';

// ── Deep linking config ────────────────────────────────────────────────────
// Matches: tplat://event/abc123  OR  https://plat.app/events/abc123
const linking: LinkingOptions<any> = {
  prefixes: ['tplat://', 'https://plat.app'],
  config: {
    screens: {
      MainTabs: '',
      EventDetail: 'events/:eventId',
      TicketSelection: 'tickets/:eventId',
      // Extend here as needed, e.g. Profile: 'profile'
    },
  },
};

// ── Error boundary ─────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong</Text>
          <Text style={styles.errorDetails}>{this.state.error?.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ── Root component ─────────────────────────────────────────────────────────
export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any> | null>(null);

  useEffect(() => {
    // Wire notification tap handler.
    // When a user taps a push notification, this routes them to the right screen.
    // setupNotificationResponseHandler returns a subscription — clean it up on unmount.
    const subscription = setupNotificationResponseHandler(navigationRef);
    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <NavigationContainer ref={navigationRef} linking={linking}>
              <RootNavigator />
              <StatusBar style="light" />
            </NavigationContainer>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorDetails: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
});
