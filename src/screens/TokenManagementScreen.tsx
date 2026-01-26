/**
 * TokenManagementScreen
 * Screen for managing multiple API tokens
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import AuthManager from '../services/AuthManager';

interface SavedToken {
  id: string;
  label: string;
  createdAt: string;
}

interface TokenManagementScreenProps {
  onTokenSelected: () => void;
}

export default function TokenManagementScreen({ onTokenSelected }: TokenManagementScreenProps) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [tokens, setTokens] = useState<SavedToken[]>([]);
  const [currentTokenId, setCurrentTokenId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [newTokenLabel, setNewTokenLabel] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      setIsLoading(true);
      const tokensList = await AuthManager.getTokensList();
      const currentId = await AuthManager.getCurrentTokenId();
      setTokens(tokensList);
      setCurrentTokenId(currentId);
    } catch (error) {
      console.error('Error loading tokens:', error);
      Alert.alert('Error', 'Failed to load tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToken = async () => {
    if (!newToken.trim()) {
      Alert.alert('Error', 'Please enter a token');
      return;
    }

    if (!newTokenLabel.trim()) {
      Alert.alert('Error', 'Please enter a label for this token');
      return;
    }

    setIsValidating(true);
    try {
      // Validate token first
      const validation = await AuthManager.validateToken(newToken);
      
      if (!validation.valid) {
        Alert.alert('Invalid Token', validation.error || 'Token validation failed');
        setIsValidating(false);
        return;
      }

      // Save token
      const tokenId = await AuthManager.saveNewToken(newToken, newTokenLabel);
      
      // Set as current token
      await AuthManager.setCurrentToken(tokenId);
      
      // Reload tokens list
      await loadTokens();
      
      // Close modal and reset form
      setShowAddModal(false);
      setNewToken('');
      setNewTokenLabel('');
      
      Alert.alert('Success', 'Token added successfully!', [
        { 
          text: 'OK', 
          onPress: () => {
            onTokenSelected();
            navigation.navigate('MainTabs' as never);
          }
        }
      ]);
    } catch (error) {
      console.error('Error adding token:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add token');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSelectToken = async (tokenId: string) => {
    try {
      await AuthManager.setCurrentToken(tokenId);
      setCurrentTokenId(tokenId);
      onTokenSelected();
      navigation.navigate('MainTabs' as never);
    } catch (error) {
      console.error('Error selecting token:', error);
      Alert.alert('Error', 'Failed to select token');
    }
  };

  const handleDeleteToken = async (tokenId: string, label: string) => {
    Alert.alert(
      'Delete Token',
      `Are you sure you want to delete "${label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthManager.deleteToken(tokenId);
              await loadTokens();
              Alert.alert('Success', 'Token deleted successfully');
            } catch (error) {
              console.error('Error deleting token:', error);
              Alert.alert('Error', 'Failed to delete token');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading tokens...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Token 管理</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {tokens.length === 0 ? '还没有保存的tokens' : `${tokens.length} 个已保存的tokens`}
        </Text>
      </View>

      {/* Tokens List */}
      <ScrollView style={styles.listContainer}>
        {tokens.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>还没有保存的tokens</Text>
            <Text style={[styles.emptySubtext, { color: colors.textDisabled }]}>点击下方按钮添加第一个token</Text>
          </View>
        ) : (
          tokens.map((token) => (
            <View key={token.id} style={[styles.tokenCard, { backgroundColor: colors.surface }]}>
              <TouchableOpacity
                style={styles.tokenCardContent}
                onPress={() => handleSelectToken(token.id)}
              >
                <View style={styles.tokenInfo}>
                  <View style={styles.tokenHeader}>
                    <Text style={[styles.tokenLabel, { color: colors.text }]}>{token.label}</Text>
                    {token.id === currentTokenId && (
                      <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.currentBadgeText}>当前</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.tokenDate, { color: colors.textDisabled }]}>
                    添加于: {new Date(token.createdAt).toLocaleDateString('zh-CN')}
                  </Text>
                </View>
                <Text style={[styles.arrow, { color: colors.textDisabled }]}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.error + '20', borderTopColor: colors.error + '40' }]}
                onPress={() => handleDeleteToken(token.id, token.label)}
              >
                <Text style={[styles.deleteButtonText, { color: colors.error }]}>删除</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Token Button */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ 添加新Token</Text>
        </TouchableOpacity>
      </View>

      {/* Add Token Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>添加新Token</Text>
                  
                  <ScrollView 
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    style={styles.modalScrollView}
                  >
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Token 标签</Text>
                    <TextInput
                      style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                      placeholder="例如: 生产环境, 测试环境"
                      placeholderTextColor={colors.textDisabled}
                      value={newTokenLabel}
                      onChangeText={setNewTokenLabel}
                      editable={!isValidating}
                      returnKeyType="next"
                    />

                    <Text style={[styles.inputLabel, { color: colors.text }]}>API Token</Text>
                    <TextInput
                      style={[styles.input, styles.tokenInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                      placeholder="输入 Cloudflare API Token"
                      placeholderTextColor={colors.textDisabled}
                      value={newToken}
                      onChangeText={setNewToken}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isValidating}
                      multiline
                      numberOfLines={4}
                      returnKeyType="done"
                    />
                  </ScrollView>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowAddModal(false);
                        setNewToken('');
                        setNewTokenLabel('');
                      }}
                      disabled={isValidating}
                    >
                      <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>取消</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        Keyboard.dismiss();
                        handleAddToken();
                      }}
                      disabled={isValidating}
                    >
                      {isValidating ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.confirmButtonText}>添加</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    padding: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  tokenCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  tokenCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 32,
    marginLeft: 12,
  },
  deleteButton: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  addButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '70%',
  },
  modalScrollView: {
    maxHeight: 300,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  tokenInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
  },
  confirmButton: {
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
