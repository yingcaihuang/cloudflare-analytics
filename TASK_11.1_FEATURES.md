# StatusCodesScreen Features Overview

## Visual Layout

```
┌─────────────────────────────────────────┐
│  HTTP Status Codes                      │
│  Last updated: 10:30:45 AM              │
│  📦 Showing cached data                 │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │     Total Requests                │ │
│  │        1,234,567                  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Distribution Overview           │ │
│  │                                   │ │
│  │        [Pie Chart]                │ │
│  │      /    |    \                  │ │
│  │    2xx  3xx  4xx  5xx             │ │
│  │                                   │ │
│  │  ● 2xx Success (85.2%)            │ │
│  │  ● 3xx Redirect (8.5%)            │ │
│  │  ● 4xx Client Error (5.1%)        │ │
│  │  ● 5xx Server Error (1.2%)        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Categories                             │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ 2xx Success  │  │ 3xx Redirect │   │
│  │   1,051,234  │  │    104,890   │   │
│  │    85.20%    │  │     8.50%    │   │
│  └──────────────┘  └──────────────┘   │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ 4xx Client   │  │ 5xx Server   │   │
│  │    62,963    │  │    14,814    │   │
│  │     5.10%    │  │     1.20%    │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  [When category selected]               │
│  ┌───────────────────────────────────┐ │
│  │  2xx Details              ✕       │ │
│  ├───────────────────────────────────┤ │
│  │  200 OK                           │ │
│  │  OK                    1,000,000  │ │
│  │                           81.00%  │ │
│  ├───────────────────────────────────┤ │
│  │  201 Created                      │ │
│  │  Created                  50,000  │ │
│  │                            4.05%  │ │
│  ├───────────────────────────────────┤ │
│  │  204 No Content                   │ │
│  │  No Content                1,234  │ │
│  │                            0.10%  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ℹ️ Tap on a category card to view     │
│     detailed status code breakdown.    │
│     Pull down to refresh data.         │
└─────────────────────────────────────────┘
```

## User Interactions

### 1. View Status Code Distribution
- **Action**: Open screen
- **Result**: See pie chart with 4 categories
- **Visual**: Color-coded segments with percentages

### 2. Tap Pie Chart Slice
- **Action**: Tap on any colored segment
- **Result**: Detailed breakdown appears below
- **Example**: Tap green segment → See all 2xx codes

### 3. Tap Category Card
- **Action**: Tap on any of the 4 category cards
- **Result**: Toggle detailed breakdown
- **Visual**: Card scales slightly, details appear/disappear

### 4. View Detailed Breakdown
- **Action**: Select a category
- **Result**: See list of individual status codes
- **Info Shown**:
  - Status code number (e.g., 200, 404)
  - Description (e.g., OK, Not Found)
  - Request count
  - Percentage of total

### 5. Close Details
- **Action**: Tap ✕ button or tap category again
- **Result**: Details section closes

### 6. Refresh Data
- **Action**: Pull down on screen
- **Result**: Fetches fresh data from API
- **Visual**: Spinner appears, data updates

## Color Scheme

| Category | Color | Hex Code | Meaning |
|----------|-------|----------|---------|
| 2xx Success | 🟢 Green | #27ae60 | Successful requests |
| 3xx Redirect | 🔵 Blue | #3498db | Redirections |
| 4xx Client Error | 🟠 Orange | #f39c12 | Client-side errors |
| 5xx Server Error | 🔴 Red | #e74c3c | Server-side errors |

## Status Code Descriptions

### 2xx Success Codes
- **200** - OK: Standard successful response
- **201** - Created: Resource successfully created
- **204** - No Content: Success with no response body

### 3xx Redirect Codes
- **301** - Moved Permanently: Permanent redirect
- **302** - Found: Temporary redirect
- **304** - Not Modified: Cached version is still valid

### 4xx Client Error Codes
- **400** - Bad Request: Invalid request syntax
- **401** - Unauthorized: Authentication required
- **403** - Forbidden: Access denied
- **404** - Not Found: Resource doesn't exist
- **429** - Too Many Requests: Rate limit exceeded

