import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';

const IncomingCall = ({ visible, callInfo, onAccept, onReject }) => {
  const [timeRemaining, setTimeRemaining] = useState(30);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    if (!visible) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          onReject();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, onReject]);

  useEffect(() => {
    if (visible) {
      setTimeRemaining(30);
      // Start pulse animation
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => pulse());
      };
      pulse();
    }
  }, [visible]);

  if (!visible || !callInfo) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.callerInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <Text style={styles.title}>Incoming Call</Text>
            <Text style={styles.callerName}>
              {callInfo.callerName || 'Unknown Caller'}
            </Text>
            <Text style={styles.timeRemaining}>
              {timeRemaining}s remaining
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={onReject}
            >
              <Text style={styles.rejectIcon}>✕</Text>
              <Text style={styles.buttonText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={onAccept}
            >
              <Text style={styles.acceptIcon}>✓</Text>
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 32,
    maxWidth: 300,
    width: '90%',
    alignItems: 'center',
  },
  callerInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(44, 169, 188, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  callerName: {
    color: 'rgba(44, 169, 188, 1)',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  timeRemaining: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  rejectIcon: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 4,
  },
  acceptIcon: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default IncomingCall;
