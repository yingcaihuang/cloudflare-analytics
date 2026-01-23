# Home Screen Navigation Fix

## Issue
在首页，点击API Tokens、账户、Zones这三个统计卡片时，都跳转到Token管理页面，而不是各自应该跳转的页面。

## Root Cause
HomeScreen在Tab导航器（MainTabs）中，而TokenManagement和AccountZoneSelection在Stack导航器中。

在React Navigation的嵌套导航器中，从Tab导航器中的屏幕导航到Stack导航器中的屏幕时，需要使用`navigation.getParent()?.navigate()`而不是`navigation.navigate()`。

## Navigation Structure
```
Stack Navigator (Root)
├── MainTabs (Tab Navigator)
│   ├── Home (HomeScreen) ← 我们在这里
│   ├── Dashboard
│   ├── Security
│   └── More
├── TokenManagement ← 需要导航到这里
├── AccountZoneSelection ← 需要导航到这里
└── Other screens...
```

## Solution

### Before
```typescript
const handleManageTokens = () => {
  navigation.navigate('TokenManagement');
};

const handleSelectZone = () => {
  navigation.navigate('AccountZoneSelection');
};
```

这种方式会尝试在Tab导航器中查找这些屏幕，找不到时可能会有意外行为。

### After
```typescript
const handleManageTokens = () => {
  // Navigate to TokenManagement screen (in Stack navigator)
  navigation.getParent()?.navigate('TokenManagement');
};

const handleSelectZone = () => {
  // Navigate to AccountZoneSelection screen (in Stack navigator)
  navigation.getParent()?.navigate('AccountZoneSelection');
};
```

使用`getParent()`获取父级Stack导航器，然后在Stack导航器中导航到目标屏幕。

## Expected Behavior

### API Tokens Card (🔑)
- **点击后**: 跳转到Token管理页面
- **用途**: 添加、编辑、删除API tokens

### 账户 Card (👤)
- **点击后**: 跳转到账户/Zone选择页面
- **用途**: 查看和选择账户

### Zones Card (🌐)
- **点击后**: 跳转到账户/Zone选择页面
- **用途**: 查看和选择zones

## Files Modified
- `cloudflare-analytics/src/screens/HomeScreen.tsx`
  - Updated `handleManageTokens()` to use `navigation.getParent()?.navigate()`
  - Updated `handleSelectZone()` to use `navigation.getParent()?.navigate()`

## Testing
1. Go to Home screen
2. Click on "API Tokens" card → Should navigate to Token Management screen
3. Go back to Home screen
4. Click on "账户" card → Should navigate to Account/Zone Selection screen
5. Go back to Home screen
6. Click on "Zones" card → Should navigate to Account/Zone Selection screen

## Related Documentation
- React Navigation Nested Navigators: https://reactnavigation.org/docs/nesting-navigators/
- Navigation prop reference: https://reactnavigation.org/docs/navigation-prop/
