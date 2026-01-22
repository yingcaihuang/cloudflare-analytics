import React from 'react';
import { RefreshControl as RNRefreshControl } from 'react-native';

interface RefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
  tintColor?: string;
  colors?: string[];
}

export const RefreshControl: React.FC<RefreshControlProps> = ({
  refreshing,
  onRefresh,
  tintColor = '#f97316',
  colors = ['#f97316', '#fb923c', '#fdba74'],
}) => {
  return (
    <RNRefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={tintColor}
      colors={colors}
      progressBackgroundColor="#ffffff"
    />
  );
};
