/**
 * AlertHistoryScreen
 * Screen for viewing alert history
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert as RNAlert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import AlertMonitor, { Alert } from '../services/AlertMonitor';

export default function AlertHistoryScreen() {
  const { colors } = useTheme();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadAlerts();
    }, [])
  );

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const history = await AlertMonitor.getAlertHistory();
      setAlerts(history);
    } catch (error) {
      console.error('Error loading alert history:', error);
      RNAlert.alert('错误', '加载告警历史失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAlerts();
    setIsRefreshing(false);
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await AlertMonitor.acknowledgeAlert(alertId);
      await loadAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      RNAlert.alert('错误', '确认告警失败');
    }
  };

  const handleClearHistory = () => {
    RNAlert.alert(
      '清除历史',
      '确定要清除所有告警历史吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: async () => {
            try {
              await AlertMonitor.clearAlertHistory();
              await loadAlerts();
              RNAlert.alert('成功', '告警历史已清除');
            } catch (error) {
              console.error('Error clearing history:', error);
              RNAlert.alert('错误', '清除告警历史失败');
            }
          },
        },
      ]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#e74c3c';
      case 'medium':
        return '#f39c12';
      case 'low':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const alertDate = new Date(date);
    const diffMs = now.getTime() - alertDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return '刚刚';
    } else if (diffMins < 60) {
      return `${diffMins} 分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小时前`;
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else {
      return alertDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>告警历史</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {alerts.length === 0 ? '还没有告警记录' : `共 ${alerts.length} 条告警`}
          </Text>
        </View>
        {alerts.length > 0 && (
          <TouchableOpacity
            style={[styles.clearButton, { backgroundColor: colors.error + '20' }]}
            onPress={handleClearHistory}
          >
            <Text style={[styles.clearButtonText, { color: colors.error }]}>清除</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Alerts List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {alerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>还没有告警记录</Text>
            <Text style={[styles.emptySubtext, { color: colors.textDisabled }]}>
              当触发告警规则时，记录会显示在这里
            </Text>
          </View>
        ) : (
          alerts.map((alert) => (
            <View
              key={alert.id}
              style={[
                styles.alertCard,
                { backgroundColor: colors.surface },
                alert.acknowledged && styles.alertCardAcknowledged,
              ]}
            >
              <View
                style={[
                  styles.severityIndicator,
                  { backgroundColor: getSeverityColor(alert.severity) },
                ]}
              />

              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: getSeverityColor(alert.severity) },
                    ]}
                  >
                    <Text style={styles.severityText}>
                      {getSeverityLabel(alert.severity)}
                    </Text>
                  </View>
                  <Text style={[styles.timestamp, { color: colors.textDisabled }]}>
                    {formatDate(alert.triggeredAt)}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.message,
                    { color: colors.text },
                    alert.acknowledged && { color: colors.textDisabled },
                  ]}
                >
                  {alert.message}
                </Text>

                {!alert.acknowledged && (
                  <TouchableOpacity
                    style={[styles.acknowledgeButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleAcknowledge(alert.id)}
                  >
                    <Text style={styles.acknowledgeButtonText}>确认</Text>
                  </TouchableOpacity>
                )}

                {alert.acknowledged && (
                  <View style={[styles.acknowledgedBadge, { backgroundColor: colors.success + '20' }]}>
                    <Text style={[styles.acknowledgedBadgeText, { color: colors.success }]}>已确认</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    padding: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  alertCard: {
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  alertCardAcknowledged: {
    opacity: 0.7,
  },
  severityIndicator: {
    width: 4,
  },
  alertContent: {
    flex: 1,
    padding: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  acknowledgeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  acknowledgeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  acknowledgedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
});
