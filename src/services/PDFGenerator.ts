/**
 * PDFGenerator Service
 * Handles HTML template generation for PDF exports
 */

import { TimeRangeModel } from '../types/common';
import { TrafficMetrics, SecurityMetrics } from '../types/metrics';

export interface ZoneInfo {
  id: string;
  name: string;
  status?: string;
}

export interface PDFGeneratorOptions {
  data: AnalyticsData;
  zoneInfo: ZoneInfo;
  timeRange: TimeRangeModel | { startDate: Date; endDate: Date };
  exportType: string;
  theme: ThemeColors;
}

export interface AnalyticsData {
  traffic?: TrafficMetrics;
  security?: SecurityMetrics;
  statusCodes?: any;
  geo?: any;
  protocol?: any;
  tls?: any;
  contentType?: any;
  bot?: any;
  firewall?: any;
}

export interface ThemeColors {
  primary: string;
  background: string;
  text: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  chartColors?: string[];
  chartBackground?: string;
  chartGrid?: string;
  chartLabel?: string;
}

export interface ChartConfig {
  type: 'pie' | 'line' | 'bar';
  data: any[];
  title: string;
  colors?: string[];
  width?: number;
  height?: number;
}

export interface DistributionData {
  label: string;
  value: number;
  percentage?: number;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
}

export class PDFGenerator {
  // Maximum number of items to display in distribution sections
  private readonly MAX_DISTRIBUTION_ITEMS = 50;
  
  // Maximum number of data points in time series charts
  private readonly MAX_TIMESERIES_POINTS = 100;

  // Cache for formatted values to avoid repeated calculations
  private formatCache: Map<string, string> = new Map();

  // Cache for generated chart SVGs
  private chartCache: Map<string, string> = new Map();

  /**
   * Clear all caches (useful for testing or memory management)
   */
  clearCache(): void {
    this.formatCache.clear();
    this.chartCache.clear();
  }

