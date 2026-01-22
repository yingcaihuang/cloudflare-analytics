/**
 * GeoDistributionScreen Example Usage
 * 
 * This file demonstrates how to integrate the GeoDistributionScreen
 * into your navigation structure.
 */

import React from 'react';
import { View } from 'react-native';
import GeoDistributionScreen from './GeoDistributionScreen';

/**
 * Example 1: Basic usage with a zone ID
 */
export function BasicGeoDistributionExample() {
  const zoneId = 'your-zone-id-here';
  
  return (
    <View style={{ flex: 1 }}>
      <GeoDistributionScreen zoneId={zoneId} />
    </View>
  );
}

/**
 * Example 2: Integration with React Navigation
 * 
 * Add to your navigation types:
 * 
 * export type MainTabParamList = {
 *   Dashboard: undefined;
 *   StatusCodes: undefined;
 *   Security: undefined;
 *   GeoDistribution: undefined; // Add this
 * };
 * 
 * Then in your Tab Navigator:
 * 
 * <Tab.Screen
 *   name="GeoDistribution"
 *   component={GeoDistributionScreenWrapper}
 *   options={{
 *     title: 'Geographic Distribution',
 *     tabBarIcon: ({ color, size }) => (
 *       <Icon name="globe" size={size} color={color} />
 *     ),
 *   }}
 * />
 */

/**
 * Example 3: Wrapper component that gets zone ID from context
 */
export function GeoDistributionScreenWrapper() {
  // In a real app, you would get the zone ID from context or props
  // For example:
  // const { currentZone } = useZoneContext();
  // return <GeoDistributionScreen zoneId={currentZone.id} />;
  
  const mockZoneId = 'example-zone-id';
  return <GeoDistributionScreen zoneId={mockZoneId} />;
}

/**
 * Features demonstrated:
 * 
 * 1. Country List Display (Requirement 18.2)
 *    - Shows all countries with traffic
 *    - Displays country flags using emoji
 *    - Shows country codes (ISO 3166-1 alpha-2)
 * 
 * 2. Top 10 Display (Requirement 18.3)
 *    - Toggle between Top 10 and All Countries
 *    - Top 10 countries highlighted with special background
 *    - Sorted by request count descending
 * 
 * 3. Percentage Display (Requirement 18.5)
 *    - Each country shows percentage of total traffic
 *    - Formatted to 2 decimal places
 * 
 * 4. Click for Details (Requirement 18.4)
 *    - Tap any country to see detailed modal
 *    - Shows requests, bytes transferred, percentage
 *    - Shows average bytes per request
 * 
 * 5. Pull-to-Refresh
 *    - Pull down to refresh data
 *    - Shows loading indicator during refresh
 * 
 * 6. Caching
 *    - Data cached for 5 minutes
 *    - Shows cache indicator when displaying cached data
 *    - Falls back to cache on network error
 * 
 * 7. Error Handling
 *    - Displays user-friendly error messages
 *    - Provides retry button on error
 *    - Shows partial data with error banner if available
 */
