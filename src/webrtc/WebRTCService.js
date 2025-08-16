import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
} from 'react-native-webrtc';

export default class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.onIceCandidate = null;
    this.pendingCandidates = [];
    this.onLocalStream = null;
    this.onRemoteStream = null;
  }

  isMobile() {
    return true;
  }

  async handleMobilePermissions() {
    try {
      console.log('📱 Requesting camera and microphone permissions...');

      const stream = await mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Permission error:', error);

      if (error.name === 'NotAllowedError') {
        throw new Error(
          'Camera and microphone access denied. Please enable permissions in Settings.',
        );
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera or microphone found on this device.');
      } else if (error.name === 'NotReadableError') {
        throw new Error(
          'Camera or microphone is already in use by another application.',
        );
      } else {
        throw new Error(`Error accessing camera/microphone: ${error.message}`);
      }
    }
  }

  async init(config = {}) {
    await this.handleMobilePermissions();

    console.log('🚀 Initializing React Native WebRTC...');

    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      ...config,
    });

    try {
      // Get local stream
      this.localStream = await mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      console.log(
        '📹 Local stream obtained:',
        this.localStream.getTracks().map(t => `${t.kind}: ${t.id}`),
      );

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        console.log(
          '➕ Adding local track to peer connection:',
          track.kind,
          track.id,
        );
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Notify about local stream
      if (this.onLocalStream) {
        this.onLocalStream(this.localStream);
      }

      console.log('🆕 Setting up remote stream handling...');

      // **FIXED: Better remote stream handling**
      this.peerConnection.addEventListener('track', event => {
        console.log('🎬 Track event received!');
        console.log('   Track kind:', event.track.kind);
        console.log('   Track ID:', event.track.id);
        console.log('   Track state:', event.track.readyState);
        console.log('   Streams count:', event.streams.length);

        if (event.streams.length > 0) {
          const stream = event.streams[0];
          console.log('   Stream ID:', stream.id);
          console.log(
            '   Stream tracks:',
            stream.getTracks().map(t => `${t.kind}: ${t.id}`),
          );

          // **FIXED: Set remote stream directly**
          this.remoteStream = stream;

          // Notify about remote stream immediately
          if (this.onRemoteStream) {
            console.log('📺 Notifying about remote stream');
            this.onRemoteStream(stream);
          }
        }
      });

      // **FIXED: Safe event listeners to prevent null reference errors**
      this.peerConnection.addEventListener('connectionstatechange', () => {
        if (this.peerConnection) {
          console.log(
            '🔗 Connection state:',
            this.peerConnection.connectionState,
          );
        }
      });

      this.peerConnection.addEventListener('iceconnectionstatechange', () => {
        if (this.peerConnection) {
          const state = this.peerConnection.iceConnectionState;
          console.log('🧊 ICE connection state:', state);

          // Add ICE restart for failed connections
          if (state === 'failed') {
            console.log('🔄 ICE failed, restarting...');
            setTimeout(() => {
              if (
                this.peerConnection &&
                this.peerConnection.iceConnectionState === 'failed'
              ) {
                this.peerConnection.restartIce();
              }
            }, 1000);
          }
        }
      });

      // Handle ICE candidates
      this.peerConnection.onicecandidate = event => {
        if (event.candidate && typeof this.onIceCandidate === 'function') {
          const candidateObject = {
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid,
            // Only include usernameFragment if it exists and is not undefined
            ...(event.candidate.usernameFragment && {
              usernameFragment: event.candidate.usernameFragment,
            }),
          };
          this.onIceCandidate(candidateObject);
        }
      };

      // Process pending candidates when remote description is set
      this.peerConnection.addEventListener('signalingstatechange', () => {
        if (this.peerConnection) {
          console.log(
            '📡 Signaling state:',
            this.peerConnection.signalingState,
          );
          if (
            this.peerConnection.remoteDescription &&
            this.pendingCandidates.length > 0
          ) {
            console.log(
              '🧊 Processing',
              this.pendingCandidates.length,
              'pending candidates',
            );
            this.pendingCandidates.forEach(candidate => {
              this.addIceCandidate(candidate);
            });
            this.pendingCandidates = [];
          }
        }
      });

      console.log('✅ React Native WebRTC initialized successfully');
    } catch (error) {
      console.error('❌ WebRTC initialization failed:', error);
      throw error;
    }
  }

  async createOffer() {
    console.log('📝 Creating offer...');
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    console.log('📝 Local description set (offer)');
    return {
      type: offer.type,
      sdp: offer.sdp,
    };
  }

  async setRemoteDescription(desc) {
    try {
      console.log(
        '📡 Setting remote description, current state:',
        this.peerConnection.signalingState,
      );
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(desc),
      );
      console.log(
        '📡 Remote description set successfully, new state:',
        this.peerConnection.signalingState,
      );
    } catch (error) {
      console.error('❌ Failed to set remote description:', error);
      throw error;
    }
  }

  async createAnswer() {
    console.log('📝 Creating answer...');
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    console.log('📝 Local description set (answer)');
    return {
      type: answer.type,
      sdp: answer.sdp,
    };
  }

  async addIceCandidate(candidate) {
    try {
      if (!this.peerConnection.remoteDescription) {
        console.log('🧊 Remote description not set yet, queuing candidate');
        this.pendingCandidates.push(candidate);
        return;
      }

      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('🧊 ICE candidate added successfully');
    } catch (error) {
      console.warn('⚠️ Error adding ICE candidate (ignoring):', error);
    }
  }

  async close() {
    console.log('🧹 Closing WebRTC connection...');

    // **FIXED: Safe cleanup to prevent null reference errors**
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.remoteStream = null;
    this.pendingCandidates = [];
    this.onLocalStream = null;
    this.onRemoteStream = null;
  }
}
