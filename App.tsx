import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  TokenManagementScreen,
  AccountZoneSelectionScreen,
  DashboardScreen, 
  StatusCodesScreen, 
  SecurityScreen,
} from './src/screens';
import { ZoneProvider, useZone } from './src/contexts';
import { AuthManager } from './src/services';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main tabs after zone selection
function MainTabs() {
  const { selectedAccount, zoneId, zoneName } = useZone();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { paddingBottom: 5, height: 60 },
      }}
    >
      <Tab.Screen 
        name="Dashboard"
        children={(props) => <DashboardScreen {...props} zoneId={zoneId!} zoneName={zoneName || undefined} />}
        options={{ 
          title: '概览',
          headerTitle: () => (
            <View>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>流量概览</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                {selectedAccount?.name} • {zoneName}
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="StatusCodes"
        children={(props) => <StatusCodesScreen {...props} zoneId={zoneId!} zoneName={zoneName || undefined} />}
        options={{ 
          title: '状态码',
          headerTitle: () => (
            <View>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>状态码分析</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                {selectedAccount?.name} • {zoneName}
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Security"
        children={(props) => <SecurityScreen {...props} zoneId={zoneId!} zoneName={zoneName || undefined} />}
        options={{ 
          title: '安全',
          headerTitle: () => (
            <View>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>安全与缓存</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                {selectedAccount?.name} • {zoneName}
              </Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string>('TokenManagement');
  const { zoneId, refreshAccounts, setZoneId, setSelectedAccount } = useZone();

  useEffect(() => {
    checkToken();
  }, []);

  useEffect(() => {
    // Determine initial route based on state
    if (!isInitializing) {
      if (!hasToken) {
        setInitialRoute('TokenManagement');
      } else if (!zoneId) {
        setInitialRoute('AccountZoneSelection');
      } else {
        setInitialRoute('MainTabs');
      }
    }
  }, [isInitializing, hasToken, zoneId]);

  const checkToken = async () => {
    try {
      const token = await AuthManager.getCurrentToken();
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
      initialRouteName={initialRoute}
      screenOptions={{
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
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
                handleLogout();
                navigation.navigate('TokenManagement');
              }}
              style={{ marginLeft: 8 }}
            >
              <Text style={{ color: '#f97316', fontSize: 17 }}>‹ Token管理</Text>
            </TouchableOpacity>
          ),
        })}
      >
        {(props) => (
          <AccountZoneSelectionScreen 
            {...props}
            onComplete={() => {
              props.navigation.navigate('MainTabs');
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={({ navigation }) => ({
          headerShown: true,
          title: 'Cloudflare Analytics',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => {
                // Reset zone selection and go back
                setZoneId(null);
                setSelectedAccount(null);
                navigation.navigate('AccountZoneSelection');
              }}
              style={{ marginLeft: 8 }}
            >
              <Text style={{ color: '#f97316', fontSize: 17 }}>‹ 切换Zone</Text>
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ZoneProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </ZoneProvider>
    </SafeAreaProvider>
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
