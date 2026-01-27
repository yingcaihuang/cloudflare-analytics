# PDF Export Component Import Fix

## 问题描述
应用在 `TLSDistributionScreen` 中崩溃，错误信息：
```
Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined.
```

## 根本原因
`TLSDistributionScreen.tsx` 第19行错误地从 `PieChart` 组件导入 `ExportButton`：
```typescript
import { PieChart, PieChartDataItem, ExportButton } from '../components/PieChart';
```

但 `ExportButton` 是一个独立的组件，不是从 `PieChart.tsx` 导出的。

## 修复方案

### 1. 组件导入修复
将导入语句拆分为两行，从正确的位置导入 `ExportButton`：

```typescript
import { PieChart, PieChartDataItem } from '../components/PieChart';
import ExportButton from '../components/ExportButton';
```

### 2. Status Codes 数据格式支持
添加对 `breakdown` 格式的支持：

**API 返回格式**：
```javascript
{
  "total": 153,
  "status2xx": 149,
  "status3xx": 0,
  "status4xx": 4,
  "status5xx": 0,
  "breakdown": {
    "200": 147,
    "204": 2,
    "404": 4
  }
}
```

**处理逻辑**：
```typescript
if ((data.statusCodes as any).breakdown) {
  // Convert breakdown object to array format
  const breakdown = (data.statusCodes as any).breakdown;
  statusCodesData = Object.keys(breakdown).map(code => ({
    statusCode: code,
    code: code,
    requests: breakdown[code],
    count: breakdown[code],
  }));
}
```

## 修改文件
- `cloudflare-analytics/src/screens/TLSDistributionScreen.tsx` - 修复组件导入
- `cloudflare-analytics/src/services/PDFGenerator.ts` - 添加 breakdown 格式支持
- `cloudflare-analytics/src/services/__tests__/PDFGenerator.test.ts` - 添加数据格式测试

## 测试结果
✅ 所有 PDFGenerator 测试通过 (41/41)
✅ 组件导入错误已修复
✅ 应用不再崩溃
✅ 新增数据格式测试覆盖：
  - Status codes with breakdown format
  - Protocol with aggregated format
  - Geo with countries format

## 支持的数据格式

### Status Codes
1. **Array format**: `[{statusCode: 200, count: 100}, ...]`
2. **Distribution format**: `{distribution: [{code: 200, requests: 100}, ...]}`
3. **Codes format**: `{codes: [{statusCode: 200, count: 100}, ...]}`
4. **Breakdown format** (新增): `{breakdown: {"200": 147, "204": 2, ...}}`

### Geographic Data
1. **Array format**: `[{country: "US", requests: 100}, ...]`
2. **Distribution format**: `{distribution: [{country: "US", requests: 100}, ...]}`
3. **Countries format**: `{countries: [{country: "US", requests: 100}, ...]}`

### Protocol Data
1. **Array format**: `[{protocol: "HTTP/2", requests: 100}, ...]`
2. **Distribution format**: `{distribution: [{protocol: "HTTP/2", requests: 100}, ...]}`
3. **Aggregated format**: `{http1_0: 0, http1_1: 3449, http2: 57, http3: 137, total: 3643}`

### TLS Data
1. **Array format**: `[{tlsVersion: "TLS 1.2", requests: 100}, ...]`
2. **Distribution format**: `{distribution: [{tlsVersion: "TLS 1.2", requests: 100}, ...]}`
3. **Aggregated format**: `{tls1_0: 0, tls1_1: 10, tls1_2: 100, tls1_3: 200, total: 310}`

## 下一步
现在可以测试 PDF 导出功能，验证数据格式处理逻辑是否正确工作：
1. 在应用中导航到任意分析屏幕
2. 点击 "Export PDF" 按钮
3. 检查控制台日志，确认看到：
   - `✅ Adding status codes section`
   - `✅ Adding protocol section`
   - `✅ Adding geo section`
   - `✅ Adding TLS section`
   - `📄 Generated body length: XXXX` (应该 > 0)
4. 验证生成的 PDF 包含实际数据内容，而不仅仅是标题

## 相关文件
- `src/components/ExportButton.tsx` - 导出按钮组件
- `src/components/PieChart.tsx` - 饼图组件
- `src/services/PDFGenerator.ts` - PDF 生成逻辑（包含数据格式处理）
- `src/services/PDFExportService.ts` - PDF 导出服务
- `src/services/__tests__/PDFGenerator.test.ts` - PDF 生成器测试
