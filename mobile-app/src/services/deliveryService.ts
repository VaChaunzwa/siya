import API_BASE_URL, { API_ENDPOINTS, HTTP_METHODS } from './apiConfig';
import authService from './authService';
import offlineStorageService from './offlineStorageService';
import networkService from './networkService';

export interface DeliveryItem {
  id?: string;
  description: string;
  quantity: number;
  sku?: string;
  weight?: number;
  dimensions?: string;
  notes?: string;
  confirmed?: boolean;
}

export interface DeliveryStop {
  id: string;
  deliveryId: string;
  address: string;
  customerName: string;
  customerPhone?: string;
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  estimatedTime?: string;
  actualTime?: string;
  completionData?: any;
  items?: DeliveryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Delivery {
  id: string;
  deliveryNumber: string;
  driverId?: string;
  driverName?: string;
  vehicleId?: string;
  vehiclePlate?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration?: number;
  actualDuration?: number;
  totalDistance?: number;
  stops: DeliveryStop[];
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string;
  completedAt?: string;
  notes?: string;
  clientId?: string;
  clientName?: string;
}

export interface DeliveryFilters {
  status?: string;
  driverId?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DeliveryStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  todayDeliveries: number;
  weekDeliveries: number;
  monthDeliveries: number;
}

class DeliveryService {
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = authService.getAuthToken();
    
    const headers: HeadersInit = {
      ...options.headers,
    };

    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      console.log('Making request to:', url);
      console.log('Request options:', {
        method: options.method || 'GET',
        headers: Object.keys(headers),
        bodyType: options.body ? (options.body instanceof FormData ? 'FormData' : typeof options.body) : 'none'
      });
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Check if response has content and is JSON
      let data = null;
      const contentType = response.headers.get('content-type');
      const hasContent = response.headers.get('content-length') !== '0';
      
      if (hasContent && contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.warn('Failed to parse JSON response:', jsonError);
          data = {};
        }
      } else {
        // For responses without JSON content (like 204 No Content)
        data = {};
      }

      if (!response.ok) {
        throw new Error(data?.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Delivery API request failed:', error);
      throw error;
    }
  }

  async getDeliveries(filters: DeliveryFilters = {}): Promise<{
    deliveries: Delivery[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const endpoint = `${API_ENDPOINTS.DELIVERIES}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🌐 API Request URL:', endpoint);
      const response = await this.makeRequest(endpoint);
      console.log('📦 API Response:', { 
        success: response.success, 
        deliveriesCount: response.data?.deliveries?.length || response.data?.length || response.deliveries?.length || 0,
        pagination: response.data?.pagination || response.pagination 
      });

      return {
        deliveries: response.data?.deliveries || response.data || response.deliveries || [],
        pagination: response.data?.pagination || response.pagination,
      };
    } catch (error) {
      console.error('❌ Error fetching deliveries:', error);
      throw error;
    }
  }

  async getDeliveryById(id: string): Promise<Delivery> {
    try {
      // Check if online
      if (!networkService.getConnectionStatus()) {
        console.log('Offline: Loading delivery from cache');
        const cachedDeliveries = await offlineStorageService.getCachedDeliveries();
        const delivery = cachedDeliveries.find(d => d.id === id);
        if (!delivery) {
          throw new Error('Delivery not found in cache');
        }
        return delivery;
      }

      try {
        const response = await this.makeRequest(API_ENDPOINTS.DELIVERY_BY_ID(id));
        const delivery = response.data || response.delivery;
        
        // Cache the delivery for offline use
        await offlineStorageService.cacheDeliveries([delivery]);
        
        return delivery;
      } catch (error) {
        console.log('Network error, falling back to cache:', error);
        const cachedDeliveries = await offlineStorageService.getCachedDeliveries();
        const delivery = cachedDeliveries.find(d => d.id === id);
        if (!delivery) {
          throw error;
        }
        return delivery;
      }
    } catch (error) {
      console.error('Error fetching delivery by ID:', error);
      throw error;
    }
  }

  async getDeliveriesByDriver(driverId: string, filters: DeliveryFilters = {}): Promise<{
    deliveries: Delivery[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      // Check if online
      if (!networkService.getConnectionStatus()) {
        console.log('Offline: Loading deliveries from cache');
        const cachedDeliveries = await offlineStorageService.getCachedDeliveries();
        const filteredDeliveries = cachedDeliveries.filter(d => d.driverId === driverId);
        return {
          deliveries: filteredDeliveries,
          pagination: undefined
        };
      }

      try {
        const queryParams = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });

        const endpoint = `${API_ENDPOINTS.DELIVERIES_BY_DRIVER(driverId)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await this.makeRequest(endpoint);

        const deliveries = response.data?.deliveries || response.data || response.deliveries || [];
        
        // Cache the deliveries for offline use
        await offlineStorageService.cacheDeliveries(deliveries);

        return {
          deliveries,
          pagination: response.data?.pagination || response.pagination,
        };
      } catch (error) {
        console.log('Network error, falling back to cache:', error);
        const cachedDeliveries = await offlineStorageService.getCachedDeliveries();
        const filteredDeliveries = cachedDeliveries.filter(d => d.driverId === driverId);
        return {
          deliveries: filteredDeliveries,
          pagination: undefined
        };
      }
    } catch (error) {
      console.error('Error fetching deliveries by driver:', error);
      throw error;
    }
  }

