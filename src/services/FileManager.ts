/**
 * FileManager - Handles file system operations for PDF exports
 * 
 * This service manages:
 * - Filename generation with timestamps
 * - Filename sanitization
 * - Platform-specific file paths
 * - Storage space checking
 * - File sharing via native share interface
 */

import * as FileSystem from 'expo-file-system';
import { Platform, Share } from 'react-native';

export interface FileManagerOptions {
  fileName: string;
  directory?: 'Documents' | 'Downloads';
}

export class FileManager {
  /**
   * Generate a unique filename for PDF export
   * Format: cloudflare-analytics-{zone-name}-{timestamp}.pdf
   * 
   * @param zoneName - The zone name to include in filename
   * @param timestamp - The timestamp to use (defaults to current time)
   * @returns Formatted filename
   */
  generateFileName(zoneName: string, timestamp: Date = new Date()): string {
    const sanitizedZoneName = this.sanitizeFileName(zoneName);
    const isoTimestamp = timestamp.toISOString().replace(/[:.]/g, '-').split('.')[0];
    return `cloudflare-analytics-${sanitizedZoneName}-${isoTimestamp}.pdf`;
  }

  /**
   * Sanitize filename by removing invalid characters
   * Removes: / \ : * ? " < > |
   * 
   * @param name - The filename to sanitize
   * @returns Sanitized filename
   */
  sanitizeFileName(name: string): string {
    // Remove invalid filename characters
    return name.replace(/[\/\\:*?"<>|]/g, '');
  }

  /**
   * Get platform-specific save path
   * iOS: Documents directory
   * Android: Downloads directory
   * 
   * @param directory - The directory type (defaults to platform-specific)
   * @returns Full directory path
   */
  getSavePath(directory?: 'Documents' | 'Downloads'): string {
    if (directory === 'Downloads') {
      // Use downloads directory if explicitly requested
      return Platform.OS === 'ios' 
        ? FileSystem.documentDirectory || ''
        : FileSystem.documentDirectory || ''; // Android also uses documentDirectory in Expo
    }
    
    // Default to documents directory
    return FileSystem.documentDirectory || '';
  }

  /**
   * Check if sufficient storage space is available
   * 
   * @param requiredBytes - Number of bytes required
   * @returns Promise resolving to true if space is available
   */
  async checkStorageSpace(requiredBytes: number): Promise<boolean> {
    try {
      const freeDiskStorage = await FileSystem.getFreeDiskStorageAsync();
      return freeDiskStorage > requiredBytes;
    } catch (error) {
      console.error('Error checking storage space:', error);
      // Assume space is available if we can't check
      return true;
    }
  }

  /**
   * Share a file using the native share interface
   * 
   * @param filePath - Full path to the file to share
   * @returns Promise resolving when share is complete
   */
  async shareFile(filePath: string): Promise<void> {
    try {
      const result = await Share.share({
        url: filePath,
        title: 'Export PDF',
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('File shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      throw new Error('Failed to share file');
    }
  }

  /**
   * Get the full file path for a given filename
   * 
   * @param fileName - The filename
   * @param directory - The directory type
   * @returns Full file path
   */
  getFullPath(fileName: string, directory?: 'Documents' | 'Downloads'): string {
    const basePath = this.getSavePath(directory);
    return `${basePath}${fileName}`;
  }

  /**
   * Check if a file exists at the given path
   * 
   * @param filePath - Full path to the file
   * @returns Promise resolving to true if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo.exists;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * Delete a file at the given path
   * 
   * @param filePath - Full path to the file
   * @returns Promise resolving when file is deleted
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }
}

// Export singleton instance
export const fileManager = new FileManager();
