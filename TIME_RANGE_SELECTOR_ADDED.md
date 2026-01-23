# Time Range Selector Added to Analysis Screens

## Summary
Added time range selector (24H / 7D / 30D) to all analysis screens in the "More" section, matching the functionality in Dashboard, Status Codes, and Security screens.

## Screens Updated

### ✅ All Completed!
1. **GeoDistributionScreen** - Geographic distribution analysis
2. **ProtocolDistributionScreen** - HTTP protocol version distribution
3. **TLSDistributionScreen** - TLS version distribution
4. **ContentTypeScreen** - Content type distribution
5. **BotAnalysisScreen** - Bot traffic analysis
6. **FirewallAnalysisScreen** - Firewall events analysis

All analysis screens in the "More" section now have time range selectors!

## Implementation Pattern

All screens follow the same pattern for consistency:

1. Add `timeRange` state
2. Replace fixed date range with dynamic calculation
3. Add time range selector UI after header
4. Add corresponding styles
5. Update params dependency to include `dateRanges`

## Changes Made

### 1. State Management
Added `timeRange` state to track selected period:
```typescript
const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
```

### 2. Date Range Calculation
Replaced fixed "today" range with dynamic calculation:
```typescript
const dateRanges = useMemo(() => {
  const now = new Date();
  const endDate = now;
  let startDate: Date;

  switch (timeRange) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  return { startDate, endDate };
}, [timeRange]);
```

### 3. UI Component
Added time range selector buttons after the header:
```tsx
<View style={styles.timeRangeSelector}>
  <TouchableOpacity
    style={[styles.timeRangeButton, timeRange === '24h' && styles.timeRangeButtonActive]}
    onPress={() => setTimeRange('24h')}
  >
    <Text style={[styles.timeRangeButtonText, timeRange === '24h' && styles.timeRangeButtonTextActive]}>
      24H
    </Text>
  </TouchableOpacity>
  {/* 7D and 30D buttons */}
</View>
```

### 4. Styles Added
```typescript
timeRangeSelector: {
  flexDirection: 'row',
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 4,
  marginBottom: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 2,
},
timeRangeButton: {
  flex: 1,
  paddingVertical: 10,
  alignItems: 'center',
  borderRadius: 6,
},
timeRangeButtonActive: {
  backgroundColor: '#f6821f',
},
timeRangeButtonText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#666',
},
timeRangeButtonTextActive: {
  color: '#fff',
},
```

## User Experience
- Users can now select different time ranges for all analysis screens
- Data automatically refreshes when time range changes
- Active time range is highlighted in orange
- Consistent UI across all screens

## Files Modified
- ✅ `cloudflare-analytics/src/screens/GeoDistributionScreen.tsx`
- ✅ `cloudflare-analytics/src/screens/ProtocolDistributionScreen.tsx`
- ✅ `cloudflare-analytics/src/screens/TLSDistributionScreen.tsx`
- ✅ `cloudflare-analytics/src/screens/ContentTypeScreen.tsx`
- ✅ `cloudflare-analytics/src/screens/BotAnalysisScreen.tsx`
- ✅ `cloudflare-analytics/src/screens/FirewallAnalysisScreen.tsx`

## Summary
All 6 analysis screens in the "More" section now support time range selection (24H, 7D, 30D), providing users with flexible data viewing options across all analysis features.
