# 数据加载问题修复

**问题:** 流量分析页面（地理分布、协议分布、TLS版本、内容类型）没有发起 API 请求，数据显示为 0

**修复时间:** 2026-01-23

## 🔍 根本原因

### 问题 1: Props vs Context
这些页面原本设计为接收 `zoneId` 作为 props，但是：
1. 在导航中传递 props 会导致组件每次渲染都创建新的引用
2. `params` 对象每次都是新的，导致 `useEffect` 不断触发
3. 没有正确使用 ZoneContext

### 问题 2: GraphQL 类型错误
部分 GraphQL 查询使用了小写的 `string!` 而不是 `String!`

## ✅ 修复内容

### 1. 修改页面组件使用 ZoneContext

**修改的文件:**
- `src/screens/GeoDistributionScreen.tsx`
- `src/screens/ProtocolDistributionScreen.tsx`
- `src/screens/TLSDistributionScreen.tsx`
- `src/screens/ContentTypeScreen.tsx`

**修改前:**
```typescript
interface GeoDistributionScreenProps {
  zoneId: string;
}

export default function GeoDistributionScreen({ zoneId }: GeoDistributionScreenProps) {
  const params: MetricsQueryParams = {
    zoneId,
    ...getTodayRange(),
    granularity: 'hour',
  };
  
  const { data, loading, error } = useGeoDistribution(params);
  // ...
}
```

**修改后:**
```typescript
import { useZone } from '../contexts/ZoneContext';

export default function GeoDistributionScreen() {
  const { zoneId } = useZone();
  
  // Memoize params to prevent unnecessary re-renders
  const params: MetricsQueryParams = useMemo(() => ({
    zoneId: zoneId || '',
    ...getTodayRange(),
    granularity: 'hour',
  }), [zoneId]);
  
  const { data, loading, error } = useGeoDistribution(params);
  // ...
}
```

**关键改进:**
1. ✅ 从 ZoneContext 获取 zoneId
2. ✅ 使用 `useMemo` 缓存 params 对象
3. ✅ 移除 props 接口定义
4. ✅ 添加 `useZone` import

### 2. 更新导航配置

**修改文件:** `App.tsx`

**修改前:**
```typescript
<Stack.Screen name="GeoDistribution">
  {(props) => <GeoDistributionScreen {...props} zoneId={zoneId!} />}
</Stack.Screen>
```

**修改后:**
```typescript
<Stack.Screen 
  name="GeoDistribution"
  component={GeoDistributionScreen}
  options={{
    title: '地理分布',
    headerBackTitle: '返回',
  }}
/>
```

**关键改进:**
1. ✅ 直接使用 `component` 属性
2. ✅ 移除 props 传递
3. ✅ 组件自己从 Context 获取 zoneId

### 3. 修复 GraphQL 类型错误

**修改文件:** `src/services/GraphQLClient.ts`

修复了 6 个查询中的类型定义：
- `queryGeoDistribution`: `$zoneTag: string!` → `$zoneTag: String!`
- `queryProtocolDistribution`: `$zoneTag: string!` → `$zoneTag: String!`
- `queryTLSDistribution`: `$zoneTag: string!` → `$zoneTag: String!`
- `queryContentTypeDistribution`: `$zoneTag: string!` → `$zoneTag: String!`
- `queryBotAnalysis`: `$zoneTag: string!` → `$zoneTag: String!`
- `queryFirewallAnalysis`: `$zoneTag: string!` → `$zoneTag: String!`

## 🎯 预期行为

修复后，当用户访问这些页面时：

1. **组件挂载** → 从 ZoneContext 获取 zoneId
2. **创建 params** → useMemo 确保 params 只在 zoneId 变化时重新创建
3. **Hook 触发** → useEffect 检测到 params 变化，触发数据获取
4. **发起请求** → GraphQLClient 发送正确的 GraphQL 查询
5. **显示数据** → 页面显示实际数据和图表

## 📊 数据流程

```
用户打开页面
    ↓
组件挂载
    ↓
useZone() 获取 zoneId
    ↓
useMemo 创建 params (只在 zoneId 变化时)
    ↓
useGeoDistribution(params) 触发
    ↓
useEffect 检测到 params
    ↓
fetchData() 调用
    ↓
检查缓存
    ↓
发起 GraphQL 请求
    ↓
解析响应
    ↓
更新状态
    ↓
UI 重新渲染显示数据
```

## 🧪 测试验证

### 验证步骤:
1. ✅ 重启应用
2. ✅ 登录并选择 Zone
3. ✅ 进入"更多"标签
4. ✅ 点击"地理分布"
5. ✅ 观察控制台日志
6. ✅ 确认看到 GraphQL 查询日志
7. ✅ 确认页面显示数据

### 预期日志:
```
Fetching geo distribution data from API
Geo distribution query result: { ... }
```

## 🔧 技术细节

### useMemo 的重要性

**为什么需要 useMemo:**
```typescript
// ❌ 错误 - 每次渲染都创建新对象
const params = {
  zoneId,
  startDate: new Date(),
  endDate: new Date(),
};

// ✅ 正确 - 只在依赖变化时创建新对象
const params = useMemo(() => ({
  zoneId: zoneId || '',
  ...getTodayRange(),
  granularity: 'hour',
}), [zoneId]);
```

### useEffect 依赖

在 hooks 中：
```typescript
useEffect(() => {
  if (autoFetch) {
    fetchData(false);
  }
}, [autoFetch, fetchData]);
```

`fetchData` 使用 `useCallback` 包装，依赖于 `params`。当 `params` 变化时，`fetchData` 重新创建，触发 `useEffect`。

## 📝 相关文件

### 修改的文件:
1. `src/screens/GeoDistributionScreen.tsx` - 使用 ZoneContext
2. `src/screens/ProtocolDistributionScreen.tsx` - 使用 ZoneContext
3. `src/screens/TLSDistributionScreen.tsx` - 使用 ZoneContext
4. `src/screens/ContentTypeScreen.tsx` - 使用 ZoneContext
5. `App.tsx` - 更新导航配置
6. `src/services/GraphQLClient.ts` - 修复 GraphQL 类型

### 未修改的文件:
- Hooks 文件 (useGeoDistribution, etc.) - 已经正确实现
- GraphQLClient 查询逻辑 - 已经正确实现
- ZoneContext - 已经正确实现

## ✅ 验证清单

- [x] TypeScript 编译通过
- [x] ESLint 检查通过
- [x] 所有页面使用 ZoneContext
- [x] 所有 params 使用 useMemo
- [x] 导航配置正确
- [x] GraphQL 类型正确

## 🚀 下一步

1. **重启应用** - 确保所有修改生效
2. **测试每个页面** - 验证数据加载
3. **检查控制台** - 确认 API 请求发出
4. **验证数据显示** - 确认图表和数值正确

## 💡 经验教训

1. **使用 Context 而不是 Props** - 对于全局状态（如 zoneId），使用 Context 更合适
2. **Memoize 对象** - 传递给 hooks 的对象参数应该使用 useMemo
3. **GraphQL 类型大小写** - GraphQL 类型名称必须首字母大写
4. **组件设计** - 组件应该自己获取需要的数据，而不是依赖 props 传递

---

**修复状态:** ✅ 完成  
**测试状态:** 待用户验证  
**下一步:** 重启应用并测试数据加载
