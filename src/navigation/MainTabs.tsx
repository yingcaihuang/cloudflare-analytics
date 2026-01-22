import React from 'react';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen, StatusCodesScreen, SecurityScreen } from '../screens';
import { useZone } from '../contexts';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs: React.FC = () => {
  const { zoneId, isLoading } = useZone();

  if (isLoading || !zoneId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

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
        name="Dashboard"
        options={{
          title: '流量概览',
          tabBarLabel: '概览',
          tabBarIcon: ({ color }) => (
            <TabIcon name="chart" color={color} />
          ),
        }}
      >
        {(props) => <DashboardScreen {...props} zoneId={zoneId} />}
      </Tab.Screen>
      <Tab.Screen
        name="StatusCodes"
        options={{
          title: '状态码分析',
          tabBarLabel: '状态码',
          tabBarIcon: ({ color }) => (
            <TabIcon name="code" color={color} />
          ),
        }}
      >
        {(props) => <StatusCodesScreen {...props} zoneId={zoneId} />}
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
        {(props) => <SecurityScreen {...props} zoneId={zoneId} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

// Simple icon component using text symbols
const TabIcon: React.FC<{ name: string; color: string }> = ({ name, color }) => {
  const icons: Record<string, string> = {
    chart: '📊',
    code: '📋',
    shield: '🛡️',
  };

  return (
    <Text style={{ fontSize: 24, color }}>{icons[name] || '•'}</Text>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
});
