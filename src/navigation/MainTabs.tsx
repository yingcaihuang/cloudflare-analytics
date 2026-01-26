import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen, DashboardScreen, CustomDashboardScreen, SecurityScreen, SettingsScreen, LayoutManagerScreen, AnalyticsScreen } from '../screens';
import { useZone } from '../contexts';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator();

// Custom Dashboard Stack Navigator
const CustomDashboardStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CustomDashboardMain" component={CustomDashboardScreen} />
      <Stack.Screen name="LayoutManager" component={LayoutManagerScreen} />
    </Stack.Navigator>
  );
};

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
        name="CustomDashboard"
        component={CustomDashboardStack}
        options={{
          title: '自定义仪表板',
          tabBarLabel: '自定义',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <TabIcon name="custom" color={color} />
          ),
        }}
      />
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
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: '分析指标',
          tabBarLabel: '分析',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <TabIcon name="analytics" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: '设置',
          tabBarLabel: '设置',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <TabIcon name="settings" color={color} />
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
    custom: '⚙️',
    code: '📋',
    shield: '🛡️',
    analytics: '📈',
    settings: '⚙️',
  };

  return (
    <Text style={{ fontSize: 24, color }}>{icons[name] || '•'}</Text>
  );
};
