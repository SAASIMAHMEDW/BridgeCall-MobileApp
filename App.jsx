import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your screen components

import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import CallScreen from './src/screens/CallScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4A90E2',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ 
            title: 'Login',
            headerShown: false // Hide header on login screen
          }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ 
            title: 'Create Account' 
          }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ 
            title: 'Home',
            headerLeft: () => null, // Remove back button on home screen
          }}
        />
        <Stack.Screen 
          name="Call" 
          component={CallScreen}
          options={{ 
            title: 'Voice Call' 
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
