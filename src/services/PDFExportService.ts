/**
 * PDFExportService
 * Orchestrates the PDF export process including time range validation,
 * data aggregation, and progress tracking
 */

import GraphQLClient from './GraphQLClient';
import { PDFGenerator, ThemeColors } from './PDFGenerator';
import { fileManager } from './FileManager';
import {
  MetricsQueryParams,
  TrafficMetrics,
  SecurityMetrics,
  StatusCodeData,
  GeoData,
  ProtocolData,
  TLSData,
  ContentTypeData,
} from '../types';
import { BotAnalysisData, FirewallAnalysisData } from '../types/metrics';

export interface PDFExportOptions {
  zoneId: string;
  zoneName: string;
  accountTag?: string;
  startDate: Date;
  endDate: Date;
  exportType: 'full' | 'traffic' | 'security' | 'status-codes' | 
               'geo' | 'protocol' | 'tls' | 'content-type' | 
               'bot' | 'firewall';
  theme?: ThemeColors;
  onProgress?: (progress: number, message: string) => void;
}

export interface PDFExportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: ExportError;
}

export interface ExportError {
  code: 'STORAGE_FULL' | 'NETWORK_ERROR' | 'GENERATION_FAILED' | 'INVALID_DATA' | 'INVALID_TIME_RANGE';
  message: string;
  details?: any;
}

export interface AnalyticsData {
  traffic?: TrafficMetrics;
  security?: SecurityMetrics;
  statusCodes?: StatusCodeData;
  geo?: GeoData;
  protocol?: ProtocolData;
  tls?: TLSData;
  contentType?: ContentTypeData;
  bot?: BotAnalysisData;
  firewall?: FirewallAnalysisData;
}

class PDFExportService {
  private timeoutWarningShown = false;

