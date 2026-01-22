import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { AuthManager } from '../services';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AuthManager.getCurrentToken();
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return null; // Could show a splash screen here
  }

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        presentation: 'card',
        animationEnabled: true,
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth">
          {(props) => <AuthStack {...props} onAuthSuccess={handleAuthSuccess} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
};
