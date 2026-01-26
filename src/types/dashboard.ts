/**
 * Dashboard Types
 * Type definitions for custom dashboard feature
 */

/**
 * 指标卡片类型
 */
export type MetricCardType =
  | 'total_requests'
  | 'data_transfer'
  | 'bandwidth'
  | 'page_views'
  | 'visits'
  | 'cache_hit_rate'
  | 'firewall_events'
  | 'blocked_requests'
  | 'challenged_requests'
  | 'bot_traffic'
  | 'status_2xx'
  | 'status_4xx'
  | 'status_5xx'
  | 'geo_distribution';

/**
 * 指标卡片配置
 */
export interface MetricCard {
  id: string;
  type: MetricCardType;
  visible: boolean;
  order: number;
}

/**
 * 仪表板布局
 */
export interface DashboardLayout {
  id: string;
  name: string;
  cards: MetricCard[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 仪表板配置
 */
export interface DashboardConfig {
  layouts: Record<string, DashboardLayout>;
  activeLayoutId: string;
  version: string;
}

/**
 * 指标卡片元数据
 */
export interface MetricCardMetadata {
  type: MetricCardType;
  title: string;
  description: string;
  category: 'traffic' | 'security' | 'status' | 'distribution';
  icon: string;
  defaultVisible: boolean;
}

/**
 * 默认指标卡片列表
 */
export const DEFAULT_METRIC_CARDS: MetricCard[] = [
  { id: 'total_requests', type: 'total_requests', visible: true, order: 0 },
  { id: 'data_transfer', type: 'data_transfer', visible: true, order: 1 },
  { id: 'bandwidth', type: 'bandwidth', visible: true, order: 2 },
  { id: 'cache_hit_rate', type: 'cache_hit_rate', visible: true, order: 3 },
  { id: 'firewall_events', type: 'firewall_events', visible: true, order: 4 },
  { id: 'blocked_requests', type: 'blocked_requests', visible: true, order: 5 },
  { id: 'status_2xx', type: 'status_2xx', visible: true, order: 6 },
  { id: 'status_4xx', type: 'status_4xx', visible: true, order: 7 },
  { id: 'status_5xx', type: 'status_5xx', visible: false, order: 8 },
  { id: 'bot_traffic', type: 'bot_traffic', visible: false, order: 9 },
  { id: 'geo_distribution', type: 'geo_distribution', visible: false, order: 10 },
];

/**
 * 默认布局
 */
export const DEFAULT_LAYOUT: DashboardLayout = {
  id: 'default',
  name: '默认布局',
  cards: DEFAULT_METRIC_CARDS,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * 指标卡片元数据映射
 */
export const METRIC_CARD_METADATA: Record<MetricCardType, MetricCardMetadata> = {
  total_requests: {
    type: 'total_requests',
    title: '总请求数',
    description: '总 HTTP 请求数',
    category: 'traffic',
    icon: 'bar-chart',
    defaultVisible: true,
  },
  data_transfer: {
    type: 'data_transfer',
    title: '数据传输',
    description: '总数据传输量',
    category: 'traffic',
    icon: 'download',
    defaultVisible: true,
  },
  bandwidth: {
    type: 'bandwidth',
    title: '带宽',
    description: '平均带宽使用',
    category: 'traffic',
    icon: 'activity',
    defaultVisible: true,
  },
  page_views: {
    type: 'page_views',
    title: '页面浏览量',
    description: '页面浏览总数',
    category: 'traffic',
    icon: 'eye',
    defaultVisible: false,
  },
  visits: {
    type: 'visits',
    title: '访问次数',
    description: '独立访问次数',
    category: 'traffic',
    icon: 'users',
    defaultVisible: false,
  },
  cache_hit_rate: {
    type: 'cache_hit_rate',
    title: '缓存命中率',
    description: '缓存命中百分比',
    category: 'traffic',
    icon: 'zap',
    defaultVisible: true,
  },
  firewall_events: {
    type: 'firewall_events',
    title: '防火墙事件',
    description: '防火墙事件总数',
    category: 'security',
    icon: 'shield',
    defaultVisible: true,
  },
  blocked_requests: {
    type: 'blocked_requests',
    title: '被阻止的请求',
    description: '被防火墙阻止的请求',
    category: 'security',
    icon: 'x-circle',
    defaultVisible: true,
  },
  challenged_requests: {
    type: 'challenged_requests',
    title: '受挑战的请求',
    description: '需要验证的请求',
    category: 'security',
    icon: 'alert-circle',
    defaultVisible: false,
  },
  bot_traffic: {
    type: 'bot_traffic',
    title: 'Bot 流量',
    description: 'Bot 流量百分比',
    category: 'security',
    icon: 'cpu',
    defaultVisible: false,
  },
  status_2xx: {
    type: 'status_2xx',
    title: '2xx 成功',
    description: '成功响应百分比',
    category: 'status',
    icon: 'check-circle',
    defaultVisible: true,
  },
  status_4xx: {
    type: 'status_4xx',
    title: '4xx 客户端错误',
    description: '客户端错误百分比',
    category: 'status',
    icon: 'alert-triangle',
    defaultVisible: true,
  },
  status_5xx: {
    type: 'status_5xx',
    title: '5xx 服务器错误',
    description: '服务器错误百分比',
    category: 'status',
    icon: 'x-octagon',
    defaultVisible: false,
  },
  geo_distribution: {
    type: 'geo_distribution',
    title: '地理分布',
    description: 'Top 5 国家/地区',
    category: 'distribution',
    icon: 'globe',
    defaultVisible: false,
  },
};