  /**
   * Main export method that orchestrates the entire PDF generation process
   */
  async exportToPDF(options: PDFExportOptions): Promise<PDFExportResult> {
    // Reset timeout warning flag
    this.timeoutWarningShown = false;
    
    // Set up 30-second timeout warning
    const timeoutWarning = setTimeout(() => {
      if (!this.timeoutWarningShown) {
        this.timeoutWarningShown = true;
        this.updateProgress(
          options, 
          -1, // Special progress value to indicate warning
          'This is taking longer than expected. Large datasets may take a few minutes to process. Please wait...'
        );
      }
    }, 30000); // 30 seconds

    try {
      // Step 1: Validate time range
      this.updateProgress(options, 5, 'Validating time range...');
      if (!this.validateTimeRange(options.startDate, options.endDate)) {
        clearTimeout(timeoutWarning);
        return {
          success: false,
          error: {
            code: 'INVALID_TIME_RANGE',
            message: 'Invalid time range: End date must be after start date and dates cannot be in the future',
          },
        };
      }

      // Step 2: Check storage space (estimate 5MB needed)
      this.updateProgress(options, 10, 'Checking storage space...');
      const hasSpace = await fileManager.checkStorageSpace(5 * 1024 * 1024);
      if (!hasSpace) {
        clearTimeout(timeoutWarning);
        return {
          success: false,
          error: {
            code: 'STORAGE_FULL',
            message: 'Insufficient storage space. Please free up space and try again.',
          },
        };
      }

      // Step 3: Aggregate data
      this.updateProgress(options, 20, 'Fetching analytics data...');
      const data = await this.aggregateData(options);
      
      // Debug: Log aggregated data
      console.log('📊 Aggregated data:', JSON.stringify(data, null, 2));
      
      // Debug: Log geo data structure specifically
      if (data.geo) {
        console.log('🗺️ Geo data type:', typeof data.geo);
        console.log('🗺️ Geo data is array:', Array.isArray(data.geo));
        console.log('🗺️ Geo data keys:', Object.keys(data.geo));
        console.log('🗺️ Geo data sample:', JSON.stringify(data.geo).substring(0, 200));
      }
      
      // Step 4: Validate data
      this.updateProgress(options, 60, 'Validating data...');
      if (!this.isValidData(data, options.exportType)) {
        clearTimeout(timeoutWarning);
        return {
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: 'Unable to export data. Some required information is missing.',
          },
        };
      }

      // Step 5: Generate PDF
      this.updateProgress(options, 70, 'Generating PDF...');
      const generator = new PDFGenerator();
      
      // Use provided theme or default theme
      const theme: ThemeColors = options.theme || {
        primary: '#f6821f',
        background: '#ffffff',
        text: '#333333',
        border: '#e0e0e0',
        success: '#2ecc71',
        warning: '#f39c12',
        error: '#e74c3c',
        chartColors: ['#2280b0', '#f6821f', '#2ecc71', '#e74c3c', '#9b59b6', '#3498db'],
        chartBackground: '#ffffff',
        chartGrid: '#e3e3e3',
        chartLabel: '#333333',
      };
      
      const html = generator.generateHTML({
        data,
        zoneInfo: {
          id: options.zoneId,
          name: options.zoneName,
        },
        timeRange: {
          startDate: options.startDate,
          endDate: options.endDate,
        },
        exportType: options.exportType,
        theme,
      });

      // Step 6: Render PDF
      this.updateProgress(options, 85, 'Rendering PDF...');
      const fileName = fileManager.generateFileName(options.zoneName, new Date());
      const filePath = await generator.renderPDF(html, fileName);

      // Step 7: Complete
      clearTimeout(timeoutWarning);
      this.updateProgress(options, 100, 'Export complete!');
      
      return {
        success: true,
        filePath,
        fileName,
      };
    } catch (error) {
      clearTimeout(timeoutWarning);
      console.error('PDF Export Error:', error);
      
      // Map error to appropriate error code
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          return {
            success: false,
            error: {
              code: 'NETWORK_ERROR',
              message: 'Unable to fetch analytics data. Please check your connection and try again.',
              details: error.message,
            },
          };
        }
      }
      
      return {
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: 'Failed to generate PDF. Please try again.',
          details: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Validates that the time range is valid
   * - Start date must be before end date
   * - Neither date can be in the future
   */
  private validateTimeRange(startDate: Date, endDate: Date): boolean {
    const now = new Date();
    
    // Check if dates are in the future
    if (startDate > now || endDate > now) {
      return false;
    }
    
    // Check if start date is before end date
    if (startDate > endDate) {
      return false;
    }
    
    return true;
  }

  /**
   * Aggregates data from all relevant hooks based on export type
   */
  private async aggregateData(options: PDFExportOptions): Promise<AnalyticsData> {
    const params: MetricsQueryParams = {
      zoneId: options.zoneId,
      accountTag: options.accountTag,
      startDate: options.startDate,
      endDate: options.endDate,
    };

    const data: AnalyticsData = {};

    try {
      // For full export, fetch all data
      if (options.exportType === 'full') {
        this.updateProgress(options, 25, 'Fetching traffic metrics...');
        data.traffic = await GraphQLClient.queryTrafficMetrics(params);
        
        this.updateProgress(options, 30, 'Fetching security metrics...');
        data.security = await GraphQLClient.querySecurityMetrics(params);
        
        this.updateProgress(options, 35, 'Fetching status codes...');
        data.statusCodes = await GraphQLClient.queryStatusCodes(params);
        
        this.updateProgress(options, 40, 'Fetching geographic distribution...');
        data.geo = await GraphQLClient.queryGeoDistribution(params);
        
        this.updateProgress(options, 45, 'Fetching protocol distribution...');
        data.protocol = await GraphQLClient.queryProtocolDistribution(params);
        
        this.updateProgress(options, 50, 'Fetching TLS distribution...');
        data.tls = await GraphQLClient.queryTLSDistribution(params);
        
        this.updateProgress(options, 53, 'Fetching content type distribution...');
        data.contentType = await GraphQLClient.queryContentTypeDistribution(params);
        
        this.updateProgress(options, 56, 'Fetching bot analysis...');
        data.bot = await GraphQLClient.queryBotAnalysis(params);
        
        this.updateProgress(options, 59, 'Fetching firewall analysis...');
        data.firewall = await GraphQLClient.queryFirewallAnalysis(params);
      } else {
        // For single-screen exports, fetch only relevant data
        switch (options.exportType) {
          case 'traffic':
            data.traffic = await GraphQLClient.queryTrafficMetrics(params);
            break;
          case 'security':
            data.security = await GraphQLClient.querySecurityMetrics(params);
            break;
          case 'status-codes':
            data.statusCodes = await GraphQLClient.queryStatusCodes(params);
            break;
          case 'geo':
            data.geo = await GraphQLClient.queryGeoDistribution(params);
            break;
          case 'protocol':
            data.protocol = await GraphQLClient.queryProtocolDistribution(params);
            break;
          case 'tls':
            data.tls = await GraphQLClient.queryTLSDistribution(params);
            break;
          case 'content-type':
            data.contentType = await GraphQLClient.queryContentTypeDistribution(params);
            break;
          case 'bot':
            data.bot = await GraphQLClient.queryBotAnalysis(params);
            break;
          case 'firewall':
            data.firewall = await GraphQLClient.queryFirewallAnalysis(params);
            break;
        }
      }
    } catch (error) {
      console.error('Error aggregating data:', error);
      throw error;
    }

    return data;
  }

  /**
   * Validates that the aggregated data is sufficient for PDF generation
   */
  private isValidData(data: AnalyticsData, exportType: string): boolean {
    // For full export, we need at least traffic or security data
    if (exportType === 'full') {
      return !!(data.traffic || data.security);
    }
    
    // For single-screen exports, check that the specific data exists
    switch (exportType) {
      case 'traffic':
        return !!data.traffic;
      case 'security':
        return !!data.security;
      case 'status-codes':
        return !!data.statusCodes;
      case 'geo':
        return !!data.geo;
      case 'protocol':
        return !!data.protocol;
      case 'tls':
        return !!data.tls;
      case 'content-type':
        return !!data.contentType;
      case 'bot':
        return !!data.bot;
      case 'firewall':
        return !!data.firewall;
      default:
        return false;
    }
  }

  /**
   * Updates progress via callback if provided
   */
  private updateProgress(options: PDFExportOptions, progress: number, message: string): void {
    if (options.onProgress) {
      options.onProgress(progress, message);
    }
  }
}

export default new PDFExportService();
