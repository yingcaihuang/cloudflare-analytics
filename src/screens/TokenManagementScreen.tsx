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
            navigation.navigate('AccountZoneSelection' as never);
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
      navigation.navigate('AccountZoneSelection' as never);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading tokens...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Token 管理</Text>
        <Text style={styles.subtitle}>
          {tokens.length === 0 ? '还没有保存的tokens' : `${tokens.length} 个已保存的tokens`}
        </Text>
      </View>

      {/* Tokens List */}
      <ScrollView style={styles.listContainer}>
        {tokens.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>还没有保存的tokens</Text>
            <Text style={styles.emptySubtext}>点击下方按钮添加第一个token</Text>
          </View>
        ) : (
          tokens.map((token) => (
            <View key={token.id} style={styles.tokenCard}>
              <TouchableOpacity
                style={styles.tokenCardContent}
                onPress={() => handleSelectToken(token.id)}
              >
                <View style={styles.tokenInfo}>
                  <View style={styles.tokenHeader}>
                    <Text style={styles.tokenLabel}>{token.label}</Text>
                    {token.id === currentTokenId && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>当前</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.tokenDate}>
                    添加于: {new Date(token.createdAt).toLocaleDateString('zh-CN')}
                  </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteToken(token.id, token.label)}
              >
                <Text style={styles.deleteButtonText}>删除</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Token Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
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
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>添加新Token</Text>
                  
                  <ScrollView 
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    style={styles.modalScrollView}
                  >
                    <Text style={styles.inputLabel}>Token 标签</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="例如: 生产环境, 测试环境"
                      value={newTokenLabel}
                      onChangeText={setNewTokenLabel}
                      editable={!isValidating}
                      returnKeyType="next"
                    />

                    <Text style={styles.inputLabel}>API Token</Text>
                    <TextInput
                      style={[styles.input, styles.tokenInput]}
                      placeholder="输入 Cloudflare API Token"
                      value={newToken}
                      onChangeText={setNewToken}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isValidating}
                      multiline
                      numberOfLines={4}
                      returnKeyType="done"
                      blurOnSubmit={true}
                    />
                  </ScrollView>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowAddModal(false);
                        setNewToken('');
                        setNewTokenLabel('');
                      }}
                      disabled={isValidating}
                    >
                      <Text style={styles.cancelButtonText}>取消</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.modalButton, styles.confirmButton]}
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  },
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
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  tokenCard: {
    backgroundColor: '#fff',
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
  tokenLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  currentBadge: {
    backgroundColor: '#f97316',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tokenDate: {
    fontSize: 13,
    color: '#999',
  },
  arrow: {
    fontSize: 32,
    color: '#ccc',
    marginLeft: 12,
  },
  deleteButton: {
    backgroundColor: '#fee',
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#fdd',
  },
  deleteButtonText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  addButton: {
    backgroundColor: '#f97316',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '70%',
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
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
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#f97316',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
