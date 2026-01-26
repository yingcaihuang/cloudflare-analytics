/**
 * SecurityScreen
 * Displays security and cache metrics including cache hit rate, firewall events,
 * bot scores, and threat scores with prominent highlighting for high values
 * Requirements: 4.1, 4.2, 4.3, 4.4
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
import { useSecurityMetrics } from '../hooks/useSecurityMetrics';
import { MetricsQueryParams } from '../types';
import { SecurityEventTrendChart } from '../components';
import { ExportManager } from '../services';
import { useTheme } from '../contexts/ThemeContext';

interface SecurityScreenProps {
  zoneId: string;
  zoneName?: string;
}

export default function SecurityScreen({ zoneId, zoneName = 'Unknown Zone' }: SecurityScreenProps) {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Calculate date ranges based on selected time range
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

    return { startDate, endDate, granularity };
  }, [timeRange]);

  // Query parameters for today - memoized to prevent infinite loops
  const todayParams: MetricsQueryParams = useMemo(() => ({
    zoneId,
    ...dateRanges,
  }), [zoneId, dateRanges]);

  // Fetch security metrics
  const {
    data,
    loading,
    error,
    refresh,
    lastRefreshTime,
    isFromCache,
  } = useSecurityMetrics(todayParams);

  /**
   * Handle pull-to-refresh
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
   * Handle data export
   * Requirement 17.1, 17.3: Export security metrics to CSV
   */
  const handleExport = async () => {
    if (!data) {
      Alert.alert('No Data', 'No security data available to export.');
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

      const timeRangeObj = { start: dateRanges.startDate, end: dateRanges.endDate };
      await ExportManager.exportSecurityMetrics(data, zone, timeRangeObj);
      Alert.alert('Success', 'Security data exported successfully!');
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
   * Calculate cache hit rate percentage
   * Requirement 4.2: Display cache hit rate percentage
   */
  const calculateCacheHitRate = (): number => {
    if (!data) return 0;
    const { hit, miss, expired, stale } = data.cacheStatus;
    const total = hit + miss + expired + stale;
    if (total === 0) return 0;
    return (hit / total) * 100;
  };

  /**
   * Determine if a score is high (above threshold)
   * Requirement 4.4: Highlight high scores prominently
   */
  const isHighScore = (score: number): boolean => {
    return score > 80;
  };

  /**
   * Format large numbers for display
   */
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toString();
  };

  /**
   * Render loading state
   */
  if (loading && !data) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading security metrics...</Text>
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

  if (!data) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>No data available</Text>
      </View>
    );
  }

  const cacheHitRate = calculateCacheHitRate();
  const botScoreHigh = isHighScore(data.botScore.average);
  const threatScoreHigh = isHighScore(data.threatScore.average);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
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
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.text }]}>Security & Cache</Text>
            {lastRefreshTime && (
              <Text style={[styles.lastUpdate, { color: colors.textSecondary }]}>
                Last updated: {lastRefreshTime.toLocaleTimeString()}
              </Text>
            )}
            {isFromCache && (
              <Text style={[styles.cacheIndicator, { color: colors.primary }]}>📦 Showing cached data</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: colors.primary }, exporting && styles.exportButtonDisabled]}
            onPress={handleExport}
            disabled={exporting || !data}
          >
            <Text style={styles.exportButtonText}>
              {exporting ? '⏳' : '📤'} Export
            </Text>
          </TouchableOpacity>
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
      </View>

      {/* Error banner if partial data */}
      {error && data && (
        <View style={[styles.errorBanner, { backgroundColor: colors.warning + '20', borderLeftColor: colors.primary }]}>
          <Text style={[styles.errorBannerText, { color: colors.text }]}>⚠️ {error}</Text>
        </View>
      )}

      {/* Cache Status Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Cache Performance</Text>
        
        {/* Cache Hit Rate - Requirement 4.2 */}
        <View style={[styles.largeMetricCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.largeMetricLabel, { color: colors.textSecondary }]}>Cache Hit Rate</Text>
          <Text style={[styles.largeMetricValue, { color: colors.text }]}>
            {cacheHitRate.toFixed(1)}%
          </Text>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${cacheHitRate}%`, backgroundColor: colors.success }
              ]} 
            />
          </View>
        </View>

        {/* Cache Status Breakdown */}
        <View style={styles.metricsGrid}>
          <View style={[styles.smallMetricCard, { backgroundColor: colors.success + '20' }]}>
            <Text style={[styles.smallMetricValue, { color: colors.success }]}>
              {formatNumber(data.cacheStatus.hit)}
            </Text>
            <Text style={[styles.smallMetricLabel, { color: colors.textSecondary }]}>Hits</Text>
          </View>
          <View style={[styles.smallMetricCard, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.smallMetricValue, { color: colors.error }]}>
              {formatNumber(data.cacheStatus.miss)}
            </Text>
            <Text style={[styles.smallMetricLabel, { color: colors.textSecondary }]}>Misses</Text>
          </View>
          <View style={[styles.smallMetricCard, { backgroundColor: colors.warning + '20' }]}>
            <Text style={[styles.smallMetricValue, { color: colors.warning }]}>
              {formatNumber(data.cacheStatus.expired)}
            </Text>
            <Text style={[styles.smallMetricLabel, { color: colors.textSecondary }]}>Expired</Text>
          </View>
          <View style={[styles.smallMetricCard, { backgroundColor: colors.textDisabled + '20' }]}>
            <Text style={[styles.smallMetricValue, { color: colors.textSecondary }]}>
              {formatNumber(data.cacheStatus.stale)}
            </Text>
            <Text style={[styles.smallMetricLabel, { color: colors.textSecondary }]}>Stale</Text>
          </View>
        </View>
      </View>

      {/* Firewall Events Section - Requirement 4.3 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Firewall Events</Text>
        
        {/* Total Events */}
        <View style={[styles.largeMetricCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.largeMetricLabel, { color: colors.textSecondary }]}>Total Events</Text>
          <Text style={[styles.largeMetricValue, { color: colors.text }]}>
            {formatNumber(data.firewallEvents.total)}
          </Text>
        </View>

        {/* Firewall Events Breakdown */}
        <View style={styles.metricsGrid}>
          <View style={[styles.smallMetricCard, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.smallMetricValue, { color: colors.error }]}>
              {formatNumber(data.firewallEvents.blocked)}
            </Text>
            <Text style={[styles.smallMetricLabel, { color: colors.textSecondary }]}>Blocked</Text>
          </View>
          <View style={[styles.smallMetricCard, { backgroundColor: colors.warning + '20' }]}>
            <Text style={[styles.smallMetricValue, { color: colors.warning }]}>
              {formatNumber(data.firewallEvents.challenged)}
            </Text>
            <Text style={[styles.smallMetricLabel, { color: colors.textSecondary }]}>Challenged</Text>
          </View>
          <View style={[styles.smallMetricCard, { backgroundColor: colors.success + '20' }]}>
            <Text style={[styles.smallMetricValue, { color: colors.success }]}>
              {formatNumber(data.firewallEvents.allowed)}
            </Text>
            <Text style={[styles.smallMetricLabel, { color: colors.textSecondary }]}>Allowed</Text>
          </View>
        </View>
      </View>

      {/* Bot Score Section - Requirement 4.4 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Bot Detection</Text>
        
        <View style={[
          styles.largeMetricCard,
          { backgroundColor: colors.surface },
          botScoreHigh && { borderWidth: 2, borderColor: colors.error, backgroundColor: colors.error + '10' }
        ]}>
          <View style={styles.scoreHeader}>
            <Text style={[styles.largeMetricLabel, { color: colors.textSecondary }]}>Average Bot Score</Text>
            {botScoreHigh && (
              <View style={[styles.warningBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.warningBadgeText}>⚠️ HIGH</Text>
              </View>
            )}
          </View>
          <Text style={[
            styles.largeMetricValue,
            { color: botScoreHigh ? colors.error : colors.text }
          ]}>
            {data.botScore.average.toFixed(1)}
          </Text>
          <Text style={[styles.scoreSubtext, { color: colors.textDisabled }]}>
            Score range: 0 (human) - 100 (bot)
          </Text>
        </View>

        {/* Bot Score Distribution */}
        {data.botScore.distribution.length > 0 && (
          <View style={[styles.distributionContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.distributionTitle, { color: colors.textSecondary }]}>Distribution by Range</Text>
            {data.botScore.distribution.map((item, index) => (
              <View key={index} style={[styles.distributionItem, { borderBottomColor: colors.border }]}>
                <Text style={[styles.distributionRange, { color: colors.text }]}>{item.range}</Text>
                <Text style={[styles.distributionCount, { color: colors.textSecondary }]}>
                  {formatNumber(item.count)} requests
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Threat Score Section - Requirement 4.4 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Threat Analysis</Text>
        
        <View style={[
          styles.largeMetricCard,
          { backgroundColor: colors.surface },
          threatScoreHigh && { borderWidth: 2, borderColor: colors.error, backgroundColor: colors.error + '10' }
        ]}>
          <View style={styles.scoreHeader}>
            <Text style={[styles.largeMetricLabel, { color: colors.textSecondary }]}>Average Threat Score</Text>
            {threatScoreHigh && (
              <View style={[styles.warningBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.warningBadgeText}>⚠️ HIGH</Text>
              </View>
            )}
          </View>
          <Text style={[
            styles.largeMetricValue,
            { color: threatScoreHigh ? colors.error : colors.text }
          ]}>
            {data.threatScore.average.toFixed(1)}
          </Text>
          <Text style={[styles.scoreSubtext, { color: colors.textDisabled }]}>
            Score range: 0 (safe) - 100 (threat)
          </Text>
        </View>

        {/* Threat Score Breakdown */}
        <View style={styles.metricsGrid}>
          <View style={[styles.smallMetricCard, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.smallMetricValue, { color: colors.error }]}>
              {formatNumber(data.threatScore.high)}
            </Text>
            <Text style={[styles.smallMetricLabel, { color: colors.textSecondary }]}>High (&gt;80)</Text>
          </View>
          <View style={[styles.smallMetricCard, { backgroundColor: colors.warning + '20' }]}>
            <Text style={[styles.smallMetricValue, { color: colors.warning }]}>
              {formatNumber(data.threatScore.medium)}
            </Text>
            <Text style={[styles.smallMetricLabel, { color: colors.textSecondary }]}>Medium (40-80)</Text>
          </View>
          <View style={[styles.smallMetricCard, { backgroundColor: colors.success + '20' }]}>
            <Text style={[styles.smallMetricValue, { color: colors.success }]}>
              {formatNumber(data.threatScore.low)}
            </Text>
            <Text style={[styles.smallMetricLabel, { color: colors.textSecondary }]}>Low (&lt;40)</Text>
          </View>
        </View>
      </View>

      {/* Security Event Trend Chart - Requirement 4.5 */}
      {data.timeSeries && data.timeSeries.length > 0 && (
        <SecurityEventTrendChart timeSeries={data.timeSeries} />
      )}

      {/* Info Section */}
      <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Pull down to refresh data. High bot and threat scores (&gt;80) are highlighted for attention.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  timeRangeSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    marginTop: 12,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  largeMetricCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  largeMetricLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  largeMetricValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  smallMetricCard: {
    width: '33.33%',
    padding: 6,
    borderRadius: 8,
  },
  smallMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  smallMetricLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  warningBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreSubtext: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  distributionContainer: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  distributionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  distributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  distributionRange: {
    fontSize: 14,
    fontWeight: '500',
  },
  distributionCount: {
    fontSize: 14,
  },
  infoSection: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
