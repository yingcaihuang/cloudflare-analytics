/**
 * GeoDistributionScreen
 * Displays geographic distribution of traffic by country
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
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
  Modal,
} from 'react-native';
import { useGeoDistribution } from '../hooks/useGeoDistribution';
import { useZone } from '../contexts/ZoneContext';
import { MetricsQueryParams } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface CountryItem {
  code: string;
  name: string;
  requests: number;
  bytes: number;
  percentage: number;
}

export default function GeoDistributionScreen() {
  const { colors } = useTheme();
  const { zoneId, accountTag } = useZone();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryItem | null>(null);
  const [showTopOnly, setShowTopOnly] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  console.log('[GeoDistributionScreen] Component mounted/updated');
  console.log('[GeoDistributionScreen] zoneId:', zoneId);
  console.log('[GeoDistributionScreen] accountTag:', accountTag);

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
  const params: MetricsQueryParams = useMemo(() => {
    const p = {
      zoneId: zoneId || '',
      accountTag: accountTag || undefined,
      ...dateRanges,
      granularity: 'hour' as const,
    };
    console.log('[GeoDistributionScreen] Creating params:', p);
    return p;
  }, [zoneId, accountTag, dateRanges]);

  // Fetch geographic distribution data
  const {
    data,
    loading,
    error,
    refresh,
    lastRefreshTime,
    isFromCache,
  } = useGeoDistribution(params);

  console.log('[GeoDistributionScreen] Hook result:', { data, loading, error });

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
   * Get top N countries
   * Requirement 18.3: Display Top 10 countries
   */
  const getTopCountries = (n: number = 10): CountryItem[] => {
    if (!data || !data.countries) return [];
    return data.countries.slice(0, n);
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
   * Requirement 18.5: Display percentage for each country
   */
  const formatPercentage = (percentage: number): string => {
    return `${percentage.toFixed(2)}%`;
  };

  /**
   * Get country flag emoji from country code
   */
  const getCountryFlag = (countryCode: string): string => {
    if (countryCode === 'XX' || countryCode.length !== 2) {
      return '🌍'; // Globe for unknown countries
    }
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  /**
   * Handle country item click
   * Requirement 18.4: Show details when clicking a country
   */
  const handleCountryClick = (country: CountryItem) => {
    setSelectedCountry(country);
  };

  /**
   * Close detail modal
   */
  const closeDetailModal = () => {
    setSelectedCountry(null);
  };

  /**
   * Render country list item
   * Requirement 18.2: Display country/region list
   */
  const renderCountryItem = ({ item, index }: { item: CountryItem; index: number }) => {
    const flag = getCountryFlag(item.code);
    const isTopTen = index < 10;

    return (
      <TouchableOpacity
        style={[
          styles.countryItem,
          { borderBottomColor: colors.border },
          isTopTen && { backgroundColor: colors.primary + '10' }
        ]}
        onPress={() => handleCountryClick(item)}
        key={`${item.code}-${item.name}-${index}`}
      >
        <Text style={styles.countryFlag}>{flag}</Text>
        <View style={styles.countryInfo}>
          <Text style={[styles.countryName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.countryCode, { color: colors.textSecondary }]}>{item.code}</Text>
        </View>
        <View style={styles.countryStats}>
          <Text style={[styles.countryRequests, { color: colors.text }]}>{formatNumber(item.requests)}</Text>
          <Text style={[styles.countryPercentage, { color: colors.primary }]}>{formatPercentage(item.percentage)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render loading state
   */
  if (loading && !data) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading geographic distribution...</Text>
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

  const displayCountries = showTopOnly ? getTopCountries(10) : (data?.countries || []);
  const totalCountries = data?.countries?.length || 0;
  const totalRequests = data?.countries?.reduce((sum, c) => sum + c.requests, 0) || 0;

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
          <Text style={[styles.title, { color: colors.text }]}>Geographic Distribution</Text>
          {lastRefreshTime && (
            <Text style={[styles.lastUpdate, { color: colors.textSecondary }]}>
              Last updated: {lastRefreshTime.toLocaleTimeString()}
            </Text>
          )}
          {isFromCache && (
            <Text style={[styles.cacheIndicator, { color: colors.primary }]}>📦 Showing cached data</Text>
          )}
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

        {/* Summary Cards */}
        {data && (
          <View style={styles.summarySection}>
            <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Countries</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{totalCountries}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Requests</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatNumber(totalRequests)}</Text>
            </View>
          </View>
        )}

        {/* Toggle Button */}
        <View style={[styles.toggleSection, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.toggleButton, showTopOnly && { backgroundColor: colors.primary }]}
            onPress={() => setShowTopOnly(true)}
          >
            <Text style={[styles.toggleButtonText, { color: showTopOnly ? '#fff' : colors.textSecondary }]}>
              Top 10
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, !showTopOnly && { backgroundColor: colors.primary }]}
            onPress={() => setShowTopOnly(false)}
          >
            <Text style={[styles.toggleButtonText, { color: !showTopOnly ? '#fff' : colors.textSecondary }]}>
              All Countries
            </Text>
          </TouchableOpacity>
        </View>

        {/* Country List */}
        {displayCountries.length > 0 ? (
          <View style={[styles.listSection, { backgroundColor: colors.surface }]}>
            <FlatList
              data={displayCountries}
              renderItem={renderCountryItem}
              keyExtractor={(item, index) => `${item.name}-${index}`}
              scrollEnabled={false}
            />
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyStateText, { color: colors.textDisabled }]}>No geographic data available</Text>
          </View>
        )}

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Tap on a country to view detailed statistics.
            Pull down to refresh data.
          </Text>
        </View>
      </ScrollView>

      {/* Detail Modal */}
      {selectedCountry && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={closeDetailModal}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalFlag}>{getCountryFlag(selectedCountry.code)}</Text>
                <View style={styles.modalHeaderText}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedCountry.name}</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{selectedCountry.code}</Text>
                </View>
                <TouchableOpacity onPress={closeDetailModal} style={styles.modalCloseButton}>
                  <Text style={[styles.modalCloseText, { color: colors.textDisabled }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={[styles.modalStatRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalStatLabel, { color: colors.textSecondary }]}>Requests</Text>
                  <Text style={[styles.modalStatValue, { color: colors.text }]}>{formatNumber(selectedCountry.requests)}</Text>
                </View>
                <View style={[styles.modalStatRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalStatLabel, { color: colors.textSecondary }]}>Data Transferred</Text>
                  <Text style={[styles.modalStatValue, { color: colors.text }]}>{formatBytes(selectedCountry.bytes)}</Text>
                </View>
                <View style={[styles.modalStatRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalStatLabel, { color: colors.textSecondary }]}>Percentage of Total</Text>
                  <Text style={[styles.modalStatValue, { color: colors.text }]}>{formatPercentage(selectedCountry.percentage)}</Text>
                </View>
                <View style={[styles.modalStatRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalStatLabel, { color: colors.textSecondary }]}>Avg. Bytes per Request</Text>
                  <Text style={[styles.modalStatValue, { color: colors.text }]}>
                    {formatBytes(selectedCountry.requests > 0 ? selectedCountry.bytes / selectedCountry.requests : 0)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={closeDetailModal}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
  summarySection: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
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
    fontSize: 14,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  toggleSection: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listSection: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  countryFlag: {
    fontSize: 32,
    marginRight: 12,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  countryCode: {
    fontSize: 13,
  },
  countryStats: {
    alignItems: 'flex-end',
  },
  countryRequests: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  countryPercentage: {
    fontSize: 13,
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalFlag: {
    fontSize: 48,
    marginRight: 16,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  modalBody: {
    marginBottom: 24,
  },
  modalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalStatLabel: {
    fontSize: 16,
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