  // Get deliveries for a specific driver
  async getDriverDeliveries(driverId?: string): Promise<Delivery[]> {
    try {
      const currentUser = await authService.getCurrentUser();
      const targetDriverId = driverId || currentUser?.id;
      
      if (!targetDriverId) {
        throw new Error('Driver ID not found');
      }

      // Check if online
      if (!networkService.getConnectionStatus()) {
        console.log('Offline: Loading deliveries from cache');
        const cachedDeliveries = await offlineStorageService.getCachedDeliveries();
        return cachedDeliveries.filter(d => d.driverId === targetDriverId);
      }

      try {
        const response = await this.makeRequest(
          API_ENDPOINTS.DELIVERIES_BY_DRIVER(targetDriverId),
          {
            method: HTTP_METHODS.GET,
          }
        );

        const deliveries = response.deliveries || [];
        
        // Cache the deliveries for offline use
        await offlineStorageService.cacheDeliveries(deliveries);
        
        return deliveries;
      } catch (error) {
        console.log('Network error, falling back to cache:', error);
        const cachedDeliveries = await offlineStorageService.getCachedDeliveries();
        return cachedDeliveries.filter(d => d.driverId === targetDriverId);
      }
    } catch (error) {
      console.error('Error fetching driver deliveries:', error);
      throw error;
    }
  }

  async getDeliveryStats(): Promise<DeliveryStats> {
    try {
      const response = await this.makeRequest(API_ENDPOINTS.DELIVERY_STATS);
      return response.data || response.stats;
    } catch (error) {
      console.error('Error fetching delivery stats:', error);
      throw error;
    }
  }

  async updateDeliveryStatus(id: string, status: string, notes?: string): Promise<Delivery> {
    try {
      const response = await this.makeRequest(`${API_ENDPOINTS.DELIVERY_BY_ID(id)}/status`, {
        method: HTTP_METHODS.PATCH,
        body: JSON.stringify({ status, notes }),
      });
      return response.data || response.delivery;
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw error;
    }
  }

  async getStopById(deliveryId: string, stopId: string): Promise<DeliveryStop> {
    try {
      const response = await this.makeRequest(API_ENDPOINTS.STOP_BY_ID(deliveryId, stopId));
      return response.data || response.stop;
    } catch (error) {
      console.error('Error fetching stop by ID:', error);
      throw error;
    }
  }

