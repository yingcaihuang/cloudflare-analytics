import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = '加载中...',
  size = 'large',
  color = '#f97316',
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
