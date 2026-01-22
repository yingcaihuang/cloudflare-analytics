# Screens

This directory contains all screen components for the Cloudflare Analytics application.

## Available Screens

### TokenInputScreen

**Purpose**: Authentication screen for users to input and validate their Cloudflare API Token.

**Requirements**: 1.1, 1.2, 1.3

**Props**:
- `onSuccess?: () => void` - Callback function called when token validation succeeds

**Features**:
- Token input with secure text entry
- Real-time validation
- Error handling and display
- Loading states
- Accessibility support

**Usage**:
```tsx
import { TokenInputScreen } from './src/screens';

<TokenInputScreen onSuccess={() => console.log('Token validated!')} />
```

---

### DashboardScreen

**Purpose**: Main dashboard displaying traffic metrics with today/yesterday comparison.

**Requirements**: 2.1, 2.4, 7.1

**Props**:
- `zoneId: string` - The Cloudflare Zone ID to fetch metrics for

**Features**:
- Displays 5 key traffic metrics:
  - Requests (total number of requests)
  - Data Transfer (total bytes transferred)
  - Bandwidth (bytes per second)
  - Page Views (total page views)
  - Visits (unique visits)
- Today vs Yesterday comparison with percentage change
- Pull-to-refresh functionality
- Automatic caching with cache indicators
- Loading states
- Error handling with retry capability
- Responsive metric cards in grid layout

**Usage**:
```tsx
import { DashboardScreen } from './src/screens';

<DashboardScreen zoneId="your-zone-id" />
```

**Data Flow**:
1. Component receives `zoneId` prop
2. Automatically calculates today's and yesterday's date ranges
3. Uses `useTrafficMetrics` hook to fetch data for both periods
4. Displays metrics in comparison cards
5. Supports pull-to-refresh to fetch fresh data
6. Falls back to cached data when network is unavailable

**Metric Formatting**:
- Numbers: Formatted with K/M/B suffixes (e.g., 1.5K, 2.3M)
- Bytes: Formatted with KB/MB/GB/TB units
- Bandwidth: Formatted as bytes/second (e.g., 1.2 MB/s)
- Percentage changes: Shown with +/- indicators and color coding

**Error Handling**:
- Network errors: Shows cached data if available, otherwise displays error message
- Partial failures: Shows available data with warning banner
- Retry functionality: Users can tap retry button or pull-to-refresh

**Accessibility**:
- All interactive elements have proper labels
- Color contrast meets WCAG standards
- Touch targets are appropriately sized

---

### StatusCodesScreen

**Purpose**: Displays HTTP status code distribution with interactive pie chart and detailed breakdown.

**Requirements**: 3.1, 3.2, 3.3, 3.4, 3.5

**Props**:
- `zoneId: string` - The Cloudflare Zone ID to fetch status code data for

**Features**:
- **Pie Chart Visualization** (Req 3.3):
  - Interactive pie chart showing distribution of status code categories
  - Color-coded segments (2xx green, 3xx blue, 4xx orange, 5xx red)
  - Percentage labels on each segment (Req 3.4)
- **Category Cards**:
  - Four category cards (2xx, 3xx, 4xx, 5xx)
  - Shows count and percentage for each category (Req 3.2)
  - Tap to view detailed breakdown
- **Detailed Status Code List** (Req 3.1):
  - Lists individual status codes (200, 404, 500, etc.)
  - Shows description and count for each code
  - Sorted by frequency (most common first)
- **Interactive Details** (Req 3.5):
  - Click pie chart slice or category card to show details
  - Displays specific status codes within that category
  - Close button to hide details
- Pull-to-refresh functionality
- Automatic caching with cache indicators
- Loading and error states

**Usage**:
```tsx
import { StatusCodesScreen } from './src/screens';

<StatusCodesScreen zoneId="your-zone-id" />
```

**Data Flow**:
1. Component receives `zoneId` prop
2. Calculates today's date range (start of day to now)
3. Uses `useStatusCodes` hook to fetch status code data
4. Transforms data into pie chart format
5. Handles user interactions (slice clicks, category selection)
6. Displays detailed breakdown on demand

**Status Code Categories**:
- **2xx Success** (Green): Successful responses (200, 201, 204, etc.)
- **3xx Redirect** (Blue): Redirection responses (301, 302, 304, etc.)
- **4xx Client Error** (Orange): Client errors (400, 401, 403, 404, etc.)
- **5xx Server Error** (Red): Server errors (500, 502, 503, 504, etc.)

**Interactions**:
1. **Tap Pie Chart Slice**: Shows detailed breakdown for that category
2. **Tap Category Card**: Toggles detailed breakdown view
3. **Tap Close Button**: Hides detailed breakdown
4. **Pull Down**: Refreshes data from API

**Error Handling**:
- Network errors: Shows cached data if available
- Partial failures: Shows available data with warning banner
- Retry functionality: Pull-to-refresh or retry button

**Accessibility**:
- All interactive elements have proper touch targets (44x44 points minimum)
- Color contrast meets WCAG AA standards
- Clear visual feedback for interactions

---

## Screen Integration

Screens are exported from `index.ts` for easy importing:

```tsx
import { TokenInputScreen, DashboardScreen, StatusCodesScreen } from './src/screens';
```

## Navigation Integration

When integrating with React Navigation:

```tsx
import { createStackNavigator } from '@react-navigation/stack';
import { TokenInputScreen, DashboardScreen, StatusCodesScreen } from './src/screens';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="TokenInput" component={TokenInputScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen 
        name="StatusCodes" 
        component={StatusCodesScreen}
        options={{ title: 'HTTP Status Codes' }}
      />
    </Stack.Navigator>
  );
}
```

## Testing

Each screen should be tested for:
- Proper rendering with valid props
- Loading states
- Error states
- User interactions (button presses, pull-to-refresh)
- Accessibility compliance

See individual screen files for implementation details and requirements mapping.
