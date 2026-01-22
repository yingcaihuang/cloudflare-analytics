/**
 * ChartRenderer
 * Central utility for rendering various chart types
 * Implements the ChartRenderer interface from the design document
 */

import React, { RefObject } from 'react';
import { LineChart, LineChartDataset } from './LineChart';
import { PieChart, PieChartDataItem } from './PieChart';
import { BarChart } from './BarChart';
import { ChartExportHandle } from './ChartExporter';

// Re-export types for convenience
export type { LineChartDataset, PieChartDataItem, ChartExportHandle };

export interface TimeSeriesData {
  labels: string[];
  datasets: LineChartDataset[];
}

export interface PieChartData {
  labels: string[];
  data: number[];
  colors?: string[];
}

export interface BarChartData {
  labels: string[];
  data: number[];
}

export interface ChartConfig {
  width?: number;
  height?: number;
  yAxisSuffix?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  showPercentage?: boolean;
  showValuesOnTopOfBars?: boolean;
}

/**
 * ChartRenderer class provides static methods to render different chart types
 */
export class ChartRenderer {
  /**
   * Render a line chart for time series data
   */
  static renderLineChart(
    data: TimeSeriesData,
    config: ChartConfig = {}
  ): React.ReactElement {
    return (
      <LineChart
        labels={data.labels}
        datasets={data.datasets}
        width={config.width}
        height={config.height}
        yAxisSuffix={config.yAxisSuffix}
        yAxisLabel={config.yAxisLabel}
        showLegend={config.showLegend}
      />
    );
  }

  /**
   * Render a pie chart for categorical data
   */
  static renderPieChart(
    data: PieChartData,
    config: ChartConfig = {}
  ): React.ReactElement {
    // Convert PieChartData to PieChartDataItem format
    const chartData: PieChartDataItem[] = data.labels.map((label, index) => ({
      name: label,
      value: data.data[index] || 0,
      color: data.colors?.[index] || ChartRenderer.getDefaultColor(index),
    }));

    return (
      <PieChart
        data={chartData}
        width={config.width}
        height={config.height}
        showPercentage={config.showPercentage}
      />
    );
  }

  /**
   * Render a bar chart for categorical data
   */
  static renderBarChart(
    data: BarChartData,
    config: ChartConfig = {}
  ): React.ReactElement {
    return (
      <BarChart
        labels={data.labels}
        data={data.data}
        width={config.width}
        height={config.height}
        yAxisSuffix={config.yAxisSuffix}
        yAxisLabel={config.yAxisLabel}
        showValuesOnTopOfBars={config.showValuesOnTopOfBars}
      />
    );
  }

  /**
   * Export a chart as an image
   * @param chartRef Reference to the chart component wrapped in ChartExporter
   * @returns Promise resolving to the file URI or null if failed
   */
  static async exportChartAsImage(
    chartRef: RefObject<ChartExportHandle>
  ): Promise<string | null> {
    if (!chartRef.current) {
      console.error('Chart reference is not available');
      return null;
    }

    return await chartRef.current.exportAsPNG();
  }

  /**
   * Share a chart image
   * @param chartRef Reference to the chart component wrapped in ChartExporter
   */
  static async shareChart(
    chartRef: RefObject<ChartExportHandle>
  ): Promise<void> {
    if (!chartRef.current) {
      console.error('Chart reference is not available');
      return;
    }

    await chartRef.current.shareChart();
  }

  /**
   * Get default color for chart elements
   */
  private static getDefaultColor(index: number): string {
    const colors = [
      '#2280b0', // Blue
      '#ff6384', // Red
      '#36a2eb', // Light Blue
      '#ffce56', // Yellow
      '#4bc0c0', // Teal
      '#9966ff', // Purple
      '#ff9f40', // Orange
      '#c9cbcf', // Gray
    ];
    return colors[index % colors.length];
  }
}
