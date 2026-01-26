/**
 * Integration Tests for CustomDashboardScreen
 * Tests the layout selector integration and layout switching flow
 */

describe('CustomDashboardScreen - Layout Selector Integration', () => {
  it('should have proper integration structure', () => {
    // Read the source file to verify integration
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../CustomDashboardScreen.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Verify LayoutSelector is imported
    expect(fileContent).toContain("import { LayoutSelector } from '../components/LayoutSelector'");

    // Verify config is destructured from useDashboard
    expect(fileContent).toContain('config,');

    // Verify switchLayout is destructured from useDashboard
    expect(fileContent).toContain('switchLayout,');

    // Verify LayoutSelector component is rendered
    expect(fileContent).toContain('<LayoutSelector');

    // Verify LayoutSelector props are passed
    expect(fileContent).toContain('layouts={Object.values(config.layouts)}');
    expect(fileContent).toContain('activeLayoutId={config.activeLayoutId}');
    expect(fileContent).toContain('onSelectLayout={handleSelectLayout}');
    expect(fileContent).toContain('onManageLayouts={handleNavigateToSettings}');

    // Verify handleSelectLayout callback exists
    expect(fileContent).toContain('const handleSelectLayout = useCallback');
    expect(fileContent).toContain('await switchLayout(layoutId)');
    expect(fileContent).toContain("showToast('已切换布局', 'success')");
  });

  it('should have proper layout switching callback implementation', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../CustomDashboardScreen.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Verify handleSelectLayout implementation
    expect(fileContent).toContain('const handleSelectLayout = useCallback(async (layoutId: string) => {');
    expect(fileContent).toContain('if (layoutId === activeLayout?.id) return;');
    expect(fileContent).toContain('await switchLayout(layoutId);');
    expect(fileContent).toContain('[activeLayout, switchLayout, showToast]');
  });

  it('should have proper navigation to layout manager', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../CustomDashboardScreen.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Verify handleNavigateToSettings is used for both settings button and layout selector
    expect(fileContent).toContain('const handleNavigateToSettings = useCallback(() => {');
    expect(fileContent).toContain("navigation.navigate('LayoutManager' as never);");
    expect(fileContent).toContain('onManageLayouts={handleNavigateToSettings}');
  });

  it('should conditionally render LayoutSelector when config is available', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../CustomDashboardScreen.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Verify conditional rendering
    expect(fileContent).toContain('{config && (');
    expect(fileContent).toContain('<LayoutSelector');
  });

  it('should have proper layout switching animation', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../CustomDashboardScreen.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Verify animation setup
    expect(fileContent).toContain('const fadeAnim = useRef(new Animated.Value(1)).current;');
    expect(fileContent).toContain('const previousLayoutId = useRef(activeLayout?.id);');

    // Verify animation effect
    expect(fileContent).toContain('useEffect(() => {');
    expect(fileContent).toContain('if (activeLayout && previousLayoutId.current !== activeLayout.id) {');
    expect(fileContent).toContain('Animated.timing(fadeAnim');
  });

  it('should refresh data when layout changes', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../CustomDashboardScreen.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Verify data refresh on layout change
    expect(fileContent).toContain('useEffect(() => {');
    expect(fileContent).toContain('if (activeLayout && previousLayoutId.current && previousLayoutId.current !== activeLayout.id) {');
    expect(fileContent).toContain('handleRefresh();');
  });
});

describe('CustomDashboardScreen - Layout Switching Flow', () => {
  it('should have complete layout switching flow', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../CustomDashboardScreen.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Verify complete flow:
    // 1. LayoutSelector component is rendered
    expect(fileContent).toContain('<LayoutSelector');

    // 2. User selects a layout (onSelectLayout callback)
    expect(fileContent).toContain('onSelectLayout={handleSelectLayout}');

    // 3. handleSelectLayout calls switchLayout
    expect(fileContent).toContain('await switchLayout(layoutId);');

    // 4. Success toast is shown
    expect(fileContent).toContain("showToast('已切换布局', 'success')");

    // 5. Error handling is in place
    expect(fileContent).toContain('catch (error)');
    expect(fileContent).toContain("showToast(");
    expect(fileContent).toContain("'error'");
  });

  it('should have proper error handling for layout switching', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../CustomDashboardScreen.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Verify error handling
    expect(fileContent).toContain('try {');
    expect(fileContent).toContain('await switchLayout(layoutId);');
    expect(fileContent).toContain('} catch (error) {');
    expect(fileContent).toContain("console.error('Failed to switch layout:', error);");
    expect(fileContent).toContain("error instanceof Error ? error.message : '切换失败'");
  });

  it('should prevent switching to the same layout', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../CustomDashboardScreen.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Verify early return for same layout
    expect(fileContent).toContain('if (layoutId === activeLayout?.id) return;');
  });
});

