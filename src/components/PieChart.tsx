/**
 * PieChart Component
 * Renders categorical data as a pie chart with percentage labels and click interaction
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { PieChart as RNPieChart } from 'react-native-chart-kit';

export interface PieChartDataItem {
  name: string;
  value: number;
  color: string;
  legendFontColor?: string;
  legendFontSize?: number;
}

export interface PieChartProps {
  data: PieChartDataItem[];
  width?: number;
  height?: number;
  showPercentage?: boolean;
  onSliceClick?: (item: PieChartDataItem, index: number) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export const PieChart: React.FC<PieChartProps> = ({
  data,
  width = SCREEN_WIDTH - 32,
  height = 220,
  showPercentage = true,
  onSliceClick,
}) => {
  const [selectedSlice, setSelectedSlice] = useState<number | null>(null);

  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Format data with percentages
  const chartData = data.map((item) => {
    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
    return {
      ...item,
      name: showPercentage ? `${item.name} (${percentage}%)` : item.name,
      legendFontColor: item.legendFontColor || '#333333',
      legendFontSize: item.legendFontSize || 12,
    };
  });

  // Create touchable areas for each slice (simulated with legend interaction)
  const renderInteractiveLegend = () => {
    return data.map((item, index) => {
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
      return (
        <TouchableOpacity
          key={index}
          style={styles.legendItem}
          onPress={() => {
            setSelectedSlice(index);
            onSliceClick?.(item, index);
          }}
        >
          <View style={[styles.legendColor, { backgroundColor: item.color }]} />
          <Text style={styles.legendText}>
            {item.name} ({percentage}%)
          </Text>
        </TouchableOpacity>
      );
    });
  };

  return (
    <View style={styles.container}>
      <RNPieChart
        data={chartData}
        width={width}
        height={height}
        chartConfig={{
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="value"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute={false}
        hasLegend={false}
      />
      <View style={styles.customLegend}>
        {renderInteractiveLegend()}
      </View>
      {selectedSlice !== null && data[selectedSlice] && (
        <View style={styles.detailContainer}>
          <Text style={styles.detailTitle}>{data[selectedSlice].name}</Text>
          <Text style={styles.detailValue}>
            {data[selectedSlice].value.toLocaleString()}
          </Text>
          <Text style={styles.detailPercentage}>
            {((data[selectedSlice].value / total) * 100).toFixed(2)}%
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedSlice(null)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  customLegend: {
    marginTop: 16,
    width: '100%',
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#333333',
  },
  detailContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    width: '90%',
    alignItems: 'center',
    position: 'relative',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2280b0',
    marginBottom: 4,
  },
  detailPercentage: {
    fontSize: 14,
    color: '#666666',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#cccccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
