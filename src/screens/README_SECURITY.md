# SecurityScreen Component

## Overview
The SecurityScreen displays comprehensive security and cache metrics for a Cloudflare zone, including cache performance, firewall events, bot detection, threat analysis, and 24-hour security event trends.

## Layout Structure

```
┌─────────────────────────────────────────┐
│  Security & Cache                       │
│  Last updated: HH:MM:SS                 │
│  📦 Showing cached data (if applicable) │
├─────────────────────────────────────────┤
│                                         │
│  Cache Performance                      │
│  ┌───────────────────────────────────┐ │
│  │ Cache Hit Rate                    │ │
│  │ 85.3%                             │ │
│  │ ████████████████░░░░              │ │
│  └───────────────────────────────────┘ │
│  ┌────────┬────────┬────────┬────────┐ │
│  │ 1.2M   │ 180K   │ 120K   │ 60K    │ │
│  │ Hits   │ Misses │ Expired│ Stale  │ │
│  └────────┴────────┴────────┴────────┘ │
│                                         │
│  Firewall Events                        │
│  ┌───────────────────────────────────┐ │
│  │ Total Events                      │ │
│  │ 45.2K                             │ │
│  └───────────────────────────────────┘ │
│  ┌────────┬────────┬────────┐         │
│  │ 12.3K  │ 8.5K   │ 24.4K  │         │
│  │ Blocked│Challeng│ Allowed│         │
│  └────────┴────────┴────────┘         │
│                                         │
│  Bot Detection                          │
│  ┌───────────────────────────────────┐ │
│  │ Average Bot Score    ⚠️ HIGH      │ │
│  │ 85.2                              │ │
│  │ Score range: 0 (human) - 100 (bot)│ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ Distribution by Range             │ │
│  │ 0-20      1.2K requests           │ │
│  │ 21-40     2.5K requests           │ │
│  │ 41-60     3.8K requests           │ │
│  │ 61-80     5.2K requests           │ │
│  │ 81-100    8.9K requests           │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Threat Analysis                        │
│  ┌───────────────────────────────────┐ │
│  │ Average Threat Score  ⚠️ HIGH     │ │
│  │ 82.5                              │ │
│  │ Score range: 0 (safe) - 100 (threat)│
│  └───────────────────────────────────┘ │
│  ┌────────┬────────┬────────┐         │
│  │ 3.2K   │ 2.1K   │ 1.5K   │         │
│  │High>80 │Med40-80│ Low<40 │         │
│  └────────┴────────┴────────┘         │
│                                         │
│  24-Hour Security Event Trend           │
│  ┌───────────────────────────────────┐ │
│  │ 45.2K  12.3K  8.5K   24.4K        │ │
│  │ Total  Blocked Challeng Allowed   │ │
│  ├───────────────────────────────────┤ │
│  │        📈 Line Chart              │ │
│  │    ╱╲    ╱╲                       │ │
│  │   ╱  ╲  ╱  ╲╱╲                    │ │
│  │  ╱    ╲╱      ╲                   │ │
│  │ ╱              ╲                  │ │
│  │ 00 04 08 12 16 20 24              │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ℹ️ Pull down to refresh data.         │
│     High scores (>80) are highlighted. │
└─────────────────────────────────────────┘
```

## Component Props

```typescript
interface SecurityScreenProps {
  zoneId: string;  // Cloudflare Zone ID
}
```

## Features

### 1. Cache Performance Section
- **Cache Hit Rate**: Large metric card showing percentage with progress bar
- **Cache Breakdown**: Grid of 4 metrics (hits, misses, expired, stale)
- **Visual Indicators**: Green progress bar for hit rate

### 2. Firewall Events Section
- **Total Events**: Large metric card showing aggregate count
- **Event Breakdown**: Color-coded grid
  - Red background for blocked events
  - Orange background for challenged events
  - Green background for allowed events

