# Multi-Token Aggregation Feature

## Overview
The app now aggregates accounts and zones from **ALL saved tokens**, not just the currently active token.

## Implementation

### ZoneContext.loadAccounts()
This function now:
1. Gets all saved tokens from `AuthManager.getTokensList()`
2. Iterates through each token
3. Fetches accounts from Cloudflare API for each token
4. Uses a Map to deduplicate accounts by ID (in case multiple tokens have access to the same account)
5. Returns the combined list of unique accounts

### ZoneContext.loadTotalZonesCountFromAllTokens()
This function now:
1. Iterates through all saved tokens
2. Fetches zone count for each token
3. Sums up the total zones across all tokens
4. Returns the aggregated total

## Key Features

### Deduplication
- Accounts are deduplicated by ID using a Map
- If multiple tokens have access to the same account, it only appears once in the list

### Error Handling
- If one token fails to load, the function continues with other tokens
- Errors are logged but don't stop the entire loading process

### Logging
Console logs show:
- `Found X tokens`
- `Fetching accounts for token: [token label]`
- `Token [label]: loaded X unique accounts so far`
- `Total unique accounts loaded from all tokens: X`
- `Token [label]: Y zones`
- `Total zones count from all tokens: Y`

## Expected Behavior

### With 2 Tokens
If you have:
- Token 1: 3 accounts, 50 zones
- Token 2: 4 accounts, 59 zones
- 1 shared account between both tokens

The home screen should show:
- **Accounts**: 6 (3 + 4 - 1 shared = 6 unique accounts)
- **Zones**: 109 (50 + 59 = 109 total zones)

## Troubleshooting

### If counts are still wrong:

1. **Check console logs** for:
   ```
   Found X tokens
   Token [label]: loaded Y unique accounts so far
   Total unique accounts loaded from all tokens: Z
   Token [label]: W zones
   Total zones count from all tokens: V
   ```

2. **Verify tokens are saved correctly**:
   - Go to Token Management screen
   - Confirm both tokens are listed
   - Check that both tokens are valid

3. **Clear cache and restart**:
   - Close the app completely
   - Clear Metro bundler cache: `npm start -- --reset-cache`
   - Restart the app

4. **Check token permissions**:
   - Both tokens need "Account:Read" and "Zone:Read" permissions
   - Verify in Cloudflare dashboard

## Files Modified
- `cloudflare-analytics/src/contexts/ZoneContext.tsx`
  - `loadAccounts()` - Now loads from all tokens
  - `loadTotalZonesCountFromAllTokens()` - New function to aggregate zones from all tokens

## Testing
1. Add 2 different API tokens
2. Go to home screen
3. Verify account count shows total from both tokens
4. Verify zone count shows total from both tokens
5. Pull to refresh to reload data
6. Check console logs to confirm data loading

## Notes
- The currently active token (used for GraphQL queries) is still managed separately
- This aggregation is only for display purposes on the home screen
- When viewing specific zone data, it uses the currently active token
