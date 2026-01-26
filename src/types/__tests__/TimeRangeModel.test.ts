/**
 * Unit tests for TimeRangeModel
 */

import { TimeRangeModel } from '../common';

describe('TimeRangeModel', () => {
  describe('isValid', () => {
    it('should return true for valid past date range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const timeRange = new TimeRangeModel(startDate, endDate);
      
      expect(timeRange.isValid()).toBe(true);
    });

    it('should return false when start date is in the future', () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      const endDate = new Date(Date.now() + 172800000); // Day after tomorrow
      const timeRange = new TimeRangeModel(futureDate, endDate);
      
      expect(timeRange.isValid()).toBe(false);
    });

    it('should return false when end date is in the future', () => {
      const startDate = new Date('2024-01-01');
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      const timeRange = new TimeRangeModel(startDate, futureDate);
      
      expect(timeRange.isValid()).toBe(false);
    });

    it('should return false when end date is before start date', () => {
      const startDate = new Date('2024-01-31');
      const endDate = new Date('2024-01-01');
      const timeRange = new TimeRangeModel(startDate, endDate);
      
      expect(timeRange.isValid()).toBe(false);
    });

    it('should return true when start and end dates are the same', () => {
      const date = new Date('2024-01-01');
      const timeRange = new TimeRangeModel(date, date);
      
      expect(timeRange.isValid()).toBe(true);
    });
  });

  describe('getDurationDays', () => {
    it('should calculate duration for a one-day range', () => {
      const startDate = new Date('2024-01-01T00:00:00');
      const endDate = new Date('2024-01-02T00:00:00');
      const timeRange = new TimeRangeModel(startDate, endDate);
      
      expect(timeRange.getDurationDays()).toBe(1);
    });

    it('should calculate duration for a 30-day range', () => {
      const startDate = new Date('2024-01-01T00:00:00');
      const endDate = new Date('2024-01-31T00:00:00');
      const timeRange = new TimeRangeModel(startDate, endDate);
      
      expect(timeRange.getDurationDays()).toBe(30);
    });

    it('should return 0 for same start and end date', () => {
      const date = new Date('2024-01-01T00:00:00');
      const timeRange = new TimeRangeModel(date, date);
      
      expect(timeRange.getDurationDays()).toBe(0);
    });

    it('should handle fractional days', () => {
      const startDate = new Date('2024-01-01T00:00:00');
      const endDate = new Date('2024-01-01T12:00:00');
      const timeRange = new TimeRangeModel(startDate, endDate);
      
      expect(timeRange.getDurationDays()).toBe(0.5);
    });
  });

  describe('format', () => {
    it('should format date range correctly', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const timeRange = new TimeRangeModel(startDate, endDate);
      
      const formatted = timeRange.format();
      expect(formatted).toMatch(/Jan 1, 2024 - Jan 31, 2024/);
    });

    it('should format same date range', () => {
      const date = new Date('2024-06-15');
      const timeRange = new TimeRangeModel(date, date);
      
      const formatted = timeRange.format();
      expect(formatted).toMatch(/Jun 15, 2024 - Jun 15, 2024/);
    });

    it('should format cross-year date range', () => {
      const startDate = new Date('2023-12-15');
      const endDate = new Date('2024-01-15');
      const timeRange = new TimeRangeModel(startDate, endDate);
      
      const formatted = timeRange.format();
      expect(formatted).toMatch(/Dec 15, 2023 - Jan 15, 2024/);
    });
  });
});
