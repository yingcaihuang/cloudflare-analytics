#!/bin/bash

# GitHub 上传准备脚本
# 自动检查和准备项目

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        GitHub 上传准备工具                                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 进入项目根目录
cd "$(dirname "$0")/.."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. 检查 Node.js 和 npm
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. 检查开发环境"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if command -v node &> /dev/null; then
    check_pass "Node.js 已安装: $(node --version)"
else
    check_fail "Node.js 未安装"
    exit 1
fi

if command -v npm &> /dev/null; then
    check_pass "npm 已安装: $(npm --version)"
else
    check_fail "npm 未安装"
    exit 1
fi

echo ""

# 2. 检查依赖
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  2. 检查项目依赖"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d "node_modules" ]; then
    check_pass "依赖已安装"
else
    check_warn "依赖未安装，正在安装..."
    npm install
    check_pass "依赖安装完成"
fi

echo ""

# 3. 运行代码检查
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  3. 运行代码检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📝 运行 ESLint..."
if npm run lint --silent; then
    check_pass "ESLint 检查通过"
else
    check_fail "ESLint 检查失败"
    echo ""
    read -p "是否自动修复？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run lint:fix
        check_pass "已自动修复"
    else
        check_warn "请手动修复 ESLint 错误"
    fi
fi

echo ""

echo "🔍 运行 TypeScript 类型检查..."
if npm run type-check --silent; then
    check_pass "TypeScript 类型检查通过"
else
    check_fail "TypeScript 类型检查失败"
    check_warn "请修复类型错误后再继续"
fi

echo ""

# 4. 检查敏感文件
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  4. 检查敏感文件"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SENSITIVE_FILES=(
    ".env"
    ".env.local"
    ".env.development"
    ".env.production"
    "*.jks"
    "*.p12"
    "*.key"
    "*.pem"
)

FOUND_SENSITIVE=false

for pattern in "${SENSITIVE_FILES[@]}"; do
    if ls $pattern 2>/dev/null | grep -q .; then
        check_fail "发现敏感文件: $pattern"
        FOUND_SENSITIVE=true
    fi
done

if [ "$FOUND_SENSITIVE" = false ]; then
    check_pass "未发现敏感文件"
else
    check_warn "请确保这些文件在 .gitignore 中"
fi

echo ""

# 5. 检查 .gitignore
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  5. 检查 .gitignore"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f ".gitignore" ]; then
    check_pass ".gitignore 文件存在"
    
    # 检查关键条目
    REQUIRED_IGNORES=("node_modules" ".env" "*.apk" "*.aab")
    for item in "${REQUIRED_IGNORES[@]}"; do
        if grep -q "$item" .gitignore; then
            check_pass "  ✓ $item"
        else
            check_warn "  ✗ $item 未在 .gitignore 中"
        fi
    done
else
    check_fail ".gitignore 文件不存在"
fi

echo ""

# 6. 检查必要文件
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  6. 检查必要文件"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

REQUIRED_FILES=(
    "README.md"
    "LICENSE"
    "CONTRIBUTING.md"
    "CHANGELOG.md"
    ".env.example"
    "package.json"
    "app.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "$file"
    else
        check_fail "$file 不存在"
    fi
done

echo ""

# 7. 整理文档
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  7. 整理文档"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "是否整理文档？(y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "scripts/organize-docs.sh" ]; then
        ./scripts/organize-docs.sh
        check_pass "文档整理完成"
    else
        check_warn "文档整理脚本不存在"
    fi
else
    check_warn "跳过文档整理"
fi

echo ""

# 8. Git 状态
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  8. Git 状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d ".git" ]; then
    check_pass "Git 仓库已初始化"
    
    # 检查是否有未提交的更改
    if [[ -n $(git status -s) ]]; then
        check_warn "有未提交的更改"
        echo ""
        git status -s
    else
        check_pass "没有未提交的更改"
    fi
else
    check_warn "Git 仓库未初始化"
    echo ""
    read -p "是否初始化 Git 仓库？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git init
        check_pass "Git 仓库初始化完成"
    fi
fi

echo ""

# 9. 总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  检查完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 下一步操作:"
echo ""
echo "1. 创建 GitHub 仓库"
echo "   https://github.com/new"
echo ""
echo "2. 添加远程仓库"
echo "   git remote add origin https://github.com/YOUR_USERNAME/cloudflare-analytics.git"
echo ""
echo "3. 提交并推送代码"
echo "   git add ."
echo "   git commit -m \"feat: initial commit\""
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "📚 详细说明请查看: GitHub上传清单.md"
echo ""

# 询问是否继续
read -p "是否现在提交更改？(y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .
    echo ""
    read -p "请输入提交信息: " commit_message
    git commit -m "${commit_message:-feat: initial commit}"
    check_pass "代码已提交"
    echo ""
    echo "💡 现在可以推送到 GitHub:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/cloudflare-analytics.git"
    echo "   git push -u origin main"
fi

echo ""
echo "🎉 准备完成！"
