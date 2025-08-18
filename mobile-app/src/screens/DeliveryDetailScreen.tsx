import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import { Delivery, DeliveryStop } from '../services/deliveryService';

interface RouteParams {
  delivery: Delivery;
}

const DeliveryDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { delivery } = route.params as RouteParams;
  const [activeTab, setActiveTab] = useState<'overview' | 'stops'>('overview');

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleDownloadNote = () => {
    navigation.navigate('DeliveryNote' as never, { delivery } as never);
  };

  const handleStopPress = (stop: DeliveryStop) => {
    const stopIndex = delivery.stops?.findIndex(s => s.id === stop.id) || 0;
    const stopNumber = stopIndex + 1;
    navigation.navigate('StopDetail' as never, { 
      stop, 
      delivery, 
      stopNumber 
    } as never);
  };

  const getProgressText = () => {
    const completedStops = delivery.stops?.filter(stop => stop.status === 'completed').length || 0;
    const totalStops = delivery.stops?.length || 0;
    return `${completedStops}/${totalStops} stops`;
  };

  const getProgressPercentage = () => {
    const completedStops = delivery.stops?.filter(stop => stop.status === 'completed').length || 0;
    const totalStops = delivery.stops?.length || 0;
    return totalStops > 0 ? (completedStops / totalStops) * 100 : 0;
  };

  const getStopStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.delivered;
      case 'in_progress':
        return theme.colors.inProgress;
      case 'pending':
        return theme.colors.pending;
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.pending;
    }
  };

  const getStopStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.delivered;
      case 'in_progress':
        return theme.colors.inProgress;
      case 'assigned':
        return theme.colors.inProgress;
      case 'pending':
        return theme.colors.pending;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.pending;
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

  const statusColor = getStatusColor(delivery.status);
  const statusText = getStatusText(delivery.status);

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.surface]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Header
          title="Deliveries"
          showBack
          onBackPress={handleBackPress}
          showProfile
        />
        
        {/* Delivery Header */}
        <View style={styles.deliveryHeader}>
          <Text style={styles.deliveryTitle}>{delivery.deliveryNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'overview' && styles.activeTab
            ]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'overview' && styles.activeTabText
            ]}>
              Overview
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'stops' && styles.activeTab
            ]}
            onPress={() => setActiveTab('stops')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'stops' && styles.activeTabText
            ]}>
              Stops {delivery.stops?.length || 0}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {activeTab === 'overview' ? (
            <>
              {/* Delivery Information Card */}
              <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>Delivery #{delivery.deliveryNumber}</Text>
                
                <View style={styles.infoRow}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.infoIcon}
                  />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Driver:</Text>
                    <Text style={styles.infoValue}>{delivery.driverName || 'Not assigned'}</Text>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons
                    name="car-outline"
                    size={16}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.infoIcon}
                  />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Vehicle:</Text>
                    <Text style={styles.infoValue}>{delivery.vehiclePlate || 'Not assigned'}</Text>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.infoIcon}
                  />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Scheduled Date:</Text>
                    <Text style={styles.infoValue}>{delivery.scheduledDate ? new Date(delivery.scheduledDate).toLocaleDateString() : 'Not scheduled'}</Text>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons
                    name="flag-outline"
                    size={16}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.infoIcon}
                  />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Priority:</Text>
                    <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>{delivery.priority}</Text>
                  </View>
                </View>
                
                {/* Progress Bar */}
                <View style={styles.progressSection}>
                  <Text style={styles.progressLabel}>Progress: {getProgressText()}</Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${getProgressPercentage()}%`,
                          backgroundColor: statusColor
                        }
                      ]}
                    />
                  </View>
                </View>
              </View>
              
              {/* Download Note Button */}
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={handleDownloadNote}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  style={styles.downloadGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons
                    name="download-outline"
                    size={20}
                    color={theme.colors.onPrimary}
                    style={styles.downloadIcon}
                  />
                  <Text style={styles.downloadText}>Download Delivery Note</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            /* Stops Tab */
            <View style={styles.stopsContainer}>
              {delivery.stops && delivery.stops.length > 0 ? (
                delivery.stops.map((stop, index) => (
                  <TouchableOpacity
                    key={stop.id}
                    style={styles.stopCard}
                    onPress={() => handleStopPress(stop)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.stopHeader}>
                      <View style={styles.stopNumber}>
                        <Text style={styles.stopNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.stopInfo}>
                        <Text style={styles.stopCustomer}>{stop.customerName}</Text>
                        <Text style={styles.stopAddress}>{formatAddress(stop.address)}</Text>
                        {stop.customerPhone && (
                          <Text style={styles.stopPhone}>{stop.customerPhone}</Text>
                        )}
                      </View>
                      <View style={[styles.stopStatus, { backgroundColor: getStopStatusColor(stop.status) }]}>
                        <Text style={styles.stopStatusText}>{getStopStatusText(stop.status)}</Text>
                      </View>
                    </View>
                    {stop.notes && (
                      <Text style={styles.stopNotes}>{stop.notes}</Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyStops}>
                  <Ionicons name="location-outline" size={48} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.emptyStopsText}>No stops available</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  safeArea: {
    flex: 1
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md
  },
  deliveryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: 'transparent',
    alignItems: 'center'
  },
  activeTab: {
    backgroundColor: theme.colors.surfaceVariant
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant
  },
  activeTabText: {
    color: theme.colors.onSurface
  },
  content: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.md
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md
  },
  infoIcon: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
    width: 16
  },
  infoContent: {
    flex: 1
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2
  },
  infoValue: {
    fontSize: 16,
    color: theme.colors.onSurface,
    fontWeight: '500'
  },
  progressSection: {
    marginTop: theme.spacing.sm
  },
  progressLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.sm
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.outline,
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  },
  downloadButton: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.roundness
  },
  downloadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.roundness
  },
  downloadIcon: {
    marginRight: theme.spacing.sm
  },
  downloadText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '600'
  },
  // Stops styles
  stopsContainer: {
    flex: 1
  },
  stopCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md
  },
  stopNumberText: {
    color: theme.colors.onPrimary,
    fontSize: 14,
    fontWeight: 'bold'
  },
  stopInfo: {
    flex: 1,
    marginRight: theme.spacing.md
  },
  stopCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2
  },
  stopAddress: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2
  },
  stopPhone: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant
  },
  stopStatus: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12
  },
  stopStatusText: {
    color: theme.colors.onPrimary,
    fontSize: 10,
    fontWeight: '600'
  },
  stopNotes: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic'
  },
  emptyStops: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2
  },
  emptyStopsText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.md
  }
});

export default DeliveryDetailScreen;