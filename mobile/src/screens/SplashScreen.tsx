import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation();
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo Fade In
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      // Navigate to Onboarding after animation
      setTimeout(() => {
        navigation.replace('Onboarding' as never);
      }, 1500);
    });
  }, []);

  return (
    <View style={styles.splashContainer}>
      <Animated.Text style={[styles.splashLogo, { opacity: logoOpacity }]}>
        plat
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    fontSize: 60,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#FFF',
  },
});