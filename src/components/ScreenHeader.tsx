/**
 * ScreenHeader Component
 * Custom header with zone selector for main screens
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useZone } from '../contexts';
import ZoneSelector from './ZoneSelector';

interface ScreenHeaderProps {
  title: string;
  showZoneSelector?: boolean;
}

export default function ScreenHeader({ title, showZoneSelector = true }: ScreenHeaderProps) {
  const { selectedAccount, zoneName } = useZone();
  const [showSelector, setShowSelector] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {showZoneSelector && (
          <TouchableOpacity
            style={styles.zoneButton}
            onPress={() => setShowSelector(!showSelector)}
          >
            <Text style={styles.accountText} numberOfLines={1}>
              {selectedAccount?.name}
            </Text>
            <Text style={styles.zoneText} numberOfLines={1}>
              {zoneName} ▼
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {showSelector && showZoneSelector && (
        <View style={styles.selectorContainer}>
          <ZoneSelector onZoneChange={() => setShowSelector(false)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  zoneButton: {
    marginLeft: 12,
    alignItems: 'flex-end',
    maxWidth: '50%',
  },
  accountText: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  zoneText: {
    fontSize: 13,
    color: '#f97316',
    fontWeight: '600',
  },
  selectorContainer: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
});
