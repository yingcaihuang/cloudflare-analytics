/**
 * ContentTypeScreen
 * Displays content type distribution with Top 10 display
 * Requirements: 21.1, 21.2, 21.3, 21.4, 21.5
 */

import React, { useState } from 'react';
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
import { useContentTypeDistribution } from '../hooks/useContentTypeDistribution';
import { MetricsQueryParams } from '../types';
import { PieChart } from '../components';

interface ContentTypeScreenProps {
  zoneId: string;
}

interface ContentTypeStats {
  contentType: string;
  displayName: string;
  requests: number;
  bytes: number;
  percentage: number;
  color: string;
}

export default function ContentTypeScreen({ zoneId }: ContentTypeScreenProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Get today's date range
  const getTodayRange = (): { startDate: Date; endDate: Date } => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    return { startDate: startOfDay, endDate: now };
  };

  // Query parameters
  const params: MetricsQueryParams = {
    zoneId,
    ...getTodayRange(),
    granularity: 'hour',
  };

  // Fetch content type distribution data
  const {
    data,
    loading,
    error,
    refresh,
    lastRefreshTime,
    isFromCache,
  } = useContentTypeDistribution(params);

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
   * Format number with commas
   */
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  /**
   * Format bytes to human-readable format
   */
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  /**
   * Format percentage
   */
  const formatPercentage = (percentage: number): string => {
    return `${percentage.toFixed(2)}%`;
  };

  /**
   * Get friendly display name for content type
   */
  const getDisplayName = (contentType: string): string => {
    const typeMap: { [key: string]: string } = {
      'text/html': 'HTML',
      'text/css': 'CSS',
      'text/javascript': 'JavaScript',
      'application/javascript': 'JavaScript',
      'application/json': 'JSON',
      'image/jpeg': 'JPEG Image',
      'image/png': 'PNG Image',
      'image/gif': 'GIF Image',
      'image/svg+xml': 'SVG Image',
      'image/webp': 'WebP Image',
      'video/mp4': 'MP4 Video',
      'video/webm': 'WebM Video',
      'application/pdf': 'PDF',
      'application/xml': 'XML',
      'text/xml': 'XML',
      'application/octet-stream': 'Binary',
      'font/woff': 'WOFF Font',
      'font/woff2': 'WOFF2 Font',
      'font/ttf': 'TrueType Font',
      'font/otf': 'OpenType Font',
      'unknown': 'Unknown',
    };

    return typeMap[contentType] || contentType;
  };

  /**
   * Get color for content type
   */
  const getColor = (index: number): string => {
    const colors = [
      '#3498db', // Blue
      '#2ecc71', // Green
      '#f39c12', // Orange
      '#9b59b6', // Purple
      '#e74c3c', // Red
      '#1abc9c', // Turquoise
      '#34495e', // Dark Gray
      '#e67e22', // Carrot
      '#95a5a6', // Gray
      '#16a085', // Green Sea
    ];
    return colors[index % colors.length];
  };

  /**
   * Get content type statistics with display names and colors
   * Requirement 21.5: Sort by requests descending (Top N)
   */
  const getContentTypeStats = (): ContentTypeStats[] => {
    if (!data || !data.types) return [];

    return data.types.map((type, index) => ({
      contentType: type.contentType,
      displayName: getDisplayName(type.contentType),
      requests: type.requests,
      bytes: type.bytes,
      percentage: type.percentage,
      color: getColor(index),
    }));
  };

  /**
   * Get Top 10 content types
   * Requirement 21.3: Display Top 10
   */
  const getTop10 = (): ContentTypeStats[] => {
    const stats = getContentTypeStats();
    return stats.slice(0, 10);
  };

  /**
   * Prepare data for pie chart
   * Requirement 21.2: Display as pie chart
   */
  const getChartData = () => {
    const top10 = getTop10();
    return top10.map((stat) => ({
      name: stat.displayName,
      value: stat.requests,
      color: stat.color,
      legendFontColor: '#333',
      legendFontSize: 12,
    }));
  };

  /**
   * Calculate total requests and bytes
   */
  const getTotals = () => {
    if (!data || !data.types) return { requests: 0, bytes: 0 };
    
    return data.types.reduce(
      (acc, type) => ({
        requests: acc.requests + type.requests,
        bytes: acc.bytes + type.bytes,
      }),
      { requests: 0, bytes: 0 }
    );
  };

  /**
   * Render loading state
   */
  if (loading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f6821f" />
        <Text style={styles.loadingText}>Loading content type distribution...</Text>
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

  const contentTypeStats = getContentTypeStats();
  const top10Stats = getTop10();
  const displayStats = showAll ? contentTypeStats : top10Stats;
  const totals = getTotals();
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
          <Text style={styles.title}>Content Type Distribution</Text>
          {lastRefreshTime && (
            <Text style={styles.lastUpdate}>
              Last updated: {lastRefreshTime.toLocaleTimeString()}
            </Text>
          )}
          {isFromCache && (
            <Text style={styles.cacheIndicator}>📦 Showing cached data</Text>
          )}
        </View>

        {/* Error banner if partial data */}
        {error && data && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Summary Cards */}
        {data && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Requests</Text>
              <Text style={styles.summaryValue}>{formatNumber(totals.requests)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Bytes</Text>
              <Text style={styles.summaryValue}>{formatBytes(totals.bytes)}</Text>
            </View>
          </View>
        )}

        {/* Pie Chart - Top 10 */}
        {data && contentTypeStats.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Top 10 Content Types</Text>
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

        {/* Content Type Details List */}
        {displayStats.length > 0 && (
          <View style={styles.detailsSection}>
            <View style={styles.detailsHeader}>
              <Text style={styles.sectionTitle}>
                {showAll ? 'All Content Types' : 'Top 10 Content Types'}
              </Text>
              {contentTypeStats.length > 10 && (
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => setShowAll(!showAll)}
                >
                  <Text style={styles.toggleButtonText}>
                    {showAll ? 'Show Top 10' : `Show All (${contentTypeStats.length})`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {displayStats.map((type, index) => (
              <View key={type.contentType} style={styles.contentTypeCard}>
                <View style={styles.contentTypeHeader}>
                  <View style={styles.contentTypeTitleRow}>
                    <View style={[styles.colorIndicator, { backgroundColor: type.color }]} />
                    <View style={styles.contentTypeTitleContainer}>
                      <Text style={styles.contentTypeName}>{type.displayName}</Text>
                      <Text style={styles.contentTypeRaw}>{type.contentType}</Text>
                    </View>
                  </View>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                </View>
                
                {/* Stats Grid - Requirement 21.4: Display requests and bytes */}
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Requests</Text>
                    <Text style={styles.statValue}>{formatNumber(type.requests)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Bytes</Text>
                    <Text style={styles.statValue}>{formatBytes(type.bytes)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Percentage</Text>
                    <Text style={styles.statValue}>{formatPercentage(type.percentage)}</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${type.percentage}%`,
                        backgroundColor: type.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {data && contentTypeStats.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No content type data available</Text>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Content Types</Text>
          <Text style={styles.infoText}>
            Content types indicate the format of resources served by your website. Common types include:{'\n\n'}
            • HTML: Web pages{'\n'}
            • CSS/JavaScript: Stylesheets and scripts{'\n'}
            • Images: JPEG, PNG, GIF, WebP, SVG{'\n'}
            • Videos: MP4, WebM{'\n'}
            • Fonts: WOFF, WOFF2, TTF{'\n'}
            • Documents: PDF, JSON, XML
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
    marginBottom: 20,
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
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
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
  detailsSection: {
    marginBottom: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleButton: {
    backgroundColor: '#f6821f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  contentTypeCard: {
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
  contentTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  contentTypeTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    marginTop: 2,
  },
  contentTypeTitleContainer: {
    flex: 1,
  },
  contentTypeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  contentTypeRaw: {
    fontSize: 12,
    color: '#999',
  },
  rankBadge: {
    backgroundColor: '#f6821f',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
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
