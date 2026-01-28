# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-27

### Added
- 🎨 Modern colorful PDF export design
- 📊 Enhanced PDF report with vibrant colors
- 🌈 10 new vibrant chart colors for better data visualization
- 📝 Comprehensive data format support for PDF export

### Fixed
- 🐛 Fixed PDF export showing empty content
- 🐛 Fixed component import error in TLSDistributionScreen
- 🐛 Fixed geographic data showing "Unknown" labels
- 🐛 Fixed expo-file-system deprecated API warnings
- 🎨 Fixed PDF styling compatibility with expo-print
- 📊 Fixed Status Codes breakdown format support
- 🌍 Fixed Protocol aggregated format support
- 🔒 Fixed TLS aggregated format support

### Changed
- 🎨 Updated PDF styles for better expo-print compatibility
- 🎨 Replaced CSS gradients with solid colors for PDF
- 🎨 Replaced box-shadow with borders for PDF
- 📊 Enhanced data format handling (breakdown, aggregated, nested)
- 🌈 Updated chart color palette to more vibrant colors

### Improved
- 📄 PDF export now supports 4 Status Codes formats
- 🌍 PDF export now supports 3 Geographic data formats
- 🌐 PDF export now supports 3 Protocol data formats
- 🔒 PDF export now supports 3 TLS data formats
- 📊 Better field name detection for geographic data
- ✅ 41/41 tests passing with new test coverage

### Technical
- Removed unsupported CSS features (linear-gradient, box-shadow, text-shadow)
- Added support for `breakdown` format in Status Codes
- Added support for `name` and `code` fields in Geographic data
- Optimized PDF generation for expo-print compatibility
- Enhanced error handling and data validation

## [1.0.0] - 2025-01-21

### Added
- 🎉 Initial release
- 🔐 Multi-token management system
- 🌐 Multi-account and multi-zone support
- 📊 Real-time traffic monitoring
- 📈 Data visualization with charts (Line, Pie, Bar)
- 🔄 Pull-to-refresh functionality
- 💾 Offline data caching
- 📉 Traffic trend analysis (24h/7d/30d)
- 🚦 HTTP status code analysis
- 🛡️ Security metrics monitoring
- 🌍 Geographic distribution analysis
- 🔒 TLS version analysis
- 🌐 Protocol distribution analysis (HTTP/1.1, HTTP/2, HTTP/3)
- 📄 Content type distribution analysis
- 📤 Data export to CSV
- 🎨 Beautiful UI following iOS and Android design guidelines
- ⚡ Performance optimizations

### Features

#### Core Functionality
- Token management with secure storage
- Account and zone selection with pagination
- Real-time data fetching from Cloudflare GraphQL API
- Automatic data caching with TTL
- Error handling and retry logic

#### Data Analysis
- Traffic metrics: requests, bytes, bandwidth, page views, visits
- Status code distribution with percentage calculation
- Security metrics: cache hit rate, firewall events
- Geographic distribution with Top 10 countries
- TLS version distribution with security warnings
- Protocol distribution with HTTP/3 optimization tips
- Content type distribution with Top 10 types

#### User Experience
- Smooth navigation with React Navigation
- Pull-to-refresh on all data screens
- Loading indicators and error messages
- Time range selector (24h/7d/30d)
- Comparison with previous period
- Formatted numbers and units (KB, MB, GB, etc.)

#### Technical
- TypeScript for type safety
- Apollo Client for GraphQL queries
- Expo SecureStore for token encryption
- AsyncStorage for data caching
- React Native Chart Kit for visualizations

### Technical Details
- **Platform**: React Native 0.81.5
- **Framework**: Expo ~54.0
- **Language**: TypeScript 5.9
- **Min iOS**: 14.0
- **Min Android**: 8.0 (API 26)

### Known Issues
- None

### Documentation
- Comprehensive README with setup instructions
- Build instructions for Android APK
- Contributing guidelines
- Code of conduct
- License (MIT)

---

## [Unreleased]

### Planned Features
- [ ] Push notifications for alerts
- [ ] Custom dashboard configuration
- [ ] Alert rules and thresholds
- [ ] iPad optimization
- [ ] Dark mode support
- [ ] More chart types
- [ ] Advanced filtering options
- [ ] Data comparison between zones
- [ ] Export to PDF
- [ ] Widget support

---

## Version History

### Version Numbering
- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes

### Release Schedule
- Major releases: Quarterly
- Minor releases: Monthly
- Patch releases: As needed

---

[1.0.0]: https://github.com/yourusername/cloudflare-analytics/releases/tag/v1.0.0
[Unreleased]: https://github.com/yourusername/cloudflare-analytics/compare/v1.0.0...HEAD
