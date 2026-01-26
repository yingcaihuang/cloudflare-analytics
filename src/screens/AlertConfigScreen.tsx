/**
 * AlertConfigScreen
 * Screen for configuring alert rules
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import AlertMonitor, { AlertRule } from '../services/AlertMonitor';

export default function AlertConfigScreen() {
  const { colors } = useTheme();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  // Form state
  const [ruleName, setRuleName] = useState('');
  const [metric, setMetric] = useState('status5xx');
  const [condition, setCondition] = useState<'increase' | 'decrease' | 'threshold'>('increase');
  const [value, setValue] = useState('50');
  const [timeWindow, setTimeWindow] = useState('5');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    loadRules();
    initializeAlertMonitor();
  }, []);

  const initializeAlertMonitor = async () => {
    try {
      await AlertMonitor.initialize();
    } catch (error) {
      console.error('Error initializing AlertMonitor:', error);
    }
  };

  const loadRules = async () => {
    try {
      setIsLoading(true);
      const allRules = AlertMonitor.getAllRules();
      setRules(allRules);
    } catch (error) {
      console.error('Error loading rules:', error);
      Alert.alert('错误', '加载告警规则失败');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setRuleName('');
    setMetric('status5xx');
    setCondition('increase');
    setValue('50');
    setTimeWindow('5');
    setEnabled(true);
    setEditingRule(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (rule: AlertRule) => {
    setRuleName(rule.name);
    setMetric(rule.metric);
    setCondition(rule.condition);
    setValue(rule.value.toString());
    setTimeWindow(rule.timeWindow.toString());
    setEnabled(rule.enabled);
    setEditingRule(rule);
    setShowAddModal(true);
  };

  const handleSaveRule = async () => {
    if (!ruleName.trim()) {
      Alert.alert('错误', '请输入规则名称');
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      Alert.alert('错误', '请输入有效的阈值');
      return;
    }

    const numTimeWindow = parseInt(timeWindow);
    if (isNaN(numTimeWindow) || numTimeWindow < 1) {
      Alert.alert('错误', '请输入有效的时间窗口（分钟）');
      return;
    }

    try {
      const rule: AlertRule = {
        name: ruleName,
        metric,
        condition,
        value: numValue,
        timeWindow: numTimeWindow,
        enabled,
      };

      if (editingRule && editingRule.id) {
        // Update existing rule
        await AlertMonitor.updateAlertRule(editingRule.id, rule);
        Alert.alert('成功', '告警规则已更新');
      } else {
        // Create new rule
        await AlertMonitor.registerAlert(rule);
        Alert.alert('成功', '告警规则已创建');
      }

      setShowAddModal(false);
      resetForm();
      await loadRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      Alert.alert('错误', '保存告警规则失败');
    }
  };

  const handleDeleteRule = (rule: AlertRule) => {
    if (!rule.id) return;

    Alert.alert(
      '删除规则',
      `确定要删除规则 "${rule.name}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await AlertMonitor.deleteAlertRule(rule.id!);
              Alert.alert('成功', '告警规则已删除');
              await loadRules();
            } catch (error) {
              console.error('Error deleting rule:', error);
              Alert.alert('错误', '删除告警规则失败');
            }
          },
        },
      ]
    );
  };

  const handleToggleRule = async (rule: AlertRule) => {
    if (!rule.id) return;

    try {
      await AlertMonitor.updateAlertRule(rule.id, { enabled: !rule.enabled });
      await loadRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
      Alert.alert('错误', '更新告警规则失败');
    }
  };

  const getMetricLabel = (metricName: string): string => {
    const labels: Record<string, string> = {
      status5xx: '5xx 错误',
      status4xx: '4xx 错误',
      status2xx: '2xx 成功',
      status3xx: '3xx 重定向',
    };
    return labels[metricName] || metricName;
  };

  const getConditionLabel = (cond: string): string => {
    const labels: Record<string, string> = {
      increase: '增长',
      decrease: '下降',
      threshold: '阈值',
    };
    return labels[cond] || cond;
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
        <Text style={[styles.title, { color: colors.text }]}>告警配置</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {rules.length === 0 ? '还没有配置告警规则' : `${rules.length} 个告警规则`}
        </Text>
      </View>

      {/* Rules List */}
      <ScrollView style={styles.listContainer}>
        {rules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>还没有配置告警规则</Text>
            <Text style={[styles.emptySubtext, { color: colors.textDisabled }]}>点击下方按钮创建第一个规则</Text>
          </View>
        ) : (
          rules.map((rule) => (
            <View key={rule.id} style={[styles.ruleCard, { backgroundColor: colors.surface }]}>
              <View style={styles.ruleHeader}>
                <View style={styles.ruleHeaderLeft}>
                  <Text style={[styles.ruleName, { color: colors.text }]}>{rule.name}</Text>
                  {!rule.enabled && (
                    <View style={[styles.disabledBadge, { backgroundColor: colors.textDisabled }]}>
                      <Text style={[styles.disabledBadgeText, { color: colors.textSecondary }]}>已禁用</Text>
                    </View>
                  )}
                </View>
                <Switch
                  value={rule.enabled}
                  onValueChange={() => handleToggleRule(rule)}
                  trackColor={{ false: colors.textDisabled, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.ruleDetails}>
                <Text style={[styles.ruleDetailText, { color: colors.textSecondary }]}>
                  指标: {getMetricLabel(rule.metric)}
                </Text>
                <Text style={[styles.ruleDetailText, { color: colors.textSecondary }]}>
                  条件: {getConditionLabel(rule.condition)}
                </Text>
                <Text style={[styles.ruleDetailText, { color: colors.textSecondary }]}>
                  阈值: {rule.value}{rule.condition !== 'threshold' ? '%' : ''}
                </Text>
                {rule.condition !== 'threshold' && (
                  <Text style={[styles.ruleDetailText, { color: colors.textSecondary }]}>
                    时间窗口: {rule.timeWindow} 分钟
                  </Text>
                )}
              </View>

              <View style={styles.ruleActions}>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                  onPress={() => openEditModal(rule)}
                >
                  <Text style={[styles.editButtonText, { color: colors.text }]}>编辑</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: colors.error + '20' }]}
                  onPress={() => handleDeleteRule(rule)}
                >
                  <Text style={[styles.deleteButtonText, { color: colors.error }]}>删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Rule Button */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ 添加新规则</Text>
        </TouchableOpacity>
      </View>

      {/* Add/Edit Rule Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {editingRule ? '编辑规则' : '添加新规则'}
                  </Text>

                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    style={styles.modalScrollView}
                  >
                    {/* Rule Name */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>规则名称</Text>
                    <TextInput
                      style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                      placeholder="例如: 5xx 错误告警"
                      placeholderTextColor={colors.textDisabled}
                      value={ruleName}
                      onChangeText={setRuleName}
                      returnKeyType="next"
                    />

                    {/* Metric Selection */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>监控指标</Text>
                    <View style={styles.optionsContainer}>
                      {['status5xx', 'status4xx', 'status2xx', 'status3xx'].map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[
                            styles.optionButton,
                            { borderColor: colors.border, backgroundColor: colors.surface },
                            metric === m && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}
                          onPress={() => setMetric(m)}
                        >
                          <Text
                            style={[
                              styles.optionButtonText,
                              { color: colors.textSecondary },
                              metric === m && styles.optionButtonTextActive,
                            ]}
                          >
                            {getMetricLabel(m)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Condition Selection */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>触发条件</Text>
                    <View style={styles.optionsContainer}>
                      {(['increase', 'decrease', 'threshold'] as const).map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.optionButton,
                            { borderColor: colors.border, backgroundColor: colors.surface },
                            condition === c && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}
                          onPress={() => setCondition(c)}
                        >
                          <Text
                            style={[
                              styles.optionButtonText,
                              { color: colors.textSecondary },
                              condition === c && styles.optionButtonTextActive,
                            ]}
                          >
                            {getConditionLabel(c)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Value */}
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      {condition === 'threshold' ? '阈值' : '变化率 (%)'}
                    </Text>
                    <TextInput
                      style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                      placeholder={condition === 'threshold' ? '例如: 100' : '例如: 50'}
                      placeholderTextColor={colors.textDisabled}
                      value={value}
                      onChangeText={setValue}
                      keyboardType="numeric"
                      returnKeyType="next"
                    />

                    {/* Time Window (only for increase/decrease) */}
                    {condition !== 'threshold' && (
                      <>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>时间窗口 (分钟)</Text>
                        <TextInput
                          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                          placeholder="例如: 5"
                          placeholderTextColor={colors.textDisabled}
                          value={timeWindow}
                          onChangeText={setTimeWindow}
                          keyboardType="numeric"
                          returnKeyType="done"
                        />
                      </>
                    )}

                    {/* Enabled Switch */}
                    <View style={styles.switchContainer}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>启用规则</Text>
                      <Switch
                        value={enabled}
                        onValueChange={setEnabled}
                        trackColor={{ false: colors.textDisabled, true: colors.primary }}
                        thumbColor="#fff"
                      />
                    </View>
                  </ScrollView>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowAddModal(false);
                        resetForm();
                      }}
                    >
                      <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>取消</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        Keyboard.dismiss();
                        handleSaveRule();
                      }}
                    >
                      <Text style={styles.confirmButtonText}>
                        {editingRule ? '更新' : '创建'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
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
  ruleCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ruleHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ruleDetails: {
    marginBottom: 12,
  },
  ruleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  addButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
