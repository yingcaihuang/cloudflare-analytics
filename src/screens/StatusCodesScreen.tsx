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
  Alert,
} from 'react-native';
import { useStatusCodes } from '../hooks/useStatusCodes';
import { MetricsQueryParams } from '../types';
import { PieChart, PieChartDataItem } from '../components/PieChart';
import { ExportManager } from '../services';

interface StatusCodesScreenProps {
  zoneId: string;
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

export default function StatusCodesScreen({ zoneId, zoneName = 'Unknown Zone' }: StatusCodesScreenProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Get today's date range
  const getTodayRange = (): { startDate: Date; endDate: Date } => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    return { startDate: startOfDay, endDate: now };
  };

  // Query parameters - memoized to prevent infinite loops
  const params: MetricsQueryParams = useMemo(() => ({
    zoneId,
    ...getTodayRange(),
    granularity: 'hour',
  }), [zoneId]);

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
   * Handle data export
   * Requirement 17.1, 17.3: Export status code data to CSV
   */
  const handleExport = async () => {
    if (!data) {
      Alert.alert('No Data', 'No status code data available to export.');
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
      await ExportManager.exportStatusCodes(data, zone, timeRange);
      Alert.alert('Success', 'Status code data exported successfully!');
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
        <View style={styles.categoryContent}>
          <Text style={styles.categoryTitle}>{title}</Text>
          <Text style={styles.categoryValue}>{formatNumber(value)}</Text>
          <Text style={styles.categoryPercentage}>{percentage}</Text>
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
      <View style={styles.breakdownItem}>
        <View style={styles.breakdownLeft}>
          <Text style={styles.breakdownCode}>{item.code}</Text>
          <Text style={styles.breakdownDescription}>{description}</Text>
        </View>
        <View style={styles.breakdownRight}>
          <Text style={styles.breakdownCount}>{formatNumber(item.count)}</Text>
          <Text style={styles.breakdownPercentage}>{percentage}</Text>
        </View>
      </View>
    );
  };

  /**
   * Render loading state
   */
  if (loading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f6821f" />
        <Text style={styles.loadingText}>Loading status codes...</Text>
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

  const pieChartData = preparePieChartData();
  const breakdownData = selectedCategory ? getCategoryBreakdown(selectedCategory) : [];

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
            <Text style={styles.title}>HTTP Status Codes</Text>
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

      {/* Total Requests */}
      {data && (
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Requests</Text>
          <Text style={styles.totalValue}>{formatNumber(data.total)}</Text>
        </View>
      )}

      {/* Pie Chart */}
      {pieChartData.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Distribution Overview</Text>
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
          <Text style={styles.sectionTitle}>Categories</Text>
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
        <View style={styles.breakdownSection}>
          <View style={styles.breakdownHeader}>
            <Text style={styles.sectionTitle}>{selectedCategory} Details</Text>
            <TouchableOpacity onPress={() => setSelectedCategory(null)}>
              <Text style={styles.closeButton}>✕</Text>
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
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
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
  totalCard: {
    backgroundColor: '#fff',
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
    color: '#666',
    marginBottom: 8,
  },
  totalValue: {
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
    backgroundColor: '#fff',
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
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  categoryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#999',
  },
  breakdownSection: {
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
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
    fontWeight: 'bold',
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownLeft: {
    flex: 1,
  },
  breakdownCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  breakdownDescription: {
    fontSize: 13,
    color: '#666',
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  breakdownPercentage: {
    fontSize: 13,
    color: '#999',
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
