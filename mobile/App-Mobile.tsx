import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

import { SplashScreen } from './src/screens/SplashScreen-Simple';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { theme } from './src/design/theme';

type AppState = 'splash' | 'welcome' | 'main';

export default function App() {
  const [appState, setAppState] = useState<AppState>('splash');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (appState === 'welcome') {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [appState]);

  const handleSplashComplete = () => {
    setAppState('welcome');
  };

  const handleGetStarted = () => {
    setAppState('main');
  };

  if (appState === 'splash') {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  if (appState === 'welcome') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={styles.container}>
            <StatusBar style="light" />
            
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
              <View style={styles.logoContainer}>
                <Text style={styles.logo}>plat</Text>
                <View style={styles.logoUnderline} />
              </View>
              
              <View style={styles.heroContainer}>
                <Text style={styles.heroTitle}>
                  Discover Amazing{'\n'}Events Near You
                </Text>
                <Text style={styles.heroSubtitle}>
                  Connect with the hottest events, buy tickets instantly, 
                  and experience unforgettable moments.
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.getStartedButton}
                onPress={handleGetStarted}
                activeOpacity={0.9}
              >
                <Text style={styles.getStartedText}>Get Started</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // Main app — full navigation with all screens
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
            <StatusBar style="light" />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 56,
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  logoUnderline: {
    height: 3,
    width: 80,
    marginTop: 8,
    borderRadius: 2,
    backgroundColor: theme.colors.primary[500],
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  getStartedButton: {
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});