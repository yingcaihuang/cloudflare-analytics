/**
 * DashboardConfigManager Unit Tests
 * Tests for dashboard configuration management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DashboardConfigManager } from '../DashboardConfigManager';
import {
  DashboardConfig,
  DashboardLayout,
  MetricCard,
  DEFAULT_LAYOUT,
  DEFAULT_METRIC_CARDS,
} from '../../types/dashboard';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('DashboardConfigManager', () => {
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('loadConfig()', () => {
    it('should return default config when no saved config exists', async () => {
      // Arrange
      mockAsyncStorage.getItem.mockResolvedValue(null);

      // Act
      const config = await DashboardConfigManager.loadConfig();

      // Assert
      expect(config).toBeDefined();
      expect(config.layouts).toBeDefined();
      expect(config.layouts.default).toBeDefined();
      expect(config.activeLayoutId).toBe('default');
      expect(config.version).toBe('1.0.0');
      expect(config.layouts.default.cards).toHaveLength(DEFAULT_METRIC_CARDS.length);
    });

    it('should load and return saved config', async () => {
      // Arrange
      const savedConfig: DashboardConfig = {
        layouts: {
          custom: {
            id: 'custom',
            name: 'Custom Layout',
            cards: [
              { id: 'total_requests', type: 'total_requests', visible: true, order: 0 },
              { id: 'bandwidth', type: 'bandwidth', visible: true, order: 1 },
            ],
            createdAt: '2026-01-26T00:00:00.000Z',
            updatedAt: '2026-01-26T00:00:00.000Z',
          },
        },
        activeLayoutId: 'custom',
        version: '1.0.0',
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedConfig));

      // Act
      const config = await DashboardConfigManager.loadConfig();

      // Assert
      expect(config).toEqual(savedConfig);
      expect(config.activeLayoutId).toBe('custom');
      expect(config.layouts.custom.cards).toHaveLength(2);
    });

    it('should return default config when saved config is invalid', async () => {
      // Arrange
      const invalidConfig = { invalid: 'data' };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(invalidConfig));

      // Act
      const config = await DashboardConfigManager.loadConfig();

      // Assert
      expect(config.layouts.default).toBeDefined();
      expect(config.activeLayoutId).toBe('default');
    });

    it('should return default config when AsyncStorage throws error', async () => {
      // Arrange
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      // Act
      const config = await DashboardConfigManager.loadConfig();

      // Assert
      expect(config.layouts.default).toBeDefined();
      expect(config.activeLayoutId).toBe('default');
    });
  });

  describe('saveConfig()', () => {
    it('should save config to AsyncStorage', async () => {
      // Arrange
      const config: DashboardConfig = {
        layouts: {
          default: DEFAULT_LAYOUT,
        },
        activeLayoutId: 'default',
        version: '1.0.0',
      };
      mockAsyncStorage.setItem.mockResolvedValue();

      // Act
      await DashboardConfigManager.saveConfig(config);

      // Assert
      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(1);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@cloudflare_analytics:dashboard_config',
        JSON.stringify(config)
      );
    });

    it('should throw error when AsyncStorage fails', async () => {
      // Arrange
      const config: DashboardConfig = {
        layouts: { default: DEFAULT_LAYOUT },
        activeLayoutId: 'default',
        version: '1.0.0',
      };
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage full'));

      // Act & Assert
      await expect(DashboardConfigManager.saveConfig(config)).rejects.toThrow('保存配置失败');
    });
  });

  describe('createLayout()', () => {
    it('should create new layout based on default', async () => {
      // Arrange
      const config: DashboardConfig = {
        layouts: { default: DEFAULT_LAYOUT },
        activeLayoutId: 'default',
        version: '1.0.0',
      };
      mockAsyncStorage.setItem.mockResolvedValue();

      // Act
      const newConfig = await DashboardConfigManager.createLayout(config, 'My Layout');

      // Assert
      expect(Object.keys(newConfig.layouts)).toHaveLength(2);
      const newLayoutId = Object.keys(newConfig.layouts).find(id => id !== 'default');
      expect(newLayoutId).toBeDefined();
      const newLayout = newConfig.layouts[newLayoutId!];
      expect(newLayout.name).toBe('My Layout');
      expect(newLayout.cards).toHaveLength(DEFAULT_LAYOUT.cards.length);
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should create new layout based on existing layout', async () => {
      // Arrange
      const customLayout: DashboardLayout = {
        id: 'custom',
        name: 'Custom',
        cards: [
          { id: 'total_requests', type: 'total_requests', visible: true, order: 0 },
        ],
        createdAt: '2026-01-26T00:00:00.000Z',
        updatedAt: '2026-01-26T00:00:00.000Z',
      };
      const config: DashboardConfig = {
        layouts: {
          default: DEFAULT_LAYOUT,
          custom: customLayout,
        },
        activeLayoutId: 'default',
        version: '1.0.0',
      };
      mockAsyncStorage.setItem.mockResolvedValue();

      // Act
      const newConfig = await DashboardConfigManager.createLayout(
        config,
        'Based on Custom',
        'custom'
      );

      // Assert
      expect(Object.keys(newConfig.layouts)).toHaveLength(3);
      const newLayoutId = Object.keys(newConfig.layouts).find(
        id => id !== 'default' && id !== 'custom'
      );
      const newLayout = newConfig.layouts[newLayoutId!];
      expect(newLayout.name).toBe('Based on Custom');
      expect(newLayout.cards).toHaveLength(1);
    });

    it('should throw error when base layout does not exist', async () => {
      // Arrange
      const config: DashboardConfig = {
        layouts: { default: DEFAULT_LAYOUT },
        activeLayoutId: 'default',
        version: '1.0.0',
      };

      // Act & Assert
      await expect(
        DashboardConfigManager.createLayout(config, 'New Layout', 'nonexistent')
      ).rejects.toThrow('基础布局不存在');
    });
  });

  describe('deleteLayout()', () => {
    it('should delete layout successfully', async () => {
      // Arrange
      const config: DashboardConfig = {
        layouts: {
          default: DEFAULT_LAYOUT,
          custom: {
            id: 'custom',
            name: 'Custom',
            cards: [],
            createdAt: '2026-01-26T00:00:00.000Z',
            updatedAt: '2026-01-26T00:00:00.000Z',
          },
        },
        activeLayoutId: 'default',
        version: '1.0.0',
      };
      mockAsyncStorage.setItem.mockResolvedValue();

      // Act
      const newConfig = await DashboardConfigManager.deleteLayout(config, 'custom');

      // Assert
      expect(Object.keys(newConfig.layouts)).toHaveLength(1);
      expect(newConfig.layouts.custom).toBeUndefined();
      expect(newConfig.layouts.default).toBeDefined();
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should throw error when trying to delete last layout', async () => {
      // Arrange
      const config: DashboardConfig = {
        layouts: { default: DEFAULT_LAYOUT },
        activeLayoutId: 'default',
        version: '1.0.0',
      };

      // Act & Assert
      await expect(
        DashboardConfigManager.deleteLayout(config, 'default')
      ).rejects.toThrow('不能删除最后一个布局');
    });

    it('should throw error when layout does not exist', async () => {
      // Arrange
      const config: DashboardConfig = {
        layouts: {
          default: DEFAULT_LAYOUT,
          custom: {
            id: 'custom',
            name: 'Custom',
            cards: [],
            createdAt: '2026-01-26T00:00:00.000Z',
            updatedAt: '2026-01-26T00:00:00.000Z',
          },
        },
        activeLayoutId: 'default',
        version: '1.0.0',
      };

      // Act & Assert
      await expect(
        DashboardConfigManager.deleteLayout(config, 'nonexistent')
      ).rejects.toThrow('布局不存在');
    });

    it('should switch to first layout when deleting active layout', async () => {
      // Arrange
      const config: DashboardConfig = {
        layouts: {
          default: DEFAULT_LAYOUT,
          custom: {
            id: 'custom',
            name: 'Custom',
            cards: [],
            createdAt: '2026-01-26T00:00:00.000Z',
            updatedAt: '2026-01-26T00:00:00.000Z',
          },
        },
        activeLayoutId: 'custom',
        version: '1.0.0',
      };
      mockAsyncStorage.setItem.mockResolvedValue();

      // Act
      const newConfig = await DashboardConfigManager.deleteLayout(config, 'custom');

      // Assert
      expect(newConfig.activeLayoutId).toBe('default');
      expect(newConfig.layouts.custom).toBeUndefined();
    });
  });

  describe('renameLayout()', () => {
    it('should rename layout successfully', async () => {
      // Arrange
      const config: DashboardConfig = {
        layouts: {
          default: DEFAULT_LAYOUT,
        },
        activeLayoutId: 'default',
        version: '1.0.0',
      };
      mockAsyncStorage.setItem.mockResolvedValue();

      // Act
      const newConfig = await DashboardConfigManager.renameLayout(
        config,
        'default',
        'New Name'
      );

      // Assert
      expect(newConfig.layouts.default.name).toBe('New Name');
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should throw error when layout does not exist', async () => {
      // Arrange
      const config: DashboardConfig = {
        layouts: { default: DEFAULT_LAYOUT },
        activeLayoutId: 'default',
        version: '1.0.0',
      };

      // Act & Assert
      await expect(
        DashboardConfigManager.renameLayout(config, 'nonexistent', 'New Name')
      ).rejects.toThrow('布局不存在');
    });
  });

  describe('duplicateLayout()', () => {
    it('should duplicate layout successfully', async () => {
      // Arrange
      const config: DashboardConfig = {
        layouts: {
          default: DEFAULT_LAYOUT,
        },
        activeLayoutId: 'default',
        version: '1.0.0',
      };
      mockAsyncStorage.setItem.mockResolvedValue();

      // Act
      const newConfig = await DashboardConfigManager.duplicateLayout(
        config,
        'default',
        'Copy of Default'
      );

      // Assert
      expect(Object.keys(newConfig.layouts)).toHaveLength(2);
      const newLayoutId = Object.keys(newConfig.layouts).find(id => id !== 'default');
      const newLayout = newConfig.layouts[newLayoutId!];
      expect(newLayout.name).toBe('Copy of Default');
      expect(newLayout.cards).toHaveLength(DEFAULT_LAYOUT.cards.length);
    });

    it('should throw error when layout does not exist', async () => {
      // Arrange
      const config: DashboardConfig = {
        layouts: { default: DEFAULT_LAYOUT },
        activeLayoutId: 'default',
        version: '1.0.0',
      };

      // Act & Assert
      await expect(
        DashboardConfigManager.duplicateLayout(config, 'nonexistent', 'Copy')
      ).rejects.toThrow('布局不存在');
    });
  });

  describe('updateCardOrder()', () => {
    it('should update card order successfully', async () => {
      // Arrange
      const cards: MetricCard[] = [
        { id: 'card1', type: 'total_requests', visible: true, order: 0 },
        { id: 'card2', type: 'bandwidth', visible: true, order: 1 },
        { id: 'card3', type: 'cache_hit_rate', visible: true, order: 2 },
      ];
      const config: DashboardConfig = {
        layouts: {
          default: {
            ...DEFAULT_LAYOUT,
            cards,
          },
        },
        activeLayoutId: 'default',
        version: '1.0.0',
      };
      mockAsyncStorage.setItem.mockResolvedValue();

      // Reorder cards
      const reorderedCards = [cards[2], cards[0], cards[1]];

      // Act
      const newConfig = await DashboardConfigManager.updateCardOrder(
        config,
        'default',
        reorderedCards
      );

      // Assert
      expect(newConfig.layouts.default.cards[0].id).toBe('card3');
      expect(newConfig.layouts.default.cards[0].order).toBe(0);
      expect(newConfig.layouts.default.cards[1].id).toBe('card1');
      expect(newConfig.layouts.default.cards[1].order).toBe(1);
      expect(newConfig.layouts.default.cards[2].id).toBe('card2');
      expect(newConfig.layouts.default.cards[2].order).toBe(2);
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should throw error when layout does not exist', async () => {
      // Arrange
      const config: DashboardConfig = {
        layouts: { default: DEFAULT_LAYOUT },
        activeLayoutId: 'default',
        version: '1.0.0',
      };

      // Act & Assert
      await expect(
        DashboardConfigManager.updateCardOrder(config, 'nonexistent', [])
      ).rejects.toThrow('布局不存在');
    });
  });

  describe('toggleCardVisibility()', () => {
    it('should toggle card visibility from visible to hidden', async () => {
      // Arrange
      const cards: MetricCard[] = [
        { id: 'card1', type: 'total_requests', visible: true, order: 0 },
        { id: 'card2', type: 'bandwidth', visible: true, order: 1 },
      ];
      const config: DashboardConfig = {
        layouts: {
          default: {
            ...DEFAULT_LAYOUT,
            cards,
          },
        },
        activeLayoutId: 'default',
        version: '1.0.0',
      };
      mockAsyncStorage.setItem.mockResolvedValue();

      // Act
      const newConfig = await DashboardConfigManager.toggleCardVisibility(
        config,
        'default',
        'card1'
      );

      // Assert
      const card = newConfig.layouts.default.cards.find(c => c.id === 'card1');
      expect(card?.visible).toBe(false);
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should toggle card visibility from hidden to visible', async () => {
      // Arrange
      const cards: MetricCard[] = [
        { id: 'card1', type: 'total_requests', visible: true, order: 0 },
        { id: 'card2', type: 'bandwidth', visible: false, order: 1 },
      ];
      const config: DashboardConfig = {
        layouts: {
          default: {
            ...DEFAULT_LAYOUT,
            cards,
          },
        },
        activeLayoutId: 'default',
        version: '1.0.0',
      };
      mockAsyncStorage.setItem.mockResolvedValue();

      // Act
      const newConfig = await DashboardConfigManager.toggleCardVisibility(
        config,
        'default',
        'card2'
      );

      // Assert
      const card = newConfig.layouts.default.cards.find(c => c.id === 'card2');
      expect(card?.visible).toBe(true);
    });

    it('should throw error when trying to hide last visible card', async () => {
      // Arrange
      const cards: MetricCard[] = [
        { id: 'card1', type: 'total_requests', visible: true, order: 0 },
        { id: 'card2', type: 'bandwidth', visible: false, order: 1 },
      ];
      const config: DashboardConfig = {
        layouts: {
          default: {
            ...DEFAULT_LAYOUT,
            cards,
          },
        },
        activeLayoutId: 'default',
        version: '1.0.0',
      };

      // Act & Assert
      await expect(
        DashboardConfigManager.toggleCardVisibility(config, 'default', 'card1')
      ).rejects.toThrow('至少需要保留一个可见卡片');
    });

    it('should throw error when layout does not exist', async () => {
      // Arrange
      const config: DashboardConfig = {
        layouts: { default: DEFAULT_LAYOUT },
        activeLayoutId: 'default',
        version: '1.0.0',
      };

      // Act & Assert
      await expect(
        DashboardConfigManager.toggleCardVisibility(config, 'nonexistent', 'card1')
      ).rejects.toThrow('布局不存在');
    });

    it('should throw error when card does not exist', async () => {
      // Arrange
      const config: DashboardConfig = {
        layouts: { default: DEFAULT_LAYOUT },
        activeLayoutId: 'default',
        version: '1.0.0',
      };

      // Act & Assert
      await expect(
        DashboardConfigManager.toggleCardVisibility(config, 'default', 'nonexistent')
      ).rejects.toThrow('卡片不存在');
    });
  });

  describe('resetToDefault()', () => {
    it('should reset to default configuration', async () => {
      // Arrange
      mockAsyncStorage.setItem.mockResolvedValue();

      // Act
      const config = await DashboardConfigManager.resetToDefault();

      // Assert
      expect(config.layouts.default).toBeDefined();
      expect(config.activeLayoutId).toBe('default');
      expect(config.version).toBe('1.0.0');
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
  });
});
