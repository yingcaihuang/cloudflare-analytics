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
} from 'react-native';
import { useZone } from '../contexts';

interface AccountZoneSelectionScreenProps {
  onComplete: () => void;
}

export default function AccountZoneSelectionScreen({ onComplete }: AccountZoneSelectionScreenProps) {
  const { 
    accounts, 
    selectedAccount, 
    zones, 
    zoneId,
    setSelectedAccount, 
    setZoneId,
    isLoading 
  } = useZone();

  const [step, setStep] = useState<'account' | 'zone'>('account');
  const [isLoadingZones, setIsLoadingZones] = useState(false);

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
        <Text style={styles.title}>
          {step === 'account' ? '选择账户' : '选择Zone'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'account' 
            ? `找到 ${accounts.length} 个账户` 
            : `${selectedAccount?.name} - ${zones.length} 个zones`}
        </Text>
      </View>

      {/* Account Selection */}
      {step === 'account' && (
        <ScrollView style={styles.listContainer}>
          {accounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={styles.listItem}
              onPress={() => handleAccountSelect(account)}
            >
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{account.name}</Text>
                <Text style={styles.listItemSubtitle}>ID: {account.id}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Zone Selection */}
      {step === 'zone' && (
        <>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToAccounts}>
            <Text style={styles.backButtonText}>‹ 返回账户选择</Text>
          </TouchableOpacity>
          
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
              ) : (
                zones.map((zone) => (
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
  listItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
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
});
