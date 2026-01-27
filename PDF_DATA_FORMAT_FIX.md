# PDF 数据格式修复

## 问题根本原因

通过调试日志发现，GraphQL API 返回的数据格式与 PDFGenerator 期望的格式不匹配：

### 实际返回的数据格式（嵌套对象）
```javascript
{
  geo: {
    distribution: [
      {code: "US", name: "United States", requests: 35, bytes: 1234, percentage: 0.95},
      {code: "CA", name: "Canada", requests: 1, bytes: 495, percentage: 0.027},
      ...
    ]
  },
  statusCodes: {
    distribution: [...]
  },
  protocol: {
    distribution: [...]
  },
  tls: {
    distribution: [...]
  },
  contentType: {
    distribution: [...]
  }
}
```

### PDFGenerator 期望的格式（直接数组）
```javascript
{
  geo: [
    {code: "US", name: "United States", requests: 35, ...},
    ...
  ],
  statusCodes: [...],
  protocol: [...],
  tls: [...],
  contentType: [...]
}
```

## 诊断日志输出

```
LOG  🔍 PDF Generator - Data check: {
  "geoIsArray": false,        ❌ 不是数组
  "geoLength": 0,             ❌ 长度为 0
  "hasGeo": true,             ✅ 数据存在
  "hasSecurity": false,
  "hasStatusCodes": false,
  "hasTraffic": false,
  "statusCodesIsArray": false,
  "statusCodesLength": 0
}
LOG  📄 Generated body length: 0  ❌ 没有生成任何内容
```

## 修复方案

修改 `PDFGenerator.generateHTML()` 方法，使其能够处理两种数据格式：

### 1. 地理分布数据
```typescript
// 修改前
if (data.geo && Array.isArray(data.geo)) {
  body += this.buildGeoDistributionSection(data.geo, theme);
}

// 修改后
if (data.geo) {
  // 处理数组格式和带 distribution 属性的对象格式
  const geoData = Array.isArray(data.geo) ? data.geo : (data.geo as any).distribution;
  if (geoData && Array.isArray(geoData) && geoData.length > 0) {
    console.log('✅ Adding geo section');
    body += this.buildGeoDistributionSection(geoData, theme);
  }
}
```

### 2. 状态码分布数据
```typescript
if (data.statusCodes) {
  const statusCodesData = Array.isArray(data.statusCodes) 
    ? data.statusCodes 
    : (data.statusCodes as any).distribution;
  if (statusCodesData && Array.isArray(statusCodesData) && statusCodesData.length > 0) {
    body += this.buildStatusCodeSection(statusCodesData, theme);
  }
}
```

### 3. 协议分布数据
```typescript
if (data.protocol) {
  const protocolData = Array.isArray(data.protocol) 
    ? data.protocol 
    : (data.protocol as any).distribution;
  if (protocolData && Array.isArray(protocolData) && protocolData.length > 0) {
    body += this.buildProtocolDistributionSection(protocolData, theme);
  }
}
```

### 4. TLS 版本分布数据
```typescript
if (data.tls) {
  const tlsData = Array.isArray(data.tls) 
    ? data.tls 
    : (data.tls as any).distribution;
  if (tlsData && Array.isArray(tlsData) && tlsData.length > 0) {
    body += this.buildTLSDistributionSection(tlsData, theme);
  }
}
```

### 5. 内容类型分布数据
```typescript
if (data.contentType) {
  const contentTypeData = Array.isArray(data.contentType) 
    ? data.contentType 
    : (data.contentType as any).distribution;
  if (contentTypeData && Array.isArray(contentTypeData) && contentTypeData.length > 0) {
    body += this.buildContentTypeSection(contentTypeData, theme);
  }
}
```

## 改进的调试日志

增强了调试日志以显示更详细的数据结构信息：

```typescript
console.log('🔍 PDF Generator - Data check:', {
  hasTraffic: !!data.traffic,
  hasSecurity: !!data.security,
  hasStatusCodes: !!data.statusCodes,
  statusCodesIsArray: Array.isArray(data.statusCodes),
  statusCodesHasDistribution: !!(data.statusCodes as any)?.distribution,
  statusCodesLength: Array.isArray(data.statusCodes) 
    ? data.statusCodes.length 
    : (Array.isArray((data.statusCodes as any)?.distribution) 
        ? (data.statusCodes as any).distribution.length 
        : 0),
  hasGeo: !!data.geo,
  geoIsArray: Array.isArray(data.geo),
  geoHasDistribution: !!(data.geo as any)?.distribution,
  geoLength: Array.isArray(data.geo) 
    ? data.geo.length 
    : (Array.isArray((data.geo as any)?.distribution) 
        ? (data.geo as any).distribution.length 
        : 0),
});
```

## 测试结果

所有测试通过：
```
Test Suites: 1 passed, 1 total
Tests:       38 passed, 38 total
```

## 兼容性

修复后的代码现在支持两种数据格式：

1. **直接数组格式**（向后兼容）:
   ```javascript
   { geo: [...], statusCodes: [...] }
   ```

2. **嵌套对象格式**（新格式）:
   ```javascript
   { 
     geo: { distribution: [...] },
     statusCodes: { distribution: [...] }
   }
   ```

## 下一步测试

请重新测试 PDF 导出功能：

1. 重新启动开发服务器（如果需要）
2. 尝试导出 PDF
3. 查看控制台日志，应该会看到：
   ```
   ✅ Adding geo section
   ✅ Adding status codes section
   ✅ Adding protocol section
   📄 Generated body length: XXXX (应该 > 0)
   ```
4. 打开生成的 PDF，应该能看到完整的数据内容

## 文件修改

- ✅ `src/services/PDFGenerator.ts` - 修复数据格式处理逻辑
- ✅ 所有测试通过

---

**修复时间**：2024-01-27  
**状态**：已修复，等待用户验证
