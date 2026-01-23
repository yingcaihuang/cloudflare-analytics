# 账户和 Zone 搜索功能

## 功能说明
在账户选择页面和 Zone 选择页面都添加了模糊搜索功能，可以快速查找特定的账户或 Zone。

## 功能特性

### 1. 账户搜索
- **搜索范围**：
  - 账户名称（不区分大小写）
  - 账户 ID（不区分大小写）
- **位置**：账户列表上方
- **占位符**："搜索账户名称或 ID..."

### 2. Zone 搜索
- **搜索范围**：
  - Zone 域名（不区分大小写）
  - Zone ID（不区分大小写）
- **位置**：Zone 列表上方（返回按钮下方）
- **占位符**："搜索 Zone 名称或 ID..."

### 3. 搜索行为
- **实时搜索**：输入时立即过滤结果
- **模糊匹配**：支持部分匹配，不需要完整输入
- **不区分大小写**：搜索时忽略大小写
- **清除按钮**：输入内容后显示 ✕ 按钮，点击清空搜索
- **空状态提示**：无匹配结果时显示友好提示

## UI 设计

### 搜索框样式
- 灰色背景（`#f5f5f5`）
- 圆角设计（8px）
- 内边距：水平 16px，垂直 10px
- 字体大小：16px

### 清除按钮
- 圆形按钮（36x36px）
- 灰色背景（`#f0f0f0`）
- ✕ 图标
- 只在有输入时显示

### 空状态
- 主文本："没有找到匹配的账户/Zone"
- 副文本："尝试其他搜索关键词"
- 居中显示

## 实现细节

### 账户搜索状态
```typescript
const [accountSearchQuery, setAccountSearchQuery] = useState('');
```

### 账户过滤逻辑
```typescript
const getFilteredAccounts = () => {
  const sortedAccounts = getSortedAccounts();
  
  if (!accountSearchQuery.trim()) {
    return sortedAccounts;
  }

  const query = accountSearchQuery.toLowerCase().trim();
  return sortedAccounts.filter(account => 
    account.name.toLowerCase().includes(query) ||
    account.id.toLowerCase().includes(query)
  );
};
```

### Zone 搜索状态
```typescript
const [zoneSearchQuery, setZoneSearchQuery] = useState('');
```

### Zone 过滤逻辑
```typescript
const getFilteredZones = () => {
  if (!zoneSearchQuery.trim()) {
    return zones;
  }

  const query = zoneSearchQuery.toLowerCase().trim();
  return zones.filter(zone => 
    zone.name.toLowerCase().includes(query) ||
    zone.id.toLowerCase().includes(query)
  );
};
```

## 用户体验流程

### 账户搜索
1. **进入账户列表**：
   - 显示所有账户
   - 搜索框为空
   - 可以看到排序按钮（如果有 zone 数量记录）

2. **开始搜索**：
   - 输入关键词（如 "production"）
   - 列表实时过滤
   - 显示清除按钮
   - 保持排序顺序

3. **查看结果**：
   - 匹配的账户显示在列表中
   - 无匹配时显示空状态提示

4. **清除搜索**：
   - 点击 ✕ 按钮清空搜索
   - 列表恢复显示所有账户

### Zone 搜索
1. **进入 Zone 列表**：
   - 显示所有 zones
   - 搜索框为空

2. **开始搜索**：
   - 输入域名或 ID（如 "example.com"）
   - 列表实时过滤
   - 显示清除按钮

3. **查看结果**：
   - 匹配的 zones 显示在列表中
   - 无匹配时显示空状态提示

4. **清除搜索**：
   - 点击 ✕ 按钮清空搜索
   - 或返回账户列表自动清空

## 使用场景

### 场景 1：快速查找生产环境账户
用户有多个账户，想快速找到生产环境：
- 输入 "prod" 或 "production"
- 立即显示所有包含该关键词的账户

### 场景 2：通过域名查找 Zone
用户知道域名，想快速定位：
- 输入 "example.com"
- 快速找到对应的 zone

### 场景 3：通过 ID 查找
用户知道账户或 Zone ID 的一部分：
- 输入 ID 片段
- 快速定位到目标

### 场景 4：大量数据筛选
账户或 zones 数量很多：
- 使用搜索快速缩小范围
- 避免滚动查找

## 技术要点
- 使用 `toLowerCase()` 实现不区分大小写搜索
- 使用 `includes()` 实现模糊匹配
- 使用 `trim()` 去除首尾空格
- 条件渲染清除按钮和空状态
- 账户搜索保持排序顺序
- Zone 搜索在返回时自动清空

## 修改文件
- `cloudflare-analytics/src/screens/AccountZoneSelectionScreen.tsx`

## 样式复用
账户搜索和 Zone 搜索使用相同的样式：
- `searchContainer`
- `searchInput`
- `clearButton`
- `clearButtonText`
- `emptyContainer`
- `emptyText`
- `emptySubtext`
