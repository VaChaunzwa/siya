import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { Delivery } from '../services/deliveryService';

interface DeliveryCardProps {
  delivery: Delivery;
  onPress: () => void;
  isSelected?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return '#4CAF50';
    case 'in_progress':
      return '#FF9800';
    case 'assigned':
      return '#2196F3';
    case 'pending':
      return '#FFA500';
    case 'cancelled':
      return '#F44336';
    default:
      return '#757575';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In Progress';
    case 'assigned':
      return 'Assigned';
    case 'pending':
      return 'Pending';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return dateString;
  }
};

const getProgressText = (delivery: Delivery) => {
  const completedStops = delivery.stops?.filter(stop => stop.status === 'completed').length || 0;
  const totalStops = delivery.stops?.length || 0;
  return `${completedStops}/${totalStops} stops`;
};

const getProgressPercentage = (delivery: Delivery) => {
  const completedStops = delivery.stops?.filter(stop => stop.status === 'completed').length || 0;
  const totalStops = delivery.stops?.length || 0;
  return totalStops > 0 ? (completedStops / totalStops) * 100 : 0;
};

const formatAddress = (address: any): string => {
  if (!address) return 'No address specified';
  if (typeof address === 'string') return address;
  
  // Handle address object with properties
  if (typeof address === 'object') {
    const parts = [];
    if (address.addressLine1) parts.push(address.addressLine1);
    if (address.addressLine2) parts.push(address.addressLine2);
    if (address.suburb) parts.push(address.suburb);
    if (address.city) parts.push(address.city);
    if (address.province) parts.push(address.province);
    if (address.postalCode) parts.push(address.postalCode);
    
    return parts.length > 0 ? parts.join(', ') : 'No address specified';
  }
  
  return 'No address specified';
};

const getFirstStopLocation = (delivery: Delivery) => {
  return formatAddress(delivery.stops?.[0]?.address) || 'No location specified';
};

const DeliveryCard: React.FC<DeliveryCardProps> = ({
  delivery,
  onPress,
  isSelected = false
}) => {
  const statusColor = getStatusColor(delivery.status);
  const statusText = getStatusText(delivery.status);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliveryNumber}>{delivery.deliveryNumber}</Text>
          <Text style={styles.client}>{delivery.clientName || 'Unknown Client'}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons
            name="person-outline"
            size={16}
            color={theme.colors.onSurfaceVariant}
            style={styles.detailIcon}
          />
          <Text style={styles.detailText}>{delivery.driverName || 'Unassigned'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons
            name="car-outline"
            size={16}
            color={theme.colors.onSurfaceVariant}
            style={styles.detailIcon}
          />
          <Text style={styles.detailText}>{delivery.vehiclePlate || 'No vehicle assigned'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color={theme.colors.onSurfaceVariant}
            style={styles.detailIcon}
          />
          <Text style={styles.detailText}>{getFirstStopLocation(delivery)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={theme.colors.onSurfaceVariant}
            style={styles.detailIcon}
          />
          <Text style={styles.detailText}>{formatDate(delivery.scheduledDate || delivery.createdAt)}</Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Progress: {getProgressText(delivery)}</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${getProgressPercentage(delivery)}%`,
                  backgroundColor: statusColor
                }
              ]}
            />
          </View>
        </View>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    elevation: theme.elevation.level1,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22
  },
  selectedContainer: {
    borderColor: theme.colors.primary,
    borderWidth: 2
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md
  },
  deliveryInfo: {
    flex: 1
  },
  deliveryNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4
  },
  client: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
    fontWeight: '600'
  },
  details: {
    marginBottom: theme.spacing.md
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  detailIcon: {
    marginRight: theme.spacing.sm,
    width: 16
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    flex: 1
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  progressContainer: {
    flex: 1,
    marginRight: theme.spacing.md
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.outline,
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 2
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default DeliveryCard;