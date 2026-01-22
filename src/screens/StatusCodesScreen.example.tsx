/**
 * StatusCodesScreen Example Usage
 * 
 * This file demonstrates how to integrate the StatusCodesScreen into your app
 */

import React from 'react';
import { View } from 'react-native';
import StatusCodesScreen from './StatusCodesScreen';

/**
 * Example 1: Basic usage with a zone ID
 */
export function BasicStatusCodesExample() {
  return (
    <View style={{ flex: 1 }}>
      <StatusCodesScreen zoneId="your-zone-id-here" />
    </View>
  );
}

/**
 * Example 2: Integration with React Navigation
 * 
 * In your navigation stack:
 * 
 * import { createStackNavigator } from '@react-navigation/stack';
 * import StatusCodesScreen from './screens/StatusCodesScreen';
 * 
 * const Stack = createStackNavigator();
 * 
 * function AppNavigator() {
 *   return (
 *     <Stack.Navigator>
 *       <Stack.Screen 
 *         name="StatusCodes" 
 *         component={StatusCodesScreen}
 *         options={{ title: 'HTTP Status Codes' }}
 *         initialParams={{ zoneId: 'your-zone-id' }}
 *       />
 *     </Stack.Navigator>
 *   );
 * }
 */

/**
 * Example 3: Integration with Tab Navigator
 * 
 * import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
 * import StatusCodesScreen from './screens/StatusCodesScreen';
 * 
 * const Tab = createBottomTabNavigator();
 * 
 * function MainTabs({ route }) {
 *   const { zoneId } = route.params;
 *   
 *   return (
 *     <Tab.Navigator>
 *       <Tab.Screen name="Dashboard" component={DashboardScreen} />
 *       <Tab.Screen 
 *         name="Status Codes"
 *         children={() => <StatusCodesScreen zoneId={zoneId} />}
 *       />
 *     </Tab.Navigator>
 *   );
 * }
 */

/**
 * Features demonstrated:
 * 
 * 1. Pie Chart Visualization
 *    - Shows distribution of 2xx, 3xx, 4xx, 5xx status codes
 *    - Interactive slices with percentage labels
 * 
 * 2. Category Cards
 *    - Tap to view detailed breakdown
 *    - Shows count and percentage for each category
 * 
 * 3. Detailed Breakdown
 *    - Lists individual status codes (200, 404, 500, etc.)
 *    - Shows description and count for each code
 * 
 * 4. Pull-to-Refresh
 *    - Swipe down to refresh data
 *    - Shows loading indicator during refresh
 * 
 * 5. Caching
 *    - Automatically caches data for offline access
 *    - Shows cache indicator when displaying cached data
 * 
 * 6. Error Handling
 *    - Displays user-friendly error messages
 *    - Provides retry button on errors
 *    - Falls back to cached data when network fails
 */
