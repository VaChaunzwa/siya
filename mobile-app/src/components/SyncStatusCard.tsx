import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Button, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../contexts/OfflineContext';
import { theme } from '../theme/theme';

interface SyncStatusCardProps {
  style?: any;
}

const SyncStatusCard: React.FC<SyncStatusCardProps> = ({ style }) => {
  const { 
    isOnline, 
    isSyncing, 
    pendingOperationsCount, 
    lastSyncTime, 
    forcSync 
  } = useOffline();

  const formatLastSyncTime = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStatusColor = () => {
    if (!isOnline) return '#FF6B6B';
    if (isSyncing) return '#FFA500';
    if (pendingOperationsCount > 0) return '#FF9800';
    return '#4CAF50';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (pendingOperationsCount > 0) return `${pendingOperationsCount} pending`;
    return 'All synced';
  };

  const getStatusIcon = () => {
    if (!isOnline) return 'cloud-offline';
    if (isSyncing) return 'sync';
    if (pendingOperationsCount > 0) return 'cloud-upload';
    return 'cloud-done';
  };

  return (
    <Card style={[styles.card, style]}>
      <Card.Content style={styles.content}>
        <View style={styles.statusRow}>
          <View style={styles.statusInfo}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Ionicons 
              name={getStatusIcon()} 
              size={20} 
              color={getStatusColor()} 
              style={styles.statusIcon}
            />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
          
          {isSyncing && (
            <ActivityIndicator size="small" color={getStatusColor()} />
          )}
        </View>
        
        <View style={styles.detailsRow}>
          <Text style={styles.lastSyncText}>
            Last sync: {formatLastSyncTime(lastSyncTime)}
          </Text>
          
          {isOnline && pendingOperationsCount > 0 && (
            <Button
              mode="outlined"
              onPress={forcSync}
              disabled={isSyncing}
              style={styles.syncButton}
              labelStyle={styles.syncButtonLabel}
            >
              Sync Now
            </Button>
          )}
        </View>
        
        {pendingOperationsCount > 0 && (
          <Text style={styles.pendingText}>
            {pendingOperationsCount} operation{pendingOperationsCount !== 1 ? 's' : ''} waiting to sync
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 2,
  },
  content: {
    paddingVertical: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusIcon: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastSyncText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  syncButton: {
    borderRadius: 20,
  },
  syncButtonLabel: {
    fontSize: 12,
  },
  pendingText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default SyncStatusCard;