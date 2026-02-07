import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { theme } from '../design/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onAnimationComplete,
}) => {
  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const ticketOpacity = useRef(new Animated.Value(0)).current;
  const ticketTranslateY = useRef(new Animated.Value(50)).current;
  const ticketScale = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    startAnimation();
  }, []);
  
  const startAnimation = () => {
    // Logo animation (appears first)
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After logo appears, start ticket animation
      setTimeout(() => {
        startTicketAnimation();
      }, 300);
    });
  };
  
  const startTicketAnimation = () => {
    // Single floating ticket animation
    Animated.parallel([
      Animated.timing(ticketOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(ticketTranslateY, {
        toValue: -100,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(ticketScale, {
        toValue: 1.1,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Complete splash after animation
      setTimeout(() => {
        onAnimationComplete();
      }, 1500);
    });
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Background */}
      <View style={styles.background} />
      
      {/* Main content */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Text style={styles.logo}>plat</Text>
          <View style={styles.logoUnderline} />
        </Animated.View>
        
        {/* Floating Ticket */}
        <Animated.View
          style={[
            styles.ticketContainer,
            {
              opacity: ticketOpacity,
              transform: [
                { translateY: ticketTranslateY },
                { scale: ticketScale },
              ],
            },
          ]}
        >
          <View style={styles.ticket}>
            {/* Ticket perforations */}
            <View style={styles.perforation1} />
            <View style={styles.perforation2} />
            
            {/* Ticket content */}
            <View style={styles.ticketContent}>
              <Text style={styles.ticketText}>T-Plat</Text>
            </View>
          </View>
        </Animated.View>
      </View>
      
      {/* Bottom tagline */}
      <Animated.View
        style={[
          styles.taglineContainer,
          {
            opacity: ticketOpacity,
          },
        ]}
      >
        <Text style={styles.tagline}>Experience. Connect. Celebrate.</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    fontSize: 64,
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  logoUnderline: {
    height: 3,
    width: 120,
    marginTop: 8,
    borderRadius: 2,
    backgroundColor: theme.colors.primary[500],
  },
  ticketContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticket: {
    width: 80,
    height: 50,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: theme.colors.primary[500],
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  perforation1: {
    position: 'absolute',
    left: 25,
    top: -2,
    bottom: -2,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  perforation2: {
    position: 'absolute',
    right: 25,
    top: -2,
    bottom: -2,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  ticketContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketText: {
    fontSize: 24,
  },
  taglineContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '300',
    letterSpacing: 1,
  },
});