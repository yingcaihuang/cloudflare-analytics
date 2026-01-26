# 自定义仪表板功能 - 任务列表

## Phase 1: 基础设施（2-3天）

- [x] 1. 安装依赖库
  - [x] 1.1 安装 react-native-draggable-flatlist
  - [x] 1.2 安装 react-native-gesture-handler
  - [x] 1.3 安装 react-native-reanimated
  - [x] 1.4 配置 babel.config.js（添加 reanimated 插件）

- [x] 2. 创建类型定义
  - [x] 2.1 创建 src/types/dashboard.ts
  - [x] 2.2 定义 MetricCardType 枚举
  - [x] 2.3 定义 MetricCard 接口
  - [x] 2.4 定义 DashboardLayout 接口
  - [x] 2.5 定义 DashboardConfig 接口
  - [x] 2.6 定义 MetricCardMetadata 接口
  - [x] 2.7 定义默认配置常量

- [x] 3. 实现 DashboardConfigManager
  - [x] 3.1 创建 src/services/DashboardConfigManager.ts
  - [x] 3.2 实现 loadConfig() 方法
  - [x] 3.3 实现 saveConfig() 方法
  - [x] 3.4 实现 createLayout() 方法
  - [x] 3.5 实现 deleteLayout() 方法
  - [x] 3.6 实现 renameLayout() 方法
  - [x] 3.7 实现 duplicateLayout() 方法
  - [x] 3.8 实现 updateCardOrder() 方法
  - [x] 3.9 实现 toggleCardVisibility() 方法
  - [x] 3.10 实现 resetToDefault() 方法
  - [x] 3.11 实现 validateConfig() 私有方法
  - [x] 3.12 实现 migrateConfig() 私有方法

- [x] 4. 创建 DashboardContext
  - [x] 4.1 创建 src/contexts/DashboardContext.tsx
  - [x] 4.2 定义 DashboardContextType 接口
  - [x] 4.3 定义 DashboardState 和 DashboardAction 类型
  - [x] 4.4 实现 dashboardReducer
  - [x] 4.5 实现 DashboardProvider 组件
  - [x] 4.6 实现 useDashboard hook
  - [x] 4.7 实现 switchLayout 方法
  - [x] 4.8 实现 createLayout 方法
  - [x] 4.9 实现 deleteLayout 方法
  - [x] 4.10 实现 renameLayout 方法
  - [x] 4.11 实现 duplicateLayout 方法
  - [x] 4.12 实现 updateCardOrder 方法
  - [x] 4.13 实现 toggleCardVisibility 方法
  - [x] 4.14 实现 resetToDefault 方法
  - [x] 4.15 实现 setEditMode 方法
  - [x] 4.16 实现 refreshConfig 方法
  - [x] 4.17 在 App.tsx 中添加 DashboardProvider

- [x] 5. 编写单元测试
  - [x] 5.1 创建 src/services/__tests__/DashboardConfigManager.test.ts
  - [x] 5.2 测试 loadConfig() - 无保存配置时返回默认配置
  - [x] 5.3 测试 loadConfig() - 加载已保存的配置
  - [x] 5.4 测试 saveConfig() - 正确保存配置
  - [x] 5.5 测试 createLayout() - 创建新布局
  - [x] 5.6 测试 deleteLayout() - 删除布局
  - [x] 5.7 测试 deleteLayout() - 不能删除最后一个布局
  - [x] 5.8 测试 renameLayout() - 重命名布局
  - [x] 5.9 测试 duplicateLayout() - 复制布局
  - [x] 5.10 测试 updateCardOrder() - 更新卡片顺序
  - [x] 5.11 测试 toggleCardVisibility() - 切换卡片可见性
  - [x] 5.12 测试 resetToDefault() - 重置为默认配置

## Phase 2: 核心功能（3-4天）

- [x] 6. 实现 MetricCardContent
  - [x] 6.1 创建 src/components/MetricCardContent.tsx
  - [x] 6.2 实现 TotalRequestsCard 子组件
  - [x] 6.3 实现 DataTransferCard 子组件
  - [x] 6.4 实现 BandwidthCard 子组件
  - [x] 6.5 实现 CacheHitRateCard 子组件
  - [x] 6.6 实现 FirewallEventsCard 子组件
  - [x] 6.7 实现 BlockedRequestsCard 子组件
  - [x] 6.8 实现 Status2xxCard 子组件
  - [x] 6.9 实现 Status4xxCard 子组件
  - [x] 6.10 实现 Status5xxCard 子组件
  - [x] 6.11 实现 BotTrafficCard 子组件
  - [x] 6.12 实现 GeoDistributionCard 子组件
  - [x] 6.13 实现主 MetricCardContent 组件（switch 逻辑）
  - [x] 6.14 添加加载和错误状态
  - [x] 6.15 适配深色模式

