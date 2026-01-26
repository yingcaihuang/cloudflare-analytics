/**
 * MetricCardContent Component
 * Renders different metric card content based on card type
 * Supports all metric types defined in the dashboard configuration
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useZone } from '../contexts/ZoneContext';
import { useTrafficMetrics } from '../hooks/useTrafficMetrics';
import { useSecurityMetrics } from '../hooks/useSecurityMetrics';
import { useStatusCodes } from '../hooks/useStatusCodes';
import { useBotAnalysis } from '../hooks/useBotAnalysis';
import { useGeoDistribution } from '../hooks/useGeoDistribution';
import { MetricCardType } from '../types/dashboard';

export interface MetricCardContentProps {
  type: MetricCardType;
  startDate: Date;
  endDate: Date;
}

/**
 * Format large numbers with K, M, B suffixes
 */
const formatNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Format bytes to human-readable format
 */
const formatBytes = (bytes: number): string => {
  if (bytes >= 1_099_511_627_776) {
    return `${(bytes / 1_099_511_627_776).toFixed(2)} TB`;
  }
  if (bytes >= 1_073_741_824) {
    return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  }
  if (bytes >= 1_048_576) {
    return `${(bytes / 1_048_576).toFixed(2)} MB`;
  }
  if (bytes >= 1_024) {
    return `${(bytes / 1_024).toFixed(2)} KB`;
  }
  return `${bytes} B`;
};

/**
 * Format bandwidth (bytes per second)
 */
const formatBandwidth = (bytesPerSecond: number): string => {
  if (bytesPerSecond >= 1_073_741_824) {
    return `${(bytesPerSecond / 1_073_741_824).toFixed(2)} GB/s`;
  }
  if (bytesPerSecond >= 1_048_576) {
    return `${(bytesPerSecond / 1_048_576).toFixed(2)} MB/s`;
  }
  if (bytesPerSecond >= 1_024) {
    return `${(bytesPerSecond / 1_024).toFixed(2)} KB/s`;
  }
  return `${bytesPerSecond.toFixed(2)} B/s`;
};

/**
 * Total Requests Card
 */
const TotalRequestsCard: React.FC<{ startDate: Date; endDate: Date }> = ({ startDate, endDate }) => {
  const { colors } = useTheme();
  const { zoneId, accountTag } = useZone();
  
  const { data, loading, error } = useTrafficMetrics({
    zoneId: zoneId || '',
    accountTag: accountTag || undefined,
    startDate,
    endDate,
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error || '无数据'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.cardContent}>
      <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>总请求数</Text>
      <Text style={[styles.cardValue, { color: colors.text }]}>
        {formatNumber(data.requests)}
      </Text>
    </View>
  );
};

/**
 * Data Transfer Card
 */
const DataTransferCard: React.FC<{ startDate: Date; endDate: Date }> = ({ startDate, endDate }) => {
  const { colors } = useTheme();
  const { zoneId, accountTag } = useZone();
  
  const { data, loading, error } = useTrafficMetrics({
    zoneId: zoneId || '',
    accountTag: accountTag || undefined,
    startDate,
    endDate,
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error || '无数据'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.cardContent}>
      <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>数据传输</Text>
      <Text style={[styles.cardValue, { color: colors.text }]}>
        {formatBytes(data.bytes)}
      </Text>
    </View>
  );
};

/**
 * Bandwidth Card
 */
const BandwidthCard: React.FC<{ startDate: Date; endDate: Date }> = ({ startDate, endDate }) => {
  const { colors } = useTheme();
  const { zoneId, accountTag } = useZone();
  
  const { data, loading, error } = useTrafficMetrics({
    zoneId: zoneId || '',
    accountTag: accountTag || undefined,
    startDate,
    endDate,
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error || '无数据'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.cardContent}>
      <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>带宽</Text>
      <Text style={[styles.cardValue, { color: colors.text }]}>
        {formatBandwidth(data.bandwidth)}
      </Text>
    </View>
  );
};

/**
 * Cache Hit Rate Card
 */
