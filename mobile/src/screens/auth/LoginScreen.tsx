import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  Button, 
  Input,
  Heading2, 
  Body, 
  Card,
  theme 
} from '../../design/components';
import { authService } from '../../services/authService';
import { signInWithGoogle, signInWithApple } from '../../utils/socialAuth';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  
  const fadeInAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeInAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      await authService.login(formData);
      navigation.replace('Main');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      setErrors({ form: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'Google' | 'Apple') => {
    if (socialLoading) return;
    setSocialLoading(provider === 'Google' ? 'google' : 'apple');
    try {
      const result = provider === 'Google' ? await signInWithGoogle() : await signInWithApple();
      if (result.success) {
        navigation.replace('Main');
      } else if (result.error !== 'Canceled') {
        Alert.alert(provider + ' Sign-In', result.error);
      }
    } catch (e: any) {
      Alert.alert(provider + ' Sign-In', e.message || 'Something went wrong.');
    } finally {
      setSocialLoading(null);
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background */}
      <LinearGradient
        colors={['#000000', '#1A1A1A']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Background Orb */}
      <Animated.View style={[
        styles.backgroundOrb,
        {
          opacity: fadeInAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.3],
          }),
        },
      ]}>
        <LinearGradient
          colors={[theme.colors.primary[400], theme.colors.primary[600]]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View
              style={[
                styles.header,
                {
                  opacity: fadeInAnim,
                  transform: [{ translateY: slideUpAnim }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Body style={styles.backButtonText}>Back</Body>
              </TouchableOpacity>
              
              <View style={styles.headerContent}>
                <Heading2 style={styles.title}>Welcome Back</Heading2>
                <Body style={styles.subtitle}>
                  Sign in to continue your event journey
                </Body>
              </View>
            </Animated.View>
            
            {/* Form */}
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeInAnim,
                  transform: [{ translateY: slideUpAnim }],
                },
              ]}
            >
              <Card variant="glass" style={styles.formCard}>
                <Input
                  label="Email Address"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                  leftIcon={<Body style={styles.inputIcon}>@</Body>}
                />
                
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry
                  error={errors.password}
                  leftIcon={<Body style={styles.inputIcon}>*</Body>}
                />
                
                {/* Remember Me & Forgot Password */}
                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={styles.rememberMeContainer}
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxChecked
                    ]}>
                      {rememberMe && <Body style={styles.checkmark}>Y</Body>}
                    </View>
                    <Body style={styles.rememberMeText}>Remember me</Body>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ForgotPassword')}
                  >
                    <Body style={styles.forgotPasswordText}>Forgot Password?</Body>
                  </TouchableOpacity>
                </View>
                
                {errors.form ? (
                  <Body style={styles.formError}>{errors.form}</Body>
                ) : null}
                <Button
                  title="Sign In"
                  onPress={handleLogin}
                  loading={isLoading}
                  variant="primary"
                  size="lg"
                  fullWidth
                  style={styles.primaryButton}
                />
              </Card>
            </Animated.View>
            
            {/* Social Login */}
            <Animated.View
              style={[
                styles.socialContainer,
                {
                  opacity: fadeInAnim,
                  transform: [{ translateY: slideUpAnim }],
                },
              ]}
            >
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Body style={styles.dividerText}>or continue with</Body>
                <View style={styles.dividerLine} />
              </View>
              
              <View style={styles.socialButtons}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin('Google')}
                  disabled={!!socialLoading}
                >
                  <BlurView intensity={20} style={styles.socialButtonBlur}>
                    {socialLoading === 'google' ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Body style={styles.socialIcon}>G</Body>
                    )}
                  </BlurView>
                </TouchableOpacity>
                
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => handleSocialLogin('Apple')}
                    disabled={!!socialLoading}
                  >
                    <BlurView intensity={20} style={styles.socialButtonBlur}>
                      {socialLoading === 'apple' ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Body style={styles.socialIcon}>A</Body>
                      )}
                    </BlurView>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
            
            {/* Sign Up Link */}
            <Animated.View
              style={[
                styles.signUpContainer,
                {
                  opacity: fadeInAnim,
                  transform: [{ translateY: slideUpAnim }],
                },
              ]}
            >
              <Body style={styles.signUpText}>
                Don't have an account?{' '}
                <Body 
                  style={styles.signUpLink}
                  onPress={() => navigation.navigate('Register')}
                >
                  Sign Up
                </Body>
              </Body>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -100,
    left: -100,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing['2xl'],
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  formContainer: {
    marginBottom: theme.spacing.xl,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputIcon: {
    fontSize: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberMeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  forgotPasswordText: {
    color: theme.colors.primary[400],
    fontSize: 14,
    fontWeight: '600',
  },
  formError: {
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
    fontSize: 14,
  },
  primaryButton: {
    marginTop: theme.spacing.md,
  },
  socialContainer: {
    marginBottom: theme.spacing.xl,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginHorizontal: theme.spacing.md,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  socialButtonBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    fontSize: 24,
  },
  signUpContainer: {
    alignItems: 'center',
  },
  signUpText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  signUpLink: {
    color: theme.colors.primary[400],
    fontWeight: '600',
    fontSize: 14,
  },
});