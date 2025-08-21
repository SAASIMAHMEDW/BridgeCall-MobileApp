import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { firestore } from '../db/firestore';
import { useAuth } from '../hooks/auth/useAuth';
import { useFocusEffect } from '@react-navigation/native';

const User = ({ statusFilter, searchTerm, navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [callingUser, setCallingUser] = useState(null);
  const { user: currentUser } = useAuth();

  useFocusEffect(
    React.useCallback(() => {
      setCallingUser(null);
    }, []),
  );

  // Subscribe to users collection
  useEffect(() => {
    const unsubscribe = firestore.subscribeToUsers(usersData => {
      const otherUsers = usersData.filter(u => u.id !== currentUser?.uid);
      setUsers(otherUsers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Filter users based on status and search term
  useEffect(() => {
    let filtered = [...users];

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        user =>
          user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredUsers(filtered);
    // console.log(filtered);
  }, [users, statusFilter, searchTerm]);

  // Handle call button click
  const handleCallClick = async targetUser => {
    if (!currentUser || targetUser.status !== 'online') return;

    try {
      setCallingUser(targetUser.id);
      const callId = `${currentUser.uid}_${targetUser.id}_${Date.now()}`;

      // Update caller status to 'callinitiated'
      await firestore.updateUser(currentUser.uid, { status: 'callinitiated' });

      // Create call document
      await firestore.createCall(callId, {
        callerId: currentUser.uid,
        calleeId: targetUser.id,
        callerName: currentUser.displayName || currentUser.email,
        calleeName:
          targetUser.displayName || targetUser.name || targetUser.email,
        status: 'initiated',
      });

      console.log(`Call initiated: ${callId}`);
      navigation.navigate('Call', { callId });
    } catch (error) {
      console.error('Error initiating call:', error);
      setCallingUser(null);
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'online':
        return '#10B981'; // green-500
      case 'offline':
        return '#6B7280'; // gray-500
      case 'incall':
        return '#F59E0B'; // yellow-400
      case 'callinitiated':
        return '#3B82F6'; // blue-400
      default:
        return '#9CA3AF'; // gray-400
    }
  };

  const getStatusTextColor = status => {
    switch (status) {
      case 'online':
        return '#000';
      case 'offline':
        return '#fff';
      case 'incall':
        return '#000';
      case 'callinitiated':
        return '#000';
      default:
        return '#fff';
    }
  };

  const formatLastSeen = lastSeen => {
    if (!lastSeen) return 'Never';

    try {
      // Convert Firestore timestamp to JavaScript Date
      const date = new Date(lastSeen.seconds * 1000);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));

      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;

      // For older dates, show actual date
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status || 'offline') },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusTextColor(item.status || 'offline') },
              ]}
            >
              {(item.status || 'offline').toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.userName}>
          {item.displayName || item.name || 'Unnamed User'}
        </Text>

        <Text style={styles.userEmail}>
          {item.email || 'No email provided'}
        </Text>

        <Text style={styles.lastSeenText}>
          Last seen:{' '}
          {item.status === 'online' ? 'Online' : formatLastSeen(item.lastSeen)}
        </Text>
      </View>

      <TouchableOpacity
        disabled={item.status !== 'online' || callingUser === item.id}
        onPress={() => handleCallClick(item)}
        style={[
          styles.callButton,
          item.status === 'online' && callingUser !== item.id
            ? styles.callButtonActive
            : styles.callButtonDisabled,
        ]}
      >
        {callingUser === item.id ? (
          <ActivityIndicator color="#000" size="small" />
        ) : (
          <Text style={styles.callIcon}>📞</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="rgba(44, 169, 188, 1)" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySubtitle}>
              {searchTerm
                ? 'Try adjusting your search term'
                : 'No users match the selected filter'}
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  listContent: {
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  callButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButtonActive: {
    backgroundColor: 'rgba(44, 169, 188, 1)',
  },
  callButtonDisabled: {
    backgroundColor: '#6B7280',
    opacity: 0.5,
  },
  callIcon: {
    fontSize: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  lastSeenText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
});

export default User;
