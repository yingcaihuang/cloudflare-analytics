/**
 * SecurityEventTrendChart Component
 * Displays 24-hour trend of security events (firewall events) as a line chart
 * Requirement: 4.5 - Support viewing recent 24 hours security event trends
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from './LineChart';

export interface SecurityEventTimeSeriesPoint {
  timestamp: Date;
  blocked: number;
  challenged: number;
  allowed: number;
  total: number;
}

export interface SecurityEventTrendChartProps {
  timeSeries: SecurityEventTimeSeriesPoint[];
  width?: number;
  height?: number;
}

/**
 * SecurityEventTrendChart component
 * Renders a line chart showing firewall event trends over 24 hours
 */
export const SecurityEventTrendChart: React.FC<SecurityEventTrendChartProps> = ({
  timeSeries,
  width,
  height = 250,
}) => {
  // If no data, show empty state
  if (!timeSeries || timeSeries.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>24-Hour Security Event Trend</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No security event data available</Text>
        </View>
      </View>
    );
  }

  // Format labels (hours)
  const labels = timeSeries.map((point) => {
    const hour = new Date(point.timestamp).getHours();
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Prepare datasets for the chart
  const datasets = [
    {
      label: 'Total Events',
      data: timeSeries.map((point) => point.total),
      color: '#3498db',
    },
    {
      label: 'Blocked',
      data: timeSeries.map((point) => point.blocked),
      color: '#e74c3c',
    },
    {
      label: 'Challenged',
      data: timeSeries.map((point) => point.challenged),
      color: '#f39c12',
    },
    {
      label: 'Allowed',
      data: timeSeries.map((point) => point.allowed),
      color: '#27ae60',
    },
  ];

  // Calculate summary statistics
  const totalEvents = timeSeries.reduce((sum, point) => sum + point.total, 0);
  const totalBlocked = timeSeries.reduce((sum, point) => sum + point.blocked, 0);
  const totalChallenged = timeSeries.reduce((sum, point) => sum + point.challenged, 0);
  const totalAllowed = timeSeries.reduce((sum, point) => sum + point.allowed, 0);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toString();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>24-Hour Security Event Trend</Text>
      
      {/* Summary Statistics */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatNumber(totalEvents)}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={[styles.summaryItem, styles.blockedSummary]}>
          <Text style={[styles.summaryValue, styles.blockedText]}>
            {formatNumber(totalBlocked)}
          </Text>
          <Text style={styles.summaryLabel}>Blocked</Text>
        </View>
        <View style={[styles.summaryItem, styles.challengedSummary]}>
          <Text style={[styles.summaryValue, styles.challengedText]}>
            {formatNumber(totalChallenged)}
          </Text>
          <Text style={styles.summaryLabel}>Challenged</Text>
        </View>
        <View style={[styles.summaryItem, styles.allowedSummary]}>
          <Text style={[styles.summaryValue, styles.allowedText]}>
            {formatNumber(totalAllowed)}
          </Text>
          <Text style={styles.summaryLabel}>Allowed</Text>
        </View>
      </View>

      {/* Line Chart */}
      <View style={styles.chartContainer}>
        <LineChart
          labels={labels}
          datasets={datasets}
          width={width}
          height={height}
          yAxisSuffix=""
          showLegend={true}
        />
      </View>

      {/* Info Text */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Tap on data points to see detailed values for each hour
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666',
  },
  blockedSummary: {
    // Additional styling for blocked summary
  },
  blockedText: {
    color: '#e74c3c',
  },
  challengedSummary: {
    // Additional styling for challenged summary
  },
  challengedText: {
    color: '#f39c12',
  },
  allowedSummary: {
    // Additional styling for allowed summary
  },
  allowedText: {
    color: '#27ae60',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  infoContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
