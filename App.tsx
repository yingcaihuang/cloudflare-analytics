import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { 
  TokenManagementScreen,
  AccountZoneSelectionScreen,
  StatusCodesScreen, 
  GeoDistributionScreen,
  ProtocolDistributionScreen,
  TLSDistributionScreen,
  ContentTypeScreen,
  BotAnalysisScreen,
  FirewallAnalysisScreen,
  AlertConfigScreen,
  AlertHistoryScreen,
} from './src/screens';
import { MainTabs } from './src/navigation/MainTabs';
import { ZoneProvider, useZone, ThemeProvider, DashboardProvider } from './src/contexts';
import { AuthManager } from './src/services';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const { zoneId, refreshAccounts, setZoneId, setSelectedAccount } = useZone();

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AuthManager.getCurrentToken();
      console.log('Token check result:', !!token);
      setHasToken(!!token);
      if (token) {
        await refreshAccounts();
      }
    } catch (error) {
      console.error('Token check error:', error);
      setHasToken(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleTokenSelected = async () => {
    setHasToken(true);
    await refreshAccounts();
  };

  const handleLogout = () => {
    // Reset all state
    setHasToken(false);
    setZoneId(null);
    setSelectedAccount(null);
  };

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
      initialRouteName={hasToken ? 'MainTabs' : 'TokenManagement'}
    >
      {/* Main Tabs - shown when user has token */}
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{
          headerShown: false,
        }}
      />

      {/* Token Management */}
      <Stack.Screen 
        name="TokenManagement"
        options={{
          headerShown: false,
        }}
      >
        {(props) => (
          <TokenManagementScreen 
            {...props}
            onTokenSelected={handleTokenSelected} 
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="AccountZoneSelection"
        options={({ navigation }) => ({
          headerShown: true,
          title: '选择账户和Zone',
          headerBackTitle: '返回',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => {
                navigation.goBack();
              }}
              style={{ marginLeft: 8 }}
            >
              <Text style={{ color: '#f97316', fontSize: 17 }}>‹ 返回</Text>
            </TouchableOpacity>
          ),
        })}
      >
        {(props) => (
          <AccountZoneSelectionScreen 
            {...props}
            onComplete={() => {
              props.navigation.goBack();
            }}
          />
        )}
      </Stack.Screen>

      {/* Additional Feature Screens */}
      <Stack.Screen 
        name="StatusCodes"
        component={StatusCodesScreen}
        options={{
          title: '状态码分析',
          headerBackTitle: '返回',
        }}
      />

      <Stack.Screen 
        name="GeoDistribution"
        component={GeoDistributionScreen}
        options={{
          title: '地理分布',
          headerBackTitle: '返回',
        }}
      />

      <Stack.Screen 
        name="ProtocolDistribution"
        component={ProtocolDistributionScreen}
        options={{
          title: '协议分布',
          headerBackTitle: '返回',
        }}
      />

      <Stack.Screen 
        name="TLSDistribution"
        component={TLSDistributionScreen}
        options={{
          title: 'TLS 版本分布',
          headerBackTitle: '返回',
        }}
      />

      <Stack.Screen 
        name="ContentType"
        component={ContentTypeScreen}
        options={{
          title: '内容类型分布',
          headerBackTitle: '返回',
        }}
      />

      <Stack.Screen 
        name="BotAnalysis"
        component={BotAnalysisScreen}
        options={{
          title: 'Bot 分析',
          headerBackTitle: '返回',
        }}
      />

      <Stack.Screen 
        name="FirewallAnalysis"
        component={FirewallAnalysisScreen}
        options={{
          title: 'Firewall 分析',
          headerBackTitle: '返回',
        }}
      />

      <Stack.Screen 
        name="AlertConfig"
        component={AlertConfigScreen}
        options={{
          title: '告警配置',
          headerBackTitle: '返回',
        }}
      />

      <Stack.Screen 
        name="AlertHistory"
        component={AlertHistoryScreen}
        options={{
          title: '告警历史',
          headerBackTitle: '返回',
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ZoneProvider>
            <DashboardProvider>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </DashboardProvider>
          </ZoneProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
});
