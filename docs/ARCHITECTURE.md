# 架构文档

## 概述

Cloudflare Analytics 采用分层架构设计，确保代码的可维护性、可测试性和可扩展性。

## 架构图

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                     │
│              (Screens, Components, UI)                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Business Logic Layer                    │
│           (Hooks, Context, State Management)             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Data Access Layer                      │
│         (Services, API Clients, Cache Manager)           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   External Services                      │
│              (Cloudflare GraphQL API)                    │
└─────────────────────────────────────────────────────────┘
```

## 层次说明

### 1. Presentation Layer（展示层）

**职责**: 用户界面和交互

**组件**:
- **Screens**: 页面级组件
  - `DashboardScreen`: 流量概览
  - `StatusCodesScreen`: 状态码分析
  - `SecurityScreen`: 安全监控
  - 等等...

- **Components**: 可复用 UI 组件
  - `LineChart`: 折线图
  - `PieChart`: 饼图
  - `BarChart`: 柱状图
  - `MetricCard`: 指标卡片

**特点**:
- 只负责 UI 渲染和用户交互
- 不包含业务逻辑
- 通过 Props 接收数据
- 通过回调函数触发操作

### 2. Business Logic Layer（业务逻辑层）

**职责**: 业务逻辑和状态管理

**组件**:
- **Custom Hooks**: 封装业务逻辑
  - `useTrafficMetrics`: 流量数据获取
  - `useStatusCodes`: 状态码数据获取
  - `useSecurityMetrics`: 安全数据获取

- **Context**: 全局状态管理
  - `ZoneContext`: Zone 选择和管理

**特点**:
- 封装数据获取逻辑
- 管理组件状态
- 处理错误和加载状态
- 实现缓存策略

### 3. Data Access Layer（数据访问层）

**职责**: 数据获取和存储

**组件**:
- **Services**: 业务服务
  - `AuthManager`: 认证管理
  - `GraphQLClient`: API 客户端
  - `CacheManager`: 缓存管理
  - `ExportManager`: 数据导出

**特点**:
- 封装 API 调用
- 处理数据转换
- 管理本地存储
- 实现重试逻辑

### 4. External Services（外部服务）

**职责**: 第三方服务集成

**服务**:
- Cloudflare GraphQL API
- Cloudflare REST API

## 数据流

### 数据获取流程

```
User Action (点击刷新)
    ↓
Screen Component (DashboardScreen)
    ↓
Custom Hook (useTrafficMetrics)
    ↓
Service (GraphQLClient)
    ↓
API Request (Cloudflare GraphQL)
    ↓
API Response
    ↓
Data Transformation
    ↓
Cache Storage (CacheManager)
    ↓
State Update (Hook)
    ↓
UI Re-render (Screen)
```

### 缓存策略

```
Data Request
    ↓
Check Cache (CacheManager)
    ↓
Cache Valid? ──Yes──> Return Cached Data
    │
    No
    ↓
Fetch from API
    ↓
Save to Cache
    ↓
Return Fresh Data
```

## 关键设计模式

### 1. Repository Pattern（仓储模式）

**实现**: `GraphQLClient`, `CacheManager`

**优点**:
- 抽象数据源
- 易于测试
- 易于切换数据源

### 2. Hook Pattern（Hook 模式）

**实现**: Custom Hooks

**优点**:
- 逻辑复用
- 关注点分离
- 易于测试

### 3. Context Pattern（上下文模式）

**实现**: `ZoneContext`

**优点**:
- 全局状态管理
- 避免 Props 钻取
- 性能优化

### 4. Singleton Pattern（单例模式）

**实现**: Service 类

**优点**:
- 共享实例
- 统一配置
- 资源管理

## 模块依赖

```
Screens
  ↓ depends on
Hooks
  ↓ depends on
Services
  ↓ depends on
Types
```

**规则**:
- 上层可以依赖下层
- 下层不能依赖上层
- 同层之间避免循环依赖

## 错误处理

### 错误分类

1. **Network Errors**: 网络错误
2. **Authentication Errors**: 认证错误
3. **API Errors**: API 错误
4. **Data Errors**: 数据错误
5. **System Errors**: 系统错误

### 错误处理流程

```
Error Occurs
    ↓
Error Handler (errorHandler.ts)
    ↓
Classify Error
    ↓
Log Error (脱敏)
    ↓
Generate User Message
    ↓
Return to UI
```

## 性能优化

### 1. 数据缓存

- 使用 AsyncStorage 缓存 API 响应
- TTL 机制自动失效
- 离线访问支持

### 2. 组件优化

- React.memo 避免不必要渲染
- useMemo 缓存计算结果
- useCallback 缓存回调函数

### 3. 列表优化

- FlatList 虚拟化
- 分页加载
- 懒加载

### 4. 图表优化

- 数据采样
- 懒加载
- 缓存渲染结果

## 安全考虑

### 1. Token 安全

- Expo SecureStore 加密存储
- 不在日志中输出
- 传输使用 HTTPS

### 2. 数据安全

- 敏感数据加密
- 日志脱敏
- 安全的缓存策略

### 3. API 安全

- Token 验证
- 请求签名
- 错误处理

## 测试策略

### 1. 单元测试

- 测试纯函数
- 测试工具函数
- 测试数据转换

### 2. 集成测试

- 测试 Hooks
- 测试 Services
- 测试数据流

### 3. E2E 测试

- 测试关键用户流程
- 测试错误场景
- 测试性能

## 扩展性

### 添加新功能

1. 定义类型 (`types/`)
2. 实现 Service (`services/`)
3. 创建 Hook (`hooks/`)
4. 实现 Screen (`screens/`)
5. 添加导航

### 添加新数据源

1. 创建新 Service
2. 实现数据获取方法
3. 创建对应 Hook
4. 更新 UI 组件

## 最佳实践

1. **单一职责**: 每个模块只做一件事
2. **依赖注入**: 通过参数传递依赖
3. **接口隔离**: 定义清晰的接口
4. **错误处理**: 统一的错误处理机制
5. **类型安全**: 使用 TypeScript 类型
6. **代码复用**: 提取公共逻辑
7. **性能优化**: 避免不必要的渲染
8. **安全第一**: 保护敏感数据

## 参考资料

- [React Native 最佳实践](https://reactnative.dev/docs/performance)
- [Expo 文档](https://docs.expo.dev/)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
