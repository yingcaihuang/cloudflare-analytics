/**
 * Authentication Type Definitions
 */

import { Zone } from './common';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  zones?: Zone[];
}

export interface Account {
  id: string;
  label: string;
  tokenHash: string;
  createdAt: Date;
}
