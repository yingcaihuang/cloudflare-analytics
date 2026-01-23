# Home Screen Count Debug

## Issue
首页显示的账户和zones数量不对，只显示了1个，但实际应该有6个账户和109个zones。

## Possible Causes

### 1. ZoneContext 初始化时序问题
- `ZoneProvider` 在 App 组件挂载时初始化
- `initializeContext()` 调用 `loadAccounts()` 
- 但 HomeScreen 可能在数据加载完成前就渲染了

### 2. loadAccounts 函数可能有问题
检查点：
- 分页逻辑是否正确
- API 响应是否正确解析
- 是否所有页面都被加载

### 3. 数据没有正确传递到 HomeScreen
- ZoneContext 的 accounts 状态可能没有更新
- HomeScreen 的 useEffect 依赖可能有问题

## Debug Steps

### Step 1: 添加详细日志
在以下位置添加 console.log：
1. ✅ HomeScreen useEffect - 显示 accounts 数组详情
2. ZoneContext loadAccounts - 显示每页加载的账户数
3. ZoneContext setAccounts - 显示设置的账户总数

### Step 2: 检查 API 响应
- 确认 Cloudflare API 返回的账户数量
- 确认分页信息是否正确

### Step 3: 检查状态更新
- 确认 setAccounts 被正确调用
- 确认 accounts 状态在 Context 中正确更新
- 确认 HomeScreen 能够接收到更新后的 accounts

## Current Code Analysis

### ZoneContext.loadAccounts()
```typescript
const loadAccounts = async () => {
  // ... 
  while (hasMore) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts?page=${page}&per_page=100`,
      // ...
    );
    // ...
    allAccounts.push(...pageAccounts);
    hasMore = resultInfo && resultInfo.page < resultInfo.total_pages;
    page++;
  }
  console.log(`Total accounts loaded: ${allAccounts.length}`);
  setAccounts(allAccounts);
}
```

分页逻辑看起来正确。

### HomeScreen
```typescript
const { accounts, totalZonesCount, zoneName, isLoading, refreshAccounts } = useZone();

useEffect(() => {
  loadTokenCount();
  console.log('HomeScreen - accounts:', accounts.length, 'totalZones:', totalZonesCount);
  console.log('HomeScreen - accounts detail:', JSON.stringify(accounts, null, 2));
}, [accounts, totalZonesCount]);
```

依赖数组包含 accounts 和 totalZonesCount，应该会在它们变化时重新运行。

## Next Actions
1. 运行应用并查看控制台日志
2. 检查 `loadAccounts` 的日志输出
3. 检查 HomeScreen 的日志输出
4. 确认实际加载的账户数量

## Expected Console Output
```
ZoneContext: Total accounts loaded: 6
HomeScreen - accounts: 6 totalZones: 109
HomeScreen - accounts detail: [
  { "id": "...", "name": "Account 1" },
  { "id": "...", "name": "Account 2" },
  ...
]
```

## Actual Console Output
(待用户提供)
