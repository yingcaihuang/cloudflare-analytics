import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TokenInputScreen } from '../screens';
import type { AuthStackParamList } from './types';

const Stack = createStackNavigator<AuthStackParamList>();

interface AuthStackProps {
  onAuthSuccess: () => void;
}

export const AuthStack: React.FC<AuthStackProps> = ({ onAuthSuccess }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="TokenInput"
        options={{
          cardStyle: { backgroundColor: '#f5f5f5' },
        }}
      >
        {(props) => <TokenInputScreen {...props} onSuccess={onAuthSuccess} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
