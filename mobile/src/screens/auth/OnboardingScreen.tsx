import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = { primary: '#000', accent: '#8B5CF6', white: '#FFF' };

const SLIDES = [
  { id: '1', title: 'Discover Events', sub: 'Find and book tickets to the best events in Nairobi.', image: '' },
  { id: '2', title: 'Secure Tickets', sub: 'Fast, secure payments with M-Pesa and Card.', image: '' },
  { id: '3', title: 'Stay Updated', sub: 'Get notified about nearby events and price drops.', image: '' },
];

export function OnboardingScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 80, marginBottom: 20 }}>{SLIDES[0].image}</Text>
        <Text style={styles.onboardTitle}>{SLIDES[0].title}</Text>
        <Text style={styles.onboardSub}>{SLIDES[0].sub}</Text>
      </View>
      
      <View style={{ padding: 32 }}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Auth')}>
          <Text style={styles.btnText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 16, alignItems: 'center' }} onPress={() => navigation.navigate('Auth')}>
          <Text style={{ color: '#666' }}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  onboardTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 12, color: COLORS.primary },
  onboardSub: { fontSize: 18, color: '#666', lineHeight: 26 },
  primaryBtn: { backgroundColor: COLORS.primary, height: 56, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});