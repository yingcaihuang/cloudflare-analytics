# PDF Export Infrastructure Setup

## Overview

This document describes the PDF export infrastructure setup for the Cloudflare Analytics mobile application. The infrastructure supports generating PDF documents from analytics data with comprehensive testing capabilities.

## Installed Dependencies

### Production Dependencies

1. **react-native-html-to-pdf** (v1.3.0)
   - Purpose: Convert HTML content to PDF documents on iOS and Android
   - Usage: Core PDF generation functionality
   - Platform Support: iOS and Android
   - Documentation: https://github.com/christopherdro/react-native-html-to-pdf

### Development Dependencies

1. **fast-check** (v4.5.3)
   - Purpose: Property-based testing library for TypeScript/JavaScript
   - Usage: Verify correctness properties across randomized inputs
   - Configuration: Configured to run 100 iterations per property test by default
   - Documentation: https://fast-check.dev/

2. **pdf-parse** (v2.4.5)
   - Purpose: Parse PDF files to extract text and metadata
   - Usage: Verify PDF content in tests
   - Documentation: https://www.npmjs.com/package/pdf-parse

3. **@types/react-native-html-to-pdf** (v0.8.3)
   - Purpose: TypeScript type definitions for react-native-html-to-pdf
   - Usage: Type safety and IDE autocomplete

4. **@types/pdf-parse** (v1.1.5)
   - Purpose: TypeScript type definitions for pdf-parse
   - Usage: Type safety and IDE autocomplete

## Configuration

### TypeScript Configuration

Custom type declarations have been added in `src/types/react-native-html-to-pdf.d.ts` to extend the library types with additional options:

```typescript
interface Options {
  html: string;
  fileName: string;
  directory?: 'Documents' | 'Downloads';
  base64?: boolean;
  width?: number;
  height?: number;
  padding?: number;
  bgColor?: string;
}
```

### Jest Configuration

The Jest setup file (`jest.setup.js`) has been updated to configure fast-check for property-based testing:

- Default number of runs: 100 iterations per property test
- Verbose mode: Disabled (can be enabled for debugging)

### Test Organization

Tests are organized in the `__tests__` directories following the existing pattern:

- Unit tests: Specific examples and edge cases
- Property tests: Universal properties across all inputs
- Integration tests: End-to-end workflows

## Verification

A setup verification test has been created at `src/services/__tests__/pdf-setup.test.ts` that confirms:

1. fast-check is available and functional
2. Property tests can run with configured iterations
3. TypeScript types are properly configured
4. String and record generators work correctly

Run the verification test:

```bash
npm test -- src/services/__tests__/pdf-setup.test.ts
```

## Platform-Specific Considerations

### iOS

- PDFs are saved to the Documents directory by default
- Uses native iOS PDF rendering capabilities
- Requires no additional permissions

### Android

- PDFs are saved to the Downloads directory by default
- Uses native Android PDF rendering capabilities
- May require WRITE_EXTERNAL_STORAGE permission on older Android versions

## Next Steps

With the infrastructure in place, the following components can now be implemented:

1. FileManager utility class for file operations
2. PDFGenerator class for HTML template generation
3. PDFExportService for orchestration
4. UI components for export functionality

## Testing Strategy

The PDF export feature uses a dual testing approach:

1. **Unit Tests**: Verify specific examples, edge cases, and error conditions
2. **Property Tests**: Verify universal properties hold across all valid inputs

Each property test:
- Runs 100 iterations with randomized inputs
- References its corresponding design document property
- Uses the tag format: `Feature: pdf-export-feature, Property {number}: {property_text}`

## Troubleshooting

### Native Module Linking

If you encounter issues with react-native-html-to-pdf:

1. Clean the build cache:
   ```bash
   npm run clean-cache
   ```

2. Rebuild the native modules:
   ```bash
   cd ios && pod install && cd ..
   ```

3. For Android, clean and rebuild:
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

### Type Errors

If TypeScript cannot find the types:

1. Ensure `src/types/react-native-html-to-pdf.d.ts` exists
2. Check that `tsconfig.json` includes the `src` directory
3. Restart the TypeScript server in your IDE

### Test Failures

If property tests fail unexpectedly:

1. Check the failing example provided by fast-check
2. Verify the property definition is correct
3. Ensure generators produce valid inputs
4. Increase verbosity: `{ verbose: true }` in test options

## Resources

- [React Native HTML to PDF Documentation](https://github.com/christopherdro/react-native-html-to-pdf)
- [fast-check Documentation](https://fast-check.dev/)
- [Property-Based Testing Guide](https://fast-check.dev/docs/introduction/)
- [PDF Export Feature Design Document](../.kiro/specs/pdf-export-feature/design.md)
- [PDF Export Feature Requirements](../.kiro/specs/pdf-export-feature/requirements.md)
