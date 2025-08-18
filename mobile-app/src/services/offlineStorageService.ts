import AsyncStorage from '@react-native-async-storage/async-storage';
import { Delivery, DeliveryStop } from './deliveryService';

interface OfflineOperation {
  id: string;
  type: 'UPDATE_STOP' | 'COMPLETE_STOP' | 'UPDATE_DELIVERY';
  data: any;
  timestamp: number;
  deliveryId: string;
  stopId?: string;
  retryCount: number;
}

interface CachedData {
  deliveries: Delivery[];
  lastSync: number;
  pendingOperations: OfflineOperation[];
}

class OfflineStorageService {
  private readonly STORAGE_KEYS = {
    CACHED_DELIVERIES: 'cached_deliveries',
    PENDING_OPERATIONS: 'pending_operations',
    LAST_SYNC: 'last_sync',
    OFFLINE_MODE: 'offline_mode'
  };

  // Cache deliveries for offline access
  async cacheDeliveries(deliveries: Delivery[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.CACHED_DELIVERIES,
        JSON.stringify(deliveries)
      );
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.LAST_SYNC,
        Date.now().toString()
      );
    } catch (error) {
      console.error('Error caching deliveries:', error);
      throw error;
    }
  }

  // Get cached deliveries
  async getCachedDeliveries(): Promise<Delivery[]> {
    try {
      const cached = await AsyncStorage.getItem(this.STORAGE_KEYS.CACHED_DELIVERIES);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting cached deliveries:', error);
      return [];
    }
  }

  // Cache single delivery
  async cacheDelivery(delivery: Delivery): Promise<void> {
    try {
      const cachedDeliveries = await this.getCachedDeliveries();
      const existingIndex = cachedDeliveries.findIndex(d => d.id === delivery.id);
      
      if (existingIndex >= 0) {
        cachedDeliveries[existingIndex] = delivery;
      } else {
        cachedDeliveries.push(delivery);
      }
      
      await this.cacheDeliveries(cachedDeliveries);
    } catch (error) {
      console.error('Error caching single delivery:', error);
      throw error;
    }
  }

  // Get cached delivery by ID
  async getCachedDelivery(deliveryId: string): Promise<Delivery | null> {
    try {
      const deliveries = await this.getCachedDeliveries();
      return deliveries.find(d => d.id === deliveryId) || null;
    } catch (error) {
      console.error('Error getting cached delivery:', error);
      return null;
    }
  }

  // Update cached delivery stop
  async updateCachedStop(deliveryId: string, stopId: string, updates: Partial<DeliveryStop>): Promise<void> {
    try {
      const deliveries = await this.getCachedDeliveries();
      const deliveryIndex = deliveries.findIndex(d => d.id === deliveryId);
      
      if (deliveryIndex >= 0) {
        const stopIndex = deliveries[deliveryIndex].stops.findIndex(s => s.id === stopId);
        if (stopIndex >= 0) {
          deliveries[deliveryIndex].stops[stopIndex] = {
            ...deliveries[deliveryIndex].stops[stopIndex],
            ...updates,
            updatedAt: new Date().toISOString()
          };
          await this.cacheDeliveries(deliveries);
        }
      }
    } catch (error) {
      console.error('Error updating cached stop:', error);
      throw error;
    }
  }

  // Add pending operation for sync when online
  async addPendingOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const pendingOps = await this.getPendingOperations();
      const newOperation: OfflineOperation = {
        ...operation,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0
      };
      
      pendingOps.push(newOperation);
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PENDING_OPERATIONS,
        JSON.stringify(pendingOps)
      );
    } catch (error) {
      console.error('Error adding pending operation:', error);
      throw error;
    }
  }

  // Get pending operations
  async getPendingOperations(): Promise<OfflineOperation[]> {
    try {
      const pending = await AsyncStorage.getItem(this.STORAGE_KEYS.PENDING_OPERATIONS);
      return pending ? JSON.parse(pending) : [];
    } catch (error) {
      console.error('Error getting pending operations:', error);
      return [];
    }
  }

  // Remove pending operation
  async removePendingOperation(operationId: string): Promise<void> {
    try {
      const pendingOps = await this.getPendingOperations();
      const filteredOps = pendingOps.filter(op => op.id !== operationId);
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PENDING_OPERATIONS,
        JSON.stringify(filteredOps)
      );
    } catch (error) {
      console.error('Error removing pending operation:', error);
      throw error;
    }
  }

  // Update retry count for operation
  async updateOperationRetryCount(operationId: string): Promise<void> {
    try {
      const pendingOps = await this.getPendingOperations();
      const opIndex = pendingOps.findIndex(op => op.id === operationId);
      
      if (opIndex >= 0) {
        pendingOps[opIndex].retryCount += 1;
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.PENDING_OPERATIONS,
          JSON.stringify(pendingOps)
        );
      }
    } catch (error) {
      console.error('Error updating retry count:', error);
      throw error;
    }
  }

  // Get last sync timestamp
  async getLastSyncTime(): Promise<number> {
    try {
      const lastSync = await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
      return lastSync ? parseInt(lastSync, 10) : 0;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return 0;
    }
  }

  // Set offline mode
  async setOfflineMode(isOffline: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.OFFLINE_MODE,
        JSON.stringify(isOffline)
      );
    } catch (error) {
      console.error('Error setting offline mode:', error);
    }
  }

  // Get offline mode status
  async getOfflineMode(): Promise<boolean> {
    try {
      const offlineMode = await AsyncStorage.getItem(this.STORAGE_KEYS.OFFLINE_MODE);
      return offlineMode ? JSON.parse(offlineMode) : false;
    } catch (error) {
      console.error('Error getting offline mode:', error);
      return false;
    }
  }

  // Clear all cached data
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.CACHED_DELIVERIES,
        this.STORAGE_KEYS.PENDING_OPERATIONS,
        this.STORAGE_KEYS.LAST_SYNC,
        this.STORAGE_KEYS.OFFLINE_MODE
      ]);
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  // Get cache size info
  async getCacheInfo(): Promise<{ deliveriesCount: number; pendingOpsCount: number; lastSync: Date | null }> {
    try {
      const deliveries = await this.getCachedDeliveries();
      const pendingOps = await this.getPendingOperations();
      const lastSyncTime = await this.getLastSyncTime();
      
      return {
        deliveriesCount: deliveries.length,
        pendingOpsCount: pendingOps.length,
        lastSync: lastSyncTime > 0 ? new Date(lastSyncTime) : null
      };
    } catch (error) {
      console.error('Error getting cache info:', error);
      return {
        deliveriesCount: 0,
        pendingOpsCount: 0,
        lastSync: null
      };
    }
  }
}

export default new OfflineStorageService();