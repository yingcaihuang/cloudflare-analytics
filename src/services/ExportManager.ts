/**
 * ExportManager Service
 * Handles data export functionality including CSV generation and file sharing
 */

import { Share, Platform } from 'react-native';
import { Paths, File } from 'expo-file-system';
import type {
  TrafficMetrics,
  StatusCodeData,
  SecurityMetrics,
  GeoData,
  ProtocolData,
  TLSData,
  ContentTypeData,
} from '../types/metrics';
import type { Zone } from '../types/common';

export interface ExportMetadata {
  zoneName: string;
  zoneId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  exportedAt: Date;
}

export interface ExportOptions {
  includeMetadata?: boolean;
  filename?: string;
}

class ExportManager {
  /**
   * Convert data to CSV format
   */
  private dataToCSV(headers: string[], rows: (string | number)[][]): string {
    const escapeCsvValue = (value: string | number): string => {
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (
        stringValue.includes(',') ||
        stringValue.includes('"') ||
        stringValue.includes('\n')
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const headerRow = headers.map(escapeCsvValue).join(',');
    const dataRows = rows.map((row) => row.map(escapeCsvValue).join(','));

    return [headerRow, ...dataRows].join('\n');
  }

  /**
   * Add metadata header to CSV content
   */
  private addMetadataHeader(content: string, metadata: ExportMetadata): string {
    const metadataLines = [
      `# Cloudflare Analytics Export`,
      `# Zone: ${metadata.zoneName} (${metadata.zoneId})`,
      `# Time Range: ${metadata.timeRange.start.toISOString()} to ${metadata.timeRange.end.toISOString()}`,
      `# Exported At: ${metadata.exportedAt.toISOString()}`,
      ``,
    ];

    return metadataLines.join('\n') + content;
  }

  /**
   * Export traffic metrics to CSV
   */
  async exportTrafficMetrics(
    data: TrafficMetrics,
    zone: Zone,
    options: ExportOptions = {}
  ): Promise<string> {
    const headers = ['Metric', 'Value'];
    const rows: (string | number)[][] = [
      ['Requests', data.requests],
      ['Bytes', data.bytes],
      ['Bandwidth (bytes/sec)', data.bandwidth],
      ['Page Views', data.pageViews],
      ['Visits', data.visits],
    ];

    // Add time series data if available
    if (data.timeSeries && data.timeSeries.length > 0) {
      rows.push(['', '']); // Empty row separator
      rows.push(['Time Series Data', '']);
      rows.push(['Timestamp', 'Requests', 'Bytes', 'Bandwidth']);

      data.timeSeries.forEach((point) => {
        rows.push([
          point.timestamp.toISOString(),
          point.requests,
          point.bytes,
          point.bandwidth,
        ]);
      });
    }

    let csvContent = this.dataToCSV(headers, rows);

    if (options.includeMetadata !== false) {
      const metadata: ExportMetadata = {
        zoneName: zone.name,
        zoneId: zone.id,
        timeRange: data.timeRange,
        exportedAt: new Date(),
      };
      csvContent = this.addMetadataHeader(csvContent, metadata);
    }

    const filename = options.filename || `traffic-metrics-${Date.now()}.csv`;
    return await this.saveAndShareFile(csvContent, filename);
  }

  /**
   * Export status code data to CSV
   */
  async exportStatusCodes(
    data: StatusCodeData,
    zone: Zone,
    timeRange: { start: Date; end: Date },
    options: ExportOptions = {}
  ): Promise<string> {
    const headers = ['Status Code Category', 'Count', 'Percentage'];
    const rows: (string | number)[][] = [
      ['2xx (Success)', data.status2xx, ((data.status2xx / data.total) * 100).toFixed(2) + '%'],
      ['3xx (Redirect)', data.status3xx, ((data.status3xx / data.total) * 100).toFixed(2) + '%'],
      ['4xx (Client Error)', data.status4xx, ((data.status4xx / data.total) * 100).toFixed(2) + '%'],
      ['5xx (Server Error)', data.status5xx, ((data.status5xx / data.total) * 100).toFixed(2) + '%'],
      ['Total', data.total, '100%'],
    ];

    // Add detailed breakdown
    if (Object.keys(data.breakdown).length > 0) {
      rows.push(['', '', '']); // Empty row separator
      rows.push(['Detailed Breakdown', '', '']);
      rows.push(['Status Code', 'Count', 'Percentage']);

      Object.entries(data.breakdown)
        .sort(([a], [b]) => Number(a) - Number(b))
        .forEach(([code, count]) => {
          rows.push([
            code,
            count,
            ((count / data.total) * 100).toFixed(2) + '%',
          ]);
        });
    }

    let csvContent = this.dataToCSV(headers, rows);

    if (options.includeMetadata !== false) {
      const metadata: ExportMetadata = {
        zoneName: zone.name,
        zoneId: zone.id,
        timeRange,
        exportedAt: new Date(),
      };
      csvContent = this.addMetadataHeader(csvContent, metadata);
    }

    const filename = options.filename || `status-codes-${Date.now()}.csv`;
    return await this.saveAndShareFile(csvContent, filename);
  }

  /**
   * Export security metrics to CSV
   */
  async exportSecurityMetrics(
    data: SecurityMetrics,
    zone: Zone,
    timeRange: { start: Date; end: Date },
    options: ExportOptions = {}
  ): Promise<string> {
    const headers = ['Metric', 'Value'];
    const rows: (string | number)[][] = [
      ['Cache Metrics', ''],
      ['Cache Hit', data.cacheStatus.hit],
      ['Cache Miss', data.cacheStatus.miss],
      ['Cache Expired', data.cacheStatus.expired],
      ['Cache Stale', data.cacheStatus.stale],
      ['', ''],
      ['Firewall Events', ''],
      ['Total Events', data.firewallEvents.total],
      ['Blocked', data.firewallEvents.blocked],
      ['Challenged', data.firewallEvents.challenged],
      ['Allowed', data.firewallEvents.allowed],
      ['', ''],
      ['Bot Score', ''],
      ['Average', data.botScore.average.toFixed(2)],
      ['', ''],
      ['Threat Score', ''],
      ['Average', data.threatScore.average.toFixed(2)],
      ['High (>80)', data.threatScore.high],
      ['Medium (40-80)', data.threatScore.medium],
      ['Low (<40)', data.threatScore.low],
    ];

    // Add bot score distribution
    if (data.botScore.distribution.length > 0) {
      rows.push(['', '']);
      rows.push(['Bot Score Distribution', '']);
      rows.push(['Range', 'Count']);
      data.botScore.distribution.forEach((dist) => {
        rows.push([dist.range, dist.count]);
      });
    }

    // Add time series data if available
    if (data.timeSeries && data.timeSeries.length > 0) {
      rows.push(['', '']);
      rows.push(['Security Events Time Series', '']);
      rows.push(['Timestamp', 'Blocked', 'Challenged', 'Allowed', 'Total']);

      data.timeSeries.forEach((point) => {
        rows.push([
          point.timestamp.toISOString(),
          point.blocked,
          point.challenged,
          point.allowed,
          point.total,
        ]);
      });
    }

    let csvContent = this.dataToCSV(headers, rows);

    if (options.includeMetadata !== false) {
      const metadata: ExportMetadata = {
        zoneName: zone.name,
        zoneId: zone.id,
        timeRange,
        exportedAt: new Date(),
      };
      csvContent = this.addMetadataHeader(csvContent, metadata);
    }

    const filename = options.filename || `security-metrics-${Date.now()}.csv`;
    return await this.saveAndShareFile(csvContent, filename);
  }

  /**
   * Export geographic distribution to CSV
   */
  async exportGeoDistribution(
    data: GeoData,
    zone: Zone,
    timeRange: { start: Date; end: Date },
    options: ExportOptions = {}
  ): Promise<string> {
    const headers = ['Country Code', 'Country Name', 'Requests', 'Bytes', 'Percentage'];
    const rows: (string | number)[][] = data.countries.map((country) => [
      country.code,
      country.name,
      country.requests,
      country.bytes,
      country.percentage.toFixed(2) + '%',
    ]);

    let csvContent = this.dataToCSV(headers, rows);

    if (options.includeMetadata !== false) {
      const metadata: ExportMetadata = {
        zoneName: zone.name,
        zoneId: zone.id,
        timeRange,
        exportedAt: new Date(),
      };
      csvContent = this.addMetadataHeader(csvContent, metadata);
    }

    const filename = options.filename || `geo-distribution-${Date.now()}.csv`;
    return await this.saveAndShareFile(csvContent, filename);
  }

  /**
   * Export protocol distribution to CSV
   */
  async exportProtocolDistribution(
    data: ProtocolData,
    zone: Zone,
    timeRange: { start: Date; end: Date },
    options: ExportOptions = {}
  ): Promise<string> {
    const headers = ['Protocol', 'Requests', 'Percentage'];
    const rows: (string | number)[][] = [
      ['HTTP/1.0', data.http1_0, ((data.http1_0 / data.total) * 100).toFixed(2) + '%'],
      ['HTTP/1.1', data.http1_1, ((data.http1_1 / data.total) * 100).toFixed(2) + '%'],
      ['HTTP/2', data.http2, ((data.http2 / data.total) * 100).toFixed(2) + '%'],
      ['HTTP/3', data.http3, ((data.http3 / data.total) * 100).toFixed(2) + '%'],
      ['Total', data.total, '100%'],
    ];

    let csvContent = this.dataToCSV(headers, rows);

    if (options.includeMetadata !== false) {
      const metadata: ExportMetadata = {
        zoneName: zone.name,
        zoneId: zone.id,
        timeRange,
        exportedAt: new Date(),
      };
      csvContent = this.addMetadataHeader(csvContent, metadata);
    }

    const filename = options.filename || `protocol-distribution-${Date.now()}.csv`;
    return await this.saveAndShareFile(csvContent, filename);
  }

  /**
   * Export TLS distribution to CSV
   */
  async exportTLSDistribution(
    data: TLSData,
    zone: Zone,
    timeRange: { start: Date; end: Date },
    options: ExportOptions = {}
  ): Promise<string> {
    const headers = ['TLS Version', 'Requests', 'Percentage', 'Security Status'];
    const rows: (string | number)[][] = [
      [
        'TLS 1.0',
        data.tls1_0,
        ((data.tls1_0 / data.total) * 100).toFixed(2) + '%',
        'Insecure',
      ],
      [
        'TLS 1.1',
        data.tls1_1,
        ((data.tls1_1 / data.total) * 100).toFixed(2) + '%',
        'Insecure',
      ],
      [
        'TLS 1.2',
        data.tls1_2,
        ((data.tls1_2 / data.total) * 100).toFixed(2) + '%',
        'Secure',
      ],
      [
        'TLS 1.3',
        data.tls1_3,
        ((data.tls1_3 / data.total) * 100).toFixed(2) + '%',
        'Secure',
      ],
      ['Total', data.total, '100%', ''],
      ['', '', '', ''],
      ['Insecure Traffic Percentage', data.insecurePercentage.toFixed(2) + '%', '', ''],
    ];

    let csvContent = this.dataToCSV(headers, rows);

    if (options.includeMetadata !== false) {
      const metadata: ExportMetadata = {
        zoneName: zone.name,
        zoneId: zone.id,
        timeRange,
        exportedAt: new Date(),
      };
      csvContent = this.addMetadataHeader(csvContent, metadata);
    }

    const filename = options.filename || `tls-distribution-${Date.now()}.csv`;
    return await this.saveAndShareFile(csvContent, filename);
  }

  /**
   * Export content type distribution to CSV
   */
  async exportContentTypeDistribution(
    data: ContentTypeData,
    zone: Zone,
    timeRange: { start: Date; end: Date },
    options: ExportOptions = {}
  ): Promise<string> {
    const headers = ['Content Type', 'Requests', 'Bytes', 'Percentage'];
    const rows: (string | number)[][] = data.types.map((type) => [
      type.contentType,
      type.requests,
      type.bytes,
      type.percentage.toFixed(2) + '%',
    ]);

    let csvContent = this.dataToCSV(headers, rows);

    if (options.includeMetadata !== false) {
      const metadata: ExportMetadata = {
        zoneName: zone.name,
        zoneId: zone.id,
        timeRange,
        exportedAt: new Date(),
      };
      csvContent = this.addMetadataHeader(csvContent, metadata);
    }

    const filename = options.filename || `content-type-distribution-${Date.now()}.csv`;
    return await this.saveAndShareFile(csvContent, filename);
  }

  /**
   * Save file to device and trigger share dialog
   */
  private async saveAndShareFile(content: string, filename: string): Promise<string> {
    try {
      // Create file in cache directory
      const file = new File(Paths.cache, filename);

      // Write content to file
      await file.write(content);

      // Share the file
      await this.shareFile(file.uri);

      return file.uri;
    } catch (error) {
      console.error('Error saving and sharing file:', error);
      throw new Error('Failed to export data. Please try again.');
    }
  }

  /**
   * Share file using native share dialog
   */
  async shareFile(fileUri: string): Promise<void> {
    try {
      const result = await Share.share(
        Platform.OS === 'ios'
          ? { url: fileUri }
          : { message: 'Cloudflare Analytics Export', url: fileUri }
      );

      if (result.action === Share.sharedAction) {
        console.log('File shared successfully');
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dialog dismissed');
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      throw new Error('Failed to share file. Please try again.');
    }
  }
}

// Export singleton instance
export default new ExportManager();
