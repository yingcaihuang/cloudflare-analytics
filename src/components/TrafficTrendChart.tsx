/**
 * TrafficTrendChart Component
 * Displays traffic trends with today vs yesterday comparison
 * Requirements: 5.1, 5.2, 5.3
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart, LineChartDataset } from './LineChart';
import { TrafficMetrics } from '../types';

export interface TrafficTrendChartProps {
  todayData: TrafficMetrics | null;
  yesterdayData: TrafficMetrics | null;
  metric?: 'requests' | 'bytes' | 'bandwidth';
  width?: number;
  height?: number;
}

/**
 * TrafficTrendChart Component
 * Renders a line chart showing today's traffic compared to yesterday's traffic
 * Displays data by hour granularity
 */
export const TrafficTrendChart: React.FC<TrafficTrendChartProps> = ({
  todayData,
  yesterdayData,
  metric = 'requests',
  width,
  height = 220,
}) => {
  /**
   * Generate hourly labels (0-23)
   * Requirement 5.2: Display by hour granularity
   */
  const generateHourlyLabels = (): string[] => {
    const labels: string[] = [];
    for (let i = 0; i < 24; i++) {
      labels.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return labels;
  };

  /**
   * Extract hourly data from time series
   * Requirement 5.2: Display by hour granularity
   */
  const extractHourlyData = (
    trafficData: TrafficMetrics | null,
    metricKey: 'requests' | 'bytes' | 'bandwidth'
  ): number[] => {
    // Initialize array with 24 hours of zeros
    const hourlyData = new Array(24).fill(0);

    if (!trafficData?.timeSeries || trafficData.timeSeries.length === 0) {
      return hourlyData;
    }

    // Populate data from time series
    trafficData.timeSeries.forEach((point) => {
      const hour = new Date(point.timestamp).getHours();
      if (hour >= 0 && hour < 24) {
        hourlyData[hour] = point[metricKey];
      }
    });

    return hourlyData;
  };

  /**
   * Format metric value for display
   */
  const formatMetricValue = (value: number, metricType: string): string => {
    if (metricType === 'bytes') {
      if (value >= 1099511627776) return `${(value / 1099511627776).toFixed(1)}TB`;
      if (value >= 1073741824) return `${(value / 1073741824).toFixed(1)}GB`;
      if (value >= 1048576) return `${(value / 1048576).toFixed(1)}MB`;
      if (value >= 1024) return `${(value / 1024).toFixed(1)}KB`;
      return `${value}B`;
    }

    if (metricType === 'bandwidth') {
      return `${formatMetricValue(value, 'bytes')}/s`;
    }

    // For requests
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  /**
   * Get metric label
   */
  const getMetricLabel = (metricType: string): string => {
    switch (metricType) {
      case 'bytes':
        return 'Data Transfer';
      case 'bandwidth':
        return 'Bandwidth';
      case 'requests':
      default:
        return 'Requests';
    }
  };

  /**
   * Get Y-axis suffix
   */
  const getYAxisSuffix = (metricType: string): string => {
    if (metricType === 'bandwidth') return '/s';
    return '';
  };

  // Generate labels and datasets
  const labels = generateHourlyLabels();
  const todayHourlyData = extractHourlyData(todayData, metric);
  const yesterdayHourlyData = extractHourlyData(yesterdayData, metric);

  /**
   * Requirement 5.1: Display today's traffic as line chart
   * Requirement 5.3: Display yesterday's traffic for comparison
   */
  const datasets: LineChartDataset[] = [
    {
      label: 'Today',
      data: todayHourlyData,
      color: 'rgba(34, 128, 176, 1)', // Blue for today
    },
    {
      label: 'Yesterday',
      data: yesterdayHourlyData,
      color: 'rgba(255, 99, 132, 1)', // Red for yesterday
    },
  ];

  /**
   * Handle data point click
   * Requirement 5.4: Display specific values on touch
   */
  const handleDataPointClick = (data: {
    index: number;
    value: number;
    dataset: number;
  }) => {
    const hour = labels[data.index];
    const datasetLabel = datasets[data.dataset]?.label || '';
    const formattedValue = formatMetricValue(data.value, metric);
    console.log(`${datasetLabel} at ${hour}: ${formattedValue}`);
  };

  // Check if we have any data
  const hasData =
    todayHourlyData.some((v) => v > 0) || yesterdayHourlyData.some((v) => v > 0);

  if (!hasData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{getMetricLabel(metric)} Trend</Text>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No time series data available</Text>
          <Text style={styles.noDataSubtext}>
            Data will appear here once traffic is recorded
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getMetricLabel(metric)} Trend</Text>
      <Text style={styles.subtitle}>Hourly comparison: Today vs Yesterday</Text>
      <LineChart
        labels={labels}
        datasets={datasets}
        width={width}
        height={height}
        yAxisSuffix={getYAxisSuffix(metric)}
        showLegend={true}
        onDataPointClick={handleDataPointClick}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  noDataContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
  },
});
