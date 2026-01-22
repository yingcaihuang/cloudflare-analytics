import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  backgroundColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  backgroundColor = '#ffffff',
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return '#10b981';
      case 'down':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <Text style={styles.value}>{value}</Text>
      
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      
      {trend && trendValue && (
        <View style={styles.trendContainer}>
          <Text style={[styles.trendIcon, { color: getTrendColor() }]}>
            {getTrendIcon()}
          </Text>
          <Text style={[styles.trendValue, { color: getTrendColor() }]}>
            {trendValue}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginVertical: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trendIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
