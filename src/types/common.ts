/**
 * Common Type Definitions
 */

export interface Zone {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'inactive';
  plan: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * TimeRange class with validation and formatting methods
 * Used for PDF export time range validation
 */
export class TimeRangeModel {
  constructor(
    public readonly startDate: Date,
    public readonly endDate: Date
  ) {}

  /**
   * Validates the time range
   * Returns true if:
   * - Start date is not in the future
   * - End date is not in the future
   * - End date is not before start date
   */
  isValid(): boolean {
    const now = new Date();
    
    // Check if start date is in the future
    if (this.startDate > now) {
      return false;
    }
    
    // Check if end date is in the future
    if (this.endDate > now) {
      return false;
    }
    
    // Check if end date is before start date
    if (this.endDate < this.startDate) {
      return false;
    }
    
    return true;
  }

  /**
   * Calculates the duration in days between start and end dates
   * Returns the number of days (can be fractional)
   */
  getDurationDays(): number {
    const milliseconds = this.endDate.getTime() - this.startDate.getTime();
    const days = milliseconds / (1000 * 60 * 60 * 24);
    return days;
  }

  /**
   * Formats the time range for display
   * Returns a string like "Jan 1, 2024 - Jan 31, 2024"
   */
  format(): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    
    const startFormatted = this.startDate.toLocaleDateString('en-US', options);
    const endFormatted = this.endDate.toLocaleDateString('en-US', options);
    
    return `${startFormatted} - ${endFormatted}`;
  }
}

export interface MetricsQueryParams {
  zoneId: string;
  accountTag?: string; // Account ID for account-level queries
  startDate: Date;
  endDate: Date;
  granularity?: 'hour' | 'day';
}

export interface CachedData<T> {
  data: T;
  timestamp: Date;
  isStale: boolean;
}
