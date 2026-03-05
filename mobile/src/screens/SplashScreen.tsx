import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export const SplashScreen: React.FC = () => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoOpacity, logoScale]);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.logo,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        plat
      </Animated.Text>
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
