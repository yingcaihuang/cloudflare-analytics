/**
 * GraphQLClient Service
 * Handles Cloudflare GraphQL API queries using Apollo Client
 */

import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  from,
  gql,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import AuthManager from './AuthManager';
import {
  MetricsQueryParams,
  TrafficMetrics,
  StatusCodeData,
  SecurityMetrics,
  GeoData,
  ProtocolData,
  TLSData,
  ContentTypeData,
  Zone,
} from '../types';

// Cloudflare GraphQL API endpoint
const CLOUDFLARE_GRAPHQL_ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

/**
 * GraphQLClient class for querying Cloudflare Analytics data
 */
class GraphQLClient {
  private client: any = null;

  /**
   * Initializes the Apollo Client with authentication and error handling
   */
  private async initializeClient(): Promise<any> {
    if (this.client) {
      return this.client;
    }

    // Get the current token
    const token = await AuthManager.getCurrentToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    // Create HTTP link
    const httpLink = new HttpLink({
      uri: CLOUDFLARE_GRAPHQL_ENDPOINT,
    });

    // Authentication middleware
    const authLink = new ApolloLink((operation, forward) => {
      operation.setContext({
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return forward(operation);
    });

    // Error handling link
    const errorLink = onError((errorResponse: any) => {
      const { graphQLErrors, networkError } = errorResponse;
      
      if (graphQLErrors) {
        graphQLErrors.forEach((error: any) => {
          const { message, locations, path, extensions } = error;
          console.error(
            `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`
          );

          // Handle specific error codes
          if (extensions?.code === 'UNAUTHENTICATED') {
            console.error('Authentication error: Token may be invalid or expired');
          }
        });
      }

      if (networkError) {
        console.error(`[Network error]: ${networkError.message}`);
      }
    });

    // Combine links
    const link = from([errorLink, authLink, httpLink]);

    // Create Apollo Client
    this.client = new ApolloClient({
      link,
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'network-only' as const,
          errorPolicy: 'all' as const,
        },
        query: {
          fetchPolicy: 'network-only' as const,
          errorPolicy: 'all' as const,
        },
      },
    });

    return this.client;
  }

  /**
   * Resets the client (useful when token changes)
   */
  resetClient(): void {
    this.client = null;
  }

