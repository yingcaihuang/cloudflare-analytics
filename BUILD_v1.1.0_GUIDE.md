# Cloudflare Analytics v1.1.0 构建指南

## 版本信息

- **版本号**: 1.1.0
- **构建号**: 3
- **发布日期**: 2026年1月27日

## 版本更新内容

### 🎨 PDF 导出功能优化
1. **修复 PDF 内容为空问题**
   - 支持多种 API 数据格式（breakdown, aggregated, nested）
   - 修复 Status Codes, Protocol, TLS, Geographic 数据处理
   - 添加完整的数据格式转换逻辑

2. **现代化 PDF 设计**
   - 彩色主题（蓝色头部，彩色标题和数值）
   - 优化 expo-print 兼容性
   - 移除不支持的 CSS 特性（渐变、阴影）
   - 使用纯色和边框实现现代化设计

3. **修复组件导入错误**
   - 修复 TLSDistributionScreen 组件导入问题
   - 确保 ExportButton 正确导入

### 🐛 Bug 修复
- 修复 expo-file-system 废弃 API 警告
- 修复地理数据显示 "Unknown" 问题
- 优化数据格式处理逻辑

### ✅ 测试覆盖
- 41/41 PDF 生成器测试通过
- 新增数据格式测试用例
- 完整的单元测试覆盖

## 构建前准备

### 1. 确认环境
```bash
# 检查 Node.js 版本
node --version  # 应该 >= 18.x

# 检查 npm 版本
npm --version

# 检查 EAS CLI
eas --version  # 应该 >= 13.2.0
```

### 2. 安装依赖
```bash
cd cloudflare-analytics
npm install
```

### 3. 运行测试
```bash
# 运行所有测试
npm test

# 检查类型
npm run type-check

# 检查代码规范
npm run lint
```

## Android APK 构建

### 方法 1: 使用 EAS Build（推荐）

#### 构建预览版 APK
```bash
# 构建 APK（用于测试分发）
eas build --platform android --profile preview

# 或使用 npm script
npm run build:android
```

#### 构建生产版 AAB
```bash
# 构建 App Bundle（用于 Google Play）
eas build --platform android --profile production

# 或使用 npm script
npm run build:android:production
```

#### 下载构建文件
```bash
# 下载最新构建
eas build:download --platform android --latest

# 或使用 npm script
npm run build:download
```

### 方法 2: 本地构建（需要 Android Studio）

```bash
# 生成 Android 项目
npx expo prebuild --platform android

# 构建 APK
cd android
./gradlew assembleRelease

# APK 位置
# android/app/build/outputs/apk/release/app-release.apk
```

## iOS IPA 构建

### 使用 EAS Build（推荐）

#### 构建预览版
```bash
# 构建 IPA（用于 TestFlight 或 Ad Hoc 分发）
eas build --platform ios --profile preview
```

#### 构建生产版
```bash
# 构建 IPA（用于 App Store）
eas build --platform ios --profile production
```

#### 下载构建文件
```bash
# 下载最新构建
eas build:download --platform ios --latest
```

### 注意事项

#### iOS 构建要求
1. **Apple Developer 账号**
   - 需要付费的 Apple Developer Program 会员资格
   - 配置 Bundle Identifier: `com.cloudflare.analytics`

2. **证书和配置文件**
   - EAS 会自动管理证书
   - 或手动上传现有证书

3. **设备注册**（Ad Hoc 分发）
   - 在 Apple Developer 网站注册测试设备 UDID
   - EAS 会提示注册设备

## 同时构建 Android 和 iOS

```bash
# 同时构建两个平台
eas build --platform all --profile preview

# 生产版本
eas build --platform all --profile production
```

## 构建配置说明

### Preview Profile（预览版）
- **Android**: 生成 APK 文件
- **iOS**: 生成 IPA 文件（需要设备注册）
- **用途**: 内部测试、Beta 测试
- **分发**: 直接安装或通过 TestFlight

