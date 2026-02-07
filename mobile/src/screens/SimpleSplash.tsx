import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore, useHydrationStore } from '../store/authStore';

const MIN_SPLASH_MS = 1500;
const MAX_WAIT_HYDRATION_MS = 3000;

export const SimpleSplash = () => {
  const navigation = useNavigation();
  const authHydrated = useHydrationStore((s) => s.authHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [minSplashDone, setMinSplashDone] = useState(false);

  // Wait for both: (1) auth store rehydration from AsyncStorage, (2) minimum splash time
  useEffect(() => {
    const t = setTimeout(() => setMinSplashDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!minSplashDone) return;
    // If hydration takes too long, proceed anyway so app doesn't hang on device
    const fallback = setTimeout(() => {
      try {
        if (isAuthenticated) {
          navigation.navigate('MainTabs' as never);
        } else {
          navigation.navigate('Onboarding' as never);
        }
      } catch (e) {
        navigation.navigate('Onboarding' as never);
      }
    }, MAX_WAIT_HYDRATION_MS);

    if (!authHydrated) return () => clearTimeout(fallback);

    const timer = setTimeout(() => {
      try {
        if (isAuthenticated) {
          navigation.navigate('MainTabs' as never);
        } else {
          navigation.navigate('Onboarding' as never);
        }
      } catch (e) {
        navigation.navigate('Onboarding' as never);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallback);
    };
  }, [authHydrated, minSplashDone, isAuthenticated, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>plat</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 60,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#FFF',
  },
});