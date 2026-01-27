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
    it('should return empty string (expo-print handles paths)', () => {
      const path = fileManager.getSavePath();
      expect(path).toBe('');
    });

    it('should return empty string when Documents is specified', () => {
      const path = fileManager.getSavePath('Documents');
      expect(path).toBe('');
    });

    it('should return empty string when Downloads is specified', () => {
      const path = fileManager.getSavePath('Downloads');
      expect(path).toBe('');
    });
  });

  describe('checkStorageSpace', () => {
    it('should always return true (storage check skipped in expo-print)', async () => {
      const hasSpace = await fileManager.checkStorageSpace(5000000); // 5MB
      expect(hasSpace).toBe(true);
    });

    it('should return true for large files', async () => {
      const hasSpace = await fileManager.checkStorageSpace(50000000); // 50MB
      expect(hasSpace).toBe(true);
    });
  });

  describe('getFullPath', () => {
    it('should return just the filename (expo-print handles paths)', () => {
      const fileName = 'test.pdf';
      const fullPath = fileManager.getFullPath(fileName);
      
      expect(fullPath).toBe('test.pdf');
    });

    it('should return filename regardless of directory specified', () => {
      const fileName = 'test.pdf';
      const fullPath = fileManager.getFullPath(fileName, 'Downloads');
      
      expect(fullPath).toBe('test.pdf');
    });
  });

  describe('fileExists', () => {
    it('should return false (deprecated method)', async () => {
      const exists = await fileManager.fileExists('/mock/test.pdf');
      expect(exists).toBe(false);
    });

    it('should return false for any path', async () => {
      const exists = await fileManager.fileExists('/any/path/test.pdf');
      expect(exists).toBe(false);
    });
  });

  describe('deleteFile', () => {
    it('should throw error (deprecated method)', async () => {
      await expect(fileManager.deleteFile('/mock/test.pdf')).rejects.toThrow('File deletion not supported with expo-print');
    });

    it('should throw error for any path', async () => {
      await expect(fileManager.deleteFile('/any/path/test.pdf')).rejects.toThrow('File deletion not supported with expo-print');
    });
  });
});
