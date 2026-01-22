#!/bin/bash

# 项目文档整理脚本
# 自动将文档移动到对应目录

set -e

echo "📁 开始整理项目文档..."
echo ""

# 进入项目根目录
cd "$(dirname "$0")/.."

# 创建文档目录结构
echo "📂 创建文档目录..."
mkdir -p docs/build
mkdir -p docs/tasks
mkdir -p docs/examples
mkdir -p docs/screenshots
mkdir -p docs/archive

echo "✅ 目录创建完成"
echo ""

# 移动构建文档
echo "📦 移动构建文档..."
mv -v 如何构建APK.md docs/build/ 2>/dev/null || echo "  ⚠️  如何构建APK.md 不存在或已移动"
mv -v BUILD_INSTRUCTIONS.md docs/build/ 2>/dev/null || echo "  ⚠️  BUILD_INSTRUCTIONS.md 不存在或已移动"
mv -v 构建APK步骤.md docs/build/ 2>/dev/null || echo "  ⚠️  构建APK步骤.md 不存在或已移动"
mv -v 开始构建.md docs/build/ 2>/dev/null || echo "  ⚠️  开始构建.md 不存在或已移动"
mv -v APK构建完成.md docs/build/ 2>/dev/null || echo "  ⚠️  APK构建完成.md 不存在或已移动"

echo ""

# 移动任务文档
echo "📋 移动任务文档..."
mv -v CHECKPOINT_*.md docs/tasks/ 2>/dev/null || echo "  ⚠️  没有找到 CHECKPOINT 文档"
mv -v TASK_*.md docs/tasks/ 2>/dev/null || echo "  ⚠️  没有找到 TASK 文档"
mv -v PROJECT_STATUS.md docs/tasks/ 2>/dev/null || echo "  ⚠️  PROJECT_STATUS.md 不存在或已移动"
mv -v SETUP_NOTES.md docs/tasks/ 2>/dev/null || echo "  ⚠️  SETUP_NOTES.md 不存在或已移动"

echo ""

# 移动示例文件
echo "📝 移动示例文件..."
find src/screens -name "*.example.tsx" -exec mv -v {} docs/examples/ \; 2>/dev/null || echo "  ⚠️  没有找到示例文件"

echo ""

# 移动其他文档到归档
echo "🗄️  归档其他文档..."
find . -maxdepth 1 -name "*.md" ! -name "README.md" ! -name "CONTRIBUTING.md" ! -name "CHANGELOG.md" ! -name "LICENSE.md" -exec mv -v {} docs/archive/ \; 2>/dev/null || echo "  ⚠️  没有其他文档需要归档"

echo ""

# 创建文档索引
echo "📚 创建文档索引..."
cat > docs/README.md << 'EOF'
# 项目文档

## 📖 文档目录

### 用户文档
- [项目介绍](../README.md) - 项目概述和快速开始
- [贡献指南](../CONTRIBUTING.md) - 如何贡献代码
- [更新日志](../CHANGELOG.md) - 版本更新记录

### 构建文档
- [如何构建APK](./build/如何构建APK.md) - 快速构建指南
- [构建说明](./build/BUILD_INSTRUCTIONS.md) - 详细构建说明
- [构建步骤](./build/构建APK步骤.md) - 分步骤教程
- [开始构建](./build/开始构建.md) - 构建前准备
- [构建完成](./build/APK构建完成.md) - 构建后操作

### 技术文档
- [架构文档](./ARCHITECTURE.md) - 系统架构设计
- [整理文档](./整理文档.md) - 文档组织说明

### 任务文档
- [任务列表](./tasks/) - 开发任务和检查点

### 示例代码
- [示例文件](./examples/) - 代码示例

### 截图
- [应用截图](./screenshots/) - 应用界面截图

## 📝 文档规范

### 命名规范
- 英文文档: `UPPERCASE.md`
- 中文文档: `中文名称.md`
- 技术文档: `kebab-case.md`

### 文档分类
1. **用户文档**: 面向最终用户
2. **开发文档**: 面向开发者
3. **API 文档**: API 参考
4. **构建文档**: 构建和部署

## 🔄 更新文档

添加新文档时，请：
1. 放入对应目录
2. 更新本索引
3. 在主 README 中添加链接（如需要）

## 📞 需要帮助？

如果找不到需要的文档，请：
- 查看主 [README](../README.md)
- 创建 Issue
- 联系维护者
EOF

echo "✅ 文档索引创建完成"
echo ""

# 显示结果
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  文档整理完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 文档目录结构:"
echo ""
tree docs -L 2 2>/dev/null || ls -R docs
echo ""
echo "💡 提示:"
echo "  - 构建文档: docs/build/"
echo "  - 任务文档: docs/tasks/"
echo "  - 示例代码: docs/examples/"
echo "  - 文档索引: docs/README.md"
echo ""
echo "🎉 完成！现在可以提交更改到 Git"
echo ""
echo "建议的 Git 命令:"
echo "  git add ."
echo "  git commit -m \"docs: reorganize project documentation\""
echo ""
