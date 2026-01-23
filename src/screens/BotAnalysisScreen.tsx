/**
 * BotAnalysisScreen
 * Displays Bot analysis including bot traffic percentage and score distribution
 * Requirements: 11.1, 11.2
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
import { useBotAnalysis } from '../hooks/useBotAnalysis';
import { BarChart, ZoneSelector } from '../components';

export default function BotAnalysisScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
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

  const { startDate, endDate } = dateRanges;

  // Fetch bot analysis data
  const {
    data,
    loading,
    error,
    refresh,
    lastRefresh,
  } = useBotAnalysis(startDate, endDate);

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
   */
  const handleExport = async () => {
    if (!data) {
      Alert.alert('No Data', 'No bot analysis data available to export.');
      return;
    }

    setExporting(true);
    try {
      // Create CSV content manually
      const csvLines = [
        '# Cloudflare Bot Analysis Export',
        `# Exported At: ${new Date().toISOString()}`,
        '',
        'Metric,Value',
        `Total Requests,${data.totalRequests}`,
        `Bot Requests,${data.botRequests}`,
        `Bot Percentage,${data.botPercentage.toFixed(2)}%`,
        '',
        'Score Range,Count,Percentage',
        ...data.scoreDistribution.map(item => 
          `${item.range},${item.count},${item.percentage.toFixed(2)}%`
        ),
      ];

      const csvContent = csvLines.join('\n');
      const filename = `bot_analysis_${new Date().toISOString().split('T')[0]}.csv`;

      // Use ExportManager's private method pattern
      const { Share, Platform } = require('react-native');
      const { Paths, File } = require('expo-file-system');
      
      const file = new File(Paths.cache, filename);
      await file.write(csvContent);

      await Share.share(
        Platform.OS === 'ios'
          ? { url: file.uri }
          : { message: 'Bot Analysis Export', url: file.uri }
      );

      Alert.alert('Success', 'Bot analysis data exported successfully!');
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
   * Format large numbers with commas
   */
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  /**
   * Render loading state
   */
  if (loading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading bot analysis...</Text>
      </View>
    );
  }

  /**
   * Render error state
   */
  if (error && !data) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * Render no data state
   */
  if (!data) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noDataText}>No bot analysis data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ZoneSelector />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Bot Analysis</Text>
          <TouchableOpacity
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
            onPress={handleExport}
            disabled={exporting}
          >
            <Text style={styles.exportButtonText}>
              {exporting ? 'Exporting...' : 'Export'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Last refresh time */}
        {lastRefresh && (
          <Text style={styles.lastRefresh}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Text>
        )}

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

        {/* Bot Traffic Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bot Traffic Overview</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Requests</Text>
              <Text style={styles.metricValue}>{formatNumber(data.totalRequests)}</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Bot Requests</Text>
              <Text style={styles.metricValue}>{formatNumber(data.botRequests)}</Text>
            </View>

            <View style={[styles.metricCard, styles.metricCardWide]}>
              <Text style={styles.metricLabel}>Bot Traffic Percentage</Text>
              <Text style={[
                styles.metricValue,
                data.botPercentage > 50 && styles.metricValueWarning,
              ]}>
                {data.botPercentage.toFixed(2)}%
              </Text>
              {data.botPercentage > 50 && (
                <Text style={styles.warningText}>High bot traffic detected</Text>
              )}
            </View>
          </View>
        </View>

        {/* Bot Score Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bot Score Distribution</Text>
          <Text style={styles.sectionDescription}>
            Bot scores range from 0-100, where higher scores indicate more likely bot traffic
          </Text>

          {/* Bar Chart */}
          <View style={styles.chartContainer}>
            <BarChart
              labels={data.scoreDistribution.map(item => item.range)}
              data={data.scoreDistribution.map(item => item.count)}
              width={350}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              showValuesOnTopOfBars={true}
            />
          </View>

          {/* Distribution Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.tableCol1]}>Score Range</Text>
              <Text style={[styles.tableHeaderText, styles.tableCol2]}>Count</Text>
              <Text style={[styles.tableHeaderText, styles.tableCol3]}>Percentage</Text>
            </View>
            {data.scoreDistribution.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableCol1]}>{item.range}</Text>
                <Text style={[styles.tableCell, styles.tableCol2]}>{formatNumber(item.count)}</Text>
                <Text style={[styles.tableCell, styles.tableCol3]}>{item.percentage.toFixed(2)}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Understanding Bot Scores</Text>
          <Text style={styles.infoText}>
            • 0-20: Very likely human traffic{'\n'}
            • 21-40: Probably human traffic{'\n'}
            • 41-60: Uncertain (could be human or bot){'\n'}
            • 61-80: Probably bot traffic{'\n'}
            • 81-100: Very likely bot traffic
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  exportButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  lastRefresh: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
    margin: 16,
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
  section: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  metricCardWide: {
    minWidth: '100%',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  metricValueWarning: {
    color: '#ff6b00',
  },
  warningText: {
    fontSize: 12,
    color: '#ff6b00',
    marginTop: 4,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  chart: {
    borderRadius: 16,
  },
  table: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tableCell: {
    fontSize: 14,
    color: '#666',
  },
  tableCol1: {
    flex: 2,
  },
  tableCol2: {
    flex: 2,
    textAlign: 'right',
  },
  tableCol3: {
    flex: 2,
    textAlign: 'right',
  },
  infoSection: {
    backgroundColor: '#e3f2fd',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