### 3. Bot Detection Section
- **Average Score**: Large metric card with score (0-100)
- **High Score Alert**: Red border, warning badge when score > 80
- **Distribution**: List showing request counts by score ranges

### 4. Threat Analysis Section
- **Average Score**: Large metric card with score (0-100)
- **High Score Alert**: Red border, warning badge when score > 80
- **Threat Levels**: Color-coded grid (high/medium/low)

### 5. Security Event Trend Chart
- **Time Series**: 24-hour hourly breakdown
- **Multiple Lines**: Total, blocked, challenged, allowed
- **Interactive**: Tap data points to see exact values
- **Summary Stats**: Totals displayed above chart

## Color Scheme

### Status Colors
- **Success/Allowed**: `#27ae60` (green)
- **Warning/Challenged**: `#f39c12` (orange)
- **Danger/Blocked**: `#e74c3c` (red)
- **Info/Total**: `#3498db` (blue)

### High Score Highlighting
- **Border**: `#e74c3c` (red, 2px)
- **Background**: `#ffebee` (light red)
- **Badge**: `#e74c3c` background with white text
- **Text**: `#e74c3c` (red)

### Threat Level Colors
- **High**: Red background (`#ffebee`), red text (`#c62828`)
- **Medium**: Orange background (`#fff3e0`), orange text (`#ef6c00`)
- **Low**: Green background (`#e8f5e9`), green text (`#2e7d32`)

## Data Requirements

The component expects data from `useSecurityMetrics` hook:

```typescript
interface SecurityMetrics {
  cacheStatus: {
    hit: number;
    miss: number;
    expired: number;
    stale: number;
  };
  firewallEvents: {
    total: number;
    blocked: number;
    challenged: number;
    allowed: number;
  };
  botScore: {
    average: number;
    distribution: Array<{
      range: string;
      count: number;
    }>;
  };
  threatScore: {
    average: number;
    high: number;
    medium: number;
    low: number;
  };
  timeSeries?: Array<{
    timestamp: Date;
    blocked: number;
    challenged: number;
    allowed: number;
    total: number;
  }>;
}
```

## User Interactions

1. **Pull-to-Refresh**: Swipe down to refresh all metrics
2. **Chart Interaction**: Tap on line chart data points to see values
3. **Retry Button**: Tap to retry failed data loads
4. **Scroll**: Vertical scroll to view all sections

## States

### Loading State
- Centered spinner with "Loading security metrics..." text
- Shown on initial load when no cached data available

### Error State
- Error title and message
- Retry button to attempt reload
- If partial data available, shows error banner at top

### Success State
- All metrics displayed
- Cache indicator if data is from cache
- Last refresh timestamp shown

### Empty State
- Shown when no time series data available for chart
- "No security event data available" message

## Accessibility

- All interactive elements have minimum 44x44pt touch targets
- Color is not the only indicator (text labels included)
- High contrast ratios for text (4.5:1 minimum)
- Semantic structure with proper headings

## Performance Considerations

- Data cached for 5 minutes (TTL in useSecurityMetrics)
- Lazy rendering of chart only when data available
- Memoized calculations for percentages and totals
- Efficient re-renders with proper React keys

## Related Components

- `SecurityEventTrendChart`: Displays 24-hour trend line chart
- `LineChart`: Base chart component for time series
- `useSecurityMetrics`: Hook for data fetching and caching

## Usage Example

```typescript
import { SecurityScreen } from './screens';

function App() {
  return <SecurityScreen zoneId="abc123def456" />;
}
```

## Requirements Mapping

- **Requirement 4.1**: ✅ Queries all security metrics
- **Requirement 4.2**: ✅ Displays cache hit rate percentage
- **Requirement 4.3**: ✅ Displays firewall events total
- **Requirement 4.4**: ✅ Highlights high scores (>80) prominently
- **Requirement 4.5**: ✅ Shows 24-hour security event trends