  /**
   * Generate complete HTML document for PDF export
   */
  generateHTML(options: PDFGeneratorOptions): string {
    // Clear caches for fresh generation
    this.clearCache();
    
    const { zoneInfo, timeRange, data, theme, exportType } = options;

    const styles = this.generateStyles(theme);
    const header = this.buildHeaderSection(zoneInfo, timeRange);
    const footer = this.buildFooterSection();

    let body = '';

    // Add traffic section if available
    if (data.traffic) {
      body += this.buildTrafficSection(data.traffic);
    }

    // Add security section if available
    if (data.security) {
      body += this.buildSecuritySection(data.security);
    }

    // Add status code distribution if available
    if (data.statusCodes && Array.isArray(data.statusCodes)) {
      body += this.buildStatusCodeSection(data.statusCodes, theme);
    }

    // Add geographic distribution if available
    if (data.geo && Array.isArray(data.geo)) {
      body += this.buildGeoDistributionSection(data.geo, theme);
    }

    // Add protocol distribution if available
    if (data.protocol && Array.isArray(data.protocol)) {
      body += this.buildProtocolDistributionSection(data.protocol, theme);
    }

    // Add TLS distribution if available
    if (data.tls && Array.isArray(data.tls)) {
      body += this.buildTLSDistributionSection(data.tls, theme);
    }

    // Add content type distribution if available
    if (data.contentType && Array.isArray(data.contentType)) {
      body += this.buildContentTypeSection(data.contentType, theme);
    }

    // Add bot analysis if available
    if (data.bot) {
      body += this.buildBotAnalysisSection(data.bot, theme);
    }

    // Add firewall analysis if available
    if (data.firewall) {
      body += this.buildFirewallAnalysisSection(data.firewall, theme);
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cloudflare Analytics - ${zoneInfo.name}</title>
  <style>
    ${styles}
  </style>
</head>
<body>
  ${header}
  <div class="content">
    ${body}
  </div>
  ${footer}
</body>
</html>
    `.trim();
  }

  /**
   * Generate CSS styles for consistent formatting
   */
  private generateStyles(theme: ThemeColors): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: ${theme.text};
        background: ${theme.background};
      }

      .header {
        background: ${theme.primary};
        color: white;
        padding: 30px 20px;
        margin-bottom: 30px;
      }

      .header h1 {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 10px;
      }

      .header .zone-info {
        font-size: 14px;
        opacity: 0.9;
        margin-bottom: 5px;
      }

      .header .time-range {
        font-size: 14px;
        opacity: 0.9;
      }

      .content {
        padding: 0 20px 20px;
      }

      .section {
        margin-bottom: 30px;
        page-break-inside: avoid;
      }

      .section h2 {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 15px;
        color: ${theme.text};
        border-bottom: 2px solid ${theme.border};
        padding-bottom: 8px;
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin-bottom: 20px;
      }

      .metric-card {
        background: white;
        border: 1px solid ${theme.border};
        border-radius: 8px;
        padding: 15px;
      }

      .metric-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 5px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .metric-value {
        font-size: 24px;
        font-weight: 600;
        color: ${theme.text};
      }

      .metric-unit {
        font-size: 14px;
        color: #666;
        margin-left: 4px;
      }

      .footer {
        margin-top: 40px;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #666;
        border-top: 1px solid ${theme.border};
      }

      .chart-container {
        margin: 20px 0;
        page-break-inside: avoid;
      }

      .chart-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 15px;
        color: ${theme.text};
      }

      .chart-legend {
        margin-top: 15px;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        font-size: 12px;
        gap: 8px;
      }

      .legend-color {
        width: 16px;
        height: 16px;
        border-radius: 3px;
        flex-shrink: 0;
      }

      .legend-label {
        flex: 1;
        color: ${theme.text};
      }

      .legend-value {
        font-weight: 600;
        color: ${theme.text};
      }

      @media print {
        .section {
          page-break-inside: avoid;
        }
      }
    `;
  }

  /**
   * Build header section with zone info and time range
   */
  buildHeaderSection(zoneInfo: ZoneInfo, timeRange: TimeRangeModel | { startDate: Date; endDate: Date }): string {
    // Handle both TimeRangeModel instances and plain objects
    let formattedTimeRange: string;
    if ('format' in timeRange && typeof timeRange.format === 'function') {
      formattedTimeRange = timeRange.format();
    } else {
      // Format manually for plain objects
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };
      const startFormatted = timeRange.startDate.toLocaleDateString('en-US', options);
      const endFormatted = timeRange.endDate.toLocaleDateString('en-US', options);
      formattedTimeRange = `${startFormatted} - ${endFormatted}`;
    }

    const generatedAt = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
      <div class="header">
        <h1>Cloudflare Analytics Report</h1>
        <div class="zone-info">Zone: ${zoneInfo.name} (${zoneInfo.id})</div>
        <div class="time-range">Period: ${formattedTimeRange}</div>
        <div class="time-range">Generated: ${generatedAt}</div>
      </div>
    `;
  }

  /**
   * Build footer section with page numbers
   */
  buildFooterSection(): string {
    return `
      <div class="footer">
        <p>Cloudflare Analytics Report</p>
        <p>Page <span class="page-number"></span></p>
      </div>
    `;
  }

  /**
   * Build traffic metrics section
   */
  buildTrafficSection(traffic: TrafficMetrics): string {
    const metrics = [
      {
        label: 'Total Requests',
        value: this.formatNumber(traffic.requests),
        unit: '',
      },
      {
        label: 'Data Transfer',
        value: this.formatBytes(traffic.bytes),
        unit: '',
      },
      {
        label: 'Bandwidth',
        value: this.formatBandwidth(traffic.bandwidth),
        unit: '',
      },
      {
        label: 'Page Views',
        value: this.formatNumber(traffic.pageViews),
        unit: '',
      },
    ];

    return `
      <div class="section">
        <h2>Traffic Metrics</h2>
        ${this.buildMetricsGrid(metrics)}
      </div>
    `;
  }

  /**
   * Build security metrics section
   */
  buildSecuritySection(security: SecurityMetrics): string {
    const metrics = [
      {
        label: 'Total Firewall Events',
        value: this.formatNumber(security.firewallEvents.total),
        unit: '',
      },
      {
        label: 'Blocked Requests',
        value: this.formatNumber(security.firewallEvents.blocked),
        unit: '',
      },
      {
        label: 'Challenged Requests',
        value: this.formatNumber(security.firewallEvents.challenged),
        unit: '',
      },
      {
        label: 'Cache Hit Rate',
        value: this.formatPercentage(
          security.cacheStatus.hit /
            (security.cacheStatus.hit + security.cacheStatus.miss || 1)
        ),
        unit: '',
      },
    ];

    return `
      <div class="section">
        <h2>Security Metrics</h2>
        ${this.buildMetricsGrid(metrics)}
      </div>
    `;
  }

  /**
   * Build a generic distribution section with chart
   */
  buildDistributionSection(
    title: string,
    data: DistributionData[],
    chartType: 'pie' | 'line',
    theme: ThemeColors
  ): string {
    if (!data || data.length === 0) {
      return `
        <div class="section">
          <h2>${title}</h2>
          <p>No data available</p>
        </div>
      `;
    }

    // Paginate data if needed
    const paginationResult = chartType === 'pie' 
      ? this.paginateDistributionData(data)
      : this.paginateTimeSeriesData(data as any);

    const chartConfig: ChartConfig = {
      type: chartType,
      data: paginationResult.data,
      title: title,
    };

    const chart = chartType === 'pie' 
      ? this.renderPieChart(chartConfig, theme)
      : this.renderLineChart(chartConfig, theme);

    // Add truncation note if data was truncated
    const truncationNote = paginationResult.truncated
      ? this.generateTruncationNote(paginationResult.originalCount, paginationResult.data.length)
      : '';

    return `
      <div class="section">
        <h2>${title}</h2>
        ${chart}
        ${truncationNote}
      </div>
    `;
  }

  /**
   * Build status code distribution section
   */
  buildStatusCodeSection(data: any[], theme: ThemeColors): string {
    const distributionData: DistributionData[] = data.map((item) => ({
      label: `${item.statusCode || item.code || 'Unknown'}`,
      value: item.count || item.requests || 0,
    }));

    return this.buildDistributionSection(
      'Status Code Distribution',
      distributionData,
      'pie',
      theme
    );
  }

  /**
   * Build geographic distribution section
   */
  buildGeoDistributionSection(data: any[], theme: ThemeColors): string {
    const distributionData: DistributionData[] = data.map((item) => ({
      label: item.country || item.countryName || item.clientCountryName || 'Unknown',
      value: item.requests || item.count || 0,
    }));

    return this.buildDistributionSection(
      'Geographic Distribution',
      distributionData,
      'pie',
      theme
    );
  }

  /**
   * Build protocol distribution section
   */
  buildProtocolDistributionSection(data: any[], theme: ThemeColors): string {
    const distributionData: DistributionData[] = data.map((item) => ({
      label: item.protocol || item.clientRequestHTTPProtocol || 'Unknown',
      value: item.requests || item.count || 0,
    }));

    return this.buildDistributionSection(
      'Protocol Distribution',
      distributionData,
      'pie',
      theme
    );
  }

  /**
   * Build TLS version distribution section
   */
  buildTLSDistributionSection(data: any[], theme: ThemeColors): string {
    const distributionData: DistributionData[] = data.map((item) => ({
      label: item.tlsVersion || item.clientSSLProtocol || 'Unknown',
      value: item.requests || item.count || 0,
    }));

    return this.buildDistributionSection(
      'TLS Version Distribution',
      distributionData,
      'pie',
      theme
    );
  }

  /**
   * Build content type distribution section
   */
  buildContentTypeSection(data: any[], theme: ThemeColors): string {
    const distributionData: DistributionData[] = data.map((item) => ({
      label: item.contentType || item.edgeResponseContentType || 'Unknown',
      value: item.requests || item.count || 0,
    }));

    return this.buildDistributionSection(
      'Content Type Distribution',
      distributionData,
      'pie',
      theme
    );
  }

  /**
   * Build bot analysis section
   */
  buildBotAnalysisSection(data: any, theme: ThemeColors): string {
    if (!data) {
      return `
        <div class="section">
          <h2>Bot Analysis</h2>
          <p>No data available</p>
        </div>
      `;
    }

    const metrics = [
      {
        label: 'Total Bot Requests',
        value: this.formatNumber(data.totalBotRequests || 0),
        unit: '',
      },
      {
        label: 'Verified Bots',
        value: this.formatNumber(data.verifiedBots || 0),
        unit: '',
      },
      {
        label: 'Suspicious Bots',
        value: this.formatNumber(data.suspiciousBots || 0),
        unit: '',
      },
      {
        label: 'Bot Traffic Percentage',
        value: this.formatPercentage(data.botPercentage || 0),
        unit: '',
      },
    ];

    let chartHtml = '';
    let truncationNote = '';
    
    if (data.distribution && Array.isArray(data.distribution)) {
      const distributionData: DistributionData[] = data.distribution.map((item: any) => ({
        label: item.botScore || item.score || 'Unknown',
        value: item.requests || item.count || 0,
      }));

      // Paginate data if needed
      const paginationResult = this.paginateDistributionData(distributionData);

      const chartConfig: ChartConfig = {
        type: 'pie',
        data: paginationResult.data,
        title: 'Bot Score Distribution',
      };

      chartHtml = this.renderPieChart(chartConfig, theme);
      
      // Add truncation note if data was truncated
      if (paginationResult.truncated) {
        truncationNote = this.generateTruncationNote(
          paginationResult.originalCount,
          paginationResult.data.length
        );
      }
    }

    return `
      <div class="section">
        <h2>Bot Analysis</h2>
        ${this.buildMetricsGrid(metrics)}
        ${chartHtml}
        ${truncationNote}
      </div>
    `;
  }

  /**
   * Build firewall analysis section
   */
  buildFirewallAnalysisSection(data: any, theme: ThemeColors): string {
    if (!data) {
      return `
        <div class="section">
          <h2>Firewall Analysis</h2>
          <p>No data available</p>
        </div>
      `;
    }

    const metrics = [
      {
        label: 'Total Firewall Events',
        value: this.formatNumber(data.totalEvents || 0),
        unit: '',
      },
      {
        label: 'Blocked Requests',
        value: this.formatNumber(data.blocked || 0),
        unit: '',
      },
      {
        label: 'Challenged Requests',
        value: this.formatNumber(data.challenged || 0),
        unit: '',
      },
      {
        label: 'Allowed Requests',
        value: this.formatNumber(data.allowed || 0),
        unit: '',
      },
    ];

    let chartHtml = '';
    let truncationNote = '';
    
    if (data.distribution && Array.isArray(data.distribution)) {
      const distributionData: DistributionData[] = data.distribution.map((item: any) => ({
        label: item.action || item.firewallAction || 'Unknown',
        value: item.requests || item.count || 0,
      }));

      // Paginate data if needed
      const paginationResult = this.paginateDistributionData(distributionData);

      const chartConfig: ChartConfig = {
        type: 'pie',
        data: paginationResult.data,
        title: 'Firewall Action Distribution',
      };

      chartHtml = this.renderPieChart(chartConfig, theme);
      
      // Add truncation note if data was truncated
      if (paginationResult.truncated) {
        truncationNote = this.generateTruncationNote(
          paginationResult.originalCount,
          paginationResult.data.length
        );
      }
    }

    return `
      <div class="section">
        <h2>Firewall Analysis</h2>
        ${this.buildMetricsGrid(metrics)}
        ${chartHtml}
        ${truncationNote}
      </div>
    `;
  }

  /**
   * Build metrics grid helper for metric display
   */
  buildMetricsGrid(
    metrics: Array<{ label: string; value: string; unit: string }>
  ): string {
    const cards = metrics
      .map(
        (metric) => `
      <div class="metric-card">
        <div class="metric-label">${metric.label}</div>
        <div class="metric-value">
          ${metric.value}
          ${metric.unit ? `<span class="metric-unit">${metric.unit}</span>` : ''}
        </div>
      </div>
    `
      )
      .join('');

    return `<div class="metrics-grid">${cards}</div>`;
  }

  /**
   * Format numbers with appropriate units and precision
   * Uses caching to avoid repeated calculations
   */
  private formatNumber(value: number): string {
    const cacheKey = `num:${value}`;
    const cached = this.formatCache.get(cacheKey);
    if (cached) return cached;

    let result: string;
    if (value >= 1000000000) {
      result = (value / 1000000000).toFixed(2) + 'B';
    } else if (value >= 1000000) {
      result = (value / 1000000).toFixed(2) + 'M';
    } else if (value >= 1000) {
      result = (value / 1000).toFixed(2) + 'K';
    } else {
      result = value.toFixed(0);
    }

    this.formatCache.set(cacheKey, result);
    return result;
  }

  /**
   * Format bytes with appropriate units
   * Uses caching to avoid repeated calculations
   */
  private formatBytes(bytes: number): string {
    const cacheKey = `bytes:${bytes}`;
    const cached = this.formatCache.get(cacheKey);
    if (cached) return cached;

    let result: string;
    if (bytes >= 1099511627776) {
      result = (bytes / 1099511627776).toFixed(2) + ' TB';
    } else if (bytes >= 1073741824) {
      result = (bytes / 1073741824).toFixed(2) + ' GB';
    } else if (bytes >= 1048576) {
      result = (bytes / 1048576).toFixed(2) + ' MB';
    } else if (bytes >= 1024) {
      result = (bytes / 1024).toFixed(2) + ' KB';
    } else {
      result = bytes.toFixed(0) + ' B';
    }

    this.formatCache.set(cacheKey, result);
    return result;
  }

  /**
   * Format bandwidth with appropriate units
   * Uses caching to avoid repeated calculations
   */
  private formatBandwidth(bandwidth: number): string {
    const cacheKey = `bw:${bandwidth}`;
    const cached = this.formatCache.get(cacheKey);
    if (cached) return cached;

    let result: string;
    if (bandwidth >= 1000) {
      result = (bandwidth / 1000).toFixed(2) + ' Gbps';
    } else {
      result = bandwidth.toFixed(2) + ' Mbps';
    }

    this.formatCache.set(cacheKey, result);
    return result;
  }

  /**
   * Format percentage with 2 decimal places
   */
  private formatPercentage(value: number): string {
    return (value * 100).toFixed(2) + '%';
  }

  /**
   * Paginate distribution data to prevent memory issues
   * Limits data to MAX_DISTRIBUTION_ITEMS and adds truncation note
   * 
   * @param data - The distribution data array
   * @returns Paginated data and truncation info
   */
  private paginateDistributionData(data: DistributionData[]): {
    data: DistributionData[];
    truncated: boolean;
    originalCount: number;
  } {
    if (!data || data.length <= this.MAX_DISTRIBUTION_ITEMS) {
      return {
        data: data || [],
        truncated: false,
        originalCount: data?.length || 0,
      };
    }

    // Sort by value descending to keep top items
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    
    return {
      data: sortedData.slice(0, this.MAX_DISTRIBUTION_ITEMS),
      truncated: true,
      originalCount: data.length,
    };
  }

  /**
   * Paginate time series data to prevent memory issues
   * Limits data to MAX_TIMESERIES_POINTS by sampling
   * 
   * @param data - The time series data array
   * @returns Paginated data and truncation info
   */
  private paginateTimeSeriesData(data: TimeSeriesData[]): {
    data: TimeSeriesData[];
    truncated: boolean;
    originalCount: number;
  } {
    if (!data || data.length <= this.MAX_TIMESERIES_POINTS) {
      return {
        data: data || [],
        truncated: false,
        originalCount: data?.length || 0,
      };
    }

    // Sample data evenly across the range
    const step = Math.ceil(data.length / this.MAX_TIMESERIES_POINTS);
    const sampledData: TimeSeriesData[] = [];
    
    for (let i = 0; i < data.length; i += step) {
      sampledData.push(data[i]);
    }

    return {
      data: sampledData,
      truncated: true,
      originalCount: data.length,
    };
  }

  /**
   * Generate truncation note HTML
   * 
   * @param originalCount - Original number of items
   * @param displayedCount - Number of items displayed
   * @returns HTML for truncation note
   */
  private generateTruncationNote(originalCount: number, displayedCount: number): string {
    return `
      <div style="margin-top: 15px; padding: 10px; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px;">
        <p style="margin: 0; font-size: 12px; color: #856404;">
          <strong>Note:</strong> Showing top ${displayedCount} of ${originalCount} items. 
          Data has been truncated for optimal PDF performance.
        </p>
      </div>
    `;
  }

  /**
   * Render a pie chart as SVG
   * Uses caching to avoid regenerating identical charts
   */
  renderPieChart(config: ChartConfig, theme: ThemeColors): string {
    // Create cache key from config
    const cacheKey = `pie:${JSON.stringify(config.data)}:${config.width}:${config.height}`;
    const cached = this.chartCache.get(cacheKey);
    if (cached) return cached;

    const { data, title, width = 400, height = 400 } = config;
    const colors = config.colors || theme.chartColors || [
      '#2280b0', '#f6821f', '#2ecc71', '#e74c3c', '#9b59b6', '#3498db'
    ];

    // Calculate total for percentages
    const total = data.reduce((sum: number, item: DistributionData) => sum + item.value, 0);
    
    if (total === 0) {
      const result = `<div class="chart-container"><p>No data available</p></div>`;
      this.chartCache.set(cacheKey, result);
      return result;
    }

    // Calculate pie slices
    let currentAngle = -90; // Start at top
    const slices: string[] = [];
    const legendItems: Array<{ color: string; label: string; value: string }> = [];

    data.forEach((item: DistributionData, index: number) => {
      const percentage = (item.value / total) * 100;
      const sliceAngle = (item.value / total) * 360;
      const color = colors[index % colors.length];

      // Calculate slice path
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - 20;
      
      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);
      
      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      slices.push(`<path d="${pathData}" fill="${color}" stroke="white" stroke-width="2"/>`);
      
      legendItems.push({
        color,
        label: item.label,
        value: `${this.formatNumber(item.value)} (${percentage.toFixed(1)}%)`
      });

      currentAngle = endAngle;
    });

    const legend = this.renderChartLegend(legendItems);

    const result = `
      <div class="chart-container">
        <h3 class="chart-title">${title}</h3>
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
          ${slices.join('\n')}
        </svg>
        ${legend}
      </div>
    `;

    this.chartCache.set(cacheKey, result);
    return result;
  }

  /**
   * Render a line chart as SVG
   * Uses caching to avoid regenerating identical charts
   */
  renderLineChart(config: ChartConfig, theme: ThemeColors): string {
    // Create cache key from config
    const cacheKey = `line:${JSON.stringify(config.data)}:${config.width}:${config.height}`;
    const cached = this.chartCache.get(cacheKey);
    if (cached) return cached;

    const { data, title, width = 600, height = 300 } = config;
    const colors = config.colors || theme.chartColors || [
      '#2280b0', '#f6821f', '#2ecc71', '#e74c3c', '#9b59b6', '#3498db'
    ];

    if (!data || data.length === 0) {
      const result = `<div class="chart-container"><p>No data available</p></div>`;
      this.chartCache.set(cacheKey, result);
      return result;
    }

    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find min and max values
    const values = data.map((item: TimeSeriesData) => item.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values, 0);
    const valueRange = maxValue - minValue || 1;

    // Generate grid lines
    const gridLines: string[] = [];
    const numGridLines = 5;
    for (let i = 0; i <= numGridLines; i++) {
      const y = padding.top + (chartHeight * i) / numGridLines;
      const value = maxValue - (valueRange * i) / numGridLines;
      gridLines.push(`
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" 
              stroke="${theme.chartGrid || '#e3e3e3'}" stroke-width="1" stroke-dasharray="2,2"/>
        <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" 
              font-size="10" fill="${theme.chartLabel || theme.text}">
          ${this.formatNumber(value)}
        </text>
      `);
    }

    // Generate line path
    const points: string[] = [];
    data.forEach((item: TimeSeriesData, index: number) => {
      const x = padding.left + (chartWidth * index) / (data.length - 1 || 1);
      const y = padding.top + chartHeight - ((item.value - minValue) / valueRange) * chartHeight;
      points.push(`${x},${y}`);
    });

    const linePath = `M ${points.join(' L ')}`;
    const color = colors[0];

    // Generate x-axis labels (show every nth label to avoid crowding)
    const labelInterval = Math.ceil(data.length / 8);
    const xLabels = data
      .filter((_: any, index: number) => index % labelInterval === 0)
      .map((item: TimeSeriesData, index: number) => {
        const actualIndex = index * labelInterval;
        const x = padding.left + (chartWidth * actualIndex) / (data.length - 1 || 1);
        const label = item.label || item.timestamp;
        return `
          <text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle" 
                font-size="10" fill="${theme.chartLabel || theme.text}">
            ${label}
          </text>
        `;
      })
      .join('');

    const result = `
      <div class="chart-container">
        <h3 class="chart-title">${title}</h3>
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
          <!-- Grid lines -->
          ${gridLines.join('\n')}
          
          <!-- Line -->
          <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2"/>
          
          <!-- Data points -->
          ${points.map(point => {
            const [x, y] = point.split(',');
            return `<circle cx="${x}" cy="${y}" r="3" fill="${color}"/>`;
          }).join('\n')}
          
          <!-- X-axis labels -->
          ${xLabels}
          
          <!-- Axes -->
          <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" 
                stroke="${theme.text}" stroke-width="2"/>
          <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" 
                stroke="${theme.text}" stroke-width="2"/>
        </svg>
      </div>
    `;
    
    this.chartCache.set(cacheKey, result);
    return result;
  }

  /**
   * Render chart legend
   */
  renderChartLegend(items: Array<{ color: string; label: string; value: string }>): string {
    const legendItems = items
      .map(
        (item) => `
        <div class="legend-item">
          <span class="legend-color" style="background-color: ${item.color}"></span>
          <span class="legend-label">${item.label}</span>
          <span class="legend-value">${item.value}</span>
        </div>
      `
      )
      .join('');

    return `
      <div class="chart-legend">
        ${legendItems}
      </div>
    `;
  }

  /**
   * Render HTML to PDF file
   * Integrates with react-native-html-to-pdf library
   * 
   * @param html - The HTML content to convert to PDF
   * @param fileName - The filename for the PDF (without path)
   * @param directory - The directory to save to (defaults to platform-specific)
   * @returns Promise resolving to the file path on success
   */
  async renderPDF(
    html: string,
    fileName: string,
    directory?: 'Documents' | 'Downloads'
  ): Promise<string> {
    try {
      // Import react-native-html-to-pdf dynamically
      const RNHTMLtoPDF = require('react-native-html-to-pdf').default;

      // Configure PDF options
      const options = {
        html: html,
        fileName: fileName.replace('.pdf', ''), // Library adds .pdf automatically
        directory: directory || 'Documents',
        base64: false,
        width: 612, // Letter size width in points (8.5 inches)
        height: 792, // Letter size height in points (11 inches)
        padding: 0, // Padding handled in HTML/CSS
        bgColor: '#FFFFFF',
      };

      // Convert HTML to PDF
      const result = await RNHTMLtoPDF.convert(options);

      if (!result || !result.filePath) {
        throw new Error('PDF generation failed: No file path returned');
      }

      return result.filePath;
    } catch (error) {
      console.error('Error rendering PDF:', error);
      throw new Error(
        `Failed to render PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
