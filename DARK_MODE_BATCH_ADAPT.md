# 深色模式批量适配计划

## 需要适配的页面列表

根据代码扫描，以下页面需要适配深色模式：

### 高优先级（主要功能页面）
1. ✅ HomeScreen - 已完成
2. ⏳ DashboardScreen - 进行中
3. ⏳ SecurityScreen - 进行中
4. ⏳ StatusCodesScreen
5. ✅ MoreScreen - 已完成

### 中优先级（分析页面）
6. ⏳ GeoDistributionScreen
7. ⏳ ProtocolDistributionScreen
8. ⏳ TLSDistributionScreen
9. ⏳ ContentTypeScreen
10. ⏳ BotAnalysisScreen
11. ⏳ FirewallAnalysisScreen

### 低优先级（设置和管理页面）
12. ⏳ AlertConfigScreen
13. ⏳ AlertHistoryScreen
14. ⏳ TokenManagementScreen
15. ⏳ TokenInputScreen
16. ⏳ AccountZoneSelectionScreen

## 适配模式

每个页面需要：
1. 导入 `useTheme` from `'../contexts'`
2. 在组件中调用 `const { colors } = useTheme();`
3. 替换所有硬编码颜色为动态颜色
4. 移除 StyleSheet 中的颜色定义，改为内联样式

## 颜色映射表

| 硬编码颜色 | 用途 | 替换为 |
|-----------|------|--------|
| #f5f5f5 | 背景 | colors.background |
| #ffffff | 卡片/表面 | colors.surface |
| #333333 | 主文字 | colors.text |
| #666666 | 次要文字 | colors.textSecondary |
| #999999 | 禁用文字 | colors.textDisabled |
| #f6821f, #f97316 | 主题色 | colors.primary |
| #e0e0e0, #f0f0f0 | 边框/分隔线 | colors.border |
| #0066cc, #3498db | 次要主题色 | colors.secondary |
| #2ecc71, #27ae60 | 成功色 | colors.success |
| #f39c12, #f6821f | 警告色 | colors.warning |
| #e74c3c | 错误色 | colors.error |
| #fff3cd | 警告背景 | colors.warning + '20' (透明度) |
| #ffebee | 错误背景 | colors.error + '20' |
| #e8f5e9 | 成功背景 | colors.success + '20' |

## 批量适配策略

由于页面数量较多，我将采用以下策略：

1. **先适配主要页面**（Dashboard, Security, StatusCodes）
2. **再适配分析页面**（Geo, Protocol, TLS, Content, Bot, Firewall）
3. **最后适配设置页面**（Alert, Token, Account）

每批次完成后进行测试，确保没有遗漏。

---

*创建时间: 2026-01-26*
