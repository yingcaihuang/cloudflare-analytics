# Security Metrics Time Range Fix

## Problem
When selecting 7-day or 30-day time ranges in the Security screen, the app was throwing an error:
```
query time range is too large for zone... Time range can't be wider than 259200s, but it's 604800s
```

After the initial fix, a second error appeared:
```
error parsing args for "httpRequests1dGroups": filter: unknown arg datetime_geq
```

After fixing the filter field names, a third error appeared:
```
error parsing args for "httpRequests1dGroups": filter: date_leq: date format should be '2006-01-02'
```

After fixing the date format, a fourth error appeared:
```
error parsing args for "firewallEventsAdaptiveGroups": filter: datetime_leq: not an iso8601 time
```

## Root Cause
1. The `querySecurityMetrics()` method in `GraphQLClient.ts` was hardcoded to use `httpRequests1hGroups` endpoint, which has a maximum time range limit of 3 days (259200 seconds). When users selected 7-day or 30-day ranges, the query exceeded this limit.

2. The two endpoints use different filter parameter names:
   - `httpRequests1hGroups` uses `datetime_geq/datetime_leq` and returns `datetime` dimension
   - `httpRequests1dGroups` uses `date_geq/date_leq` and returns `date` dimension

3. The two endpoints require different date formats:
   - `httpRequests1hGroups` requires full ISO 8601 timestamps (e.g., `2026-01-23T05:47:21.851Z`)
   - `httpRequests1dGroups` requires date-only format (e.g., `2026-01-23`)

4. The `firewallEventsAdaptiveGroups` always requires ISO 8601 timestamps, regardless of which HTTP requests endpoint is used.

## Solution
Modified `querySecurityMetrics()` to dynamically choose the correct GraphQL endpoint and filter parameters based on the `granularity` parameter:

- **For 24-hour range**: Uses `httpRequests1hGroups` with `datetime_geq/datetime_leq`
- **For 7-day and 30-day ranges**: Uses `httpRequests1dGroups` with `date_geq/date_leq`

### Changes Made

#### 1. GraphQLClient.ts - querySecurityMetrics()
- Added logic to determine which endpoint to use based on `params.granularity`
- Added logic to determine which filter field name to use (`datetime` vs `date`)
- Dynamically construct GraphQL query with the appropriate endpoint and filter fields
- Updated data access to handle both `httpRequests1hGroups` and `httpRequests1dGroups` responses
- Updated time series grouping logic to handle both hourly and daily data
- Added detailed logging to track which endpoint is being used

#### 2. Filter Field Selection
```typescript
const dateFilterField = useHourlyGroups ? 'datetime' : 'date';
```
This ensures the correct filter parameter is used in the GraphQL query.

#### 3. Time Series Grouping
- **Hourly data**: Groups by year-month-day-hour
- **Daily data**: Groups by year-month-day
- Properly reconstructs timestamps based on the grouping method

### Code Flow

1. **SecurityScreen** calculates time range and granularity:
   - 24h → `granularity: 'hour'`
   - 7d → `granularity: 'day'`
   - 30d → `granularity: 'day'`

2. **useSecurityMetrics hook** passes params to GraphQLClient

3. **GraphQLClient.querySecurityMetrics()** checks granularity:
   ```typescript
   const useHourlyGroups = params.granularity === 'hour';
   const httpRequestsEndpoint = useHourlyGroups ? 'httpRequests1hGroups' : 'httpRequests1dGroups';
   const dateFilterField = useHourlyGroups ? 'datetime' : 'date';
   ```

4. Query is executed with the correct endpoint and filter fields

5. Response data is accessed from the correct field

### API Differences

| Endpoint | Time Range Limit | Filter Fields | Dimension Field | Date Format |
|----------|-----------------|---------------|-----------------|-------------|
| `httpRequests1hGroups` | 3 days (259200s) | `datetime_geq/datetime_leq` | `datetime` | ISO 8601 (e.g., `2026-01-23T05:47:21.851Z`) |
| `httpRequests1dGroups` | No limit (for longer ranges) | `date_geq/date_leq` | `date` | Date only (e.g., `2026-01-23`) |

### Date Format Handling
The code automatically formats dates based on the endpoint:
```typescript
// For HTTP requests endpoint (varies by granularity)
datetimeStart: useHourlyGroups 
  ? params.startDate.toISOString()              // Full ISO timestamp
  : params.startDate.toISOString().split('T')[0] // Date only (YYYY-MM-DD)

// For firewall events (always ISO timestamp)
firewallStart: params.startDate.toISOString()   // Always full ISO timestamp
```

The query uses separate variables for HTTP requests and firewall events to handle their different format requirements.

### Testing
To verify the fix works:
1. Open Security screen
2. Select 24H - should use `httpRequests1hGroups` with `datetime` filters
3. Select 7D - should use `httpRequests1dGroups` with `date` filters
4. Select 30D - should use `httpRequests1dGroups` with `date` filters
5. Check console logs for: `[GraphQLClient] querySecurityMetrics using endpoint: ...`
6. Verify no GraphQL errors in the response

### Files Modified
- `cloudflare-analytics/src/services/GraphQLClient.ts`

### Related Issues
- Task 8 from conversation summary
- Cloudflare API quota limits for time-series data
- Cloudflare API parameter naming differences between endpoints
