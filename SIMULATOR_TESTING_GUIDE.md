# 📱 模拟器测试指南 - PDF 导出功能

## 🎯 目标

在 iOS 或 Android 模拟器中测试 PDF 导出功能，无需真机。

---

## 方式 1：iOS 模拟器（推荐 - 你已有 Xcode）

### 步骤 1：启动开发服务器

```bash
cd cloudflare-analytics
npm start
```

### 步骤 2：在 iOS 模拟器中运行

在另一个终端窗口：

```bash
cd cloudflare-analytics
npm run ios
```

这会：
1. 自动启动 iOS 模拟器（iPhone 15 Pro）
2. 安装应用
3. 启动应用

### 步骤 3：测试 PDF 导出

1. 在模拟器中打开应用
2. 登录并选择一个 Zone
3. 导航到任意分析页面（流量、安全等）
4. 点击右上角的导出按钮
5. 选择导出选项
6. 点击 "Export PDF"
7. 等待 PDF 生成完成

### 步骤 4：查看生成的 PDF

**方式 A：使用 Expo 的文件查看器**
- PDF 生成后会显示分享对话框
- 可以选择 "Save to Files" 保存到模拟器

**方式 B：从模拟器文件系统获取**

```bash
# 找到应用的沙盒目录
xcrun simctl get_app_container booted com.cloudflare.analytics data

# 这会输出类似：
# /Users/betty/Library/Developer/CoreSimulator/Devices/[UUID]/data/Containers/Data/Application/[UUID]

# 然后查看 Documents 目录
ls -la "$(xcrun simctl get_app_container booted com.cloudflare.analytics data)/Documents"

# 复制 PDF 到桌面
cp "$(xcrun simctl get_app_container booted com.cloudflare.analytics data)/Documents"/*.pdf ~/Desktop/
```

### 常用 iOS 模拟器命令

```bash
# 列出所有可用的模拟器
xcrun simctl list devices available

# 启动特定模拟器
xcrun simctl boot "iPhone 15 Pro"

# 打开模拟器应用
open -a Simulator

# 重置模拟器（清除所有数据）
xcrun simctl erase all

# 截图
xcrun simctl io booted screenshot ~/Desktop/screenshot.png

# 录屏
xcrun simctl io booted recordVideo ~/Desktop/video.mp4
# 按 Ctrl+C 停止录制
```

---

## 方式 2：Android 模拟器

### 前置要求

确保已安装 Android Studio 和 Android SDK。

### 步骤 1：启动 Android 模拟器

```bash
# 列出可用的 AVD（Android Virtual Device）
emulator -list-avds

# 启动模拟器（替换为你的 AVD 名称）
emulator -avd Pixel_5_API_33 &
```

或者在 Android Studio 中：
1. 打开 Android Studio
2. Tools → Device Manager
3. 点击 Play 按钮启动模拟器

### 步骤 2：运行应用

```bash
cd cloudflare-analytics
npm start
# 然后按 'a' 在 Android 上运行
```

或者：

```bash
npm run android
```

### 步骤 3：测试 PDF 导出

同 iOS 步骤 3

### 步骤 4：查看生成的 PDF

**从 Android 模拟器获取文件：**

```bash
# 列出应用的文件
adb shell run-as com.cloudflare.analytics ls -la /data/data/com.cloudflare.analytics/files

# 复制 PDF 到电脑
adb shell run-as com.cloudflare.analytics cat /data/data/com.cloudflare.analytics/files/[filename].pdf > ~/Desktop/exported.pdf
```

或者在模拟器中：
1. 打开 Files 应用
2. 浏览到 Documents 目录
3. 查看生成的 PDF

---

## 🐛 故障排除

### 问题 1：模拟器启动失败

**iOS:**
```bash
# 重置所有模拟器
xcrun simctl erase all

# 重启 Xcode
killall Simulator
```

**Android:**
```bash
# 冷启动模拟器
emulator -avd [AVD_NAME] -no-snapshot-load
```

### 问题 2：应用无法安装

```bash
# 清除缓存
cd cloudflare-analytics
rm -rf node_modules
npm install

# iOS: 清除构建缓存
rm -rf ios/build

# Android: 清除构建缓存
cd android && ./gradlew clean && cd ..
```

### 问题 3：PDF 导出失败

1. **检查控制台日志**
   - iOS: 在 Xcode 中查看 Console
   - Android: 运行 `adb logcat | grep -i pdf`

2. **检查存储空间**
   ```bash
   # iOS
   xcrun simctl get_app_container booted com.cloudflare.analytics data
   
   # Android
   adb shell df -h
   ```

3. **验证 expo-print 是否正确安装**
   ```bash
   npm list expo-print
   # 应该显示: expo-print@14.0.8
   ```

### 问题 4：找不到生成的 PDF

PDF 保存位置：
- **iOS 模拟器**: `~/Library/Developer/CoreSimulator/Devices/[UUID]/data/Containers/Data/Application/[UUID]/Documents/`
- **Android 模拟器**: `/data/data/com.cloudflare.analytics/files/`

---

## 📊 测试检查清单

- [ ] 应用在模拟器中成功启动
- [ ] 可以登录并选择 Zone
- [ ] 导出按钮可见且可点击
- [ ] 可以打开高级导出配置页面
- [ ] 可以选择不同的导出类型
- [ ] 点击 "Export PDF" 后显示进度指示器
- [ ] PDF 生成成功（显示成功消息）
- [ ] 可以通过分享对话框查看/保存 PDF
- [ ] PDF 内容正确（包含数据和图表）
- [ ] PDF 格式正确（可以用 PDF 阅读器打开）

---

## 🚀 快速开始命令

### iOS 模拟器（一键启动）

```bash
cd cloudflare-analytics
npm run ios
```

### Android 模拟器（一键启动）

```bash
cd cloudflare-analytics
npm run android
```

---

## 💡 提示

1. **首次运行较慢**：第一次在模拟器中运行可能需要几分钟来构建和安装

2. **热重载**：修改代码后，应用会自动重新加载（按 `r` 手动重载）

3. **调试**：
   - 按 `Cmd+D`（iOS）或 `Cmd+M`（Android）打开开发菜单
   - 选择 "Debug" 在 Chrome DevTools 中调试

4. **性能**：模拟器性能可能比真机慢，PDF 生成时间会更长

5. **网络**：模拟器使用电脑的网络连接，确保可以访问 Cloudflare API

---

## 📝 测试报告模板

测试完成后，记录以下信息：

```
测试日期：____________________
模拟器：iOS / Android
设备型号：____________________
导出类型：____________________
结果：成功 / 失败
PDF 大小：____________________
生成时间：____________________
问题描述：____________________
```

---

## 🎉 成功标准

PDF 导出功能在模拟器中测试成功的标准：

✅ 应用正常启动和运行
✅ 导出按钮功能正常
✅ 进度指示器正确显示
✅ PDF 成功生成
✅ PDF 内容完整且格式正确
✅ 可以保存和查看 PDF
✅ 无崩溃或错误

如果所有标准都满足，说明 PDF 导出功能在真机上也应该能正常工作！
