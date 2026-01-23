# Home Screen Counts Fix

## Issue
1. HomeScreen was calling `AuthManager.getAllTokens()` which doesn't exist
2. Accounts and zones counts were showing incorrect values (only 1 instead of 6 accounts and 109 zones)

## Root Cause
1. The `AuthManager` service only has a `getTokensList()` method, not `getAllTokens()`
2. The HomeScreen was not properly reacting to changes in `accounts` and `totalZonesCount` from ZoneContext
3. The useEffect was only running once on mount, not when accounts/zones data changed

## Solution

### 1. Fixed Token Count Method
Changed from:
```typescript
const tokens = await AuthManager.getAllTokens();
```

To:
```typescript
const tokens = await AuthManager.getTokensList();
```

### 2. Added Dependencies to useEffect
Updated to react to accounts and zones changes:
```typescript
useEffect(() => {
  loadTokenCount();
  console.log('HomeScreen - accounts:', accounts.length, 'totalZones:', totalZonesCount);
}, [accounts, totalZonesCount]);
```

### 3. Enhanced Refresh Function
Updated to refresh both tokens and accounts:
```typescript
const handleRefresh = async () => {
  setRefreshing(true);
  await Promise.all([
    loadTokenCount(),
    refreshAccounts(),
  ]);
  setRefreshing(false);
};
```

### 4. Added Debug Logging
Added logging to ZoneContext.loadAccounts() to track account loading.

## Files Modified
- `cloudflare-analytics/src/screens/HomeScreen.tsx`
  - Fixed `loadTokenCount()` method call
  - Added dependency array to `useEffect`
  - Enhanced `handleRefresh()` to refresh accounts
  - Added `refreshAccounts` from useZone hook
  
- `cloudflare-analytics/src/contexts/ZoneContext.tsx`
  - Added debug logging to track account loading

## Expected Result
✅ HomeScreen loads without errors
✅ Token count displays correctly (2)
✅ Account count displays correctly (6)
✅ Zone count displays correctly (109)
✅ Pull-to-refresh updates all statistics
✅ Navigation works properly

## Debugging
Check console logs for:
- `loadAccounts: Starting to fetch accounts...`
- `Total accounts loaded: X`
- `Total zones count: Y`
- `HomeScreen - accounts: X totalZones: Y`

These logs will help verify that accounts and zones are being loaded correctly.

## Testing Steps
1. Launch the app
2. Verify home screen shows correct counts
3. Pull down to refresh
4. Check console logs for account loading
5. Navigate to other screens and back
6. Verify counts remain correct
