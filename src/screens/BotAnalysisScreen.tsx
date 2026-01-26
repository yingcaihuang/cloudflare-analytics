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
import { BarChart } from '../components';
import { useTheme } from '../contexts/ThemeContext';

export default function BotAnalysisScreen() {
  const { colors } = useTheme();
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
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading bot analysis...</Text>
      </View>
    );
  }

  /**
   * Render error state
   */
  if (error && !data) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Error: {error}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.secondary }]} onPress={handleRefresh}>
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
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No bot analysis data available</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Bot Analysis</Text>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: exporting ? colors.textDisabled : colors.secondary }]}
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
          <Text style={[styles.lastRefresh, { color: colors.textSecondary, backgroundColor: colors.surface }]}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Text>
        )}

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

        {/* Bot Traffic Overview */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bot Traffic Overview</Text>
          
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Requests</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>{formatNumber(data.totalRequests)}</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Bot Requests</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>{formatNumber(data.botRequests)}</Text>
            </View>

            <View style={[styles.metricCard, styles.metricCardWide, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Bot Traffic Percentage</Text>
              <Text style={[
                styles.metricValue,
                { color: data.botPercentage > 50 ? colors.primary : colors.text },
              ]}>
                {data.botPercentage.toFixed(2)}%
              </Text>
              {data.botPercentage > 50 && (
                <Text style={[styles.warningText, { color: colors.primary }]}>High bot traffic detected</Text>
              )}
            </View>
          </View>
        </View>

        {/* Bot Score Distribution */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bot Score Distribution</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
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
          <View style={[styles.table, { borderColor: colors.border }]}>
            <View style={[styles.tableHeader, { backgroundColor: colors.border }]}>
              <Text style={[styles.tableHeaderText, styles.tableCol1, { color: colors.text }]}>Score Range</Text>
              <Text style={[styles.tableHeaderText, styles.tableCol2, { color: colors.text }]}>Count</Text>
              <Text style={[styles.tableHeaderText, styles.tableCol3, { color: colors.text }]}>Percentage</Text>
            </View>
            {data.scoreDistribution.map((item, index) => (
              <View key={index} style={[styles.tableRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.tableCell, styles.tableCol1, { color: colors.textSecondary }]}>{item.range}</Text>
                <Text style={[styles.tableCell, styles.tableCol2, { color: colors.textSecondary }]}>{formatNumber(item.count)}</Text>
                <Text style={[styles.tableCell, styles.tableCol3, { color: colors.textSecondary }]}>{item.percentage.toFixed(2)}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: colors.info + '20' }]}>
          <Text style={[styles.infoTitle, { color: colors.secondary }]}>Understanding Bot Scores</Text>
          <Text style={[styles.infoText, { color: colors.text }]}>
            • 0-20: Very likely human traffic{'\n'}
            • 21-40: Probably human traffic{'\n'}
            • 41-60: Uncertain (could be human or bot){'\n'}
            • 61-80: Probably bot traffic{'\n'}
            • 81-100: Very likely bot traffic
          </Text>
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  exportButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  lastRefresh: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 8,
  },
  timeRangeSelector: {
    flexDirection: 'row',
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
  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
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
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  metricCardWide: {
    minWidth: '100%',
  },
  metricLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  warningText: {
    fontSize: 12,
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
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
  },
  tableCell: {
    fontSize: 14,
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
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
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
