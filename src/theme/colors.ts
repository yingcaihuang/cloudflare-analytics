/**
 * Color Definitions for Light and Dark Themes
 */

export interface ColorScheme {
  // Background colors
  background: string;
  surface: string;
  card: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textDisabled: string;
  
  // Theme colors
  primary: string;
  secondary: string;
  accent: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Border and divider
  border: string;
  divider: string;
  
  // Chart colors
  chartColors: string[];
  chartBackground: string;
  chartGrid: string;
  chartLabel: string;
  
  // Special colors
  shadow: string;
  overlay: string;
}

/**
 * Light Theme Colors
 */
export const lightColors: ColorScheme = {
  // Background colors
  background: '#f5f5f5',
  surface: '#ffffff',
  card: '#ffffff',
  
  // Text colors
  text: '#333333',
  textSecondary: '#666666',
  textDisabled: '#999999',
  
  // Theme colors
  primary: '#f6821f',
  secondary: '#0066cc',
  accent: '#2ecc71',
  
  // Status colors
  success: '#2ecc71',
  warning: '#f39c12',
  error: '#e74c3c',
  info: '#3498db',
  
  // Border and divider
  border: '#e0e0e0',
  divider: '#e0e0e0',
  
  // Chart colors
  chartColors: [
    '#2280b0',
    '#f6821f',
    '#2ecc71',
    '#e74c3c',
    '#9b59b6',
    '#3498db',
  ],
  chartBackground: '#ffffff',
  chartGrid: '#e3e3e3',
  chartLabel: '#000000',
  
  // Special colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

/**
 * Dark Theme Colors
 */
export const darkColors: ColorScheme = {
  // Background colors
  background: '#121212',
  surface: '#1e1e1e',
  card: '#2a2a2a',
  
  // Text colors
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  textDisabled: '#666666',
  
  // Theme colors
  primary: '#ff9d4d',
  secondary: '#4d9fff',
  accent: '#4dff88',
  
  // Status colors
  success: '#4dff88',
  warning: '#ffb84d',
  error: '#ff6b6b',
  info: '#4d9fff',
  
  // Border and divider
  border: '#3a3a3a',
  divider: '#3a3a3a',
  
  // Chart colors
  chartColors: [
    '#4d9fff',
    '#ff9d4d',
    '#4dff88',
    '#ff6b6b',
    '#c084fc',
    '#60a5fa',
  ],
  chartBackground: '#2a2a2a',
  chartGrid: '#3a3a3a',
  chartLabel: '#ffffff',
  
  // Special colors
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
};
