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
import { PieChart, PieChartDataItem, ExportButton } from '../components/PieChart';
import { useTheme } from '../contexts/ThemeContext';

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
  const { colors } = useTheme();
  const { zoneId, zoneName, accountTag } = useZone();
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
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));
  };

  /**
   * Render loading state
   */
  if (loading && !data) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading TLS distribution...</Text>
      </View>
    );
  }

  /**
   * Render error state
   */
  if (error && !data) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.error }]}>Unable to Load Data</Text>
        <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tlsStats = getTLSStats();
  const showInsecureWarning = hasInsecureTLSWarning();
  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.text }]}>TLS Version Distribution</Text>
            {lastRefreshTime && (
              <Text style={[styles.lastUpdate, { color: colors.textSecondary }]}>
                Last updated: {lastRefreshTime.toLocaleTimeString()}
              </Text>
            )}
            {isFromCache && (
              <Text style={[styles.cacheIndicator, { color: colors.primary }]}>📦 Showing cached data</Text>
            )}
          </View>
          <ExportButton
            exportType="tls"
            zoneId={zoneId || ''}
            zoneName={zoneName || 'Unknown Zone'}
            accountTag={accountTag}
            startDate={dateRanges.startDate}
            endDate={dateRanges.endDate}
            disabled={!data}
          />
        </View>

        {/* Time Range Selector */}
        <View style={[styles.timeRangeSelector, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.timeRangeButton, timeRange === '24h' && { backgroundColor: colors.primary }]}
            onPress={() => setTimeRange('24h')}
          >
            <Text style={[styles.timeRangeButtonText, { color: timeRange === '24h' ? '#fff' : colors.textSecondary }]}>
              24H
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeRangeButton, timeRange === '7d' && { backgroundColor: colors.primary }]}
            onPress={() => setTimeRange('7d')}
          >
            <Text style={[styles.timeRangeButtonText, { color: timeRange === '7d' ? '#fff' : colors.textSecondary }]}>
              7D
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeRangeButton, timeRange === '30d' && { backgroundColor: colors.primary }]}
            onPress={() => setTimeRange('30d')}
          >
            <Text style={[styles.timeRangeButtonText, { color: timeRange === '30d' ? '#fff' : colors.textSecondary }]}>
              30D
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error banner if partial data */}
        {error && data && (
          <View style={[styles.errorBanner, { backgroundColor: colors.warning + '20', borderLeftColor: colors.warning }]}>
            <Text style={[styles.errorBannerText, { color: colors.text }]}>⚠️ {error}</Text>
          </View>
        )}

        {/* Insecure TLS Warning */}
        {showInsecureWarning && (
          <View style={[styles.securityWarningBanner, { backgroundColor: colors.error + '20', borderLeftColor: colors.error }]}>
            <Text style={styles.warningIcon}>🔒</Text>
            <View style={styles.warningContent}>
              <Text style={[styles.securityWarningTitle, { color: colors.error }]}>Security Warning</Text>
              <Text style={[styles.securityWarningText, { color: colors.error }]}>
                {formatPercentage(data?.insecurePercentage || 0)} of your traffic uses outdated TLS versions (1.0/1.1). 
                These versions are deprecated and vulnerable to attacks. Consider upgrading client connections to TLS 1.2 or 1.3.
              </Text>
            </View>
          </View>
        )}

        {/* Summary Card */}
        {data && (
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Requests</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{formatNumber(data.total)}</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Insecure Traffic</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: data.insecurePercentage > 5 ? colors.error : colors.text }
                ]}>
                  {formatPercentage(data.insecurePercentage)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Pie Chart */}
        {data && data.total > 0 && (
          <View style={[styles.chartSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>TLS Version Distribution</Text>
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>TLS Version Details</Text>
            {tlsStats.map((tls) => (
              <View 
                key={tls.version} 
                style={[
                  styles.tlsCard,
                  { backgroundColor: colors.surface },
                  tls.isHighRisk && { borderLeftWidth: 4, borderLeftColor: colors.error }
                ]}
              >
                <View style={styles.tlsHeader}>
                  <View style={styles.tlsTitleRow}>
                    <View style={[styles.colorIndicator, { backgroundColor: tls.color }]} />
                    <Text style={[styles.tlsName, { color: colors.text }]}>{tls.name}</Text>
                    {tls.isOutdated && (
                      <View style={[styles.outdatedBadge, { backgroundColor: colors.warning }]}>
                        <Text style={styles.outdatedBadgeText}>OUTDATED</Text>
                      </View>
                    )}
                    {tls.isHighRisk && (
                      <View style={[styles.highRiskBadge, { backgroundColor: colors.error }]}>
                        <Text style={styles.highRiskBadgeText}>HIGH RISK</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.tlsPercentage,
                    { color: tls.isHighRisk ? colors.error : colors.primary }
                  ]}>
                    {formatPercentage(tls.percentage)}
                  </Text>
                </View>
                <Text style={[
                  styles.tlsDescription,
                  { color: tls.isHighRisk ? colors.error : colors.textSecondary }
                ]}>
                  {tls.description}
                </Text>
                <View style={styles.tlsStats}>
                  <View style={styles.tlsStatItem}>
                    <Text style={[styles.tlsStatLabel, { color: colors.textDisabled }]}>Requests</Text>
                    <Text style={[styles.tlsStatValue, { color: colors.text }]}>{formatNumber(tls.requests)}</Text>
                  </View>
                  <View style={styles.tlsStatItem}>
                    <Text style={[styles.tlsStatLabel, { color: colors.textDisabled }]}>Percentage</Text>
                    <Text style={[styles.tlsStatValue, { color: colors.text }]}>{formatPercentage(tls.percentage)}</Text>
                  </View>
                </View>
                {/* Progress bar */}
                <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
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
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyStateText, { color: colors.textDisabled }]}>No TLS data available</Text>
          </View>
        )}

        {/* Security Recommendations */}
        {data && data.insecurePercentage > 0 && (
          <View style={[styles.recommendationsSection, { backgroundColor: colors.info + '20', borderLeftColor: colors.info }]}>
            <Text style={[styles.recommendationsTitle, { color: colors.text }]}>🛡️ Security Recommendations</Text>
            <Text style={[styles.recommendationsText, { color: colors.textSecondary }]}>
              • Disable TLS 1.0 and 1.1 in your server configuration{'\n'}
              • Encourage clients to upgrade to modern browsers{'\n'}
              • Enable TLS 1.3 for improved security and performance{'\n'}
              • Monitor and alert on insecure TLS usage{'\n'}
              • Consider implementing minimum TLS version policies
            </Text>
          </View>
        )}

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>About TLS Versions</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
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
  },
  header: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  timeRangeSelector: {
    flexDirection: 'row',
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
  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lastUpdate: {
    fontSize: 14,
    marginTop: 4,
  },
  cacheIndicator: {
    fontSize: 13,
    marginTop: 4,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorBanner: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  errorBannerText: {
    fontSize: 14,
  },
  securityWarningBanner: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    borderLeftWidth: 4,
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
    marginBottom: 4,
  },
  securityWarningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
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
    marginHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chartSection: {
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
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  detailsSection: {
    marginBottom: 20,
  },
  tlsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginRight: 8,
  },
  outdatedBadge: {
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
  },
  tlsDescription: {
    fontSize: 14,
    marginBottom: 12,
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
    marginBottom: 4,
  },
  tlsStatValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  emptyState: {
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
  },
  recommendationsSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  recommendationsText: {
    fontSize: 14,
    lineHeight: 22,
  },
  infoSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
