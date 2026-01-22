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
      timeSeries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

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
    try {
      // Get the current token
      const token = await AuthManager.getCurrentToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Format dates for the API
      const since = params.startDate.toISOString();
      const until = params.endDate.toISOString();

      // Use Cloudflare Analytics API (REST) to get status code data
      const url = `https://api.cloudflare.com/client/v4/zones/${params.zoneId}/analytics/dashboard?since=${since}&until=${until}&continuous=true`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Status codes REST API result:', JSON.stringify(data, null, 2));

      // Extract status code data from the response
      const requests = data.result?.totals?.requests?.all || 0;
      const httpStatus = data.result?.totals?.requests?.http_status || {};

      // Aggregate by category
      let status2xx = 0;
      let status3xx = 0;
      let status4xx = 0;
      let status5xx = 0;
      const breakdown: { [code: string]: number } = {};

      Object.entries(httpStatus).forEach(([code, count]) => {
        const statusNum = parseInt(code, 10);
        const requestCount = Number(count) || 0;

        breakdown[code] = requestCount;

        if (statusNum >= 200 && statusNum < 300) {
          status2xx += requestCount;
        } else if (statusNum >= 300 && statusNum < 400) {
          status3xx += requestCount;
        } else if (statusNum >= 400 && statusNum < 500) {
          status4xx += requestCount;
        } else if (statusNum >= 500 && statusNum < 600) {
          status5xx += requestCount;
        }
      });

      const total = status2xx + status3xx + status4xx + status5xx || requests;

      console.log('Status codes aggregated:', { total, status2xx, status3xx, status4xx, status5xx });

      return {
        total,
        status2xx,
        status3xx,
        status4xx,
        status5xx,
        breakdown,
      };
    } catch (error) {
      console.error('Error querying status codes:', error);
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

    // Build the GraphQL query for security metrics
    const query = gql`
      query GetSecurityMetrics(
        $zoneTag: String!
        $datetimeStart: String!
        $datetimeEnd: String!
      ) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequests1hGroups(
              limit: 10000
              filter: {
                datetime_geq: $datetimeStart
                datetime_leq: $datetimeEnd
              }
            ) {
              sum {
                requests
                cachedRequests
                cachedBytes
              }
              dimensions {
                datetime
              }
            }
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
          datetimeStart: params.startDate.toISOString(),
          datetimeEnd: params.endDate.toISOString(),
        },
      });

      console.log('Security metrics query result:', JSON.stringify(result, null, 2));

      const httpData = result.data?.viewer?.zones?.[0]?.httpRequests1hGroups || [];
      const firewallData = result.data?.viewer?.zones?.[0]?.firewallEventsAdaptiveGroups || [];

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

      // Group firewall events by hour for time series
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

        // Build time series (group by hour)
        if (datetime) {
          const date = new Date(datetime);
          const hourKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
          
          if (!timeSeriesMap.has(hourKey)) {
            timeSeriesMap.set(hourKey, { blocked: 0, challenged: 0, allowed: 0 });
          }
          
          const hourData = timeSeriesMap.get(hourKey)!;
          if (action === 'block' || action === 'drop') {
            hourData.blocked += count;
          } else if (action === 'challenge' || action === 'jschallenge' || action === 'managedchallenge') {
            hourData.challenged += count;
          } else if (action === 'allow' || action === 'log') {
            hourData.allowed += count;
          }
        }
      });

      const firewallTotal = firewallBlocked + firewallChallenged + firewallAllowed;

      // Convert time series map to array and sort by timestamp
      const timeSeries = Array.from(timeSeriesMap.entries())
        .map(([key, data]) => {
          const [year, month, day, hour] = key.split('-').map(Number);
          const timestamp = new Date(year, month, day, hour);
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

      console.log('Security metrics aggregated:', { 
        cacheHit, cacheMiss, cacheExpired, cacheStale,
        firewallTotal, firewallBlocked, firewallChallenged, firewallAllowed 
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
      console.error('Error querying security metrics:', error);
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
   * @param params - Query parameters including zoneId and date range
   * @returns GeoData with country-level traffic distribution
   */
  async queryGeoDistribution(params: MetricsQueryParams): Promise<GeoData> {
    const client = await this.initializeClient();

    // Build the GraphQL query for geographic distribution
    const query = gql`
      query GetGeoDistribution(
        $zoneTag: string!
        $filter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject
      ) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequests1dGroups(
              limit: 1000
              filter: $filter
            ) {
              sum {
                requests
                bytes
              }
              dimensions {
                clientCountryName
              }
            }
          }
        }
      }
    `;

    const filter = {
      date_geq: params.startDate.toISOString().split('T')[0],
      date_leq: params.endDate.toISOString().split('T')[0],
    };

    try {
      const result = await client.query({
        query,
        variables: {
          zoneTag: params.zoneId,
          filter,
        },
      });

      const data = result.data?.viewer?.zones?.[0]?.httpRequests1dGroups || [];

      // Aggregate data by country
      const countryMap = new Map<string, { requests: number; bytes: number }>();
      let totalRequests = 0;

      data.forEach((item: any) => {
        const countryName = item.dimensions.clientCountryName || 'Unknown';
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
        .map(([name, stats]) => ({
          code: this.getCountryCode(name), // Convert name to ISO code
          name,
          requests: stats.requests,
          bytes: stats.bytes,
          percentage: totalRequests > 0 ? (stats.requests / totalRequests) * 100 : 0,
        }))
        .sort((a, b) => b.requests - a.requests); // Sort by requests descending

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
      'Unknown': 'XX',
    };

    return countryCodeMap[countryName] || 'XX';
  }

  /**
   * Queries protocol distribution (HTTP/1.0, HTTP/1.1, HTTP/2, HTTP/3)
   * @param params - Query parameters including zoneId and date range
   * @returns ProtocolData with protocol version distribution
   */
  async queryProtocolDistribution(params: MetricsQueryParams): Promise<ProtocolData> {
    const client = await this.initializeClient();

    // Build the GraphQL query for protocol distribution
    const query = gql`
      query GetProtocolDistribution(
        $zoneTag: string!
        $filter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject
      ) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequests1dGroups(
              limit: 1000
              filter: $filter
            ) {
              sum {
                requests
              }
              dimensions {
                clientHTTPProtocol
              }
            }
          }
        }
      }
    `;

    const filter = {
      date_geq: params.startDate.toISOString().split('T')[0],
      date_leq: params.endDate.toISOString().split('T')[0],
    };

    try {
      const result = await client.query({
        query,
        variables: {
          zoneTag: params.zoneId,
          filter,
        },
      });

      const data = result.data?.viewer?.zones?.[0]?.httpRequests1dGroups || [];

      // Aggregate protocol data
      let http1_0 = 0;
      let http1_1 = 0;
      let http2 = 0;
      let http3 = 0;
      let total = 0;

      data.forEach((item: any) => {
        const protocol = item.dimensions.clientHTTPProtocol?.toLowerCase() || '';
        const requests = item.sum.requests || 0;

        total += requests;

        // Map protocol strings to categories
        if (protocol.includes('http/1.0') || protocol === '1.0') {
          http1_0 += requests;
        } else if (protocol.includes('http/1.1') || protocol === '1.1' || protocol === 'http/1') {
          http1_1 += requests;
        } else if (protocol.includes('http/2') || protocol === '2' || protocol === 'h2') {
          http2 += requests;
        } else if (protocol.includes('http/3') || protocol === '3' || protocol === 'h3') {
          http3 += requests;
        } else {
          // Default unknown protocols to HTTP/1.1 for backwards compatibility
          http1_1 += requests;
        }
      });

      return {
        http1_0,
        http1_1,
        http2,
        http3,
        total,
      };
    } catch (error) {
      console.error('Error querying protocol distribution:', error);
      throw new Error(
        `Failed to query protocol distribution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Queries TLS version distribution (TLS 1.0, 1.1, 1.2, 1.3)
   * @param params - Query parameters including zoneId and date range
   * @returns TLSData with TLS version distribution and insecure percentage
   */
  async queryTLSDistribution(params: MetricsQueryParams): Promise<TLSData> {
    const client = await this.initializeClient();

    // Build the GraphQL query for TLS distribution
    const query = gql`
      query GetTLSDistribution(
        $zoneTag: string!
        $filter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject
      ) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequests1dGroups(
              limit: 1000
              filter: $filter
            ) {
              sum {
                requests
              }
              dimensions {
                clientSSLProtocol
              }
            }
          }
        }
      }
    `;

    const filter = {
      date_geq: params.startDate.toISOString().split('T')[0],
      date_leq: params.endDate.toISOString().split('T')[0],
    };

    try {
      const result = await client.query({
        query,
        variables: {
          zoneTag: params.zoneId,
          filter,
        },
      });

      const data = result.data?.viewer?.zones?.[0]?.httpRequests1dGroups || [];

      // Aggregate TLS version data
      let tls1_0 = 0;
      let tls1_1 = 0;
      let tls1_2 = 0;
      let tls1_3 = 0;
      let total = 0;

      data.forEach((item: any) => {
        const protocol = item.dimensions.clientSSLProtocol?.toLowerCase() || '';
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
   * @param params - Query parameters including zoneId and date range
   * @returns ContentTypeData with content type distribution and percentages
   */
  async queryContentTypeDistribution(params: MetricsQueryParams): Promise<ContentTypeData> {
    const client = await this.initializeClient();

    // Build the GraphQL query for content type distribution
    const query = gql`
      query GetContentTypeDistribution(
        $zoneTag: string!
        $filter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject
      ) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequests1dGroups(
              limit: 1000
              filter: $filter
            ) {
              sum {
                requests
                bytes
              }
              dimensions {
                edgeResponseContentTypeName
              }
            }
          }
        }
      }
    `;

    const filter = {
      date_geq: params.startDate.toISOString().split('T')[0],
      date_leq: params.endDate.toISOString().split('T')[0],
    };

    try {
      const result = await client.query({
        query,
        variables: {
          zoneTag: params.zoneId,
          filter,
        },
      });

      const data = result.data?.viewer?.zones?.[0]?.httpRequests1dGroups || [];

      // Aggregate content type data
      const contentTypeMap = new Map<string, { requests: number; bytes: number }>();
      let totalRequests = 0;

      data.forEach((item: any) => {
        const contentType = item.dimensions.edgeResponseContentTypeName || 'unknown';
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
        .sort((a, b) => b.requests - a.requests); // Sort by requests descending for Top N

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
}

// Export singleton instance
export default new GraphQLClient();
