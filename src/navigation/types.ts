// Navigation type definitions
import type { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack Navigator
export type AuthStackParamList = {
  TokenInput: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Dashboard: undefined;
  StatusCodes: undefined;
  Security: undefined;
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
