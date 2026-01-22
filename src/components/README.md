# Chart Components

This directory contains chart rendering components for the Cloudflare Analytics application.

## Components

### LineChart
Renders time series data as an interactive line chart.

**Features:**
- Multiple datasets support
- Interactive data point selection
- Tooltip display on click
- Customizable colors and labels

**Usage:**
```tsx
import { LineChart } from './components';

<LineChart
  labels={['00:00', '04:00', '08:00', '12:00']}
  datasets={[
    {
      label: '今日流量',
      data: [1200, 1500, 2800, 3500],
      color: '#2280b0',
    }
  ]}
  yAxisSuffix=" req"
  showLegend={true}
/>
```

### PieChart
Renders categorical data as a pie chart with percentage labels.

**Features:**
- Automatic percentage calculation
- Interactive legend (click to view details)
- Custom colors support
- Detail view on selection

**Usage:**
```tsx
import { PieChart } from './components';

<PieChart
  data={[
    { name: '2xx', value: 8500, color: '#4bc0c0' },
    { name: '3xx', value: 1200, color: '#36a2eb' },
    { name: '4xx', value: 280, color: '#ffce56' },
    { name: '5xx', value: 20, color: '#ff6384' },
  ]}
  showPercentage={true}
  onSliceClick={(item, index) => console.log('Clicked:', item)}
/>
```

### BarChart
Renders categorical data as a bar chart with data labels.

**Features:**
- Vertical bar display
- Value labels on top of bars
- Custom Y-axis formatting
- Legend with values

**Usage:**
```tsx
import { BarChart } from './components';

<BarChart
  labels={['HTTP/1.1', 'HTTP/2', 'HTTP/3']}
  data={[2500, 5200, 2300]}
  yAxisSuffix=" req"
  showValuesOnTopOfBars={true}
/>
```

### ChartRenderer
Utility class providing static methods to render charts.

**Usage:**
```tsx
import { ChartRenderer } from './components';

// Render line chart
const lineChart = ChartRenderer.renderLineChart(
  { labels: [...], datasets: [...] },
  { height: 220, yAxisSuffix: ' req' }
);

// Render pie chart
const pieChart = ChartRenderer.renderPieChart(
  { labels: [...], data: [...], colors: [...] },
  { showPercentage: true }
);

// Render bar chart
const barChart = ChartRenderer.renderBarChart(
  { labels: [...], data: [...] },
  { showValuesOnTopOfBars: true }
);
```

### ChartExporter
Wrapper component for exporting charts as PNG images.

**Note:** Requires additional dependencies:
```bash
expo install react-native-view-shot expo-sharing expo-file-system
```

**Usage:**
```tsx
import { ChartExporter, ChartRenderer } from './components';
import { useRef } from 'react';

const chartRef = useRef<ChartExportHandle>(null);

<ChartExporter ref={chartRef} filename="my-chart">
  {ChartRenderer.renderLineChart(data, config)}
</ChartExporter>

// Export chart
const uri = await ChartRenderer.exportChartAsImage(chartRef);

// Share chart
await ChartRenderer.shareChart(chartRef);
```

## Configuration Options

### ChartConfig
Common configuration options for all charts:

```typescript
interface ChartConfig {
  width?: number;              // Chart width (default: screen width - 32)
  height?: number;             // Chart height (default: 220)
  yAxisSuffix?: string;        // Suffix for Y-axis values (e.g., ' req')
  yAxisLabel?: string;         // Label for Y-axis
  showLegend?: boolean;        // Show legend (LineChart)
  showPercentage?: boolean;    // Show percentages (PieChart)
  showValuesOnTopOfBars?: boolean; // Show values on bars (BarChart)
}
```

## Requirements Mapping

- **需求 5.1, 5.2, 5.3**: LineChart component with time series visualization
- **需求 3.3, 3.4, 3.5**: PieChart component with percentage labels and interaction
- **需求 19.2, 21.3**: BarChart component with data labels
- **需求 17.5**: ChartExporter for PNG export functionality

## Examples

See `ChartExamples.tsx` for complete usage examples.
