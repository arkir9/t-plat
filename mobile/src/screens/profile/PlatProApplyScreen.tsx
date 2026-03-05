import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ChevronLeft,
  Briefcase,
  Mail,
  Phone,
  ShieldCheck,
  Clock,
  CheckCircle,
} from 'lucide-react-native';
import { organizersService } from '../../services/organizersService';
import { theme } from '../../design/theme';

const { colors } = theme;

const C = {
  bg: '#FFFFFF',
  surface: '#F8F9FA',
  accent: colors.primary[500],
  accentLight: colors.primary[50],
  text: '#1A1A1A',
  textSec: '#666666',
  border: '#E5E5E5',
  green: colors.success,
  white: '#FFFFFF',
};

type Step = 'form' | 'otp' | 'pending';

export function PlatProApplyScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('form');

  // Form fields
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // OTP fields
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  // ─── Step 1: Submit application ────────────────────────────────────

  const handleSubmitApplication = async () => {
    if (!businessName.trim()) {
      Alert.alert('Required', 'Please enter your business name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Required', 'Please enter a valid business email.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Required', 'Please enter a valid phone number.');
      return;
    }

    setSubmitting(true);
    try {
      await organizersService.apply({
        businessName: businessName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      setStep('otp');
    } catch (error: any) {
      const msg =
        error.response?.data?.message || error.message || 'Failed to submit application.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Step 2: Verify OTP ────────────────────────────────────────────

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste: spread across boxes
      const chars = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      chars.forEach((ch, i) => {
        if (index + i < 6) newOtp[index + i] = ch;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + chars.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the full 6-digit code.');
      return;
    }

    setVerifying(true);
    try {
      await organizersService.verifyEmail(code);
      setStep('pending');
    } catch (error: any) {
      const msg =
        error.response?.data?.message || error.message || 'Invalid code. Please try again.';
      Alert.alert('Verification Failed', msg);
    } finally {
      setVerifying(false);
    }
  };

  // ─── Renders ───────────────────────────────────────────────────────

  const renderFormStep = () => (
    <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
      {/* Hero */}
      <View style={s.hero}>
        <View style={s.heroIconRow}>
          <View style={s.heroIcon}>
            <Briefcase size={22} color={C.white} />
          </View>
          <View style={s.heroBadge}>
            <Text style={s.heroBadgeText}>PRO</Text>
          </View>
        </View>
        <Text style={s.heroTitle}>Become a Plat Pro organizer</Text>
        <Text style={s.heroSub}>
          Verify your business email to start hosting events, managing venues, and tracking sales on T-Plat.
        </Text>
      </View>

      {/* Steps indicator */}
      <View style={s.stepsRow}>
        <StepDot active label="1" caption="Details" />
        <View style={s.stepLine} />
        <StepDot active={false} label="2" caption="Verify" />
        <View style={s.stepLine} />
        <StepDot active={false} label="3" caption="Review" />
      </View>

      {/* Form */}
      <View style={s.formSection}>
        <Text style={s.fieldLabel}>Business Name</Text>
        <View style={s.inputRow}>
          <Briefcase size={18} color={C.textSec} />
          <TextInput
            style={s.inputField}
            placeholder="e.g. Nairobi Nights Entertainment"
            placeholderTextColor="#BBB"
            value={businessName}
            onChangeText={setBusinessName}
          />
        </View>

        <Text style={s.fieldLabel}>Official Email</Text>
        <View style={s.inputRow}>
          <Mail size={18} color={C.textSec} />
          <TextInput
            style={s.inputField}
            placeholder="hello@yourbusiness.co.ke"
            placeholderTextColor="#BBB"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Text style={s.fieldLabel}>Phone Number</Text>
        <View style={s.inputRow}>
          <Phone size={18} color={C.textSec} />
          <TextInput
            style={s.inputField}
            placeholder="+254 7XX XXX XXX"
            placeholderTextColor="#BBB"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[s.primaryBtn, submitting && { opacity: 0.6 }]}
        onPress={handleSubmitApplication}
        disabled={submitting}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator color={C.white} />
        ) : (
          <Text style={s.primaryBtnText}>Continue</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderOtpStep = () => (
    <View style={s.centeredContent}>
      {/* Steps indicator */}
      <View style={s.stepsRow}>
        <StepDot active label="✓" caption="Details" done />
        <View style={[s.stepLine, s.stepLineDone]} />
        <StepDot active label="2" caption="Verify" />
        <View style={s.stepLine} />
        <StepDot active={false} label="3" caption="Review" />
      </View>

      <View style={s.otpIconWrap}>
        <Mail size={32} color={C.accent} />
      </View>
      <Text style={s.otpTitle}>Verify your email</Text>
      <Text style={s.otpSub}>
        We sent a 6-digit code to{'\n'}
        <Text style={{ fontWeight: '700', color: C.text }}>{email}</Text>
      </Text>

      <View style={s.otpRow}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={(ref) => { otpRefs.current[i] = ref; }}
            style={[s.otpBox, digit ? s.otpBoxFilled : null]}
            maxLength={i === 0 ? 6 : 1}
            keyboardType="number-pad"
            value={digit}
            onChangeText={(val) => handleOtpChange(val, i)}
            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
            selectTextOnFocus
          />
        ))}
      </View>

      <TouchableOpacity
        style={[s.primaryBtn, { marginTop: 28 }, verifying && { opacity: 0.6 }]}
        onPress={handleVerifyOtp}
        disabled={verifying}
        activeOpacity={0.85}
      >
        {verifying ? (
          <ActivityIndicator color={C.white} />
        ) : (
          <Text style={s.primaryBtnText}>Verify Code</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={s.resendBtn} onPress={handleSubmitApplication}>
        <Text style={s.resendText}>Didn't get it? Resend code</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPendingStep = () => (
    <View style={s.centeredContent}>
      {/* Steps indicator */}
      <View style={s.stepsRow}>
        <StepDot active label="✓" caption="Details" done />
        <View style={[s.stepLine, s.stepLineDone]} />
        <StepDot active label="✓" caption="Verify" done />
        <View style={[s.stepLine, s.stepLineDone]} />
        <StepDot active label="3" caption="Review" />
      </View>

      <View style={s.pendingIcon}>
        <Clock size={36} color={C.accent} />
      </View>
      <Text style={s.pendingTitle}>Under Review</Text>
      <Text style={s.pendingSub}>
        Our curation team is verifying your business domain. You'll be notified once approved — this usually takes 24-48 hours.
      </Text>

      <View style={s.pendingCard}>
        <View style={s.pendingRow}>
          <Text style={s.pendingLabel}>Business</Text>
          <Text style={s.pendingValue}>{businessName}</Text>
        </View>
        <View style={s.pendingRow}>
          <Text style={s.pendingLabel}>Email</Text>
          <Text style={s.pendingValue}>{email}</Text>
        </View>
        <View style={s.pendingRow}>
          <Text style={s.pendingLabel}>Status</Text>
          <View style={s.statusBadge}>
            <Text style={s.statusBadgeText}>Pending Review</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={s.primaryBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
      >
        <Text style={s.primaryBtnText}>Back to Profile</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronLeft color={C.text} size={24} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>
            {step === 'form' ? 'Apply for Plat Pro' : step === 'otp' ? 'Email Verification' : 'Application Submitted'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {step === 'form' && renderFormStep()}
        {step === 'otp' && renderOtpStep()}
        {step === 'pending' && renderPendingStep()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Step Dot Component ───────────────────────────────────────────────

function StepDot({ active, label, caption, done }: { active: boolean; label: string; caption: string; done?: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={[
          s.stepDot,
          active && s.stepDotActive,
          done && s.stepDotDone,
        ]}
      >
        {done ? (
          <CheckCircle size={14} color={C.white} />
        ) : (
          <Text style={[s.stepDotText, active && s.stepDotTextActive]}>{label}</Text>
        )}
      </View>
      <Text style={[s.stepCaption, active && { color: C.text }]}>{caption}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },

  scrollContent: { padding: 20, paddingBottom: 40 },
  centeredContent: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },

  // Hero
  hero: { backgroundColor: '#050816', borderRadius: 16, padding: 22, marginBottom: 24 },
  heroIconRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  heroIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  heroBadge: { backgroundColor: C.accent, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  heroBadgeText: { color: C.white, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  heroTitle: { color: C.white, fontSize: 20, fontWeight: '700', marginBottom: 6 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20 },

  // Steps
  stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28, gap: 6 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#EDEDF0', alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: C.accent },
  stepDotDone: { backgroundColor: C.green },
  stepDotText: { fontSize: 12, fontWeight: '700', color: '#999' },
  stepDotTextActive: { color: C.white },
  stepCaption: { fontSize: 11, color: '#AAA', marginTop: 4 },
  stepLine: { width: 32, height: 2, backgroundColor: '#EDEDF0', borderRadius: 1 },
  stepLineDone: { backgroundColor: C.green },

  // Form
  formSection: { marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6, marginTop: 14 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, height: 52, backgroundColor: C.surface,
  },
  inputField: { flex: 1, fontSize: 15, color: C.text },

  // Buttons
  primaryBtn: {
    backgroundColor: C.accent, paddingVertical: 16, borderRadius: 30,
    alignItems: 'center', width: '100%', marginTop: 12,
  },
  primaryBtnText: { color: C.white, fontWeight: '700', fontSize: 16 },

  // OTP
  otpIconWrap: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: C.accentLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  otpTitle: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 8 },
  otpSub: { fontSize: 14, color: C.textSec, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  otpRow: { flexDirection: 'row', gap: 10 },
  otpBox: {
    width: 46, height: 54, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border,
    textAlign: 'center', fontSize: 22, fontWeight: '700', color: C.text,
    backgroundColor: C.surface,
  },
  otpBoxFilled: { borderColor: C.accent, backgroundColor: C.accentLight },
  resendBtn: { marginTop: 20, padding: 8 },
  resendText: { fontSize: 14, color: C.accent, fontWeight: '600' },

  // Pending
  pendingIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: C.accentLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  pendingTitle: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 8 },
  pendingSub: { fontSize: 14, color: C.textSec, textAlign: 'center', lineHeight: 21, paddingHorizontal: 8, marginBottom: 24 },
  pendingCard: {
    width: '100%', backgroundColor: C.surface, borderRadius: 14,
    padding: 16, marginBottom: 24, borderWidth: 1, borderColor: C.border,
  },
  pendingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  pendingLabel: { fontSize: 13, color: C.textSec },
  pendingValue: { fontSize: 14, fontWeight: '600', color: C.text },
  statusBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  statusBadgeText: { fontSize: 12, fontWeight: '700', color: '#D97706' },
});
