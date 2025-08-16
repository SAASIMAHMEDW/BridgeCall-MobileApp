import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const HomeScreen = ({ navigation }) => {
  const handleLogout = () => {
    // Add logout logic here (clear user session, etc.)
    navigation.replace('Login'); // Use replace to prevent back navigation
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Home!</Text>
      <Text style={styles.subtitle}>What would you like to do?</Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Start Call" 
          onPress={() => navigation.navigate('Call')} 
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="View Profile" 
          onPress={() => {/* Navigate to profile */}} 
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Settings" 
          onPress={() => {/* Navigate to settings */}} 
        />
      </View>
      
      <View style={styles.logoutContainer}>
        <Button 
          title="Logout" 
          onPress={handleLogout}
          color="#ff4444"
        />
      </View>
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
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 15,
  },
  logoutContainer: {
    width: '100%',
    marginTop: 50,
  },
});

export default HomeScreen;
