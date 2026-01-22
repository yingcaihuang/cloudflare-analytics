/**
 * DashboardScreen Example Usage
 * This file demonstrates how to integrate the DashboardScreen component
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import DashboardScreen from './DashboardScreen';

/**
 * Example 1: Basic usage with a zone ID
 */
export function BasicDashboardExample() {
  // Replace with actual zone ID from authentication
  const zoneId = 'your-zone-id-here';

  return (
    <View style={styles.container}>
      <DashboardScreen zoneId={zoneId} />
    </View>
  );
}

/**
 * Example 2: Integration with navigation
 * This shows how you might use it with React Navigation
 */
export function NavigationDashboardExample({ route }: any) {
  const { zoneId } = route.params;

  return (
    <View style={styles.container}>
      <DashboardScreen zoneId={zoneId} />
    </View>
  );
}

/**
 * Example 3: With error boundary
 */
import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <View style={styles.container}>{/* Error fallback UI */}</View>;
    }

    return this.props.children;
  }
}

export function DashboardWithErrorBoundary() {
  const zoneId = 'your-zone-id-here';

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <DashboardScreen zoneId={zoneId} />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

/**
 * Integration Notes:
 * 
 * 1. The DashboardScreen requires a valid zoneId prop
 * 2. It automatically fetches today's and yesterday's traffic metrics
 * 3. Pull-to-refresh is built-in - users can swipe down to refresh
 * 4. Loading states and errors are handled automatically
 * 5. Cached data is displayed when network is unavailable
 * 
 * Requirements Satisfied:
 * - 2.1: Queries traffic metrics (requests, bytes, bandwidth, pageViews, visits)
 * - 2.4: Displays today and yesterday data
 * - 7.1: Implements pull-to-refresh functionality
 * - 2.5: Shows loading indicators
 * - 2.3: Displays user-friendly error messages
 */
