/**
 * Chart Usage Examples
 * Demonstrates how to use the chart components
 * This file is for reference and can be removed in production
 */

import React, { useRef } from 'react';
import { View, Button, ScrollView, StyleSheet } from 'react-native';
import { ChartRenderer, ChartExportHandle } from './ChartRenderer';
import { ChartExporter } from './ChartExporter';

export const ChartExamples: React.FC = () => {
  const lineChartRef = useRef<ChartExportHandle>(null);
  const pieChartRef = useRef<ChartExportHandle>(null);
  const barChartRef = useRef<ChartExportHandle>(null);

  // Example 1: Line Chart for Traffic Metrics
  const trafficData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: '今日流量',
        data: [1200, 1500, 2800, 3500, 3200, 2400],
        color: '#2280b0',
      },
      {
        label: '昨日流量',
        data: [1000, 1300, 2500, 3200, 2900, 2200],
        color: '#ff6384',
      },
    ],
  };

  // Example 2: Pie Chart for Status Codes
  const statusCodeData = {
    labels: ['2xx', '3xx', '4xx', '5xx'],
    data: [8500, 1200, 280, 20],
    colors: ['#4bc0c0', '#36a2eb', '#ffce56', '#ff6384'],
  };

  // Example 3: Bar Chart for Protocol Distribution
  const protocolData = {
    labels: ['HTTP/1.1', 'HTTP/2', 'HTTP/3'],
    data: [2500, 5200, 2300],
  };

  const handleExportLineChart = async () => {
    if (lineChartRef.current) {
      const uri = await ChartRenderer.exportChartAsImage(lineChartRef as React.RefObject<ChartExportHandle>);
      console.log('Line chart exported to:', uri);
    }
  };

  const handleSharePieChart = async () => {
    if (pieChartRef.current) {
      await ChartRenderer.shareChart(pieChartRef as React.RefObject<ChartExportHandle>);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <ChartExporter ref={lineChartRef} filename="traffic-chart">
          {ChartRenderer.renderLineChart(trafficData, {
            height: 220,
            yAxisSuffix: ' req',
            showLegend: true,
          })}
        </ChartExporter>
        <Button title="导出折线图" onPress={handleExportLineChart} />
      </View>

      <View style={styles.section}>
        <ChartExporter ref={pieChartRef} filename="status-codes">
          {ChartRenderer.renderPieChart(statusCodeData, {
            height: 220,
            showPercentage: true,
          })}
        </ChartExporter>
        <Button title="分享饼图" onPress={handleSharePieChart} />
      </View>

      <View style={styles.section}>
        <ChartExporter ref={barChartRef} filename="protocol-distribution">
          {ChartRenderer.renderBarChart(protocolData, {
            height: 220,
            yAxisSuffix: ' req',
            showValuesOnTopOfBars: true,
          })}
        </ChartExporter>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  section: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
});
