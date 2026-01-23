# Zone 模糊搜索功能

## 功能说明
在 Zone 选择页面添加了模糊搜索功能，可以快速查找特定的 Zone。

## 功能特性

### 搜索范围
- Zone 名称（不区分大小写）
- Zone ID（不区分大小写）

### 搜索行为
- **实时搜索**：输入时立即过滤结果
- **模糊匹配**：支持部分匹配，不需要完整输入
- **不区分大小写**：搜索时忽略大小写
- **自动清空**：返回账户列表时自动清空搜索

### UI 设计
- **搜索框位置**：返回按钮下方
- **占位符文本**："搜索 Zone 名称或 ID..."
- **清除按钮**：输入内容后显示 ✕ 按钮，点击清空搜索
- **空状态提示**：
  - 无匹配结果时显示"没有找到匹配的 Zone"
  - 提示"尝试其他搜索关键词"

## 实现细节

### 搜索状态管理
```typescript
const [zoneSearchQuery, setZoneSearchQuery] = useState('');
```

### 过滤逻辑
```typescript
const getFilteredZones = () => {
  if (!zoneSearchQuery.trim()) {
    return zones;
  }

  const query = zoneSearchQuery.toLowerCase().trim();
  return zones.filter(zone => 
    zone.name.toLowerCase().includes(query) ||
    zone.id.toLowerCase().includes(query)
  );
};
```

### 搜索框组件
- 使用 React Native 的 `TextInput` 组件
- 灰色背景（`#f5f5f5`）
- 圆角设计（8px）
- 右侧清除按钮（圆形，灰色背景）

## 用户体验流程

1. **进入 Zone 列表**：
   - 显示所有 zones
   - 搜索框为空

2. **开始搜索**：
   - 输入关键词
   - 列表实时过滤
   - 显示清除按钮

3. **查看结果**：
   - 匹配的 zones 显示在列表中
   - 无匹配时显示空状态提示

4. **清除搜索**：
   - 点击 ✕ 按钮清空搜索
   - 或返回账户列表自动清空

## 使用场景

### 场景 1：快速查找特定域名
用户有多个 zones，想快速找到 `example.com`：
- 输入 "example"
- 立即显示所有包含 "example" 的 zones

### 场景 2：通过 ID 查找
用户知道 Zone ID 的一部分：
- 输入 ID 片段
- 快速定位到目标 zone

### 场景 3：大量 Zones 筛选
账户下有几十个甚至上百个 zones：
- 使用搜索快速缩小范围
- 避免滚动查找

## 样式设计

### 搜索容器
- 白色背景
- 底部边框分隔
- 水平布局（搜索框 + 清除按钮）

### 搜索输入框
- 浅灰色背景（`#f5f5f5`）
- 圆角 8px
- 内边距：水平 16px，垂直 10px
- 字体大小：16px

### 清除按钮
- 圆形按钮（36x36px）
- 灰色背景（`#f0f0f0`）
- ✕ 图标
- 只在有输入时显示

## 修改文件
- `cloudflare-analytics/src/screens/AccountZoneSelectionScreen.tsx`

## 技术要点
- 使用 `toLowerCase()` 实现不区分大小写搜索
- 使用 `includes()` 实现模糊匹配
- 使用 `trim()` 去除首尾空格
- 条件渲染清除按钮和空状态
