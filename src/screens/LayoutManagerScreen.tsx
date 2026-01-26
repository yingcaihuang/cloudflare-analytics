/**
 * LayoutManagerScreen
 * Screen for managing dashboard layouts (create, rename, delete, duplicate)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
  Platform,
  ToastAndroid,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useDashboard } from '../contexts/DashboardContext';
import { DashboardLayout } from '../types/dashboard';
import { Toast } from '../components/Toast';

/**
 * Dialog type for modal operations
 */
type DialogType = 'create' | 'rename' | 'duplicate' | null;

/**
 * LayoutManagerScreen Component
 */
export const LayoutManagerScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const {
    config,
    activeLayout,
    switchLayout,
    createLayout,
    deleteLayout,
    renameLayout,
    duplicateLayout,
  } = useDashboard();

  // Dialog state
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [dialogLayoutId, setDialogLayoutId] = useState<string>('');
  const [dialogInputValue, setDialogInputValue] = useState('');
  const [dialogBaseLayoutId, setDialogBaseLayoutId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  /**
   * Show toast notification
   */
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      setToastMessage(message);
      setToastType(type);
      setToastVisible(true);
    }
  }, []);

  /**
   * Get layouts as array
   */
  const layouts = config ? Object.values(config.layouts) : [];

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Handle create layout
   */
  const handleCreateLayout = useCallback(() => {
    setDialogType('create');
    setDialogInputValue('');
    setDialogLayoutId('');
    setDialogBaseLayoutId(''); // Default to empty (will use DEFAULT_LAYOUT)
  }, []);

  /**
   * Handle rename layout
   */
  const handleRenameLayout = useCallback((layout: DashboardLayout) => {
    setDialogType('rename');
    setDialogLayoutId(layout.id);
    setDialogInputValue(layout.name);
  }, []);

  /**
   * Handle duplicate layout
   */
  const handleDuplicateLayout = useCallback((layout: DashboardLayout) => {
    setDialogType('duplicate');
    setDialogLayoutId(layout.id);
    setDialogInputValue(`${layout.name} 副本`);
  }, []);

  /**
   * Handle delete layout
   */
  const handleDeleteLayout = useCallback((layout: DashboardLayout) => {
    // Check if it's the last layout
    if (layouts.length <= 1) {
      Alert.alert('无法删除', '不能删除最后一个布局');
      return;
    }

    Alert.alert(
      '确认删除',
      `确定要删除布局"${layout.name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await deleteLayout(layout.id);
              showToast('布局已删除', 'success');
            } catch (error) {
              console.error('Failed to delete layout:', error);
              showToast(
                error instanceof Error ? error.message : '删除失败',
                'error'
              );
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  }, [layouts.length, deleteLayout, showToast]);

  /**
   * Handle select layout
   */
  const handleSelectLayout = useCallback(async (layoutId: string) => {
    if (layoutId === activeLayout?.id) return;

    try {
      setIsProcessing(true);
      await switchLayout(layoutId);
      showToast('已切换布局', 'success');
    } catch (error) {
      console.error('Failed to switch layout:', error);
      showToast(
        error instanceof Error ? error.message : '切换失败',
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  }, [activeLayout, switchLayout, showToast]);

  /**
   * Handle dialog confirm
   */
  const handleDialogConfirm = useCallback(async () => {
    if (!dialogInputValue.trim()) {
      Alert.alert('错误', '请输入布局名称');
      return;
    }

    try {
      setIsProcessing(true);

      switch (dialogType) {
        case 'create':
          const newLayoutId = await createLayout(
            dialogInputValue.trim(),
            dialogBaseLayoutId || undefined
          );
          showToast('布局已创建', 'success');
          // Auto-switch to the new layout
          if (newLayoutId) {
            await switchLayout(newLayoutId);
          }
          break;

        case 'rename':
          await renameLayout(dialogLayoutId, dialogInputValue.trim());
          showToast('布局已重命名', 'success');
          break;

        case 'duplicate':
          await duplicateLayout(dialogLayoutId, dialogInputValue.trim());
          showToast('布局已复制', 'success');
          break;
      }

      setDialogType(null);
      setDialogInputValue('');
      setDialogLayoutId('');
      setDialogBaseLayoutId('');
    } catch (error) {
      console.error('Dialog operation failed:', error);
      showToast(
        error instanceof Error ? error.message : '操作失败',
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  }, [dialogType, dialogInputValue, dialogLayoutId, dialogBaseLayoutId, createLayout, renameLayout, duplicateLayout, switchLayout, showToast]);

  /**
   * Handle dialog cancel
   */
  const handleDialogCancel = useCallback(() => {
    setDialogType(null);
    setDialogInputValue('');
    setDialogLayoutId('');
    setDialogBaseLayoutId('');
  }, []);

  /**
   * Get dialog title
   */
  const getDialogTitle = (): string => {
    switch (dialogType) {
      case 'create':
        return '新建布局';
      case 'rename':
        return '重命名布局';
      case 'duplicate':
        return '复制布局';
      default:
        return '';
    }
  };

  /**
   * Render layout list item
   */
  const renderLayoutItem = useCallback(({ item }: { item: DashboardLayout }) => {
    const isActive = item.id === activeLayout?.id;
    const visibleCardsCount = item.cards.filter(card => card.visible).length;

    return (
      <TouchableOpacity
        style={[
          styles.layoutItem,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
          isActive && { backgroundColor: colors.primary + '15' },
        ]}
        onPress={() => handleSelectLayout(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.layoutItemContent}>
          {/* Active indicator */}
          <View style={styles.layoutItemLeft}>
            {isActive && (
              <Text style={[styles.activeIndicator, { color: colors.primary }]}>✓</Text>
            )}
            {!isActive && <View style={styles.activeIndicatorPlaceholder} />}
            
            <View style={styles.layoutItemInfo}>
              <Text style={[styles.layoutName, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.layoutMeta, { color: colors.textSecondary }]}>
                {visibleCardsCount} 个可见卡片
              </Text>
              <Text style={[styles.layoutMeta, { color: colors.textSecondary }]}>
                最后编辑: {formatDate(item.updatedAt)}
              </Text>
            </View>
          </View>

          {/* More actions button */}
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => {
              Alert.alert(
                item.name,
                '选择操作',
                [
                  {
                    text: '重命名',
                    onPress: () => handleRenameLayout(item),
                  },
                  {
                    text: '复制',
                    onPress: () => handleDuplicateLayout(item),
                  },
                  {
                    text: '删除',
                    style: 'destructive',
                    onPress: () => handleDeleteLayout(item),
                  },
                  {
                    text: '取消',
                    style: 'cancel',
                  },
                ],
                { cancelable: true }
              );
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.moreIcon, { color: colors.textSecondary }]}>⋯</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [activeLayout, colors, handleSelectLayout, handleRenameLayout, handleDuplicateLayout, handleDeleteLayout]);

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={[styles.emptyText, { color: colors.text }]}>
        还没有布局
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
        点击右上角的 + 按钮创建新布局
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="返回"
          accessibilityRole="button"
        >
          <Text style={[styles.backIcon, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>布局管理</Text>
        
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateLayout}
          accessibilityLabel="新建布局"
          accessibilityRole="button"
        >
          <Text style={[styles.createIcon, { color: colors.primary }]}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Layout list */}
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <FlatList
        data={layouts}
        renderItem={renderLayoutItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={layouts.length === 0 ? styles.emptyListContent : undefined}
      />

      {/* Dialog Modal */}
      <Modal
        visible={dialogType !== null}
        transparent
        animationType="fade"
        onRequestClose={handleDialogCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {getDialogTitle()}
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={dialogInputValue}
              onChangeText={setDialogInputValue}
              placeholder="输入布局名称"
              placeholderTextColor={colors.textSecondary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleDialogConfirm}
            />

            {/* Base layout selector for create dialog */}
            {dialogType === 'create' && (
              <View style={styles.baseLayoutSection}>
                <Text style={[styles.baseLayoutLabel, { color: colors.text }]}>
                  基于现有布局（可选）
                </Text>
                <View style={[styles.baseLayoutPicker, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.baseLayoutButton}
                    onPress={() => {
                      Alert.alert(
                        '选择基础布局',
                        '选择一个现有布局作为模板',
                        [
                          {
                            text: '默认布局',
                            onPress: () => setDialogBaseLayoutId(''),
                          },
                          ...layouts.map(layout => ({
                            text: layout.name,
                            onPress: () => setDialogBaseLayoutId(layout.id),
                          })),
                          {
                            text: '取消',
                            style: 'cancel',
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={[styles.baseLayoutText, { color: colors.text }]}>
                      {dialogBaseLayoutId
                        ? layouts.find(l => l.id === dialogBaseLayoutId)?.name || '默认布局'
                        : '默认布局'}
                    </Text>
                    <Text style={[styles.baseLayoutArrow, { color: colors.textSecondary }]}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={handleDialogCancel}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  取消
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleDialogConfirm}
                disabled={isProcessing}
              >
                <Text style={[styles.modalButtonText, { color: colors.surface }]}>
                  确定
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast notification for iOS */}
      {Platform.OS === 'ios' && (
        <Toast
          message={toastMessage}
          visible={toastVisible}
          type={toastType}
          onHide={() => setToastVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    width: 44,
  },
  backIcon: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  createButton: {
    padding: 8,
    width: 44,
    alignItems: 'flex-end',
  },
  createIcon: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  layoutItem: {
    borderBottomWidth: 1,
  },
  layoutItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  layoutItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeIndicator: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 12,
    width: 24,
  },
  activeIndicatorPlaceholder: {
    width: 24,
    marginRight: 12,
  },
  layoutItemInfo: {
    flex: 1,
  },
  layoutName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  layoutMeta: {
    fontSize: 14,
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
    marginLeft: 8,
  },
  moreIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyListContent: {
    flex: 1,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  baseLayoutSection: {
    marginBottom: 24,
  },
  baseLayoutLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  baseLayoutPicker: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  baseLayoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  baseLayoutText: {
    fontSize: 16,
    flex: 1,
  },
  baseLayoutArrow: {
    fontSize: 12,
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LayoutManagerScreen;
