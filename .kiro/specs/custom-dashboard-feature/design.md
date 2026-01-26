# 自定义仪表板功能 - 设计文档

## 1. 架构设计

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                   CustomDashboardScreen                  │
│  ┌────────────────────────────────────────────────────┐ │
│  │              DashboardContext                       │ │
│  │  - layouts: DashboardLayout[]                      │ │
│  │  - activeLayoutId: string                          │ │
│  │  - updateCardOrder()                               │ │
│  │  - toggleCardVisibility()                          │ │
│  │  - switchLayout()                                  │ │
│  └────────────────────────────────────────────────────┘ │
│                          ↓                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │         DraggableFlatList                          │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │      DraggableMetricCard                     │ │ │
│  │  │  ┌────────────────────────────────────────┐ │ │ │
│  │  │  │    MetricCardContent                   │ │ │ │
│  │  │  │  - TrafficMetric                       │ │ │ │
│  │  │  │  - SecurityMetric                      │ │ │ │
│  │  │  │  - StatusCodeMetric                    │ │ │ │
│  │  │  └────────────────────────────────────────┘ │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│            DashboardConfigManager                        │
│  - loadConfig()                                          │
│  - saveConfig()                                          │
│  - createLayout()                                        │
│  - deleteLayout()                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   AsyncStorage                           │
│  Key: @cloudflare_analytics:dashboard_config             │
└─────────────────────────────────────────────────────────┘
```

### 1.2 数据流

```
用户操作 → DashboardContext → DashboardConfigManager → AsyncStorage
                ↓
        更新 UI 状态
                ↓
        重新渲染组件
```

## 2. 数据模型

### 2.1 类型定义

```typescript
// src/types/dashboard.ts

/**
 * 指标卡片类型
 */
export type MetricCardType =
  | 'total_requests'
  | 'data_transfer'
  | 'bandwidth'
  | 'page_views'
  | 'visits'
  | 'cache_hit_rate'
  | 'firewall_events'
  | 'blocked_requests'
  | 'challenged_requests'
  | 'bot_traffic'
  | 'status_2xx'
  | 'status_4xx'
  | 'status_5xx'
  | 'geo_distribution';

/**
 * 指标卡片配置
 */
export interface MetricCard {
  id: string;
  type: MetricCardType;
  visible: boolean;
  order: number;
}

/**
 * 仪表板布局
 */
