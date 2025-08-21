import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/auth/useAuth';
import { firestore } from '../db/firestore';
import User from '../components/User';
import UserFilter from '../components/UserFilter';
import IncomingCall from '../components/IncomingCall';
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [statusFilter, setStatusFilter] = useState('online');
  const [searchTerm, setSearchTerm] = useState('');
  const [incomingCall, setIncomingCall] = useState(null);
  const [incomingModal, setIncomingModal] = useState(false);

  // Listen for incoming calls
  useEffect(() => {
    if (!user) return;
    const unsubscribe = firestore.listenIncomingCalls(user.uid, calls => {
      if (calls.length > 0) {
        setIncomingCall(calls[0]);
        setIncomingModal(true);
      } else {
        setIncomingCall(null);
        setIncomingModal(false);
      }
    });
    return unsubscribe;
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      // Restart incoming call listener when screen comes into focus
      const unsubscribe = firestore.listenIncomingCalls(user.uid, calls => {
        if (calls.length > 0) {
          setIncomingCall(calls[0]);
          setIncomingModal(true);
        } else {
          setIncomingCall(null);
          setIncomingModal(false);
        }
      });

      return unsubscribe;
    }, [user]),
  );

  const handleAcceptCall = async () => {
    setIncomingModal(false);
    navigation.navigate('Call', { callId: incomingCall.id });
  };

  const handleRejectCall = async () => {
    setIncomingModal(false);
    await firestore.updateCall(incomingCall.id, { status: 'ended' });
  };

  const handleLogout = async () => {
    try {
      await firestore.updateUser(user.uid, { status: 'offline' });
      await logout();
      // navigation.replace('Login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Background Circles */}
      <View style={styles.backgroundCircle1} />
      <View style={styles.backgroundCircle2} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>
            Bridge<Text style={styles.logoAccent}>Connect</Text>
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.welcomeText}>
            Welcome, {user?.displayName || 'User'}
          </Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{flex: 1}}>
      <View style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>
            Welcome, {user?.displayName || 'User'}!
          </Text>
          <Text style={styles.subtitle}>
            Connect with users around the world
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search users by name..."
              placeholderTextColor="#9CA3AF"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
        </View>

        {/* Filter Component */}
        <UserFilter
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        {/* Users List - Remove from ScrollView */}
        <User
          statusFilter={statusFilter}
          searchTerm={searchTerm}
          navigation={navigation}
        />
      </View>
      </ScrollView>

      {/* Incoming Call Modal */}
      <IncomingCall
        visible={incomingModal}
        callInfo={incomingCall}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundCircle1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    top: -160,
    right: -160,
    opacity: 0.8,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    bottom: -160,
    left: -160,
    opacity: 0.8,
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {},
  logo: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoAccent: {
    color: 'rgba(44, 169, 188, 1)',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  welcomeText: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: 'rgba(44, 169, 188, 1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchInputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
});

export default HomeScreen;
