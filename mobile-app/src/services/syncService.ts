import deliveryService from './deliveryService';
import offlineStorageService from './offlineStorageService';
import networkService from './networkService';
import { Alert } from 'react-native';

interface SyncResult {
  success: boolean;
  syncedOperations: number;
  failedOperations: number;
  errors: string[];
}

class SyncService {
  private isSyncing: boolean = false;
  private syncListeners: ((result: SyncResult) => void)[] = [];
  private maxRetries: number = 3;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Listen for network state changes
    networkService.addNetworkListener((isConnected) => {
      if (isConnected && !this.isSyncing) {
        // Delay sync to allow network to stabilize
        setTimeout(() => {
          this.syncPendingOperations();
        }, 2000);
      }
    });

    // Set up periodic sync when online (every 5 minutes)
    this.startPeriodicSync();
  }

  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (networkService.getConnectionStatus() && !this.isSyncing) {
        await this.syncPendingOperations();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Main sync method
  async syncPendingOperations(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return {
        success: false,
        syncedOperations: 0,
        failedOperations: 0,
        errors: ['Sync already in progress']
      };
    }

    if (!networkService.getConnectionStatus()) {
      console.log('No network connection for sync');
      return {
        success: false,
        syncedOperations: 0,
        failedOperations: 0,
        errors: ['No network connection']
      };
    }

    this.isSyncing = true;
    console.log('Starting sync of pending operations');

    const result: SyncResult = {
      success: true,
      syncedOperations: 0,
      failedOperations: 0,
      errors: []
    };

    try {
      const pendingOperations = await offlineStorageService.getPendingOperations();
      console.log(`Found ${pendingOperations.length} pending operations`);

      for (const operation of pendingOperations) {
        try {
          await this.syncOperation(operation);
          await offlineStorageService.removePendingOperation(operation.id);
          result.syncedOperations++;
          console.log(`Synced operation: ${operation.type} for delivery ${operation.deliveryId}`);
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
          
          if (operation.retryCount < this.maxRetries) {
            await offlineStorageService.updateOperationRetryCount(operation.id);
            result.errors.push(`Retry ${operation.retryCount + 1}/${this.maxRetries} for ${operation.type}`);
          } else {
            await offlineStorageService.removePendingOperation(operation.id);
            result.failedOperations++;
            result.errors.push(`Max retries exceeded for ${operation.type}`);
          }
        }
      }

      // Refresh cached data after sync
      await this.refreshCachedData();

      if (result.failedOperations > 0) {
        result.success = false;
      }

    } catch (error) {
      console.error('Sync process failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    } finally {
      this.isSyncing = false;
      this.notifySyncComplete(result);
    }

    return result;
  }

  private async syncOperation(operation: any): Promise<void> {
    switch (operation.type) {
      case 'COMPLETE_STOP':
        await deliveryService.completeStop(
          operation.deliveryId,
          operation.stopId,
          operation.data
        );
        break;

      case 'UPDATE_STOP':
        await deliveryService.updateStopStatus(
          operation.deliveryId,
          operation.stopId,
          operation.data.status,
          operation.data.notes
        );
        break;

      case 'UPDATE_DELIVERY':
        // Handle delivery updates if needed
        console.log('UPDATE_DELIVERY sync not implemented yet');
        break;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private async refreshCachedData(): Promise<void> {
    try {
      // Get fresh data from server and update cache
      const deliveries = await deliveryService.getDriverDeliveries();
      await offlineStorageService.cacheDeliveries(deliveries);
      console.log('Cached data refreshed after sync');
    } catch (error) {
      console.error('Failed to refresh cached data:', error);
    }
  }

  private notifySyncComplete(result: SyncResult): void {
    this.syncListeners.forEach(listener => listener(result));

    // Show user notification for significant sync results
    if (result.syncedOperations > 0 || result.failedOperations > 0) {
      const message = result.success
        ? `Sync completed: ${result.syncedOperations} operations synced`
        : `Sync completed with errors: ${result.syncedOperations} synced, ${result.failedOperations} failed`;
      
      Alert.alert('Sync Complete', message, [{ text: 'OK' }]);
    }
  }

  // Force sync (manual trigger)
  async forcSync(): Promise<SyncResult> {
    console.log('Force sync triggered');
    return await this.syncPendingOperations();
  }

  // Check if sync is needed
  async isSyncNeeded(): Promise<boolean> {
    const pendingOps = await offlineStorageService.getPendingOperations();
    return pendingOps.length > 0;
  }

  // Get sync status
  getSyncStatus(): {
    isSyncing: boolean;
    isOnline: boolean;
  } {
    return {
      isSyncing: this.isSyncing,
      isOnline: networkService.getConnectionStatus()
    };
  }

  // Add sync listener
  addSyncListener(listener: (result: SyncResult) => void): () => void {
    this.syncListeners.push(listener);
    
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  // Get pending operations count
  async getPendingOperationsCount(): Promise<number> {
    const operations = await offlineStorageService.getPendingOperations();
    return operations.length;
  }

  // Clear all pending operations (use with caution)
  async clearPendingOperations(): Promise<void> {
    const operations = await offlineStorageService.getPendingOperations();
    for (const op of operations) {
      await offlineStorageService.removePendingOperation(op.id);
    }
    console.log('All pending operations cleared');
  }

  // Get last sync info
  async getLastSyncInfo(): Promise<{
    lastSync: Date | null;
    pendingCount: number;
    cacheInfo: any;
  }> {
    const cacheInfo = await offlineStorageService.getCacheInfo();
    return {
      lastSync: cacheInfo.lastSync,
      pendingCount: cacheInfo.pendingOpsCount,
      cacheInfo
    };
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.syncListeners = [];
  }
}

export default new SyncService();