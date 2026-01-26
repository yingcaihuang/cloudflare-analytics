/**
 * Toast Utility
 * Simple toast notification system for React Native
 */

import { Platform, ToastAndroid } from 'react-native';

export type ToastDuration = 'short' | 'long';

/**
 * Show a toast message
 * On Android: Uses native ToastAndroid
 * On iOS: Uses a custom implementation (to be added if needed)
 */
export const showToast = (message: string, duration: ToastDuration = 'short'): void => {
  if (Platform.OS === 'android') {
    const toastDuration = duration === 'short' 
      ? ToastAndroid.SHORT 
      : ToastAndroid.LONG;
    ToastAndroid.show(message, toastDuration);
  } else {
    // For iOS, we'll use a simple console log for now
    // In a production app, you might want to use a library like react-native-toast-message
    console.log(`Toast: ${message}`);
  }
};

/**
 * Show a success toast
 */
export const showSuccessToast = (message: string): void => {
  showToast(message, 'short');
};

/**
 * Show an error toast
 */
export const showErrorToast = (message: string): void => {
  showToast(message, 'long');
};

/**
 * Show an info toast
 */
export const showInfoToast = (message: string): void => {
  showToast(message, 'short');
};
