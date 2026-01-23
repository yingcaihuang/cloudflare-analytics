# GraphQL Query Structure Fix

## Problem
The distribution analysis features (Geo, Protocol, TLS, Content Type, Bot) were not returning any data because the GraphQL queries were using the wrong API structure.

### Root Cause
The queries were using:
- `zones` with `zoneTag` 
- `httpRequests1dGroups`
- `date_geq/date_leq` format (date-only strings)

But Cloudflare's API requires:
- `accounts` with `accountTag`
- `httpRequestsOverviewAdaptiveGroups`
- `datetime_geq/datetime_leq` format (full ISO timestamps)

## Solution

### 1. Updated Type Definitions
**File: `src/types/common.ts`**
- Added `accountTag?: string` to `MetricsQueryParams` interface

### 2. Updated ZoneContext
**File: `src/contexts/ZoneContext.tsx`**
- Added `accountTag` state variable
- Added `accountTag` to context interface
- Set `accountTag` from `selectedAccount.id` when account is selected
- Persist and restore `accountTag` along with other context data

### 3. Fixed GraphQL Queries
**File: `src/services/GraphQLClient.ts`**

Updated the following queries to use the correct structure:

#### queryGeoDistribution
- Changed from `zones(filter: { zoneTag })` to `accounts(filter: { accountTag })`
- Changed from `httpRequests1dGroups` to `httpRequestsOverviewAdaptiveGroups`
- Changed from `date_geq/date_leq` to `datetime_geq/datetime_leq` with full ISO timestamps
- Changed dimension field from `clientCountryName` to `metric: clientCountryName`
- Added validation to require `accountTag`

#### queryProtocolDistribution
- Same structural changes as geo distribution
- Changed dimension field from `clientHTTPProtocol` to `metric: clientHTTPProtocol`

#### queryTLSDistribution
- Same structural changes as geo distribution
- Changed dimension field from `clientSSLProtocol` to `metric: clientSSLProtocol`

#### queryContentTypeDistribution
- Same structural changes as geo distribution
- Changed dimension field from `edgeResponseContentTypeName` to `metric: edgeResponseContentTypeName`

#### queryBotAnalysis
- Same structural changes as geo distribution
- Changed dimension field from `botScore` to `metric: botScore`

#### queryFirewallAnalysis
- **No changes** - Firewall events are zone-specific and continue to use `zones` API

### 4. Updated Screens
**Files:**
- `src/screens/GeoDistributionScreen.tsx`
- `src/screens/ProtocolDistributionScreen.tsx`
- `src/screens/TLSDistributionScreen.tsx`
- `src/screens/ContentTypeScreen.tsx`

Changes:
- Get `accountTag` from `useZone()` context
- Include `accountTag` in params passed to hooks
- Update `useMemo` dependencies to include `accountTag`

### 5. Updated Hooks
**File: `src/hooks/useBotAnalysis.ts`**
- Get `accountTag` from `useZone()` context
- Pass `accountTag` to `GraphQLClient.queryBotAnalysis()`
- Update `useCallback` dependencies to include `accountTag`

## Testing
All code compiles successfully:
- TypeScript compilation: ✅ No errors
- ESLint: ✅ No errors

## Expected Behavior
After these changes:
1. When a user selects an account, the `accountTag` is stored in context
2. Distribution analysis screens now pass `accountTag` to their queries
3. GraphQL queries use the correct Cloudflare API structure
4. Data should now be returned from the API instead of empty results

## Next Steps
1. Test the application with actual Cloudflare API
2. Verify that data is returned for all distribution analysis features
3. Check console logs to confirm API requests are being made with correct structure
4. If issues persist, verify that the user's Cloudflare API token has the necessary permissions for account-level queries

## Reference
The correct query structure was provided by the user based on Cloudflare's actual API documentation.
