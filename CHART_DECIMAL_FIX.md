# 柱状图小数位数修复

## 问题
协议分布页面的柱状图上方显示的 tooltip 数字小数位数过长（例如：`6.015384615384615`）。

## 根本原因
`react-native-chart-kit` 库的 `decimalPlaces: 0` 配置只影响 Y 轴标签，不影响柱状图上方显示的数值。

## 解决方案
在 BarChart 组件中，在传递数据给图表之前，先使用 `Math.round()` 对所有数据进行四舍五入。

### 修改文件
- `cloudflare-analytics/src/components/BarChart.tsx`

### 修改内容
1. **在组件内部对数据进行四舍五入：**
```typescript
// 在传递给图表之前，先四舍五入所有数据
const roundedData = data.map(value => Math.round(value));

const chartData = {
  labels: labels,
  datasets: [
    {
      data: roundedData, // 使用四舍五入后的数据
    },
  ],
};
```

2. **在图例中使用四舍五入后的数据：**
```typescript
{label}: {roundedData[index]?.toLocaleString() || 0}{yAxisSuffix}
```

## 影响范围
此修复影响所有使用 BarChart 组件的页面：
- 协议分布页面 (Protocol Distribution) - 显示百分比
- Bot 分析页面 (Bot Analysis) - 显示计数

## 测试
1. 在协议分布页面查看柱状图上方的数字，确认不再显示小数位
2. 在 Bot 分析页面查看柱状图，确认计数显示正常
3. 检查图例中的数字也应该是整数
