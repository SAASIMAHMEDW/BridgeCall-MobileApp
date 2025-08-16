import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const CallScreen = ({ navigation }) => {
  const [isCallActive, setIsCallActive] = React.useState(false);

  const startCall = () => {
    setIsCallActive(true);
    // Add your call logic here
  };

  const endCall = () => {
    setIsCallActive(false);
    // Add end call logic here
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Call</Text>
      
      {!isCallActive ? (
        <View style={styles.callSetup}>
          <Text style={styles.subtitle}>Ready to start your call?</Text>
          <Button title="Start Call" onPress={startCall} />
        </View>
      ) : (
        <View style={styles.activeCall}>
          <Text style={styles.callStatus}>Call in Progress...</Text>
          <Text style={styles.timer}>00:45</Text>
          
          <View style={styles.callControls}>
            <Button title="Mute" onPress={() => {}} />
            <Button title="Speaker" onPress={() => {}} />
            <Button title="End Call" onPress={endCall} color="#ff4444" />
          </View>
        </View>
      )}
      
      <Button 
        title="Back to Home" 
        onPress={() => navigation.goBack()} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  callSetup: {
    alignItems: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  activeCall: {
    alignItems: 'center',
    marginBottom: 40,
  },
  callStatus: {
    fontSize: 18,
    color: '#4CAF50',
    marginBottom: 10,
  },
  timer: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  callControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
});

export default CallScreen;