### Production Profile（生产版）
- **Android**: 生成 AAB 文件（App Bundle）
- **iOS**: 生成 IPA 文件
- **用途**: 应用商店发布
- **分发**: Google Play Store / Apple App Store

## 构建后操作

### Android APK
1. **下载 APK**
   ```bash
   eas build:download --platform android --latest
   ```

2. **安装到设备**
   - 通过 USB 连接设备
   - 启用"未知来源"安装
   - 使用 `adb install app.apk`
   - 或直接传输 APK 到设备安装

3. **分发**
   - 上传到内部测试平台
   - 通过邮件/链接分享
   - 上传到 Google Play Console

### iOS IPA
1. **下载 IPA**
   ```bash
   eas build:download --platform ios --latest
   ```

2. **TestFlight 分发**
   - 使用 EAS Submit 自动提交
   ```bash
   eas submit --platform ios
   ```

3. **Ad Hoc 安装**
   - 使用 Apple Configurator
   - 或通过 OTA 分发链接

## 版本管理

### 版本号规则
- **主版本号**: 重大功能更新或架构变更
- **次版本号**: 新功能添加
- **修订号**: Bug 修复和小改进

### 当前版本
- **版本**: 1.1.0
- **Android versionCode**: 3
- **iOS buildNumber**: 3

### 下次更新
更新版本号时需要修改：
1. `app.json` - `version`, `android.versionCode`, `ios.buildNumber`
2. `package.json` - `version`

## 常见问题

### Q: EAS Build 失败怎么办？
A: 检查以下内容：
- 确认 EAS CLI 版本最新
- 检查 `eas.json` 配置
- 查看构建日志找出具体错误
- 确认依赖包都已正确安装

### Q: iOS 构建需要什么？
A: 
- Apple Developer 账号（$99/年）
- 配置 Bundle Identifier
- EAS 会自动管理证书和配置文件

### Q: 如何测试构建的应用？
A:
- **Android**: 直接安装 APK 到设备
- **iOS**: 通过 TestFlight 或 Ad Hoc 分发

### Q: 构建需要多长时间？
A:
- **Android**: 通常 10-15 分钟
- **iOS**: 通常 15-20 分钟
- 取决于 EAS 服务器负载

## 构建检查清单

### 构建前
- [ ] 更新版本号（app.json, package.json）
- [ ] 运行所有测试 (`npm test`)
- [ ] 检查代码规范 (`npm run lint`)
- [ ] 检查类型 (`npm run type-check`)
- [ ] 更新 CHANGELOG.md
- [ ] 提交所有代码更改

### 构建中
- [ ] 选择正确的构建配置（preview/production）
- [ ] 确认平台选择（android/ios/all）
- [ ] 监控构建进度
- [ ] 检查构建日志

### 构建后
- [ ] 下载构建文件
- [ ] 在真实设备上测试
- [ ] 验证所有功能正常
- [ ] 检查 PDF 导出功能
- [ ] 准备发布说明
- [ ] 分发给测试人员或上传商店

## 快速命令参考

```bash
# Android APK（测试版）
eas build --platform android --profile preview

# Android AAB（生产版）
eas build --platform android --profile production

# iOS IPA（测试版）
eas build --platform ios --profile preview

# iOS IPA（生产版）
eas build --platform ios --profile production

# 同时构建两个平台
eas build --platform all --profile preview

# 下载最新构建
eas build:download --platform android --latest
eas build:download --platform ios --latest

# 提交到商店
eas submit --platform android
eas submit --platform ios
```

## 相关文档

- [EAS Build 文档](https://docs.expo.dev/build/introduction/)
- [EAS Submit 文档](https://docs.expo.dev/submit/introduction/)
- [Expo 配置文档](https://docs.expo.dev/workflow/configuration/)
- [BUILD_INSTRUCTIONS.md](./BUILD_INSTRUCTIONS.md) - 详细构建说明

## 支持

如有问题，请查看：
- Expo 官方文档
- EAS Build 状态页面
- 项目 GitHub Issues

---

**版本**: 1.1.0  
**更新日期**: 2026年1月27日  
**构建平台**: EAS Build
