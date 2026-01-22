/**
 * DashboardScreen
 * Main dashboard displaying traffic metrics with today/yesterday comparison
 * Requirements: 2.1, 2.4, 7.1
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTrafficMetrics } from '../hooks/useTrafficMetrics';
import { MetricsQueryParams } from '../types';
import { TrafficTrendChart } from '../components/TrafficTrendChart';
import { ExportManager } from '../services';

interface DashboardScreenProps {
  zoneId: string;
  zoneName?: string;
}

export default function DashboardScreen({ zoneId, zoneName = 'Unknown Zone' }: DashboardScreenProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Calculate date ranges using useMemo to ensure they update when timeRange changes
  const dateRanges = useMemo(() => {
    const now = new Date();
    const endDate = now;
    let startDate: Date;
    let granularity: 'hour' | 'day' = 'hour';

    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        granularity = 'hour';
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        granularity = 'day';
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        granularity = 'day';
        break;
    }

    // Calculate comparison range
    const duration = endDate.getTime() - startDate.getTime();
    const comparisonEndDate = new Date(startDate.getTime());
    const comparisonStartDate = new Date(startDate.getTime() - duration);

    return {
      current: { startDate, endDate, granularity },
      comparison: { 
        startDate: comparisonStartDate, 
        endDate: comparisonEndDate, 
        granularity 
      }
    };
  }, [timeRange]);

  // Query parameters for current period - memoized to prevent infinite loops
  const currentParams: MetricsQueryParams = useMemo(() => ({
    zoneId,
    ...dateRanges.current,
  }), [zoneId, dateRanges]);

  // Query parameters for comparison period - memoized to prevent infinite loops
  const comparisonParams: MetricsQueryParams = useMemo(() => ({
    zoneId,
    ...dateRanges.comparison,
  }), [zoneId, dateRanges]);

  // Fetch current period metrics
  const {
    data: currentData,
    loading: currentLoading,
    error: currentError,
    refresh: refreshCurrent,
    lastRefreshTime: currentRefreshTime,
    isFromCache: currentFromCache,
  } = useTrafficMetrics(currentParams);

  // Fetch comparison period metrics
  const {
    data: comparisonData,
    loading: comparisonLoading,
    error: comparisonError,
    refresh: refreshComparison,
    isFromCache: comparisonFromCache,
  } = useTrafficMetrics(comparisonParams);

  // Combined loading state
  const loading = currentLoading || comparisonLoading;
  const error = currentError || comparisonError;

  /**
   * Handle pull-to-refresh
   * Requirement 7.1: Implement pull-to-refresh functionality
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshCurrent(), refreshComparison()]);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Handle data export
   * Requirement 17.1, 17.3: Export traffic data to CSV
   */
  const handleExport = async () => {
    if (!currentData) {
      Alert.alert('No Data', 'No traffic data available to export.');
      return;
    }

    setExporting(true);
    try {
      const zone = {
        id: zoneId,
        name: zoneName,
        status: 'active' as const,
        plan: 'Unknown',
      };

      await ExportManager.exportTrafficMetrics(currentData, zone);
      Alert.alert('Success', 'Traffic data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Failed',
        error instanceof Error ? error.message : 'Failed to export data. Please try again.'
      );
    } finally {
      setExporting(false);
    }
  };

  /**
   * Get time range label
   */
  const getTimeRangeLabel = (): string => {
    switch (timeRange) {
      case '24h':
        return 'Last 24 Hours';
      case '7d':
        return 'Last 7 Days';
      case '30d':
        return 'Last 30 Days';
    }
  };

  /**
   * Get comparison label
   */
  const getComparisonLabel = (): string => {
    switch (timeRange) {
      case '24h':
        return 'Previous 24h';
      case '7d':
        return 'Previous 7d';
      case '30d':
        return 'Previous 30d';
    }
  };

  /**
   * Format large numbers for display
   */
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toString();
  };

  /**
   * Format bytes for display with proper units (KB, MB, GB, TB, PB)
   */
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    
    // Format with appropriate decimal places
    if (i === 0) {
      return `${bytes} B`;
    } else if (value >= 100) {
      return `${value.toFixed(0)} ${units[i]}`;
    } else if (value >= 10) {
      return `${value.toFixed(1)} ${units[i]}`;
    } else {
      return `${value.toFixed(2)} ${units[i]}`;
    }
  };

  /**
   * Format bandwidth (bytes per second) with proper units
   */
  const formatBandwidth = (bandwidth: number): string => {
    if (bandwidth === 0) return '0 B/s';
    
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s', 'PB/s'];
    const k = 1024;
    const i = Math.floor(Math.log(bandwidth) / Math.log(k));
    const value = bandwidth / Math.pow(k, i);
    
    // Format with appropriate decimal places
    if (i === 0) {
      return `${bandwidth.toFixed(0)} B/s`;
    } else if (value >= 100) {
      return `${value.toFixed(0)} ${units[i]}`;
    } else if (value >= 10) {
      return `${value.toFixed(1)} ${units[i]}`;
    } else {
      return `${value.toFixed(2)} ${units[i]}`;
    }
  };

  /**
   * Calculate percentage change
   */
  const calculateChange = (current: number, comparison: number): string => {
    if (comparison === 0) {
      return current > 0 ? '+100%' : '0%';
    }
    const change = ((current - comparison) / comparison) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  /**
   * Render metric card
   */
  const renderMetricCard = (
    title: string,
    currentValue: number,
    comparisonValue: number,
    formatter: (val: number) => string
  ) => {
    const change = calculateChange(currentValue, comparisonValue);
    const isPositive = currentValue >= comparisonValue;

    return (
      <View style={styles.metricCard}>
        <View style={styles.metricCardInner}>
          <Text style={styles.metricTitle}>{title}</Text>
          <Text style={styles.metricValue}>{formatter(currentValue)}</Text>
          <View style={styles.comparisonRow}>
            <Text style={styles.yesterdayLabel}>{getComparisonLabel()}: </Text>
            <Text style={styles.yesterdayValue}>{formatter(comparisonValue)}</Text>
          </View>
          <Text
            style={[
              styles.changeText,
              isPositive ? styles.changePositive : styles.changeNegative,
            ]}
          >
            {change}
          </Text>
        </View>
      </View>
    );
  };

  /**
   * Render loading state
   * Requirement 2.5: Display loading indicator
   */
  if (loading && !currentData && !comparisonData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f6821f" />
        <Text style={styles.loadingText}>Loading traffic metrics...</Text>
      </View>
    );
  }

  /**
   * Render error state
   * Requirement 2.3: Display user-friendly error messages
   */
  if (error && !currentData && !comparisonData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Unable to Load Data</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#f6821f']}
          tintColor="#f6821f"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Traffic Overview</Text>
            <Text style={styles.timeRangeLabel}>{getTimeRangeLabel()}</Text>
            {currentRefreshTime && (
              <Text style={styles.lastUpdate}>
                Last updated: {currentRefreshTime.toLocaleTimeString()}
              </Text>
            )}
            {(currentFromCache || comparisonFromCache) && (
              <Text style={styles.cacheIndicator}>📦 Showing cached data</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
            onPress={handleExport}
            disabled={exporting || !currentData}
          >
            <Text style={styles.exportButtonText}>
              {exporting ? '⏳' : '📤'} Export
            </Text>
          </TouchableOpacity>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeSelector}>
          <TouchableOpacity
            style={[styles.timeRangeButton, timeRange === '24h' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('24h')}
          >
            <Text style={[styles.timeRangeButtonText, timeRange === '24h' && styles.timeRangeButtonTextActive]}>
              24小时
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeRangeButton, timeRange === '7d' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('7d')}
          >
            <Text style={[styles.timeRangeButtonText, timeRange === '7d' && styles.timeRangeButtonTextActive]}>
              7天
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeRangeButton, timeRange === '30d' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('30d')}
          >
            <Text style={[styles.timeRangeButtonText, timeRange === '30d' && styles.timeRangeButtonTextActive]}>
              30天
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error banner if partial data */}
      {error && (currentData || comparisonData) && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        {/* Requests */}
        {renderMetricCard(
          'Requests',
          currentData?.requests || 0,
          comparisonData?.requests || 0,
          formatNumber
        )}

        {/* Bytes */}
        {renderMetricCard(
          'Data Transfer',
          currentData?.bytes || 0,
          comparisonData?.bytes || 0,
          formatBytes
        )}

        {/* Bandwidth */}
        {renderMetricCard(
          'Bandwidth',
          currentData?.bandwidth || 0,
          comparisonData?.bandwidth || 0,
          formatBandwidth
        )}

        {/* Page Views */}
        {renderMetricCard(
          'Page Views',
          currentData?.pageViews || 0,
          comparisonData?.pageViews || 0,
          formatNumber
        )}

        {/* Visits */}
        {renderMetricCard(
          'Visits',
          currentData?.visits || 0,
          comparisonData?.visits || 0,
          formatNumber
        )}
      </View>

      {/* Traffic Trend Chart */}
      <TrafficTrendChart
        todayData={currentData}
        yesterdayData={comparisonData}
        metric="requests"
      />

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          Pull down to refresh data. Metrics are updated in real-time.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  exportButton: {
    backgroundColor: '#f6821f',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  exportButtonDisabled: {
    backgroundColor: '#ccc',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  timeRangeLabel: {
    fontSize: 14,
    color: '#f6821f',
    fontWeight: '600',
    marginTop: 2,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#f6821f',
  },
  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  timeRangeButtonTextActive: {
    color: '#fff',
  },
  lastUpdate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cacheIndicator: {
    fontSize: 13,
    color: '#f6821f',
    marginTop: 4,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f6821f',
  },
  errorBannerText: {
    fontSize: 14,
    color: '#856404',
  },
  retryButton: {
    backgroundColor: '#f6821f',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  metricCard: {
    width: '50%',
    padding: 8,
  },
  metricCardInner: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  yesterdayLabel: {
    fontSize: 12,
    color: '#999',
  },
  yesterdayValue: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  changePositive: {
    color: '#27ae60',
  },
  changeNegative: {
    color: '#e74c3c',
  },
  infoSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
