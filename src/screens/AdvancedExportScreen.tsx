/**
 * AdvancedExportScreen
 * Comprehensive data export screen with custom time range selection
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useZone } from '../contexts/ZoneContext';
import ZoneSelector from '../components/ZoneSelector';
import PDFExportService, { PDFExportResult } from '../services/PDFExportService';
import { fileManager } from '../services/FileManager';

export default function AdvancedExportScreen() {
  const { colors, isDark } = useTheme();
  const { zoneId, zoneName, accountTag } = useZone();

  // Date selection state
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Default to 7 days ago
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [exportResult, setExportResult] = useState<PDFExportResult | null>(null);

  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /**
   * Validate date selection
   */
  const validateDates = (): { valid: boolean; error?: string } => {
    const now = new Date();

    if (startDate > now) {
      return { valid: false, error: '开始日期不能是未来日期' };
    }

    if (endDate > now) {
      return { valid: false, error: '结束日期不能是未来日期' };
    }

    if (startDate > endDate) {
      return { valid: false, error: '开始日期必须早于结束日期' };
    }

    return { valid: true };
  };

  /**
   * Handle export button press
   */
  const handleExport = async () => {
    // Validate zone selection
    if (!zoneId || !zoneName) {
      setError('请先选择一个 Zone');
      return;
    }

    // Validate dates
    const validation = validateDates();
    if (!validation.valid) {
      setError(validation.error || '日期选择无效');
      return;
    }

    // Clear previous error
    setError(null);
    setIsExporting(true);
    setProgress(0);
    setProgressMessage('准备导出...');

    try {
      const result = await PDFExportService.exportToPDF({
        zoneId,
        zoneName,
        accountTag: accountTag || undefined,
        startDate,
        endDate,
        exportType: 'full',
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
        onProgress: (prog, msg) => {
          // Handle timeout warning (progress = -1)
          if (prog === -1) {
            setProgressMessage(msg);
          } else {
            setProgress(prog);
            setProgressMessage(msg);
          }
        },
      });

      if (result.success) {
        setExportResult(result);
        setShowSuccessModal(true);
      } else {
        setError(result.error?.message || '导出失败');
      }
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : '导出过程中发生错误');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    setError(null);
    handleExport();
  };

  /**
   * Handle share PDF
   */
  const handleShare = async () => {
    if (exportResult?.filePath) {
      try {
        await fileManager.shareFile(exportResult.filePath);
      } catch (err) {
        console.error('Share error:', err);
        setError('分享失败');
      }
    }
  };

  /**
   * Handle date picker selection
   */
  const handleStartDateChange = (selectedDate: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (selectedDate: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>高级数据导出</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            导出完整的分析数据为 PDF 文档
          </Text>
        </View>

        {/* Zone Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>选择 Zone</Text>
          <View style={styles.sectionContent}>
            <ZoneSelector />
          </View>
        </View>

        {/* Date Range Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>选择时间范围</Text>
          <View style={styles.sectionContent}>
            {/* Start Date */}
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowStartDatePicker(true)}
              disabled={isExporting}
            >
              <View style={styles.dateButtonContent}>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>开始日期</Text>
                <Text style={[styles.dateValue, { color: colors.text }]}>{formatDate(startDate)}</Text>
              </View>
              <Text style={[styles.dateIcon, { color: colors.textSecondary }]}>📅</Text>
            </TouchableOpacity>

            {/* End Date */}
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowEndDatePicker(true)}
              disabled={isExporting}
            >
              <View style={styles.dateButtonContent}>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>结束日期</Text>
                <Text style={[styles.dateValue, { color: colors.text }]}>{formatDate(endDate)}</Text>
              </View>
              <Text style={[styles.dateIcon, { color: colors.textSecondary }]}>📅</Text>
            </TouchableOpacity>

            {/* Date Range Info */}
            <View style={[styles.infoBox, { backgroundColor: isDark ? colors.card : '#f0f9ff' }]}>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                将导出 {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} 天的数据
              </Text>
            </View>
          </View>
        </View>

        {/* Export Button */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={[
                styles.exportButton,
                { backgroundColor: colors.primary },
                (isExporting || !zoneId) && styles.exportButtonDisabled,
              ]}
              onPress={handleExport}
              disabled={isExporting || !zoneId}
            >
              {isExporting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.exportButtonIcon}>📄</Text>
                  <Text style={styles.exportButtonText}>导出 PDF</Text>
                </>
              )}
            </TouchableOpacity>

            {!zoneId && (
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                请先选择一个 Zone
              </Text>
            )}
          </View>
        </View>

        {/* Progress Indicator */}
        {isExporting && (
          <View style={styles.section}>
            <View style={[styles.progressContainer, { backgroundColor: colors.surface }]}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressTitle, { color: colors.text }]}>导出进度</Text>
                <Text style={[styles.progressPercent, { color: colors.primary }]}>{progress}%</Text>
              </View>
              <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
                <View
                  style={[styles.progressBarFill, { backgroundColor: colors.primary, width: `${progress}%` }]}
                />
              </View>
              <Text style={[styles.progressMessage, { color: colors.textSecondary }]}>{progressMessage}</Text>
            </View>
          </View>
        )}

        {/* Error Display */}
        {error && !isExporting && (
          <View style={styles.section}>
            <View style={[styles.errorContainer, { backgroundColor: '#fee2e2', borderColor: '#ef4444' }]}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <View style={styles.errorContent}>
                <Text style={styles.errorTitle}>导出失败</Text>
                <Text style={styles.errorMessage}>{error}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={handleRetry}
            >
              <Text style={styles.retryButtonText}>重试</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Export Info */}
        <View style={styles.section}>
          <View style={[styles.infoBox, { backgroundColor: isDark ? colors.card : '#f9fafb' }]}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>导出内容包括：</Text>
            <Text style={[styles.infoItem, { color: colors.textSecondary }]}>• 流量指标（请求数、带宽等）</Text>
            <Text style={[styles.infoItem, { color: colors.textSecondary }]}>• 安全指标（防火墙事件、拦截请求）</Text>
            <Text style={[styles.infoItem, { color: colors.textSecondary }]}>• 状态码分布</Text>
            <Text style={[styles.infoItem, { color: colors.textSecondary }]}>• 地理位置分布</Text>
            <Text style={[styles.infoItem, { color: colors.textSecondary }]}>• 协议和 TLS 版本分布</Text>
            <Text style={[styles.infoItem, { color: colors.textSecondary }]}>• 内容类型分布</Text>
            <Text style={[styles.infoItem, { color: colors.textSecondary }]}>• Bot 和防火墙分析</Text>
          </View>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSuccessModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={[styles.modalTitle, { color: colors.text }]}>导出成功！</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              PDF 文件已保存到设备
            </Text>
            {exportResult?.fileName && (
              <Text style={[styles.fileName, { color: colors.textSecondary }]}>{exportResult.fileName}</Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: colors.border }]}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={[styles.modalButtonTextSecondary, { color: colors.text }]}>完成</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                onPress={handleShare}
              >
                <Text style={styles.modalButtonTextPrimary}>分享</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Date Picker Modals - Simple implementation */}
      {showStartDatePicker && (
        <Modal
          visible={showStartDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowStartDatePicker(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowStartDatePicker(false)}>
            <View style={[styles.datePickerModal, { backgroundColor: colors.surface }]}>
              <Text style={[styles.datePickerTitle, { color: colors.text }]}>选择开始日期</Text>
              <Text style={[styles.datePickerNote, { color: colors.textSecondary }]}>
                注意：此为简化版日期选择器。在生产环境中，建议使用 @react-native-community/datetimepicker
              </Text>
              {/* Quick date selection buttons */}
              <View style={styles.quickDateButtons}>
                <TouchableOpacity
                  style={[styles.quickDateButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    const date = new Date();
                    date.setDate(date.getDate() - 7);
                    handleStartDateChange(date);
                  }}
                >
                  <Text style={styles.quickDateButtonText}>7天前</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickDateButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    const date = new Date();
                    date.setDate(date.getDate() - 30);
                    handleStartDateChange(date);
                  }}
                >
                  <Text style={styles.quickDateButtonText}>30天前</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickDateButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    const date = new Date();
                    date.setDate(date.getDate() - 90);
                    handleStartDateChange(date);
                  }}
                >
                  <Text style={styles.quickDateButtonText}>90天前</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}

      {showEndDatePicker && (
        <Modal
          visible={showEndDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEndDatePicker(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowEndDatePicker(false)}>
            <View style={[styles.datePickerModal, { backgroundColor: colors.surface }]}>
              <Text style={[styles.datePickerTitle, { color: colors.text }]}>选择结束日期</Text>
              <Text style={[styles.datePickerNote, { color: colors.textSecondary }]}>
                注意：此为简化版日期选择器。在生产环境中，建议使用 @react-native-community/datetimepicker
              </Text>
              {/* Quick date selection buttons */}
              <View style={styles.quickDateButtons}>
                <TouchableOpacity
                  style={[styles.quickDateButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    handleEndDateChange(new Date());
                  }}
                >
                  <Text style={styles.quickDateButtonText}>今天</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickDateButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    const date = new Date();
                    date.setDate(date.getDate() - 1);
                    handleEndDateChange(date);
                  }}
                >
                  <Text style={styles.quickDateButtonText}>昨天</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickDateButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    const date = new Date();
                    date.setDate(date.getDate() - 7);
                    handleEndDateChange(date);
                  }}
                >
                  <Text style={styles.quickDateButtonText}>7天前</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionContent: {
    gap: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateButtonContent: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateIcon: {
    fontSize: 24,
    marginLeft: 12,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonIcon: {
    fontSize: 20,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  progressContainer: {
    padding: 20,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressMessage: {
    fontSize: 13,
    marginTop: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  errorIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#991b1b',
  },
  retryButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    borderWidth: 1,
  },
  modalButtonPrimary: {},
  modalButtonTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  datePickerModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  datePickerNote: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  quickDateButtons: {
    gap: 12,
  },
  quickDateButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickDateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
