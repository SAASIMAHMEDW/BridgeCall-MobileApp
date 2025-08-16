import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/hooks/auth/useAuth';

// Import screen components
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import CallScreen from './src/screens/CallScreen';

const Stack = createNativeStackNavigator();

function AuthenticatedApp() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#000',
        },
        headerTintColor: 'rgba(44, 169, 188, 1)',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="Call" 
        component={CallScreen}
        options={{ 
          title: 'Video Call',
          headerLeft: () => null,
        }}
      />
    </Stack.Navigator>
  );
}

function UnauthenticatedApp() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ 
          headerShown: false
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { user, loading } = require('./src/hooks/auth/useAuth').useAuth();

  if (loading) {
    return null; // You can show a loading screen here
  }

  return user ? <AuthenticatedApp /> : <UnauthenticatedApp />;
}
