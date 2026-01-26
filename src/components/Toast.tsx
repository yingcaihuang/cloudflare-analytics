/**
 * Toast Component
 * Cross-platform toast notification component
 */

import React, { useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export interface ToastProps {
  message: string;
  visible: boolean;
  duration?: number;
  onHide?: () => void;
  type?: 'success' | 'error' | 'info';
}

export const Toast: React.FC<ToastProps> = ({
  message,
  visible,
  duration = 2000,
  onHide,
  type = 'info',
}) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const isVisible = useRef(false);

  useEffect(() => {
    if (visible) {
      isVisible.current = true;
      // Show animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => {
        clearTimeout(timer);
      };
    }
    
    hideToast();
    return undefined;
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 50,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isVisible.current = false;
      if (onHide) {
        onHide();
      }
    });
  };

  if (!visible && !isVisible.current) {
    return null;
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'info':
      default:
        return colors.surface;
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
      case 'error':
        return '#FFFFFF';
      case 'info':
      default:
        return colors.text;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      <Text style={[styles.message, { color: getTextColor() }]}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 20,
    right: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
