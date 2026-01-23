# 数据加载调试指南

**问题:** 功能页面显示全是 0，没有看到 API 请求发出

## 🔍 已修复的问题

### 1. GraphQL 类型定义错误 ✅
**问题:** 部分 GraphQL 查询使用了小写的 `string!` 而不是 `String!`

**修复:**
- `queryGeoDistribution`: `$zoneTag: string!` → `$zoneTag: String!`
- `queryProtocolDistribution`: `$zoneTag: string!` → `$zoneTag: String!`
- `queryTLSDistribution`: `$zoneTag: string!` → `$zoneTag: String!`
- `queryContentTypeDistribution`: `$zoneTag: string!` → `$zoneTag: String!`
- `queryBotAnalysis`: `$zoneTag: string!` → `$zoneTag: String!`
- `queryFirewallAnalysis`: `$zoneTag: string!` → `$zoneTag: String!`

## 🐛 可能的其他问题

### 2. API Token 配置
**检查项:**
- 确保已经输入有效的 Cloudflare API Token
- Token 需要有以下权限:
  - Zone:Analytics:Read
  - Zone:Zone:Read

**验证方法:**
1. 打开应用
2. 进入 Token 管理页面
3. 确认 Token 已保存
4. 尝试重新输入 Token

### 3. Zone 选择
**检查项:**
- 确保已经选择了一个 Zone
- Zone ID 必须有效

**验证方法:**
1. 检查是否在账户和 Zone 选择页面选择了 Zone
2. 在主界面顶部应该显示当前选择的 Zone 名称

### 4. GraphQL API 端点
**检查项:**
- 确认 `.env.development` 中的 API 端点配置正确

**当前配置:**
```
CLOUDFLARE_API_ENDPOINT=https://api.cloudflare.com/client/v4/graphql
```

### 5. 网络连接
**检查项:**
- 确保设备/模拟器可以访问互联网
- 确保可以访问 Cloudflare API

**测试方法:**
```bash
curl -X POST https://api.cloudflare.com/client/v4/graphql \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ viewer { zones(filter: { zoneTag: \"YOUR_ZONE_ID\" }) { zoneTag } } }"}'
```

## 🔧 调试步骤

### 步骤 1: 检查控制台日志
在 Expo 开发工具中查看控制台输出，寻找:
- GraphQL 查询日志
- 错误消息
- 网络请求失败

### 步骤 2: 启用详细日志
在 `GraphQLClient.ts` 中，所有查询都有 `console.log` 输出。检查:
```
Bot analysis query result: ...
Firewall analysis query result: ...
Geo distribution query result: ...
```

### 步骤 3: 检查缓存
如果之前有错误的缓存数据:
```javascript
// 在应用中清除缓存
await CacheManager.clearCache();
```

### 步骤 4: 检查 Zone Context
确保 ZoneContext 正确提供 zoneId:
```javascript
const { zoneId } = useZone();
console.log('Current zoneId:', zoneId);
```

## 📊 数据流程

```
用户打开页面
    ↓
Hook 调用 (useBotAnalysis, useFirewallAnalysis, etc.)
    ↓
检查 ZoneContext 中的 zoneId
    ↓
检查缓存 (CacheManager)
    ↓
如果缓存无效或不存在
    ↓
调用 GraphQLClient 方法
    ↓
发送 GraphQL 请求到 Cloudflare API
    ↓
解析响应数据
    ↓
保存到缓存
    ↓
更新 UI 显示
```

## 🧪 测试建议

### 测试 1: 验证 Token
```typescript
// 在 TokenManagementScreen 中
const token = await AuthManager.getCurrentToken();
console.log('Token exists:', !!token);
```

### 测试 2: 验证 Zone ID
```typescript
// 在任意页面中
import { useZone } from '../contexts/ZoneContext';

const { zoneId, zoneName } = useZone();
console.log('Zone ID:', zoneId);
console.log('Zone Name:', zoneName);
```

### 测试 3: 手动触发查询
```typescript
// 在页面中添加测试按钮
const testQuery = async () => {
  try {
    const result = await GraphQLClient.queryBotAnalysis({
      zoneId: 'YOUR_ZONE_ID',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(),
    });
    console.log('Test query result:', result);
  } catch (error) {
    console.error('Test query error:', error);
  }
};
```

## 🔍 常见错误和解决方案

### 错误 1: "No zone selected"
**原因:** ZoneContext 中没有 zoneId  
**解决:** 返回账户和 Zone 选择页面，重新选择 Zone

### 错误 2: "GraphQL error: Invalid token"
**原因:** API Token 无效或过期  
**解决:** 重新输入有效的 API Token

### 错误 3: "GraphQL error: Insufficient permissions"
**原因:** Token 权限不足  
**解决:** 确保 Token 有 Analytics:Read 权限

### 错误 4: "Network request failed"
**原因:** 网络连接问题  
**解决:** 检查网络连接，确保可以访问 Cloudflare API

### 错误 5: 数据全是 0
**可能原因:**
1. Zone 在查询时间范围内没有流量
2. GraphQL 查询返回空数据
3. 数据解析错误

**解决:**
1. 选择一个有流量的 Zone
2. 检查控制台日志中的原始 API 响应
3. 验证数据解析逻辑

## 📝 下一步行动

1. **重启应用** - 确保所有修复生效
2. **清除缓存** - 删除应用数据或使用缓存清除功能
3. **重新登录** - 输入 Token 并选择 Zone
4. **查看日志** - 在 Expo 开发工具中查看详细日志
5. **测试查询** - 尝试访问不同的功能页面

## 🚨 如果问题仍然存在

1. 检查 Expo 开发工具的控制台输出
2. 查看网络请求（使用 React Native Debugger 或 Flipper）
3. 验证 Cloudflare API 是否正常工作
4. 检查 Zone 是否有实际的流量数据

## 💡 提示

- 某些 Zone 可能没有足够的流量数据
- 免费计划的 Zone 可能有数据限制
- 某些指标可能需要特定的 Cloudflare 计划
- 数据可能有延迟（通常几分钟）

---

**修复状态:** GraphQL 类型错误已修复 ✅  
**下一步:** 重启应用并测试数据加载
