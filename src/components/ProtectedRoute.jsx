import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/auth/useAuth';

export default function ProtectedRoute({ children, navigation }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCard}>
          <ActivityIndicator 
            size="large" 
            color="rgba(44, 169, 188, 1)" 
            style={styles.spinner}
          />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // If user is not authenticated, navigate to Login
  if (!user) {
    navigation.replace('Login');
    return null;
  }

  return children;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
});
