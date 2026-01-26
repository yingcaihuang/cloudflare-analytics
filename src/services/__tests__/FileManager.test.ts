/**
 * Unit tests for FileManager
 */

import { FileManager } from '../FileManager';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  getFreeDiskStorageAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

// Mock react-native Share
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
  Share: {
    share: jest.fn(),
    sharedAction: 'sharedAction',
    dismissedAction: 'dismissedAction',
  },
}));

describe('FileManager', () => {
  let fileManager: FileManager;

  beforeEach(() => {
    fileManager = new FileManager();
    jest.clearAllMocks();
  });

  describe('generateFileName', () => {
    it('should generate filename with zone name and timestamp', () => {
      const zoneName = 'example.com';
      const timestamp = new Date('2024-01-15T10:30:00.000Z');
      const fileName = fileManager.generateFileName(zoneName, timestamp);
      
      expect(fileName).toMatch(/^cloudflare-analytics-example\.com-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.pdf$/);
      expect(fileName).toContain('example.com');
      expect(fileName).toContain('2024-01-15');
    });

    it('should use current timestamp when not provided', () => {
      const zoneName = 'example.com';
      const fileName = fileManager.generateFileName(zoneName);
      
      expect(fileName).toMatch(/^cloudflare-analytics-example\.com-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.pdf$/);
    });

    it('should sanitize zone name in filename', () => {
      const zoneName = 'example.com/test:path';
      const timestamp = new Date('2024-01-15T10:30:00.000Z');
      const fileName = fileManager.generateFileName(zoneName, timestamp);
      
      expect(fileName).not.toContain('/');
      expect(fileName).not.toContain(':');
      expect(fileName).toContain('example.comtestpath');
    });
  });

  describe('sanitizeFileName', () => {
    it('should remove forward slashes', () => {
      expect(fileManager.sanitizeFileName('test/file')).toBe('testfile');
    });

    it('should remove backslashes', () => {
      expect(fileManager.sanitizeFileName('test\\file')).toBe('testfile');
    });

    it('should remove colons', () => {
      expect(fileManager.sanitizeFileName('test:file')).toBe('testfile');
    });

    it('should remove asterisks', () => {
      expect(fileManager.sanitizeFileName('test*file')).toBe('testfile');
    });

    it('should remove question marks', () => {
      expect(fileManager.sanitizeFileName('test?file')).toBe('testfile');
    });

    it('should remove quotes', () => {
      expect(fileManager.sanitizeFileName('test"file')).toBe('testfile');
    });

    it('should remove angle brackets', () => {
      expect(fileManager.sanitizeFileName('test<file>')).toBe('testfile');
    });

    it('should remove pipes', () => {
      expect(fileManager.sanitizeFileName('test|file')).toBe('testfile');
    });

    it('should remove multiple invalid characters', () => {
      expect(fileManager.sanitizeFileName('test/file:name*with?invalid"chars')).toBe('testfilenamewithinvalidchars');
    });

    it('should preserve valid characters', () => {
      expect(fileManager.sanitizeFileName('test-file_name.pdf')).toBe('test-file_name.pdf');
    });
  });

  describe('getSavePath', () => {
    it('should return document directory by default', () => {
      const path = fileManager.getSavePath();
      expect(path).toBe('/mock/documents/');
    });

    it('should return document directory when Documents is specified', () => {
      const path = fileManager.getSavePath('Documents');
      expect(path).toBe('/mock/documents/');
    });

    it('should return appropriate directory when Downloads is specified', () => {
      const path = fileManager.getSavePath('Downloads');
      expect(path).toBe('/mock/documents/');
    });
  });

  describe('checkStorageSpace', () => {
    it('should return true when sufficient space is available', async () => {
      (FileSystem.getFreeDiskStorageAsync as jest.Mock).mockResolvedValue(1000000000); // 1GB
      
      const hasSpace = await fileManager.checkStorageSpace(5000000); // 5MB
      expect(hasSpace).toBe(true);
    });

    it('should return false when insufficient space is available', async () => {
      (FileSystem.getFreeDiskStorageAsync as jest.Mock).mockResolvedValue(1000000); // 1MB
      
      const hasSpace = await fileManager.checkStorageSpace(5000000); // 5MB
      expect(hasSpace).toBe(false);
    });

    it('should return true when storage check fails', async () => {
      (FileSystem.getFreeDiskStorageAsync as jest.Mock).mockRejectedValue(new Error('Storage check failed'));
      
      const hasSpace = await fileManager.checkStorageSpace(5000000);
      expect(hasSpace).toBe(true); // Assumes space is available on error
    });
  });

  describe('getFullPath', () => {
    it('should combine base path and filename', () => {
      const fileName = 'test.pdf';
      const fullPath = fileManager.getFullPath(fileName);
      
      expect(fullPath).toBe('/mock/documents/test.pdf');
    });

    it('should use specified directory', () => {
      const fileName = 'test.pdf';
      const fullPath = fileManager.getFullPath(fileName, 'Downloads');
      
      expect(fullPath).toBe('/mock/documents/test.pdf');
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      
      const exists = await fileManager.fileExists('/mock/test.pdf');
      expect(exists).toBe(true);
    });

    it('should return false when file does not exist', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
      
      const exists = await fileManager.fileExists('/mock/test.pdf');
      expect(exists).toBe(false);
    });

    it('should return false when check fails', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockRejectedValue(new Error('Check failed'));
      
      const exists = await fileManager.fileExists('/mock/test.pdf');
      expect(exists).toBe(false);
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);
      
      await expect(fileManager.deleteFile('/mock/test.pdf')).resolves.toBeUndefined();
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith('/mock/test.pdf', { idempotent: true });
    });

    it('should throw error when deletion fails', async () => {
      (FileSystem.deleteAsync as jest.Mock).mockRejectedValue(new Error('Delete failed'));
      
      await expect(fileManager.deleteFile('/mock/test.pdf')).rejects.toThrow('Failed to delete file');
    });
  });
});