export interface DashboardLayout {
  id: string;
  name: string;
  cards: MetricCard[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 仪表板配置
 */
export interface DashboardConfig {
  layouts: Record<string, DashboardLayout>;
  activeLayoutId: string;
  version: string;
}

/**
 * 指标卡片元数据
 */
export interface MetricCardMetadata {
  type: MetricCardType;
  title: string;
  description: string;
  category: 'traffic' | 'security' | 'status' | 'distribution';
  icon: string;
  defaultVisible: boolean;
}
```

### 2.2 默认配置

```typescript
// 默认指标卡片列表
export const DEFAULT_METRIC_CARDS: MetricCard[] = [
  { id: 'total_requests', type: 'total_requests', visible: true, order: 0 },
  { id: 'data_transfer', type: 'data_transfer', visible: true, order: 1 },
  { id: 'bandwidth', type: 'bandwidth', visible: true, order: 2 },
  { id: 'cache_hit_rate', type: 'cache_hit_rate', visible: true, order: 3 },
  { id: 'firewall_events', type: 'firewall_events', visible: true, order: 4 },
  { id: 'blocked_requests', type: 'blocked_requests', visible: true, order: 5 },
  { id: 'status_2xx', type: 'status_2xx', visible: true, order: 6 },
  { id: 'status_4xx', type: 'status_4xx', visible: true, order: 7 },
  { id: 'status_5xx', type: 'status_5xx', visible: false, order: 8 },
  { id: 'bot_traffic', type: 'bot_traffic', visible: false, order: 9 },
  { id: 'geo_distribution', type: 'geo_distribution', visible: false, order: 10 },
];

// 默认布局
export const DEFAULT_LAYOUT: DashboardLayout = {
  id: 'default',
  name: '默认布局',
  cards: DEFAULT_METRIC_CARDS,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

## 3. 核心组件设计

### 3.1 DashboardContext

**职责**: 管理仪表板状态和操作

**接口**:
```typescript
interface DashboardContextType {
  // 状态
  config: DashboardConfig | null;
  activeLayout: DashboardLayout | null;
  isEditMode: boolean;
  isLoading: boolean;
  
  // 布局操作
  switchLayout: (layoutId: string) => Promise<void>;
  createLayout: (name: string, basedOn?: string) => Promise<string>;
  deleteLayout: (layoutId: string) => Promise<void>;
  renameLayout: (layoutId: string, newName: string) => Promise<void>;
  duplicateLayout: (layoutId: string, newName: string) => Promise<string>;
  
  // 卡片操作
  updateCardOrder: (cards: MetricCard[]) => Promise<void>;
  toggleCardVisibility: (cardId: string) => Promise<void>;
  resetToDefault: () => Promise<void>;
  
  // 编辑模式
  setEditMode: (enabled: boolean) => void;
  
  // 刷新
  refreshConfig: () => Promise<void>;
}
```

**实现要点**:
- 使用 useReducer 管理复杂状态
- 所有操作都通过 DashboardConfigManager 持久化
- 提供乐观更新（先更新 UI，再保存）
- 错误处理和回滚机制

### 3.2 DraggableMetricCard

**职责**: 可拖拽的指标卡片容器

**Props**:
```typescript
interface DraggableMetricCardProps {
  card: MetricCard;
  isEditMode: boolean;
  onToggleVisibility: (cardId: string) => void;
  drag: () => void;
  isActive: boolean;
}
```

**功能**:
- 长按触发拖拽（500ms）
- 编辑模式显示拖拽手柄和可见性开关
- 拖拽时放大动画（scale: 1.05）
- 阴影效果
- 支持深色模式

**动画**:
```typescript
// 拖拽动画
const scaleAnim = useSharedValue(1);
const shadowAnim = useSharedValue(2);

useEffect(() => {
  if (isActive) {
    scaleAnim.value = withSpring(1.05);
    shadowAnim.value = withSpring(8);
  } else {
    scaleAnim.value = withSpring(1);
    shadowAnim.value = withSpring(2);
  }
}, [isActive]);
```

### 3.3 MetricCardContent

**职责**: 根据卡片类型渲染不同的指标内容

**Props**:
```typescript
interface MetricCardContentProps {
  type: MetricCardType;
  zoneId: string;
  timeRange: TimeRange;
}
```

**实现策略**:
- 使用 switch 语句根据 type 渲染不同组件
- 复用现有的 hooks（useTrafficMetrics, useSecurityMetrics 等）
- 统一的加载和错误状态
- 支持深色模式

**示例**:
```typescript
const MetricCardContent: React.FC<MetricCardContentProps> = ({ type, zoneId, timeRange }) => {
  switch (type) {
    case 'total_requests':
      return <TotalRequestsCard zoneId={zoneId} timeRange={timeRange} />;
    case 'data_transfer':
      return <DataTransferCard zoneId={zoneId} timeRange={timeRange} />;
    // ... 其他类型
    default:
      return <Text>未知卡片类型</Text>;
  }
};
```

### 3.4 LayoutSelector

**职责**: 布局选择器组件

**Props**:
```typescript
interface LayoutSelectorProps {
  layouts: DashboardLayout[];
  activeLayoutId: string;
  onSelectLayout: (layoutId: string) => void;
  onManageLayouts: () => void;
}
```

**UI**:
- 下拉选择器（Picker 或自定义 Modal）
- 显示布局名称和卡片数量
- "管理布局"按钮跳转到管理界面

### 3.5 CustomDashboardScreen

**职责**: 自定义仪表板主屏幕

**功能**:
- 显示当前布局的所有可见卡片
- 编辑/完成按钮切换编辑模式
- 设置按钮跳转到布局管理
- 下拉刷新数据
- 支持深色模式

**布局**:
```typescript
<View>
  <ScreenHeader title="自定义仪表板">
    <TouchableOpacity onPress={toggleEditMode}>
      <Text>{isEditMode ? '完成' : '编辑'}</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={navigateToLayoutManager}>
      <Icon name="settings" />
    </TouchableOpacity>
  </ScreenHeader>
  
  <LayoutSelector />
  
  {isEditMode && (
    <Text>长按拖拽以重新排序</Text>
  )}
  
  <DraggableFlatList
    data={visibleCards}
    renderItem={renderCard}
    keyExtractor={(item) => item.id}
    onDragEnd={handleDragEnd}
  />
</View>
```

### 3.6 LayoutManagerScreen

**职责**: 布局管理界面

**功能**:
- 显示所有布局列表
- 创建新布局
- 重命名布局
- 删除布局
- 复制布局
- 切换活动布局

**UI 组件**:
```typescript
<View>
  <ScreenHeader title="布局管理">
    <TouchableOpacity onPress={handleCreateLayout}>
      <Icon name="plus" />
    </TouchableOpacity>
  </ScreenHeader>
  
  <FlatList
    data={layouts}
    renderItem={({ item }) => (
      <LayoutListItem
        layout={item}
        isActive={item.id === activeLayoutId}
        onSelect={() => handleSelectLayout(item.id)}
        onRename={() => handleRenameLayout(item.id)}
        onDelete={() => handleDeleteLayout(item.id)}
        onDuplicate={() => handleDuplicateLayout(item.id)}
      />
    )}
  />
</View>
```

## 4. 服务层设计

### 4.1 DashboardConfigManager

**职责**: 管理仪表板配置的持久化

**接口**:
```typescript
class DashboardConfigManager {
  private static STORAGE_KEY = '@cloudflare_analytics:dashboard_config';
  private static CONFIG_VERSION = '1.0.0';
  
  /**
   * 加载配置
   */
  static async loadConfig(): Promise<DashboardConfig>;
  
  /**
   * 保存配置
   */
  static async saveConfig(config: DashboardConfig): Promise<void>;
  
  /**
   * 创建新布局
   */
  static async createLayout(
    config: DashboardConfig,
    name: string,
    basedOn?: string
  ): Promise<DashboardConfig>;
  
  /**
   * 删除布局
   */
  static async deleteLayout(
    config: DashboardConfig,
    layoutId: string
  ): Promise<DashboardConfig>;
  
  /**
   * 重命名布局
   */
  static async renameLayout(
    config: DashboardConfig,
    layoutId: string,
    newName: string
  ): Promise<DashboardConfig>;
  
  /**
   * 复制布局
   */
  static async duplicateLayout(
    config: DashboardConfig,
    layoutId: string,
    newName: string
  ): Promise<DashboardConfig>;
  
  /**
   * 更新卡片顺序
   */
  static async updateCardOrder(
    config: DashboardConfig,
    layoutId: string,
    cards: MetricCard[]
  ): Promise<DashboardConfig>;
  
  /**
   * 切换卡片可见性
   */
  static async toggleCardVisibility(
    config: DashboardConfig,
    layoutId: string,
    cardId: string
  ): Promise<DashboardConfig>;
  
  /**
   * 重置为默认配置
   */
  static async resetToDefault(): Promise<DashboardConfig>;
  
  /**
   * 验证配置
   */
  private static validateConfig(config: any): boolean;
  
  /**
   * 迁移旧版本配置
   */
  private static migrateConfig(config: any): DashboardConfig;
}
```

**实现要点**:
- 所有操作都是纯函数，返回新的配置对象
- 配置验证确保数据完整性
- 支持版本迁移
- 错误处理和日志记录

## 5. 状态管理

### 5.1 Context State

```typescript
interface DashboardState {
  config: DashboardConfig | null;
  isEditMode: boolean;
  isLoading: boolean;
  error: string | null;
}

type DashboardAction =
  | { type: 'SET_CONFIG'; payload: DashboardConfig }
  | { type: 'SET_EDIT_MODE'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_LAYOUT'; payload: DashboardLayout };

const dashboardReducer = (
  state: DashboardState,
  action: DashboardAction
): DashboardState => {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, config: action.payload, isLoading: false };
    case 'SET_EDIT_MODE':
      return { ...state, isEditMode: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
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
    default:
      return state;
  }
};
```

## 6. 性能优化

### 6.1 优化策略

1. **虚拟化列表**
   - 使用 FlatList 的 `windowSize` 和 `maxToRenderPerBatch` 优化
   - 只渲染可见区域的卡片

2. **记忆化**
   - 使用 `React.memo` 包装 MetricCardContent
   - 使用 `useMemo` 缓存计算结果
   - 使用 `useCallback` 缓存回调函数

3. **懒加载**
   - 卡片数据按需加载
   - 使用 `InteractionManager` 延迟非关键操作

4. **动画优化**
   - 使用 `react-native-reanimated` 的 UI 线程动画
   - 避免在拖拽时进行复杂计算

5. **批量更新**
   - 使用 `unstable_batchedUpdates` 批量更新状态
   - 防抖保存操作（500ms）

### 6.2 性能指标

- 拖拽响应时间: < 16ms (60fps)
- 布局切换时间: < 100ms
- 配置保存时间: < 50ms
- 内存占用: < 100MB

## 7. 错误处理

### 7.1 错误类型

```typescript
enum DashboardErrorType {
  LOAD_CONFIG_FAILED = 'LOAD_CONFIG_FAILED',
  SAVE_CONFIG_FAILED = 'SAVE_CONFIG_FAILED',
  INVALID_CONFIG = 'INVALID_CONFIG',
  LAYOUT_NOT_FOUND = 'LAYOUT_NOT_FOUND',
  CANNOT_DELETE_LAST_LAYOUT = 'CANNOT_DELETE_LAST_LAYOUT',
}

class DashboardError extends Error {
  constructor(
    public type: DashboardErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DashboardError';
  }
}
```

### 7.2 错误处理策略

1. **加载失败**: 使用默认配置
2. **保存失败**: 显示错误提示，保留当前状态
3. **无效配置**: 尝试修复或重置为默认
4. **布局不存在**: 切换到默认布局
5. **删除最后布局**: 阻止操作并提示

## 8. 测试策略

### 8.1 单元测试

```typescript
// DashboardConfigManager.test.ts
describe('DashboardConfigManager', () => {
  it('should load default config when no saved config exists', async () => {
    const config = await DashboardConfigManager.loadConfig();
    expect(config.layouts).toHaveProperty('default');
  });
  
  it('should create new layout', async () => {
    const config = await DashboardConfigManager.loadConfig();
    const newConfig = await DashboardConfigManager.createLayout(
      config,
      '新布局'
    );
    expect(Object.keys(newConfig.layouts)).toHaveLength(2);
  });
  
  it('should not delete last layout', async () => {
    const config = { layouts: { default: DEFAULT_LAYOUT }, activeLayoutId: 'default' };
    await expect(
      DashboardConfigManager.deleteLayout(config, 'default')
    ).rejects.toThrow();
  });
});
```

### 8.2 集成测试

```typescript
// CustomDashboardScreen.test.tsx
describe('CustomDashboardScreen', () => {
  it('should render all visible cards', () => {
    const { getAllByTestId } = render(<CustomDashboardScreen />);
    const cards = getAllByTestId('metric-card');
    expect(cards.length).toBeGreaterThan(0);
  });
  
  it('should toggle edit mode', () => {
    const { getByText } = render(<CustomDashboardScreen />);
    const editButton = getByText('编辑');
    fireEvent.press(editButton);
    expect(getByText('完成')).toBeTruthy();
  });
});
```

## 9. 可访问性

### 9.1 无障碍支持

- 所有交互元素添加 `accessibilityLabel`
- 拖拽手柄添加 `accessibilityHint`
- 支持屏幕阅读器
- 足够的触摸目标大小（最小 44x44）
- 高对比度支持

### 9.2 示例

```typescript
<TouchableOpacity
  accessibilityLabel="编辑仪表板"
  accessibilityHint="点击进入编辑模式，可以拖拽排序和隐藏卡片"
  accessibilityRole="button"
>
  <Text>编辑</Text>
</TouchableOpacity>
```

## 10. 安全性

### 10.1 数据验证

- 验证配置结构
- 验证布局 ID 唯一性
- 验证卡片类型有效性
- 防止注入攻击

### 10.2 存储安全

- 使用 AsyncStorage 的加密选项（如果可用）
- 不存储敏感数据
- 定期清理无效数据

## 11. 国际化

### 11.1 文本资源

```typescript
// i18n/zh-CN.ts
export default {
  dashboard: {
    title: '自定义仪表板',
    edit: '编辑',
    done: '完成',
    dragHint: '长按拖拽以重新排序',
    layoutSelector: '布局',
    manageLayouts: '管理布局',
    resetToDefault: '重置为默认',
    confirmReset: '确定要重置为默认布局吗？',
  },
  layoutManager: {
    title: '布局管理',
    createNew: '新建布局',
    rename: '重命名',
    duplicate: '复制',
    delete: '删除',
    confirmDelete: '确定要删除此布局吗？',
    cannotDeleteLast: '不能删除最后一个布局',
  },
  metricCards: {
    total_requests: '总请求数',
    data_transfer: '数据传输',
    bandwidth: '带宽',
    // ... 其他卡片
  },
};
```

## 12. 正确性属性

### 12.1 核心属性

**属性 1: 配置持久性**
- 描述: 保存的配置必须能够正确加载
- 测试: 保存配置后重新加载，验证数据一致性

**属性 2: 卡片顺序一致性**
- 描述: 拖拽后的卡片顺序必须正确保存和恢复
- 测试: 随机拖拽多次，验证顺序与预期一致

**属性 3: 布局隔离性**
- 描述: 不同布局的配置互不影响
- 测试: 修改一个布局，验证其他布局不变

**属性 4: 至少一个可见卡片**
- 描述: 每个布局至少保留一个可见卡片
- 测试: 尝试隐藏所有卡片，验证至少保留一个

**属性 5: 布局 ID 唯一性**
- 描述: 所有布局 ID 必须唯一
- 测试: 创建多个布局，验证 ID 不重复

## 13. 实施计划

### Phase 1: 基础设施（2-3天）

**任务**:
1. 安装依赖库
2. 创建类型定义
3. 实现 DashboardConfigManager
4. 创建 DashboardContext
5. 编写单元测试

**验收标准**:
- 配置可以正确保存和加载
- Context 提供所有必需的方法
- 单元测试覆盖率 > 80%

### Phase 2: 核心功能（3-4天）

**任务**:
6. 实现 DraggableMetricCard
7. 实现 MetricCardContent
8. 实现 CustomDashboardScreen
9. 实现拖拽排序
10. 实现可见性切换
11. 适配深色模式

**验收标准**:
- 可以流畅拖拽卡片
- 卡片显示正确的数据
- 编辑模式正常工作
- 深色模式适配完成

### Phase 3: 布局管理（2-3天）

**任务**:
12. 实现 LayoutSelector
13. 实现 LayoutManagerScreen
14. 实现布局创建/删除
15. 实现布局重命名/复制
16. 实现布局切换

**验收标准**:
- 可以创建和管理多个布局
- 布局切换流畅
- 所有操作正确持久化

### Phase 4: 优化和测试（1-2天）

**任务**:
17. 性能优化
18. 动画优化
19. 错误处理完善
20. 集成测试
21. 用户体验优化

**验收标准**:
- 性能指标达标
- 无明显 bug
- 用户体验流畅

---

*创建时间: 2026-01-26*
*预计工期: 8-12天*
