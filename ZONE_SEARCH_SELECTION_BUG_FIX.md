# Zone搜索选择Bug修复 - 最终版本

## 问题描述
用户在搜索zone的过程中，查到后点击对应的zone，但选择没有成功。

## 根本原因分析
通过详细的日志分析发现了真正的问题：

1. **竞态条件**: 当用户在全局搜索中选择zone时，`handleGlobalZoneSelect` 调用 `setSelectedAccount(account)` 来切换账户
2. **并发操作**: 同时，ZoneContext的初始化过程可能正在从AsyncStorage恢复之前的账户和zones数据
3. **状态覆盖**: 结果是我们设置的账户和zones被缓存恢复的数据覆盖了

从日志可以看到：
- 搜索找到的zone ID: `ebe7d6af4617e462c4ab0c7214db609d`
- 账户切换后正确加载了1个zone: `ebe7d6af4617e462c4ab0c7214db609d`
- 但setZoneId时zones数组变成了7个不同的zones，不包含目标zone

## 最终解决方案

### 1. 新增 `setAccountAndZoneFromSearch` 方法
在ZoneContext中添加了一个专门的方法来处理从搜索结果直接设置账户和zone，避免了复杂的异步加载过程：

```typescript
const setAccountAndZoneFromSearch = async (account: Account, zoneId: string, zoneName: string) => {
  try {
    setIsLoading(true);
    setError(null);
    
    // Set account
    setSelectedAccountState(account);
    setAccountTag(account.id);
    
    // Set zone directly
    setZoneIdState(zoneId);
    setZoneName(zoneName);
    
    // Persist selections
    await AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, JSON.stringify(account));
    await AsyncStorage.setItem(SELECTED_ZONE_KEY, zoneId);
    
    console.log('Account and zone set directly from search:', account.name, zoneName);
    
    // Load zones in background for future use
    loadZones(account).catch(err => {
      console.error('Background zone loading failed:', err);
    });
    
  } catch (err) {
    console.error('Error setting account and zone from search:', err);
    setError(err instanceof Error ? err.message : 'Failed to set account and zone');
  } finally {
    setIsLoading(false);
  }
};
```

### 2. 简化 `handleGlobalZoneSelect` 方法
```typescript
const handleGlobalZoneSelect = async (result: { zone: any; accountName: string; accountId: string }) => {
  if (isSelectingGlobalZone) {
    console.log('Already selecting a global zone, ignoring');
    return;
  }

  try {
    setIsSelectingGlobalZone(true);
    
    // Find the account
    const account = accounts.find(acc => acc.id === result.accountId);
    if (!account) {
      console.error('Account not found:', result.accountId);
      return;
    }

    console.log('Selecting global zone:', result.zone.id, result.zone.name, 'from account:', account.name);

    // Use the new method to set account and zone directly
    await setAccountAndZoneFromSearch(account, result.zone.id, result.zone.name);
    
    console.log('Zone selection completed');
    
    // Complete the selection
    onComplete();
  } catch (error) {
    console.error('Error selecting global zone:', error);
  } finally {
    setIsSelectingGlobalZone(false);
  }
};
```

### 3. 添加并发保护
使用 `isSelectingGlobalZone` 状态来防止并发的zone选择操作。

## 修改的文件

### src/contexts/ZoneContext.tsx
1. 添加了 `setAccountAndZoneFromSearch` 方法
2. 更新了 `ZoneContextType` 接口
3. 在Provider中导出新方法

### src/screens/AccountZoneSelectionScreen.tsx
1. 导入并使用新的 `setAccountAndZoneFromSearch` 方法
2. 简化了 `handleGlobalZoneSelect` 逻辑
3. 添加了并发保护机制

## 优势
1. **避免竞态条件**: 直接设置账户和zone，不依赖异步加载过程
2. **提高性能**: 不需要等待zones重新加载
3. **更可靠**: 使用搜索时已获取的准确数据
4. **后台加载**: zones在后台加载，不影响用户体验

## 测试建议
1. 在全局搜索中搜索一个zone
2. 点击搜索结果中的zone
3. 验证zone选择成功，界面立即显示正确的zone名称
4. 检查控制台确认没有"Zone not found"警告

## 预期效果
- 用户点击搜索结果后立即成功选择zone
- 界面立即显示正确的账户和zone信息
- 不再出现竞态条件导致的选择失败
- 后台自动加载完整的zones列表供后续使用