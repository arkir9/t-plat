import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Home, MapPin, Ticket, Heart, User, Compass } from 'lucide-react-native';
import { HomeScreen } from '../screens/home/HomeScreen';
import MapScreen from '../screens/map/MapScreen';
import { TicketsScreen } from '../screens/tickets/TicketsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { FavoritesScreen } from '../screens/profile/FavoritesScreen';
import { theme } from '../design/theme';

const { colors } = theme;

const COLORS = {
  background: colors.dark.background,
  accent: colors.primary[500],
  text: colors.dark.text,
  textSecondary: colors.dark.textSecondary,
};

type TabName = 'Home' | 'Map' | 'Tickets' | 'Favorites' | 'Profile';

export const MainTabNavigator = () => {
  const [activeTab, setActiveTab] = useState<TabName>('Home');

  const tabs: { name: TabName; label: string; icon: typeof Home }[] = [
    { name: 'Home', label: 'Home', icon: Home },
    { name: 'Map', label: 'Map', icon: Compass },
    { name: 'Tickets', label: 'Tickets', icon: Ticket },
    { name: 'Favorites', label: 'Saved', icon: Heart },
    { name: 'Profile', label: 'Profile', icon: User },
  ];

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen />;
      case 'Map':
        return <MapScreen />;
      case 'Tickets':
        return <TicketsScreen />;
      case 'Favorites':
        return <FavoritesScreen />;
      case 'Profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>{renderScreen()}</View>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => setActiveTab(tab.name)}
              activeOpacity={0.7}
            >
              <Icon size={24} color={isActive ? COLORS.accent : COLORS.textSecondary} />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? COLORS.accent : COLORS.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
});
