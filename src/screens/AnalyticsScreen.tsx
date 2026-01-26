/**
 * AnalyticsScreen
 * Dedicated screen for traffic and security analysis features
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';

type NavigationProp = NativeStackNavigationProp<any>;

interface AnalyticsMenuItem {
  title: string;
  description: string;
  screen: string;
  icon: string;
}

interface AnalyticsSection {
  title: string;
  items: AnalyticsMenuItem[];
}

export default function AnalyticsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();

  const sections: AnalyticsSection[] = [
    {
      title: '流量分析',
      items: [
        {
          title: '地理分布',
          description: '查看流量的地理位置分布',
          screen: 'GeoDistribution',
          icon: '🌍',
        },
        {
          title: '协议分布',
          description: 'HTTP/1.1, HTTP/2, HTTP/3 使用情况',
          screen: 'ProtocolDistribution',
          icon: '📡',
        },
        {
          title: 'TLS 版本',
          description: 'SSL/TLS 版本分布和安全性',
          screen: 'TLSDistribution',
          icon: '🔒',
        },
        {
          title: '内容类型',
          description: '请求的内容类型分布',
          screen: 'ContentType',
          icon: '📄',
        },
        {
          title: '状态码分析',
          description: 'HTTP 状态码分布',
          screen: 'StatusCodes',
          icon: '📊',
        },
      ],
    },
    {
      title: '安全分析',
      items: [
        {
          title: 'Bot 分析',
          description: 'Bot 流量和评分分布',
          screen: 'BotAnalysis',
          icon: '🤖',
        },
        {
          title: 'Firewall 分析',
          description: '防火墙规则触发统计',
          screen: 'FirewallAnalysis',
          icon: '🛡️',
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>分析指标</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>深入了解流量和安全数据</Text>
        </View>

        {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, backgroundColor: isDark ? colors.background : '#f9f9f9' }]}>
            {section.title}
          </Text>
          {section.items.map((item) => (
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
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
});
