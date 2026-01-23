import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen, DashboardScreen, StatusCodesScreen, SecurityScreen, MoreScreen } from '../screens';
import { useZone } from '../contexts';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs: React.FC = () => {
  const { zoneId } = useZone();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f97316',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '首页',
          tabBarLabel: '首页',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <TabIcon name="home" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Dashboard"
        options={{
          title: '流量概览',
          tabBarLabel: '概览',
          tabBarIcon: ({ color }) => (
            <TabIcon name="chart" color={color} />
          ),
        }}
      >
        {(props) => <DashboardScreen {...props} zoneId={zoneId || ''} />}
      </Tab.Screen>
      <Tab.Screen
        name="Security"
        options={{
          title: '安全与缓存',
          tabBarLabel: '安全',
          tabBarIcon: ({ color }) => (
            <TabIcon name="shield" color={color} />
          ),
        }}
      >
        {(props) => <SecurityScreen {...props} zoneId={zoneId || ''} />}
      </Tab.Screen>
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          title: '更多',
          tabBarLabel: '更多',
          tabBarIcon: ({ color }) => (
            <TabIcon name="more" color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Simple icon component using text symbols
const TabIcon: React.FC<{ name: string; color: string }> = ({ name, color }) => {
  const icons: Record<string, string> = {
    home: '🏠',
    chart: '📊',
    code: '📋',
    shield: '🛡️',
    more: '⋯',
  };

  return (
    <Text style={{ fontSize: 24, color }}>{icons[name] || '•'}</Text>
  );
};
