/**
 * MainTabNavigator — Plat Tabs v2
 *
 * Tab order: Home · Going? · Map (centre) · Tickets · Profile
 * Map earns the anchor position for spatial discovery.
 */

import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Home, MapPin, Ticket, Heart, User } from 'lucide-react-native';
import { HomeScreen } from '../screens/home/HomeScreen';
import MapScreen from '../screens/map/MapScreen';
import { TicketsScreen } from '../screens/tickets/TicketsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { GoingScreen } from '../screens/going/GoingScreen';
import { theme } from '../design/theme';
import type { RootStackParamList } from './RootNavigator';

// v2 design tokens from plat_tabs_v2.html
const COLORS = {
  bg: '#07070F',
  surface: '#10101E',
  border: 'rgba(255,255,255,0.07)',
  accent: '#7B5CFA',
  accent2: '#B06EFF',
  text: '#EFEFF8',
  muted: '#55547A',
  dim: '#9090B8',
  red: '#FF4D6A',
};

type TabName = 'Home' | 'Going' | 'Map' | 'Tickets' | 'Profile';

const VALID_TABS: TabName[] = ['Home', 'Going', 'Map', 'Tickets', 'Profile'];

const TAB_HEIGHT = 72;

export const MainTabNavigator = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'MainTabs'>>();
  const screenParam = route.params?.screen as string | undefined;
  const [activeTab, setActiveTab] = useState<TabName>('Home');

  useEffect(() => {
    const mapped = screenParam === 'Favorites' || screenParam === 'Saved' ? 'Going' : (screenParam as TabName);
    if (mapped && VALID_TABS.includes(mapped)) {
      setActiveTab(mapped);
    }
  }, [screenParam]);

  const tabs: { name: TabName; label: string; icon: typeof Home; isMapTab?: boolean; badgeCount?: number }[] = [
    { name: 'Home', label: 'Home', icon: Home },
    { name: 'Going', label: 'Going?', icon: Heart },
    { name: 'Map', label: 'Map', icon: MapPin, isMapTab: true },
    { name: 'Tickets', label: 'Tickets', icon: Ticket, badgeCount: 0 },
    { name: 'Profile', label: 'Profile', icon: User },
  ];

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen />;
      case 'Going':
        return <GoingScreen />;
      case 'Map':
        return <MapScreen />;
      case 'Tickets':
        return <TicketsScreen />;
      case 'Profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>{renderScreen()}</View>
      <View style={[styles.tabBar, Platform.OS === 'ios' && styles.tabBarSafe]}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.name;
          const isMapTab = tab.isMapTab;
          return (
            <TouchableOpacity
              key={tab.name}
              style={[styles.tab, isMapTab && styles.tabMap]}
              onPress={() => setActiveTab(tab.name)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.tabIconWrap,
                isActive && styles.tabIconWrapActive,
                isMapTab && isActive && styles.tabIconWrapMapActive,
              ]}>
                <View style={styles.iconBadgeWrap}>
                  <Icon
                    size={isMapTab ? 22 : 20}
                    color={isActive ? COLORS.accent2 : COLORS.muted}
                    fill={tab.name === 'Going' && isActive ? COLORS.accent2 : 'transparent'}
                  />
                  {tab.badgeCount != null && tab.badgeCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{tab.badgeCount}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activePill} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  screenContainer: { flex: 1 },
  tabBar: {
    height: TAB_HEIGHT,
    backgroundColor: 'rgba(7,7,15,0.96)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    paddingTop: 10,
    ...(Platform.OS === 'ios' && { paddingBottom: 24 }),
  },
  tabBarSafe: {},
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 3,
  },
  tabMap: {},
  tabIconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  tabIconWrapActive: {
    backgroundColor: 'rgba(123,92,250,0.16)',
  },
  tabIconWrapMapActive: {
    width: 38,
    height: 38,
    marginTop: -3,
    backgroundColor: 'transparent',
    // Gradient-like glow - use overlay
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.muted,
    marginTop: 4,
  },
  tabLabelActive: {
    color: COLORS.accent2,
    fontWeight: '700',
  },
  activePill: {
    position: 'absolute',
    top: -2,
    width: 20,
    height: 2.5,
    backgroundColor: COLORS.accent2,
    borderRadius: 2,
  },
  iconBadgeWrap: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 10,
    backgroundColor: COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.bg,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
  },
});
