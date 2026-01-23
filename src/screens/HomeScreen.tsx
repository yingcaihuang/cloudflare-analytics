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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useZone } from '../contexts';
import AuthManager from '../services/AuthManager';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { accounts, totalZonesCount, zoneName, isLoading, refreshAccounts } = useZone();
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
    navigation.navigate('More', { screen: 'TokenManagement' });
  };

  const handleSelectZone = () => {
    navigation.navigate('More', { screen: 'AccountZoneSelection' });
  };

  const handleViewDashboard = () => {
    navigation.navigate('Dashboard');
  };

  const handleViewSecurity = () => {
    navigation.navigate('Security');
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cloudflare Analytics</Text>
        <Text style={styles.headerSubtitle}>实时监控您的网站性能</Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        {/* Token Card */}
        <TouchableOpacity
          style={[styles.statCard, styles.tokenCard]}
          onPress={handleManageTokens}
        >
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>🔑</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{tokenCount}</Text>
            <Text style={styles.statLabel}>API Tokens</Text>
          </View>
          <Text style={styles.statArrow}>›</Text>
        </TouchableOpacity>

        {/* Accounts Card */}
        <TouchableOpacity
          style={[styles.statCard, styles.accountCard]}
          onPress={handleSelectZone}
        >
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>👤</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{accounts.length}</Text>
            <Text style={styles.statLabel}>账户</Text>
          </View>
          <Text style={styles.statArrow}>›</Text>
        </TouchableOpacity>

        {/* Zones Card */}
        <TouchableOpacity
          style={[styles.statCard, styles.zoneCard]}
          onPress={handleSelectZone}
        >
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>🌐</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{totalZonesCount}</Text>
            <Text style={styles.statLabel}>Zones</Text>
          </View>
          <Text style={styles.statArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Current Zone Info */}
      {zoneName && (
        <View style={styles.currentZoneContainer}>
          <View style={styles.currentZoneHeader}>
            <Text style={styles.currentZoneTitle}>当前选择的 Zone</Text>
            <TouchableOpacity onPress={handleSelectZone}>
              <Text style={styles.changeZoneButton}>切换</Text>
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
        <Text style={styles.sectionTitle}>快速操作</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleViewDashboard}
          disabled={!zoneName}
        >
          <View style={styles.actionIconContainer}>
            <Text style={styles.actionIcon}>📊</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, !zoneName && styles.actionDisabled]}>
              流量分析
            </Text>
            <Text style={[styles.actionDescription, !zoneName && styles.actionDisabled]}>
              查看实时流量数据和趋势
            </Text>
          </View>
          <Text style={[styles.actionArrow, !zoneName && styles.actionDisabled]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleViewSecurity}
          disabled={!zoneName}
        >
          <View style={styles.actionIconContainer}>
            <Text style={styles.actionIcon}>🛡️</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, !zoneName && styles.actionDisabled]}>
              安全监控
            </Text>
            <Text style={[styles.actionDescription, !zoneName && styles.actionDisabled]}>
              查看安全事件和威胁分析
            </Text>
          </View>
          <Text style={[styles.actionArrow, !zoneName && styles.actionDisabled]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleSelectZone}
        >
          <View style={styles.actionIconContainer}>
            <Text style={styles.actionIcon}>⚙️</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>选择 Zone</Text>
            <Text style={styles.actionDescription}>
              切换到其他账户或 Zone
            </Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleManageTokens}
        >
          <View style={styles.actionIconContainer}>
            <Text style={styles.actionIcon}>🔐</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>管理 Tokens</Text>
            <Text style={styles.actionDescription}>
              添加、编辑或删除 API Tokens
            </Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* No Zone Selected Message */}
      {!zoneName && (
        <View style={styles.noZoneContainer}>
          <Text style={styles.noZoneIcon}>🎯</Text>
          <Text style={styles.noZoneTitle}>开始使用</Text>
          <Text style={styles.noZoneDescription}>
            请先选择一个 Zone 以查看分析数据
          </Text>
          <TouchableOpacity
            style={styles.selectZoneButton}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
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
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
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
    backgroundColor: '#f5f5f5',
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
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statArrow: {
    fontSize: 32,
    color: '#ccc',
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
    color: '#333',
  },
  changeZoneButton: {
    fontSize: 16,
    color: '#f97316',
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
    color: '#333',
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
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
    backgroundColor: '#f5f5f5',
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
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#666',
  },
  actionArrow: {
    fontSize: 24,
    color: '#ccc',
    marginLeft: 12,
  },
  actionDisabled: {
    opacity: 0.4,
  },
  noZoneContainer: {
    backgroundColor: '#fff',
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
    color: '#333',
    marginBottom: 8,
  },
  noZoneDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  selectZoneButton: {
    backgroundColor: '#f97316',
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
