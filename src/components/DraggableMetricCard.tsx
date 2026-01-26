/**
 * DraggableMetricCard
 * A draggable metric card component with edit mode support
 */

import React, { useEffect, memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { MetricCard } from '../types/dashboard';
import { MetricCardContent } from './MetricCardContent';

interface DraggableMetricCardProps extends RenderItemParams<MetricCard> {
  isEditMode: boolean;
  onToggleVisibility: (cardId: string) => void;
  startDate: Date;
  endDate: Date;
}

const DraggableMetricCardComponent: React.FC<DraggableMetricCardProps> = ({
  item: card,
  drag,
  isActive,
  isEditMode,
  onToggleVisibility,
  startDate,
  endDate,
}) => {
  const { colors, isDark } = useTheme();

  // Animation values
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.1);
  const shakeOffset = useSharedValue(0);
  const opacity = useSharedValue(card.visible ? 1 : 0);

  // Visibility animation effect - fade in/out when visibility changes
  useEffect(() => {
    if (card.visible) {
      // Fade in animation
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      // Fade out animation
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [card.visible]);

  // Drag animation effect - optimized with withTiming for smoother transitions
  useEffect(() => {
    if (isActive) {
      scale.value = withSpring(1.05, {
        damping: 20,
        stiffness: 200,
      });
      shadowOpacity.value = withTiming(0.3, { duration: 200 });
    } else {
      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 200,
      });
      shadowOpacity.value = withTiming(0.1, { duration: 200 });
    }
  }, [isActive]);

  // Shake animation in edit mode - optimized for performance
  useEffect(() => {
    if (isEditMode) {
      shakeOffset.value = withRepeat(
        withSequence(
          withTiming(-1.5, { duration: 50 }),
          withTiming(1.5, { duration: 100 }),
          withTiming(0, { duration: 50 })
        ),
        -1,
        false
      );
    } else {
      shakeOffset.value = withTiming(0, { duration: 150 });
    }
  }, [isEditMode]);

  // Animated styles
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: shakeOffset.value },
    ],
    opacity: opacity.value,
  }));

  const animatedShadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: shadowOpacity.value,
  }));

  const handleToggleVisibility = () => {
    onToggleVisibility(card.id);
  };

  return (
    <ScaleDecorator>
      <Animated.View
        style={[
          animatedCardStyle,
          animatedShadowStyle,
          styles.cardWrapper,
        ]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: isDark ? '#000' : colors.shadow,
            },
          ]}
        >
          {/* Edit Mode Controls */}
          {isEditMode && (
            <View style={[styles.editControls, { borderBottomColor: colors.border }]}>
              {/* Drag Handle */}
              <TouchableOpacity
                onLongPress={drag}
                delayLongPress={500}
                style={styles.dragHandle}
                accessibilityLabel="拖拽手柄"
                accessibilityHint="长按以拖拽重新排序此卡片"
                accessibilityRole="button"
              >
                <View style={styles.dragHandleIcon}>
                  <View style={[styles.dragLine, { backgroundColor: colors.textSecondary }]} />
                  <View style={[styles.dragLine, { backgroundColor: colors.textSecondary }]} />
                  <View style={[styles.dragLine, { backgroundColor: colors.textSecondary }]} />
                </View>
              </TouchableOpacity>

              {/* Visibility Toggle */}
              <View style={styles.visibilityToggle}>
                <Switch
                  value={card.visible}
                  onValueChange={handleToggleVisibility}
                  trackColor={{
                    false: colors.border,
                    true: colors.primary,
                  }}
                  thumbColor={Platform.OS === 'ios' ? undefined : colors.surface}
                  ios_backgroundColor={colors.border}
                  accessibilityLabel={card.visible ? '隐藏卡片' : '显示卡片'}
                  accessibilityRole="switch"
                />
              </View>
            </View>
          )}

          {/* Card Content */}
          <View style={styles.content}>
            <MetricCardContent
              type={card.type}
              startDate={startDate}
              endDate={endDate}
            />
          </View>
        </View>
      </Animated.View>
    </ScaleDecorator>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const DraggableMetricCard = memo(DraggableMetricCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.visible === nextProps.item.visible &&
    prevProps.item.order === nextProps.item.order &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isEditMode === nextProps.isEditMode &&
    prevProps.startDate.getTime() === nextProps.startDate.getTime() &&
    prevProps.endDate.getTime() === nextProps.endDate.getTime()
  );
});

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    // Elevation for Android
    elevation: 2,
  },
  editControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dragHandle: {
    padding: 8,
    marginLeft: -8,
  },
  dragHandleIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragLine: {
    width: 20,
    height: 2,
    borderRadius: 1,
    marginVertical: 2,
  },
  visibilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
});
