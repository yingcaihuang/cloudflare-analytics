# 贡献指南

感谢你考虑为 Cloudflare Analytics 做出贡献！

## 🤝 如何贡献

### 报告 Bug

如果你发现了 Bug，请创建一个 Issue 并包含以下信息：

- Bug 的详细描述
- 复现步骤
- 预期行为
- 实际行为
- 截图（如果适用）
- 设备信息（iOS/Android 版本）
- 应用版本

### 提出新功能

如果你有新功能的想法：

1. 先检查 Issues 中是否已有类似建议
2. 创建新 Issue，描述功能需求和使用场景
3. 等待维护者反馈

### 提交代码

1. **Fork 仓库**
   ```bash
   # 点击 GitHub 页面右上角的 Fork 按钮
   ```

2. **克隆你的 Fork**
   ```bash
   git clone https://github.com/your-username/cloudflare-analytics.git
   cd cloudflare-analytics
   ```

3. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

4. **安装依赖**
   ```bash
   npm install
   ```

5. **进行更改**
   - 编写代码
   - 遵循代码规范
   - 添加必要的注释

6. **测试更改**
   ```bash
   npm run lint
   npm run type-check
   npm start
   ```

7. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

8. **推送到 GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

9. **创建 Pull Request**
   - 访问你的 Fork 页面
   - 点击 "New Pull Request"
   - 填写 PR 描述
   - 等待审核

## 📝 代码规范

### TypeScript

- 使用 TypeScript 编写所有代码
- 为函数和组件添加类型注解
- 避免使用 `any` 类型

### 命名规范

- **组件**: PascalCase (例如: `DashboardScreen.tsx`)
- **函数**: camelCase (例如: `fetchTrafficMetrics`)
- **常量**: UPPER_SNAKE_CASE (例如: `API_ENDPOINT`)
- **接口**: PascalCase with `I` prefix (例如: `ITrafficMetrics`)

### 文件组织

```
src/
├── components/     # 可复用组件
├── screens/        # 页面组件
├── services/       # 业务逻辑
├── hooks/          # 自定义 Hooks
├── types/          # 类型定义
└── utils/          # 工具函数
```

### 代码风格

- 使用 2 空格缩进
- 使用单引号
- 每行最多 100 字符
- 使用 Prettier 格式化代码

```bash
npm run format
```

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type):**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例:**
```
feat(dashboard): add 30-day traffic comparison

- Add time range selector
- Implement comparison logic
- Update chart component

Closes #123
```

## 🧪 测试

在提交 PR 前，请确保：

- [ ] 代码通过 ESLint 检查
- [ ] 代码通过 TypeScript 类型检查
- [ ] 应用在 iOS 和 Android 上正常运行
- [ ] 没有引入新的警告或错误
- [ ] 更新了相关文档

```bash
# 运行检查
npm run lint
npm run type-check

# 测试应用
npm start
```

## 📚 文档

如果你的更改影响了用户使用方式：

- 更新 README.md
- 更新相关文档
- 添加代码注释

## 🎨 UI/UX 指南

- 遵循 iOS Human Interface Guidelines
- 遵循 Material Design 规范
- 保持界面简洁直观
- 确保良好的可访问性

## ❓ 问题？

如果你有任何问题：

- 查看现有 Issues
- 创建新 Issue
- 发送邮件给维护者

## 🙏 感谢

感谢所有贡献者！你们的贡献让这个项目变得更好。

---

**Happy Coding! 🚀**