### 5xx Server Error Codes
- **500** - Internal Server Error: Generic server error
- **502** - Bad Gateway: Invalid response from upstream
- **503** - Service Unavailable: Server temporarily unavailable
- **504** - Gateway Timeout: Upstream server timeout

## Data States

### Loading State
```
┌─────────────────────────────────────────┐
│                                         │
│              ⏳                          │
│     Loading status codes...             │
│                                         │
└─────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────┐
│                                         │
│         ⚠️ Unable to Load Data          │
│                                         │
│  Failed to fetch status codes           │
│                                         │
│         [Retry Button]                  │
│                                         │
└─────────────────────────────────────────┘
```

### Cached Data State
```
┌─────────────────────────────────────────┐
│  HTTP Status Codes                      │
│  Last updated: 10:30:45 AM              │
│  📦 Showing cached data                 │
│                                         │
│  [Normal content...]                    │
└─────────────────────────────────────────┘
```

### Partial Error State
```
┌─────────────────────────────────────────┐
│  HTTP Status Codes                      │
│                                         │
│  ⚠️ Failed to fetch fresh data.         │
│     Showing cached data.                │
│                                         │
│  [Normal content...]                    │
└─────────────────────────────────────────┘
```

## Responsive Behavior

### Portrait Mode
- Category cards: 2 columns (50% width each)
- Pie chart: Full width with padding
- Details list: Full width

### Landscape Mode
- Same layout (optimized for portrait)
- Scrollable content

### Different Screen Sizes
- Small phones: Compact layout, smaller fonts
- Large phones: Standard layout
- Tablets: Same layout (future: could use wider layout)

## Performance Features

1. **Caching**: Data cached for 5 minutes
2. **Lazy Loading**: Details only render when selected
3. **Efficient Lists**: FlatList for status code breakdown
4. **Optimized Rendering**: Only re-renders when data changes
5. **Pull-to-Refresh**: Manual refresh control

## Accessibility Features

1. **Touch Targets**: All buttons ≥ 44x44 points
2. **Color Contrast**: Text meets WCAG AA standards
3. **Visual Feedback**: Clear indication of selected state
4. **Error Messages**: Clear and actionable
5. **Loading Indicators**: Proper feedback during operations

## Integration Points

### Data Source
- **Hook**: `useStatusCodes`
- **Service**: `GraphQLClient.queryStatusCodes`
- **Cache**: `CacheManager` with 5-minute TTL

### Components Used
- **PieChart**: Existing component for visualization
- **FlatList**: React Native list component
- **ScrollView**: Scrollable container
- **RefreshControl**: Pull-to-refresh functionality

### Navigation
- Can be integrated with Stack Navigator
- Can be integrated with Tab Navigator
- Receives `zoneId` as prop

## Example Use Cases

### Use Case 1: Monitor Website Health
**Scenario**: Check if website is returning errors
**Steps**:
1. Open StatusCodesScreen
2. Look at pie chart
3. Check if 5xx (red) segment is large
4. Tap 5xx category to see specific errors

### Use Case 2: Investigate 404 Errors
**Scenario**: Find out which pages are returning 404
**Steps**:
1. Open StatusCodesScreen
2. Tap 4xx category card
3. Look for 404 in detailed list
4. See count and percentage

### Use Case 3: Verify Redirects
**Scenario**: Check redirect configuration
**Steps**:
1. Open StatusCodesScreen
2. Look at 3xx category
3. Tap to see breakdown
4. Verify 301 vs 302 distribution

### Use Case 4: Offline Monitoring
**Scenario**: Check status codes without internet
**Steps**:
1. Open StatusCodesScreen (offline)
2. See cached data indicator
3. View last known status code distribution
4. Pull to refresh when online again

## Summary

The StatusCodesScreen provides a comprehensive, user-friendly interface for monitoring HTTP status code distribution. It combines visual appeal (pie chart), detailed information (breakdown list), and excellent UX (caching, error handling, pull-to-refresh) to deliver a production-ready feature.
