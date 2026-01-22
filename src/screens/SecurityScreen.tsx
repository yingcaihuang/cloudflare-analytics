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
import { SecurityEventTrendChart } from '../components/SecurityEventTrendChart';
import { ExportManager } from '../services';

interface SecurityScreenProps {
  zoneId: string;
  zoneName?: string;
}

export default function SecurityScreen({ zoneId, zoneName = 'Unknown Zone' }: SecurityScreenProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Get today's date range (start of day to now)
  const getTodayRange = (): { startDate: Date; endDate: Date } => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    return { startDate: startOfDay, endDate: now };
  };

  // Query parameters for today - memoized to prevent infinite loops
  const todayParams: MetricsQueryParams = useMemo(() => ({
    zoneId,
    ...getTodayRange(),
    granularity: 'hour',
  }), [zoneId]);

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

      const { startDate, endDate } = getTodayRange();
      const timeRange = { start: startDate, end: endDate };
      await ExportManager.exportSecurityMetrics(data, zone, timeRange);
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f6821f" />
        <Text style={styles.loadingText}>Loading security metrics...</Text>
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

  if (!data) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorMessage}>No data available</Text>
      </View>
    );
  }

  const cacheHitRate = calculateCacheHitRate();
  const botScoreHigh = isHighScore(data.botScore.average);
  const threatScoreHigh = isHighScore(data.threatScore.average);

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
            <Text style={styles.title}>Security & Cache</Text>
            {lastRefreshTime && (
              <Text style={styles.lastUpdate}>
                Last updated: {lastRefreshTime.toLocaleTimeString()}
              </Text>
            )}
            {isFromCache && (
              <Text style={styles.cacheIndicator}>📦 Showing cached data</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
            onPress={handleExport}
            disabled={exporting || !data}
          >
            <Text style={styles.exportButtonText}>
              {exporting ? '⏳' : '📤'} Export
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error banner if partial data */}
      {error && data && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Cache Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cache Performance</Text>
        
        {/* Cache Hit Rate - Requirement 4.2 */}
        <View style={styles.largeMetricCard}>
          <Text style={styles.largeMetricLabel}>Cache Hit Rate</Text>
          <Text style={styles.largeMetricValue}>
            {cacheHitRate.toFixed(1)}%
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${cacheHitRate}%` }
              ]} 
            />
          </View>
        </View>

        {/* Cache Status Breakdown */}
        <View style={styles.metricsGrid}>
          <View style={styles.smallMetricCard}>
            <Text style={styles.smallMetricValue}>
              {formatNumber(data.cacheStatus.hit)}
            </Text>
            <Text style={styles.smallMetricLabel}>Hits</Text>
          </View>
          <View style={styles.smallMetricCard}>
            <Text style={styles.smallMetricValue}>
              {formatNumber(data.cacheStatus.miss)}
            </Text>
            <Text style={styles.smallMetricLabel}>Misses</Text>
          </View>
          <View style={styles.smallMetricCard}>
            <Text style={styles.smallMetricValue}>
              {formatNumber(data.cacheStatus.expired)}
            </Text>
            <Text style={styles.smallMetricLabel}>Expired</Text>
          </View>
          <View style={styles.smallMetricCard}>
            <Text style={styles.smallMetricValue}>
              {formatNumber(data.cacheStatus.stale)}
            </Text>
            <Text style={styles.smallMetricLabel}>Stale</Text>
          </View>
        </View>
      </View>

      {/* Firewall Events Section - Requirement 4.3 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Firewall Events</Text>
        
        {/* Total Events */}
        <View style={styles.largeMetricCard}>
          <Text style={styles.largeMetricLabel}>Total Events</Text>
          <Text style={styles.largeMetricValue}>
            {formatNumber(data.firewallEvents.total)}
          </Text>
        </View>

        {/* Firewall Events Breakdown */}
        <View style={styles.metricsGrid}>
          <View style={[styles.smallMetricCard, styles.blockedCard]}>
            <Text style={[styles.smallMetricValue, styles.blockedText]}>
              {formatNumber(data.firewallEvents.blocked)}
            </Text>
            <Text style={styles.smallMetricLabel}>Blocked</Text>
          </View>
          <View style={[styles.smallMetricCard, styles.challengedCard]}>
            <Text style={[styles.smallMetricValue, styles.challengedText]}>
              {formatNumber(data.firewallEvents.challenged)}
            </Text>
            <Text style={styles.smallMetricLabel}>Challenged</Text>
          </View>
          <View style={[styles.smallMetricCard, styles.allowedCard]}>
            <Text style={[styles.smallMetricValue, styles.allowedText]}>
              {formatNumber(data.firewallEvents.allowed)}
            </Text>
            <Text style={styles.smallMetricLabel}>Allowed</Text>
          </View>
        </View>
      </View>

      {/* Bot Score Section - Requirement 4.4 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bot Detection</Text>
        
        <View style={[
          styles.largeMetricCard,
          botScoreHigh && styles.highScoreCard
        ]}>
          <View style={styles.scoreHeader}>
            <Text style={styles.largeMetricLabel}>Average Bot Score</Text>
            {botScoreHigh && (
              <View style={styles.warningBadge}>
                <Text style={styles.warningBadgeText}>⚠️ HIGH</Text>
              </View>
            )}
          </View>
          <Text style={[
            styles.largeMetricValue,
            botScoreHigh && styles.highScoreText
          ]}>
            {data.botScore.average.toFixed(1)}
          </Text>
          <Text style={styles.scoreSubtext}>
            Score range: 0 (human) - 100 (bot)
          </Text>
        </View>

        {/* Bot Score Distribution */}
        {data.botScore.distribution.length > 0 && (
          <View style={styles.distributionContainer}>
            <Text style={styles.distributionTitle}>Distribution by Range</Text>
            {data.botScore.distribution.map((item, index) => (
              <View key={index} style={styles.distributionItem}>
                <Text style={styles.distributionRange}>{item.range}</Text>
                <Text style={styles.distributionCount}>
                  {formatNumber(item.count)} requests
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Threat Score Section - Requirement 4.4 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Threat Analysis</Text>
        
        <View style={[
          styles.largeMetricCard,
          threatScoreHigh && styles.highScoreCard
        ]}>
          <View style={styles.scoreHeader}>
            <Text style={styles.largeMetricLabel}>Average Threat Score</Text>
            {threatScoreHigh && (
              <View style={styles.warningBadge}>
                <Text style={styles.warningBadgeText}>⚠️ HIGH</Text>
              </View>
            )}
          </View>
          <Text style={[
            styles.largeMetricValue,
            threatScoreHigh && styles.highScoreText
          ]}>
            {data.threatScore.average.toFixed(1)}
          </Text>
          <Text style={styles.scoreSubtext}>
            Score range: 0 (safe) - 100 (threat)
          </Text>
        </View>

        {/* Threat Score Breakdown */}
        <View style={styles.metricsGrid}>
          <View style={[styles.smallMetricCard, styles.highThreatCard]}>
            <Text style={[styles.smallMetricValue, styles.highThreatText]}>
              {formatNumber(data.threatScore.high)}
            </Text>
            <Text style={styles.smallMetricLabel}>High (&gt;80)</Text>
          </View>
          <View style={[styles.smallMetricCard, styles.mediumThreatCard]}>
            <Text style={[styles.smallMetricValue, styles.mediumThreatText]}>
              {formatNumber(data.threatScore.medium)}
            </Text>
            <Text style={styles.smallMetricLabel}>Medium (40-80)</Text>
          </View>
          <View style={[styles.smallMetricCard, styles.lowThreatCard]}>
            <Text style={[styles.smallMetricValue, styles.lowThreatText]}>
              {formatNumber(data.threatScore.low)}
            </Text>
            <Text style={styles.smallMetricLabel}>Low (&lt;40)</Text>
          </View>
        </View>
      </View>

      {/* Security Event Trend Chart - Requirement 4.5 */}
      {data.timeSeries && data.timeSeries.length > 0 && (
        <SecurityEventTrendChart timeSeries={data.timeSeries} />
      )}

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          Pull down to refresh data. High bot and threat scores (&gt;80) are highlighted for attention.
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  largeMetricCard: {
    backgroundColor: '#fff',
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
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  largeMetricValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#27ae60',
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
  },
  smallMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  smallMetricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  blockedCard: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
  },
  blockedText: {
    color: '#c62828',
  },
  challengedCard: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
  },
  challengedText: {
    color: '#ef6c00',
  },
  allowedCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
  },
  allowedText: {
    color: '#2e7d32',
  },
  highScoreCard: {
    borderWidth: 2,
    borderColor: '#e74c3c',
    backgroundColor: '#ffebee',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  warningBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  highScoreText: {
    color: '#e74c3c',
  },
  scoreSubtext: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  distributionContainer: {
    backgroundColor: '#fff',
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
    color: '#666',
    marginBottom: 12,
  },
  distributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  distributionRange: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  distributionCount: {
    fontSize: 14,
    color: '#666',
  },
  highThreatCard: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
  },
  highThreatText: {
    color: '#c62828',
  },
  mediumThreatCard: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
  },
  mediumThreatText: {
    color: '#ef6c00',
  },
  lowThreatCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
  },
  lowThreatText: {
    color: '#2e7d32',
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
