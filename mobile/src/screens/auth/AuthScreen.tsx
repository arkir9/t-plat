import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, User } from 'lucide-react-native';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { signInWithGoogle, signInWithApple } from '../../utils/socialAuth';

const COLORS = { primary: '#000', accent: '#8B5CF6', white: '#FFF' };

export function AuthScreen({ navigation }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; fullName?: string } = {};

    if (!isLogin && !fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSocialLogin = async (provider: 'Google' | 'Apple') => {
    try {
      if (provider === 'Google') {
        setSocialLoading('google');
        const result = await signInWithGoogle();
        if (result.success) {
          navigation.replace('MainTabs');
        } else if (result.error !== 'Canceled') {
          Alert.alert('Google Sign-In', result.error);
        }
      } else {
        if (Platform.OS !== 'ios') {
          Alert.alert('Apple Sign-In', 'Apple Sign-In is only available on iOS devices.');
          return;
        }
        setSocialLoading('apple');
        const result = await signInWithApple();
        if (result.success) {
          navigation.replace('MainTabs');
        } else if (result.error !== 'Canceled') {
          Alert.alert('Apple Sign-In', result.error);
        }
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isLogin) {
        // Login
        await authService.login({ email, password });
        navigation.replace('MainTabs');
      } else {
        // Register
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        await authService.register({
          email,
          password,
          firstName,
          lastName,
          phone: phone || undefined,
        });
        navigation.replace('MainTabs');
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        (isLogin ? 'Login failed. Please try again.' : 'Registration failed. Please try again.');
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{ padding: 24, flex: 1, justifyContent: 'center' }}>
          
          <Text style={styles.authLogo}>plat</Text>
          <Text style={styles.authTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <User size={20} color="#999" style={{ marginRight: 12 }} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                }}
              />
            </View>
          )}
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
          
          <View style={[styles.inputContainer, errors.email && styles.inputError]}>
            <Mail size={20} color="#999" style={{ marginRight: 12 }} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          
          <View style={[styles.inputContainer, errors.password && styles.inputError]}>
            <Lock size={20} color="#999" style={{ marginRight: 12 }} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
            />
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          {isLogin && (
            <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 24 }}>
              <Text style={{ color: COLORS.accent }}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
            )}
          </TouchableOpacity>

          <View style={{ marginTop: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#EEE' }} />
              <Text style={{ marginHorizontal: 16, color: '#999' }}>OR</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#EEE' }} />
            </View>

            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => handleSocialLogin('Google')}
              disabled={!!socialLoading}
            >
              {socialLoading === 'google' ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={{ fontWeight: '600' }}>Continue with Google</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: '#000', marginTop: 12 }]}
              onPress={() => handleSocialLogin('Apple')}
              disabled={!!socialLoading}
            >
              {socialLoading === 'apple' ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={{ fontWeight: '600', color: '#FFF' }}>Continue with Apple</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.authFooter}>
          <Text style={{ color: '#666' }}>{isLogin ? "Don't have an account?" : "Already have an account?"}</Text>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={{ fontWeight: 'bold', marginLeft: 6 }}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  authLogo: { fontSize: 32, fontWeight: '800', fontStyle: 'italic', marginBottom: 40, textAlign: 'center' },
  authTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
  },
  input: { flex: 1, fontSize: 16, height: '100%' },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: -12, marginBottom: 8, marginLeft: 4 },
  primaryBtn: { backgroundColor: COLORS.primary, height: 56, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  primaryBtnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  socialBtn: { height: 50, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5', justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  authFooter: { padding: 24, borderTopWidth: 1, borderTopColor: '#F5F5F5', flexDirection: 'row', justifyContent: 'center' },
});