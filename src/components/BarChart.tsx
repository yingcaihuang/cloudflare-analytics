/**
 * BarChart Component
 * Renders categorical data as a bar chart with data labels
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart as RNBarChart } from 'react-native-chart-kit';

export interface BarChartProps {
  labels: string[];
  data: number[];
  width?: number;
  height?: number;
  yAxisSuffix?: string;
  yAxisLabel?: string;
  showValuesOnTopOfBars?: boolean;
  fromZero?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export const BarChart: React.FC<BarChartProps> = ({
  labels,
  data,
  width = SCREEN_WIDTH - 32,
  height = 220,
  yAxisSuffix = '',
  yAxisLabel = '',
  showValuesOnTopOfBars = true,
  fromZero = true,
}) => {
  // Round all data values to remove decimals
  const roundedData = data.map(value => Math.round(value));
  
  const chartData = {
    labels: labels,
    datasets: [
      {
        data: roundedData,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <RNBarChart
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
          color: (opacity = 1) => `rgba(34, 128, 176, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: '#e3e3e3',
            strokeWidth: 1,
          },
          propsForLabels: {
            fontSize: 10,
          },
        }}
        style={styles.chart}
        showValuesOnTopOfBars={showValuesOnTopOfBars}
        fromZero={fromZero}
        withInnerLines={true}
        segments={4}
      />
      {showValuesOnTopOfBars && (
        <View style={styles.legendContainer}>
          {labels.map((label, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#2280b0' }]} />
              <Text style={styles.legendText}>
                {label}: {roundedData[index]?.toLocaleString() || 0}{yAxisSuffix}
              </Text>
            </View>
          ))}
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
  legendContainer: {
    marginTop: 16,
    width: '100%',
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#333333',
  },
});
