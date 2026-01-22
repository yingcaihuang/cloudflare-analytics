/**
 * SecurityScreen Example
 * Demonstrates the usage of SecurityScreen component
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import SecurityScreen from './SecurityScreen';

/**
 * Example usage of SecurityScreen
 * Replace 'your-zone-id' with an actual Cloudflare Zone ID
 */
export default function SecurityScreenExample() {
  // In a real app, this would come from authentication/navigation context
  const zoneId = 'your-zone-id';

  return (
    <View style={styles.container}>
      <SecurityScreen zoneId={zoneId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

/**
 * Features Demonstrated:
 * 
 * 1. Cache Performance Display (Requirement 4.2)
 *    - Shows cache hit rate as a percentage with visual progress bar
 *    - Displays breakdown of cache hits, misses, expired, and stale
 * 
 * 2. Firewall Events Statistics (Requirement 4.3)
 *    - Shows total firewall events
 *    - Displays breakdown of blocked, challenged, and allowed events
 *    - Color-coded cards for easy identification
 * 
 * 3. Bot Score Display (Requirement 4.4)
 *    - Shows average bot score
 *    - Highlights high scores (>80) with warning badge and red styling
 *    - Displays distribution by score ranges
 * 
 * 4. Threat Score Display (Requirement 4.4)
 *    - Shows average threat score
 *    - Highlights high scores (>80) with warning badge and red styling
 *    - Displays breakdown by threat levels (high, medium, low)
 * 
 * 5. 24-Hour Security Event Trend (Requirement 4.5)
 *    - Line chart showing firewall events over 24 hours
 *    - Multiple datasets: total, blocked, challenged, allowed
 *    - Interactive data points with tap-to-view details
 *    - Summary statistics for the time period
 * 
 * 6. Pull-to-Refresh (Requirement 7.1)
 *    - Swipe down to refresh all security metrics
 *    - Loading indicator during refresh
 * 
 * 7. Cache Indicator (Requirement 8.3)
 *    - Shows when data is loaded from cache
 *    - Displays last refresh timestamp
 * 
 * 8. Error Handling (Requirement 16.1, 16.4)
 *    - User-friendly error messages
 *    - Retry button for failed requests
 *    - Partial data display with error banner
 */
