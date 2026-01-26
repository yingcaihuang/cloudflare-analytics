/**
 * FirewallAnalysisScreen
 * Displays Firewall analysis including rule statistics and top triggered rules
 * Requirements: 11.3, 11.4
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
import { useFirewallAnalysis } from '../hooks/useFirewallAnalysis';
import { useTheme } from '../contexts/ThemeContext';

export default function FirewallAnalysisScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showAllRules, setShowAllRules] = useState(false);
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

  // Fetch firewall analysis data
  const {
    data,
    loading,
    error,
    refresh,
    lastRefresh,
  } = useFirewallAnalysis(startDate, endDate);

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
      Alert.alert('No Data', 'No firewall analysis data available to export.');
      return;
    }

    setExporting(true);
    try {
      // Create CSV content manually
      const csvLines = [
        '# Cloudflare Firewall Analysis Export',
        `# Exported At: ${new Date().toISOString()}`,
        '',
        'Metric,Value',
        `Total Firewall Events,${data.totalEvents}`,
        '',
        'Rule ID,Rule Name,Action,Count,Percentage',
        ...data.topRules.map(rule =>
          `${rule.ruleId},"${rule.ruleName}",${rule.action},${rule.count},${rule.percentage.toFixed(2)}%`
        ),
      ];

      const csvContent = csvLines.join('\n');
      const filename = `firewall_analysis_${new Date().toISOString().split('T')[0]}.csv`;

      // Use ExportManager's private method pattern
      const { Share, Platform } = require('react-native');
      const { Paths, File } = require('expo-file-system');
      
      const file = new File(Paths.cache, filename);
      await file.write(csvContent);

      await Share.share(
        Platform.OS === 'ios'
          ? { url: file.uri }
          : { message: 'Firewall Analysis Export', url: file.uri }
      );

      Alert.alert('Success', 'Firewall analysis data exported successfully!');
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
   * Get action color based on action type
   */
  const getActionColor = (action: string): string => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('block') || actionLower.includes('drop')) {
      return colors.error;
    } else if (actionLower.includes('challenge')) {
      return colors.warning;
    } else if (actionLower.includes('allow') || actionLower.includes('log')) {
      return colors.success;
    }
    return colors.textSecondary;
  };

  /**
   * Render loading state
   */
  if (loading && !data) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading firewall analysis...</Text>
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
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No firewall analysis data available</Text>
      </View>
    );
  }

  // Determine which rules to display
  const displayRules = showAllRules ? data.rules : data.topRules;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Firewall Analysis</Text>
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

        {/* Firewall Overview */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Firewall Overview</Text>
          
          <View style={[styles.metricCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Firewall Events</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{formatNumber(data.totalEvents)}</Text>
            <Text style={[styles.metricSubtext, { color: colors.textDisabled }]}>
              Events triggered across {data.rules.length} rules
            </Text>
          </View>
        </View>

        {/* Top Triggered Rules */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {showAllRules ? 'All Firewall Rules' : 'Top 10 Triggered Rules'}
            </Text>
            {data.rules.length > 10 && (
              <TouchableOpacity
                style={[styles.toggleButton, { backgroundColor: colors.info + '20' }]}
                onPress={() => setShowAllRules(!showAllRules)}
              >
                <Text style={[styles.toggleButtonText, { color: colors.secondary }]}>
                  {showAllRules ? 'Show Top 10' : 'Show All'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {displayRules.length === 0 ? (
            <Text style={[styles.noRulesText, { color: colors.textDisabled }]}>No firewall rules triggered</Text>
          ) : (
            <View style={styles.rulesList}>
              {displayRules.map((rule, index) => (
                <View key={`${rule.ruleId}-${index}`} style={[styles.ruleCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.ruleHeader}>
                    <View style={[styles.ruleRank, { backgroundColor: colors.secondary }]}>
                      <Text style={styles.ruleRankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.ruleInfo}>
                      <Text style={[styles.ruleName, { color: colors.text }]} numberOfLines={2}>
                        {rule.ruleName}
                      </Text>
                      <Text style={[styles.ruleId, { color: colors.textDisabled }]} numberOfLines={1}>
                        ID: {rule.ruleId}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.ruleStats}>
                    <View style={styles.ruleStat}>
                      <Text style={[styles.ruleStatLabel, { color: colors.textSecondary }]}>Action</Text>
                      <Text style={[
                        styles.ruleStatValue,
                        { color: getActionColor(rule.action) }
                      ]}>
                        {rule.action.toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.ruleStat}>
                      <Text style={[styles.ruleStatLabel, { color: colors.textSecondary }]}>Count</Text>
                      <Text style={[styles.ruleStatValue, { color: colors.text }]}>
                        {formatNumber(rule.count)}
                      </Text>
                    </View>

                    <View style={styles.ruleStat}>
                      <Text style={[styles.ruleStatLabel, { color: colors.textSecondary }]}>Percentage</Text>
                      <Text style={[styles.ruleStatValue, { color: colors.text }]}>
                        {rule.percentage.toFixed(2)}%
                      </Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${Math.min(rule.percentage, 100)}%`,
                          backgroundColor: getActionColor(rule.action),
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: colors.info + '20' }]}>
          <Text style={[styles.infoTitle, { color: colors.secondary }]}>Understanding Firewall Actions</Text>
          <Text style={[styles.infoText, { color: colors.text }]}>
            • <Text style={{ color: colors.error }}>BLOCK/DROP</Text>: Request was blocked{'\n'}
            • <Text style={{ color: colors.warning }}>CHALLENGE</Text>: User was challenged (CAPTCHA){'\n'}
            • <Text style={{ color: colors.success }}>ALLOW/LOG</Text>: Request was allowed or logged
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 12,
  },
  rulesList: {
    gap: 12,
  },
  ruleCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ruleRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ruleRankText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  ruleInfo: {
    flex: 1,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  ruleId: {
    fontSize: 12,
  },
  ruleStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ruleStat: {
    flex: 1,
    alignItems: 'center',
  },
  ruleStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  ruleStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  noRulesText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
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
