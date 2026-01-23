# 账户 Zone 数量角标和排序功能

## 功能说明
在账户选择页面，为已访问过的账户显示一个绿色角标，显示该账户下有多少个 zone，并提供排序功能。

## 功能特性

### 1. Zone 数量角标
- 绿色背景（`#22c55e`）
- 白色文字
- 圆角设计
- 显示在账户名称右侧

### 2. 排序功能
- **位置**：标题右侧的排序按钮
- **默认排序**：降序（zone 数量从多到少）
- **切换排序**：点击按钮在降序和升序之间切换
- **排序规则**：
  - 有 zone 数量记录的账户会被排序
  - 没有 zone 数量记录的账户保持在列表末尾
  - 降序：↓ 图标，zone 数量从多到少
  - 升序：↑ 图标，zone 数量从少到多

## 实现方式

### 1. ZoneContext 修改
在 `ZoneContext` 中添加了 `accountZoneCounts` 状态来存储每个账户的 zone 数量：

```typescript
accountZoneCounts: Map<string, number>; // Map of account ID to zone count
```

当加载某个账户的 zones 时，会自动更新该账户的 zone 数量：

```typescript
setAccountZoneCounts(prev => {
  const newMap = new Map(prev);
  newMap.set(account.id, allZones.length);
  return newMap;
});
```

### 2. AccountZoneSelectionScreen 修改

#### 排序状态管理
```typescript
const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // 默认降序
```

#### 排序逻辑
```typescript
const getSortedAccounts = () => {
  const accountsWithCounts: any[] = [];
  const accountsWithoutCounts: any[] = [];

  accounts.forEach(account => {
    const zoneCount = accountZoneCounts.get(account.id);
    if (zoneCount !== undefined) {
      accountsWithCounts.push({ ...account, zoneCount });
    } else {
      accountsWithoutCounts.push(account);
    }
  });

  // Sort accounts with zone counts
  accountsWithCounts.sort((a, b) => {
    if (sortOrder === 'desc') {
      return b.zoneCount - a.zoneCount;
    } else {
      return a.zoneCount - b.zoneCount;
    }
  });

  return [...accountsWithCounts, ...accountsWithoutCounts];
};
```

#### 排序按钮 UI
- 只在有 zone 数量记录时显示
- 显示箭头图标（↓ 降序 / ↑ 升序）
- 灰色背景，绿色图标
- 点击切换排序顺序

## 用户体验
1. 首次进入账户列表时，所有账户都没有角标，排序按钮不显示
2. 点击某个账户后，系统会加载该账户的 zones
3. 返回账户列表时：
   - 该账户会显示绿色角标，显示 zone 数量
   - 排序按钮出现在标题右侧
   - 账户列表按 zone 数量降序排列
4. 点击排序按钮：
   - 在降序和升序之间切换
   - 图标从 ↓ 变为 ↑（或相反）
   - 列表立即重新排序

## 修改文件
- `cloudflare-analytics/src/contexts/ZoneContext.tsx` - 添加 zone 数量存储
- `cloudflare-analytics/src/screens/AccountZoneSelectionScreen.tsx` - 显示角标和排序功能

## 效果
用户可以：
- 在账户列表中直接看到每个账户有多少个 zone
- 按 zone 数量对账户进行排序
- 快速找到 zone 最多或最少的账户
