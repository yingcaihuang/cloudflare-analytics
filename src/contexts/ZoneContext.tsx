import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthManager from '../services/AuthManager';
import { Zone } from '../types/common';

interface Account {
  id: string;
  name: string;
}

interface ZoneContextType {
  accounts: Account[];
  selectedAccount: Account | null;
  zones: Zone[];
  zoneId: string | null;
  zoneName: string | null;
  setSelectedAccount: (account: Account | null) => Promise<void>;
  setZoneId: (zoneId: string | null) => void;
  isLoading: boolean;
  error: string | null;
  refreshAccounts: () => Promise<void>;
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
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneId, setZoneIdState] = useState<string | null>(null);
  const [zoneName, setZoneName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated
      const token = await AuthManager.getCurrentToken();
      if (!token) {
        setIsLoading(false);
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

      // Don't auto-select - let user choose
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const selectAccount = async (account: Account | null) => {
    if (!account) {
      // Reset account and zones
      setSelectedAccountState(null);
      setZones([]);
      setZoneIdState(null);
      setZoneName(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSelectedAccountState(account);
      
      // Clear previous zones
      setZones([]);
      setZoneIdState(null);
      setZoneName(null);

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

      // Don't auto-select zone - let user choose
    } catch (err) {
      console.error('Error loading zones:', err);
      setError(err instanceof Error ? err.message : 'Failed to load zones');
      setZones([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const setSelectedAccount = async (account: Account | null) => {
    await selectAccount(account);
  };

  const setZoneId = (newZoneId: string | null) => {
    setZoneIdState(newZoneId);
    if (newZoneId) {
      const zone = zones.find(z => z.id === newZoneId);
      if (zone) {
        setZoneName(zone.name);
      }
    } else {
      setZoneName(null);
    }
  };

  const refreshAccounts = async () => {
    await loadAccounts();
  };

  return (
    <ZoneContext.Provider value={{ 
      accounts,
      selectedAccount,
      zones,
      zoneId, 
      zoneName, 
      setSelectedAccount,
      setZoneId, 
      isLoading, 
      error,
      refreshAccounts,
    }}>
      {children}
    </ZoneContext.Provider>
  );
};
