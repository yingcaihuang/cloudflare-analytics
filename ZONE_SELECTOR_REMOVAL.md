# Zone Selector Removal Task

## 背景
用户已经在首页选择了 Zone，所以在其他页面中不需要再显示 Zone 选择器。

## 需要修改的页面

根据用户要求，需要移除以下页面顶部的 Zone 选择器：

### 1. 流量概览 (DashboardScreen)
- 文件: `src/screens/DashboardScreen.tsx`
- 当前状态: 从 props 接收 zoneId，没有使用 ScreenHeader
- 操作: 检查是否有 Zone 选择器组件

### 2. 安全页面 (SecurityScreen)  
- 文件: `src/screens/SecurityScreen.tsx`
- 当前状态: 从 props 接收 zoneId，没有使用 ScreenHeader
- 操作: 检查是否有 Zone 选择器组件

### 3. 状态码分析 (StatusCodesScreen) - 在"更多"tab中
- 文件: `src/screens/StatusCodesScreen.tsx`
- 当前状态: 使用 useZone() hook 获取 zoneId
- 操作: 检查是否有 Zone 选择器组件

### 4. Bot分析 (BotAnalysisScreen) - 在"更多"tab中
- 文件: `src/screens/BotAnalysisScreen.tsx`
- 当前状态: 没有 zoneId 参数，可能需要添加
- 操作: 检查是否有 Zone 选择器组件

### 5. 防火墙分析 (FirewallAnalysisScreen) - 在"更多"tab中
- 文件: `src/screens/FirewallAnalysisScreen.tsx`
- 当前状态: 没有 zoneId 参数，可能需要添加
- 操作: 检查是否有 Zone 选择器组件

### 6. 地理分布 (GeoDistributionScreen) - 在"更多"tab中
- 文件: `src/screens/GeoDistributionScreen.tsx`
- 当前状态: 使用 useZone() hook 获取 zoneId
- 操作: 已确认没有 Zone 选择器

### 7. 协议分布 (ProtocolDistributionScreen) - 在"更多"tab中
- 文件: `src/screens/ProtocolDistributionScreen.tsx`
- 当前状态: 使用 useZone() hook 获取 zoneId
- 操作: 已确认没有 Zone 选择器

### 8. TLS分布 (TLSDistributionScreen) - 在"更多"tab中
- 文件: `src/screens/TLSDistributionScreen.tsx`
- 当前状态: 使用 useZone() hook 获取 zoneId
- 操作: 已确认没有 Zone 选择器

### 9. 内容类型分布 (ContentTypeScreen) - 在"更多"tab中
- 文件: `src/screens/ContentTypeScreen.tsx`
- 当前状态: 使用 useZone() hook 获取 zoneId
- 操作: 已确认没有 Zone 选择器

## 调查结果

经过代码检查：
1. 所有页面都**没有**使用 `ScreenHeader` 组件
2. 所有页面都**没有**直接使用 `ZoneSelector` 组件
3. 页面通过以下方式获取 zoneId：
   - DashboardScreen, SecurityScreen: 从 props 接收
   - 其他页面: 使用 `useZone()` hook 从 context 获取

## 问题分析

从截图看，"当前 Zone cfai.work" 的下拉选择器显示在页面顶部。但代码检查显示这些页面都没有 Zone 选择器组件。

可能的情况：
1. Zone 选择器在 React Navigation 的 header 中（通过 `headerRight` 或自定义 header）
2. Zone 选择器在某个共享的布局组件中
3. 截图中的 Zone 选择器可能是旧版本的代码

## 下一步

需要用户确认：
1. Zone 选择器具体在哪个位置？
2. 是否在所有这些页面都有 Zone 选择器？
3. 或者只是在某些特定页面有？

## 临时方案

如果确实需要移除 Zone 选择器，可以：
1. 检查 MainTabs.tsx 中的 Tab.Navigator 配置
2. 检查是否有自定义的 header 组件
3. 确保所有页面都使用 useZone() hook 从 context 获取 zoneId
