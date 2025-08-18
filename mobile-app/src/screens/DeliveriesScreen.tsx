import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import DeliveryCard from '../components/DeliveryCard';
import deliveryService, { Delivery, DeliveryFilters } from '../services/deliveryService';
import authService from '../services/authService';

// Remove the local interface as we're using the one from deliveryService

const DeliveriesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pagination, setPagination] = useState<any>(null);

  const handleMenuPress = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // Fetch deliveries from backend
  const fetchDeliveries = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('🚚 Fetching deliveries...');
      const user = await authService.getCurrentUser();
      setCurrentUser(user);

      if (!user) {
        Alert.alert('Error', 'Please log in to view deliveries');
        return;
      }

      const filters: DeliveryFilters = {
        search: searchText || undefined,
        limit: 20,
        page: 1,
      };

      const response = await deliveryService.getDeliveriesForCurrentUser(filters);
      console.log('🚚 Deliveries fetched:', response.deliveries?.length || 0, 'items');
      console.log('🚚 Sample delivery:', response.deliveries?.[0]);
      setDeliveries(response.deliveries);
      setPagination(response.pagination);
    } catch (error) {
      console.error('❌ Error fetching deliveries:', error);
      Alert.alert('Error', 'Failed to load deliveries. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchText]);

  // Initial load
  useEffect(() => {
    fetchDeliveries();
  }, []);

  // Refetch when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!loading) {
        fetchDeliveries();
      }
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchText, fetchDeliveries]);

  const onRefresh = useCallback(() => {
    fetchDeliveries(true);
  }, [fetchDeliveries]);

  const filteredDeliveries = deliveries;

  const handleDeliveryPress = (delivery: Delivery) => {
    navigation.navigate('DeliveryDetail' as never, { delivery } as never);
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

  const getFirstStopLocation = (delivery: Delivery) => {
    return delivery.stops?.[0]?.address || 'No location specified';
  };

  const renderDeliveryItem = ({ item }: { item: Delivery }) => (
    <DeliveryCard
      delivery={item}
      onPress={() => handleDeliveryPress(item)}
      isSelected={false}
    />
  );

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.surface]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Header title="Deliveries" showProfile onMenuPress={handleMenuPress} />
        

        
        <SearchBar
          placeholder="Search deliveries..."
          value={searchText}
          onChangeText={setSearchText}
        />
        
        {/* Deliveries List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading deliveries...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredDeliveries}
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
                <Ionicons name="document-outline" size={48} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.emptyText}>No deliveries found</Text>
                <Text style={styles.emptySubtext}>Pull down to refresh or try a different search</Text>
              </View>
            }
          />
        )}
        
        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickActionButton}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              style={styles.quickActionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add" size={24} color={theme.colors.onPrimary} />
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={[styles.quickActionGradient, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Ionicons name="star" size={20} color={theme.colors.onSurfaceVariant} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={[styles.quickActionGradient, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.onSurfaceVariant} />
            </View>
          </TouchableOpacity>
        </View>
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

  deliveriesList: {
    flex: 1,
    marginTop: theme.spacing.md
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 100
  },
  quickActionsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md
  },
  quickActionButton: {
    borderRadius: 25
  },
  quickActionGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center'
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
    color: theme.colors.onSurface,
    marginTop: theme.spacing.md
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.sm,
    textAlign: 'center'
  }
});

export default DeliveriesScreen;