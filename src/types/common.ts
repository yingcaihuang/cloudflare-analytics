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
  startDate: Date;
  endDate: Date;
  granularity?: 'hour' | 'day';
}

export interface CachedData<T> {
  data: T;
  timestamp: Date;
  isStale: boolean;
}
