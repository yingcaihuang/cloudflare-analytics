# 🚀 如何构建 Android APK

## 最简单的方式（推荐）⭐

### 一键构建脚本

```bash
cd cloudflare-analytics
./quick-build.sh
```

这个脚本会自动：
- ✅ 检查 Node.js 环境
- ✅ 安装项目依赖
- ✅ 安装 EAS CLI
- ✅ 引导你登录 Expo
- ✅ 配置构建环境
- ✅ 开始构建 APK

**只需要运行一个命令，其他全自动！**

---

## 其他构建方式

### 方式 1: 使用 npm 脚本

```bash
cd cloudflare-analytics

# 首次需要登录
npm install -g eas-cli
eas login

# 构建测试版 APK
npm run build:android

# 或构建生产版 AAB
npm run build:android:production
```

### 方式 2: 使用构建脚本

**macOS/Linux:**
```bash
cd cloudflare-analytics
./build-apk.sh
```

**Windows:**
```bash
cd cloudflare-analytics
build-apk.bat
```

### 方式 3: 手动命令

```bash
cd cloudflare-analytics

# 1. 安装 EAS CLI
npm install -g eas-cli

# 2. 登录
eas login

# 3. 构建
eas build --platform android --profile preview
```

---

## 📥 下载构建好的 APK

构建完成后（10-20分钟），使用以下任一方式下载：

### 方式 1: 命令行下载
```bash
cd cloudflare-analytics
eas build:download
```

### 方式 2: 网页下载
1. 访问 https://expo.dev
2. 登录你的账号
3. 找到构建记录
4. 点击下载按钮

---

## 📱 安装到 Android 设备

1. **传输 APK 到手机**
   - USB 连接传输
   - 或通过邮件/云盘发送
   - 或直接在手机浏览器下载

2. **启用未知来源安装**
   - 设置 → 安全 → 允许安装未知应用

3. **安装应用**
   - 打开文件管理器
   - 找到 APK 文件
   - 点击安装

---

## ❓ 常见问题

### Q: 需要什么前置条件？
A: 只需要：
- Node.js (已安装 ✅)
- 网络连接
- Expo 账号（免费注册）

### Q: 需要安装 Android Studio 吗？
A: **不需要！** 使用 EAS Build 云端构建，无需本地 Android 环境。

### Q: 构建需要多长时间？
A: 通常 10-20 分钟，在云端自动完成。

### Q: 免费吗？
A: Expo 免费账号每月有构建额度，个人使用完全够用。

### Q: 可以构建 iOS 版本吗？
A: 可以，但需要 Apple Developer 账号（$99/年）。

---

## 📚 详细文档

- **完整构建指南**: `BUILD_INSTRUCTIONS.md`
- **详细步骤说明**: `构建APK步骤.md`

---

## 🎯 快速开始（3 步）

```bash
# 1. 进入项目目录
cd cloudflare-analytics

# 2. 运行一键构建脚本
./quick-build.sh

# 3. 等待构建完成，下载 APK
eas build:download
```

就这么简单！🎉

---

## 💡 提示

- 首次构建需要注册 Expo 账号（免费）
- 构建在云端进行，可以关闭终端
- 可以在 https://expo.dev 查看构建进度
- APK 文件大小约 40-60MB

---

## 🆘 需要帮助？

如果遇到问题：
1. 查看详细文档：`BUILD_INSTRUCTIONS.md`
2. 查看步骤说明：`构建APK步骤.md`
3. 访问 Expo 文档：https://docs.expo.dev/build/setup/

---

**祝构建顺利！** 🚀
