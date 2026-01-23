/**
 * Metrics Type Definitions
 */

export interface TimeSeriesPoint {
  timestamp: Date;
  requests: number;
  bytes: number;
  bandwidth: number;
}

export interface TrafficMetrics {
  zoneId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  requests: number;
  bytes: number;
  bandwidth: number;
  pageViews: number;
  visits: number;
  timeSeries?: TimeSeriesPoint[];
}

export interface StatusCodeData {
  total: number;
  status2xx: number;
  status3xx: number;
  status4xx: number;
  status5xx: number;
  breakdown: {
    [code: string]: number;
  };
}

export interface SecurityMetrics {
  cacheStatus: {
    hit: number;
    miss: number;
    expired: number;
    stale: number;
  };
  firewallEvents: {
    total: number;
    blocked: number;
    challenged: number;
    allowed: number;
  };
  botScore: {
    average: number;
    distribution: {
      range: string;
      count: number;
    }[];
  };
  threatScore: {
    average: number;
    high: number;
    medium: number;
    low: number;
  };
  timeSeries?: SecurityEventTimeSeriesPoint[];
}

export interface SecurityEventTimeSeriesPoint {
  timestamp: Date;
  blocked: number;
  challenged: number;
  allowed: number;
  total: number;
}

export interface GeoData {
  countries: {
    code: string;
    name: string;
    requests: number;
    bytes: number;
    percentage: number;
  }[];
}

export interface ProtocolData {
  http1_0: number;
  http1_1: number;
  http2: number;
  http3: number;
  total: number;
}

export interface TLSData {
  tls1_0: number;
  tls1_1: number;
  tls1_2: number;
  tls1_3: number;
  total: number;
  insecurePercentage: number;
}

export interface ContentTypeData {
  types: {
    contentType: string;
    requests: number;
    bytes: number;
    percentage: number;
  }[];
}

export interface BotAnalysisData {
  totalRequests: number;
  botRequests: number;
  botPercentage: number;
  scoreDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
}

export interface FirewallAnalysisData {
  totalEvents: number;
  rules: {
    ruleId: string;
    ruleName: string;
    action: string;
    count: number;
    percentage: number;
  }[];
  topRules: {
    ruleId: string;
    ruleName: string;
    action: string;
    count: number;
    percentage: number;
  }[];
}
