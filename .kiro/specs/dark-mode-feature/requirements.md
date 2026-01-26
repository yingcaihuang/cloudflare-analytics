# 深色模式功能需求文档

## 1. 功能概述

为 Cloudflare Analytics 应用添加完整的深色模式支持，提供舒适的夜间使用体验。

## 2. 用户故事

### 2.1 作为用户，我希望应用支持深色模式
**验收标准**:
- 应用可以在浅色和深色主题之间切换
- 所有页面和组件都适配深色模式
- 图表在深色模式下清晰可读
- 主题切换流畅无闪烁

### 2.2 作为用户，我希望应用能跟随系统主题
**验收标准**:
- 应用启动时自动检测系统主题
- 系统主题变化时应用自动切换
- 可以在设置中关闭自动跟随

### 2.3 作为用户，我希望手动切换主题
**验收标准**:
- 在"更多"页面有主题切换选项
- 切换后立即生效
- 主题选择被持久化保存

## 3. 功能需求

### 3.1 主题管理
- 支持三种模式：浅色、深色、跟随系统
- 使用 React Context 管理主题状态
- 主题配置保存到 AsyncStorage

### 3.2 颜色系统
- 定义完整的浅色和深色配色方案
- 包含主色、背景色、文字色、边框色等
- 确保对比度符合可访问性标准

### 3.3 组件适配
- 所有屏幕组件支持深色模式
- 所有可复用组件支持深色模式
- 图表组件适配深色背景

### 3.4 图表适配
- LineChart 深色模式配色
- PieChart 深色模式配色
- BarChart 深色模式配色
- 图表背景、网格线、标签颜色适配

## 4. 技术实现

### 4.1 主题 Context
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  colorScheme: 'light' | 'dark' | 'auto';
  colors: ColorScheme;
  toggleTheme: () => void;
  setColorScheme: (scheme: 'light' | 'dark' | 'auto') => void;
}
```

### 4.2 颜色定义
```typescript
interface ColorScheme {
  // 背景色
  background: string;
  surface: string;
  card: string;
  
  // 文字色
  text: string;
  textSecondary: string;
  textDisabled: string;
  
  // 主题色
  primary: string;
  secondary: string;
  accent: string;
  
  // 状态色
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // 边框和分隔线
  border: string;
  divider: string;
  
  // 图表色
  chartColors: string[];
}
```

### 4.3 文件结构
```
src/
├── contexts/
│   └── ThemeContext.tsx       # 主题 Context
├── theme/
│   ├── colors.ts              # 颜色定义
│   ├── lightTheme.ts          # 浅色主题
│   └── darkTheme.ts           # 深色主题
└── hooks/
    └── useTheme.ts            # 主题 Hook
```

## 5. 非功能需求

### 5.1 性能
- 主题切换响应时间 < 100ms
- 无明显的重渲染闪烁
- 内存占用增加 < 5MB

### 5.2 兼容性
- iOS 13+ 支持
- Android 10+ 支持
- 向后兼容旧版本系统

### 5.3 可访问性
- 颜色对比度符合 WCAG AA 标准
- 文字清晰可读
- 图表元素可区分

## 6. 测试计划

### 6.1 功能测试
- [ ] 手动切换主题正常工作
- [ ] 跟随系统主题正常工作
- [ ] 主题设置被正确保存
- [ ] 所有页面正确显示

### 6.2 视觉测试
- [ ] 浅色模式所有页面截图
- [ ] 深色模式所有页面截图
- [ ] 对比度检查
- [ ] 图表可读性检查

### 6.3 性能测试
- [ ] 主题切换性能测试
- [ ] 内存占用测试
- [ ] 启动时间测试

## 7. 实施步骤

### Phase 1: 基础设施（1-2天）
1. 创建 ThemeContext 和颜色定义
2. 实现主题切换逻辑
3. 添加主题持久化

### Phase 2: 组件适配（2-3天）
4. 适配所有屏幕组件
5. 适配可复用组件
6. 适配图表组件

### Phase 3: 设置界面（1天）
7. 在"更多"页面添加主题设置
8. 实现主题选择器
9. 添加预览功能

### Phase 4: 测试和优化（1-2天）
10. 功能测试
11. 视觉测试
12. 性能优化
13. Bug 修复

## 8. 风险和挑战

### 8.1 风险
- 图表库可能不完全支持深色模式
- 某些第三方组件可能需要额外适配
- 性能影响需要评估

### 8.2 缓解措施
- 提前测试图表库的深色模式支持
- 准备自定义样式覆盖方案
- 使用 React.memo 优化性能

## 9. 成功指标

- [ ] 所有页面支持深色模式
- [ ] 主题切换流畅无闪烁
- [ ] 用户满意度 > 90%
- [ ] 无严重 Bug

## 10. 后续优化

- 添加更多主题选项（如高对比度主题）
- 支持自定义主题色
- 添加主题预览功能
- 支持定时自动切换
