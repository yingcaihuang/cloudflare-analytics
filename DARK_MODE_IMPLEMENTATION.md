# 深色模式实现文档

## 概述

已成功为 Cloudflare Analytics 应用添加完整的深色模式支持。

## 实现内容

### 1. 主题系统基础设施

#### 颜色定义 (`src/theme/colors.ts`)
- 定义了完整的 `ColorScheme` 接口
- 创建了 `lightColors` 和 `darkColors` 两套配色方案
- 包含背景色、文字色、主题色、状态色、边框色、图表色等

#### 主题 Context (`src/contexts/ThemeContext.tsx`)
- 使用 React Context 管理全局主题状态
- 支持三种模式：浅色、深色、跟随系统
- 主题设置持久化到 AsyncStorage
- 自动监听系统主题变化

### 2. 功能特性

#### 主题切换
- **快速切换**: 在"更多"页面使用 Switch 快速切换深色/浅色
- **详细设置**: 通过模态框选择三种主题模式
  - 浅色：始终使用浅色主题
  - 深色：始终使用深色主题
  - 跟随系统：根据系统设置自动切换

#### 主题持久化
- 用户选择的主题保存到 AsyncStorage
- 应用重启后自动恢复上次选择的主题
- 存储键：`@cloudflare_analytics:theme_preference`

#### 系统主题跟随
- 在"跟随系统"模式下，自动检测系统主题
- 系统主题变化时实时切换应用主题
- 使用 React Native 的 `Appearance` API

### 3. UI 更新

#### 更多页面 (`src/screens/MoreScreen.tsx`)
- 添加"外观设置"分类
- 深色模式快速切换开关
- 主题设置入口
- 主题选择模态框
- 所有元素适配深色模式

#### App.tsx
- 在根组件添加 `ThemeProvider`
- 包裹所有子组件，提供全局主题访问

### 4. 颜色方案

#### 浅色主题
```typescript
background: '#f5f5f5'
surface: '#ffffff'
text: '#333333'
primary: '#f6821f'
```

#### 深色主题
```typescript
background: '#121212'
surface: '#1e1e1e'
text: '#ffffff'
primary: '#ff9d4d'
```

## 使用方法

### 在组件中使用主题

```typescript
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { colors, isDark, toggleTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
}
```

### 主题 Hook API

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';                    // 当前主题
  colorScheme: 'light' | 'dark' | 'auto';    // 用户选择的模式
  colors: ColorScheme;                        // 当前颜色方案
  isDark: boolean;                            // 是否为深色模式
  toggleTheme: () => void;                    // 切换主题
  setColorScheme: (scheme) => void;           // 设置主题模式
}
```

## 下一步工作

### Phase 2: 组件适配（待完成）
需要适配以下组件以支持深色模式：

#### 屏幕组件
- [ ] HomeScreen
- [ ] DashboardScreen
- [ ] SecurityScreen
- [ ] StatusCodesScreen
- [ ] GeoDistributionScreen
- [ ] ProtocolDistributionScreen
- [ ] TLSDistributionScreen
- [ ] ContentTypeScreen
- [ ] BotAnalysisScreen
- [ ] FirewallAnalysisScreen
- [ ] AlertConfigScreen
- [ ] AlertHistoryScreen
- [ ] TokenManagementScreen
- [ ] AccountZoneSelectionScreen

#### 可复用组件
- [ ] LineChart
- [ ] PieChart
- [ ] BarChart
- [ ] MetricCard
- [ ] ZoneSelector
- [ ] ScreenHeader
- [ ] AlertBanner
- [ ] ChartExporter

### Phase 3: 图表适配（待完成）
- [ ] 更新图表配色以适配深色背景
- [ ] 确保图表在深色模式下清晰可读
- [ ] 调整网格线和标签颜色

### Phase 4: 测试和优化（待完成）
- [ ] 功能测试
- [ ] 视觉测试
- [ ] 性能优化
- [ ] Bug 修复

## 适配指南

### 如何适配现有组件

1. **导入 useTheme Hook**
```typescript
import { useTheme } from '../contexts/ThemeContext';
```

2. **获取颜色方案**
```typescript
const { colors, isDark } = useTheme();
```

3. **更新样式**
```typescript
// 之前
<View style={{ backgroundColor: '#ffffff' }}>

// 之后
<View style={{ backgroundColor: colors.surface }}>
```

4. **动态样式**
```typescript
// 使用内联样式
<Text style={{ color: colors.text }}>

// 或者使用条件样式
<View style={[
  styles.container,
  { backgroundColor: colors.background }
]}>
```

### 颜色映射参考

| 用途 | 浅色 | 深色 | 变量名 |
|------|------|------|--------|
| 主背景 | #f5f5f5 | #121212 | colors.background |
| 卡片背景 | #ffffff | #1e1e1e | colors.surface |
| 次级卡片 | #ffffff | #2a2a2a | colors.card |
| 主文字 | #333333 | #ffffff | colors.text |
| 次要文字 | #666666 | #b0b0b0 | colors.textSecondary |
| 主题色 | #f6821f | #ff9d4d | colors.primary |
| 边框 | #e0e0e0 | #3a3a3a | colors.border |

## 注意事项

1. **避免硬编码颜色**: 始终使用 `colors` 对象中的颜色
2. **测试两种模式**: 确保组件在浅色和深色模式下都正常显示
3. **对比度**: 确保文字和背景有足够的对比度
4. **图表颜色**: 图表需要特殊处理以适配深色背景

## 已知问题

目前没有已知问题。

## 性能考虑

- 主题切换使用 Context，避免不必要的重渲染
- 颜色对象在 Context 中缓存
- 主题设置异步保存，不阻塞 UI

## 参考资料

- [React Native Appearance API](https://reactnative.dev/docs/appearance)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [Material Design Dark Theme](https://material.io/design/color/dark-theme.html)

---

*实施日期: 2026-01-26*
*状态: Phase 1 完成，Phase 2-4 待完成*
