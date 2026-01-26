/**
 * DashboardContext
 * Manages custom dashboard configuration and state
 */

import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback, ReactNode } from 'react';
import {
  DashboardConfig,
  DashboardLayout,
  MetricCard,
} from '../types/dashboard';
import { DashboardConfigManager } from '../services/DashboardConfigManager';

/**
 * Dashboard Context Type
 */
interface DashboardContextType {
  // State
  config: DashboardConfig | null;
  activeLayout: DashboardLayout | null;
  isEditMode: boolean;
  isLoading: boolean;
  error: string | null;

  // Layout operations
  switchLayout: (layoutId: string) => Promise<void>;
  createLayout: (name: string, basedOn?: string) => Promise<string>;
  deleteLayout: (layoutId: string) => Promise<void>;
  renameLayout: (layoutId: string, newName: string) => Promise<void>;
  duplicateLayout: (layoutId: string, newName: string) => Promise<string>;

  // Card operations
  updateCardOrder: (cards: MetricCard[]) => Promise<void>;
  toggleCardVisibility: (cardId: string) => Promise<void>;
  resetToDefault: () => Promise<void>;

  // Edit mode
  setEditMode: (enabled: boolean) => void;

  // Refresh
  refreshConfig: () => Promise<void>;
}

/**
 * Dashboard State
 */
