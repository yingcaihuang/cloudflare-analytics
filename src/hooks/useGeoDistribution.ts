/**
 * useGeoDistribution Hook
 * Custom hook for fetching and managing geographic distribution data
 * Implements data loading with GraphQL + caching, loading states, error handling, and refresh
 */

import { useState, useEffect, useCallback } from 'react';
import GraphQLClient from '../services/GraphQLClient';
import CacheManager from '../services/CacheManager';
import { GeoData, MetricsQueryParams } from '../types';

interface UseGeoDistributionResult {
  data: GeoData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastRefreshTime: Date | null;
  isFromCache: boolean;
}

const CACHE_KEY_PREFIX = 'geo_distribution_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Custom hook for fetching geographic distribution data
 * @param params - Query parameters including zoneId and date range
 * @param autoFetch - Whether to automatically fetch data on mount (default: true)
 * @returns Object containing data, loading state, error, and refresh function
 */
export function useGeoDistribution(
  params: MetricsQueryParams,
  autoFetch: boolean = true
): UseGeoDistributionResult {
  const [data, setData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  console.log('[useGeoDistribution] Hook called with params:', params);
  console.log('[useGeoDistribution] autoFetch:', autoFetch);

  // Extract stable values from params to avoid infinite loops
  const zoneId = params.zoneId;
  const accountTag = params.accountTag;
  const startDateStr = params.startDate.toISOString();
  const endDateStr = params.endDate.toISOString();

  // Generate cache key based on params
  const getCacheKey = useCallback(() => {
    return `${CACHE_KEY_PREFIX}${zoneId}_${startDateStr}_${endDateStr}`;
  }, [zoneId, accountTag, startDateStr, endDateStr]);

  // Fetch data from API or cache
  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    console.log('[useGeoDistribution] fetchData called, forceRefresh:', forceRefresh);
    console.log('[useGeoDistribution] params.zoneId:', zoneId);
    
    if (!zoneId) {
      console.log('[useGeoDistribution] No zoneId, skipping fetch');
      setError('No zone selected');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const cacheKey = getCacheKey();
      console.log('[useGeoDistribution] Cache key:', cacheKey);

      // Try to load from cache first if not forcing refresh
      if (!forceRefresh) {
        console.log('[useGeoDistribution] Checking cache...');
        const cachedData = await CacheManager.getData<GeoData>(cacheKey);
        if (cachedData) {
          console.log('[useGeoDistribution] Found cached data');
          setData(cachedData.data);
          setLastRefreshTime(cachedData.timestamp);
          setIsFromCache(true);
          setLoading(false);
          return;
        }
        console.log('[useGeoDistribution] No cached data found');
      }

      // Fetch from API
      console.log('[useGeoDistribution] Fetching from API...');
      const result = await GraphQLClient.queryGeoDistribution(params);
      console.log('[useGeoDistribution] API result:', result);
      
      // Save to cache
      await CacheManager.saveData(cacheKey, result, CACHE_TTL);
      
      // Update state
      setData(result);
      setLastRefreshTime(new Date());
      setIsFromCache(false);
    } catch (err) {
      console.error('[useGeoDistribution] Error:', err);
      // On error, try to load from cache as fallback
      const cacheKey = getCacheKey();
      const cachedData = await CacheManager.getData<GeoData>(cacheKey);
      
      if (cachedData) {
        setData(cachedData.data);
        setLastRefreshTime(cachedData.timestamp);
        setIsFromCache(true);
        setError('Failed to fetch fresh data. Showing cached data.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch geographic distribution');
      }
    } finally {
      setLoading(false);
    }
  }, [zoneId, accountTag, startDateStr, endDateStr, getCacheKey]);

  // Refresh function that forces a fresh fetch
  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Auto-fetch on mount or when params change
  useEffect(() => {
    console.log('[useGeoDistribution] useEffect triggered, autoFetch:', autoFetch);
    if (autoFetch) {
      console.log('[useGeoDistribution] Calling fetchData...');
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
