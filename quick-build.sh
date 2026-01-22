#!/bin/bash

# 一键构建 Android APK 脚本
# 自动安装依赖并开始构建

set -e  # 遇到错误立即退出

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Cloudflare Analytics - Android APK 一键构建工具         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 进入项目目录
cd "$(dirname "$0")"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js"
    echo "请访问 https://nodejs.org 下载安装"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo ""

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未安装 npm"
    exit 1
fi

echo "✅ npm 版本: $(npm --version)"
echo ""

# 安装项目依赖
echo "📦 检查项目依赖..."
if [ ! -d "node_modules" ]; then
    echo "正在安装项目依赖..."
    npm install
    echo "✅ 项目依赖安装完成"
else
    echo "✅ 项目依赖已存在"
fi
echo ""

# 检查并安装 EAS CLI
echo "🔧 检查 EAS CLI..."
if ! command -v eas &> /dev/null; then
    echo "正在安装 EAS CLI..."
    npm install -g eas-cli
    echo "✅ EAS CLI 安装完成"
else
    echo "✅ EAS CLI 已安装: $(eas --version)"
fi
echo ""

# 检查登录状态
echo "🔐 检查 Expo 登录状态..."
if ! eas whoami &> /dev/null; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  需要登录 Expo 账号"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "如果还没有账号，请访问: https://expo.dev/signup"
    echo ""
    eas login
    echo ""
    echo "✅ 登录成功: $(eas whoami)"
else
    echo "✅ 已登录: $(eas whoami)"
fi
echo ""

# 配置 EAS（如果需要）
if [ ! -f "eas.json" ]; then
    echo "⚙️  配置 EAS Build..."
    eas build:configure
    echo "✅ EAS 配置完成"
    echo ""
fi

# 选择构建类型
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  选择构建类型"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1) 📱 Preview APK  - 测试版本（推荐）"
echo "   • 可直接安装到 Android 设备"
echo "   • 适合测试和分发"
echo "   • 文件格式: .apk"
echo ""
echo "2) 🏪 Production AAB - 生产版本"
echo "   • 用于上传到 Google Play 商店"
echo "   • 文件格式: .aab"
echo ""
read -p "请选择 (1 或 2，默认 1): " choice
choice=${choice:-1}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

case $choice in
    1)
        echo "🔨 开始构建 Preview APK..."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        eas build --platform android --profile preview
        ;;
    2)
        echo "🔨 开始构建 Production AAB..."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        eas build --platform android --profile production
        ;;
    *)
        echo "❌ 无效选择，默认构建 Preview APK"
        echo ""
        eas build --platform android --profile preview
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  构建已提交！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 查看构建进度:"
echo "   https://expo.dev"
echo ""
echo "⏳ 预计等待时间: 10-20 分钟"
echo ""
echo "📥 构建完成后下载:"
echo "   eas build:download"
echo ""
echo "💡 提示: 你可以关闭此窗口，构建会在云端继续进行"
echo ""
