# Bot Analysis API Fix

## Problem
The bot analysis query was using incorrect API structure:
- Used `accounts` API instead of `zones` API
- Used `botManagementScore` field which doesn't exist
- Required `accountTag` parameter instead of `zoneTag`
- Wrong endpoint: `httpRequestsOverviewAdaptiveGroups` instead of `httpRequestsAdaptiveGroups`

Error received:
```
unknown field "botScore"
```

## Solution
Updated the bot analysis query to use the correct Cloudflare API structure based on actual API response:

### API Changes
1. **Endpoint**: Changed from `accounts` → `httpRequestsOverviewAdaptiveGroups` to `zones` → `httpRequestsAdaptiveGroups`
2. **Parameter**: Changed from `accountTag` to `zoneTag` (using `params.zoneId`)
3. **Dimension Field**: Changed from `botManagementScore` to `botScoreSrcName`
4. **Response Structure**: Changed from `sum.requests` to `count`

### Correct API Structure
```graphql
query GetBotAnalysis(
  $zoneTag: String!
  $filter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject
) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      httpRequestsAdaptiveGroups(
        limit: 10000
        filter: $filter
      ) {
        count
        dimensions {
          botScoreSrcName
        }
      }
    }
  }
}
```

### Data Aggregation
The bot traffic is now categorized by source type:
- `machine_learning` - Bot detected by ML algorithms
- `heuristics` - Bot detected by heuristic rules
- Other source types as provided by Cloudflare

Each source type shows:
- Count of requests
- Percentage of total bot traffic

## Files Modified
- `cloudflare-analytics/src/services/GraphQLClient.ts` - Updated `queryBotAnalysis` method (lines 1290-1400)

## Testing
Test the bot analysis screen with different time ranges (24H, 7D, 30D) to verify:
1. No API errors
2. Bot traffic data displays correctly
3. Source type distribution shows accurate percentages