  async updateStopStatus(
    deliveryId: string,
    stopId: string,
    status: string,
    completionData?: any
  ): Promise<DeliveryStop> {
    try {
      const requestData = { status, completionData };
      
      console.log('Updating stop status:', {
        deliveryId,
        stopId,
        status,
        hasCompletionData: !!completionData
      });
      
      // Check if online
      if (!networkService.getConnectionStatus()) {
        console.log('Offline: Queuing stop status update for sync');
        
        // Queue the operation for later sync
        await offlineStorageService.queuePendingOperation({
          type: 'updateStopStatus',
          deliveryId,
          stopId,
          data: requestData,
          timestamp: Date.now()
        });
        
        // Update local cache
        const cachedDeliveries = await offlineStorageService.getCachedDeliveries();
        const delivery = cachedDeliveries.find(d => d.id === deliveryId);
        if (delivery) {
          const stop = delivery.stops?.find(s => s.id === stopId);
          if (stop) {
            stop.status = status;
            if (completionData) {
              stop.completionData = completionData;
            }
            await offlineStorageService.cacheDeliveries(cachedDeliveries);
            return stop;
          }
        }
        
        // Return a mock stop if not found in cache
        return {
          id: stopId,
          status,
          completionData
        } as DeliveryStop;
      }
      
      try {
        const response = await this.makeRequest(
          API_ENDPOINTS.UPDATE_STOP_STATUS(deliveryId, stopId),
          {
            method: HTTP_METHODS.PATCH,
            body: JSON.stringify(requestData),
          }
        );
        
        const updatedStop = response.data || response.stop;
        
        // Update cache with the updated stop
        const cachedDeliveries = await offlineStorageService.getCachedDeliveries();
        const delivery = cachedDeliveries.find(d => d.id === deliveryId);
        if (delivery) {
          const stopIndex = delivery.stops?.findIndex(s => s.id === stopId);
          if (stopIndex !== undefined && stopIndex >= 0 && delivery.stops) {
            delivery.stops[stopIndex] = updatedStop;
            await offlineStorageService.cacheDeliveries(cachedDeliveries);
          }
        }
        
        return updatedStop;
      } catch (error) {
        console.log('Network error, queuing for sync:', error);
        
        // Queue the operation for later sync
        await offlineStorageService.queuePendingOperation({
          type: 'updateStopStatus',
          deliveryId,
          stopId,
          data: requestData,
          timestamp: Date.now()
        });
        
        // Update local cache
        const cachedDeliveries = await offlineStorageService.getCachedDeliveries();
        const delivery = cachedDeliveries.find(d => d.id === deliveryId);
        if (delivery) {
          const stop = delivery.stops?.find(s => s.id === stopId);
          if (stop) {
            stop.status = status;
            if (completionData) {
              stop.completionData = completionData;
            }
            await offlineStorageService.cacheDeliveries(cachedDeliveries);
            return stop;
          }
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Error updating stop status:', error);
      throw error;
    }
  }

  async completeStop(
    deliveryId: string,
    stopId: string,
    completionData?: any
  ): Promise<DeliveryStop> {
    try {
      // Use the same approach as web app - send JSON with base64 data
      const requestData = {
        status: 'completed',
        ...completionData
      };
      
      console.log('Completing stop with data:', {
        deliveryId,
        stopId,
        hasPhotos: completionData?.deliveryPhotos?.length > 0,
        hasSignature: !!completionData?.recipientSignature,
        recipientName: completionData?.recipientName
      });
      
      // Check if online
      if (!networkService.getConnectionStatus()) {
        console.log('Offline: Queuing stop completion for sync');
        
        // Queue the operation for later sync
        await offlineStorageService.queuePendingOperation({
          type: 'completeStop',
          deliveryId,
          stopId,
          data: requestData,
          timestamp: Date.now()
        });
        
        // Update local cache with completed status
        const cachedDeliveries = await offlineStorageService.getCachedDeliveries();
        const delivery = cachedDeliveries.find(d => d.id === deliveryId);
        if (delivery) {
          const stop = delivery.stops?.find(s => s.id === stopId);
          if (stop) {
            stop.status = 'completed';
            stop.completionData = completionData;
            await offlineStorageService.cacheDeliveries(cachedDeliveries);
            return stop;
          }
        }
        
        // Return a mock stop if not found in cache
        return {
          id: stopId,
          status: 'completed',
          completionData
        } as DeliveryStop;
      }
      
      try {
        // Make request with JSON data (same as web app)
        const response = await this.makeRequest(
          API_ENDPOINTS.COMPLETE_STOP(deliveryId, stopId),
          {
            method: HTTP_METHODS.PATCH,
            body: JSON.stringify(requestData),
          }
        );
        
        const updatedStop = response.data || response.stop;
        
        // Update cache with the completed stop
        const cachedDeliveries = await offlineStorageService.getCachedDeliveries();
        const delivery = cachedDeliveries.find(d => d.id === deliveryId);
        if (delivery) {
          const stopIndex = delivery.stops?.findIndex(s => s.id === stopId);
          if (stopIndex !== undefined && stopIndex >= 0 && delivery.stops) {
            delivery.stops[stopIndex] = updatedStop;
            await offlineStorageService.cacheDeliveries(cachedDeliveries);
          }
        }
        
        return updatedStop;
      } catch (error) {
        console.log('Network error, queuing for sync:', error);
        
        // Queue the operation for later sync
        await offlineStorageService.queuePendingOperation({
          type: 'completeStop',
          deliveryId,
          stopId,
          data: requestData,
          timestamp: Date.now()
        });
        
        // Update local cache with completed status
        const cachedDeliveries = await offlineStorageService.getCachedDeliveries();
        const delivery = cachedDeliveries.find(d => d.id === deliveryId);
        if (delivery) {
          const stop = delivery.stops?.find(s => s.id === stopId);
          if (stop) {
            stop.status = 'completed';
            stop.completionData = completionData;
            await offlineStorageService.cacheDeliveries(cachedDeliveries);
            return stop;
          }
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Error completing stop:', error);
      throw error;
    }
  }

  async getStopImages(deliveryId: string, stopId: string): Promise<{
    photoUrls: string[];
    signatureUrl: string | null;
  }> {
    try {
      const response = await this.makeRequest(API_ENDPOINTS.STOP_IMAGES(deliveryId, stopId));
      return {
        photoUrls: response.data?.photoUrls || response.photoUrls || [],
        signatureUrl: response.data?.signatureUrl || response.signatureUrl || null,
      };
    } catch (error) {
      console.error('Error fetching stop images:', error);
      throw error;
    }
  }

  // Helper method to get deliveries based on user role
  async getDeliveriesForCurrentUser(filters: DeliveryFilters = {}): Promise<{
    deliveries: Delivery[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      console.log('📡 DeliveryService: Getting current user...');
      const currentUser = await authService.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      console.log('👤 Current user:', { id: currentUser.id, role: currentUser.role, email: currentUser.email });

      // If user is a driver, get deliveries assigned to them
      if (authService.isDriver()) {
        console.log('🚛 Filtering for driver:', currentUser.id);
        return this.getDeliveriesByDriver(currentUser.id, filters);
      }
      
      // If user is a client, filter by their clientId
      if (authService.isClient() && currentUser.clientId) {
        console.log('🏢 Filtering for client:', currentUser.clientId);
        return this.getDeliveries({ ...filters, clientId: currentUser.clientId });
      }
      
      // For fleet managers, dispatchers, and admins, get all deliveries
      console.log('👨‍💼 Fetching all deliveries for role:', currentUser.role);
      return this.getDeliveries(filters);
    } catch (error) {
      console.error('❌ Error fetching deliveries for current user:', error);
      throw error;
    }
  }

  // Helper method to format delivery status for display
  getStatusDisplayText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'assigned': 'Assigned',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
    };
    return statusMap[status] || status;
  }

  // Helper method to get status color
  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'pending': '#FFA500',
      'assigned': '#2196F3',
      'in_progress': '#FF9800',
      'completed': '#4CAF50',
      'cancelled': '#F44336',
    };
    return colorMap[status] || '#757575';
  }
}

// Export singleton instance
export default new DeliveryService();