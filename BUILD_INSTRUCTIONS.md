# Android APK 构建指南

## 方式 1: 使用 Expo EAS Build（推荐）

### 前置要求
- 安装 EAS CLI: `npm install -g eas-cli`
- 注册 Expo 账号（免费）: https://expo.dev/signup

### 步骤

1. **登录 Expo 账号**
   ```bash
   cd cloudflare-analytics
   eas login
   ```

2. **配置 EAS Build**
   ```bash
   eas build:configure
   ```
   这会创建 `eas.json` 配置文件

3. **构建 APK（开发版本）**
   ```bash
   eas build --platform android --profile preview
   ```
   
   或者构建生产版本：
   ```bash
   eas build --platform android --profile production
   ```

4. **等待构建完成**
   - 构建过程在云端进行，通常需要 10-20 分钟
   - 完成后会提供下载链接
   - 可以在 https://expo.dev 查看构建状态

5. **下载 APK**
   - 从 Expo 网站下载构建好的 APK
   - 或使用命令行下载：`eas build:download`

### 优点
- ✅ 不需要本地 Android 开发环境
- ✅ 不需要配置 Java、Android SDK
- ✅ 构建过程简单快速
- ✅ 免费账号每月有构建额度

---

## 方式 2: 本地构建（需要 Android 开发环境）

### 前置要求
- 安装 Android Studio
- 配置 Android SDK
- 配置 Java JDK 17+
- 设置环境变量（ANDROID_HOME）

### 步骤

1. **安装 Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

2. **预构建原生项目**
   ```bash
   cd cloudflare-analytics
   npx expo prebuild --platform android
   ```

3. **构建 APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. **APK 位置**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

### 缺点
- ❌ 需要安装和配置复杂的开发环境
- ❌ 首次配置可能需要 1-2 小时
- ❌ 需要较大的磁盘空间（5-10GB）

---

## 推荐方案

**建议使用方式 1（EAS Build）**，因为：
1. 配置简单，只需 3 个命令
2. 不需要本地 Android 环境
3. 构建速度快且稳定
4. 免费账号足够使用

## 快速开始（EAS Build）

```bash
# 1. 安装 EAS CLI
npm install -g eas-cli

# 2. 进入项目目录
cd cloudflare-analytics

# 3. 登录
eas login

# 4. 配置
eas build:configure

# 5. 构建 APK
eas build --platform android --profile preview
```

构建完成后，你会收到一个下载链接，可以直接下载 APK 安装到 Android 设备上。

## 注意事项

1. **首次构建**：需要创建 Expo 账号（免费）
2. **构建时间**：通常 10-20 分钟
3. **APK 大小**：预计 40-60MB
4. **测试安装**：需要在 Android 设备上启用"未知来源"安装权限

## 常见问题

### Q: 免费账号有限制吗？
A: 免费账号每月有构建额度，对于个人开发足够使用。

### Q: 可以构建 iOS 版本吗？
A: 可以，但需要 Apple Developer 账号（$99/年）。

### Q: APK 可以上传到 Google Play 吗？
A: 可以，但需要使用 AAB 格式：`eas build --platform android --profile production`

### Q: 如何更新应用版本？
A: 修改 `app.json` 中的 `version` 字段，然后重新构建。
