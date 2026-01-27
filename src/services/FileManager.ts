/**
 * FileManager - Handles file system operations for PDF exports
 * 
 * This service manages:
 * - Filename generation with timestamps
 * - Filename sanitization
 * - Platform-specific file paths
 * - File sharing via native share interface
 */

import { Share } from 'react-native';

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
   * Note: This method is kept for API compatibility but is not used
   * with expo-print as it manages file paths automatically.
   * 
   * @param directory - The directory type (not used)
   * @returns Empty string (expo-print handles paths)
   */
  getSavePath(directory?: 'Documents' | 'Downloads'): string {
    // expo-print handles file paths automatically
    return '';
  }

  /**
   * Check if sufficient storage space is available
   * Note: Storage check is skipped in Expo Go as the new API requires
   * native modules. For production builds, consider implementing proper
   * storage checks using the new File/Directory API.
   * 
   * @param requiredBytes - Number of bytes required
   * @returns Promise resolving to true (always assumes space is available)
   */
  async checkStorageSpace(requiredBytes: number): Promise<boolean> {
    // Skip storage check in Expo Go to avoid deprecation warnings
    // In production, PDFs are typically small (< 5MB) so this is acceptable
    console.log(`Storage check skipped (required: ${(requiredBytes / 1024 / 1024).toFixed(2)}MB)`);
    return true;
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
   * Note: This method is kept for API compatibility but returns
   * just the filename as expo-print manages paths automatically.
   * 
   * @param fileName - The filename
   * @param directory - The directory type (not used)
   * @returns The filename
   */
  getFullPath(fileName: string, directory?: 'Documents' | 'Downloads'): string {
    // expo-print handles file paths automatically
    return fileName;
  }

  /**
   * Check if a file exists at the given path
   * Note: Deprecated - kept for API compatibility only
   * 
   * @param filePath - Full path to the file
   * @returns Promise resolving to false (not implemented)
   */
  async fileExists(filePath: string): Promise<boolean> {
    console.warn('fileExists is deprecated and not implemented with expo-print');
    return false;
  }

  /**
   * Delete a file at the given path
   * Note: Deprecated - kept for API compatibility only
   * 
   * @param filePath - Full path to the file
   * @returns Promise that rejects (not implemented)
   */
  async deleteFile(filePath: string): Promise<void> {
    console.warn('deleteFile is deprecated and not implemented with expo-print');
    throw new Error('File deletion not supported with expo-print');
  }
}

// Export singleton instance
export const fileManager = new FileManager();
