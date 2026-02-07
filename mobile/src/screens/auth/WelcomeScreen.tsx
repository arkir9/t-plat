import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  Button, 
  Heading1, 
  Heading2, 
  Body, 
  theme 
} from '../../design/components';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WelcomeScreenProps {
  navigation: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const fadeInAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeInAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handleGetStarted = () => {
    navigation.navigate('Register');
  };
  
  const handleSignIn = () => {
    navigation.navigate('Login');
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Dynamic Background */}
      <LinearGradient
        colors={['#000000', '#1A1A1A', '#0A0A0A']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Animated Background Elements */}
      <View style={styles.backgroundElements}>
        <Animated.View style={[
          styles.floatingOrb,
          styles.orb1,
          {
            opacity: fadeInAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
          },
        ]}>
          <LinearGradient
            colors={[theme.colors.primary[400], theme.colors.primary[600]]}
            style={styles.orbGradient}
          />
        </Animated.View>
        
        <Animated.View style={[
          styles.floatingOrb,
          styles.orb2,
          {
            opacity: fadeInAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.2],
            }),
          },
        ]}>
          <LinearGradient
            colors={[theme.colors.primary[300], theme.colors.primary[500]]}
            style={styles.orbGradient}
          />
        </Animated.View>
        
        <Animated.View style={[
          styles.floatingOrb,
          styles.orb3,
          {
            opacity: fadeInAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.1],
            }),
          },
        ]}>
          <LinearGradient
            colors={[theme.colors.primary[200], theme.colors.primary[400]]}
            style={styles.orbGradient}
          />
        </Animated.View>
      </View>
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Hero Section */}
          <Animated.View
            style={[
              styles.heroSection,
              {
                opacity: fadeInAnim,
                transform: [
                  { translateY: slideUpAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Heading1 style={styles.logo}>plat</Heading1>
              <View style={styles.logoAccent}>
                <LinearGradient
                  colors={theme.colors.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
            </View>
            
            {/* Hero Text */}
            <View style={styles.heroTextContainer}>
              <Heading2 style={styles.heroTitle}>
                Discover Amazing{'\n'}Events Near You
              </Heading2>
              
              <Body style={styles.heroSubtitle}>
                Connect with the hottest events, buy tickets instantly, 
                and experience unforgettable moments with friends.
              </Body>
            </View>
            
            {/* Feature Highlights */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <LinearGradient
                    colors={[theme.colors.primary[400], theme.colors.primary[600]]}
                    style={styles.featureIconGradient}
                  />
                  <Body style={styles.featureEmoji}>M</Body>
                </View>
                <Body style={styles.featureText}>Map Discovery</Body>
              </View>
              
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <LinearGradient
                    colors={[theme.colors.primary[400], theme.colors.primary[600]]}
                    style={styles.featureIconGradient}
                  />
                  <Body style={styles.featureEmoji}>T</Body>
                </View>
                <Body style={styles.featureText}>Instant Tickets</Body>
              </View>
              
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <LinearGradient
                    colors={[theme.colors.primary[400], theme.colors.primary[600]]}
                    style={styles.featureIconGradient}
                  />
                  <Body style={styles.featureEmoji}>S</Body>
                </View>
                <Body style={styles.featureText}>Social Sharing</Body>
              </View>
            </View>
          </Animated.View>
          
          {/* CTA Section */}
          <Animated.View
            style={[
              styles.ctaSection,
              {
                opacity: fadeInAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            {/* Glass Card */}
            <BlurView intensity={20} style={styles.ctaCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={StyleSheet.absoluteFillObject}
              />
              
              <View style={styles.buttonContainer}>
                <Button
                  title="Get Started"
                  onPress={handleGetStarted}
                  variant="primary"
                  size="lg"
                  fullWidth
                />
                
                <Button
                  title="Sign In"
                  onPress={handleSignIn}
                  variant="glass"
                  size="lg"
                  fullWidth
                  style={styles.signInButton}
                />
              </View>
              
              <Body style={styles.termsText}>
                By continuing, you agree to our{' '}
                <Body style={styles.termsLink}>Terms of Service</Body>
                {' '}and{' '}
                <Body style={styles.termsLink}>Privacy Policy</Body>
              </Body>
            </BlurView>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundElements: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingOrb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  orb2: {
    width: 200,
    height: 200,
    top: SCREEN_HEIGHT * 0.3,
    left: -50,
  },
  orb3: {
    width: 150,
    height: 150,
    bottom: 100,
    right: -30,
  },
  orbGradient: {
    flex: 1,
    borderRadius: 9999,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing['2xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  logo: {
    fontSize: 56,
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: -2,
    textShadowColor: 'rgba(139, 92, 246, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  logoAccent: {
    height: 3,
    width: 80,
    marginTop: theme.spacing.sm,
    borderRadius: 2,
    overflow: 'hidden',
  },
  heroTextContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  heroTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    color: '#FFFFFF',
  },
  heroSubtitle: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.md,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: theme.spacing.xl,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.md,
  },
  featureIconGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  ctaSection: {
    paddingBottom: theme.spacing.xl,
  },
  ctaCard: {
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  buttonContainer: {
    marginBottom: theme.spacing.lg,
  },
  signInButton: {
    marginTop: theme.spacing.md,
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  termsLink: {
    color: theme.colors.primary[400],
    fontSize: 12,
  },
});