/**
 * ThemeContext
 * Manages application theme (light/dark mode)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ColorScheme } from '../theme/colors';

type ThemeMode = 'light' | 'dark';
type ColorSchemePreference = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: ThemeMode;
  colorScheme: ColorSchemePreference;
  colors: ColorScheme;
  isDark: boolean;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorSchemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@cloudflare_analytics:theme_preference';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [colorScheme, setColorSchemeState] = useState<ColorSchemePreference>('auto');
  const [theme, setTheme] = useState<ThemeMode>('light');

  /**
   * Load saved theme preference from storage
   */
  useEffect(() => {
    loadThemePreference();
  }, []);

  /**
   * Listen to system theme changes when in auto mode
   */
  useEffect(() => {
    if (colorScheme === 'auto') {
      const subscription = Appearance.addChangeListener(({ colorScheme: systemScheme }) => {
        setTheme(systemScheme === 'dark' ? 'dark' : 'light');
      });

      // Set initial theme based on system
      const systemScheme = Appearance.getColorScheme();
      setTheme(systemScheme === 'dark' ? 'dark' : 'light');

      return () => {
        subscription.remove();
      };
    } else {
      // Use manual preference
      setTheme(colorScheme);
    }
  }, [colorScheme]);

  /**
   * Load theme preference from AsyncStorage
   */
  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        const preference = saved as ColorSchemePreference;
        setColorSchemeState(preference);
        
        if (preference === 'auto') {
          const systemScheme = Appearance.getColorScheme();
          setTheme(systemScheme === 'dark' ? 'dark' : 'light');
        } else {
          setTheme(preference);
        }
      } else {
        // Default to auto mode
        const systemScheme = Appearance.getColorScheme();
        setTheme(systemScheme === 'dark' ? 'dark' : 'light');
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  /**
   * Save theme preference to AsyncStorage
   */
  const saveThemePreference = async (preference: ColorSchemePreference) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  /**
   * Toggle between light and dark theme
   */
  const toggleTheme = () => {
    const newTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setColorSchemeState(newTheme);
    saveThemePreference(newTheme);
  };

  /**
   * Set color scheme preference
   */
  const setColorScheme = (scheme: ColorSchemePreference) => {
    setColorSchemeState(scheme);
    saveThemePreference(scheme);

    if (scheme === 'auto') {
      const systemScheme = Appearance.getColorScheme();
      setTheme(systemScheme === 'dark' ? 'dark' : 'light');
    } else {
      setTheme(scheme);
    }
  };

  const colors = theme === 'dark' ? darkColors : lightColors;
  const isDark = theme === 'dark';

  const value: ThemeContextType = {
    theme,
    colorScheme,
    colors,
    isDark,
    toggleTheme,
    setColorScheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
