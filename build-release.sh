#!/bin/bash

# Cloudflare Analytics v1.1.0 Release Build Script
# 用于快速构建 Android APK 和 iOS IPA

echo "🚀 Cloudflare Analytics v1.1.0 构建脚本"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查 EAS CLI
echo -e "${BLUE}📋 检查构建环境...${NC}"
if ! command -v eas &> /dev/null; then
    echo -e "${RED}❌ EAS CLI 未安装${NC}"
    echo "请运行: npm install -g eas-cli"
    exit 1
fi

echo -e "${GREEN}✅ EAS CLI 已安装: $(eas --version)${NC}"
echo ""

# 询问是否跳过检查
echo -e "${YELLOW}是否跳过测试和检查？(y/N)${NC}"
read -p "> " skip_checks

if [[ ! "$skip_checks" =~ ^[Yy]$ ]]; then
    # 运行测试
    echo -e "${BLUE}🧪 运行测试...${NC}"
    if npm test -- --passWithNoTests 2>/dev/null; then
        echo -e "${GREEN}✅ 所有测试通过${NC}"
    else
        echo -e "${YELLOW}⚠️  测试失败或未配置，继续构建...${NC}"
    fi
    echo ""

    # 类型检查
    echo -e "${BLUE}🔍 类型检查...${NC}"
    if npm run type-check 2>/dev/null; then
        echo -e "${GREEN}✅ 类型检查通过${NC}"
    else
        echo -e "${YELLOW}⚠️  类型检查失败，继续构建...${NC}"
    fi
    echo ""

    # 代码规范检查
    echo -e "${BLUE}📝 代码规范检查...${NC}"
    if npm run lint 2>/dev/null; then
        echo -e "${GREEN}✅ 代码规范检查通过${NC}"
    else
        echo -e "${YELLOW}⚠️  代码规范检查有警告，继续构建...${NC}"
    fi
    echo ""
else
    echo -e "${YELLOW}⏭️  跳过测试和检查${NC}"
    echo ""
fi

# 询问构建类型
echo -e "${BLUE}📦 选择构建类型:${NC}"
echo "1) Preview (APK + IPA for testing)"
echo "2) Production (AAB + IPA for stores)"
echo "3) Android only (Preview APK)"
echo "4) iOS only (Preview IPA)"
echo "5) Android Production (AAB)"
echo "6) iOS Production (IPA)"
read -p "请选择 (1-6): " choice

case $choice in
    1)
        echo -e "${BLUE}🔨 构建 Preview 版本 (Android APK + iOS IPA)...${NC}"
        eas build --platform all --profile preview
        ;;
    2)
        echo -e "${BLUE}🔨 构建 Production 版本 (Android AAB + iOS IPA)...${NC}"
        eas build --platform all --profile production
        ;;
    3)
        echo -e "${BLUE}🔨 构建 Android Preview APK...${NC}"
        eas build --platform android --profile preview
        ;;
    4)
        echo -e "${BLUE}🔨 构建 iOS Preview IPA...${NC}"
        eas build --platform ios --profile preview
        ;;
    5)
        echo -e "${BLUE}🔨 构建 Android Production AAB...${NC}"
        eas build --platform android --profile production
        ;;
    6)
        echo -e "${BLUE}🔨 构建 iOS Production IPA...${NC}"
        eas build --platform ios --profile production
        ;;
    *)
        echo -e "${RED}❌ 无效选择${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ 构建命令已执行${NC}"
echo ""
echo -e "${BLUE}📥 下载构建文件:${NC}"
echo "  Android: eas build:download --platform android --latest"
echo "  iOS:     eas build:download --platform ios --latest"
echo ""
echo -e "${BLUE}📊 查看构建状态:${NC}"
echo "  https://expo.dev/accounts/[your-account]/projects/cloudflare-analytics/builds"
echo ""
echo -e "${GREEN}🎉 完成！${NC}"
