/**
 * RegisterScreen
 *
 * CHANGES FROM ORIGINAL:
 * Reads returnTo / returnParams from route.params and redirects after
 * successful registration — same pattern as LoginScreen.
 */

import React, { useState, useRef } from 'react';
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
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { ChevronLeft, Mail, Lock, User, Phone } from 'lucide-react-native';
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

export function RegisterScreen({ navigation, route }: any) {
  const returnTo: string | undefined = route?.params?.returnTo;
  const returnParams: any = route?.params?.returnParams;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await authService.register({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });

      registerForPushNotifications().catch(() => {});

      if (returnTo) {
        navigation.replace(returnTo, returnParams || {});
      } else {
        navigation.replace('MainTabs');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Registration failed';
      setErrors({ form: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const field = (
    label: string,
    value: string,
    setter: (v: string) => void,
    key: string,
    icon: React.ReactNode,
    props: any = {}
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, errors[key] && styles.inputError]}>
        {icon}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(v) => {
            setter(v);
            if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
          }}
          placeholderTextColor="#AAA"
          {...props}
        />
      </View>
      {errors[key] ? <Text style={styles.errorText}>{errors[key]}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
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
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Join Plat — discover events across Africa</Text>

            {returnTo === 'TicketSelection' && (
              <View style={styles.contextBanner}>
                <Text style={styles.contextText}>
                  Create an account to complete your purchase
                </Text>
              </View>
            )}

            <View style={styles.nameRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>First name</Text>
                <View style={[styles.inputRow, errors.firstName && styles.inputError]}>
                  <User size={18} color={COLORS.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="First"
                    placeholderTextColor="#AAA"
                    value={firstName}
                    onChangeText={(v) => {
                      setFirstName(v);
                      if (errors.firstName) setErrors(e => ({ ...e, firstName: '' }));
                    }}
                    autoCapitalize="words"
                  />
                </View>
                {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
              </View>

              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Last name</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { paddingLeft: 4 }]}
                    placeholder="Last"
                    placeholderTextColor="#AAA"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            {field('Email', email, setEmail, 'email', <Mail size={18} color={COLORS.textSecondary} />, {
              placeholder: 'your@email.com',
              keyboardType: 'email-address',
              autoCapitalize: 'none',
              autoCorrect: false,
            })}

            {field('Phone (optional)', phone, setPhone, 'phone', <Phone size={18} color={COLORS.textSecondary} />, {
              placeholder: '+254 7XX XXX XXX',
              keyboardType: 'phone-pad',
            })}

            {field('Password', password, setPassword, 'password', <Lock size={18} color={COLORS.textSecondary} />, {
              placeholder: 'At least 8 characters',
              secureTextEntry: true,
            })}

            {errors.form ? (
              <View style={styles.formError}>
                <Text style={styles.formErrorText}>{errors.form}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.registerBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.replace('Login', { returnTo, returnParams })}>
                <Text style={styles.loginLink}>Sign in</Text>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },

  content: { padding: 24, paddingTop: 8, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 24 },

  contextBanner: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  contextText: { fontSize: 14, color: COLORS.accent, fontWeight: '600', textAlign: 'center' },

  nameRow: { flexDirection: 'row', gap: 12 },

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
  errorText: { fontSize: 12, color: COLORS.red, marginTop: 4 },

  formError: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  formErrorText: { fontSize: 13, color: COLORS.red },

  registerBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { fontSize: 14, color: COLORS.textSecondary },
  loginLink: { fontSize: 14, color: COLORS.accent, fontWeight: '700' },
});
