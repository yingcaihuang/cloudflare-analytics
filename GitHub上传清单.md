# 📤 GitHub 上传准备清单

## ✅ 上传前检查

### 1. 文件准备
- [x] README.md - 项目介绍
- [x] LICENSE - 开源许可证
- [x] CONTRIBUTING.md - 贡献指南
- [x] CHANGELOG.md - 更新日志
- [x] .gitignore - Git 忽略文件
- [x] .env.example - 环境变量示例

### 2. 文档整理
- [ ] 运行文档整理脚本
  ```bash
  ./scripts/organize-docs.sh
  ```
- [ ] 检查文档链接是否正确
- [ ] 确认所有文档都在正确位置

### 3. 代码检查
- [ ] 运行代码检查
  ```bash
  npm run lint
  npm run type-check
  ```
- [ ] 修复所有错误和警告
- [ ] 格式化代码
  ```bash
  npm run format
  ```

### 4. 敏感信息检查
- [ ] 确认 `.env` 文件在 `.gitignore` 中
- [ ] 检查代码中没有硬编码的 Token
- [ ] 检查没有提交 `node_modules/`
- [ ] 检查没有提交构建产物 (`.apk`, `.aab`)
- [ ] 检查没有提交个人信息

### 5. 项目配置
- [ ] 更新 `package.json` 中的信息
  - name
  - version
  - description
  - author
  - repository
  - bugs
  - homepage
- [ ] 更新 `app.json` 中的信息
  - name
  - slug
  - version

### 6. README 更新
- [ ] 更新项目描述
- [ ] 更新作者信息
- [ ] 更新 GitHub 链接
- [ ] 添加截图（如果有）
- [ ] 更新安装说明
- [ ] 更新使用说明

---

## 🚀 上传步骤

### 步骤 1: 初始化 Git 仓库

```bash
cd cloudflare-analytics

# 如果还没有初始化 Git
git init

# 添加所有文件
git add .

# 首次提交
git commit -m "feat: initial commit - Cloudflare Analytics Mobile App"
```

### 步骤 2: 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: `cloudflare-analytics`
   - **Description**: `A powerful mobile app for Cloudflare traffic analytics`
   - **Visibility**: Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"

3. 点击 "Create repository"

### 步骤 3: 关联远程仓库

```bash
# 添加远程仓库（替换为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/cloudflare-analytics.git

# 或使用 SSH
git remote add origin git@github.com:YOUR_USERNAME/cloudflare-analytics.git

# 验证远程仓库
git remote -v
```

### 步骤 4: 推送代码

```bash
# 推送到 main 分支
git branch -M main
git push -u origin main
```

---

## 📝 推荐的提交信息

### 首次提交
```bash
git commit -m "feat: initial commit - Cloudflare Analytics Mobile App

- Add core functionality for traffic monitoring
- Implement multi-token and multi-zone support
- Add data visualization with charts
- Implement offline caching
- Add data export functionality
- Include comprehensive documentation"
```

### 后续提交
遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 新功能
git commit -m "feat(dashboard): add 30-day traffic comparison"

# Bug 修复
git commit -m "fix(auth): resolve token validation issue"

# 文档更新
git commit -m "docs: update build instructions"

# 代码重构
git commit -m "refactor(services): improve GraphQL client structure"

# 性能优化
git commit -m "perf(charts): optimize chart rendering"
```

---

## 🏷️ 创建 Release

### 步骤 1: 创建 Tag

```bash
# 创建版本标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 推送标签
git push origin v1.0.0
```

### 步骤 2: 在 GitHub 创建 Release

1. 访问仓库页面
2. 点击 "Releases" → "Create a new release"
3. 选择标签: `v1.0.0`
4. 填写 Release 信息：
   - **Title**: `v1.0.0 - Initial Release`
   - **Description**: 从 CHANGELOG.md 复制内容
5. 上传构建好的 APK（可选）
6. 点击 "Publish release"

---

## 🔧 仓库设置

### 1. 基本设置

访问 `Settings` → `General`:
- [ ] 添加项目描述
- [ ] 添加网站链接（如果有）
- [ ] 添加 Topics 标签:
  - `react-native`
  - `expo`
  - `typescript`
  - `cloudflare`
  - `analytics`
  - `mobile-app`
  - `ios`
  - `android`

### 2. 分支保护

访问 `Settings` → `Branches`:
- [ ] 保护 `main` 分支
- [ ] 要求 Pull Request 审核
- [ ] 要求状态检查通过

### 3. Issues 模板

创建 `.github/ISSUE_TEMPLATE/`:
- [ ] Bug 报告模板
- [ ] 功能请求模板

### 4. Pull Request 模板

创建 `.github/PULL_REQUEST_TEMPLATE.md`

### 5. GitHub Actions（可选）

创建 `.github/workflows/`:
- [ ] CI/CD 工作流
- [ ] 代码检查
- [ ] 自动构建

---

## 📊 项目徽章

在 README.md 中添加徽章：

```markdown
[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/cloudflare-analytics.svg)](https://github.com/YOUR_USERNAME/cloudflare-analytics/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/YOUR_USERNAME/cloudflare-analytics.svg)](https://github.com/YOUR_USERNAME/cloudflare-analytics/issues)
```

---

## 🎯 上传后任务

### 1. 验证
- [ ] 访问 GitHub 仓库页面
- [ ] 检查所有文件是否正确上传
- [ ] 检查 README 显示是否正常
- [ ] 测试克隆仓库并运行

### 2. 分享
- [ ] 在社交媒体分享
- [ ] 提交到 Expo 应用目录
- [ ] 添加到个人作品集

### 3. 维护
- [ ] 设置 GitHub Notifications
- [ ] 定期更新依赖
- [ ] 回复 Issues 和 Pull Requests
- [ ] 发布新版本

---

## 🔒 安全检查

### 最后确认
- [ ] 没有提交 `.env` 文件
- [ ] 没有提交 API Token
- [ ] 没有提交密钥文件 (`.jks`, `.p12`, `.key`)
- [ ] 没有提交个人信息
- [ ] 没有提交敏感配置

### 如果不小心提交了敏感信息

```bash
# 从历史记录中删除文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch PATH_TO_FILE" \
  --prune-empty --tag-name-filter cat -- --all

# 强制推送
git push origin --force --all
```

---

## 📞 需要帮助？

如果遇到问题：
- 查看 [GitHub 文档](https://docs.github.com/)
- 搜索相关 Issues
- 联系维护者

---

## ✅ 完成检查

- [ ] 所有文件已准备
- [ ] 代码已检查
- [ ] 文档已整理
- [ ] 敏感信息已清除
- [ ] Git 仓库已初始化
- [ ] GitHub 仓库已创建
- [ ] 代码已推送
- [ ] 仓库设置已完成
- [ ] README 已更新
- [ ] Release 已创建（可选）

---

**准备好了吗？开始上传到 GitHub！** 🚀

```bash
# 快速上传命令
git add .
git commit -m "feat: initial commit"
git remote add origin https://github.com/YOUR_USERNAME/cloudflare-analytics.git
git branch -M main
git push -u origin main
```
