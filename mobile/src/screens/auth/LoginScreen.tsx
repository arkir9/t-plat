/**
 * LoginScreen
 *
 * CHANGES FROM ORIGINAL:
 * 1. Reads `returnTo` and `returnParams` from route.params
 * 2. After successful login, navigates to returnTo screen if set,
 *    otherwise goes to MainTabs (existing behaviour)
 * 3. Registers push notifications after login (non-blocking)
 *
 * This enables the browse-first auth gate pattern:
 *   Guest taps "Buy Tickets" → redirected to Login with returnTo: 'TicketSelection'
 *   After login → automatically lands on TicketSelection with their items intact
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { ChevronLeft, Mail, Lock } from 'lucide-react-native';
import { authService } from '../../services/authService';
import { registerForPushNotifications } from '../../services/notificationService';

const COLORS = {
  accent: '#8B5CF6',
  accentLight: '#F3E8FF',
  surface: '#F9F9F9',
  border: '#E5E5E5',
  white: '#FFF',
  red: '#EF4444',
  textSecondary: '#666',
  text: '#111',
};

export function LoginScreen({ navigation, route }: any) {
  // returnTo: screen name to navigate to after login (e.g. 'TicketSelection')
  // returnParams: params to pass to that screen
  const returnTo: string | undefined = route?.params?.returnTo;
  const returnParams: any = route?.params?.returnParams;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await authService.login({ email, password });

      // Register for push notifications after login (non-blocking)
      registerForPushNotifications().catch(() => {});

      // Navigate to returnTo screen if set, otherwise MainTabs
      if (returnTo) {
        navigation.replace(returnTo, returnParams || {});
      } else {
        navigation.replace('MainTabs');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Login failed';
      setErrors({ form: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          {returnTo && (
            <Text style={styles.headerContext}>Sign in to continue</Text>
          )}
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your Plat account</Text>

            {/* Context banner when redirected from purchase flow */}
            {returnTo === 'TicketSelection' && (
              <View style={styles.contextBanner}>
                <Text style={styles.contextText}>
                  Sign in to complete your ticket purchase
                </Text>
              </View>
            )}

            {/* Form */}
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputRow, errors.email && styles.inputError]}>
                <Mail size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor="#AAA"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (errors.email) setErrors(e => ({ ...e, email: '' }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputRow, errors.password && styles.inputError]}>
                <Lock size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Your password"
                  placeholderTextColor="#AAA"
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (errors.password) setErrors(e => ({ ...e, password: '' }));
                  }}
                  secureTextEntry
                />
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {errors.form ? (
              <View style={styles.formError}>
                <Text style={styles.formErrorText}>{errors.form}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.loginBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.replace('Register', { returnTo, returnParams })
                }
              >
                <Text style={styles.registerLink}>Create one</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerContext: { fontSize: 14, color: COLORS.textSecondary },

  content: { padding: 24, paddingTop: 16, paddingBottom: 48 },

  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 24 },

  contextBanner: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  contextText: { fontSize: 14, color: COLORS.accent, fontWeight: '600', textAlign: 'center' },

  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    height: 50,
  },
  inputError: { borderColor: COLORS.red },
  input: { flex: 1, fontSize: 15, color: COLORS.text },
  errorText: { fontSize: 12, color: COLORS.red, marginTop: 4, marginLeft: 2 },

  forgotLink: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },

  formError: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  formErrorText: { fontSize: 13, color: COLORS.red },

  loginBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { fontSize: 14, color: COLORS.textSecondary },
  registerLink: { fontSize: 14, color: COLORS.accent, fontWeight: '700' },
});