interface DashboardState {
  config: DashboardConfig | null;
  isEditMode: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Dashboard Actions
 */
type DashboardAction =
  | { type: 'SET_CONFIG'; payload: DashboardConfig }
  | { type: 'SET_EDIT_MODE'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_LAYOUT'; payload: DashboardLayout }
  | { type: 'SWITCH_LAYOUT'; payload: string };

/**
 * Dashboard Reducer
 */
const dashboardReducer = (
  state: DashboardState,
  action: DashboardAction
): DashboardState => {
  switch (action.type) {
    case 'SET_CONFIG':
      return {
        ...state,
        config: action.payload,
        isLoading: false,
        error: null,
      };

    case 'SET_EDIT_MODE':
      return {
        ...state,
        isEditMode: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'UPDATE_LAYOUT':
      if (!state.config) return state;
      return {
        ...state,
        config: {
          ...state.config,
          layouts: {
            ...state.config.layouts,
            [action.payload.id]: action.payload,
          },
        },
      };

    case 'SWITCH_LAYOUT':
      if (!state.config) return state;
      return {
        ...state,
        config: {
          ...state.config,
          activeLayoutId: action.payload,
        },
      };

    default:
      return state;
  }
};

/**
 * Initial State
 */
const initialState: DashboardState = {
  config: null,
  isEditMode: false,
  isLoading: true,
  error: null,
};

/**
 * Dashboard Context
 */
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

/**
 * Dashboard Provider Props
 */
interface DashboardProviderProps {
  children: ReactNode;
}

/**
 * Dashboard Provider Component
 */
export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  /**
   * Load configuration on mount
   */
  useEffect(() => {
    loadConfig();
  }, []);

  /**
   * Load configuration from storage
   */
  const loadConfig = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const config = await DashboardConfigManager.loadConfig();
      dispatch({ type: 'SET_CONFIG', payload: config });
    } catch (error) {
      console.error('Failed to load dashboard config:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : '加载配置失败',
      });
    }
  };

  /**
   * Get active layout - memoized with stable dependencies
   */
  const activeLayoutId = state.config?.activeLayoutId;
  const layouts = state.config?.layouts;
  
  const activeLayout = useMemo((): DashboardLayout | null => {
    if (!layouts || !activeLayoutId) return null;
    return layouts[activeLayoutId] || null;
  }, [activeLayoutId, layouts]);

  /**
   * Switch to a different layout
   */
  const switchLayout = useCallback(async (layoutId: string): Promise<void> => {
    try {
      if (!state.config) {
        throw new Error('配置未加载');
      }

      if (!state.config.layouts[layoutId]) {
        throw new Error('布局不存在');
      }

      // Optimistic update
      dispatch({ type: 'SWITCH_LAYOUT', payload: layoutId });

      // Persist to storage
      const newConfig: DashboardConfig = {
        ...state.config,
        activeLayoutId: layoutId,
      };
      await DashboardConfigManager.saveConfig(newConfig);
    } catch (error) {
      console.error('Failed to switch layout:', error);
      // Rollback on error
      await loadConfig();
      throw error;
    }
  }, [state.config]);

  /**
   * Create a new layout
   */
  const createLayout = async (name: string, basedOn?: string): Promise<string> => {
    try {
      if (!state.config) {
        throw new Error('配置未加载');
      }

      const newConfig = await DashboardConfigManager.createLayout(
        state.config,
        name,
        basedOn
      );

      dispatch({ type: 'SET_CONFIG', payload: newConfig });

      // Return the new layout ID
      const newLayoutId = Object.keys(newConfig.layouts).find(
        id => !state.config!.layouts[id]
      );
      return newLayoutId || '';
    } catch (error) {
      console.error('Failed to create layout:', error);
      throw error;
    }
  };

  /**
   * Delete a layout
   */
  const deleteLayout = async (layoutId: string): Promise<void> => {
    try {
      if (!state.config) {
        throw new Error('配置未加载');
      }

      const newConfig = await DashboardConfigManager.deleteLayout(
        state.config,
        layoutId
      );

      dispatch({ type: 'SET_CONFIG', payload: newConfig });
    } catch (error) {
      console.error('Failed to delete layout:', error);
      throw error;
    }
  };

  /**
   * Rename a layout
   */
  const renameLayout = async (layoutId: string, newName: string): Promise<void> => {
    try {
      if (!state.config) {
        throw new Error('配置未加载');
      }

      const newConfig = await DashboardConfigManager.renameLayout(
        state.config,
        layoutId,
        newName
      );

      dispatch({ type: 'SET_CONFIG', payload: newConfig });
    } catch (error) {
      console.error('Failed to rename layout:', error);
      throw error;
    }
  };

  /**
   * Duplicate a layout
   */
  const duplicateLayout = async (layoutId: string, newName: string): Promise<string> => {
    try {
      if (!state.config) {
        throw new Error('配置未加载');
      }

      const newConfig = await DashboardConfigManager.duplicateLayout(
        state.config,
        layoutId,
        newName
      );

      dispatch({ type: 'SET_CONFIG', payload: newConfig });

      // Return the new layout ID
      const newLayoutId = Object.keys(newConfig.layouts).find(
        id => !state.config!.layouts[id]
      );
      return newLayoutId || '';
    } catch (error) {
      console.error('Failed to duplicate layout:', error);
      throw error;
    }
  };

  /**
   * Update card order in the active layout
   */
  const updateCardOrder = async (cards: MetricCard[]): Promise<void> => {
    try {
      if (!state.config) {
        throw new Error('配置未加载');
      }

      const activeLayoutId = state.config.activeLayoutId;
      const newConfig = await DashboardConfigManager.updateCardOrder(
        state.config,
        activeLayoutId,
        cards
      );

      dispatch({ type: 'SET_CONFIG', payload: newConfig });
    } catch (error) {
      console.error('Failed to update card order:', error);
      // Rollback on error
      await refreshConfig();
      throw error;
    }
  };

  /**
   * Toggle card visibility in the active layout
   */
  const toggleCardVisibility = async (cardId: string): Promise<void> => {
    try {
      if (!state.config) {
        throw new Error('配置未加载');
      }

      const activeLayoutId = state.config.activeLayoutId;
      const newConfig = await DashboardConfigManager.toggleCardVisibility(
        state.config,
        activeLayoutId,
        cardId
      );

      dispatch({ type: 'SET_CONFIG', payload: newConfig });
    } catch (error) {
      console.error('Failed to toggle card visibility:', error);
      // Rollback on error
      await refreshConfig();
      throw error;
    }
  };

  /**
   * Reset to default configuration
   */
  const resetToDefault = async (): Promise<void> => {
    try {
      const defaultConfig = await DashboardConfigManager.resetToDefault();
      dispatch({ type: 'SET_CONFIG', payload: defaultConfig });
    } catch (error) {
      console.error('Failed to reset to default:', error);
      throw error;
    }
  };

  /**
   * Set edit mode
   */
  const setEditMode = (enabled: boolean): void => {
    dispatch({ type: 'SET_EDIT_MODE', payload: enabled });
  };

  /**
   * Refresh configuration from storage
   */
  const refreshConfig = async (): Promise<void> => {
    await loadConfig();
  };

  const value: DashboardContextType = {
    // State
    config: state.config,
    activeLayout,
    isEditMode: state.isEditMode,
    isLoading: state.isLoading,
    error: state.error,

    // Layout operations
    switchLayout,
    createLayout,
    deleteLayout,
    renameLayout,
    duplicateLayout,

    // Card operations
    updateCardOrder,
    toggleCardVisibility,
    resetToDefault,

    // Edit mode
    setEditMode,

    // Refresh
    refreshConfig,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

/**
 * Hook to use Dashboard context
 */
export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
