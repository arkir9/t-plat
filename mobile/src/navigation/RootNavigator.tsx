import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SimpleSplash } from '../screens/SimpleSplash';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { EventDetailScreen } from '../screens/events/EventDetailScreen';
import { TicketSelectionScreen } from '../screens/tickets/TicketSelectionScreen';
import { CheckoutScreen } from '../screens/tickets/CheckoutScreen';
import { SuccessScreen } from '../screens/tickets/SuccessScreen';
import { MyTicketScreen } from '../screens/tickets/MyTicketScreen';
import { TicketsScreen } from '../screens/tickets/TicketsScreen';
import { SafetyCenterScreen } from '../screens/profile/SafetyCenterScreen';
import { FavoritesScreen } from '../screens/profile/FavoritesScreen';
import { WaitlistScreen } from '../screens/profile/WaitlistScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { PlatProScreen } from '../screens/profile/PlatProScreen';
import { PlatProDashboardScreen } from '../screens/profile/PlatProDashboardScreen';
import { PlatProEventsScreen } from '../screens/profile/PlatProEventsScreen';
import { PlatProCreateEventScreen } from '../screens/profile/PlatProCreateEventScreen';

const Stack = createStackNavigator();

export const RootNavigator = () => {
  return (
    <Stack.Navigator 
      initialRouteName="Splash"
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#000' },
      }}
    >
      <Stack.Screen 
        name="Splash" 
        component={SimpleSplash}
      />
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen}
      />
      <Stack.Screen 
        name="Auth" 
        component={AuthScreen}
      />
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabNavigator}
      />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="TicketSelection" component={TicketSelectionScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Success" component={SuccessScreen} />
      <Stack.Screen name="MyTicket" component={MyTicketScreen} />
      <Stack.Screen name="Tickets" component={TicketsScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="Waitlist" component={WaitlistScreen} />
      <Stack.Screen name="SafetyCenter" component={SafetyCenterScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="PlatPro" component={PlatProScreen} />
      <Stack.Screen name="PlatProDashboard" component={PlatProDashboardScreen} />
      <Stack.Screen name="PlatProEvents" component={PlatProEventsScreen} />
      <Stack.Screen name="PlatProCreateEvent" component={PlatProCreateEventScreen} />
    </Stack.Navigator>
  );
};