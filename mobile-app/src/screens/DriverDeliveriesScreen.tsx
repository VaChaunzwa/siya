import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions, useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import SyncStatusCard from '../components/SyncStatusCard';
import DeliveryAcceptanceModal from '../components/DeliveryAcceptanceModal';
import deliveryService, { Delivery, DeliveryFilters } from '../services/deliveryService';
import authService from '../services/authService';
import { useOffline } from '../contexts/OfflineContext';
import { ROUTES } from '../shared/config/constants';

const DriverDeliveriesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isOnline, pendingOperationsCount, lastSyncTime } = useOffline();
  const [searchText, setSearchText] = useState('');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  const handleMenuPress = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const fetchDeliveries = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);

      if (!user) {
        Alert.alert('Error', 'Please log in to view deliveries');
        return;
      }

      if (!authService.isDriver()) {
        Alert.alert('Access Denied', 'This screen is only available for drivers');
        return;
      }

      const filters: DeliveryFilters = {
        search: searchText || undefined,
        status: selectedFilter === 'all' ? undefined : selectedFilter,
        limit: 50,
        page: 1,
      };

      const response = await deliveryService.getDeliveriesByDriver(user.id, filters);
      console.log('🚛 Driver deliveries fetched:', response.deliveries?.length || 0, 'items');
      setDeliveries(response.deliveries || []);
    } catch (error) {
      console.error('❌ Error fetching driver deliveries:', error);
      Alert.alert('Error', 'Failed to load deliveries. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchText, selectedFilter]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🚛 DEBUG: DriverDeliveriesScreen focused, fetching deliveries');
      fetchDeliveries();
    }, [fetchDeliveries])
  );

  // Refetch when search or filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!loading) {
        fetchDeliveries();
      }
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchText, selectedFilter, fetchDeliveries]);

  const onRefresh = useCallback(() => {
    fetchDeliveries(true);
  }, [fetchDeliveries]);

  const handleDeliveryPress = (delivery: Delivery) => {
    navigation.navigate(ROUTES.DRIVER_DELIVERY_DETAILS as never, { delivery } as never);
  };

  const handleStartDelivery = async (delivery: Delivery) => {
    console.log('🚛 DEBUG: handleStartDelivery called, showing modal for delivery:', delivery.id);
    setSelectedDelivery(delivery);
    setShowAcceptanceModal(true);
  };

  const handleAcceptAndContinue = async (delivery: Delivery) => {
    try {
      await deliveryService.updateDeliveryStatus(delivery.id, 'in_progress');
      Alert.alert('Success', 'Delivery started successfully!');
      fetchDeliveries();
      // Navigate to delivery details
      navigation.navigate(ROUTES.DRIVER_DELIVERY_DETAILS as never, { deliveryId: delivery.id } as never);
    } catch (error) {
      console.error('❌ Error starting delivery:', error);
      Alert.alert('Error', 'Failed to start delivery. Please try again.');
    }
  };

  const handleAcceptAndInspect = async (delivery: Delivery) => {
    try {
      console.log('🚛 DEBUG: handleAcceptAndInspect called for delivery:', delivery.id);
      await deliveryService.updateDeliveryStatus(delivery.id, 'in_progress');
      Alert.alert('Success', 'Delivery accepted! Please complete the vehicle inspection.');
      fetchDeliveries();
      // Navigate to vehicle checklist
      console.log('🚛 DEBUG: Navigating to vehicle checklist from handleAcceptAndInspect');
      navigation.navigate(ROUTES.DRIVER_VEHICLE_CHECKLIST as never);
    } catch (error) {
      console.error('❌ Error accepting delivery:', error);
      Alert.alert('Error', 'Failed to accept delivery. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setShowAcceptanceModal(false);
    setSelectedDelivery(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.delivered;
      case 'in_progress':
        return theme.colors.inProgress;
      case 'pending':
        return theme.colors.pending;
      case 'assigned':
        return theme.colors.primary;
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
      case 'pending':
        return 'Pending';
      case 'assigned':
        return 'Assigned';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-ZA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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

  const renderFilterButton = (filter: typeof selectedFilter, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.activeFilterButton
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        styles.filterText,
        selectedFilter === filter && styles.activeFilterText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderDeliveryItem = ({ item }: { item: Delivery }) => {
    const canStart = item.status === 'assigned' || item.status === 'pending';
    const isInProgress = item.status === 'in_progress';
    const isCompleted = item.status === 'completed';

    return (
      <TouchableOpacity
        style={styles.deliveryCard}
        onPress={() => handleDeliveryPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryNumber}>{item.deliveryNumber}</Text>
            <Text style={styles.clientName}>{item.clientName || 'Unknown Client'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.infoText}>{formatDate(item.scheduledDate)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.infoText}>{getProgressText(item)}</Text>
          </View>

          {item.priority && item.priority !== 'normal' && (
            <View style={styles.infoRow}>
              <Ionicons name="flag-outline" size={16} color={theme.colors.error} />
              <Text style={[styles.infoText, { color: theme.colors.error }]}>
                {item.priority.toUpperCase()} Priority
              </Text>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        {!isCompleted && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={[styles.progressFill, { width: `${getProgressPercentage(item)}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {canStart && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => handleStartDelivery(item)}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="play" size={16} color={theme.colors.onPrimary} />
                <Text style={styles.buttonText}>Start Delivery</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          {isInProgress && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => handleDeliveryPress(item)}
            >
              <View style={[styles.buttonGradient, { backgroundColor: theme.colors.inProgress }]}>
                <Ionicons name="arrow-forward" size={16} color={theme.colors.onPrimary} />
                <Text style={styles.buttonText}>Continue</Text>
              </View>
            </TouchableOpacity>
          )}

          {isCompleted && (
            <View style={styles.completedIndicator}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.delivered} />
              <Text style={[styles.buttonText, { color: theme.colors.delivered }]}>Completed</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.surface]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Header title="My Deliveries" showProfile onMenuPress={handleMenuPress} />
        
        <SearchBar
          placeholder="Search deliveries..."
          value={searchText}
          onChangeText={setSearchText}
        />

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          {renderFilterButton('pending', 'Pending')}
          {renderFilterButton('in_progress', 'In Progress')}
          {renderFilterButton('completed', 'Completed')}
          {renderFilterButton('all', 'All')}
        </View>
        
        {/* Sync Status Card */}
        <View style={{ paddingHorizontal: theme.spacing.md }}>
          <SyncStatusCard />
        </View>
        
        {/* Deliveries List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading your deliveries...</Text>
          </View>
        ) : (
          <FlatList
            data={deliveries}
            renderItem={renderDeliveryItem}
            keyExtractor={(item) => item.id}
            style={styles.deliveriesList}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="car-outline" size={48} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.emptyText}>No deliveries found</Text>
                <Text style={styles.emptySubtext}>
                  {selectedFilter === 'pending' 
                    ? 'No pending deliveries assigned to you'
                    : `No ${selectedFilter} deliveries found`
                  }
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
      
      {/* Delivery Acceptance Modal */}
      <DeliveryAcceptanceModal
        visible={showAcceptanceModal}
        delivery={selectedDelivery}
        onClose={handleCloseModal}
        onAcceptAndContinue={handleAcceptAndContinue}
        onAcceptAndInspect={handleAcceptAndInspect}
      />
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  activeFilterButton: {
    backgroundColor: theme.colors.primary
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant
  },
  activeFilterText: {
    color: theme.colors.onPrimary
  },
  deliveriesList: {
    flex: 1,
    marginTop: theme.spacing.sm
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl
  },
  deliveryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm
  },
  deliveryInfo: {
    flex: 1
  },
  deliveryNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface
  },
  clientName: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2
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
  cardContent: {
    marginBottom: theme.spacing.sm
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant
  },
  progressContainer: {
    marginBottom: theme.spacing.sm
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.outline,
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 3
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm
  },
  startButton: {
    flex: 1,
    borderRadius: theme.roundness
  },
  continueButton: {
    flex: 1,
    borderRadius: theme.roundness
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.roundness,
    gap: theme.spacing.xs
  },
  buttonText: {
    color: theme.colors.onPrimary,
    fontSize: 14,
    fontWeight: '600'
  },
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.md
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg
  }
});

export default DriverDeliveriesScreen;