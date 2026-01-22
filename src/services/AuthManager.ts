/**
 * AuthManager Service
 * Handles API Token validation, secure storage, and multi-token management
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ValidationResult, Account } from '../types/auth';
import { Zone } from '../types/common';

const CURRENT_TOKEN_KEY = 'cloudflare_current_token';
const TOKENS_LIST_KEY = 'cloudflare_tokens_list';

interface SavedToken {
  id: string;
  label: string;
  createdAt: string;
}

/**
 * AuthManager class for managing Cloudflare API authentication with multi-token support
 */
class AuthManager {
  /**
   * Validates a Cloudflare API Token by calling the Cloudflare API
   * @param token - The API token to validate
   * @returns ValidationResult with validity status, error message, and zones if valid
   */
  async validateToken(token: string): Promise<ValidationResult> {
    // Check for empty token
    if (!token || token.trim().length === 0) {
      return {
        valid: false,
        error: 'Token cannot be empty',
      };
    }

    try {
      // Call Cloudflare API to verify token and get zones
      const response = await fetch('https://api.cloudflare.com/client/v4/zones', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API errors
        if (response.status === 401 || response.status === 403) {
          return {
            valid: false,
            error: 'Invalid or expired token. Please check your API token.',
          };
        }

        return {
          valid: false,
          error: data.errors?.[0]?.message || 'Failed to validate token',
        };
      }

      // Token is valid, extract zones
      const zones: Zone[] = data.result?.map((zone: any) => ({
        id: zone.id,
        name: zone.name,
        status: zone.status,
        plan: zone.plan?.name || 'Unknown',
      })) || [];

      return {
        valid: true,
        zones,
      };
    } catch (error) {
      // Network or other errors
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Saves a new token with a label
   * @param token - The API token to save
   * @param label - A user-friendly label for the token
   * @returns The token ID
   */
  async saveNewToken(token: string, label: string): Promise<string> {
    try {
      // Generate unique ID for this token
      const tokenId = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Save the actual token securely
      await SecureStore.setItemAsync(tokenId, token);
      
      // Get existing tokens list
      const tokensList = await this.getTokensList();
      
      // Add new token to list
      tokensList.push({
        id: tokenId,
        label,
        createdAt: new Date().toISOString(),
      });
      
      // Save updated list
      await AsyncStorage.setItem(TOKENS_LIST_KEY, JSON.stringify(tokensList));
      
      return tokenId;
    } catch (error) {
      throw new Error(
        `Failed to save token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Gets the list of all saved tokens (without the actual token values)
   * @returns Array of saved token metadata
   */
  async getTokensList(): Promise<SavedToken[]> {
    try {
      const listJson = await AsyncStorage.getItem(TOKENS_LIST_KEY);
      if (!listJson) {
        return [];
      }
      return JSON.parse(listJson);
    } catch (error) {
      console.error('Failed to get tokens list:', error);
      return [];
    }
  }

  /**
   * Sets the current active token
   * @param tokenId - The ID of the token to set as current
   */
  async setCurrentToken(tokenId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(CURRENT_TOKEN_KEY, tokenId);
    } catch (error) {
      throw new Error(
        `Failed to set current token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Gets the current active token ID
   * @returns The current token ID or null
   */
  async getCurrentTokenId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(CURRENT_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get current token ID:', error);
      return null;
    }
  }

  /**
   * Retrieves the current active token value
   * @returns The stored token or null if not found
   */
  async getCurrentToken(): Promise<string | null> {
    try {
      const tokenId = await this.getCurrentTokenId();
      if (!tokenId) {
        return null;
      }
      return await SecureStore.getItemAsync(tokenId);
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  }

  /**
   * Gets a specific token by ID
   * @param tokenId - The ID of the token to retrieve
   * @returns The token value or null
   */
  async getTokenById(tokenId: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(tokenId);
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  }

  /**
   * Deletes a token
   * @param tokenId - The ID of the token to delete
   */
  async deleteToken(tokenId: string): Promise<void> {
    try {
      // Remove from secure storage
      await SecureStore.deleteItemAsync(tokenId);
      
      // Remove from tokens list
      const tokensList = await this.getTokensList();
      const updatedList = tokensList.filter(t => t.id !== tokenId);
      await AsyncStorage.setItem(TOKENS_LIST_KEY, JSON.stringify(updatedList));
      
      // If this was the current token, clear it
      const currentTokenId = await this.getCurrentTokenId();
      if (currentTokenId === tokenId) {
        await AsyncStorage.removeItem(CURRENT_TOKEN_KEY);
      }
    } catch (error) {
      throw new Error(
        `Failed to delete token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Updates a token's label
   * @param tokenId - The ID of the token to update
   * @param newLabel - The new label
   */
  async updateTokenLabel(tokenId: string, newLabel: string): Promise<void> {
    try {
      const tokensList = await this.getTokensList();
      const updatedList = tokensList.map(t => 
        t.id === tokenId ? { ...t, label: newLabel } : t
      );
      await AsyncStorage.setItem(TOKENS_LIST_KEY, JSON.stringify(updatedList));
    } catch (error) {
      throw new Error(
        `Failed to update token label: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Alias for getCurrentToken for consistency with interface
   */
  async getToken(): Promise<string | null> {
    return this.getCurrentToken();
  }

  /**
   * Removes the current token (legacy method)
   */
  async removeToken(): Promise<void> {
    try {
      const tokenId = await this.getCurrentTokenId();
      if (tokenId) {
        await this.deleteToken(tokenId);
      }
    } catch (error) {
      console.error('Failed to remove token:', error);
      throw new Error(
        `Failed to remove token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Legacy methods for backward compatibility
  async validateAndSaveToken(token: string): Promise<ValidationResult> {
    const result = await this.validateToken(token);
    if (result.valid) {
      const tokenId = await this.saveNewToken(token, 'Default Token');
      await this.setCurrentToken(tokenId);
    }
    return result;
  }

  async saveToken(token: string): Promise<void> {
    const tokenId = await this.saveNewToken(token, 'Default Token');
    await this.setCurrentToken(tokenId);
  }

  // Account management methods (kept for backward compatibility)
  async addAccount(token: string, label: string): Promise<Account> {
    const validation = await this.validateToken(token);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid token');
    }

    const account: Account = {
      id: this.generateAccountId(),
      label,
      tokenHash: this.hashToken(token),
      createdAt: new Date(),
    };

    return account;
  }

  async switchAccount(accountId: string): Promise<void> {
    // Placeholder for account switching
  }

  async getAccounts(): Promise<Account[]> {
    return [];
  }

  private generateAccountId(): string {
    return `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashToken(token: string): string {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `hash_${Math.abs(hash).toString(36)}`;
  }
}

// Export singleton instance
export default new AuthManager();
