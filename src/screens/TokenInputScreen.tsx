/**
 * TokenInputScreen
 * Screen for users to input and validate their Cloudflare API Token
 * Requirements: 1.1, 1.2, 1.3
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AuthManager from '../services/AuthManager';

interface TokenInputScreenProps {
  onSuccess?: () => void;
}

export default function TokenInputScreen({ onSuccess }: TokenInputScreenProps) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles token validation
   * Requirements: 1.2 - Validate token validity
   */
  const handleValidateToken = async () => {
    // Clear previous error
    setError(null);

    // Validate input
    if (!token.trim()) {
      setError('Please enter your API token');
      return;
    }

    setIsLoading(true);

    try {
      // Validate and save token
      const result = await AuthManager.validateAndSaveToken(token);

      if (result.valid) {
        // Success - show success message and navigate
        Alert.alert(
          'Success',
          `Token validated successfully! Found ${result.zones?.length || 0} zone(s).`,
          [
            {
              text: 'Continue',
              onPress: () => {
                if (onSuccess) {
                  onSuccess();
                }
              },
            },
          ]
        );
      } else {
        // Requirement 1.3: Display error for invalid/expired token
        setError(result.error || 'Token validation failed');
      }
    } catch (err) {
      // Handle unexpected errors
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Cloudflare Analytics</Text>
            <Text style={styles.subtitle}>
              Enter your API token to get started
            </Text>
          </View>

          {/* Token Input Form */}
          <View style={styles.form}>
            <Text style={styles.label}>API Token</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="Enter your Cloudflare API token"
              value={token}
              onChangeText={(text) => {
                setToken(text);
                // Clear error when user starts typing
                if (error) {
                  setError(null);
                }
              }}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              editable={!isLoading}
              accessibilityLabel="API Token Input"
              accessibilityHint="Enter your Cloudflare API token"
            />

            {/* Error Message - Requirement 1.3 */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Help Text */}
            <Text style={styles.helpText}>
              You can create an API token in your Cloudflare dashboard under My
              Profile → API Tokens
            </Text>

            {/* Validate Button */}
            <TouchableOpacity
              style={[
                styles.button,
                isLoading || !token.trim() ? styles.buttonDisabled : null,
              ]}
              onPress={handleValidateToken}
              disabled={isLoading || !token.trim()}
              accessibilityLabel="Validate Token Button"
              accessibilityHint="Tap to validate your API token"
            >
              {isLoading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.buttonTextLoading}>Validating...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Validate Token</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Your token is stored securely on your device and never shared.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorContainer: {
    backgroundColor: '#fee',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
  },
  helpText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 20,
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#f6821f',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextLoading: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});
