/**
 * StatusCodesScreen
 * Displays HTTP status code distribution with pie chart and detailed list
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
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
  FlatList,
} from 'react-native';
import { useStatusCodes } from '../hooks/useStatusCodes';
import { useZone } from '../contexts';
import { MetricsQueryParams } from '../types';
import { PieChart, PieChartDataItem, ExportButton } from '../components';
import { useTheme } from '../contexts/ThemeContext';

interface StatusCodesScreenProps {
  zoneId?: string;
  zoneName?: string;
}

// Status code category colors
const STATUS_COLORS = {
  '2xx': '#27ae60', // Green for success
  '3xx': '#3498db', // Blue for redirects
  '4xx': '#f39c12', // Orange for client errors
  '5xx': '#e74c3c', // Red for server errors
  other: '#95a5a6', // Gray for other
};

export default function StatusCodesScreen({ zoneId: propZoneId, zoneName: propZoneName }: StatusCodesScreenProps) {
  const { colors } = useTheme();
  // Get zoneId and zoneName from context if not provided as props
  const { zoneId: contextZoneId, zoneName: contextZoneName } = useZone();
  const zoneId = propZoneId || contextZoneId;
  const zoneName = propZoneName || contextZoneName || 'Unknown Zone';

  // If no zone is selected, show message
  if (!zoneId) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.error }]}>No Zone Selected</Text>
        <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
          Please select a zone from the home screen to view status codes.
        </Text>
      </View>
    );
  }

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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

  // Query parameters - memoized to prevent infinite loops
  const params: MetricsQueryParams = useMemo(() => ({
    zoneId,
    ...dateRanges,
  }), [zoneId, dateRanges]);

  // Fetch status code data
  const {
    data,
    loading,
    error,
    refresh,
    lastRefreshTime,
    isFromCache,
  } = useStatusCodes(params);

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
   * Prepare pie chart data from status code data
   * Requirement 3.3: Display status codes as pie chart
   * Requirement 3.4: Show percentage labels
   */
  const preparePieChartData = (): PieChartDataItem[] => {
    if (!data) return [];

    return [
      {
        name: '2xx Success',
        value: data.status2xx,
        color: STATUS_COLORS['2xx'],
      },
      {
        name: '3xx Redirect',
        value: data.status3xx,
        color: STATUS_COLORS['3xx'],
      },
      {
        name: '4xx Client Error',
        value: data.status4xx,
        color: STATUS_COLORS['4xx'],
      },
      {
        name: '5xx Server Error',
        value: data.status5xx,
        color: STATUS_COLORS['5xx'],
      },
    ].filter((item) => item.value > 0); // Only show categories with data
  };

  /**
   * Get detailed breakdown for a category
   */
  const getCategoryBreakdown = (category: string): Array<{ code: string; count: number }> => {
    if (!data || !data.breakdown) return [];

    const categoryPrefix = category.replace('xx', '');
    return Object.entries(data.breakdown)
      .filter(([code]) => code.startsWith(categoryPrefix))
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  };

  /**
   * Handle slice click
   * Requirement 3.5: Show details when clicking pie chart slice
   */
  const handleSliceClick = (item: PieChartDataItem) => {
    const categoryMap: { [key: string]: string } = {
      '2xx Success': '2xx',
      '3xx Redirect': '3xx',
      '4xx Client Error': '4xx',
      '5xx Server Error': '5xx',
    };
    setSelectedCategory(categoryMap[item.name] || null);
  };

  /**
   * Format number with commas
   */
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  /**
   * Calculate percentage
   * Requirement 3.2: Calculate status code percentages
   */
  const calculatePercentage = (value: number): string => {
    if (!data || data.total === 0) return '0.0%';
    return `${((value / data.total) * 100).toFixed(2)}%`;
  };

  /**
   * Get status code description
   */
  const getStatusCodeDescription = (code: string): string => {
    const descriptions: { [key: string]: string } = {
      '200': 'OK',
      '201': 'Created',
      '204': 'No Content',
      '301': 'Moved Permanently',
      '302': 'Found',
      '304': 'Not Modified',
      '400': 'Bad Request',
      '401': 'Unauthorized',
      '403': 'Forbidden',
      '404': 'Not Found',
      '429': 'Too Many Requests',
      '500': 'Internal Server Error',
      '502': 'Bad Gateway',
      '503': 'Service Unavailable',
      '504': 'Gateway Timeout',
    };
    return descriptions[code] || 'Unknown';
  };

  /**
   * Render category summary card
   */
  const renderCategoryCard = (
    title: string,
    value: number,
    color: string,
    category: string
  ) => {
    const percentage = calculatePercentage(value);
    const isSelected = selectedCategory === category;

    return (
      <TouchableOpacity
        style={[
          styles.categoryCard,
          isSelected && styles.categoryCardSelected,
        ]}
        onPress={() => setSelectedCategory(isSelected ? null : category)}
      >
        <View style={[styles.categoryIndicator, { backgroundColor: color }]} />
        <View style={[styles.categoryContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.categoryTitle, { color: colors.textSecondary }]}>{title}</Text>
          <Text style={[styles.categoryValue, { color: colors.text }]}>{formatNumber(value)}</Text>
          <Text style={[styles.categoryPercentage, { color: colors.textDisabled }]}>{percentage}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render detailed breakdown list
   * Requirement 3.1: Display detailed status code list
   */
  const renderBreakdownItem = ({ item }: { item: { code: string; count: number } }) => {
    const percentage = calculatePercentage(item.count);
    const description = getStatusCodeDescription(item.code);

    return (
      <View style={[styles.breakdownItem, { borderBottomColor: colors.border }]}>
        <View style={styles.breakdownLeft}>
          <Text style={[styles.breakdownCode, { color: colors.text }]}>{item.code}</Text>
          <Text style={[styles.breakdownDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <View style={styles.breakdownRight}>
          <Text style={[styles.breakdownCount, { color: colors.text }]}>{formatNumber(item.count)}</Text>
          <Text style={[styles.breakdownPercentage, { color: colors.textDisabled }]}>{percentage}</Text>
        </View>
      </View>
    );
  };

  /**
   * Render loading state
   */
  if (loading && !data) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading status codes...</Text>
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

  const pieChartData = preparePieChartData();
  const breakdownData = selectedCategory ? getCategoryBreakdown(selectedCategory) : [];

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
            <Text style={[styles.title, { color: colors.text }]}>HTTP Status Codes</Text>
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
            exportType="status-codes"
            zoneId={zoneId}
            zoneName={zoneName}
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
      </View>

      {/* Error banner if partial data */}
      {error && data && (
        <View style={[styles.errorBanner, { backgroundColor: colors.warning + '20', borderLeftColor: colors.primary }]}>
          <Text style={[styles.errorBannerText, { color: colors.text }]}>⚠️ {error}</Text>
        </View>
      )}

      {/* Total Requests */}
      {data && (
        <View style={[styles.totalCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Requests</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>{formatNumber(data.total)}</Text>
        </View>
      )}

      {/* Pie Chart */}
      {pieChartData.length > 0 && (
        <View style={[styles.chartSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Distribution Overview</Text>
          <PieChart
            data={pieChartData}
            showPercentage={true}
            onSliceClick={handleSliceClick}
          />
        </View>
      )}

      {/* Category Cards */}
      {data && (
        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
          <View style={styles.categoriesGrid}>
            {renderCategoryCard('2xx Success', data.status2xx, STATUS_COLORS['2xx'], '2xx')}
            {renderCategoryCard('3xx Redirect', data.status3xx, STATUS_COLORS['3xx'], '3xx')}
            {renderCategoryCard('4xx Client Error', data.status4xx, STATUS_COLORS['4xx'], '4xx')}
            {renderCategoryCard('5xx Server Error', data.status5xx, STATUS_COLORS['5xx'], '5xx')}
          </View>
        </View>
      )}

      {/* Detailed Breakdown */}
      {selectedCategory && breakdownData.length > 0 && (
        <View style={[styles.breakdownSection, { backgroundColor: colors.surface }]}>
          <View style={styles.breakdownHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{selectedCategory} Details</Text>
            <TouchableOpacity onPress={() => setSelectedCategory(null)}>
              <Text style={[styles.closeButton, { color: colors.textDisabled }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={breakdownData}
            renderItem={renderBreakdownItem}
            keyExtractor={(item) => item.code}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Info Section */}
      <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Tap on a category card to view detailed status code breakdown.
          Pull down to refresh data.
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
  totalCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 32,
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
  categoriesSection: {
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  categoryCard: {
    width: '50%',
    padding: 8,
  },
  categoryCardSelected: {
    transform: [{ scale: 0.98 }],
  },
  categoryIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 4,
    height: '100%',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  categoryContent: {
    borderRadius: 12,
    padding: 16,
    paddingLeft: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTitle: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  categoryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  categoryPercentage: {
    fontSize: 14,
  },
  breakdownSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  breakdownLeft: {
    flex: 1,
  },
  breakdownCode: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  breakdownDescription: {
    fontSize: 13,
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownCount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  breakdownPercentage: {
    fontSize: 13,
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
