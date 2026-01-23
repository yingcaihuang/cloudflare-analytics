/**
 * AlertMonitor Service
 * Monitors metrics and triggers alerts based on configured rules
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AlertRule {
  id?: string;
  name: string;
  metric: string; // e.g., 'status5xx'
  condition: 'increase' | 'decrease' | 'threshold';
  value: number; // threshold or percentage
  timeWindow: number; // minutes
  enabled: boolean;
}

export interface Alert {
  id: string;
  ruleId: string;
  triggeredAt: Date;
  message: string;
  severity: 'low' | 'medium' | 'high';
  acknowledged: boolean;
}

interface MetricSnapshot {
  timestamp: Date;
  value: number;
}

const STORAGE_KEY_RULES = '@cloudflare_analytics:alert_rules';
const STORAGE_KEY_HISTORY = '@cloudflare_analytics:alert_history';
const STORAGE_KEY_SNAPSHOTS = '@cloudflare_analytics:metric_snapshots';

class AlertMonitor {
  private rules: Map<string, AlertRule> = new Map();
  private metricSnapshots: Map<string, MetricSnapshot[]> = new Map();

  /**
   * Initialize the AlertMonitor by loading saved rules
   */
  async initialize(): Promise<void> {
    await this.loadRules();
    await this.loadSnapshots();
  }

  /**
   * Register a new alert rule
   * @param rule - The alert rule to register
   * @returns The ID of the registered rule
   */
  async registerAlert(rule: AlertRule): Promise<string> {
    const ruleId = rule.id || this.generateRuleId();
    const ruleWithId = { ...rule, id: ruleId };
    
    this.rules.set(ruleId, ruleWithId);
    await this.saveRules();
    
    return ruleId;
  }

  /**
   * Update an existing alert rule
   * @param ruleId - The ID of the rule to update
   * @param rule - Partial rule data to update
   */
  async updateAlertRule(ruleId: string, rule: Partial<AlertRule>): Promise<void> {
    const existingRule = this.rules.get(ruleId);
    if (!existingRule) {
      throw new Error(`Alert rule with ID ${ruleId} not found`);
    }

    const updatedRule = { ...existingRule, ...rule, id: ruleId };
    this.rules.set(ruleId, updatedRule);
    await this.saveRules();
  }

  /**
   * Delete an alert rule
   * @param ruleId - The ID of the rule to delete
   */
  async deleteAlertRule(ruleId: string): Promise<void> {
    if (!this.rules.has(ruleId)) {
      throw new Error(`Alert rule with ID ${ruleId} not found`);
    }

    this.rules.delete(ruleId);
    await this.saveRules();
  }

  /**
   * Get all registered alert rules
   * @returns Array of all alert rules
   */
  getAllRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get a specific alert rule by ID
   * @param ruleId - The ID of the rule to retrieve
   * @returns The alert rule or undefined if not found
   */
  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Check metrics against all enabled rules and trigger alerts
   * @param metrics - The metrics data to check
   * @returns Array of triggered alerts
   */
  async checkMetrics(metrics: any): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];
    const enabledRules = Array.from(this.rules.values()).filter(rule => rule.enabled);

    for (const rule of enabledRules) {
      const alert = await this.evaluateRule(rule, metrics);
      if (alert) {
        triggeredAlerts.push(alert);
        await this.saveAlert(alert);
      }
    }

    // Update metric snapshots for future comparisons
    await this.updateMetricSnapshots(metrics);

    return triggeredAlerts;
  }

  /**
   * Calculate 5xx error change rate
   * @param currentValue - Current 5xx error count
   * @param previousValue - Previous 5xx error count
   * @returns The percentage change rate
   */
  calculate5xxChangeRate(currentValue: number, previousValue: number): number {
    if (previousValue === 0) {
      return currentValue > 0 ? 100 : 0;
    }
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  /**
   * Get alert history
   * @param limit - Maximum number of alerts to retrieve
   * @returns Array of historical alerts
   */
  async getAlertHistory(limit?: number): Promise<Alert[]> {
    try {
      const historyJson = await AsyncStorage.getItem(STORAGE_KEY_HISTORY);
      if (!historyJson) {
        return [];
      }

      const history: Alert[] = JSON.parse(historyJson);
      
      // Convert date strings back to Date objects
      const parsedHistory = history.map(alert => ({
        ...alert,
        triggeredAt: new Date(alert.triggeredAt),
      }));

      // Sort by triggered date (most recent first)
      parsedHistory.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());

      return limit ? parsedHistory.slice(0, limit) : parsedHistory;
    } catch (error) {
      console.error('Error loading alert history:', error);
      return [];
    }
  }

  /**
   * Acknowledge an alert
   * @param alertId - The ID of the alert to acknowledge
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    const history = await this.getAlertHistory();
    const alert = history.find(a => a.id === alertId);
    
    if (alert) {
      alert.acknowledged = true;
      await AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    }
  }

  /**
   * Clear all alert history
   */
  async clearAlertHistory(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY_HISTORY);
  }

  /**
   * Evaluate a single rule against metrics
   * @param rule - The rule to evaluate
   * @param metrics - The metrics data
   * @returns An alert if the rule is triggered, null otherwise
   */
  private async evaluateRule(rule: AlertRule, metrics: any): Promise<Alert | null> {
    const currentValue = this.extractMetricValue(rule.metric, metrics);
    
    if (currentValue === null) {
      return null;
    }

    let triggered = false;
    let message = '';

    switch (rule.condition) {
      case 'threshold':
        triggered = currentValue >= rule.value;
        if (triggered) {
          message = `${rule.name}: ${rule.metric} 达到阈值 ${rule.value} (当前值: ${currentValue})`;
        }
        break;

      case 'increase':
        const previousValue = await this.getPreviousMetricValue(rule.metric, rule.timeWindow);
        if (previousValue !== null) {
          const changeRate = this.calculate5xxChangeRate(currentValue, previousValue);
          triggered = changeRate >= rule.value;
          if (triggered) {
            message = `${rule.name}: ${rule.metric} 在 ${rule.timeWindow} 分钟内增长 ${changeRate.toFixed(1)}% (阈值: ${rule.value}%)`;
          }
        }
        break;

      case 'decrease':
        const prevValue = await this.getPreviousMetricValue(rule.metric, rule.timeWindow);
        if (prevValue !== null) {
          const changeRate = this.calculate5xxChangeRate(currentValue, prevValue);
          triggered = changeRate <= -rule.value;
          if (triggered) {
            message = `${rule.name}: ${rule.metric} 在 ${rule.timeWindow} 分钟内下降 ${Math.abs(changeRate).toFixed(1)}% (阈值: ${rule.value}%)`;
          }
        }
        break;
    }

    if (triggered) {
      return {
        id: this.generateAlertId(),
        ruleId: rule.id!,
        triggeredAt: new Date(),
        message,
        severity: this.determineSeverity(rule, currentValue),
        acknowledged: false,
      };
    }

    return null;
  }

  /**
   * Extract metric value from metrics data
   * @param metricName - The name of the metric to extract
   * @param metrics - The metrics data object
   * @returns The metric value or null if not found
   */
  private extractMetricValue(metricName: string, metrics: any): number | null {
    // Handle status code metrics
    if (metricName === 'status5xx' && metrics.status5xx !== undefined) {
      return metrics.status5xx;
    }
    if (metricName === 'status4xx' && metrics.status4xx !== undefined) {
      return metrics.status4xx;
    }
    if (metricName === 'status2xx' && metrics.status2xx !== undefined) {
      return metrics.status2xx;
    }
    if (metricName === 'status3xx' && metrics.status3xx !== undefined) {
      return metrics.status3xx;
    }

    // Handle nested properties
    const parts = metricName.split('.');
    let value: any = metrics;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return null;
      }
    }

    return typeof value === 'number' ? value : null;
  }

  /**
   * Get previous metric value from snapshots
   * @param metricName - The name of the metric
   * @param timeWindowMinutes - Time window in minutes
   * @returns The previous metric value or null if not found
   */
  private async getPreviousMetricValue(
    metricName: string,
    timeWindowMinutes: number
  ): Promise<number | null> {
    const snapshots = this.metricSnapshots.get(metricName);
    if (!snapshots || snapshots.length === 0) {
      return null;
    }

    const now = new Date();
    const targetTime = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);

    // Find the snapshot closest to the target time
    let closestSnapshot: MetricSnapshot | null = null;
    let minTimeDiff = Infinity;

    for (const snapshot of snapshots) {
      const timeDiff = Math.abs(snapshot.timestamp.getTime() - targetTime.getTime());
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestSnapshot = snapshot;
      }
    }

    return closestSnapshot ? closestSnapshot.value : null;
  }

  /**
   * Update metric snapshots for future comparisons
   * @param metrics - The current metrics data
   */
  private async updateMetricSnapshots(metrics: any): Promise<void> {
    const now = new Date();
    const metricsToTrack = ['status5xx', 'status4xx', 'status2xx', 'status3xx'];

    for (const metricName of metricsToTrack) {
      const value = this.extractMetricValue(metricName, metrics);
      if (value !== null) {
        let snapshots = this.metricSnapshots.get(metricName) || [];
        
        // Add new snapshot
        snapshots.push({ timestamp: now, value });

        // Keep only snapshots from the last 24 hours
        const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        snapshots = snapshots.filter(s => s.timestamp >= cutoffTime);

        this.metricSnapshots.set(metricName, snapshots);
      }
    }

    await this.saveSnapshots();
  }

  /**
   * Determine alert severity based on rule and value
   * @param rule - The alert rule
   * @param value - The current metric value
   * @returns The severity level
   */
  private determineSeverity(rule: AlertRule, value: number): 'low' | 'medium' | 'high' {
    // For 5xx errors, higher values are more severe
    if (rule.metric === 'status5xx') {
      if (rule.condition === 'increase') {
        const changeRate = rule.value;
        if (changeRate >= 100) return 'high';
        if (changeRate >= 50) return 'medium';
        return 'low';
      }
      if (rule.condition === 'threshold') {
        if (value >= 1000) return 'high';
        if (value >= 100) return 'medium';
        return 'low';
      }
    }

    return 'medium';
  }

  /**
   * Save an alert to history
   * @param alert - The alert to save
   */
  private async saveAlert(alert: Alert): Promise<void> {
    try {
      const history = await this.getAlertHistory();
      history.unshift(alert);

      // Keep only the last 100 alerts
      const trimmedHistory = history.slice(0, 100);

      await AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error saving alert:', error);
    }
  }

  /**
   * Load rules from storage
   */
  private async loadRules(): Promise<void> {
    try {
      const rulesJson = await AsyncStorage.getItem(STORAGE_KEY_RULES);
      if (rulesJson) {
        const rules: AlertRule[] = JSON.parse(rulesJson);
        this.rules.clear();
        rules.forEach(rule => {
          if (rule.id) {
            this.rules.set(rule.id, rule);
          }
        });
      }
    } catch (error) {
      console.error('Error loading alert rules:', error);
    }
  }

  /**
   * Save rules to storage
   */
  private async saveRules(): Promise<void> {
    try {
      const rules = Array.from(this.rules.values());
      await AsyncStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(rules));
    } catch (error) {
      console.error('Error saving alert rules:', error);
    }
  }

  /**
   * Load metric snapshots from storage
   */
  private async loadSnapshots(): Promise<void> {
    try {
      const snapshotsJson = await AsyncStorage.getItem(STORAGE_KEY_SNAPSHOTS);
      if (snapshotsJson) {
        const snapshotsData: Record<string, MetricSnapshot[]> = JSON.parse(snapshotsJson);
        this.metricSnapshots.clear();
        
        for (const [metricName, snapshots] of Object.entries(snapshotsData)) {
          const parsedSnapshots = snapshots.map(s => ({
            ...s,
            timestamp: new Date(s.timestamp),
          }));
          this.metricSnapshots.set(metricName, parsedSnapshots);
        }
      }
    } catch (error) {
      console.error('Error loading metric snapshots:', error);
    }
  }

  /**
   * Save metric snapshots to storage
   */
  private async saveSnapshots(): Promise<void> {
    try {
      const snapshotsData: Record<string, MetricSnapshot[]> = {};
      
      for (const [metricName, snapshots] of this.metricSnapshots.entries()) {
        snapshotsData[metricName] = snapshots;
      }

      await AsyncStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(snapshotsData));
    } catch (error) {
      console.error('Error saving metric snapshots:', error);
    }
  }

  /**
   * Generate a unique rule ID
   */
  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export default new AlertMonitor();
