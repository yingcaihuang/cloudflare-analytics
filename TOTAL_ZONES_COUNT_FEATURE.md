# 总 Zones 数量直接获取功能

## 功能说明
在加载账户列表时，直接通过 Cloudflare API 获取所有 zones 的总数，而不是等用户点击账户后再统计。

## 实现方式

### 1. API 调用
使用 Cloudflare Zones API 的 `result_info` 来获取总数：

```typescript
const loadTotalZonesCount = async (token: string) => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones?per_page=1`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  
  if (data.success && data.result_info) {
    const totalCount = data.result_info.total_count || 0;
    setTotalZonesCount(totalCount);
  }
};
```

### 2. 调用时机
在 `loadAccounts` 函数中，加载完账户后立即获取 zones 总数：

```typescript
console.log(`Total accounts loaded: ${allAccounts.length}`);
setAccounts(allAccounts);

// Load total zones count
await loadTotalZonesCount(token);
```

### 3. 数据存储
在 ZoneContext 中添加状态：

```typescript
const [totalZonesCount, setTotalZonesCount] = useState<number>(0);
```

### 4. 显示逻辑
在账户选择页面直接使用 `totalZonesCount`：

```typescript
{step === 'account' 
  ? `${accounts.length} 个账户${totalZonesCount > 0 ? ` · ${totalZonesCount} 个 Zones` : ''}` 
  : `${selectedAccount?.name} - ${zones.length} 个zones`}
```

## 优势

### 1. 性能优化
- 只需一次 API 调用（`per_page=1`）
- 不需要加载所有 zones 的详细信息
- 利用 Cloudflare API 的 `result_info.total_count` 字段

### 2. 用户体验
- 进入页面立即显示总数
- 不需要等待用户点击账户
- 信息更完整、更直观

### 3. 数据准确性
- 显示所有账户下的 zones 总数
- 不依赖用户是否访问过账户
- 实时反映当前状态

## API 响应示例

```json
{
  "success": true,
  "errors": [],
  "messages": [],
  "result": [...],
  "result_info": {
    "page": 1,
    "per_page": 1,
    "count": 1,
    "total_count": 42,  // 这是我们需要的总数
    "total_pages": 42
  }
}
```

## 显示效果

### 加载前
- 显示：`加载中...`

### 加载后
- 有 zones：`3 个账户 · 42 个 Zones`
- 无 zones：`3 个账户`

## 修改文件
- `cloudflare-analytics/src/contexts/ZoneContext.tsx` - 添加 totalZonesCount 状态和获取逻辑
- `cloudflare-analytics/src/screens/AccountZoneSelectionScreen.tsx` - 使用 totalZonesCount 显示

## 技术要点
- 使用 `per_page=1` 参数最小化数据传输
- 从 `result_info.total_count` 获取总数
- 错误处理不影响主流程（非关键功能）
- 在加载账户后立即调用，保证数据及时性
