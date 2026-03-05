import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthStore, useHydrationStore } from '../store/authStore';
import { SplashScreen } from '../screens/SplashScreen';

// Screens
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { EventDetailScreen } from '../screens/events/EventDetailScreen';
import { TicketSelectionScreen } from '../screens/tickets/TicketSelectionScreen';
import { CheckoutScreen } from '../screens/tickets/CheckoutScreen';
import { SuccessScreen } from '../screens/tickets/SuccessScreen';
import { TicketDetailScreen } from '../screens/tickets/TicketDetailScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { FavoritesScreen } from '../screens/profile/FavoritesScreen';
import { WaitlistScreen } from '../screens/profile/WaitlistScreen';
import { SafetyCenterScreen } from '../screens/profile/SafetyCenterScreen';

// Organizer Screens
import { PlatProScreen } from '../screens/profile/PlatProScreen';
import { PlatProDashboardScreen } from '../screens/profile/PlatProDashboardScreen';
import { PlatProEventsScreen } from '../screens/profile/PlatProEventsScreen';
import { PlatProCreateEventScreen } from '../screens/profile/PlatProCreateEventScreen';
import { WalletScreen } from '../screens/profile/WalletScreen';
import { PlatProApplyScreen } from '../screens/profile/PlatProApplyScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { CheckInScannerScreen } from '../screens/profile/CheckInScannerScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
  ForgotPassword: undefined;
  MainTabs: undefined;
  EventDetail: { eventId: string; event?: any };
  TicketSelection: { eventId: string; event?: any };
  Checkout: {
    eventId: string;
    event?: any;
    items: Array<{
      ticketTypeId: string;
      ticketTypeName: string;
      quantity: number;
      unitPrice: number;
      currency: string;
    }>;
    subtotal: number;
  };
  Success: { orderId: string; order?: any; eventTitle?: string };
  TicketDetail: { ticketId: string; ticket?: any };
  Profile: undefined;
  Settings: undefined;
  Favorites: undefined;
  Waitlist: undefined;
  SafetyCenter: undefined;
  PlatPro: undefined;
  PlatProDashboard: undefined;
  PlatProEvents: undefined;
  PlatProCreateEvent: { eventId?: string };
  PlatProApply: undefined;
  AdminDashboard: undefined;
  CheckInScanner: undefined;
  Wallet: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { isAuthenticated, isOnboarded, checkAuth } = useAuthStore();
  const authHydrated = useHydrationStore((s) => s.authHydrated);
  const hasOnboarded = isOnboarded ?? true;
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    checkAuth?.();
  }, [checkAuth]);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!authHydrated || !splashDone) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {!isAuthenticated ? (
        // Auth Stack
        <Stack.Group>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Group>
      ) : !hasOnboarded ? (
        // Onboarding Stack
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        // App Stack
        <Stack.Group>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          
          {/* Event & Ticketing Flow */}
          <Stack.Screen name="EventDetail" component={EventDetailScreen} />
          <Stack.Screen name="TicketSelection" component={TicketSelectionScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="Success" component={SuccessScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />

          {/* Profile & Settings */}
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Favorites" component={FavoritesScreen} />
          <Stack.Screen name="Waitlist" component={WaitlistScreen} />
          <Stack.Screen name="SafetyCenter" component={SafetyCenterScreen} />

          {/* Organizer / Plat Pro Flow */}
          <Stack.Screen name="PlatPro" component={PlatProScreen} />
          <Stack.Screen name="PlatProDashboard" component={PlatProDashboardScreen} />
          <Stack.Screen name="PlatProEvents" component={PlatProEventsScreen} />
          <Stack.Screen name="PlatProCreateEvent" component={PlatProCreateEventScreen} />
          <Stack.Screen name="PlatProApply" component={PlatProApplyScreen} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          <Stack.Screen name="CheckInScanner" component={CheckInScannerScreen} />
          <Stack.Screen name="Wallet" component={WalletScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};