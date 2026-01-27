/**
 * PDFGenerator Tests
 */

import { PDFGenerator, ZoneInfo, PDFGeneratorOptions, ThemeColors } from '../PDFGenerator';
import { TimeRangeModel } from '../../types/common';
import { TrafficMetrics, SecurityMetrics } from '../../types/metrics';

describe('PDFGenerator', () => {
  let generator: PDFGenerator;
  let mockZoneInfo: ZoneInfo;
  let mockTimeRange: TimeRangeModel;
  let mockTheme: ThemeColors;

  beforeEach(() => {
    generator = new PDFGenerator();

    mockZoneInfo = {
      id: 'zone-123',
      name: 'example.com',
      status: 'active',
    };

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    mockTimeRange = new TimeRangeModel(startDate, endDate);

    mockTheme = {
      primary: '#f97316',
      background: '#ffffff',
      text: '#000000',
      border: '#e5e7eb',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    };
  });

  describe('generateHTML', () => {
    it('should generate valid HTML document', () => {
      const options: PDFGeneratorOptions = {
        data: {},
        zoneInfo: mockZoneInfo,
        timeRange: mockTimeRange,
        exportType: 'full',
        theme: mockTheme,
      };

      const html = generator.generateHTML(options);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>');
    });

    it('should include zone information in header', () => {
      const options: PDFGeneratorOptions = {
        data: {},
        zoneInfo: mockZoneInfo,
        timeRange: mockTimeRange,
        exportType: 'full',
        theme: mockTheme,
      };

      const html = generator.generateHTML(options);

      expect(html).toContain('example.com');
      expect(html).toContain('zone-123');
    });

    it('should include time range in header', () => {
      const options: PDFGeneratorOptions = {
        data: {},
        zoneInfo: mockZoneInfo,
        timeRange: mockTimeRange,
        exportType: 'full',
        theme: mockTheme,
      };

      const html = generator.generateHTML(options);

      expect(html).toContain('Period:');
      expect(html).toContain('Jan');
      expect(html).toContain('2024');
    });

    it('should include traffic section when traffic data is provided', () => {
      const trafficData: TrafficMetrics = {
        zoneId: 'zone-123',
        timeRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
        requests: 1000000,
        bytes: 5000000000,
        bandwidth: 500,
        pageViews: 500000,
        visits: 100000,
      };

      const options: PDFGeneratorOptions = {
        data: { traffic: trafficData },
        zoneInfo: mockZoneInfo,
        timeRange: mockTimeRange,
        exportType: 'full',
        theme: mockTheme,
      };

      const html = generator.generateHTML(options);

      expect(html).toContain('Traffic Metrics');
      expect(html).toContain('Total Requests');
      expect(html).toContain('Data Transfer');
      expect(html).toContain('Bandwidth');
    });

    it('should include security section when security data is provided', () => {
      const securityData: SecurityMetrics = {
        cacheStatus: {
          hit: 800,
          miss: 200,
          expired: 50,
          stale: 10,
        },
        firewallEvents: {
          total: 1000,
          blocked: 500,
          challenged: 300,
          allowed: 200,
        },
        botScore: {
          average: 50,
          distribution: [],
        },
        threatScore: {
          average: 30,
          high: 100,
          medium: 200,
          low: 700,
        },
      };

      const options: PDFGeneratorOptions = {
        data: { security: securityData },
        zoneInfo: mockZoneInfo,
        timeRange: mockTimeRange,
        exportType: 'full',
        theme: mockTheme,
      };

      const html = generator.generateHTML(options);

      expect(html).toContain('Security Metrics');
      expect(html).toContain('Total Firewall Events');
      expect(html).toContain('Blocked Requests');
    });
  });

  describe('buildHeaderSection', () => {
    it('should include zone name and ID', () => {
      const header = generator.buildHeaderSection(mockZoneInfo, mockTimeRange);

      expect(header).toContain('example.com');
      expect(header).toContain('zone-123');
    });

    it('should include formatted time range', () => {
      const header = generator.buildHeaderSection(mockZoneInfo, mockTimeRange);

      expect(header).toContain('Period:');
    });

    it('should include generation timestamp', () => {
      const header = generator.buildHeaderSection(mockZoneInfo, mockTimeRange);

      expect(header).toContain('Generated:');
    });
  });

  describe('buildFooterSection', () => {
    it('should include page number placeholder', () => {
      const footer = generator.buildFooterSection();

      expect(footer).toContain('Page');
      expect(footer).toContain('page-number');
    });

    it('should include report title', () => {
      const footer = generator.buildFooterSection();

      expect(footer).toContain('Cloudflare Analytics Report');
    });
  });

  describe('buildTrafficSection', () => {
    it('should format traffic metrics correctly', () => {
      const trafficData: TrafficMetrics = {
        zoneId: 'zone-123',
        timeRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
        requests: 1500000,
        bytes: 5368709120, // 5 GB
        bandwidth: 1500,
        pageViews: 750000,
        visits: 150000,
      };

      const section = generator.buildTrafficSection(trafficData);

      expect(section).toContain('Traffic Metrics');
      expect(section).toContain('Total Requests');
      expect(section).toContain('1.50M');
      expect(section).toContain('5.00 GB');
      expect(section).toContain('1.50 Gbps');
    });
  });

  describe('buildSecuritySection', () => {
    it('should format security metrics correctly', () => {
      const securityData: SecurityMetrics = {
        cacheStatus: {
          hit: 800,
          miss: 200,
          expired: 50,
          stale: 10,
        },
        firewallEvents: {
          total: 1000,
          blocked: 500,
          challenged: 300,
          allowed: 200,
        },
        botScore: {
          average: 50,
          distribution: [],
        },
        threatScore: {
          average: 30,
          high: 100,
          medium: 200,
          low: 700,
        },
      };

      const section = generator.buildSecuritySection(securityData);

      expect(section).toContain('Security Metrics');
      expect(section).toContain('Total Firewall Events');
      expect(section).toContain('1.00K');
      expect(section).toContain('Blocked Requests');
      expect(section).toContain('500');
    });

    it('should calculate cache hit rate correctly', () => {
      const securityData: SecurityMetrics = {
        cacheStatus: {
          hit: 800,
          miss: 200,
          expired: 50,
          stale: 10,
        },
        firewallEvents: {
          total: 0,
          blocked: 0,
          challenged: 0,
          allowed: 0,
        },
        botScore: {
          average: 0,
          distribution: [],
        },
        threatScore: {
          average: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      };

      const section = generator.buildSecuritySection(securityData);

      expect(section).toContain('Cache Hit Rate');
      expect(section).toContain('80.00%');
    });
  });

  describe('buildMetricsGrid', () => {
    it('should create grid with metric cards', () => {
      const metrics = [
        { label: 'Metric 1', value: '100', unit: 'units' },
        { label: 'Metric 2', value: '200', unit: 'items' },
      ];

      const grid = generator.buildMetricsGrid(metrics);

      expect(grid).toContain('metrics-grid');
      expect(grid).toContain('metric-card');
      expect(grid).toContain('Metric 1');
      expect(grid).toContain('Metric 2');
      expect(grid).toContain('100');
      expect(grid).toContain('200');
    });

    it('should handle metrics without units', () => {
      const metrics = [{ label: 'Count', value: '42', unit: '' }];

      const grid = generator.buildMetricsGrid(metrics);

      expect(grid).toContain('Count');
      expect(grid).toContain('42');
      expect(grid).not.toContain('metric-unit');
    });
  });

  describe('renderPieChart', () => {
    it('should generate SVG pie chart', () => {
      const chartConfig = {
        type: 'pie' as const,
        data: [
          { label: 'Category A', value: 100 },
          { label: 'Category B', value: 200 },
          { label: 'Category C', value: 150 },
        ],
        title: 'Test Distribution',
      };

      const chart = generator.renderPieChart(chartConfig, mockTheme);

      expect(chart).toContain('<svg');
      expect(chart).toContain('</svg>');
      expect(chart).toContain('Test Distribution');
      expect(chart).toContain('Category A');
      expect(chart).toContain('Category B');
      expect(chart).toContain('Category C');
    });

    it('should include chart legend', () => {
      const chartConfig = {
        type: 'pie' as const,
        data: [
          { label: 'Item 1', value: 50 },
          { label: 'Item 2', value: 50 },
        ],
        title: 'Test Chart',
      };

      const chart = generator.renderPieChart(chartConfig, mockTheme);

      expect(chart).toContain('chart-legend');
      expect(chart).toContain('legend-item');
      expect(chart).toContain('Item 1');
      expect(chart).toContain('Item 2');
    });

    it('should handle empty data', () => {
      const chartConfig = {
        type: 'pie' as const,
        data: [],
        title: 'Empty Chart',
      };

      const chart = generator.renderPieChart(chartConfig, mockTheme);

      expect(chart).toContain('No data available');
    });

    it('should apply theme colors', () => {
      const themeWithChartColors = {
        ...mockTheme,
        chartColors: ['#ff0000', '#00ff00', '#0000ff'],
      };

      const chartConfig = {
        type: 'pie' as const,
        data: [
          { label: 'Red', value: 100 },
          { label: 'Green', value: 100 },
          { label: 'Blue', value: 100 },
        ],
        title: 'Color Test',
      };

      const chart = generator.renderPieChart(chartConfig, themeWithChartColors);

      expect(chart).toContain('#ff0000');
      expect(chart).toContain('#00ff00');
      expect(chart).toContain('#0000ff');
    });
  });

  describe('renderLineChart', () => {
    it('should generate SVG line chart', () => {
      const chartConfig = {
        type: 'line' as const,
        data: [
          { timestamp: '2024-01-01', value: 100, label: 'Day 1' },
          { timestamp: '2024-01-02', value: 150, label: 'Day 2' },
          { timestamp: '2024-01-03', value: 120, label: 'Day 3' },
        ],
        title: 'Traffic Over Time',
      };

      const chart = generator.renderLineChart(chartConfig, mockTheme);

      expect(chart).toContain('<svg');
      expect(chart).toContain('</svg>');
      expect(chart).toContain('Traffic Over Time');
      expect(chart).toContain('<path');
      expect(chart).toContain('<line');
    });

    it('should handle empty data', () => {
      const chartConfig = {
        type: 'line' as const,
        data: [],
        title: 'Empty Line Chart',
      };

      const chart = generator.renderLineChart(chartConfig, mockTheme);

      expect(chart).toContain('No data available');
    });

    it('should include grid lines', () => {
      const chartConfig = {
        type: 'line' as const,
        data: [
          { timestamp: '2024-01-01', value: 100 },
          { timestamp: '2024-01-02', value: 200 },
        ],
        title: 'Test Line Chart',
      };

      const chart = generator.renderLineChart(chartConfig, mockTheme);

      expect(chart).toContain('stroke-dasharray');
    });
  });

  describe('buildDistributionSection', () => {
    it('should create distribution section with pie chart', () => {
      const data = [
        { label: 'US', value: 1000 },
        { label: 'UK', value: 500 },
        { label: 'DE', value: 300 },
      ];

      const section = generator.buildDistributionSection(
        'Geographic Distribution',
        data,
        'pie',
        mockTheme
      );

      expect(section).toContain('Geographic Distribution');
      expect(section).toContain('<svg');
      expect(section).toContain('US');
      expect(section).toContain('UK');
      expect(section).toContain('DE');
    });

    it('should handle empty distribution data', () => {
      const section = generator.buildDistributionSection(
        'Empty Distribution',
        [],
        'pie',
        mockTheme
      );

      expect(section).toContain('Empty Distribution');
      expect(section).toContain('No data available');
    });
  });

  describe('buildStatusCodeSection', () => {
    it('should create status code distribution section', () => {
      const data = [
        { statusCode: 200, count: 1000 },
        { statusCode: 404, count: 50 },
        { statusCode: 500, count: 10 },
      ];

      const section = generator.buildStatusCodeSection(data, mockTheme);

      expect(section).toContain('Status Code Distribution');
      expect(section).toContain('200');
      expect(section).toContain('404');
      expect(section).toContain('500');
    });
  });

  describe('Data Format Handling', () => {
    it('should handle status codes with breakdown format', () => {
      const options: PDFGeneratorOptions = {
        data: {
          statusCodes: {
            total: 153,
            status2xx: 149,
            status3xx: 0,
            status4xx: 4,
            status5xx: 0,
            breakdown: {
              '200': 147,
              '204': 2,
              '404': 4,
            },
          },
        },
        zoneInfo: mockZoneInfo,
        timeRange: mockTimeRange,
        exportType: 'statusCodes',
        theme: mockTheme,
      };

      const html = generator.generateHTML(options);

      expect(html).toContain('Status Code Distribution');
      expect(html).toContain('200');
      expect(html).toContain('204');
      expect(html).toContain('404');
    });

    it('should handle protocol with aggregated format', () => {
      const options: PDFGeneratorOptions = {
        data: {
          protocol: {
            http1_0: 0,
            http1_1: 3449,
            http2: 57,
            http3: 137,
            total: 3643,
          },
        },
        zoneInfo: mockZoneInfo,
        timeRange: mockTimeRange,
        exportType: 'protocol',
        theme: mockTheme,
      };

      const html = generator.generateHTML(options);

      expect(html).toContain('Protocol Distribution');
      expect(html).toContain('HTTP/1.1');
      expect(html).toContain('HTTP/2');
      expect(html).toContain('HTTP/3');
    });

    it('should handle geo with countries format', () => {
      const options: PDFGeneratorOptions = {
        data: {
          geo: {
            countries: [
              { code: 'US', country: 'United States', requests: 1000 },
              { code: 'UK', country: 'United Kingdom', requests: 500 },
            ],
          },
        },
        zoneInfo: mockZoneInfo,
        timeRange: mockTimeRange,
        exportType: 'geo',
        theme: mockTheme,
      };

      const html = generator.generateHTML(options);

      expect(html).toContain('Geographic Distribution');
      expect(html).toContain('United States');
      expect(html).toContain('United Kingdom');
    });
  });

  describe('buildGeoDistributionSection', () => {
    it('should create geographic distribution section', () => {
      const data = [
        { country: 'United States', requests: 5000 },
        { country: 'United Kingdom', requests: 2000 },
        { country: 'Germany', requests: 1500 },
      ];

      const section = generator.buildGeoDistributionSection(data, mockTheme);

      expect(section).toContain('Geographic Distribution');
      expect(section).toContain('United States');
      expect(section).toContain('United Kingdom');
      expect(section).toContain('Germany');
    });
  });

  describe('buildProtocolDistributionSection', () => {
    it('should create protocol distribution section', () => {
      const data = [
        { protocol: 'HTTP/2', requests: 8000 },
        { protocol: 'HTTP/1.1', requests: 2000 },
      ];

      const section = generator.buildProtocolDistributionSection(data, mockTheme);

      expect(section).toContain('Protocol Distribution');
      expect(section).toContain('HTTP/2');
      expect(section).toContain('HTTP/1.1');
    });
  });

  describe('buildTLSDistributionSection', () => {
    it('should create TLS distribution section', () => {
      const data = [
        { tlsVersion: 'TLSv1.3', requests: 9000 },
        { tlsVersion: 'TLSv1.2', requests: 1000 },
      ];

      const section = generator.buildTLSDistributionSection(data, mockTheme);

      expect(section).toContain('TLS Version Distribution');
      expect(section).toContain('TLSv1.3');
      expect(section).toContain('TLSv1.2');
    });
  });

  describe('buildContentTypeSection', () => {
    it('should create content type distribution section', () => {
      const data = [
        { contentType: 'text/html', requests: 5000 },
        { contentType: 'application/json', requests: 3000 },
        { contentType: 'image/png', requests: 2000 },
      ];

      const section = generator.buildContentTypeSection(data, mockTheme);

      expect(section).toContain('Content Type Distribution');
      expect(section).toContain('text/html');
      expect(section).toContain('application/json');
      expect(section).toContain('image/png');
    });
  });

  describe('buildBotAnalysisSection', () => {
    it('should create bot analysis section with metrics', () => {
      const data = {
        totalBotRequests: 1000,
        verifiedBots: 800,
        suspiciousBots: 200,
        botPercentage: 0.15,
        distribution: [
          { botScore: 'Verified', requests: 800 },
          { botScore: 'Suspicious', requests: 200 },
        ],
      };

      const section = generator.buildBotAnalysisSection(data, mockTheme);

      expect(section).toContain('Bot Analysis');
      expect(section).toContain('Total Bot Requests');
      expect(section).toContain('Verified Bots');
      expect(section).toContain('Suspicious Bots');
      expect(section).toContain('15.00%');
    });

    it('should handle missing bot data', () => {
      const section = generator.buildBotAnalysisSection(null, mockTheme);

      expect(section).toContain('Bot Analysis');
      expect(section).toContain('No data available');
    });
  });

  describe('buildFirewallAnalysisSection', () => {
    it('should create firewall analysis section with metrics', () => {
      const data = {
        totalEvents: 1000,
        blocked: 500,
        challenged: 300,
        allowed: 200,
        distribution: [
          { action: 'block', requests: 500 },
          { action: 'challenge', requests: 300 },
          { action: 'allow', requests: 200 },
        ],
      };

      const section = generator.buildFirewallAnalysisSection(data, mockTheme);

      expect(section).toContain('Firewall Analysis');
      expect(section).toContain('Total Firewall Events');
      expect(section).toContain('Blocked Requests');
      expect(section).toContain('Challenged Requests');
      expect(section).toContain('Allowed Requests');
    });

    it('should handle missing firewall data', () => {
      const section = generator.buildFirewallAnalysisSection(null, mockTheme);

      expect(section).toContain('Firewall Analysis');
      expect(section).toContain('No data available');
    });
  });

  describe('Large Dataset Handling', () => {
    it('should truncate distribution data exceeding MAX_DISTRIBUTION_ITEMS', () => {
      // Create a large dataset with 100 items
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        label: `Item ${i}`,
        value: Math.random() * 1000,
      }));

      const section = generator.buildDistributionSection(
        'Large Distribution',
        largeData,
        'pie',
        mockTheme
      );

      // Should include truncation note
      expect(section).toContain('Note:');
      expect(section).toContain('truncated');
      expect(section).toContain('Showing top 50 of 100 items');
    });

    it('should not truncate small datasets', () => {
      const smallData = Array.from({ length: 10 }, (_, i) => ({
        label: `Item ${i}`,
        value: Math.random() * 1000,
      }));

      const section = generator.buildDistributionSection(
        'Small Distribution',
        smallData,
        'pie',
        mockTheme
      );

      // Should not include truncation note
      expect(section).not.toContain('truncated');
    });

    it('should include truncation note in bot analysis with large dataset', () => {
      const data = {
        totalBotRequests: 10000,
        verifiedBots: 5000,
        suspiciousBots: 3000,
        botPercentage: 0.15,
        distribution: Array.from({ length: 100 }, (_, i) => ({
          botScore: `Score ${i}`,
          requests: Math.random() * 1000,
        })),
      };

      const section = generator.buildBotAnalysisSection(data, mockTheme);

      expect(section).toContain('Note:');
      expect(section).toContain('truncated');
    });

    it('should include truncation note in firewall analysis with large dataset', () => {
      const data = {
        totalEvents: 10000,
        blocked: 5000,
        challenged: 3000,
        allowed: 2000,
        distribution: Array.from({ length: 100 }, (_, i) => ({
          action: `Action ${i}`,
          requests: Math.random() * 1000,
        })),
      };

      const section = generator.buildFirewallAnalysisSection(data, mockTheme);

      expect(section).toContain('Note:');
      expect(section).toContain('truncated');
    });
  });

  describe('renderPDF', () => {
    it('should handle PDF generation errors gracefully', async () => {
      // Mock expo-print to throw an error
      const { printToFileAsync } = require('expo-print');
      printToFileAsync.mockRejectedValueOnce(new Error('Print failed'));

      const html = '<html><body>Test PDF</body></html>';
      const fileName = 'test.pdf';

      await expect(generator.renderPDF(html, fileName)).rejects.toThrow(
        'Failed to render PDF'
      );
    });
  });
});
