/**
 * LineChart Component
 * Renders time series data as a line chart with interactive features
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart as RNLineChart } from 'react-native-chart-kit';

export interface LineChartDataset {
  label: string;
  data: number[];
  color?: string;
}

export interface LineChartProps {
  labels: string[];
  datasets: LineChartDataset[];
  width?: number;
  height?: number;
  yAxisSuffix?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  onDataPointClick?: (data: { index: number; value: number; dataset: number }) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export const LineChart: React.FC<LineChartProps> = ({
  labels,
  datasets,
  width = SCREEN_WIDTH - 32,
  height = 220,
  yAxisSuffix = '',
  yAxisLabel = '',
  showLegend = true,
  onDataPointClick,
}) => {
  const [selectedPoint, setSelectedPoint] = useState<{
    index: number;
    value: number;
    dataset: number;
  } | null>(null);

  // Format data for react-native-chart-kit
  const chartData = {
    labels: labels,
    datasets: datasets.map((dataset, index) => ({
      data: dataset.data,
      color: (opacity = 1) => dataset.color || `rgba(${index === 0 ? '34, 128, 176' : '255, 99, 132'}, ${opacity})`,
      strokeWidth: 2,
    })),
    legend: showLegend ? datasets.map(d => d.label) : undefined,
  };

  const handleDataPointClick = (data: any) => {
    const pointData = {
      index: data.index,
      value: data.value,
      dataset: data.dataset?.index || 0,
    };
    setSelectedPoint(pointData);
    onDataPointClick?.(pointData);
  };

  return (
    <View style={styles.container}>
      <RNLineChart
        data={chartData}
        width={width}
        height={height}
        yAxisLabel={yAxisLabel}
        yAxisSuffix={yAxisSuffix}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#2280b0',
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: '#e3e3e3',
            strokeWidth: 1,
          },
        }}
        bezier
        style={styles.chart}
        onDataPointClick={handleDataPointClick}
      />
      {selectedPoint && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            {labels[selectedPoint.index]}: {selectedPoint.value.toLocaleString()}{yAxisSuffix}
          </Text>
          {datasets[selectedPoint.dataset] && (
            <Text style={styles.tooltipLabel}>
              {datasets[selectedPoint.dataset].label}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  tooltip: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 4,
  },
  tooltipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tooltipLabel: {
    color: '#ffffff',
    fontSize: 10,
    marginTop: 2,
  },
});
