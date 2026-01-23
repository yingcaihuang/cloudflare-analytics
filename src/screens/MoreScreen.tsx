/**
 * MoreScreen
 * Provides access to additional features and settings
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

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

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>更多功能</Text>
        <Text style={styles.headerSubtitle}>探索更多分析和管理功能</Text>
      </View>

      {Object.entries(groupedItems).map(([category, items]) => (
        <View key={category} style={styles.section}>
          <Text style={styles.sectionTitle}>{category}</Text>
          {items.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.menuItemIcon}>
                <Text style={styles.iconText}>{item.icon}</Text>
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemDescription}>{item.description}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Cloudflare Analytics v1.0.0</Text>
      </View>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
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
    color: '#333',
    marginBottom: 3,
  },
  menuItemDescription: {
    fontSize: 13,
    color: '#666',
  },
  chevron: {
    fontSize: 24,
    color: '#ccc',
    marginLeft: 10,
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});
