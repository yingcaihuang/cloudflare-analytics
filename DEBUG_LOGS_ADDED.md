# 调试日志已添加

**时间:** 2026-01-23  
**目的:** 诊断为什么地理分布等页面没有发起 API 请求

## 📝 添加的日志

### 1. GeoDistributionScreen 组件
- 组件挂载/更新时的日志
- zoneId 值
- params 创建时的日志
- Hook 返回结果

### 2. useGeoDistribution Hook
- Hook 调用时的参数
- autoFetch 值
- fetchData 调用时的日志
- zoneId 检查
- 缓存检查
- API 调用
- 错误信息

### 3. GraphQLClient.queryGeoDistribution
- 方法调用参数
- GraphQL 查询变量
- 查询结果

## 🔍 如何查看日志

### 方法 1: Expo 开发工具
1. 打开 Expo 开发工具（通常在浏览器中自动打开）
2. 点击 "Logs" 或 "Console" 标签
3. 打开地理分布页面
4. 查看控制台输出

### 方法 2: React Native Debugger
1. 打开 React Native Debugger
2. 在 Expo 应用中按 `Cmd+D` (iOS) 或摇晃设备 (Android)
3. 选择 "Debug Remote JS"
4. 在 Debugger 的 Console 中查看日志

### 方法 3: 终端日志
在运行 `npm start` 的终端中也会显示日志

## 📊 预期日志流程

如果一切正常，你应该看到以下日志序列：

```
[GeoDistributionScreen] Component mounted/updated
[GeoDistributionScreen] zoneId: <your-zone-id>
[GeoDistributionScreen] Creating params: { zoneId: '...', startDate: ..., endDate: ..., granularity: 'hour' }
[useGeoDistribution] Hook called with params: { ... }
[useGeoDistribution] autoFetch: true
[useGeoDistribution] useEffect triggered, autoFetch: true
[useGeoDistribution] Calling fetchData...
[useGeoDistribution] fetchData called, forceRefresh: false
[useGeoDistribution] params.zoneId: <your-zone-id>
[useGeoDistribution] Cache key: geo_distribution_<zone-id>_<dates>
[useGeoDistribution] Checking cache...
[useGeoDistribution] No cached data found
[useGeoDistribution] Fetching from API...
[GraphQLClient] queryGeoDistribution called with params: { ... }
[GraphQLClient] Query variables: { zoneTag: '...', filter: { ... } }
[GraphQLClient] Sending GraphQL query...
[GraphQLClient] Query result: { ... }
[useGeoDistribution] API result: { ... }
[GeoDistributionScreen] Hook result: { data: {...}, loading: false, error: null }
```

## 🐛 可能的问题场景

### 场景 1: 没有任何日志
**可能原因:**
- 组件没有挂载
- 导航配置错误
- 应用崩溃

**检查:**
- 确认点击了"地理分布"按钮
- 检查是否有错误提示
- 重启应用

### 场景 2: 只有组件日志，没有 Hook 日志
**可能原因:**
- Hook 没有被调用
- 导入错误

**检查:**
- 确认 `useGeoDistribution` 正确导入
- 检查是否有 TypeScript 错误

### 场景 3: Hook 日志显示但 fetchData 没有调用
**可能原因:**
- useEffect 没有触发
- autoFetch 为 false
- fetchData 依赖问题

**日志示例:**
```
[useGeoDistribution] Hook called with params: { ... }
[useGeoDistribution] autoFetch: true
// 但没有 "useEffect triggered" 日志
```

### 场景 4: fetchData 调用但没有 zoneId
**可能原因:**
- ZoneContext 没有提供 zoneId
- 用户没有选择 Zone

**日志示例:**
```
[GeoDistributionScreen] zoneId: undefined
[useGeoDistribution] params.zoneId: 
[useGeoDistribution] No zoneId, skipping fetch
```

**解决方案:**
- 返回 Zone 选择页面
- 重新选择一个 Zone

### 场景 5: API 调用失败
**可能原因:**
- Token 无效
- 网络问题
- GraphQL 查询错误

**日志示例:**
```
[GraphQLClient] Sending GraphQL query...
[useGeoDistribution] Error: GraphQL error: ...
```

## 🎯 下一步行动

1. **重启应用** - 确保新代码生效
2. **打开控制台** - 使用上述任一方法
3. **访问地理分布页面** - 点击"更多" → "地理分布"
4. **查看日志** - 记录看到的日志序列
5. **报告问题** - 如果有异常，分享日志内容

## 📋 日志检查清单

请检查以下日志是否出现：

- [ ] `[GeoDistributionScreen] Component mounted/updated`
- [ ] `[GeoDistributionScreen] zoneId: <some-value>`
- [ ] `[GeoDistributionScreen] Creating params:`
- [ ] `[useGeoDistribution] Hook called with params:`
- [ ] `[useGeoDistribution] useEffect triggered`
- [ ] `[useGeoDistribution] Calling fetchData...`
- [ ] `[useGeoDistribution] fetchData called`
- [ ] `[GraphQLClient] queryGeoDistribution called`
- [ ] `[GraphQLClient] Sending GraphQL query...`

## 💡 提示

- 日志以 `[ComponentName]` 或 `[HookName]` 开头，便于识别来源
- 如果看到 "No zoneId, skipping fetch"，说明需要选择 Zone
- 如果看到 GraphQL 错误，可能是 Token 或权限问题
- 缓存日志可以帮助理解数据来源

---

**状态:** 调试日志已添加 ✅  
**下一步:** 重启应用并查看控制台日志
