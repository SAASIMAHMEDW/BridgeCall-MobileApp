import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { RTCView } from 'react-native-webrtc';
import WebRTCService from '../webrtc/WebRTCService';
import { firestore } from '../db/firestore';
import { useAuth } from '../hooks/auth/useAuth';

const CallScreen = ({ route, navigation }) => {
  const { callId } = route.params;
  const { user } = useAuth();
  const [callData, setCallData] = useState(null);
  const [webrtc] = useState(() => new WebRTCService());
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [answerProcessed, setAnswerProcessed] = useState(false);
  const cleanupRef = useRef(false);

  // Listen for call doc changes
  useEffect(() => {
    if (!callId) return;
    console.log('Setting up call listener for:', callId);

    const unsubscribe = firestore.listenToCall(callId, data => {
      if (cleanupRef.current) return;
      console.log('Call data updated:', data);
      setCallData(data);
      if (data?.status === 'ended') {
        endCall();
      }
    });
    return unsubscribe;
  }, [callId]);

  useEffect(() => {
    // Stop listening to incoming calls when in call screen
    return firestore.clearIncomingCallListener?.(user?.uid);
  }, [user]);

  // WebRTC setup and signaling
  useEffect(() => {
    if (!callData || !user || cleanupRef.current) {
      console.log('Waiting for callData and user...', {
        callData: !!callData,
        user: !!user,
        cleanup: cleanupRef.current,
      });
      return;
    }
    if (error || isInitialized) {
      return;
    }

    console.log('Starting WebRTC setup...');
    console.log(
      'User role:',
      user.uid === callData.callerId ? 'CALLER' : 'CALLEE',
    );

    const startWebRTC = async () => {
      try {
        setConnectionStatus('Requesting camera/microphone access...');
        console.log('Initializing WebRTC...');

        // Set up stream callbacks
        webrtc.onLocalStream = stream => {
          if (cleanupRef.current) return;
          console.log('Local stream received, setting state');
          setLocalStream(stream);
        };

        webrtc.onRemoteStream = stream => {
          if (cleanupRef.current) return;
          console.log('Remote stream received, setting state');
          console.log('Remote stream received, setting state');
          console.log('Remote stream URL:', stream.toURL());
          console.log('Remote stream active:', stream.active);
          console.log(
            'Remote stream tracks:',
            stream.getTracks().map(t => `${t.kind}: ${t.enabled}`),
          );
          setRemoteStream(stream);
          setIsConnected(true);
          setConnectionStatus('Connected');
        };

        // FIXED: Set up ICE candidate handler BEFORE init
        webrtc.onIceCandidate = async candidateObject => {
          if (cleanupRef.current) return;
          console.log('ICE candidate generated:', candidateObject);

          // FIXED: Clean the candidate object to remove undefined values
          const cleanCandidate = {
            candidate: candidateObject.candidate,
            sdpMLineIndex: candidateObject.sdpMLineIndex,
            sdpMid: candidateObject.sdpMid,
            // Only include usernameFragment if it's not undefined
            ...(candidateObject.usernameFragment && {
              usernameFragment: candidateObject.usernameFragment,
            }),
          };

          const field =
            user.uid === callData.callerId
              ? 'offerCandidates'
              : 'answerCandidates';

          try {
            // Get current data to avoid overwriting
            const currentCallData = await new Promise(resolve => {
              const unsubscribe = firestore.listenToCall(callId, data => {
                unsubscribe();
                resolve(data);
              });
            });

            const currentCandidates = currentCallData[field] || [];
            const updatedCandidates = [...currentCandidates, cleanCandidate];

            console.log(
              `Updating ${field} with ${updatedCandidates.length} candidates`,
            );

            await firestore.updateCall(callId, {
              [field]: updatedCandidates,
            });

            console.log('ICE candidate saved to Firestore');
          } catch (error) {
            console.error('Failed to save ICE candidate:', error);
          }
        };

        // Initialize WebRTC
        await webrtc.init({
          iceServers: [
            {
              urls: 'stun:stun.relay.metered.ca:80',
            },
            {
              urls: 'turn:global.relay.metered.ca:80',
              username: '54646a3f25b33106d83ca2fb',
              credential: 'SZTXly1SIJT7t9W9',
            },
            {
              urls: 'turn:global.relay.metered.ca:80?transport=tcp',
              username: '54646a3f25b33106d83ca2fb',
              credential: 'SZTXly1SIJT7t9W9',
            },
            {
              urls: 'turn:global.relay.metered.ca:443',
              username: '54646a3f25b33106d83ca2fb',
              credential: 'SZTXly1SIJT7t9W9',
            },
            {
              urls: 'turns:global.relay.metered.ca:443?transport=tcp',
              username: '54646a3f25b33106d83ca2fb',
              credential: 'SZTXly1SIJT7t9W9',
            },
          ],
          iceCandidatePoolSize: 10,
          bundlePolicy: 'max-bundle',
          rtcpMuxPolicy: 'require',
          iceTransportPolicy: 'all',
        });

        if (cleanupRef.current) return;

        setIsInitialized(true);
        console.log('WebRTC initialized successfully');
        setConnectionStatus('Setting up connection...');

        // CALLER FLOW
        if (user.uid === callData.callerId) {
          console.log('CALLER: Starting caller flow...');
          setConnectionStatus('Creating offer...');

          if (!callData.offer) {
            console.log('CALLER: Creating offer...');
            const offer = await webrtc.createOffer();
            console.log('CALLER: Offer created:', offer);

            if (!cleanupRef.current) {
              await firestore.updateCall(callId, { offer });
              console.log('CALLER: Offer saved to Firestore');
              setConnectionStatus('Waiting for answer...');
            }
          }

          if (callData.answer && !answerProcessed) {
            console.log('CALLER: Answer received, processing...');
            setAnswerProcessed(true);
            setConnectionStatus('Processing answer...');
            await webrtc.setRemoteDescription(callData.answer);

            // Add existing answer candidates
            const answerCandidates = callData.answerCandidates || [];
            console.log(
              'Adding existing answer candidates:',
              answerCandidates.length,
            );
            for (const candidate of answerCandidates) {
              await webrtc.addIceCandidate(candidate);
            }
          }
        }
        // CALLEE FLOW
        else if (user.uid === callData.calleeId) {
          console.log('CALLEE: Starting callee flow...');

          if (callData.offer && !callData.answer) {
            console.log('CALLEE: Offer received, processing...');
            setConnectionStatus('Processing offer...');

            await webrtc.setRemoteDescription(callData.offer);
            console.log('CALLEE: Remote description set');

            // Add existing offer candidates
            const offerCandidates = callData.offerCandidates || [];
            console.log(
              'Adding existing offer candidates:',
              offerCandidates.length,
            );
            for (const candidate of offerCandidates) {
              await webrtc.addIceCandidate(candidate);
            }

            setConnectionStatus('Creating answer...');
            const answer = await webrtc.createAnswer();
            console.log('CALLEE: Answer created:', answer);

            if (!cleanupRef.current) {
              await firestore.updateCall(callId, {
                answer,
                status: 'connected',
              });
            }
          }
        }
      } catch (err) {
        if (cleanupRef.current) return;
        console.error('WebRTC Error:', err);
        setError(err.message);
        setConnectionStatus('Connection failed');
      }
    };

    startWebRTC();
  }, [callData, user, callId, error, isInitialized]);

  // Handle new ICE candidates from Firestore
  useEffect(() => {
    if (
      !callData ||
      !isInitialized ||
      !webrtc.peerConnection ||
      cleanupRef.current
    )
      return;

    const addNewCandidates = async () => {
      if (user.uid === callData.callerId) {
        // Caller processes answer candidates
        const answerCandidates = callData.answerCandidates || [];
        for (const candidate of answerCandidates) {
          try {
            await webrtc.addIceCandidate(candidate);
          } catch (error) {
            console.warn('Error adding answer candidate:', error);
          }
        }
      } else if (user.uid === callData.calleeId) {
        // Callee processes offer candidates
        const offerCandidates = callData.offerCandidates || [];
        for (const candidate of offerCandidates) {
          try {
            await webrtc.addIceCandidate(candidate);
          } catch (error) {
            console.warn('Error adding offer candidate:', error);
          }
        }
      }
    };

    addNewCandidates();
  }, [callData?.offerCandidates, callData?.answerCandidates, isInitialized]);

  // Handle dynamic answer updates for caller
  useEffect(() => {
    if (
      !callData ||
      !isInitialized ||
      !webrtc.peerConnection ||
      cleanupRef.current
    )
      return;

    if (user.uid === callData.callerId && callData.answer && !answerProcessed) {
      console.log('CALLER: New answer detected, processing...');
      setAnswerProcessed(true);
      (async () => {
        try {
          if (cleanupRef.current) return;
          setConnectionStatus('Processing answer...');

          if (webrtc.peerConnection.signalingState === 'have-local-offer') {
            await webrtc.setRemoteDescription(callData.answer);

            const answerCandidates = callData.answerCandidates || [];
            for (const candidate of answerCandidates) {
              await webrtc.addIceCandidate(candidate);
            }
          }
        } catch (err) {
          if (!cleanupRef.current) {
            console.error('Error processing answer:', err);
          }
        }
      })();
    }
  }, [callData?.answer, isInitialized, answerProcessed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up WebRTC...');
      cleanupRef.current = true;
      webrtc.close();
    };
  }, []);

  // End call function
  const endCall = async () => {
    try {
      console.log('Ending call...');
      cleanupRef.current = true;
      await webrtc.close();

      if (callData && callData.status !== 'ended') {
        await firestore.updateCall(callId, { status: 'ended' });
      }
      await firestore.updateUser(user.uid, { status: 'online' });

      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }
    } catch (error) {
      console.error('Error ending call:', error);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  };

  if (!callData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="rgba(44, 169, 188, 1)" />
          <Text style={styles.loadingText}>Loading call...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={endCall}>
            <Text style={styles.errorButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {user.uid === callData.callerId
              ? `Calling ${callData.calleeName}`
              : `Call from ${callData.callerName}`}
          </Text>
          <Text style={styles.headerStatus}>{connectionStatus}</Text>
        </View>
        <TouchableOpacity style={styles.endButton} onPress={endCall}>
          <Text style={styles.endButtonText}>End Call</Text>
        </TouchableOpacity>
      </View>

      {/* Video Container */}
      <View style={styles.videoContainer}>
        {/* Remote Video (Full Screen) */}
        {remoteStream ? (
          <RTCView
            style={styles.remoteVideo}
            streamURL={remoteStream.toURL()}
            objectFit="cover"
            zOrder={0}
            key={`remote-${remoteStream.id}`}
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.placeholderText}>
              Waiting for remote video...
            </Text>
          </View>
        )}

        {/* Local Video (Picture-in-Picture) */}
        {localStream ? (
          <RTCView
            style={styles.localVideo}
            streamURL={localStream.toURL()}
            objectFit="cover"
            mirror={true}
            zOrder={1}
          />
        ) : (
          <View style={[styles.localVideo, styles.videoPlaceholder]}>
            <Text style={styles.placeholderTextSmall}>Local</Text>
          </View>
        )}

        {/* Connection Status Overlay */}
        {!isConnected && !error && (
          <View style={styles.statusOverlay}>
            <View style={styles.statusContainer}>
              <ActivityIndicator size="large" color="rgba(44, 169, 188, 1)" />
              <Text style={styles.statusText}>{connectionStatus}</Text>
            </View>
          </View>
        )}

        {/* Debug Info */}
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Local: {localStream ? '✅' : '❌'} | Remote:{' '}
            {remoteStream ? '✅' : '❌'} | Connected:{' '}
            {isConnected ? '✅' : '❌'}
          </Text>
          <Text style={styles.debugText}>
            Offer Candidates: {callData?.offerCandidates?.length || 0} | Answer
            Candidates: {callData?.answerCandidates?.length || 0}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorMessage: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  errorButton: {
    backgroundColor: 'rgba(44, 169, 188, 1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerStatus: {
    color: 'rgba(44, 169, 188, 1)',
    fontSize: 14,
    marginTop: 4,
  },
  endButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  endButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  localVideo: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(44, 169, 188, 1)',
    backgroundColor: '#1F2937',
  },
  videoPlaceholder: {
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 18,
  },
  placeholderTextSmall: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  statusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
  debugInfo: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
  },
  debugText: {
    color: '#fff',
    fontSize: 10,
  },
});

export default CallScreen;
