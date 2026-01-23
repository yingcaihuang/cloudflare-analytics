/**
 * useFirewallAnalysis Hook
 * Fetches and manages Firewall analysis data
 */

import { useState, useEffect, useCallback } from 'react';
import GraphQLClient from '../services/GraphQLClient';
import CacheManager from '../services/CacheManager';
import { useZone } from '../contexts/ZoneContext';
import { FirewallAnalysisData } from '../types/metrics';

interface UseFirewallAnalysisResult {
  data: FirewallAnalysisData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastRefresh: Date | null;
}

/**
 * Custom hook for fetching Firewall analysis data
 * @param startDate - Start date for the query
 * @param endDate - End date for the query
 * @returns Firewall analysis data, loading state, error, and refresh function
 */
export function useFirewallAnalysis(
  startDate: Date,
  endDate: Date
): UseFirewallAnalysisResult {
  const { zoneId } = useZone();
  const [data, setData] = useState<FirewallAnalysisData | null>(null);
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
      const cacheKey = `firewall_analysis_${zoneId}_${startDate.toISOString()}_${endDate.toISOString()}`;

      // Try to load from cache first
      if (useCache) {
        const cachedData = await CacheManager.getData<FirewallAnalysisData>(cacheKey);
        if (cachedData && !cachedData.isStale) {
          console.log('Using cached firewall analysis data');
          setData(cachedData.data);
          setLastRefresh(cachedData.timestamp);
          setLoading(false);
          return;
        }
      }

      // Fetch from API
      console.log('Fetching firewall analysis data from API');
      const result = await GraphQLClient.queryFirewallAnalysis({
        zoneId,
        startDate,
        endDate,
      });

      setData(result);
      setLastRefresh(new Date());

      // Save to cache (TTL: 5 minutes)
      await CacheManager.saveData(cacheKey, result, 300);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching firewall analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch firewall analysis data');
      setLoading(false);

      // Try to load stale cache data as fallback
      if (zoneId) {
        const cacheKey = `firewall_analysis_${zoneId}_${startDate.toISOString()}_${endDate.toISOString()}`;
        const cachedData = await CacheManager.getData<FirewallAnalysisData>(cacheKey);
        if (cachedData) {
          console.log('Using stale cached firewall analysis data as fallback');
          setData(cachedData.data);
          setLastRefresh(cachedData.timestamp);
        }
      }
    }
  }, [zoneId, startDate, endDate]);

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
