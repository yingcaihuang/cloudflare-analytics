/**
 * DashboardConfigManager
 * Manages dashboard configuration persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DashboardConfig,
  DashboardLayout,
  MetricCard,
  DEFAULT_LAYOUT,
} from '../types/dashboard';

export class DashboardConfigManager {
  private static STORAGE_KEY = '@cloudflare_analytics:dashboard_config';
  private static CONFIG_VERSION = '1.0.0';

  /**
   * 加载配置
   */
  static async loadConfig(): Promise<DashboardConfig> {
    try {
      const saved = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (!saved) {
        // 返回默认配置
        return this.getDefaultConfig();
      }

      const config = JSON.parse(saved);
      
      // 验证配置
      if (!this.validateConfig(config)) {
        console.warn('Invalid config, using default');
        return this.getDefaultConfig();
      }

      // 迁移配置（如果需要）
      return this.migrateConfig(config);
    } catch (error) {
      console.error('Failed to load dashboard config:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * 保存配置
   */
  static async saveConfig(config: DashboardConfig): Promise<void> {
    try {
      const json = JSON.stringify(config);
      await AsyncStorage.setItem(this.STORAGE_KEY, json);
    } catch (error) {
      console.error('Failed to save dashboard config:', error);
      throw new Error('保存配置失败');
    }
  }

  /**
   * 创建新布局
   */
  static async createLayout(
    config: DashboardConfig,
    name: string,
    basedOn?: string
  ): Promise<DashboardConfig> {
    const baseLayout = basedOn
      ? config.layouts[basedOn]
      : DEFAULT_LAYOUT;

    if (!baseLayout) {
      throw new Error('基础布局不存在');
    }

    const newId = `layout_${Date.now()}`;
    const newLayout: DashboardLayout = {
      id: newId,
      name,
      cards: JSON.parse(JSON.stringify(baseLayout.cards)), // 深拷贝
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newConfig: DashboardConfig = {
      ...config,
      layouts: {
        ...config.layouts,
        [newId]: newLayout,
      },
    };

    await this.saveConfig(newConfig);
    return newConfig;
  }

  /**
   * 删除布局
   */
  static async deleteLayout(
    config: DashboardConfig,
    layoutId: string
  ): Promise<DashboardConfig> {
    const layoutCount = Object.keys(config.layouts).length;
    
    if (layoutCount <= 1) {
      throw new Error('不能删除最后一个布局');
    }

    if (!config.layouts[layoutId]) {
      throw new Error('布局不存在');
    }

    const { [layoutId]: removed, ...remainingLayouts } = config.layouts;
    
    // 如果删除的是当前布局，切换到第一个布局
    let newActiveLayoutId = config.activeLayoutId;
    if (layoutId === config.activeLayoutId) {
      newActiveLayoutId = Object.keys(remainingLayouts)[0];
    }

    const newConfig: DashboardConfig = {
      ...config,
      layouts: remainingLayouts,
      activeLayoutId: newActiveLayoutId,
    };

    await this.saveConfig(newConfig);
    return newConfig;
  }

  /**
   * 重命名布局
   */
  static async renameLayout(
    config: DashboardConfig,
    layoutId: string,
    newName: string
  ): Promise<DashboardConfig> {
    const layout = config.layouts[layoutId];
    
    if (!layout) {
      throw new Error('布局不存在');
    }

    const updatedLayout: DashboardLayout = {
      ...layout,
      name: newName,
      updatedAt: new Date().toISOString(),
    };

    const newConfig: DashboardConfig = {
      ...config,
      layouts: {
        ...config.layouts,
        [layoutId]: updatedLayout,
      },
    };

    await this.saveConfig(newConfig);
    return newConfig;
  }

  /**
   * 复制布局
   */
  static async duplicateLayout(
    config: DashboardConfig,
    layoutId: string,
    newName: string
  ): Promise<DashboardConfig> {
    const layout = config.layouts[layoutId];
    
    if (!layout) {
      throw new Error('布局不存在');
    }

    return this.createLayout(config, newName, layoutId);
  }

  /**
   * 更新卡片顺序
   */
  static async updateCardOrder(
    config: DashboardConfig,
    layoutId: string,
    cards: MetricCard[]
  ): Promise<DashboardConfig> {
    const layout = config.layouts[layoutId];
    
    if (!layout) {
      throw new Error('布局不存在');
    }

    // 更新卡片顺序
    const updatedCards = cards.map((card, index) => ({
      ...card,
      order: index,
    }));

    const updatedLayout: DashboardLayout = {
      ...layout,
      cards: updatedCards,
      updatedAt: new Date().toISOString(),
    };

    const newConfig: DashboardConfig = {
      ...config,
      layouts: {
        ...config.layouts,
        [layoutId]: updatedLayout,
      },
    };

    await this.saveConfig(newConfig);
    return newConfig;
  }

  /**
   * 切换卡片可见性
   */
  static async toggleCardVisibility(
    config: DashboardConfig,
    layoutId: string,
    cardId: string
  ): Promise<DashboardConfig> {
    const layout = config.layouts[layoutId];
    
    if (!layout) {
      throw new Error('布局不存在');
    }

    const cardIndex = layout.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      throw new Error('卡片不存在');
    }

    const card = layout.cards[cardIndex];
    
    // 检查是否至少保留一个可见卡片
    const visibleCount = layout.cards.filter(c => c.visible).length;
    if (card.visible && visibleCount <= 1) {
      throw new Error('至少需要保留一个可见卡片');
    }

    const updatedCards = [...layout.cards];
    updatedCards[cardIndex] = {
      ...card,
      visible: !card.visible,
    };

    const updatedLayout: DashboardLayout = {
      ...layout,
      cards: updatedCards,
      updatedAt: new Date().toISOString(),
    };

    const newConfig: DashboardConfig = {
      ...config,
      layouts: {
        ...config.layouts,
        [layoutId]: updatedLayout,
      },
    };

    await this.saveConfig(newConfig);
    return newConfig;
  }

  /**
   * 重置为默认配置
   */
  static async resetToDefault(): Promise<DashboardConfig> {
    const defaultConfig = this.getDefaultConfig();
    await this.saveConfig(defaultConfig);
    return defaultConfig;
  }

  /**
   * 获取默认配置
   */
  private static getDefaultConfig(): DashboardConfig {
    return {
      layouts: {
        default: DEFAULT_LAYOUT,
      },
      activeLayoutId: 'default',
      version: this.CONFIG_VERSION,
    };
  }

  /**
   * 验证配置
   */
  private static validateConfig(config: any): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }

    if (!config.layouts || typeof config.layouts !== 'object') {
      return false;
    }

    if (!config.activeLayoutId || typeof config.activeLayoutId !== 'string') {
      return false;
    }

    if (!config.layouts[config.activeLayoutId]) {
      return false;
    }

    // 验证每个布局
    for (const layoutId in config.layouts) {
      const layout = config.layouts[layoutId];
      
      if (!layout.id || !layout.name || !Array.isArray(layout.cards)) {
        return false;
      }

      // 验证卡片
      for (const card of layout.cards) {
        if (!card.id || !card.type || typeof card.visible !== 'boolean') {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 迁移旧版本配置
   */
  private static migrateConfig(config: any): DashboardConfig {
    // 如果版本相同，直接返回
    if (config.version === this.CONFIG_VERSION) {
      return config;
    }

    // 这里可以添加版本迁移逻辑
    console.log('Migrating config from', config.version, 'to', this.CONFIG_VERSION);

    return {
      ...config,
      version: this.CONFIG_VERSION,
    };
  }
}