- [x] 7. 实现 DraggableMetricCard
  - [x] 7.1 创建 src/components/DraggableMetricCard.tsx
  - [x] 7.2 实现基础卡片布局
  - [x] 7.3 实现拖拽手柄 UI
  - [x] 7.4 实现可见性开关 UI
  - [x] 7.5 实现长按触发拖拽（500ms）
  - [x] 7.6 实现拖拽时放大动画（scale: 1.05）
  - [x] 7.7 实现拖拽时阴影动画
  - [x] 7.8 实现编辑模式切换逻辑
  - [x] 7.9 实现卡片抖动动画（编辑模式）
  - [x] 7.10 集成 MetricCardContent
  - [x] 7.11 适配深色模式
  - [x] 7.12 添加无障碍支持

- [x] 8. 实现 CustomDashboardScreen
  - [x] 8.1 创建 src/screens/CustomDashboardScreen.tsx
  - [x] 8.2 实现基础布局结构
  - [x] 8.3 实现 ScreenHeader（标题 + 编辑按钮 + 设置按钮）
  - [x] 8.4 实现编辑/完成按钮切换
  - [x] 8.5 实现拖拽提示文本（编辑模式）
  - [x] 8.6 集成 DraggableFlatList
  - [x] 8.7 实现 renderItem（渲染 DraggableMetricCard）
  - [x] 8.8 实现 onDragEnd 处理（更新卡片顺序）
  - [x] 8.9 过滤只显示可见卡片
  - [x] 8.10 实现下拉刷新
  - [x] 8.11 实现加载状态
  - [x] 8.12 实现错误状态
  - [x] 8.13 适配深色模式
  - [x] 8.14 添加到导航（MainTabs）

- [x] 9. 实现拖拽排序功能
  - [x] 9.1 配置 GestureHandlerRootView（App.tsx）
  - [x] 9.2 实现拖拽手势识别
  - [x] 9.3 实现拖拽时的视觉反馈
  - [x] 9.4 实现其他卡片自动让位动画
  - [x] 9.5 实现松手后固定位置
  - [x] 9.6 实现拖拽结束后保存顺序
  - [x] 9.7 测试拖拽性能（60fps）
  - [x] 9.8 优化拖拽流畅度

- [x] 10. 实现可见性切换功能
  - [x] 10.1 实现可见性开关 UI
  - [x] 10.2 实现点击开关切换可见性
  - [x] 10.3 实现隐藏卡片的淡出动画
  - [x] 10.4 实现显示卡片的淡入动画
  - [x] 10.5 实现至少保留一个可见卡片的限制
  - [x] 10.6 实现切换后自动保存
  - [x] 10.7 添加切换提示（Toast）

- [x] 11. 适配深色模式
  - [x] 11.1 CustomDashboardScreen 适配深色模式
  - [x] 11.2 DraggableMetricCard 适配深色模式
  - [x] 11.3 MetricCardContent 适配深色模式
  - [x] 11.4 确保所有颜色使用 useTheme
  - [x] 11.5 测试深色模式切换

## Phase 3: 布局管理（2-3天）

- [x] 12. 实现 LayoutSelector
  - [x] 12.1 创建 src/components/LayoutSelector.tsx
  - [x] 12.2 实现下拉选择器 UI
  - [x] 12.3 实现布局列表显示
  - [x] 12.4 实现当前布局高亮
  - [x] 12.5 实现选择布局回调
  - [x] 12.6 实现"管理布局"按钮
  - [x] 12.7 显示布局名称和卡片数量
  - [x] 12.8 适配深色模式
  - [x] 12.9 添加无障碍支持

- [x] 13. 实现 LayoutManagerScreen
  - [x] 13.1 创建 src/screens/LayoutManagerScreen.tsx
  - [x] 13.2 实现基础布局结构
  - [x] 13.3 实现 ScreenHeader（标题 + 新建按钮）
  - [x] 13.4 实现布局列表（FlatList）
  - [x] 13.5 实现 LayoutListItem 组件
  - [x] 13.6 显示布局名称、卡片数量、更新时间
  - [x] 13.7 实现当前布局标记（✓）
  - [x] 13.8 实现更多操作菜单（⋯）
  - [x] 13.9 实现空状态提示
  - [x] 13.10 适配深色模式
  - [x] 13.11 添加到导航

- [x] 14. 实现布局创建功能
  - [x] 14.1 实现创建布局对话框
  - [x] 14.2 实现布局名称输入
  - [x] 14.3 实现"基于现有布局"选项
  - [x] 14.4 实现创建确认
  - [x] 14.5 实现创建后自动切换到新布局
  - [x] 14.6 实现创建成功提示
  - [x] 14.7 实现创建失败错误处理

