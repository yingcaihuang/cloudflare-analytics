import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthManager from '../services/AuthManager';
import { Zone } from '../types/common';

// Storage keys for persistence
const SELECTED_ACCOUNT_KEY = 'cloudflare_selected_account';
const SELECTED_ZONE_KEY = 'cloudflare_selected_zone';
const ZONES_CACHE_KEY = 'cloudflare_zones_cache';

interface Account {
  id: string;
  name: string;
}

interface ZoneContextType {
  accounts: Account[];
  selectedAccount: Account | null;
  accountTag: string | null; // Account ID for GraphQL queries
  zones: Zone[];
  zoneId: string | null;
  zoneName: string | null;
  accountZoneCounts: Map<string, number>; // Map of account ID to zone count
  totalZonesCount: number; // Total zones across all accounts
  setSelectedAccount: (account: Account | null) => Promise<void>;
  setZoneId: (zoneId: string | null) => void;
  isLoading: boolean;
  error: string | null;
  refreshAccounts: () => Promise<void>;
  refreshZones: () => Promise<void>;
}

const ZoneContext = createContext<ZoneContextType | undefined>(undefined);

export const useZone = (): ZoneContextType => {
  const context = useContext(ZoneContext);
  if (!context) {
    throw new Error('useZone must be used within a ZoneProvider');
  }
  return context;
};

interface ZoneProviderProps {
  children: ReactNode;
}