const CacheHitRateCard: React.FC<{ startDate: Date; endDate: Date }> = ({ startDate, endDate }) => {
  const { colors } = useTheme();
  const { zoneId, accountTag } = useZone();
  
  const { data, loading, error } = useSecurityMetrics({
    zoneId: zoneId || '',
    accountTag: accountTag || undefined,
    startDate,
    endDate,
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error || '无数据'}
        </Text>
      </View>
    );
  }

  const total = data.cacheStatus.hit + data.cacheStatus.miss + 
                data.cacheStatus.expired + data.cacheStatus.stale;
  const hitRate = total > 0 ? ((data.cacheStatus.hit / total) * 100).toFixed(1) : '0.0';

  return (
    <View style={styles.cardContent}>
      <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>缓存命中率</Text>
      <Text style={[styles.cardValue, { color: colors.text }]}>
        {hitRate}%
      </Text>
    </View>
  );
};

/**
 * Firewall Events Card
 */
const FirewallEventsCard: React.FC<{ startDate: Date; endDate: Date }> = ({ startDate, endDate }) => {
  const { colors } = useTheme();
  const { zoneId, accountTag } = useZone();
  
  const { data, loading, error } = useSecurityMetrics({
    zoneId: zoneId || '',
    accountTag: accountTag || undefined,
    startDate,
    endDate,
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error || '无数据'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.cardContent}>
      <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>防火墙事件</Text>
      <Text style={[styles.cardValue, { color: colors.text }]}>
        {formatNumber(data.firewallEvents.total)}
      </Text>
      <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
        阻止: {formatNumber(data.firewallEvents.blocked)} | 
        挑战: {formatNumber(data.firewallEvents.challenged)}
      </Text>
    </View>
  );
};

/**
 * Blocked Requests Card
 */
const BlockedRequestsCard: React.FC<{ startDate: Date; endDate: Date }> = ({ startDate, endDate }) => {
  const { colors } = useTheme();
  const { zoneId, accountTag } = useZone();
  
  const { data, loading, error } = useSecurityMetrics({
    zoneId: zoneId || '',
    accountTag: accountTag || undefined,
    startDate,
    endDate,
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error || '无数据'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.cardContent}>
      <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>被阻止的请求</Text>
      <Text style={[styles.cardValue, { color: colors.text }]}>
        {formatNumber(data.firewallEvents.blocked)}
      </Text>
    </View>
  );
};

/**
 * Status 2xx Card
 */
const Status2xxCard: React.FC<{ startDate: Date; endDate: Date }> = ({ startDate, endDate }) => {
  const { colors } = useTheme();
  const { zoneId, accountTag } = useZone();
  
  const { data, loading, error } = useStatusCodes({
    zoneId: zoneId || '',
    accountTag: accountTag || undefined,
    startDate,
    endDate,
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error || '无数据'}
        </Text>
      </View>
    );
  }

  const percentage = data.total > 0 ? ((data.status2xx / data.total) * 100).toFixed(1) : '0.0';

  return (
    <View style={styles.cardContent}>
      <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>2xx 成功</Text>
      <Text style={[styles.cardValue, { color: colors.success }]}>
        {percentage}%
      </Text>
      <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
        {formatNumber(data.status2xx)} 请求
      </Text>
    </View>
  );
};

/**
 * Status 4xx Card
 */
const Status4xxCard: React.FC<{ startDate: Date; endDate: Date }> = ({ startDate, endDate }) => {
  const { colors } = useTheme();
  const { zoneId, accountTag } = useZone();
  
  const { data, loading, error } = useStatusCodes({
    zoneId: zoneId || '',
    accountTag: accountTag || undefined,
    startDate,
    endDate,
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error || '无数据'}
        </Text>
      </View>
    );
  }

  const percentage = data.total > 0 ? ((data.status4xx / data.total) * 100).toFixed(1) : '0.0';

  return (
    <View style={styles.cardContent}>
      <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>4xx 客户端错误</Text>
      <Text style={[styles.cardValue, { color: colors.warning }]}>
        {percentage}%
      </Text>
      <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
        {formatNumber(data.status4xx)} 请求
      </Text>
    </View>
  );
};

/**
 * Status 5xx Card
 */
