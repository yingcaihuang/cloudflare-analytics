#!/bin/bash

# Cloudflare Analytics - Android APK 构建脚本
# 使用 Expo EAS Build 构建 APK

echo "🚀 开始构建 Cloudflare Analytics Android APK..."
echo ""

# 检查是否安装了 EAS CLI
if ! command -v eas &> /dev/null
then
    echo "❌ EAS CLI 未安装"
    echo "📦 正在安装 EAS CLI..."
    npm install -g eas-cli
    echo "✅ EAS CLI 安装完成"
    echo ""
fi

# 检查是否已登录
echo "🔐 检查登录状态..."
if ! eas whoami &> /dev/null
then
    echo "❌ 未登录 Expo 账号"
    echo "请先登录："
    eas login
else
    echo "✅ 已登录: $(eas whoami)"
fi

echo ""
echo "📋 选择构建类型："
echo "1) Preview APK (测试版本，可直接安装)"
echo "2) Production AAB (生产版本，用于 Google Play)"
echo ""
read -p "请选择 (1 或 2): " choice

case $choice in
    1)
        echo ""
        echo "🔨 开始构建 Preview APK..."
        eas build --platform android --profile preview
        ;;
    2)
        echo ""
        echo "🔨 开始构建 Production AAB..."
        eas build --platform android --profile production
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "✅ 构建命令已提交！"
echo "📊 你可以在以下位置查看构建进度："
echo "   https://expo.dev"
echo ""
echo "⏳ 构建通常需要 10-20 分钟"
echo "📥 完成后可以使用以下命令下载："
echo "   eas build:download"
