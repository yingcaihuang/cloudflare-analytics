/**
 * HomeScreen
 * Modern home screen with statistics and quick actions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useZone, useTheme } from '../contexts';
import AuthManager from '../services/AuthManager';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { accounts, totalZonesCount, zoneName, refreshAccounts } = useZone();
  const { colors } = useTheme();
  const [tokenCount, setTokenCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTokenCount();
    console.log('HomeScreen - accounts:', accounts.length, 'totalZones:', totalZonesCount);
    console.log('HomeScreen - accounts detail:', JSON.stringify(accounts, null, 2));
  }, [accounts, totalZonesCount]);

  const loadTokenCount = async () => {
    try {
      const tokens = await AuthManager.getTokensList();
      setTokenCount(tokens.length);
    } catch (error) {
      console.error('Error loading token count:', error);
      setTokenCount(0);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadTokenCount(),
      refreshAccounts(),
    ]);
    setRefreshing(false);
  };

  const handleManageTokens = () => {
    // Navigate to TokenManagement screen (in Stack navigator)
    navigation.getParent()?.navigate('TokenManagement');
  };

  const handleSelectZone = () => {
    // Navigate to AccountZoneSelection screen (in Stack navigator)
    navigation.getParent()?.navigate('AccountZoneSelection');
  };

  const handleViewDashboard = () => {
    navigation.navigate('Dashboard');
  };

  const handleViewSecurity = () => {
    navigation.navigate('Security');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Cloudflare Analytics</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>实时监控您的网站性能</Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        {/* Token Card */}
        <TouchableOpacity
          style={[styles.statCard, styles.tokenCard, { backgroundColor: colors.surface }]}
          onPress={handleManageTokens}
        >
          <View style={[styles.statIconContainer, { backgroundColor: colors.card }]}>
            <Text style={styles.statIcon}>🔑</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, { color: colors.text }]}>{tokenCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>API Tokens</Text>
          </View>
          <Text style={[styles.statArrow, { color: colors.border }]}>›</Text>
        </TouchableOpacity>

        {/* Accounts Card */}
        <TouchableOpacity
          style={[styles.statCard, styles.accountCard, { backgroundColor: colors.surface }]}
          onPress={handleSelectZone}
        >
          <View style={[styles.statIconContainer, { backgroundColor: colors.card }]}>
            <Text style={styles.statIcon}>👤</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, { color: colors.text }]}>{accounts.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>账户</Text>
          </View>
          <Text style={[styles.statArrow, { color: colors.border }]}>›</Text>
        </TouchableOpacity>

        {/* Zones Card */}
        <TouchableOpacity
          style={[styles.statCard, styles.zoneCard, { backgroundColor: colors.surface }]}
          onPress={handleSelectZone}
        >
          <View style={[styles.statIconContainer, { backgroundColor: colors.card }]}>
            <Text style={styles.statIcon}>🌐</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, { color: colors.text }]}>{totalZonesCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Zones</Text>
          </View>
          <Text style={[styles.statArrow, { color: colors.border }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Current Zone Info */}
      {zoneName && (
        <View style={styles.currentZoneContainer}>
          <View style={styles.currentZoneHeader}>
            <Text style={[styles.currentZoneTitle, { color: colors.text }]}>当前选择的 Zone</Text>
            <TouchableOpacity onPress={handleSelectZone}>
              <Text style={[styles.changeZoneButton, { color: colors.primary }]}>切换</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.currentZoneCard}>
            <Text style={styles.currentZoneName}>{zoneName}</Text>
            <Text style={styles.currentZoneLabel}>正在监控中</Text>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>快速操作</Text>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.surface }]}
          onPress={handleViewDashboard}
          disabled={!zoneName}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.card }]}>
            <Text style={styles.actionIcon}>📊</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, { color: colors.text }, !zoneName && styles.actionDisabled]}>
              流量分析
            </Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }, !zoneName && styles.actionDisabled]}>
              查看实时流量数据和趋势
            </Text>
          </View>
          <Text style={[styles.actionArrow, { color: colors.border }, !zoneName && styles.actionDisabled]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.surface }]}
          onPress={handleViewSecurity}
          disabled={!zoneName}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.card }]}>
            <Text style={styles.actionIcon}>🛡️</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, { color: colors.text }, !zoneName && styles.actionDisabled]}>
              安全监控
            </Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }, !zoneName && styles.actionDisabled]}>
              查看安全事件和威胁分析
            </Text>
          </View>
          <Text style={[styles.actionArrow, { color: colors.border }, !zoneName && styles.actionDisabled]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.surface }]}
          onPress={handleSelectZone}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.card }]}>
            <Text style={styles.actionIcon}>⚙️</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>选择 Zone</Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
              切换到其他账户或 Zone
            </Text>
          </View>
          <Text style={[styles.actionArrow, { color: colors.border }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.surface }]}
          onPress={handleManageTokens}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.card }]}>
            <Text style={styles.actionIcon}>🔐</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>管理 Tokens</Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
              添加、编辑或删除 API Tokens
            </Text>
          </View>
          <Text style={[styles.actionArrow, { color: colors.border }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* No Zone Selected Message */}
      {!zoneName && (
        <View style={[styles.noZoneContainer, { backgroundColor: colors.surface }]}>
          <Text style={styles.noZoneIcon}>🎯</Text>
          <Text style={[styles.noZoneTitle, { color: colors.text }]}>开始使用</Text>
          <Text style={[styles.noZoneDescription, { color: colors.textSecondary }]}>
            请先选择一个 Zone 以查看分析数据
          </Text>
          <TouchableOpacity
            style={[styles.selectZoneButton, { backgroundColor: colors.primary }]}
            onPress={handleSelectZone}
          >
            <Text style={styles.selectZoneButtonText}>选择 Zone</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  statsContainer: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tokenCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
  },
  accountCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  zoneCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statIcon: {
    fontSize: 28,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statArrow: {
    fontSize: 32,
    marginLeft: 12,
  },
  currentZoneContainer: {
    padding: 16,
    paddingTop: 8,
  },
  currentZoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentZoneTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  changeZoneButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentZoneCard: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  currentZoneName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  currentZoneLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  actionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
  },
  actionArrow: {
    fontSize: 24,
    marginLeft: 12,
  },
  actionDisabled: {
    opacity: 0.4,
  },
  noZoneContainer: {
    margin: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  noZoneIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noZoneTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noZoneDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  selectZoneButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  selectZoneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
