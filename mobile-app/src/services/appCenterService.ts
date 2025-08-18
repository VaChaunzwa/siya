import Analytics from 'appcenter-analytics';
import Crashes from 'appcenter-crashes';

class AppCenterService {
  /**
   * Track a custom event with optional properties
   */
  static trackEvent(eventName: string, properties?: { [key: string]: string }) {
    try {
      Analytics.trackEvent(eventName, properties);
    } catch (error) {
      console.warn('Failed to track event:', error);
    }
  }

  /**
   * Track user login
   */
  static trackLogin(method: string, userId?: string) {
    this.trackEvent('User Login', {
      method,
      userId: userId || 'unknown'
    });
  }

  /**
   * Track user logout
   */
  static trackLogout(userId?: string) {
    this.trackEvent('User Logout', {
      userId: userId || 'unknown'
    });
  }

  /**
   * Track screen view
   */
  static trackScreenView(screenName: string) {
    this.trackEvent('Screen View', {
      screenName
    });
  }

  /**
   * Track delivery actions
   */
  static trackDeliveryAction(action: string, deliveryId?: string) {
    this.trackEvent('Delivery Action', {
      action,
      deliveryId: deliveryId || 'unknown'
    });
  }

  /**
   * Track app errors (non-fatal)
   */
  static trackError(error: Error, context?: string) {
    this.trackEvent('App Error', {
      error: error.message,
      context: context || 'unknown',
      stack: error.stack || 'no stack trace'
    });
  }

  /**
   * Check if app crashed in last session
   */
  static async checkLastSessionCrash(): Promise<boolean> {
    try {
      return await Crashes.hasCrashedInLastSession();
    } catch (error) {
      console.warn('Failed to check last session crash:', error);
      return false;
    }
  }

  /**
   * Get crash report from last session
   */
  static async getLastSessionCrashReport() {
    try {
      return await Crashes.lastSessionCrashReport();
    } catch (error) {
      console.warn('Failed to get last session crash report:', error);
      return null;
    }
  }

  /**
   * Enable or disable analytics
   */
  static async setAnalyticsEnabled(enabled: boolean) {
    try {
      await Analytics.setEnabled(enabled);
    } catch (error) {
      console.warn('Failed to set analytics enabled state:', error);
    }
  }

  /**
   * Check if analytics is enabled
   */
  static async isAnalyticsEnabled(): Promise<boolean> {
    try {
      return await Analytics.isEnabled();
    } catch (error) {
      console.warn('Failed to check analytics enabled state:', error);
      return false;
    }
  }

  /**
   * Enable or disable crash reporting
   */
  static async setCrashReportingEnabled(enabled: boolean) {
    try {
      await Crashes.setEnabled(enabled);
    } catch (error) {
      console.warn('Failed to set crash reporting enabled state:', error);
    }
  }

  /**
   * Check if crash reporting is enabled
   */
  static async isCrashReportingEnabled(): Promise<boolean> {
    try {
      return await Crashes.isEnabled();
    } catch (error) {
      console.warn('Failed to check crash reporting enabled state:', error);
      return false;
    }
  }
}

export default AppCenterService;