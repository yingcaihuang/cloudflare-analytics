/**
 * useBotAnalysis Hook
 * Fetches and manages Bot analysis data
 */

import { useState, useEffect, useCallback } from 'react';
import GraphQLClient from '../services/GraphQLClient';
import CacheManager from '../services/CacheManager';
import { useZone } from '../contexts/ZoneContext';
import { BotAnalysisData } from '../types/metrics';

interface UseBotAnalysisResult {
  data: BotAnalysisData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastRefresh: Date | null;
}

/**
 * Custom hook for fetching Bot analysis data
 * @param startDate - Start date for the query
 * @param endDate - End date for the query
 * @returns Bot analysis data, loading state, error, and refresh function
 */
export function useBotAnalysis(
  startDate: Date,
  endDate: Date
): UseBotAnalysisResult {
  const { zoneId, accountTag } = useZone();
  const [data, setData] = useState<BotAnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async (useCache: boolean = true) => {
    if (!zoneId) {
      setError('No zone selected');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Generate cache key
      const cacheKey = `bot_analysis_${zoneId}_${startDate.toISOString()}_${endDate.toISOString()}`;

      // Try to load from cache first
      if (useCache) {
        const cachedData = await CacheManager.getData<BotAnalysisData>(cacheKey);
        if (cachedData && !cachedData.isStale) {
          console.log('Using cached bot analysis data');
          setData(cachedData.data);
          setLastRefresh(cachedData.timestamp);
          setLoading(false);
          return;
        }
      }

      // Fetch from API
      console.log('Fetching bot analysis data from API');
      const result = await GraphQLClient.queryBotAnalysis({
        zoneId,
        accountTag: accountTag || undefined,
        startDate,
        endDate,
      });

      setData(result);
      setLastRefresh(new Date());

      // Save to cache (TTL: 5 minutes)
      await CacheManager.saveData(cacheKey, result, 300);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching bot analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bot analysis data');
      setLoading(false);

      // Try to load stale cache data as fallback
      if (zoneId) {
        const cacheKey = `bot_analysis_${zoneId}_${startDate.toISOString()}_${endDate.toISOString()}`;
        const cachedData = await CacheManager.getData<BotAnalysisData>(cacheKey);
        if (cachedData) {
          console.log('Using stale cached bot analysis data as fallback');
          setData(cachedData.data);
          setLastRefresh(cachedData.timestamp);
        }
      }
    }
  }, [zoneId, accountTag, startDate, endDate]);

  const refresh = useCallback(async () => {
    await fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    lastRefresh,
  };
}