const Status5xxCard: React.FC<{ startDate: Date; endDate: Date }> = ({ startDate, endDate }) => {
  const { colors } = useTheme();
  const { zoneId, accountTag } = useZone();
  
  const { data, loading, error } = useStatusCodes({
    zoneId: zoneId || '',
    accountTag: accountTag || undefined,
    startDate,
    endDate,
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error || '无数据'}
        </Text>
      </View>
    );
  }

  const percentage = data.total > 0 ? ((data.status5xx / data.total) * 100).toFixed(1) : '0.0';

  return (
    <View style={styles.cardContent}>
      <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>5xx 服务器错误</Text>
      <Text style={[styles.cardValue, { color: colors.error }]}>
        {percentage}%
      </Text>
      <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
        {formatNumber(data.status5xx)} 请求
      </Text>
    </View>
  );
};

/**
 * Bot Traffic Card
 */
const BotTrafficCard: React.FC<{ startDate: Date; endDate: Date }> = ({ startDate, endDate }) => {
  const { colors } = useTheme();
  
  const { data, loading, error } = useBotAnalysis(startDate, endDate);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error || '无数据'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.cardContent}>
      <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Bot 流量</Text>
      <Text style={[styles.cardValue, { color: colors.text }]}>
        {data.botPercentage.toFixed(1)}%
      </Text>
      <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
        {formatNumber(data.botRequests)} / {formatNumber(data.totalRequests)} 请求
      </Text>
    </View>
  );
};

/**
 * Geo Distribution Card
 */
const GeoDistributionCard: React.FC<{ startDate: Date; endDate: Date }> = ({ startDate, endDate }) => {
  const { colors } = useTheme();
  const { zoneId, accountTag } = useZone();
  
  const { data, loading, error } = useGeoDistribution({
    zoneId: zoneId || '',
    accountTag: accountTag || undefined,
    startDate,
    endDate,
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error || '无数据'}
        </Text>
      </View>
    );
  }

  const topCountries = data.countries.slice(0, 3);

  return (
    <View style={styles.cardContent}>
      <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>地理分布</Text>
      {topCountries.length > 0 ? (
        <View style={styles.geoList}>
          {topCountries.map((country, index) => (
            <Text key={country.code} style={[styles.geoItem, { color: colors.text }]}>
              {index + 1}. {country.name} ({country.percentage.toFixed(1)}%)
            </Text>
          ))}
        </View>
      ) : (
        <Text style={[styles.cardValue, { color: colors.textSecondary }]}>无数据</Text>
      )}
    </View>
  );
};

/**
 * Main MetricCardContent Component
 * Renders the appropriate card based on type
 */
export const MetricCardContent: React.FC<MetricCardContentProps> = ({ 
  type, 
  startDate, 
  endDate 
}) => {
  switch (type) {
    case 'total_requests':
      return <TotalRequestsCard startDate={startDate} endDate={endDate} />;
    case 'data_transfer':
      return <DataTransferCard startDate={startDate} endDate={endDate} />;
    case 'bandwidth':
      return <BandwidthCard startDate={startDate} endDate={endDate} />;
    case 'cache_hit_rate':
      return <CacheHitRateCard startDate={startDate} endDate={endDate} />;
    case 'firewall_events':
      return <FirewallEventsCard startDate={startDate} endDate={endDate} />;
    case 'blocked_requests':
      return <BlockedRequestsCard startDate={startDate} endDate={endDate} />;
    case 'status_2xx':
      return <Status2xxCard startDate={startDate} endDate={endDate} />;
    case 'status_4xx':
      return <Status4xxCard startDate={startDate} endDate={endDate} />;
    case 'status_5xx':
      return <Status5xxCard startDate={startDate} endDate={endDate} />;
    case 'bot_traffic':
      return <BotTrafficCard startDate={startDate} endDate={endDate} />;
    case 'geo_distribution':
      return <GeoDistributionCard startDate={startDate} endDate={endDate} />;
    default:
      return (
        <View style={styles.cardContent}>
          <Text style={styles.errorText}>未知卡片类型: {type}</Text>
        </View>
      );
  }
};

const styles = StyleSheet.create({
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  geoList: {
    marginTop: 8,
  },
  geoItem: {
    fontSize: 14,
    marginBottom: 4,
  },
});

