// Navigation type definitions
import type { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack Navigator
export type AuthStackParamList = {
  TokenInput: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Dashboard: undefined;
  CustomDashboard: undefined;
  StatusCodes: undefined;
  Security: undefined;
  Analytics: undefined;
  Settings: undefined;
  LayoutManager: undefined;
};

// Analytics Stack Navigator (for future nested navigation)
export type AnalyticsStackParamList = {
  AnalyticsHome: undefined;
  GeoDistribution: undefined;
  ProtocolDistribution: undefined;
  TLSDistribution: undefined;
  ContentType: undefined;
  StatusCodes: undefined;
  BotAnalysis: undefined;
  FirewallAnalysis: undefined;
};

// Settings Stack Navigator (for future nested navigation)
export type SettingsStackParamList = {
  SettingsHome: undefined;
  TokenManagement: undefined;
  AccountZoneSelection: undefined;
  AlertConfig: undefined;
  AlertHistory: undefined;
};

// Export Stack Navigator (for PDF export features)
export type ExportStackParamList = {
  AdvancedExport: undefined;
};

// Root Stack Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
