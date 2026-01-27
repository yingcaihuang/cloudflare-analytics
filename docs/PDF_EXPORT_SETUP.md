# PDF Export Setup Guide

This document explains the PDF export functionality and how to test it.

## Overview

The PDF export feature uses **`expo-print`**, an official Expo SDK module that converts HTML to PDF. This works seamlessly in both Expo Go and production builds.

## Dependencies

The following packages are required:

```json
{
  "expo-print": "~14.0.8",
  "expo-sharing": "~13.0.5",
  "expo-file-system": "~19.0.21"
}
```

These are all official Expo SDK modules and work in:
- ✅ Expo Go
- ✅ Development builds
- ✅ Production builds (Android APK/AAB, iOS IPA)

## How It Works

1. **HTML Generation**: `PDFGenerator` creates styled HTML from analytics data
2. **PDF Rendering**: `expo-print` converts HTML to PDF
3. **File Management**: `expo-file-system` handles file operations
4. **Sharing**: `expo-sharing` allows users to share/save the PDF

## Testing

### In Expo Go
```bash
npm start
# Scan QR code with Expo Go app
# Navigate to any analytics screen
# Tap the export button
```

### In Development Build
```bash
npx eas build --platform android --profile development
# Install the APK
# Test PDF export functionality
```

### In Production Build
```bash
# Android
npx eas build --platform android --profile preview

# iOS
npx eas build --platform ios --profile preview
```

## File Locations

PDFs are saved to:
- **Android**: `file:///data/user/0/com.cloudflare.analytics/files/`
- **iOS**: App's Documents directory

Users can access files through:
- Share dialog (immediate)
- Files app (persistent storage)

## Troubleshooting

### PDF Not Generating
- Check console for errors
- Verify data is loaded before export
- Ensure sufficient storage space

### Styling Issues
- HTML/CSS is rendered by platform's print engine
- Test on actual devices for accurate rendering
- Avoid complex CSS features

### Performance
- Large datasets may take 10-30 seconds
- Progress indicator shows status
- Timeout warning appears after 30 seconds

## Architecture

```
PDFExportService (Orchestration)
  ├── Data Aggregation (GraphQLClient)
  ├── HTML Generation (PDFGenerator)
  ├── PDF Rendering (expo-print)
  └── File Management (FileManager)
```

## Migration from react-native-html-to-pdf

This project previously used `react-native-html-to-pdf`, which required native linking and didn't work in Expo Go. We migrated to `expo-print` for better compatibility:

**Benefits:**
- ✅ Works in Expo Go
- ✅ No native configuration needed
- ✅ Official Expo support
- ✅ Consistent cross-platform behavior
- ✅ Simpler setup and maintenance

## Related Files

- `src/services/PDFExportService.ts` - Main export orchestration
- `src/services/PDFGenerator.ts` - HTML/PDF generation
- `src/services/FileManager.ts` - File operations
- `src/components/ExportButton.tsx` - UI component
- `src/screens/AdvancedExportScreen.tsx` - Export configuration screen
