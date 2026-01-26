/**
 * LayoutSelector Component
 * Dropdown selector for switching between dashboard layouts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { DashboardLayout } from '../types/dashboard';

/**
 * LayoutSelector Props
 */
export interface LayoutSelectorProps {
  layouts: DashboardLayout[];
  activeLayoutId: string;
  onSelectLayout: (layoutId: string) => void;
  onManageLayouts: () => void;
}

/**
 * LayoutSelector Component
 */
export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  layouts,
  activeLayoutId,
  onSelectLayout,
  onManageLayouts,
}) => {
  const { colors } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Get active layout
  const activeLayout = layouts.find(layout => layout.id === activeLayoutId);

  /**
   * Handle layout selection
   */
  const handleSelectLayout = (layoutId: string) => {
    setIsModalVisible(false);
    onSelectLayout(layoutId);
  };

  /**
   * Handle manage layouts button
   */
  const handleManageLayouts = () => {
    setIsModalVisible(false);
    onManageLayouts();
  };

  /**
   * Render layout item
   */
  const renderLayoutItem = ({ item }: { item: DashboardLayout }) => {
    const isActive = item.id === activeLayoutId;
    const itemVisibleCardsCount = item.cards.filter(card => card.visible).length;

    return (
      <TouchableOpacity
        style={[
          styles.layoutItem,
          {
            backgroundColor: isActive ? colors.primary + '15' : 'transparent',
            borderBottomColor: colors.border,
          },
        ]}
        onPress={() => handleSelectLayout(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`选择布局 ${item.name}`}
        accessibilityHint={`包含 ${itemVisibleCardsCount} 个可见卡片`}
        accessibilityState={{ selected: isActive }}
      >
        <View style={styles.layoutItemContent}>
          <View style={styles.layoutItemLeft}>
            <Text
              style={[
                styles.layoutName,
                {
                  color: isActive ? colors.primary : colors.text,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
            >
              {item.name}
            </Text>
            <Text style={[styles.layoutInfo, { color: colors.textSecondary }]}>
              {itemVisibleCardsCount} 个卡片
            </Text>
          </View>
          {isActive && (
            <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* Selector Button */}
      <TouchableOpacity
        style={[styles.selectorButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setIsModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="选择布局"
        accessibilityHint="点击打开布局选择器"
      >
        <View style={styles.selectorContent}>
          <View style={styles.selectorLeft}>
            <Text style={[styles.iconText, { color: colors.primary }]}>⊞</Text>
            <View style={styles.selectorTextContainer}>
              <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>
                布局
              </Text>
              <Text style={[styles.selectorValue, { color: colors.text }]}>
                {activeLayout?.name || '未知布局'}
              </Text>
            </View>
          </View>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>▼</Text>
        </View>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsModalVisible(false)}
          accessibilityRole="button"
          accessibilityLabel="关闭布局选择器"
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                选择布局
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="关闭"
              >
                <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Layout List */}
            <FlatList
              data={layouts}
              renderItem={renderLayoutItem}
              keyExtractor={(item) => item.id}
              style={styles.layoutList}
              contentContainerStyle={styles.layoutListContent}
            />

            {/* Manage Layouts Button */}
            <TouchableOpacity
              style={[styles.manageButton, { backgroundColor: colors.primary }]}
              onPress={handleManageLayouts}
              accessibilityRole="button"
              accessibilityLabel="管理布局"
              accessibilityHint="打开布局管理界面"
            >
              <Text style={styles.manageButtonIcon}>⚙️</Text>
              <Text style={styles.manageButtonText}>管理布局</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Selector Button
  selectorButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chevron: {
    fontSize: 12,
  },
  selectorTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  selectorLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Layout List
  layoutList: {
    maxHeight: 300,
  },
  layoutListContent: {
    paddingVertical: 8,
  },
  layoutItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  layoutItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  layoutItemLeft: {
    flex: 1,
  },
  layoutName: {
    fontSize: 16,
    marginBottom: 4,
  },
  layoutInfo: {
    fontSize: 13,
  },
  checkmark: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Manage Button
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 14,
    borderRadius: 10,
  },
  manageButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
