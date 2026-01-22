# Cloudflare Analytics Mobile App

<div align="center">

![Cloudflare Analytics](./assets/icon.png)

**一个功能强大的 Cloudflare 流量分析移动应用**

[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

[功能特性](#功能特性) • [快速开始](#快速开始) • [构建 APK](#构建-apk) • [项目结构](#项目结构) • [技术栈](#技术栈)

</div>

---

## 📱 关于项目

Cloudflare Analytics 是一个基于 React Native 和 Expo 开发的跨平台移动应用，为 Cloudflare 用户提供实时的流量监控、安全分析和数据可视化功能。

### ✨ 功能特性

#### 核心功能
- 🔐 **多 Token 管理** - 支持添加和管理多个 Cloudflare API Token
- 🌐 **多账号/多 Zone 支持** - 轻松切换不同账号和域名
- 📊 **实时流量监控** - 查看请求数、带宽、访问量等关键指标
- 📈 **数据可视化** - 折线图、饼图、柱状图展示数据趋势
- 🔄 **下拉刷新** - 实时更新最新数据
- 💾 **离线缓存** - 网络不可用时查看历史数据

#### 数据分析
- 📉 **流量趋势分析** - 24小时/7天/30天流量对比
- 🚦 **HTTP 状态码分析** - 监控网站健康状况
- 🛡️ **安全指标监控** - 缓存命中率、防火墙事件统计
- 🌍 **地理分布分析** - 查看访问者地理位置分布
- 🔒 **TLS 版本分析** - 评估连接安全性
- 🌐 **协议分布分析** - HTTP/1.1、HTTP/2、HTTP/3 使用情况
- 📄 **内容类型分析** - 了解网站资源类型分布

#### 其他功能
- 📤 **数据导出** - 导出 CSV 格式报告
- 🎨 **精美 UI** - 遵循 iOS 和 Android 设计规范
- 🌙 **响应式设计** - 适配不同屏幕尺寸
- ⚡ **性能优化** - 快速加载，流畅体验

---

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- npm 或 yarn
- Expo CLI
- iOS 模拟器或 Android 模拟器（可选）

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/cloudflare-analytics.git
   cd cloudflare-analytics
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm start
   ```

4. **运行应用**
   - iOS: 按 `i` 或运行 `npm run ios`
   - Android: 按 `a` 或运行 `npm run android`
   - Web: 按 `w` 或运行 `npm run web`

---

## 📦 构建 APK

### 使用 EAS Build（推荐）

1. **安装 EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **登录 Expo 账号**
   ```bash
   eas login
   ```

3. **构建 APK**
   ```bash
   npm run build:android
   ```

4. **下载 APK**
   ```bash
   eas build:download
   ```

详细构建指南请查看：
- [如何构建APK.md](./如何构建APK.md)
- [BUILD_INSTRUCTIONS.md](./BUILD_INSTRUCTIONS.md)
- [开始构建.md](./开始构建.md)

---

## 📁 项目结构

```
cloudflare-analytics/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── BarChart.tsx
│   │   ├── LineChart.tsx
│   │   ├── PieChart.tsx
│   │   ├── ChartExporter.tsx
│   │   └── ...
│   ├── screens/             # 页面组件
│   │   ├── TokenManagementScreen.tsx
│   │   ├── AccountZoneSelectionScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── StatusCodesScreen.tsx
│   │   ├── SecurityScreen.tsx
│   │   └── ...
│   ├── services/            # 服务层
│   │   ├── AuthManager.ts
│   │   ├── GraphQLClient.ts
│   │   ├── CacheManager.ts
│   │   └── ExportManager.ts
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useTrafficMetrics.ts
│   │   ├── useStatusCodes.ts
│   │   └── ...
│   ├── contexts/            # React Context
│   │   └── ZoneContext.tsx
│   ├── types/               # TypeScript 类型定义
│   │   ├── auth.ts
│   │   ├── metrics.ts
│   │   └── common.ts
│   ├── utils/               # 工具函数
│   │   └── errorHandler.ts
│   └── navigation/          # 导航配置
│       ├── RootNavigator.tsx
│       ├── MainTabs.tsx
│       └── types.ts
├── assets/                  # 静态资源
├── .kiro/                   # 项目规范文档
│   └── specs/
├── App.tsx                  # 应用入口
├── app.json                 # Expo 配置
├── eas.json                 # EAS Build 配置
├── package.json             # 项目依赖
└── tsconfig.json            # TypeScript 配置
```

---

## 🛠️ 技术栈

### 核心框架
- **React Native** - 跨平台移动应用框架
- **Expo** - React Native 开发工具链
- **TypeScript** - 类型安全的 JavaScript

### 状态管理
- **React Context** - 全局状态管理
- **React Hooks** - 组件状态和副作用

### 数据获取
- **Apollo Client** - GraphQL 客户端
- **GraphQL** - API 查询语言

### UI 组件
- **React Native Chart Kit** - 图表库
- **React Navigation** - 导航库
- **React Native SVG** - SVG 支持

### 数据存储
- **Expo SecureStore** - 安全存储（Token）
- **AsyncStorage** - 本地缓存

### 开发工具
- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **TypeScript** - 类型检查

---

## 📝 可用脚本

```bash
# 开发
npm start              # 启动开发服务器
npm run android        # 在 Android 上运行
npm run ios            # 在 iOS 上运行
npm run web            # 在浏览器中运行

# 构建
npm run build:android           # 构建 Android APK
npm run build:android:production # 构建生产版 AAB
npm run build:download          # 下载构建文件

# 代码质量
npm run lint           # 运行 ESLint
npm run lint:fix       # 自动修复 ESLint 错误
npm run format         # 格式化代码
npm run format:check   # 检查代码格式
npm run type-check     # TypeScript 类型检查
```

---

## 🔧 配置

### 环境变量

创建 `.env` 文件（不要提交到 Git）：

```env
# Cloudflare API
CLOUDFLARE_API_ENDPOINT=https://api.cloudflare.com/client/v4
CLOUDFLARE_GRAPHQL_ENDPOINT=https://api.cloudflare.com/client/v4/graphql

# 其他配置
CACHE_TTL=3600
```

### Cloudflare API Token

应用需要 Cloudflare API Token 才能访问数据。获取步骤：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 "My Profile" → "API Tokens"
3. 创建新 Token，选择 "Analytics:Read" 权限
4. 复制 Token 并在应用中添加

---

## 📸 截图

<div align="center">

### 流量概览
![Dashboard](./docs/screenshots/dashboard.png)

### 状态码分析
![Status Codes](./docs/screenshots/status-codes.png)

### 安全监控
![Security](./docs/screenshots/security.png)

</div>

---

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 编写清晰的提交信息

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](./LICENSE) 文件了解详情

---

## 🙏 致谢

- [Cloudflare](https://www.cloudflare.com/) - 提供强大的 API
- [Expo](https://expo.dev/) - 优秀的开发工具
- [React Native](https://reactnative.dev/) - 跨平台框架

---

## 📞 联系方式

- 作者: Your Name
- Email: your.email@example.com
- GitHub: [@yourusername](https://github.com/yourusername)

---

## 🗺️ 路线图

- [x] 基础流量监控
- [x] 多 Token 管理
- [x] 多账号/Zone 支持
- [x] 数据可视化
- [x] 离线缓存
- [x] 数据导出
- [ ] 推送通知
- [ ] 自定义仪表板
- [ ] 告警功能
- [ ] iPad 优化
- [ ] 深色模式

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ by [Your Name](https://github.com/yourusername)

</div>
