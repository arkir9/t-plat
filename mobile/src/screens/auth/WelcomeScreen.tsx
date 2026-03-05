import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { theme } from '../../design/theme';

interface WelcomeScreenProps {
  navigation: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>plat</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 56,
    fontWeight: '300',
    fontStyle: 'italic',
    color: theme.colors.dark.text,
    letterSpacing: -2,
  },
  actions: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing['3xl'] + 24,
    width: '100%',
    gap: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: 16,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.dark.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});
