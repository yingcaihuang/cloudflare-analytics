/**
 * AccountZoneSelectionScreen
 * Screen for selecting account and zone
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useZone } from '../contexts';
import AuthManager from '../services/AuthManager';

interface AccountZoneSelectionScreenProps {
  onComplete: () => void;
}

export default function AccountZoneSelectionScreen({ onComplete }: AccountZoneSelectionScreenProps) {
  const { 
    accounts, 
    selectedAccount, 
    zones, 
    zoneId,
    accountZoneCounts,
    totalZonesCount,
    setSelectedAccount, 
    setZoneId,
    isLoading 
  } = useZone();

  const [step, setStep] = useState<'account' | 'zone'>('account');
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // 默认降序
  const [zoneSearchQuery, setZoneSearchQuery] = useState(''); // Zone 搜索关键词
  const [accountSearchQuery, setAccountSearchQuery] = useState(''); // Account 搜索关键词
  const [searchMode, setSearchMode] = useState<'account' | 'zone'>('account'); // 搜索模式：账户或Zone
  const [globalZoneSearchQuery, setGlobalZoneSearchQuery] = useState(''); // 全局Zone搜索关键词
  const [isLoadingGlobalZones, setIsLoadingGlobalZones] = useState(false);
  const [globalZones, setGlobalZones] = useState<Array<{ zone: any; accountName: string; accountId: string }>>([]);

  // Debug logging
  console.log('AccountZoneSelectionScreen state:', {
    step,
    isLoading,
    isLoadingZones,
    selectedAccount: selectedAccount?.name,
    zonesCount: zones.length,
    accountsCount: accounts.length,
  });

  const handleAccountSelect = async (account: any) => {
    console.log('Selecting account:', account.name);
    setIsLoadingZones(true);
    setStep('zone');
    
    // Wait for zones to load
    await setSelectedAccount(account);
    setIsLoadingZones(false);
  };

  const handleZoneSelect = (selectedZoneId: string) => {
    setZoneId(selectedZoneId);
    onComplete();
  };

  const handleBackToAccounts = () => {
    setStep('account');
    setZoneSearchQuery(''); // 清空搜索
  };

  /**
   * Search zones globally across all accounts
   */
  const searchGlobalZones = async (query: string) => {
    if (!query.trim()) {
      setGlobalZones([]);
      return;
    }

    setIsLoadingGlobalZones(true);
    try {
      const token = await AuthManager.getCurrentToken();
      if (!token) {
        return;
      }

      const searchQuery = query.toLowerCase().trim();
      const results: Array<{ zone: any; accountName: string; accountId: string }> = [];

      // Search through all accounts
      for (const account of accounts) {
        try {
          // Fetch zones for this account
          const response = await fetch(
            `https://api.cloudflare.com/client/v4/zones?account.id=${account.id}&per_page=100`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.result) {
              // Filter zones that match the search query
              const matchingZones = data.result.filter((zone: any) =>
                zone.name.toLowerCase().includes(searchQuery) ||
                zone.id.toLowerCase().includes(searchQuery)
              );

              // Add matching zones to results
              matchingZones.forEach((zone: any) => {
                results.push({
                  zone: {
                    id: zone.id,
                    name: zone.name,
                    status: zone.status,
                    plan: zone.plan?.name || 'Unknown',
                  },
                  accountName: account.name,
                  accountId: account.id,
                });
              });
            }
          }
        } catch (err) {
          console.error(`Error searching zones for account ${account.name}:`, err);
        }
      }

      setGlobalZones(results);
    } catch (err) {
      console.error('Error searching global zones:', err);
    } finally {
      setIsLoadingGlobalZones(false);
    }
  };

  /**
   * Handle global zone search query change
   */
  const handleGlobalZoneSearch = (query: string) => {
    setGlobalZoneSearchQuery(query);
    // Debounce search to avoid too many API calls
    if (query.trim().length >= 2) {
      searchGlobalZones(query);
    } else {
      setGlobalZones([]);
    }
  };

  /**
   * Handle selecting a zone from global search
   */
  const handleGlobalZoneSelect = async (result: { zone: any; accountName: string; accountId: string }) => {
    // Find the account
    const account = accounts.find(acc => acc.id === result.accountId);
    if (!account) return;

    // Set the account and zone
    await setSelectedAccount(account);
    setZoneId(result.zone.id);
    onComplete();
  };

  /**
   * Toggle sort order between desc and asc
   */
  const handleToggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  /**
   * Get sorted and filtered accounts list
   * 1. First filter by search query
   * 2. Then sort by zone count
   */
  const getFilteredAccounts = () => {
    // Step 1: Filter accounts by search query
    let filteredAccounts = accounts;
    
    if (accountSearchQuery.trim()) {
      const query = accountSearchQuery.toLowerCase().trim();
      filteredAccounts = accounts.filter(account => 
        account.name.toLowerCase().includes(query) ||
        account.id.toLowerCase().includes(query)
      );
    }

    // Step 2: Sort filtered accounts by zone count
    const accountsWithCounts: any[] = [];
    const accountsWithoutCounts: any[] = [];

    filteredAccounts.forEach(account => {
      const zoneCount = accountZoneCounts.get(account.id);
      if (zoneCount !== undefined) {
        accountsWithCounts.push({ ...account, zoneCount });
      } else {
        accountsWithoutCounts.push(account);
      }
    });

    // Sort accounts with zone counts
    accountsWithCounts.sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.zoneCount - a.zoneCount;
      } else {
        return a.zoneCount - b.zoneCount;
      }
    });

    // Return sorted accounts with counts first, then accounts without counts
    return [...accountsWithCounts, ...accountsWithoutCounts];
  };

  /**
   * Filter zones based on search query
   */
  const getFilteredZones = () => {
    if (!zoneSearchQuery.trim()) {
      return zones;
    }

    const query = zoneSearchQuery.toLowerCase().trim();
    return zones.filter(zone => 
      zone.name.toLowerCase().includes(query) ||
      zone.id.toLowerCase().includes(query)
    );
  };

  // Only show loading for initial account load, not when switching to zone view
  if (isLoading && step === 'account') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading accounts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>
              {step === 'account' ? '选择账户' : '选择Zone'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'account' 
                ? `${accounts.length} 个账户${totalZonesCount > 0 ? ` · ${totalZonesCount} 个 Zones` : ''}` 
                : `${selectedAccount?.name} - ${zones.length} 个zones`}
            </Text>
          </View>
          {step === 'account' && accountZoneCounts.size > 0 && (
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={handleToggleSort}
            >
              <Text style={styles.sortButtonText}>
                {sortOrder === 'desc' ? '↓' : '↑'}
              </Text>
              <Text style={styles.sortButtonLabel}>排序</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Account Selection */}
      {step === 'account' && (
        <>
          {/* Search Mode Tabs */}
          {accounts.length > 0 && (
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, searchMode === 'account' && styles.tabActive]}
                onPress={() => {
                  setSearchMode('account');
                  setGlobalZoneSearchQuery('');
                  setGlobalZones([]);
                }}
              >
                <Text style={[styles.tabText, searchMode === 'account' && styles.tabTextActive]}>
                  搜索账户
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, searchMode === 'zone' && styles.tabActive]}
                onPress={() => {
                  setSearchMode('zone');
                  setAccountSearchQuery('');
                }}
              >
                <Text style={[styles.tabText, searchMode === 'zone' && styles.tabTextActive]}>
                  搜索 Zone
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Search Bar */}
          {accounts.length > 0 && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={searchMode === 'account' ? '搜索账户名称或 ID...' : '搜索 Zone 名称或 ID...'}
                placeholderTextColor="#999"
                value={searchMode === 'account' ? accountSearchQuery : globalZoneSearchQuery}
                onChangeText={searchMode === 'account' ? setAccountSearchQuery : handleGlobalZoneSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {((searchMode === 'account' && accountSearchQuery.length > 0) || 
                (searchMode === 'zone' && globalZoneSearchQuery.length > 0)) && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => {
                    if (searchMode === 'account') {
                      setAccountSearchQuery('');
                    } else {
                      setGlobalZoneSearchQuery('');
                      setGlobalZones([]);
                    }
                  }}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Account List or Global Zone Search Results */}
          {searchMode === 'account' ? (
            <ScrollView style={styles.listContainer}>
              {getFilteredAccounts().length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>没有找到匹配的账户</Text>
                  <Text style={styles.emptySubtext}>尝试其他搜索关键词</Text>
                </View>
              ) : (
                getFilteredAccounts().map((account) => {
                  const zoneCount = accountZoneCounts.get(account.id);
                  return (
                    <TouchableOpacity
                      key={account.id}
                      style={styles.listItem}
                      onPress={() => handleAccountSelect(account)}
                    >
                      <View style={styles.listItemContent}>
                        <View style={styles.accountTitleRow}>
                          <Text style={styles.listItemTitle}>{account.name}</Text>
                          {zoneCount !== undefined && (
                            <View style={styles.zoneBadge}>
                              <Text style={styles.zoneBadgeText}>{zoneCount}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.listItemSubtitle}>ID: {account.id}</Text>
                      </View>
                      <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          ) : (
            <ScrollView style={styles.listContainer}>
              {isLoadingGlobalZones ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#f97316" />
                  <Text style={styles.loadingText}>搜索 Zones 中...</Text>
                </View>
              ) : globalZoneSearchQuery.trim().length < 2 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>请输入至少 2 个字符开始搜索</Text>
                  <Text style={styles.emptySubtext}>搜索所有账户下的 Zones</Text>
                </View>
              ) : globalZones.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>没有找到匹配的 Zone</Text>
                  <Text style={styles.emptySubtext}>尝试其他搜索关键词</Text>
                </View>
              ) : (
                globalZones.map((result, index) => (
                  <TouchableOpacity
                    key={`${result.zone.id}-${index}`}
                    style={styles.listItem}
                    onPress={() => handleGlobalZoneSelect(result)}
                  >
                    <View style={styles.listItemContent}>
                      <Text style={styles.listItemTitle}>{result.zone.name}</Text>
                      <View style={styles.zoneInfo}>
                        <Text style={styles.zoneStatus}>
                          {result.zone.status === 'active' ? '✓ 活跃' : result.zone.status}
                        </Text>
                        <Text style={styles.zonePlan}>{result.zone.plan}</Text>
                      </View>
                      <Text style={styles.accountLabel}>账户: {result.accountName}</Text>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </>
      )}

      {/* Zone Selection */}
      {step === 'zone' && (
        <>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToAccounts}>
            <Text style={styles.backButtonText}>‹ 返回账户选择</Text>
          </TouchableOpacity>
          
          {/* Zone Search Bar */}
          {!isLoadingZones && zones.length > 0 && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="搜索 Zone 名称或 ID..."
                placeholderTextColor="#999"
                value={zoneSearchQuery}
                onChangeText={setZoneSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {zoneSearchQuery.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => setZoneSearchQuery('')}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {isLoadingZones ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f97316" />
              <Text style={styles.loadingText}>加载zones中...</Text>
              <Text style={styles.loadingSubtext}>正在获取 {selectedAccount?.name} 的zones</Text>
            </View>
          ) : (
            <ScrollView style={styles.listContainer}>
              {zones.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>该账户下没有zones</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={handleBackToAccounts}>
                    <Text style={styles.retryButtonText}>选择其他账户</Text>
                  </TouchableOpacity>
                </View>
              ) : getFilteredZones().length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>没有找到匹配的 Zone</Text>
                  <Text style={styles.emptySubtext}>尝试其他搜索关键词</Text>
                </View>
              ) : (
                getFilteredZones().map((zone) => (
                  <TouchableOpacity
                    key={zone.id}
                    style={[
                      styles.listItem,
                      zone.id === zoneId && styles.listItemSelected,
                    ]}
                    onPress={() => handleZoneSelect(zone.id)}
                  >
                    <View style={styles.listItemContent}>
                      <Text style={styles.listItemTitle}>{zone.name}</Text>
                      <View style={styles.zoneInfo}>
                        <Text style={styles.zoneStatus}>
                          {zone.status === 'active' ? '✓ 活跃' : zone.status}
                        </Text>
                        <Text style={styles.zonePlan}>{zone.plan}</Text>
                      </View>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  sortButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  sortButtonText: {
    fontSize: 20,
    color: '#22c55e',
    fontWeight: 'bold',
  },
  sortButtonLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  backButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButtonText: {
    fontSize: 16,
    color: '#f97316',
    fontWeight: '600',
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listItemSelected: {
    borderWidth: 2,
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  listItemContent: {
    flex: 1,
  },
  accountTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  listItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  zoneBadge: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listItemSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  zoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  zoneStatus: {
    fontSize: 13,
    color: '#27ae60',
    marginRight: 12,
    fontWeight: '500',
  },
  zonePlan: {
    fontSize: 13,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  arrow: {
    fontSize: 32,
    color: '#ccc',
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#22c55e',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#22c55e',
    fontWeight: '600',
  },
  accountLabel: {
    fontSize: 12,
    color: '#f97316',
    marginTop: 4,
    fontWeight: '500',
  },
});
