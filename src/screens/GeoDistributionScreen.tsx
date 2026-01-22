/**
 * GeoDistributionScreen
 * Displays geographic distribution of traffic by country
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
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
  FlatList,
  Modal,
} from 'react-native';
import { useGeoDistribution } from '../hooks/useGeoDistribution';
import { MetricsQueryParams } from '../types';

interface GeoDistributionScreenProps {
  zoneId: string;
}

interface CountryItem {
  code: string;
  name: string;
  requests: number;
  bytes: number;
  percentage: number;
}

export default function GeoDistributionScreen({ zoneId }: GeoDistributionScreenProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryItem | null>(null);
  const [showTopOnly, setShowTopOnly] = useState(true);

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

  // Fetch geographic distribution data
  const {
    data,
    loading,
    error,
    refresh,
    lastRefreshTime,
    isFromCache,
  } = useGeoDistribution(params);

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
        style={[styles.countryItem, isTopTen && styles.countryItemTopTen]}
        onPress={() => handleCountryClick(item)}
      >
        <View style={styles.countryRank}>
          <Text style={styles.countryRankText}>#{index + 1}</Text>
        </View>
        <Text style={styles.countryFlag}>{flag}</Text>
        <View style={styles.countryInfo}>
          <Text style={styles.countryName}>{item.name}</Text>
          <Text style={styles.countryCode}>{item.code}</Text>
        </View>
        <View style={styles.countryStats}>
          <Text style={styles.countryRequests}>{formatNumber(item.requests)}</Text>
          <Text style={styles.countryPercentage}>{formatPercentage(item.percentage)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render loading state
   */
  if (loading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f6821f" />
        <Text style={styles.loadingText}>Loading geographic distribution...</Text>
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

  const displayCountries = showTopOnly ? getTopCountries(10) : (data?.countries || []);
  const totalCountries = data?.countries?.length || 0;
  const totalRequests = data?.countries?.reduce((sum, c) => sum + c.requests, 0) || 0;

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
          <Text style={styles.title}>Geographic Distribution</Text>
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
          <View style={styles.summarySection}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Countries</Text>
              <Text style={styles.summaryValue}>{totalCountries}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Requests</Text>
              <Text style={styles.summaryValue}>{formatNumber(totalRequests)}</Text>
            </View>
          </View>
        )}

        {/* Toggle Button */}
        <View style={styles.toggleSection}>
          <TouchableOpacity
            style={[styles.toggleButton, showTopOnly && styles.toggleButtonActive]}
            onPress={() => setShowTopOnly(true)}
          >
            <Text style={[styles.toggleButtonText, showTopOnly && styles.toggleButtonTextActive]}>
              Top 10
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, !showTopOnly && styles.toggleButtonActive]}
            onPress={() => setShowTopOnly(false)}
          >
            <Text style={[styles.toggleButtonText, !showTopOnly && styles.toggleButtonTextActive]}>
              All Countries
            </Text>
          </TouchableOpacity>
        </View>

        {/* Country List */}
        {displayCountries.length > 0 ? (
          <View style={styles.listSection}>
            <FlatList
              data={displayCountries}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.code}
              scrollEnabled={false}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No geographic data available</Text>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
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
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalFlag}>{getCountryFlag(selectedCountry.code)}</Text>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle}>{selectedCountry.name}</Text>
                  <Text style={styles.modalSubtitle}>{selectedCountry.code}</Text>
                </View>
                <TouchableOpacity onPress={closeDetailModal} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.modalStatRow}>
                  <Text style={styles.modalStatLabel}>Requests</Text>
                  <Text style={styles.modalStatValue}>{formatNumber(selectedCountry.requests)}</Text>
                </View>
                <View style={styles.modalStatRow}>
                  <Text style={styles.modalStatLabel}>Data Transferred</Text>
                  <Text style={styles.modalStatValue}>{formatBytes(selectedCountry.bytes)}</Text>
                </View>
                <View style={styles.modalStatRow}>
                  <Text style={styles.modalStatLabel}>Percentage of Total</Text>
                  <Text style={styles.modalStatValue}>{formatPercentage(selectedCountry.percentage)}</Text>
                </View>
                <View style={styles.modalStatRow}>
                  <Text style={styles.modalStatLabel}>Avg. Bytes per Request</Text>
                  <Text style={styles.modalStatValue}>
                    {formatBytes(selectedCountry.requests > 0 ? selectedCountry.bytes / selectedCountry.requests : 0)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.modalButton} onPress={closeDetailModal}>
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
  summarySection: {
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
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  toggleSection: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fff',
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
  toggleButtonActive: {
    backgroundColor: '#f6821f',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  listSection: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#f0f0f0',
  },
  countryItemTopTen: {
    backgroundColor: '#fffbf5',
  },
  countryRank: {
    width: 40,
    alignItems: 'center',
  },
  countryRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
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
    color: '#333',
    marginBottom: 2,
  },
  countryCode: {
    fontSize: 13,
    color: '#666',
  },
  countryStats: {
    alignItems: 'flex-end',
  },
  countryRequests: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  countryPercentage: {
    fontSize: 13,
    color: '#f6821f',
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    color: '#333',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 28,
    color: '#999',
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
    borderBottomColor: '#f0f0f0',
  },
  modalStatLabel: {
    fontSize: 16,
    color: '#666',
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#f6821f',
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
