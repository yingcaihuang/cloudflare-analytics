# Bot Management and Firewall API Notes

## Bot Management API Issue

### Problem
The Bot Analysis feature was returning an error:
```
unknown field "botScore"
```

### Root Cause
Bot Management data requires a **Cloudflare Bot Management subscription**. The GraphQL API fields for bot data are:
- Not available on all Cloudflare plans
- Require Bot Management add-on subscription
- May use different field names than expected

### Solution Implemented
1. Changed field name from `botScore` to `botManagementScore`
2. Added error handling to return placeholder data when Bot Management is not available
3. Added console warnings to inform users that Bot Management subscription is required

### Current Behavior
- If Bot Management is available: Shows actual bot traffic data
- If Bot Management is NOT available: Shows placeholder data (all zeros) with warning in console
- Users will see a message indicating Bot Management subscription is required

## Firewall Events API

### Status
Firewall events use `firewallEventsAdaptiveGroups` which is available on most Cloudflare plans. This should work correctly.

### Query Structure
```graphql
firewallEventsAdaptiveGroups(
  limit: 10000
  filter: {
    datetime_geq: $datetimeStart
    datetime_leq: $datetimeEnd
  }
) {
  count
  dimensions {
    action
    ruleId
    source
  }
}
```

## Recommendations

### For Bot Analysis
1. **Check Cloudflare Plan**: Verify if the account has Bot Management enabled
2. **Alternative Approach**: Consider using User-Agent analysis or other available metrics
3. **UI Update**: Add a notice in the Bot Analysis screen indicating subscription requirement

### For Firewall Analysis
1. Should work on most plans
2. If issues occur, check if Firewall Rules are enabled for the zone
3. May need to adjust query based on plan level

## API Field Reference

### Available Fields (Most Plans)
- `clientCountryName` - Geographic data
- `clientRequestHTTPProtocol` - Protocol version
- `clientSSLProtocol` - TLS version
- `edgeResponseContentTypeName` - Content type
- `edgeResponseStatus` - Status codes

### Premium/Add-on Fields
- `botManagementScore` - Requires Bot Management
- `botScore` - Requires Bot Management
- Advanced firewall fields - May require specific subscriptions

## Testing
To test if Bot Management is available:
1. Check console logs for warnings
2. Look for "Bot Management data not available" message
3. Verify if data shows all zeros vs actual values

## Future Improvements
1. Add UI indicator for features requiring subscriptions
2. Implement feature detection to hide unavailable features
3. Provide alternative metrics when premium features are unavailable
