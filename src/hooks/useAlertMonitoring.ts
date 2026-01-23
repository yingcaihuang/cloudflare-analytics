/**
 * useAlertMonitoring Hook
 * Hook for monitoring metrics and triggering alerts
 */

import { useState, useEffect, useCallback } from 'react';
import AlertMonitor, { Alert } from '../services/AlertMonitor';
import { StatusCodeData } from '../types/metrics';

interface UseAlertMonitoringResult {
  currentAlert: Alert | null;
  dismissAlert: () => void;
  checkMetrics: (metrics: StatusCodeData) => Promise<void>;
  isMonitoring: boolean;
}

export function useAlertMonitoring(): UseAlertMonitoringResult {
  const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // Initialize AlertMonitor on mount
    const initializeMonitor = async () => {
      try {
        await AlertMonitor.initialize();
      } catch (error) {
        console.error('Error initializing AlertMonitor:', error);
      }
    };

    initializeMonitor();
  }, []);

  const checkMetrics = useCallback(async (metrics: StatusCodeData) => {
    try {
      setIsMonitoring(true);
      const triggeredAlerts = await AlertMonitor.checkMetrics(metrics);
      
      // Show the first triggered alert (if any)
      if (triggeredAlerts.length > 0) {
        setCurrentAlert(triggeredAlerts[0]);
      }
    } catch (error) {
      console.error('Error checking metrics:', error);
    } finally {
      setIsMonitoring(false);
    }
  }, []);

  const dismissAlert = useCallback(() => {
    setCurrentAlert(null);
  }, []);

  return {
    currentAlert,
    dismissAlert,
    checkMetrics,
    isMonitoring,
  };
}
