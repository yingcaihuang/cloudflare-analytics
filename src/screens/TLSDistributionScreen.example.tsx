/**
 * TLSDistributionScreen Example
 * Example usage of TLSDistributionScreen component
 */

import React from 'react';
import { View } from 'react-native';
import TLSDistributionScreen from './TLSDistributionScreen';

/**
 * Example 1: Basic usage with zone ID
 */
export function BasicTLSDistributionExample() {
  return (
    <View style={{ flex: 1 }}>
      <TLSDistributionScreen zoneId="your-zone-id-here" />
    </View>
  );
}

/**
 * Example 2: Usage in a navigation stack
 */
export function NavigationExample() {
  // In your navigation setup:
  // <Stack.Screen 
  //   name="TLSDistribution" 
  //   component={TLSDistributionScreen}
  //   options={{ title: 'TLS Version Distribution' }}
  // />
  
  // Then navigate with:
  // navigation.navigate('TLSDistribution', { zoneId: 'your-zone-id' });
  
  return null;
}

/**
 * Example 3: Mock data for testing
 */
export const mockTLSData = {
  tls1_0: 50,
  tls1_1: 150,
  tls1_2: 8000,
  tls1_3: 1800,
  total: 10000,
  insecurePercentage: 2.0, // (50 + 150) / 10000 * 100
};

/**
 * Example 4: High-risk scenario (insecure TLS > 5%)
 */
export const mockHighRiskTLSData = {
  tls1_0: 300,
  tls1_1: 400,
  tls1_2: 7000,
  tls1_3: 2300,
  total: 10000,
  insecurePercentage: 7.0, // (300 + 400) / 10000 * 100
};

/**
 * Example 5: Modern setup (mostly TLS 1.3)
 */
export const mockModernTLSData = {
  tls1_0: 0,
  tls1_1: 0,
  tls1_2: 3000,
  tls1_3: 7000,
  total: 10000,
  insecurePercentage: 0,
};
