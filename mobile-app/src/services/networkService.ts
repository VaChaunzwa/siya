import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import offlineStorageService from './offlineStorageService';

type NetworkStateListener = (isConnected: boolean) => void;

class NetworkService {
  private isConnected: boolean = true;
  private listeners: NetworkStateListener[] = [];
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Get initial network state
      const state = await NetInfo.fetch();
      this.isConnected = state.isConnected ?? false;
      await offlineStorageService.setOfflineMode(!this.isConnected);

      // Listen for network state changes
      this.unsubscribe = NetInfo.addEventListener(this.handleNetworkStateChange.bind(this));
    } catch (error) {
      console.error('Error initializing network service:', error);
    }
  }

  private async handleNetworkStateChange(state: NetInfoState): Promise<void> {
    const wasConnected = this.isConnected;
    this.isConnected = state.isConnected ?? false;
    
    // Update offline mode in storage
    await offlineStorageService.setOfflineMode(!this.isConnected);

    // Notify listeners
    this.listeners.forEach(listener => listener(this.isConnected));

    // Handle connection state changes
    if (!wasConnected && this.isConnected) {
      this.handleConnectionRestored();
    } else if (wasConnected && !this.isConnected) {
      this.handleConnectionLost();
    }
  }

  private handleConnectionRestored(): void {
    console.log('Network connection restored');
    // Show user notification
    Alert.alert(
      'Connection Restored',
      'Your internet connection has been restored. Syncing data...',
      [{ text: 'OK' }]
    );
    
    // Trigger sync (will be handled by sync service)
    this.notifyConnectionRestored();
  }

  private handleConnectionLost(): void {
    console.log('Network connection lost');
    // Show user notification
    Alert.alert(
      'Connection Lost',
      'You are now offline. Changes will be saved locally and synced when connection is restored.',
      [{ text: 'OK' }]
    );
  }

  private notifyConnectionRestored(): void {
    // This will be used by sync service to trigger synchronization
    // For now, just log it
    console.log('Notifying connection restored for sync');
  }

  // Public methods
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      this.isConnected = state.isConnected ?? false;
      return this.isConnected;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  }

  addNetworkListener(listener: NetworkStateListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  removeNetworkListener(listener: NetworkStateListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Test network connectivity with actual request
  async testConnectivity(url: string = 'https://www.google.com', timeout: number = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('Connectivity test failed:', error);
      return false;
    }
  }

  // Get detailed network info
  async getNetworkInfo(): Promise<{
    isConnected: boolean;
    type: string;
    isInternetReachable: boolean | null;
    details: any;
  }> {
    try {
      const state = await NetInfo.fetch();
      return {
        isConnected: state.isConnected ?? false,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
        details: state.details
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return {
        isConnected: false,
        type: 'unknown',
        isInternetReachable: null,
        details: null
      };
    }
  }

  // Cleanup
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners = [];
  }
}

export default new NetworkService();