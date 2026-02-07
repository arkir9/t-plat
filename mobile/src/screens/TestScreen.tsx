import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const TestScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>App is working!</Text>
      <Text style={styles.subtext}>If you see this, navigation is working</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtext: {
    color: '#999',
    fontSize: 16,
  },
});