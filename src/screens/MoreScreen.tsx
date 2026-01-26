/**
 * MoreScreen
 * Provides access to additional features and settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';

type NavigationProp = NativeStackNavigationProp<any>;

interface MenuItem {
  title: string;
  description: string;
  screen: string;
  icon: string;
  category: string;
}

const menuItems: MenuItem[] = [
  // 设置功能
  {
    title: 'Token 管理',
    description: '管理 API Tokens',
    screen: 'TokenManagement',
    icon: '🔐',
    category: '设置',
  },
  {
    title: '选择 Zone',
    description: '切换账户或 Zone',
    screen: 'AccountZoneSelection',
    icon: '⚙️',
    category: '设置',
  },
  // 分析功能
  {
    title: '地理分布',
    description: '查看流量的地理位置分布',
    screen: 'GeoDistribution',
    icon: '🌍',
    category: '流量分析',
  },
  {
    title: '协议分布',
    description: 'HTTP/1.1, HTTP/2, HTTP/3 使用情况',
    screen: 'ProtocolDistribution',
    icon: '📡',
    category: '流量分析',
  },
  {
    title: 'TLS 版本',
    description: 'SSL/TLS 版本分布和安全性',
    screen: 'TLSDistribution',
    icon: '🔒',
    category: '流量分析',
  },
  {
    title: '内容类型',
    description: '请求的内容类型分布',
    screen: 'ContentType',
    icon: '📄',
    category: '流量分析',
  },
  {
    title: '状态码分析',
    description: 'HTTP 状态码分布',
    screen: 'StatusCodes',
    icon: '📊',
    category: '流量分析',
  },
  // 安全功能
  {
    title: 'Bot 分析',
    description: 'Bot 流量和评分分布',
    screen: 'BotAnalysis',
    icon: '🤖',
    category: '安全分析',
  },
  {
    title: 'Firewall 分析',
    description: '防火墙规则触发统计',
    screen: 'FirewallAnalysis',
    icon: '🛡️',
    category: '安全分析',
  },
  // 告警功能
  {
    title: '告警配置',
    description: '配置告警规则和阈值',
    screen: 'AlertConfig',
    icon: '⚙️',
    category: '告警管理',
  },
  {
    title: '告警历史',
    description: '查看历史告警记录',
    screen: 'AlertHistory',
    icon: '📋',
    category: '告警管理',
  },
];

export default function MoreScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colorScheme, colors, isDark, toggleTheme, setColorScheme } = useTheme();
  const [showThemeModal, setShowThemeModal] = useState(false);

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const getThemeLabel = () => {
    switch (colorScheme) {
      case 'light':
        return '浅色';
      case 'dark':
        return '深色';
      case 'auto':
        return '跟随系统';
      default:
        return '跟随系统';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>更多功能</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>探索更多分析和管理功能</Text>
      </View>

      {/* Theme Settings Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, backgroundColor: isDark ? colors.background : '#f9f9f9' }]}>
          外观设置
        </Text>
        
        {/* Quick Theme Toggle */}
        <View style={[styles.menuItem, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
          <View style={[styles.menuItemIcon, { backgroundColor: isDark ? colors.card : '#f0f0f0' }]}>
            <Text style={styles.iconText}>{isDark ? '🌙' : '☀️'}</Text>
          </View>
          <View style={styles.menuItemContent}>
            <Text style={[styles.menuItemTitle, { color: colors.text }]}>深色模式</Text>
            <Text style={[styles.menuItemDescription, { color: colors.textSecondary }]}>
              快速切换深色/浅色主题
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#d1d5db', true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Theme Selector */}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}
          onPress={() => setShowThemeModal(true)}
        >
          <View style={[styles.menuItemIcon, { backgroundColor: isDark ? colors.card : '#f0f0f0' }]}>
            <Text style={styles.iconText}>🎨</Text>
          </View>
          <View style={styles.menuItemContent}>
            <Text style={[styles.menuItemTitle, { color: colors.text }]}>主题设置</Text>
            <Text style={[styles.menuItemDescription, { color: colors.textSecondary }]}>
              当前: {getThemeLabel()}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: colors.border }]}>›</Text>
        </TouchableOpacity>
      </View>

      {Object.entries(groupedItems).map(([category, items]) => (
        <View key={category} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, backgroundColor: isDark ? colors.background : '#f9f9f9' }]}>
            {category}
          </Text>
          {items.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={[styles.menuItem, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: isDark ? colors.card : '#f0f0f0' }]}>
                <Text style={styles.iconText}>{item.icon}</Text>
              </View>
              <View style={styles.menuItemContent}>
                <Text style={[styles.menuItemTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.menuItemDescription, { color: colors.textSecondary }]}>{item.description}</Text>
              </View>
              <Text style={[styles.chevron, { color: colors.border }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textDisabled }]}>Cloudflare Analytics v1.0.0</Text>
      </View>

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowThemeModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>选择主题</Text>
            
            <TouchableOpacity
              style={[styles.themeOption, colorScheme === 'light' && { backgroundColor: colors.primary + '20' }]}
              onPress={() => {
                setColorScheme('light');
                setShowThemeModal(false);
              }}
            >
              <Text style={styles.themeIcon}>☀️</Text>
              <View style={styles.themeOptionContent}>
                <Text style={[styles.themeOptionTitle, { color: colors.text }]}>浅色</Text>
                <Text style={[styles.themeOptionDescription, { color: colors.textSecondary }]}>
                  始终使用浅色主题
                </Text>
              </View>
              {colorScheme === 'light' && (
                <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeOption, colorScheme === 'dark' && { backgroundColor: colors.primary + '20' }]}
              onPress={() => {
                setColorScheme('dark');
                setShowThemeModal(false);
              }}
            >
              <Text style={styles.themeIcon}>🌙</Text>
              <View style={styles.themeOptionContent}>
                <Text style={[styles.themeOptionTitle, { color: colors.text }]}>深色</Text>
                <Text style={[styles.themeOptionDescription, { color: colors.textSecondary }]}>
                  始终使用深色主题
                </Text>
              </View>
              {colorScheme === 'dark' && (
                <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeOption, colorScheme === 'auto' && { backgroundColor: colors.primary + '20' }]}
              onPress={() => {
                setColorScheme('auto');
                setShowThemeModal(false);
              }}
            >
              <Text style={styles.themeIcon}>🔄</Text>
              <View style={styles.themeOptionContent}>
                <Text style={[styles.themeOptionTitle, { color: colors.text }]}>跟随系统</Text>
                <Text style={[styles.themeOptionDescription, { color: colors.textSecondary }]}>
                  根据系统设置自动切换
                </Text>
              </View>
              {colorScheme === 'auto' && (
                <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowThemeModal(false)}
            >
              <Text style={styles.modalButtonText}>完成</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  section: {
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 15,
    paddingVertical: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconText: {
    fontSize: 20,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  menuItemDescription: {
    fontSize: 13,
  },
  chevron: {
    fontSize: 24,
    marginLeft: 10,
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  themeIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  themeOptionContent: {
    flex: 1,
  },
  themeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeOptionDescription: {
    fontSize: 13,
  },
  checkmark: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalButton: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
