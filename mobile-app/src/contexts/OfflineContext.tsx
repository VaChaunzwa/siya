import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import networkService from '../services/networkService';
import syncService from '../services/syncService';
import offlineStorageService from '../services/offlineStorageService';

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperationsCount: number;
  lastSyncTime: Date | null;
  forcSync: () => Promise<void>;
  clearCache: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOperationsCount, setPendingOperationsCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Initialize with current status
    setIsOnline(networkService.getConnectionStatus());
    updatePendingOperationsCount();

    // Listen for network changes
    const networkUnsubscribe = networkService.addNetworkListener((status) => {
      setIsOnline(status);
    });

    // Listen for sync completion
    const syncUnsubscribe = syncService.addSyncListener((result) => {
      setIsSyncing(false);
      setLastSyncTime(new Date());
      updatePendingOperationsCount();
    });

    // Check sync status periodically
    const syncStatusInterval = setInterval(() => {
      const status = syncService.getSyncStatus();
      setIsSyncing(status.isSyncing);
    }, 1000);

    return () => {
      networkUnsubscribe();
      syncUnsubscribe();
      clearInterval(syncStatusInterval);
    };
  }, []);

  const updatePendingOperationsCount = async () => {
    try {
      const operations = await offlineStorageService.getPendingOperations();
      setPendingOperationsCount(operations.length);
    } catch (error) {
      console.error('Error updating pending operations count:', error);
    }
  };

  const forcSync = async () => {
    try {
      if (isOnline) {
        await syncService.syncPendingOperations();
      }
    } catch (error) {
      console.error('Error forcing sync:', error);
    }
  };

  const clearCache = async () => {
    try {
      await offlineStorageService.clearCache();
      setPendingOperationsCount(0);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const value: OfflineContextType = {
    isOnline,
    isSyncing,
    pendingOperationsCount,
    lastSyncTime,
    forcSync,
    clearCache,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export default OfflineContext;