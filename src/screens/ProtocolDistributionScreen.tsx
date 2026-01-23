/**
 * ProtocolDistributionScreen
 * Displays HTTP protocol version distribution
 * Requirements: 19.1, 19.2, 19.3, 19.5
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
  Dimensions,
} from 'react-native';
import { useProtocolDistribution } from '../hooks/useProtocolDistribution';
import { useZone } from '../contexts/ZoneContext';
import { MetricsQueryParams } from '../types';
import { BarChart } from '../components';

interface ProtocolStats {
  name: string;
  version: string;
  requests: number;
  percentage: number;
  color: string;
  description: string;
}

export default function ProtocolDistributionScreen() {
  const { zoneId, accountTag } = useZone();
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Calculate date ranges based on selected time range
  const dateRanges = useMemo(() => {
    const now = new Date();
    const endDate = now;
    let startDate: Date;

    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    return { startDate, endDate };
  }, [timeRange]);

  // Query parameters - memoize to prevent unnecessary re-renders
  const params: MetricsQueryParams = useMemo(() => ({
    zoneId: zoneId || '',
    accountTag: accountTag || undefined,
    ...dateRanges,
    granularity: 'hour',
  }), [zoneId, accountTag, dateRanges]);

  // Fetch protocol distribution data
  const {
    data,
    loading,
    error,
    refresh,
    lastRefreshTime,
    isFromCache,
  } = useProtocolDistribution(params);

  /**
   * Handle pull-to-refresh
   * Requirement 7.1: Implement pull-to-refresh functionality
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Calculate percentage for each protocol
   * Requirement 19.3: Calculate and display percentages
   */
  const calculatePercentage = (value: number, total: number): number => {
    if (total === 0) return 0;
    return (value / total) * 100;
  };

  /**
   * Format number with commas
   */
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  /**
   * Format percentage
   */
  const formatPercentage = (percentage: number): string => {
    return `${percentage.toFixed(2)}%`;
  };

  /**
   * Get protocol statistics with percentages
   * Sorted by percentage in descending order
   */
  const getProtocolStats = (): ProtocolStats[] => {
    if (!data) return [];

    const { http1_0, http1_1, http2, http3, total } = data;

    const stats = [
      {
        name: 'HTTP/1.0',
        version: '1.0',
        requests: http1_0,
        percentage: calculatePercentage(http1_0, total),
        color: '#e74c3c',
        description: 'Legacy protocol, rarely used',
      },
      {
        name: 'HTTP/1.1',
        version: '1.1',
        requests: http1_1,
        percentage: calculatePercentage(http1_1, total),
        color: '#3498db',
        description: 'Traditional HTTP protocol',
      },
      {
        name: 'HTTP/2',
        version: '2',
        requests: http2,
        percentage: calculatePercentage(http2, total),
        color: '#2ecc71',
        description: 'Modern protocol with multiplexing',
      },
      {
        name: 'HTTP/3',
        version: '3',
        requests: http3,
        percentage: calculatePercentage(http3, total),
        color: '#9b59b6',
        description: 'Latest protocol using QUIC',
      },
    ];

    // Sort by percentage in descending order
    return stats.sort((a, b) => b.percentage - a.percentage);
  };

  /**
   * Check if HTTP/3 usage is low
   * Requirement 19.5: Show warning when HTTP/3 is below 10%
   */
  const isHttp3Low = (): boolean => {
    if (!data || data.total === 0) return false;
    const http3Percentage = calculatePercentage(data.http3, data.total);
    return http3Percentage < 10;
  };

  /**
   * Prepare data for bar chart
   * Requirement 19.2: Display as bar chart
   */
  const getChartData = () => {
    const stats = getProtocolStats();
    return {
      labels: stats.map(s => s.version),
      data: stats.map(s => s.percentage),
    };
  };

  /**
   * Render loading state
   */
  if (loading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f6821f" />
        <Text style={styles.loadingText}>Loading protocol distribution...</Text>
      </View>
    );
  }

  /**
   * Render error state
   */
  if (error && !data) {
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

  const protocolStats = getProtocolStats();
  const showHttp3Warning = isHttp3Low();
  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
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
          <Text style={styles.title}>Protocol Distribution</Text>
          {lastRefreshTime && (
            <Text style={styles.lastUpdate}>
              Last updated: {lastRefreshTime.toLocaleTimeString()}
            </Text>
          )}
          {isFromCache && (
            <Text style={styles.cacheIndicator}>📦 Showing cached data</Text>
          )}
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeSelector}>
          <TouchableOpacity
            style={[styles.timeRangeButton, timeRange === '24h' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('24h')}
          >
            <Text style={[styles.timeRangeButtonText, timeRange === '24h' && styles.timeRangeButtonTextActive]}>
              24H
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeRangeButton, timeRange === '7d' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('7d')}
          >
            <Text style={[styles.timeRangeButtonText, timeRange === '7d' && styles.timeRangeButtonTextActive]}>
              7D
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeRangeButton, timeRange === '30d' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('30d')}
          >
            <Text style={[styles.timeRangeButtonText, timeRange === '30d' && styles.timeRangeButtonTextActive]}>
              30D
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error banner if partial data */}
        {error && data && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️ {error}</Text>
          </View>
        )}

        {/* HTTP/3 Low Usage Warning */}
        {showHttp3Warning && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningIcon}>💡</Text>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>HTTP/3 Usage is Low</Text>
              <Text style={styles.warningText}>
                HTTP/3 traffic is below 10%. Consider enabling HTTP/3 in your Cloudflare settings for improved performance.
              </Text>
            </View>
          </View>
        )}

        {/* Summary Card */}
        {data && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Requests</Text>
            <Text style={styles.summaryValue}>{formatNumber(data.total)}</Text>
          </View>
        )}

        {/* Bar Chart */}
        {data && data.total > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Protocol Distribution</Text>
            <View style={styles.chartContainer}>
              <BarChart
                labels={getChartData().labels}
                data={getChartData().data}
                width={screenWidth - 48}
                height={220}
                yAxisSuffix="%"
                showValuesOnTopOfBars={true}
                fromZero={true}
              />
            </View>
          </View>
        )}

        {/* Protocol Details List */}
        {protocolStats.length > 0 && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Protocol Details</Text>
            {protocolStats.map((protocol) => (
              <View key={protocol.version} style={styles.protocolCard}>
                <View style={styles.protocolHeader}>
                  <View style={styles.protocolTitleRow}>
                    <View style={[styles.colorIndicator, { backgroundColor: protocol.color }]} />
                    <Text style={styles.protocolName}>{protocol.name}</Text>
                  </View>
                  <Text style={styles.protocolPercentage}>
                    {formatPercentage(protocol.percentage)}
                  </Text>
                </View>
                <Text style={styles.protocolDescription}>{protocol.description}</Text>
                <View style={styles.protocolStats}>
                  <View style={styles.protocolStatItem}>
                    <Text style={styles.protocolStatLabel}>Requests</Text>
                    <Text style={styles.protocolStatValue}>{formatNumber(protocol.requests)}</Text>
                  </View>
                  <View style={styles.protocolStatItem}>
                    <Text style={styles.protocolStatLabel}>Percentage</Text>
                    <Text style={styles.protocolStatValue}>{formatPercentage(protocol.percentage)}</Text>
                  </View>
                </View>
                {/* Progress bar */}
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${protocol.percentage}%`,
                        backgroundColor: protocol.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {data && data.total === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No protocol data available</Text>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About HTTP Protocols</Text>
          <Text style={styles.infoText}>
            • HTTP/1.0: Legacy protocol with limited features{'\n'}
            • HTTP/1.1: Traditional protocol with persistent connections{'\n'}
            • HTTP/2: Modern protocol with multiplexing and header compression{'\n'}
            • HTTP/3: Latest protocol using QUIC for improved performance
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
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
    marginBottom: 16,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
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
  warningBanner: {
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
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
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  chartSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  detailsSection: {
    marginBottom: 20,
  },
  protocolCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  protocolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  protocolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  protocolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  protocolPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f6821f',
  },
  protocolDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  protocolStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  protocolStatItem: {
    flex: 1,
  },
  protocolStatLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  protocolStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});
