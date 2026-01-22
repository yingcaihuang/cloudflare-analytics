/**
 * useContentTypeDistribution Hook
 * Custom hook for fetching and managing content type distribution data
 * Implements data loading with GraphQL + caching, loading states, error handling, and refresh
 */

import { useState, useEffect, useCallback } from 'react';
import GraphQLClient from '../services/GraphQLClient';
import CacheManager from '../services/CacheManager';
import { ContentTypeData, MetricsQueryParams } from '../types';

interface UseContentTypeDistributionResult {
  data: ContentTypeData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastRefreshTime: Date | null;
  isFromCache: boolean;
}

const CACHE_KEY_PREFIX = 'content_type_distribution_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Custom hook for fetching content type distribution data
 * @param params - Query parameters including zoneId and date range
 * @param autoFetch - Whether to automatically fetch data on mount (default: true)
 * @returns Object containing data, loading state, error, and refresh function
 */
export function useContentTypeDistribution(
  params: MetricsQueryParams,
  autoFetch: boolean = true
): UseContentTypeDistributionResult {
  const [data, setData] = useState<ContentTypeData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  // Generate cache key based on params
  const getCacheKey = useCallback(() => {
    const { zoneId, startDate, endDate } = params;
    return `${CACHE_KEY_PREFIX}${zoneId}_${startDate.toISOString()}_${endDate.toISOString()}`;
  }, [params]);

  // Fetch data from API or cache
  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const cacheKey = getCacheKey();

      // Try to load from cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedData = await CacheManager.getData<ContentTypeData>(cacheKey);
        if (cachedData) {
          setData(cachedData.data);
          setLastRefreshTime(cachedData.timestamp);
          setIsFromCache(true);
          setLoading(false);
          return;
        }
      }

      // Fetch from API
      const result = await GraphQLClient.queryContentTypeDistribution(params);
      
      // Save to cache
      await CacheManager.saveData(cacheKey, result, CACHE_TTL);
      
      // Update state
      setData(result);
      setLastRefreshTime(new Date());
      setIsFromCache(false);
    } catch (err) {
      // On error, try to load from cache as fallback
      const cacheKey = getCacheKey();
      const cachedData = await CacheManager.getData<ContentTypeData>(cacheKey);
      
      if (cachedData) {
        setData(cachedData.data);
        setLastRefreshTime(cachedData.timestamp);
        setIsFromCache(true);
        setError('Failed to fetch fresh data. Showing cached data.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch content type distribution');
      }
    } finally {
      setLoading(false);
    }
  }, [params, getCacheKey]);

  // Refresh function that forces a fresh fetch
  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Auto-fetch on mount or when params change
  useEffect(() => {
    if (autoFetch) {
      fetchData(false);
    }
  }, [autoFetch, fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    lastRefreshTime,
    isFromCache,
  };
}