export const ZoneProvider: React.FC<ZoneProviderProps> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccountState] = useState<Account | null>(null);
  const [accountTag, setAccountTag] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneId, setZoneIdState] = useState<string | null>(null);
  const [zoneName, setZoneName] = useState<string | null>(null);
  const [accountZoneCounts, setAccountZoneCounts] = useState<Map<string, number>>(new Map());
  const [totalZonesCount, setTotalZonesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeContext();
  }, []);

  /**
   * Initialize context by loading persisted data and accounts
   */
  const initializeContext = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated
      const token = await AuthManager.getCurrentToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Load persisted account and zone selections
      const [persistedAccountJson, persistedZoneId, persistedZonesJson] = await Promise.all([
        AsyncStorage.getItem(SELECTED_ACCOUNT_KEY),
        AsyncStorage.getItem(SELECTED_ZONE_KEY),
        AsyncStorage.getItem(ZONES_CACHE_KEY),
      ]);

      // Load accounts from API
      await loadAccounts();

      // Restore persisted account if available
      if (persistedAccountJson) {
        try {
          const persistedAccount: Account = JSON.parse(persistedAccountJson);
          setSelectedAccountState(persistedAccount);
          setAccountTag(persistedAccount.id); // Set account tag for GraphQL queries

          // Restore cached zones if available
          if (persistedZonesJson) {
            const cachedZones: Zone[] = JSON.parse(persistedZonesJson);
            setZones(cachedZones);
          }

          // Restore zone selection if available
          if (persistedZoneId) {
            setZoneIdState(persistedZoneId);
            
            // Find zone name from cached zones
            if (persistedZonesJson) {
              const cachedZones: Zone[] = JSON.parse(persistedZonesJson);
              const zone = cachedZones.find(z => z.id === persistedZoneId);
              if (zone) {
                setZoneName(zone.name);
              }
            }
          }
        } catch (err) {
          console.error('Error restoring persisted data:', err);
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing context:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize');
      setIsLoading(false);
    }
  };

  /**
   * Load accounts from Cloudflare API
   */
  const loadAccounts = async () => {
    try {
      setError(null);

      // Check if user is authenticated
      const token = await AuthManager.getCurrentToken();
      if (!token) {
        return;
      }

      // Fetch accounts from Cloudflare API with pagination
      const allAccounts: Account[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts?page=${page}&per_page=100`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch accounts: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Accounts API response (page ${page}):`, JSON.stringify(data, null, 2));

        if (!data.success) {
          throw new Error(data.errors?.[0]?.message || 'Failed to fetch accounts');
        }

        const pageAccounts: Account[] = data.result?.map((acc: any) => ({
          id: acc.id,
          name: acc.name,
        })) || [];

        allAccounts.push(...pageAccounts);

        // Check if there are more pages
        const resultInfo = data.result_info;
        hasMore = resultInfo && resultInfo.page < resultInfo.total_pages;
        page++;
      }

      console.log(`Total accounts loaded: ${allAccounts.length}`);
      setAccounts(allAccounts);
      
      // Load total zones count
      await loadTotalZonesCount(token);
    } catch (err) {
      console.error('Error loading accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    }
  };

  /**
   * Load total zones count across all accounts
   */
  const loadTotalZonesCount = async (token: string) => {
    try {
      // Fetch first page to get total count from result_info
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones?per_page=1`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch zones count: ${response.status}`);
        return;
      }

      const data = await response.json();
      
      if (data.success && data.result_info) {
        const totalCount = data.result_info.total_count || 0;
        console.log(`Total zones count: ${totalCount}`);
        setTotalZonesCount(totalCount);
      }
    } catch (err) {
      console.error('Error loading total zones count:', err);
      // Don't throw error, just log it - this is not critical
    }
  };

  /**
   * Load zones for the selected account
   */
  const loadZones = async (account: Account) => {
    try {
      setError(null);

      // Fetch zones for this account
      const token = await AuthManager.getCurrentToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch all zones for this account with pagination
      const allZones: Zone[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/zones?account.id=${account.id}&page=${page}&per_page=100`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch zones: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Zones API response for ${account.name} (page ${page}):`, JSON.stringify(data, null, 2));

        if (!data.success) {
          throw new Error(data.errors?.[0]?.message || 'Failed to fetch zones');
        }

        const pageZones: Zone[] = data.result?.map((zone: any) => ({
          id: zone.id,
          name: zone.name,
          status: zone.status,
          plan: zone.plan?.name || 'Unknown',
        })) || [];

        allZones.push(...pageZones);

        // Check if there are more pages
        const resultInfo = data.result_info;
        hasMore = resultInfo && resultInfo.page < resultInfo.total_pages;
        page++;
      }

      console.log(`Total zones loaded for ${account.name}: ${allZones.length}`);
      setZones(allZones);

      // Update zone count for this account
      setAccountZoneCounts(prev => {
        const newMap = new Map(prev);
        newMap.set(account.id, allZones.length);
        return newMap;
      });

      // Cache zones for this account
      await AsyncStorage.setItem(ZONES_CACHE_KEY, JSON.stringify(allZones));

      return allZones;
    } catch (err) {
      console.error('Error loading zones:', err);
      setError(err instanceof Error ? err.message : 'Failed to load zones');
      setZones([]); // Set empty array on error
      return [];
    }
  };

  /**
   * Set the selected account and load its zones
   */
  const setSelectedAccount = async (account: Account | null) => {
    if (!account) {
      // Reset account and zones
      setSelectedAccountState(null);
      setAccountTag(null);
      setZones([]);
      setZoneIdState(null);
      setZoneName(null);
      
      // Clear persisted data
      await AsyncStorage.removeItem(SELECTED_ACCOUNT_KEY);
      await AsyncStorage.removeItem(SELECTED_ZONE_KEY);
      await AsyncStorage.removeItem(ZONES_CACHE_KEY);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSelectedAccountState(account);
      setAccountTag(account.id); // Set account tag for GraphQL queries
      
      // Clear previous zones
      setZones([]);
      setZoneIdState(null);
      setZoneName(null);

      // Persist account selection
      await AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, JSON.stringify(account));

      // Load zones for this account
      await loadZones(account);
    } catch (err) {
      console.error('Error setting selected account:', err);
      setError(err instanceof Error ? err.message : 'Failed to set account');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Set the selected zone ID
   */
  const setZoneId = async (newZoneId: string | null) => {
    setZoneIdState(newZoneId);
    
    if (newZoneId) {
      const zone = zones.find(z => z.id === newZoneId);
      if (zone) {
        setZoneName(zone.name);
      }
      
      // Persist zone selection
      await AsyncStorage.setItem(SELECTED_ZONE_KEY, newZoneId);
    } else {
      setZoneName(null);
      
      // Clear persisted zone selection
      await AsyncStorage.removeItem(SELECTED_ZONE_KEY);
    }
  };

  /**
   * Refresh accounts from API
   */
  const refreshAccounts = async () => {
    setIsLoading(true);
    await loadAccounts();
    setIsLoading(false);
  };

  /**
   * Refresh zones for the current account
   */
  const refreshZones = async () => {
    if (!selectedAccount) {
      return;
    }
    
    setIsLoading(true);
    await loadZones(selectedAccount);
    setIsLoading(false);
  };

  return (
    <ZoneContext.Provider value={{ 
      accounts,
      selectedAccount,
      accountTag,
      zones,
      zoneId, 
      zoneName,
      accountZoneCounts,
      totalZonesCount,
      setSelectedAccount,
      setZoneId, 
      isLoading, 
      error,
      refreshAccounts,
      refreshZones,
    }}>
      {children}
    </ZoneContext.Provider>
  );
};
