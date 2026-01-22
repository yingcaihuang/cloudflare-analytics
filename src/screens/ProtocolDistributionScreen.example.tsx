/**
 * ProtocolDistributionScreen Example
 * Demonstrates how to use the ProtocolDistributionScreen component
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import ProtocolDistributionScreen from './ProtocolDistributionScreen';

/**
 * Example usage of ProtocolDistributionScreen
 * 
 * This screen displays HTTP protocol version distribution with:
 * - Bar chart visualization showing percentage of each protocol version
 * - Detailed statistics for HTTP/1.0, HTTP/1.1, HTTP/2, and HTTP/3
 * - Warning banner when HTTP/3 usage is below 10%
 * - Pull-to-refresh functionality
 * - Caching support for offline viewing
 * 
 * Requirements implemented:
 * - 19.1: Query HTTP protocol distribution data
 * - 19.2: Display as bar chart with percentages
 * - 19.3: Calculate and show percentage for each protocol
 * - 19.5: Show optimization tip when HTTP/3 is below 10%
 */

export default function ProtocolDistributionScreenExample() {
  // Example zone ID - replace with actual zone ID from your Cloudflare account
  const exampleZoneId = 'your-zone-id-here';

  return (
    <View style={styles.container}>
      <ProtocolDistributionScreen zoneId={exampleZoneId} />
    </View>
  );
}

/**
 * Example integration in navigation:
 * 
 * import { ProtocolDistributionScreen } from '../screens';
 * 
 * <Tab.Screen
 *   name="ProtocolDistribution"
 *   options={{
 *     title: '协议分布',
 *     tabBarLabel: '协议',
 *     tabBarIcon: ({ color }) => (
 *       <TabIcon name="protocol" color={color} />
 *     ),
 *   }}
 * >
 *   {(props) => <ProtocolDistributionScreen {...props} zoneId={zoneId} />}
 * </Tab.Screen>
 */

/**
 * Example data structure returned by useProtocolDistribution hook:
 * 
 * {
 *   data: {
 *     http1_0: 150,
 *     http1_1: 25000,
 *     http2: 45000,
 *     http3: 5000,
 *     total: 75150
 *   },
 *   loading: false,
 *   error: null,
 *   refresh: async () => { ... },
 *   lastRefreshTime: Date,
 *   isFromCache: false
 * }
 */

/**
 * Protocol distribution percentages are calculated as:
 * percentage = (protocol_requests / total_requests) * 100
 * 
 * Example:
 * - HTTP/1.0: (150 / 75150) * 100 = 0.20%
 * - HTTP/1.1: (25000 / 75150) * 100 = 33.27%
 * - HTTP/2: (45000 / 75150) * 100 = 59.88%
 * - HTTP/3: (5000 / 75150) * 100 = 6.65%
 * 
 * In this example, HTTP/3 is below 10%, so a warning banner will be displayed
 * suggesting the user enable HTTP/3 in Cloudflare settings.
 */

/**
 * Features demonstrated:
 * 
 * 1. Bar Chart Visualization
 *    - Shows percentage distribution across protocol versions
 *    - Color-coded bars for easy identification
 *    - Values displayed on top of bars
 * 
 * 2. Protocol Details Cards
 *    - Individual cards for each protocol version
 *    - Shows request count and percentage
 *    - Includes description of each protocol
 *    - Progress bar visualization
 * 
 * 3. HTTP/3 Optimization Warning
 *    - Automatically detects when HTTP/3 usage is below 10%
 *    - Displays informative banner with optimization suggestion
 *    - Helps users improve their Cloudflare configuration
 * 
 * 4. Data Refresh
 *    - Pull-to-refresh gesture support
 *    - Shows last refresh timestamp
 *    - Indicates when data is from cache
 * 
 * 5. Error Handling
 *    - Graceful fallback to cached data on network errors
 *    - Clear error messages with retry option
 *    - Loading states during data fetch
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
