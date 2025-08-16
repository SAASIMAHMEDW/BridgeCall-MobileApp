import { View, Text, StyleSheet, FlatList } from 'react-native';
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot } from '@react-native-firebase/firestore';

const Test = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirestore();
    
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      snapshot => {
        const userList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(userList);
        setLoading(false);
      },
      error => {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const renderUser = ({ item }) => {
    return (
      <View style={styles.card}>
        <Text style={styles.name}>{item.displayName || 'No Name'}</Text>
        <Text style={styles.email}>{item.email || 'No Email'}</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status: </Text>
          <Text style={[styles.status, 
            item.status === 'active' ? styles.activeStatus : styles.inactiveStatus
          ]}>
            {item.status || 'Unknown'}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  if (users.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No users found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Users ({users.length})</Text>
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={renderUser}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default Test;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeft: 4,
    borderLeftColor: '#4A90E2',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  activeStatus: {
    color: '#4CAF50',
  },
  inactiveStatus: {
    color: '#FF5722',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  text: {
    color: 'red',
    fontSize: 30,
    textAlign: 'center',
    marginTop: 50,
  },
});
