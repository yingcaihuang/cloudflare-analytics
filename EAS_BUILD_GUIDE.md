# EAS Build 构建指南

## 前提条件

1. **安装 EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **登录 Expo 账户**
   ```bash
   eas login
   ```
   如果没有账户，访问 https://expo.dev 注册

3. **配置项目**
   ```bash
   cd cloudflare-analytics
   eas build:configure
   ```

## 构建 APK（推荐用于测试）

### 方法 1: Preview Build（生成 APK）
```bash
eas build --platform android --profile preview
```

**特点：**
- 生成 APK 文件，可以直接安装到 Android 设备
- 适合测试和分发给测试用户
- 构建时间：约 10-20 分钟

### 方法 2: Production Build（生成 AAB）
```bash
eas build --platform android --profile production
```

**特点：**
- 生成 AAB (Android App Bundle) 文件
- 用于上传到 Google Play Store
- 文件更小，但需要通过 Play Store 分发

## 构建步骤详解

### 1. 开始构建
```bash
cd cloudflare-analytics
eas build --platform android --profile preview
```

### 2. 等待构建完成
- EAS 会在云端构建你的应用
- 你可以在终端看到构建进度
- 也可以访问 https://expo.dev 查看构建状态

### 3. 下载 APK
构建完成后，你会看到：
```
✔ Build finished
https://expo.dev/accounts/[your-account]/projects/cloudflare-analytics/builds/[build-id]
```

点击链接或在终端中会显示下载链接。

### 4. 安装 APK
- 下载 APK 文件到你的电脑
- 通过 USB 或其他方式传输到 Android 设备
- 在设备上安装（需要允许"未知来源"）

## 本地构建（可选）

如果你想在本地构建（不使用 EAS 云服务）：

```bash
eas build --platform android --profile preview --local
```

**注意：** 本地构建需要：
- Android SDK
- Java JDK
- 足够的磁盘空间（约 10GB）

## 常用命令

### 查看构建历史
```bash
eas build:list
```

### 查看构建详情
```bash
eas build:view [build-id]
```

### 取消构建
```bash
eas build:cancel
```

### 配置凭证
```bash
eas credentials
```

## 构建配置说明

你的 `eas.json` 配置：

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

- **preview**: 生成 APK，用于内部测试
- **production**: 生成 AAB，用于 Play Store 发布

## 签名配置

### 自动签名（推荐）
EAS 会自动为你生成和管理签名密钥。

### 使用自己的密钥
如果你有自己的 keystore：

1. 运行配置命令：
   ```bash
   eas credentials
   ```

2. 选择 "Android" → "Set up a new keystore"

3. 上传你的 keystore 文件

## 环境变量

如果你的应用需要环境变量，在 `eas.json` 中添加：

```json
{
  "build": {
    "preview": {
      "env": {
        "API_URL": "https://api.example.com"
      }
    }
  }
}
```

或者使用 `.env` 文件（需要 `react-native-dotenv`）。

## 故障排除

### 构建失败
1. 检查 `package.json` 中的依赖是否正确
2. 确保 `app.json` 配置正确
3. 查看构建日志：`eas build:view [build-id]`

### 安装失败
1. 确保设备允许"未知来源"安装
2. 检查设备存储空间
3. 尝试卸载旧版本后重新安装

### 构建时间过长
- 正常情况下构建需要 10-20 分钟
- 如果超过 30 分钟，可能是 EAS 服务繁忙
- 可以取消后重新构建

## 快速构建命令

```bash
# 进入项目目录
cd cloudflare-analytics

# 构建 APK（推荐）
eas build --platform android --profile preview

# 构建并自动下载
eas build --platform android --profile preview --wait

# 构建 iOS（需要 Apple 开发者账户）
eas build --platform ios --profile preview
```

## 更新应用

当你修改代码后，重新运行构建命令即可：

```bash
eas build --platform android --profile preview
```

EAS 会自动递增版本号（如果配置了自动递增）。

## 版本管理

在 `app.json` 中管理版本：

```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1
    }
  }
}
```

每次发布新版本时：
- 增加 `version`（如 1.0.0 → 1.0.1）
- 增加 `versionCode`（如 1 → 2）

## 分发 APK

### 方法 1: 直接分享
- 将 APK 文件发送给用户
- 用户下载并安装

### 方法 2: 使用 Expo 内部分发
```bash
eas build --platform android --profile preview
```
构建完成后，EAS 会提供一个分享链接。

### 方法 3: 上传到 Google Play（内部测试）
1. 构建 production 版本
2. 在 Google Play Console 创建应用
3. 上传 AAB 文件

## 相关资源

- EAS Build 文档: https://docs.expo.dev/build/introduction/
- Expo 官网: https://expo.dev
- Android 开发者文档: https://developer.android.com

## 总结

**最简单的构建流程：**

1. 安装 EAS CLI: `npm install -g eas-cli`
2. 登录: `eas login`
3. 构建: `eas build --platform android --profile preview`
4. 等待完成并下载 APK
5. 安装到设备

就这么简单！🎉
