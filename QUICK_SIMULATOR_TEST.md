# 🚀 快速模拟器测试 - 使用 Expo Go

由于 CocoaPods 版本问题，我们使用更简单的方法：在模拟器中使用 Expo Go 测试。

## ✅ 好消息

`expo-print` 是 Expo SDK 的官方模块，**在 Expo Go 中完全支持**！这意味着你可以直接在模拟器的 Expo Go 中测试 PDF 导出功能。

---

## 📱 iOS 模拟器测试（推荐）

### 步骤 1：安装 Expo Go 到模拟器

```bash
# 启动模拟器
open -a Simulator

# 等待模拟器完全启动后，安装 Expo Go
npx expo start --ios
```

第一次运行时，Expo CLI 会自动在模拟器中安装 Expo Go。

### 步骤 2：启动开发服务器

```bash
cd cloudflare-analytics
npm start
```

你会看到：
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
```

### 步骤 3：在模拟器中打开应用

按 `i` 键，应用会在 iOS 模拟器中的 Expo Go 里打开。

### 步骤 4：测试 PDF 导出

1. 在应用中登录
2. 选择一个 Zone
3. 导航到任意分析页面
4. 点击导出按钮
5. 配置导出选项
6. 点击 "Export PDF"
7. ✅ PDF 应该成功生成！

---

## 🤖 Android 模拟器测试

### 步骤 1：启动 Android 模拟器

在 Android Studio 中启动模拟器，或：

```bash
emulator -list-avds
emulator -avd [你的AVD名称] &
```

### 步骤 2：启动开发服务器

```bash
cd cloudflare-analytics
npm start
```

### 步骤 3：在模拟器中打开应用

按 `a` 键，Expo Go 会自动安装并打开应用。

### 步骤 4：测试 PDF 导出

同 iOS 步骤 4

---

## 🔍 查看生成的 PDF

### 方式 1：使用分享功能（推荐）

PDF 生成后会显示系统分享对话框：
- iOS: 可以选择 "Save to Files"、"AirDrop"、"Mail" 等
- Android: 可以选择 "Save"、"Share" 等

### 方式 2：从模拟器文件系统获取

**iOS 模拟器：**

```bash
# 找到 Expo Go 的数据目录
find ~/Library/Developer/CoreSimulator/Devices -name "ExponentExperienceData" -type d

# 或者直接搜索 PDF 文件
find ~/Library/Developer/CoreSimulator/Devices -name "*.pdf" -mtime -1

# 复制最新的 PDF 到桌面
find ~/Library/Developer/CoreSimulator/Devices -name "*.pdf" -mtime -1 -exec cp {} ~/Desktop/ \;
```

**Android 模拟器：**

```bash
# 列出文件
adb shell ls -la /data/data/host.exp.exponent/files

# 搜索 PDF
adb shell find /data/data/host.exp.exponent -name "*.pdf"

# 复制到电脑
adb pull /data/data/host.exp.exponent/files/[filename].pdf ~/Desktop/
```

---

## 🐛 常见问题

### 问题 1：Expo Go 无法连接

**解决方案：**
```bash
# 确保在同一网络
# 重启开发服务器
npm start -- --clear

# 或者使用隧道模式
npm start -- --tunnel
```

### 问题 2：PDF 导出显示错误

**检查步骤：**

1. 查看控制台日志
2. 确认 `expo-print` 已安装：
   ```bash
   npm list expo-print
   ```
3. 重新安装依赖：
   ```bash
   rm -rf node_modules
   npm install
   ```

### 问题 3：找不到生成的 PDF

PDF 会保存到应用的文档目录，可以通过分享对话框访问。

---

## ✨ 优势

使用 Expo Go 在模拟器中测试的优势：

1. ✅ **无需构建**：不需要编译 native 代码
2. ✅ **快速迭代**：修改代码后立即看到效果
3. ✅ **完整功能**：`expo-print` 在 Expo Go 中完全支持
4. ✅ **跨平台**：同样的代码在 iOS 和 Android 上都能工作
5. ✅ **无需证书**：不需要 Apple Developer 账号或签名

---

## 🎯 测试清单

- [ ] 模拟器成功启动
- [ ] Expo Go 已安装
- [ ] 应用在 Expo Go 中打开
- [ ] 可以登录并选择 Zone
- [ ] 导出按钮可见
- [ ] 可以打开导出配置页面
- [ ] 点击 "Export PDF" 后显示进度
- [ ] PDF 成功生成
- [ ] 显示分享对话框
- [ ] 可以保存或分享 PDF
- [ ] PDF 内容正确

---

## 🚀 一键启动命令

```bash
cd cloudflare-analytics
npm start
# 然后按 'i' (iOS) 或 'a' (Android)
```

就这么简单！🎉

---

## 💡 下一步

如果在 Expo Go 中测试成功，说明：

1. ✅ 代码逻辑正确
2. ✅ `expo-print` 工作正常
3. ✅ PDF 生成功能完整

然后你可以：

1. **继续使用 Expo Go**（推荐用于开发）
2. **构建独立应用**（用于分发）：
   ```bash
   npx eas build --platform ios --profile preview
   npx eas build --platform android --profile preview
   ```

独立应用中的 PDF 导出功能会和 Expo Go 中完全一样！
