/**
 * ContentTypeScreen Example
 * Demonstrates how to use the ContentTypeScreen component
 */

import React from 'react';
import { View } from 'react-native';
import ContentTypeScreen from './ContentTypeScreen';

/**
 * Example 1: Basic usage with a zone ID
 */
export function BasicContentTypeScreenExample() {
  return (
    <View style={{ flex: 1 }}>
      <ContentTypeScreen zoneId="your-zone-id-here" />
    </View>
  );
}

/**
 * Example 2: Usage in a navigation stack
 * This would typically be used in MainTabs.tsx or a similar navigation component
 */
export function NavigationExample() {
  // In your navigation setup:
  // <Tab.Screen
  //   name="ContentType"
  //   options={{
  //     title: '内容类型分布',
  //     tabBarLabel: '内容类型',
  //     tabBarIcon: ({ color }) => (
  //       <TabIcon name="file" color={color} />
  //     ),
  //   }}
  // >
  //   {(props) => <ContentTypeScreen {...props} zoneId={zoneId} />}
  // </Tab.Screen>

  return null;
}

/**
 * Features demonstrated:
 * 
 * 1. Top 10 Display (Requirement 21.3)
 *    - Shows the top 10 content types by request count
 *    - Sorted in descending order by requests
 * 
 * 2. Pie Chart Visualization (Requirement 21.2)
 *    - Visual representation of content type distribution
 *    - Color-coded for easy identification
 * 
 * 3. Request and Byte Display (Requirement 21.4)
 *    - Shows both request count and byte size for each content type
 *    - Formatted for readability
 * 
 * 4. Percentage Calculation (Requirement 21.5)
 *    - Displays percentage of total for each content type
 *    - Progress bars for visual representation
 * 
 * 5. Data Refresh
 *    - Pull-to-refresh functionality
 *    - Shows last refresh time
 *    - Cache indicator when showing cached data
 * 
 * 6. Error Handling
 *    - Graceful error display
 *    - Fallback to cached data when available
 *    - Retry functionality
 * 
 * 7. Show All Toggle
 *    - Toggle between Top 10 and all content types
 *    - Useful when there are more than 10 types
 */
