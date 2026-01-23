/**
 * ZoneSelector Component
 * A dropdown selector for switching between zones
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useZone } from '../contexts';

interface ZoneSelectorProps {
  onZoneChange?: (zoneId: string, zoneName: string) => void;
  style?: any;
}

export default function ZoneSelector({ onZoneChange, style }: ZoneSelectorProps) {
  const { 
    selectedAccount, 
    zones, 
    zoneId, 
    zoneName, 
    setZoneId, 
    isLoading 
  } = useZone();
  
  const [modalVisible, setModalVisible] = useState(false);

  const handleZoneSelect = async (selectedZoneId: string) => {
    const zone = zones.find(z => z.id === selectedZoneId);
    if (zone) {
      await setZoneId(selectedZoneId);
      setModalVisible(false);
      
      if (onZoneChange) {
        onZoneChange(selectedZoneId, zone.name);
      }
    }
  };

  if (!selectedAccount || zones.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
        disabled={isLoading}
      >
        <View style={styles.selectorContent}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>当前Zone</Text>
            <Text style={styles.value} numberOfLines={1}>
              {zoneName || '选择Zone'}
            </Text>
          </View>
          <Text style={styles.arrow}>▼</Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择Zone</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Account Info */}
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>账户</Text>
              <Text style={styles.accountName}>{selectedAccount.name}</Text>
            </View>

            {/* Zone List */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f97316" />
                <Text style={styles.loadingText}>加载中...</Text>
              </View>
            ) : (
              <ScrollView style={styles.zoneList}>
                {zones.map((zone) => (
                  <TouchableOpacity
                    key={zone.id}
                    style={[
                      styles.zoneItem,
                      zone.id === zoneId && styles.zoneItemSelected,
                    ]}
                    onPress={() => handleZoneSelect(zone.id)}
                  >
                    <View style={styles.zoneItemContent}>
                      <Text style={styles.zoneName}>{zone.name}</Text>
                      <View style={styles.zoneDetails}>
                        <Text style={styles.zoneStatus}>
                          {zone.status === 'active' ? '✓ 活跃' : zone.status}
                        </Text>
                        <Text style={styles.zonePlan}>{zone.plan}</Text>
                      </View>
                    </View>
                    {zone.id === zoneId && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  selector: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  arrow: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  accountInfo: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  accountLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  zoneList: {
    flex: 1,
  },
  zoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  zoneItemSelected: {
    backgroundColor: '#fff5f0',
  },
  zoneItemContent: {
    flex: 1,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  zoneDetails: {
    flexDirection: 'row',
    alignItems: 'center',
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
  checkmark: {
    fontSize: 24,
    color: '#f97316',
    marginLeft: 12,
  },
});
