/**
 * TLSDistributionScreen
 * Displays SSL/TLS version distribution with security warnings
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5
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
import { useTLSDistribution } from '../hooks/useTLSDistribution';
import { useZone } from '../contexts/ZoneContext';
import { MetricsQueryParams } from '../types';
import { PieChart, PieChartDataItem } from '../components/PieChart';

interface TLSStats {
  name: string;
  version: string;
  requests: number;
  percentage: number;
  color: string;
  description: string;
  isOutdated: boolean;
  isHighRisk: boolean;
}

export default function TLSDistributionScreen() {
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

  // Fetch TLS distribution data
  const {
    data,
    loading,
    error,
    refresh,
    lastRefreshTime,
    isFromCache,
  } = useTLSDistribution(params);

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
   * Calculate percentage for each TLS version
   * Requirement 20.4: Calculate and display percentages
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
   * Get TLS version statistics with percentages and security flags
   * Sorted by percentage in descending order
   * Requirement 20.5: Mark outdated TLS versions as high risk
   */
  const getTLSStats = (): TLSStats[] => {
    if (!data) return [];

    const { tls1_0, tls1_1, tls1_2, tls1_3, total } = data;

    const stats = [
      {
        name: 'TLS 1.0',
        version: '1.0',
        requests: tls1_0,
        percentage: calculatePercentage(tls1_0, total),
        color: '#e74c3c',
        description: 'Deprecated and insecure',
        isOutdated: true,
        isHighRisk: true,
      },
      {
        name: 'TLS 1.1',
        version: '1.1',
        requests: tls1_1,
        percentage: calculatePercentage(tls1_1, total),
        color: '#e67e22',
        description: 'Deprecated and insecure',
        isOutdated: true,
        isHighRisk: true,
      },
      {
        name: 'TLS 1.2',
        version: '1.2',
        requests: tls1_2,
        percentage: calculatePercentage(tls1_2, total),
        color: '#3498db',
        description: 'Secure and widely supported',
        isOutdated: false,
        isHighRisk: false,
      },
      {
        name: 'TLS 1.3',
        version: '1.3',
        requests: tls1_3,
        percentage: calculatePercentage(tls1_3, total),
        color: '#2ecc71',
        description: 'Latest and most secure',
        isOutdated: false,
        isHighRisk: false,
      },
    ];

    // Sort by percentage in descending order
    return stats.sort((a, b) => b.percentage - a.percentage);
  };

  /**
   * Check if insecure TLS versions exceed threshold
   * Requirement 20.3: Show warning when TLS 1.0/1.1 exceeds 5%
   */
  const hasInsecureTLSWarning = (): boolean => {
    if (!data) return false;
    return data.insecurePercentage > 5;
  };

  /**
   * Prepare data for pie chart
   * Requirement 20.2: Display as pie chart
   */
  const getChartData = (): PieChartDataItem[] => {
    const stats = getTLSStats().filter(s => s.requests > 0);
    return stats.map(s => ({
      name: s.name,
      value: s.requests,
      color: s.color,
      legendFontColor: '#333',
      legendFontSize: 12,
    }));
  };

  /**
   * Render loading state
   */
  if (loading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f6821f" />
        <Text style={styles.loadingText}>Loading TLS distribution...</Text>
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

  const tlsStats = getTLSStats();
  const showInsecureWarning = hasInsecureTLSWarning();
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
          <Text style={styles.title}>TLS Version Distribution</Text>
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

        {/* Insecure TLS Warning */}
        {showInsecureWarning && (
          <View style={styles.securityWarningBanner}>
            <Text style={styles.warningIcon}>🔒</Text>
            <View style={styles.warningContent}>
              <Text style={styles.securityWarningTitle}>Security Warning</Text>
              <Text style={styles.securityWarningText}>
                {formatPercentage(data?.insecurePercentage || 0)} of your traffic uses outdated TLS versions (1.0/1.1). 
                These versions are deprecated and vulnerable to attacks. Consider upgrading client connections to TLS 1.2 or 1.3.
              </Text>
            </View>
          </View>
        )}

        {/* Summary Card */}
        {data && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Requests</Text>
                <Text style={styles.summaryValue}>{formatNumber(data.total)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Insecure Traffic</Text>
                <Text style={[
                  styles.summaryValue,
                  data.insecurePercentage > 5 && styles.summaryValueDanger
                ]}>
                  {formatPercentage(data.insecurePercentage)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Pie Chart */}
        {data && data.total > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>TLS Version Distribution</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={getChartData()}
                width={screenWidth - 48}
                height={220}
                showPercentage={true}
              />
            </View>
          </View>
        )}

        {/* TLS Version Details List */}
        {tlsStats.length > 0 && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>TLS Version Details</Text>
            {tlsStats.map((tls) => (
              <View 
                key={tls.version} 
                style={[
                  styles.tlsCard,
                  tls.isHighRisk && styles.tlsCardHighRisk
                ]}
              >
                <View style={styles.tlsHeader}>
                  <View style={styles.tlsTitleRow}>
                    <View style={[styles.colorIndicator, { backgroundColor: tls.color }]} />
                    <Text style={styles.tlsName}>{tls.name}</Text>
                    {tls.isOutdated && (
                      <View style={styles.outdatedBadge}>
                        <Text style={styles.outdatedBadgeText}>OUTDATED</Text>
                      </View>
                    )}
                    {tls.isHighRisk && (
                      <View style={styles.highRiskBadge}>
                        <Text style={styles.highRiskBadgeText}>HIGH RISK</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.tlsPercentage,
                    tls.isHighRisk && styles.tlsPercentageDanger
                  ]}>
                    {formatPercentage(tls.percentage)}
                  </Text>
                </View>
                <Text style={[
                  styles.tlsDescription,
                  tls.isHighRisk && styles.tlsDescriptionDanger
                ]}>
                  {tls.description}
                </Text>
                <View style={styles.tlsStats}>
                  <View style={styles.tlsStatItem}>
                    <Text style={styles.tlsStatLabel}>Requests</Text>
                    <Text style={styles.tlsStatValue}>{formatNumber(tls.requests)}</Text>
                  </View>
                  <View style={styles.tlsStatItem}>
                    <Text style={styles.tlsStatLabel}>Percentage</Text>
                    <Text style={styles.tlsStatValue}>{formatPercentage(tls.percentage)}</Text>
                  </View>
                </View>
                {/* Progress bar */}
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${tls.percentage}%`,
                        backgroundColor: tls.color,
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
            <Text style={styles.emptyStateText}>No TLS data available</Text>
          </View>
        )}

        {/* Security Recommendations */}
        {data && data.insecurePercentage > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.recommendationsTitle}>🛡️ Security Recommendations</Text>
            <Text style={styles.recommendationsText}>
              • Disable TLS 1.0 and 1.1 in your server configuration{'\n'}
              • Encourage clients to upgrade to modern browsers{'\n'}
              • Enable TLS 1.3 for improved security and performance{'\n'}
              • Monitor and alert on insecure TLS usage{'\n'}
              • Consider implementing minimum TLS version policies
            </Text>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About TLS Versions</Text>
          <Text style={styles.infoText}>
            • TLS 1.0/1.1: Deprecated since 2020, vulnerable to attacks{'\n'}
            • TLS 1.2: Secure and widely supported, recommended minimum{'\n'}
            • TLS 1.3: Latest version with improved security and performance
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
  securityWarningBanner: {
    backgroundColor: '#fee',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  securityWarningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c0392b',
    marginBottom: 4,
  },
  securityWarningText: {
    fontSize: 14,
    color: '#e74c3c',
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
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryValueDanger: {
    color: '#e74c3c',
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
  detailsSection: {
    marginBottom: 20,
  },
  tlsCard: {
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
  tlsCardHighRisk: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  tlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tlsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  tlsName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  outdatedBadge: {
    backgroundColor: '#e67e22',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  outdatedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  highRiskBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  highRiskBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  tlsPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f6821f',
  },
  tlsPercentageDanger: {
    color: '#e74c3c',
  },
  tlsDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  tlsDescriptionDanger: {
    color: '#e74c3c',
    fontWeight: '500',
  },
  tlsStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tlsStatItem: {
    flex: 1,
  },
  tlsStatLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  tlsStatValue: {
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
  recommendationsSection: {
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  recommendationsText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 22,
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
