/**
 * Common Type Definitions
 */

export interface Zone {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'inactive';
  plan: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface MetricsQueryParams {
  zoneId: string;
  accountTag?: string; // Account ID for account-level queries
  startDate: Date;
  endDate: Date;
  granularity?: 'hour' | 'day';
}

export interface CachedData<T> {
  data: T;
  timestamp: Date;
  isStale: boolean;
}
