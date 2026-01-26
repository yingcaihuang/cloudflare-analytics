/**
 * CustomDashboardScreen
 * Main screen for custom dashboard with drag-and-drop card reordering
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  ToastAndroid,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DraggableFlatList, {
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { useTheme } from '../contexts/ThemeContext';
import { useDashboard } from '../contexts/DashboardContext';
import { DraggableMetricCard } from '../components/DraggableMetricCard';
import { LayoutSelector } from '../components/LayoutSelector';
import { Toast } from '../components/Toast';
import { MetricCard } from '../types/dashboard';

export const CustomDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const {
    config,
    activeLayout,
    isEditMode,
    isLoading,
    error,
    setEditMode,
    switchLayout,
    updateCardOrder,
    toggleCardVisibility,
    resetToDefault,
  } = useDashboard();

  const [refreshing, setRefreshing] = useState(false);
  const [startDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Last 7 days
    return date;
  });
  const [endDate] = useState(() => new Date());
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Animation for layout switching
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const previousLayoutId = useRef(activeLayout?.id);

  /**
   * Animate layout switch
   */
  useEffect(() => {
    if (activeLayout && previousLayoutId.current !== activeLayout.id) {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        // Update previous layout ID
        previousLayoutId.current = activeLayout.id;
        
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [activeLayout?.id, fadeAnim]);

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
   * Filter only visible cards and sort by order
   */
  const visibleCards = useMemo(() => {
    if (!activeLayout) return [];
    return activeLayout.cards
      .filter(card => card.visible)
      .sort((a, b) => a.order - b.order);
  }, [activeLayout]);

  /**
   * Toggle edit mode
   */
  const handleToggleEditMode = useCallback(() => {
    setEditMode(!isEditMode);
  }, [isEditMode, setEditMode]);

  /**
   * Navigate to layout manager
   */
  const handleNavigateToSettings = useCallback(() => {
    navigation.navigate('LayoutManager' as never);
  }, [navigation]);

  /**
   * Handle reset to default configuration
   */
  const handleResetToDefault = useCallback(async () => {
    try {
      await resetToDefault();
      showToast('已恢复默认配置', 'success');
    } catch (error) {
      console.error('Failed to reset to default:', error);
      showToast(
        error instanceof Error ? error.message : '恢复失败',
        'error'
      );
    }
  }, [resetToDefault, showToast]);

  /**
   * Handle layout selection from LayoutSelector
   */
  const handleSelectLayout = useCallback(async (layoutId: string) => {
    if (layoutId === activeLayout?.id) return;

    try {
      await switchLayout(layoutId);
      showToast('已切换布局', 'success');
    } catch (error) {
      console.error('Failed to switch layout:', error);
      showToast(
        error instanceof Error ? error.message : '切换失败',
        'error'
      );
    }
  }, [activeLayout, switchLayout, showToast]);

  /**
   * Handle drag end - update card order
   */
  const handleDragEnd = useCallback(async ({ data }: { data: MetricCard[] }) => {
    try {
      // Update order property for each card
      const updatedCards = data.map((card, index) => ({
        ...card,
        order: index,
      }));

      // Include hidden cards with their original order
      const hiddenCards = activeLayout?.cards.filter(card => !card.visible) || [];
      const allCards = [...updatedCards, ...hiddenCards];

      await updateCardOrder(allCards);
    } catch (error) {
      console.error('Failed to update card order:', error);
    }
  }, [activeLayout, updateCardOrder]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  /**
   * Handle toggle card visibility
   */
  const handleToggleVisibility = useCallback(async (cardId: string) => {
    try {
      // Find the card to get its current visibility state
      const card = activeLayout?.cards.find(c => c.id === cardId);
      if (!card) return;

      await toggleCardVisibility(cardId);
      
      // Show toast notification
      const message = card.visible ? '卡片已隐藏' : '卡片已显示';
      showToast(message, 'success');
    } catch (error) {
      console.error('Failed to toggle card visibility:', error);
      
      // Show error toast
      const errorMessage = error instanceof Error ? error.message : '切换失败';
      showToast(errorMessage, 'error');
    }
  }, [activeLayout, toggleCardVisibility, showToast]);

  /**
   * Render metric card
   */
  const renderCard = useCallback(
    (params: RenderItemParams<MetricCard>) => (
      <DraggableMetricCard
        {...params}
        isEditMode={isEditMode}
        onToggleVisibility={handleToggleVisibility}
        startDate={startDate}
        endDate={endDate}
      />
    ),
    [isEditMode, handleToggleVisibility, startDate, endDate]
  );

  /**
   * Key extractor for FlatList optimization
   */
  const keyExtractor = useCallback((item: MetricCard) => item.id, []);

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          加载配置中...
        </Text>
      </View>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorIcon]}>⚠️</Text>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={handleRefresh}
        >
          <Text style={[styles.retryButtonText, { color: colors.surface }]}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * Render empty state
   */
  if (!activeLayout || visibleCards.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>自定义仪表板</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleToggleEditMode}
            >
              <Text style={[styles.headerButtonText, { color: colors.primary }]}>
                {isEditMode ? '完成' : '编辑'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleResetToDefault}
            >
              <Text style={styles.settingsIcon}>🔄</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleNavigateToSettings}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.centerContent, { flex: 1 }]}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            没有可见的卡片
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            点击编辑按钮以显示卡片
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>自定义仪表板</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleToggleEditMode}
            accessibilityLabel={isEditMode ? '完成编辑' : '编辑仪表板'}
            accessibilityRole="button"
          >
            <Text style={[styles.headerButtonText, { color: colors.primary }]}>
              {isEditMode ? '完成' : '编辑'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleResetToDefault}
            accessibilityLabel="恢复默认值"
            accessibilityRole="button"
          >
            <Text style={styles.settingsIcon}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleNavigateToSettings}
            accessibilityLabel="设置"
            accessibilityRole="button"
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Layout Selector */}
      {config && (
        <LayoutSelector
          layouts={Object.values(config.layouts)}
          activeLayoutId={config.activeLayoutId}
          onSelectLayout={handleSelectLayout}
          onManageLayouts={handleNavigateToSettings}
        />
      )}

      {/* Edit mode hint */}
      {isEditMode && (
        <View style={[styles.editHint, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.editHintText, { color: colors.textSecondary }]}>
            长按拖拽以重新排序
          </Text>
        </View>
      )}

      {/* Draggable card list */}
      <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
        <DraggableFlatList
          data={visibleCards}
          renderItem={renderCard}
          keyExtractor={keyExtractor}
          onDragEnd={handleDragEnd}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          activationDistance={10}
          dragItemOverflow={true}
          containerStyle={styles.listContainer}
        />
      </Animated.View>

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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingsIcon: {
    fontSize: 24,
  },
  editHint: {
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  editHintText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: 8,
  },
  listContainer: {
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
});

export default CustomDashboardScreen;