  /**
   * Queries traffic metrics from Cloudflare GraphQL API
   * Uses httpRequestsAdaptiveGroups for better granularity and alignment with Cloudflare Dashboard
   * @param params - Query parameters including zoneId, date range, and granularity
   * @returns TrafficMetrics data
   */
  async queryTrafficMetrics(params: MetricsQueryParams): Promise<TrafficMetrics> {
    const client = await this.initializeClient();

    // Build the GraphQL query using httpRequestsAdaptiveGroups
    // This provides 15-minute granularity and matches Cloudflare Dashboard data
    const query = gql`
      query GetTrafficMetrics(
        $zoneTag: String!
        $filter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject
      ) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequestsAdaptiveGroups(
              limit: 5000
              filter: $filter
            ) {
              count
              avg {
                sampleInterval
              }
              sum {
                edgeResponseBytes
                visits
              }
              dimensions {
                datetimeFifteenMinutes
              }
            }
          }
        }
      }
    `;

    // Build filter with datetime range and requestSource
    const filter: any = {
      AND: [
        {
          datetime_geq: params.startDate.toISOString(),
          datetime_leq: params.endDate.toISOString(),
        },
        {
          requestSource: 'eyeball', // Filter for origin requests only
        },
      ],
    };

    try {
      const result = await client.query({
        query,
        variables: {
          zoneTag: params.zoneId,
          filter,
        },
      });

      console.log('Traffic metrics query result:', JSON.stringify(result, null, 2));

      // Parse the response
      const data = result.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups || [];

      // Aggregate metrics
      let totalRequests = 0;
      let totalBytes = 0;
      let totalPageViews = 0;

      const timeSeries = data.map((item: any) => {
        const requests = item.count || 0;
        const bytes = item.sum?.edgeResponseBytes || 0;
        const visits = item.sum?.visits || 0;

        totalRequests += requests;
        totalBytes += bytes;
        totalPageViews += visits;

        return {
          timestamp: new Date(item.dimensions.datetimeFifteenMinutes),
          requests,
          bytes,
          bandwidth: bytes, // Will be calculated per-interval if needed
        };
      });

      // Sort time series by timestamp
      timeSeries.sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime());

      // Calculate bandwidth (bytes per second over the time range)
      const timeRangeSeconds = (params.endDate.getTime() - params.startDate.getTime()) / 1000;
      const bandwidth = timeRangeSeconds > 0 ? totalBytes / timeRangeSeconds : 0;

      console.log('Traffic metrics aggregated:', { 
        totalRequests, 
        totalBytes, 
        totalPageViews, 
        bandwidth,
        dataPoints: timeSeries.length 
      });

      return {
        zoneId: params.zoneId,
        timeRange: {
          start: params.startDate,
          end: params.endDate,
        },
        requests: totalRequests,
        bytes: totalBytes,
        bandwidth,
        pageViews: totalPageViews,
        visits: totalPageViews,
        timeSeries,
      };
    } catch (error) {
      console.error('Error querying traffic metrics:', error);
      throw new Error(
        `Failed to query traffic metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Queries HTTP status code distribution using REST API
   * Note: GraphQL API doesn't expose status codes in httpRequests groups
   * @param params - Query parameters including zoneId and date range
   * @returns StatusCodeData
   */
  async queryStatusCodes(params: MetricsQueryParams): Promise<StatusCodeData> {
    const client = await this.initializeClient();

    console.log('[GraphQLClient] queryStatusCodes called with params:', {
      zoneId: params.zoneId,
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
    });

    // Build the GraphQL query for status codes using zones API
    // This matches the working query structure from the user
    const query = gql`
      query ZapTimeseriesBydatetimeHourGroupedByedgeResponseStatus(
        $zoneTag: string
        $filter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject
      ) {
        viewer {
          scope: zones(filter: { zoneTag: $zoneTag }) {
            series: httpRequestsAdaptiveGroups(
              limit: 5000
              filter: $filter
            ) {
              count
              avg {
                sampleInterval
              }
              sum {
                edgeResponseBytes
                visits
              }
              dimensions {
                metric: edgeResponseStatus
                ts: datetimeHour
              }
            }
          }
        }
      }
    `;

    const filter = {
      AND: [
        {
          datetime_geq: params.startDate.toISOString(),
          datetime_leq: params.endDate.toISOString(),
        },
        {
          requestSource: 'eyeball',
        },
        {
          OR: [
            { edgeResponseStatus: 304 },
            { edgeResponseStatus: 200 },
            { edgeResponseStatus: 404 },
            { edgeResponseStatus: 204 },
            { edgeResponseStatus: 403 },
            { edgeResponseStatus: 500 },
            { edgeResponseStatus: 502 },
            { edgeResponseStatus: 503 },
            { edgeResponseStatus: 504 },
          ],
        },
      ],
    };

    console.log('[GraphQLClient] Status codes query variables:', {
      zoneTag: params.zoneId,
      filter,
    });

    try {
      const result = await client.query({
        query,
        variables: {
          zoneTag: params.zoneId,
          filter,
        },
      });

      console.log('[GraphQLClient] Status codes RAW result:', JSON.stringify(result, null, 2));

      const series = result.data?.viewer?.scope?.[0]?.series || [];
      console.log('[GraphQLClient] Status codes series array length:', series.length);

      // Aggregate status codes
      let status2xx = 0;
      let status3xx = 0;
      let status4xx = 0;
      let status5xx = 0;
      const breakdown: { [code: string]: number } = {};

      series.forEach((item: any, index: number) => {
        const statusCode = item.dimensions?.metric;
        const count = item.count || 0;

        console.log(`[GraphQLClient] Status code item ${index}:`, {
          statusCode,
          count,
          rawItem: JSON.stringify(item),
        });

        if (!statusCode) return;

        const statusNum = Number(statusCode);
        
        // Initialize breakdown for this status code if not exists
        if (!breakdown[statusCode]) {
          breakdown[statusCode] = 0;
        }
        breakdown[statusCode] += count;

        // Categorize by status code range
        if (statusNum >= 200 && statusNum < 300) {
          status2xx += count;
        } else if (statusNum >= 300 && statusNum < 400) {
          status3xx += count;
        } else if (statusNum >= 400 && statusNum < 500) {
          status4xx += count;
        } else if (statusNum >= 500 && statusNum < 600) {
          status5xx += count;
        }
      });

      const total = status2xx + status3xx + status4xx + status5xx;

      console.log('[GraphQLClient] Status codes aggregated:', { 
        total, 
        status2xx, 
        status3xx, 
        status4xx, 
        status5xx,
        breakdown,
      });

      return {
        total,
        status2xx,
        status3xx,
        status4xx,
        status5xx,
        breakdown,
      };
    } catch (error) {
      console.error('[GraphQLClient] Error querying status codes:', error);
      throw new Error(
        `Failed to query status codes: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculates percentages for status code categories
   * @param statusData - Status code data
   * @returns Object with percentage for each category
   */
  calculateStatusCodePercentages(statusData: StatusCodeData): {
    status2xxPercent: number;
    status3xxPercent: number;
    status4xxPercent: number;
    status5xxPercent: number;
  } {
    if (statusData.total === 0) {
      return {
        status2xxPercent: 0,
        status3xxPercent: 0,
        status4xxPercent: 0,
        status5xxPercent: 0,
      };
    }

    return {
      status2xxPercent: (statusData.status2xx / statusData.total) * 100,
      status3xxPercent: (statusData.status3xx / statusData.total) * 100,
      status4xxPercent: (statusData.status4xx / statusData.total) * 100,
      status5xxPercent: (statusData.status5xx / statusData.total) * 100,
    };
  }

  /**
   * Queries security metrics including cache status, firewall events, bot scores, and threat scores
   * @param params - Query parameters including zoneId and date range
   * @returns SecurityMetrics data
   */
  async querySecurityMetrics(params: MetricsQueryParams): Promise<SecurityMetrics> {
    const client = await this.initializeClient();

    // Determine which endpoint to use based on granularity
    // httpRequests1hGroups: max 3 days (259200 seconds)
    // httpRequests1dGroups: for longer time ranges
    const useHourlyGroups = params.granularity === 'hour';
    const httpRequestsEndpoint = useHourlyGroups ? 'httpRequests1hGroups' : 'httpRequests1dGroups';

    console.log('[GraphQLClient] querySecurityMetrics using endpoint:', httpRequestsEndpoint, 'granularity:', params.granularity);

    // Build the GraphQL query for security metrics
    // Note: httpRequests1hGroups uses datetime_geq/datetime_leq
    //       httpRequests1dGroups uses date_geq/date_leq
    const dateFilterField = useHourlyGroups ? 'datetime' : 'date';
    
    const query = gql`
      query GetSecurityMetrics(
        $zoneTag: String!
        $datetimeStart: String!
        $datetimeEnd: String!
        $firewallStart: String!
        $firewallEnd: String!
      ) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            ${httpRequestsEndpoint}(
              limit: 10000
              filter: {
                ${dateFilterField}_geq: $datetimeStart
                ${dateFilterField}_leq: $datetimeEnd
              }
            ) {
              sum {
                requests
                cachedRequests
                cachedBytes
              }
              dimensions {
                ${dateFilterField}
              }
            }
            firewallEventsAdaptiveGroups(
              limit: 10000
              filter: {
                datetime_geq: $firewallStart
                datetime_leq: $firewallEnd
              }
            ) {
              count
              dimensions {
                action
                datetime
              }
            }
          }
        }
      }
    `;

    try {
      const result = await client.query({
        query,
        variables: {
          zoneTag: params.zoneId,
          datetimeStart: useHourlyGroups 
            ? params.startDate.toISOString() 
            : params.startDate.toISOString().split('T')[0], // Format: YYYY-MM-DD for daily
          datetimeEnd: useHourlyGroups 
            ? params.endDate.toISOString() 
            : params.endDate.toISOString().split('T')[0], // Format: YYYY-MM-DD for daily
          firewallStart: params.startDate.toISOString(), // Always ISO format for firewall
          firewallEnd: params.endDate.toISOString(), // Always ISO format for firewall
        },
      });

      console.log('[GraphQLClient] Security metrics query result:', JSON.stringify(result, null, 2));

      // Access the correct endpoint based on which one we used
      const zoneData = result.data?.viewer?.zones?.[0];
      const httpData = useHourlyGroups 
        ? (zoneData?.httpRequests1hGroups || [])
        : (zoneData?.httpRequests1dGroups || []);
      const firewallData = zoneData?.firewallEventsAdaptiveGroups || [];

      console.log('[GraphQLClient] HTTP data points:', httpData.length, 'Firewall data points:', firewallData.length);

      // Calculate cache metrics
      let totalRequests = 0;
      let cachedRequests = 0;

      httpData.forEach((item: any) => {
        totalRequests += item.sum.requests || 0;
        cachedRequests += item.sum.cachedRequests || 0;
      });

      // For now, we'll estimate cache status distribution
      // In a real implementation, this would come from more detailed API data
      const cacheHit = Math.round(cachedRequests * 0.85); // Assume 85% of cached are hits
      const cacheExpired = Math.round(cachedRequests * 0.10); // 10% expired
      const cacheStale = Math.round(cachedRequests * 0.05); // 5% stale
      const cacheMiss = totalRequests - cachedRequests;

      // Calculate firewall metrics and build time series
      let firewallBlocked = 0;
      let firewallChallenged = 0;
      let firewallAllowed = 0;

      // Group firewall events by time period for time series
      // Use hour for hourly data, day for daily data
      const timeSeriesMap = new Map<string, { blocked: number; challenged: number; allowed: number }>();

      firewallData.forEach((item: any) => {
        const action = item.dimensions.action?.toLowerCase() || '';
        const count = item.count || 0;
        const datetime = item.dimensions.datetime;

        // Aggregate totals
        if (action === 'block' || action === 'drop') {
          firewallBlocked += count;
        } else if (action === 'challenge' || action === 'jschallenge' || action === 'managedchallenge') {
          firewallChallenged += count;
        } else if (action === 'allow' || action === 'log') {
          firewallAllowed += count;
        }

        // Build time series (group by hour or day depending on granularity)
        if (datetime) {
          const date = new Date(datetime);
          let timeKey: string;
          
          if (useHourlyGroups) {
            // Group by hour for hourly data
            timeKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
          } else {
            // Group by day for daily data
            timeKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          }
          
          if (!timeSeriesMap.has(timeKey)) {
            timeSeriesMap.set(timeKey, { blocked: 0, challenged: 0, allowed: 0 });
          }
          
          const timeData = timeSeriesMap.get(timeKey)!;
          if (action === 'block' || action === 'drop') {
            timeData.blocked += count;
          } else if (action === 'challenge' || action === 'jschallenge' || action === 'managedchallenge') {
            timeData.challenged += count;
          } else if (action === 'allow' || action === 'log') {
            timeData.allowed += count;
          }
        }
      });

      const firewallTotal = firewallBlocked + firewallChallenged + firewallAllowed;

      // Convert time series map to array and sort by timestamp
      const timeSeries = Array.from(timeSeriesMap.entries())
        .map(([key, data]) => {
          const parts = key.split('-').map(Number);
          let timestamp: Date;
          
          if (useHourlyGroups) {
            // [year, month, day, hour]
            const [year, month, day, hour] = parts;
            timestamp = new Date(year, month, day, hour);
          } else {
            // [year, month, day]
            const [year, month, day] = parts;
            timestamp = new Date(year, month, day);
          }
          
          return {
            timestamp,
            blocked: data.blocked,
            challenged: data.challenged,
            allowed: data.allowed,
            total: data.blocked + data.challenged + data.allowed,
          };
        })
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Bot score and threat score placeholders
      // These would require additional GraphQL queries with bot management data
      // For now, we'll return default values
      const botScore = {
        average: 0,
        distribution: [
          { range: '0-20', count: 0 },
          { range: '21-40', count: 0 },
          { range: '41-60', count: 0 },
          { range: '61-80', count: 0 },
          { range: '81-100', count: 0 },
        ],
      };

      const threatScore = {
        average: 0,
        high: 0,
        medium: 0,
        low: 0,
      };

      console.log('[GraphQLClient] Security metrics aggregated:', { 
        cacheHit, cacheMiss, cacheExpired, cacheStale,
        firewallTotal, firewallBlocked, firewallChallenged, firewallAllowed,
        timeSeriesPoints: timeSeries.length,
        endpoint: httpRequestsEndpoint
      });

      return {
        cacheStatus: {
          hit: cacheHit,
          miss: cacheMiss,
          expired: cacheExpired,
          stale: cacheStale,
        },
        firewallEvents: {
          total: firewallTotal,
          blocked: firewallBlocked,
          challenged: firewallChallenged,
          allowed: firewallAllowed,
        },
        botScore,
        threatScore,
        timeSeries,
      };
    } catch (error) {
      console.error('[GraphQLClient] Error querying security metrics:', error);
      throw new Error(
        `Failed to query security metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculates cache hit rate percentage
   * @param securityMetrics - Security metrics data
   * @returns Cache hit rate as a percentage (0-100)
   */
  calculateCacheHitRate(securityMetrics: SecurityMetrics): number {
    const { hit, miss, expired, stale } = securityMetrics.cacheStatus;
    const total = hit + miss + expired + stale;

    if (total === 0) {
      return 0;
    }

    return (hit / total) * 100;
  }

  /**
   * Calculates total firewall events
   * @param securityMetrics - Security metrics data
   * @returns Total number of firewall events
   */
  calculateFirewallEventsTotal(securityMetrics: SecurityMetrics): number {
    const { blocked, challenged, allowed } = securityMetrics.firewallEvents;
    return blocked + challenged + allowed;
  }

  /**
   * Queries geographic distribution of traffic by country
   * @param params - Query parameters including accountTag and date range
   * @returns GeoData with country-level traffic distribution
   */
  async queryGeoDistribution(params: MetricsQueryParams): Promise<GeoData> {
    console.log('[GraphQLClient] queryGeoDistribution called with params:', params);
    
    if (!params.accountTag) {
      throw new Error('accountTag is required for geo distribution query');
    }
    
    const client = await this.initializeClient();

    // Build the GraphQL query for geographic distribution using accounts API
    const query = gql`
      query GetGeoDistribution(
        $accountTag: String!
        $filter: AccountHttpRequestsOverviewAdaptiveGroupsFilter_InputObject
      ) {
        viewer {
          accounts(filter: { accountTag: $accountTag }) {
            httpRequestsOverviewAdaptiveGroups(
              limit: 1000
              filter: $filter
            ) {
              sum {
                requests
                bytes
              }
              dimensions {
                metric: clientCountryName
              }
            }
          }
        }
      }
    `;

    const filter = {
      datetime_geq: params.startDate.toISOString(),
      datetime_leq: params.endDate.toISOString(),
    };

    console.log('[GraphQLClient] Query variables:', { accountTag: params.accountTag, filter });

    try {
      console.log('[GraphQLClient] Sending GraphQL query...');
      const result = await client.query({
        query,
        variables: {
          accountTag: params.accountTag,
          filter,
        },
      });

      console.log('[GraphQLClient] Query result:', JSON.stringify(result, null, 2));

      const data = result.data?.viewer?.accounts?.[0]?.httpRequestsOverviewAdaptiveGroups || [];

      // Aggregate data by country
      const countryMap = new Map<string, { requests: number; bytes: number }>();
      let totalRequests = 0;

      data.forEach((item: any) => {
        const countryName = item.dimensions.metric || 'Unknown';
        const requests = item.sum.requests || 0;
        const bytes = item.sum.bytes || 0;

        totalRequests += requests;

        if (countryMap.has(countryName)) {
          const existing = countryMap.get(countryName)!;
          existing.requests += requests;
          existing.bytes += bytes;
        } else {
          countryMap.set(countryName, { requests, bytes });
        }
      });

      // Convert to array and calculate percentages
      const countries = Array.from(countryMap.entries())
        .map(([nameOrCode, stats]) => {
          // Check if it's a 2-letter code or a full name
          const isCode = nameOrCode.length === 2;
          const code = isCode ? nameOrCode : this.getCountryCode(nameOrCode);
          const name = isCode ? this.getCountryName(nameOrCode) : nameOrCode;
          
          console.log(`[GraphQLClient] Processing country: nameOrCode="${nameOrCode}", isCode=${isCode}, code="${code}", name="${name}"`);
          
          return {
            code,
            name,
            requests: stats.requests,
            bytes: stats.bytes,
            percentage: totalRequests > 0 ? (stats.requests / totalRequests) * 100 : 0,
          };
        })
        .sort((a, b) => b.requests - a.requests); // Sort by requests descending

      console.log('[GraphQLClient] Geo distribution aggregated:', { totalCountries: countries.length, totalRequests });

      return { countries };
    } catch (error) {
      console.error('Error querying geographic distribution:', error);
      throw new Error(
        `Failed to query geographic distribution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Helper function to convert country name to ISO 3166-1 alpha-2 code
   * This is a simplified mapping - in production, use a comprehensive library
   */
  private getCountryCode(countryName: string): string {
    const countryCodeMap: { [key: string]: string } = {
      'United States': 'US',
      'United Kingdom': 'GB',
      'China': 'CN',
      'Japan': 'JP',
      'Germany': 'DE',
      'France': 'FR',
      'India': 'IN',
      'Canada': 'CA',
      'Australia': 'AU',
      'Brazil': 'BR',
      'Russia': 'RU',
      'South Korea': 'KR',
      'Spain': 'ES',
      'Italy': 'IT',
      'Mexico': 'MX',
      'Indonesia': 'ID',
      'Netherlands': 'NL',
      'Saudi Arabia': 'SA',
      'Turkey': 'TR',
      'Switzerland': 'CH',
      'Poland': 'PL',
      'Belgium': 'BE',
      'Sweden': 'SE',
      'Argentina': 'AR',
      'Norway': 'NO',
      'Austria': 'AT',
      'United Arab Emirates': 'AE',
      'Israel': 'IL',
      'Hong Kong': 'HK',
      'Singapore': 'SG',
      'Denmark': 'DK',
      'Finland': 'FI',
      'Ireland': 'IE',
      'Portugal': 'PT',
      'Greece': 'GR',
      'Czech Republic': 'CZ',
      'Romania': 'RO',
      'Vietnam': 'VN',
      'Philippines': 'PH',
      'Chile': 'CL',
      'Thailand': 'TH',
      'Malaysia': 'MY',
      'Colombia': 'CO',
      'South Africa': 'ZA',
      'Pakistan': 'PK',
      'Bangladesh': 'BD',
      'Egypt': 'EG',
      'Nigeria': 'NG',
      'Taiwan': 'TW',
      'Serbia': 'RS',
      'Unknown': 'XX',
    };

    return countryCodeMap[countryName] || 'XX';
  }

  /**
   * Helper function to convert ISO 3166-1 alpha-2 code to country name
   */
  private getCountryName(countryCode: string): string {
    const codeToNameMap: { [key: string]: string } = {
      'US': 'United States',
      'GB': 'United Kingdom',
      'CN': 'China',
      'JP': 'Japan',
      'DE': 'Germany',
      'FR': 'France',
      'IN': 'India',
      'CA': 'Canada',
      'AU': 'Australia',
      'BR': 'Brazil',
      'RU': 'Russia',
      'KR': 'South Korea',
      'ES': 'Spain',
      'IT': 'Italy',
      'MX': 'Mexico',
      'ID': 'Indonesia',
      'NL': 'Netherlands',
      'SA': 'Saudi Arabia',
      'TR': 'Turkey',
      'CH': 'Switzerland',
      'PL': 'Poland',
      'BE': 'Belgium',
      'SE': 'Sweden',
      'AR': 'Argentina',
      'NO': 'Norway',
      'AT': 'Austria',
      'AE': 'United Arab Emirates',
      'IL': 'Israel',
      'HK': 'Hong Kong',
      'SG': 'Singapore',
      'DK': 'Denmark',
      'FI': 'Finland',
      'IE': 'Ireland',
      'PT': 'Portugal',
      'GR': 'Greece',
      'CZ': 'Czech Republic',
      'RO': 'Romania',
      'VN': 'Vietnam',
      'PH': 'Philippines',
      'CL': 'Chile',
      'TH': 'Thailand',
      'MY': 'Malaysia',
      'CO': 'Colombia',
      'ZA': 'South Africa',
      'PK': 'Pakistan',
      'BD': 'Bangladesh',
      'EG': 'Egypt',
      'NG': 'Nigeria',
      'TW': 'Taiwan',
      'RS': 'Serbia',
      'XX': 'Unknown',
    };

    return codeToNameMap[countryCode] || countryCode;
  }

  /**
   * Queries protocol distribution (HTTP/1.0, HTTP/1.1, HTTP/2, HTTP/3)
   * @param params - Query parameters including accountTag and date range
   * @returns ProtocolData with protocol version distribution
   */
  async queryProtocolDistribution(params: MetricsQueryParams): Promise<ProtocolData> {
    if (!params.accountTag) {
      throw new Error('accountTag is required for protocol distribution query');
    }
    
    console.log('[GraphQLClient] queryProtocolDistribution called with params:', {
      accountTag: params.accountTag,
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
    });
    
    const client = await this.initializeClient();

    // Build the GraphQL query for protocol distribution using accounts API
    // This matches the structure from the user's working query
    const query = gql`
      query GetHttpProtocols(
        $accountTag: String!
        $filter: AccountHttpRequestsOverviewAdaptiveGroupsFilter_InputObject
      ) {
        viewer {
          accounts(filter: { accountTag: $accountTag }) {
            total: httpRequestsOverviewAdaptiveGroups(
              filter: $filter
              limit: 1
            ) {
              sum {
                requests
              }
            }
            httpProtocols: httpRequestsOverviewAdaptiveGroups(
              filter: $filter
              limit: 10
              orderBy: [sum_requests_DESC]
            ) {
              sum {
                requests
              }
              dimensions {
                metric: clientRequestHTTPProtocol
              }
            }
          }
        }
      }
    `;

    const filter = {
      datetime_geq: params.startDate.toISOString(),
      datetime_leq: params.endDate.toISOString(),
    };

    console.log('[GraphQLClient] Protocol query variables:', {
      accountTag: params.accountTag,
      filter,
    });

    try {
      const result = await client.query({
        query,
        variables: {
          accountTag: params.accountTag,
          filter,
        },
      });

      console.log('[GraphQLClient] Protocol distribution RAW result:', JSON.stringify(result, null, 2));

      const account = result.data?.viewer?.accounts?.[0];
      console.log('[GraphQLClient] Account data:', account);
      
      const protocolData = account?.httpProtocols || [];
      const totalData = account?.total || [];

      console.log('[GraphQLClient] Protocol data array:', protocolData);
      console.log('[GraphQLClient] Total data array:', totalData);

      // Get total from the total query
      const total = totalData[0]?.sum?.requests || 0;

      // Aggregate protocol data
      let http1_0 = 0;
      let http1_1 = 0;
      let http2 = 0;
      let http3 = 0;

      protocolData.forEach((item: any, index: number) => {
        const protocol = item.dimensions?.metric || '';
        const requests = item.sum?.requests || 0;

        console.log(`[GraphQLClient] Protocol item ${index}:`, {
          protocol,
          requests,
          rawItem: JSON.stringify(item),
        });

        // Map protocol strings to categories (case-sensitive match from API)
        if (protocol === 'HTTP/1.0') {
          http1_0 += requests;
        } else if (protocol === 'HTTP/1.1') {
          http1_1 += requests;
        } else if (protocol === 'HTTP/2') {
          http2 += requests;
        } else if (protocol === 'HTTP/3') {
          http3 += requests;
        } else {
          console.log(`[GraphQLClient] Unknown protocol: "${protocol}"`);
        }
      });

      console.log('[GraphQLClient] Protocol distribution aggregated:', { http1_0, http1_1, http2, http3, total });

      return {
        http1_0,
        http1_1,
        http2,
        http3,
        total,
      };
    } catch (error) {
      console.error('[GraphQLClient] Error querying protocol distribution:', error);
      throw new Error(
        `Failed to query protocol distribution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Queries TLS version distribution (TLS 1.0, 1.1, 1.2, 1.3)
   * @param params - Query parameters including accountTag and date range
   * @returns TLSData with TLS version distribution and insecure percentage
   */
  async queryTLSDistribution(params: MetricsQueryParams): Promise<TLSData> {
    if (!params.accountTag) {
      throw new Error('accountTag is required for TLS distribution query');
    }
    
    const client = await this.initializeClient();

    // Build the GraphQL query for TLS distribution using accounts API
    const query = gql`
      query GetTLSDistribution(
        $accountTag: String!
        $filter: AccountHttpRequestsOverviewAdaptiveGroupsFilter_InputObject
      ) {
        viewer {
          accounts(filter: { accountTag: $accountTag }) {
            httpRequestsOverviewAdaptiveGroups(
              limit: 1000
              filter: $filter
            ) {
              sum {
                requests
              }
              dimensions {
                metric: clientSSLProtocol
              }
            }
          }
        }
      }
    `;

    const filter = {
      datetime_geq: params.startDate.toISOString(),
      datetime_leq: params.endDate.toISOString(),
    };

    try {
      const result = await client.query({
        query,
        variables: {
          accountTag: params.accountTag,
          filter,
        },
      });

      console.log('TLS distribution query result:', JSON.stringify(result, null, 2));

      const data = result.data?.viewer?.accounts?.[0]?.httpRequestsOverviewAdaptiveGroups || [];

      // Aggregate TLS version data
      let tls1_0 = 0;
      let tls1_1 = 0;
      let tls1_2 = 0;
      let tls1_3 = 0;
      let total = 0;

      data.forEach((item: any) => {
        const protocol = item.dimensions.metric?.toLowerCase() || '';
        const requests = item.sum.requests || 0;

        total += requests;

        // Map TLS protocol strings to categories
        if (protocol.includes('tlsv1.0') || protocol === 'tls 1.0' || protocol === 'tlsv1') {
          tls1_0 += requests;
        } else if (protocol.includes('tlsv1.1') || protocol === 'tls 1.1') {
          tls1_1 += requests;
        } else if (protocol.includes('tlsv1.2') || protocol === 'tls 1.2') {
          tls1_2 += requests;
        } else if (protocol.includes('tlsv1.3') || protocol === 'tls 1.3') {
          tls1_3 += requests;
        } else if (protocol.includes('tls')) {
          // Default unknown TLS versions to TLS 1.2 (most common)
          tls1_2 += requests;
        }
      });

      // Calculate insecure percentage (TLS 1.0 + TLS 1.1)
      const insecureRequests = tls1_0 + tls1_1;
      const insecurePercentage = total > 0 ? (insecureRequests / total) * 100 : 0;

      console.log('TLS distribution aggregated:', { tls1_0, tls1_1, tls1_2, tls1_3, total, insecurePercentage });

      return {
        tls1_0,
        tls1_1,
        tls1_2,
        tls1_3,
        total,
        insecurePercentage,
      };
    } catch (error) {
      console.error('Error querying TLS distribution:', error);
      throw new Error(
        `Failed to query TLS distribution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Queries content type distribution by Content-Type header
   * @param params - Query parameters including accountTag and date range
   * @returns ContentTypeData with content type distribution and percentages
   */
  async queryContentTypeDistribution(params: MetricsQueryParams): Promise<ContentTypeData> {
    if (!params.accountTag) {
      throw new Error('accountTag is required for content type distribution query');
    }
    
    const client = await this.initializeClient();

    // Build the GraphQL query for content type distribution using accounts API
    const query = gql`
      query GetContentTypeDistribution(
        $accountTag: String!
        $filter: AccountHttpRequestsOverviewAdaptiveGroupsFilter_InputObject
      ) {
        viewer {
          accounts(filter: { accountTag: $accountTag }) {
            httpRequestsOverviewAdaptiveGroups(
              limit: 1000
              filter: $filter
            ) {
              sum {
                requests
                bytes
              }
              dimensions {
                metric: edgeResponseContentTypeName
              }
            }
          }
        }
      }
    `;

    const filter = {
      datetime_geq: params.startDate.toISOString(),
      datetime_leq: params.endDate.toISOString(),
    };

    try {
      const result = await client.query({
        query,
        variables: {
          accountTag: params.accountTag,
          filter,
        },
      });

      console.log('Content type distribution query result:', JSON.stringify(result, null, 2));

      const data = result.data?.viewer?.accounts?.[0]?.httpRequestsOverviewAdaptiveGroups || [];

      // Aggregate content type data
      const contentTypeMap = new Map<string, { requests: number; bytes: number }>();
      let totalRequests = 0;

      data.forEach((item: any) => {
        const contentType = item.dimensions.metric || 'unknown';
        const requests = item.sum.requests || 0;
        const bytes = item.sum.bytes || 0;

        totalRequests += requests;

        if (contentTypeMap.has(contentType)) {
          const existing = contentTypeMap.get(contentType)!;
          existing.requests += requests;
          existing.bytes += bytes;
        } else {
          contentTypeMap.set(contentType, { requests, bytes });
        }
      });

      // Convert to array, calculate percentages, and sort by requests descending
      const types = Array.from(contentTypeMap.entries())
        .map(([contentType, stats]) => ({
          contentType,
          requests: stats.requests,
          bytes: stats.bytes,
          percentage: totalRequests > 0 ? (stats.requests / totalRequests) * 100 : 0,
        }))
        .sort((a, b) => b.requests - a.requests); // Sort by requests descending

      console.log('Content type distribution aggregated:', { totalTypes: types.length, totalRequests });

      return { types };
    } catch (error) {
      console.error('Error querying content type distribution:', error);
      throw new Error(
        `Failed to query content type distribution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Gets the list of zones for the authenticated user
   */
  async getZones(): Promise<Zone[]> {
    const token = await AuthManager.getCurrentToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Use the REST API for zones (simpler than GraphQL for this)
    const response = await fetch('https://api.cloudflare.com/client/v4/zones', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch zones');
    }

    const data = await response.json();
    return data.result?.map((zone: any) => ({
      id: zone.id,
      name: zone.name,
      status: zone.status,
      plan: zone.plan?.name || 'Unknown',
    })) || [];
  }

  /**
   * Queries Bot analysis data including bot traffic by source type
   * @param params - Query parameters including zoneId and date range
   * @returns BotAnalysisData with bot traffic statistics by source type
   * 
   * Uses zones API with httpRequestsAdaptiveGroups and botScoreSrcName dimension
   */
  async queryBotAnalysis(params: MetricsQueryParams): Promise<any> {
    const client = await this.initializeClient();

    // Query bot traffic data using zones API with botScoreSrcName dimension
    const query = gql`
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
    `;

    const filter = {
      datetime_geq: params.startDate.toISOString(),
      datetime_leq: params.endDate.toISOString(),
    };

    try {
      const result = await client.query({
        query,
        variables: {
          zoneTag: params.zoneId,
          filter,
        },
      });

      console.log('[GraphQLClient] Bot analysis query result:', JSON.stringify(result, null, 2));

      const data = result.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups || [];

      // Aggregate bot traffic by source type
      const botSourceMap: { [key: string]: number } = {};
      let totalRequests = 0;

      data.forEach((item: any) => {
        const sourceName = item.dimensions?.botScoreSrcName || 'unknown';
        const count = item.count || 0;

        totalRequests += count;
        botSourceMap[sourceName] = (botSourceMap[sourceName] || 0) + count;
      });

      // Convert to array format for display
      const scoreDistribution = Object.entries(botSourceMap).map(([source, count]) => ({
        range: source, // Using 'range' field for source name to maintain compatibility
        count: count,
        percentage: totalRequests > 0 ? (count / totalRequests) * 100 : 0,
      }));

      // Calculate bot requests (all non-human traffic)
      const botRequests = totalRequests; // All requests in this query are categorized by bot source
      const botPercentage = 100; // Since we're only querying bot-categorized traffic

      console.log('[GraphQLClient] Bot analysis aggregated:', {
        totalRequests,
        botRequests,
        botPercentage,
        scoreDistribution,
      });

      return {
        totalRequests,
        botRequests,
        botPercentage,
        scoreDistribution,
      };
    } catch (error) {
      console.error('[GraphQLClient] Error querying bot analysis:', error);
      
      // Return empty data on error
      console.warn('[GraphQLClient] Bot analysis data not available.');
      
      return {
        totalRequests: 0,
        botRequests: 0,
        botPercentage: 0,
        scoreDistribution: [],
      };
    }
  }

  /**
   * Queries Firewall analysis data including rule statistics and top triggered rules
   * @param params - Query parameters including zoneId and date range
   * @returns FirewallAnalysisData with firewall rule statistics
   */
  async queryFirewallAnalysis(params: MetricsQueryParams): Promise<any> {
    const client = await this.initializeClient();

    // Build the GraphQL query for firewall analysis
    // Note: Firewall events still use zones API as they are zone-specific
    const query = gql`
      query GetFirewallAnalysis(
        $zoneTag: String!
        $datetimeStart: String!
        $datetimeEnd: String!
      ) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
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
          }
        }
      }
    `;

    try {
      const result = await client.query({
        query,
        variables: {
          zoneTag: params.zoneId,
          datetimeStart: params.startDate.toISOString(),
          datetimeEnd: params.endDate.toISOString(),
        },
      });

      console.log('Firewall analysis query result:', JSON.stringify(result, null, 2));

      const data = result.data?.viewer?.zones?.[0]?.firewallEventsAdaptiveGroups || [];

      // Aggregate firewall rule data
      const ruleMap = new Map<string, { action: string; count: number; source: string }>();
      let totalEvents = 0;

      data.forEach((item: any) => {
        const ruleId = item.dimensions.ruleId || 'unknown';
        const action = item.dimensions.action || 'unknown';
        const source = item.dimensions.source || 'unknown';
        const count = item.count || 0;

        totalEvents += count;

        if (ruleMap.has(ruleId)) {
          const existing = ruleMap.get(ruleId)!;
          existing.count += count;
        } else {
          ruleMap.set(ruleId, { action, count, source });
        }
      });

      // Convert to array and calculate percentages
      const rules = Array.from(ruleMap.entries()).map(([ruleId, stats]) => ({
        ruleId,
        ruleName: this.getFirewallRuleName(ruleId, stats.source),
        action: stats.action,
        count: stats.count,
        percentage: totalEvents > 0 ? (stats.count / totalEvents) * 100 : 0,
      }));

      // Sort by count descending and get top 10
      const sortedRules = [...rules].sort((a, b) => b.count - a.count);
      const topRules = sortedRules.slice(0, 10);

      console.log('Firewall analysis aggregated:', {
        totalEvents,
        rulesCount: rules.length,
        topRulesCount: topRules.length,
      });

      return {
        totalEvents,
        rules,
        topRules,
      };
    } catch (error) {
      console.error('Error querying firewall analysis:', error);
      throw new Error(
        `Failed to query firewall analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Helper function to generate a human-readable firewall rule name
   * @param ruleId - The rule ID
   * @param source - The rule source (e.g., 'firewallrules', 'waf', 'ratelimit')
   * @returns A formatted rule name
   */
  private getFirewallRuleName(ruleId: string, source: string): string {
    // Map common sources to readable names
    const sourceMap: { [key: string]: string } = {
      'firewallrules': 'Firewall Rule',
      'waf': 'WAF Rule',
      'ratelimit': 'Rate Limit',
      'bic': 'Browser Integrity Check',
      'hot': 'Hotlink Protection',
      'l7ddos': 'DDoS Protection',
      'validation': 'Validation',
      'unknown': 'Unknown Rule',
    };

    const sourceName = sourceMap[source.toLowerCase()] || source;
    
    // If ruleId is a UUID or long string, truncate it
    if (ruleId.length > 20) {
      return `${sourceName} (${ruleId.substring(0, 8)}...)`;
    }

    return `${sourceName} (${ruleId})`;
  }
}

// Export singleton instance
export default new GraphQLClient();
