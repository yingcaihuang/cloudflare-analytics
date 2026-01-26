/**
 * ExportButton Component
 * Reusable button component for PDF export functionality
 * Replaces CSV export buttons on individual analytics screens
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import PDFExportService, { PDFExportOptions } from '../services/PDFExportService';
import { fileManager } from '../services/FileManager';

export interface ExportButtonProps {
  exportType: PDFExportOptions['exportType'];
  zoneId: string;
  zoneName: string;
  accountTag?: string | null;
  startDate: Date;
  endDate: Date;
  disabled?: boolean;
  style?: any;
}

/**
 * ExportButton Component
 * 
 * A reusable button component that handles PDF export for individual analytics screens.
 * Connects to PDFExportService and provides loading states and user feedback.
 * 
 * Requirements:
 * - 3.1: Display PDF export button on individual screens
 * - 3.2: Generate PDF containing only that screen's data
 */
export default function ExportButton({
  exportType,
  zoneId,
  zoneName,
  accountTag,
  startDate,
  endDate,
  disabled = false,
  style,
}: ExportButtonProps) {
  const { colors } = useTheme();
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Handle export button press
   */
  const handleExport = async () => {
    // Validate zone
    if (!zoneId || !zoneName) {
      Alert.alert('No Zone Selected', 'Please select a zone before exporting.');
      return;
    }

    setIsExporting(true);

    try {
      const result = await PDFExportService.exportToPDF({
        zoneId,
        zoneName,
        accountTag: accountTag || undefined,
        startDate,
        endDate,
        exportType,
        theme: {
          primary: colors.primary,
          background: colors.background,
          text: colors.text,
          border: colors.border,
          success: colors.success,
          warning: colors.warning,
          error: colors.error,
          chartColors: colors.chartColors,
          chartBackground: colors.chartBackground,
          chartGrid: colors.chartGrid,
          chartLabel: colors.chartLabel,
        },
      });

      if (result.success) {
        // Show success alert with share option
        Alert.alert(
          'Export Successful',
          `PDF has been saved: ${result.fileName || 'cloudflare-analytics.pdf'}`,
          [
            {
              text: 'Done',
              style: 'cancel',
            },
            {
              text: 'Share',
              onPress: async () => {
                if (result.filePath) {
                  try {
                    await fileManager.shareFile(result.filePath);
                  } catch (error) {
                    console.error('Share error:', error);
                    Alert.alert('Share Failed', 'Unable to share the PDF file.');
                  }
                }
              },
            },
          ]
        );
      } else {
        // Show error alert with retry option
        Alert.alert(
          'Export Failed',
          result.error?.message || 'Failed to generate PDF. Please try again.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Retry',
              onPress: handleExport,
            },
          ]
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Retry',
            onPress: handleExport,
          },
        ]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const isDisabled = disabled || isExporting || !zoneId;

  return (
    <TouchableOpacity
      style={[
        styles.exportButton,
        { backgroundColor: colors.primary },
        isDisabled && styles.exportButtonDisabled,
        style,
      ]}
      onPress={handleExport}
      disabled={isDisabled}
    >
      {isExporting ? (
        <ActivityIndicator color="#ffffff" size="small" />
      ) : (
        <>
          <Text style={styles.exportButtonIcon}>📄</Text>
          <Text style={styles.exportButtonText}>Export PDF</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
    gap: 6,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonIcon: {
    fontSize: 16,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