- [x] 15. 实现布局删除功能
  - [x] 15.1 实现删除确认对话框
  - [x] 15.2 实现删除逻辑
  - [x] 15.3 实现不能删除最后一个布局的限制
  - [x] 15.4 实现删除当前布局时自动切换
  - [x] 15.5 实现删除成功提示
  - [x] 15.6 实现删除失败错误处理

- [x] 16. 实现布局重命名功能
  - [x] 16.1 实现重命名对话框
  - [x] 16.2 实现名称输入（预填充当前名称）
  - [x] 16.3 实现重命名确认
  - [x] 16.4 实现重命名成功提示
  - [x] 16.5 实现重命名失败错误处理

- [x] 17. 实现布局复制功能
  - [x] 17.1 实现复制对话框
  - [x] 17.2 实现新名称输入（默认"副本"后缀）
  - [x] 17.3 实现复制确认
  - [x] 17.4 实现复制成功提示
  - [x] 17.5 实现复制失败错误处理

- [x] 18. 实现布局切换功能
  - [x] 18.1 实现点击布局切换
  - [x] 18.2 实现切换动画
  - [x] 18.3 实现切换后刷新数据
  - [x] 18.4 实现切换成功提示
  - [x] 18.5 实现切换失败错误处理

- [x] 19. 集成 LayoutSelector 到 CustomDashboardScreen
  - [x] 19.1 在 CustomDashboardScreen 中添加 LayoutSelector
  - [x] 19.2 实现布局切换回调
  - [x] 19.3 实现"管理布局"导航
  - [x] 19.4 测试布局切换流程

## Phase 4: 优化和测试（1-2天）

- [ ] 20. 性能优化
  - [ ] 20.1 使用 React.memo 包装 MetricCardContent
  - [ ] 20.2 使用 useMemo 缓存计算结果
  - [ ] 20.3 使用 useCallback 缓存回调函数
  - [ ] 20.4 优化 FlatList 配置（windowSize, maxToRenderPerBatch）
  - [ ] 20.5 实现懒加载（InteractionManager）
  - [ ] 20.6 优化动画性能（useNativeDriver）
  - [ ] 20.7 测试性能指标（拖拽 60fps）
  - [ ] 20.8 测试内存占用（< 100MB）

- [ ] 21. 动画优化
  - [ ] 21.1 优化拖拽动画流畅度
  - [ ] 21.2 优化卡片切换动画
  - [ ] 21.3 优化布局切换动画
  - [ ] 21.4 优化可见性切换动画
  - [ ] 21.5 确保所有动画使用 UI 线程

- [ ] 22. 错误处理完善
  - [ ] 22.1 实现 DashboardError 类
  - [ ] 22.2 实现加载配置失败处理
  - [ ] 22.3 实现保存配置失败处理
  - [ ] 22.4 实现无效配置处理
  - [ ] 22.5 实现布局不存在处理
  - [ ] 22.6 实现删除最后布局阻止
  - [ ] 22.7 添加错误日志记录
  - [ ] 22.8 添加用户友好的错误提示

- [ ] 23. 集成测试
  - [ ] 23.1 创建 src/screens/__tests__/CustomDashboardScreen.test.tsx
  - [ ] 23.2 测试渲染所有可见卡片
  - [ ] 23.3 测试编辑模式切换
  - [ ] 23.4 测试拖拽排序
  - [ ] 23.5 测试可见性切换
  - [ ] 23.6 测试布局切换
  - [ ] 23.7 测试深色模式
  - [ ] 23.8 测试错误状态

- [ ] 24. 用户体验优化
  - [ ] 24.1 添加操作提示（Toast）
  - [ ] 24.2 添加加载动画
  - [ ] 24.3 添加空状态提示
  - [ ] 24.4 添加首次使用引导
  - [ ] 24.5 优化触摸反馈
  - [ ] 24.6 优化文本和图标
  - [ ] 24.7 添加撤销操作（可选）
  - [ ] 24.8 用户测试和反馈收集

- [ ] 25. 文档和发布
  - [ ] 25.1 更新 README.md
  - [ ] 25.2 创建功能使用文档
  - [ ] 25.3 更新 CHANGELOG.md
  - [ ] 25.4 创建功能演示视频/截图
  - [ ] 25.5 代码审查
  - [ ] 25.6 最终测试
  - [ ] 25.7 发布新版本

---

**总任务数**: 25 个主任务，约 200 个子任务
**预计工期**: 8-12 天
**优先级**: 高
**状态**: 未开始

*创建时间: 2026-01-26*
