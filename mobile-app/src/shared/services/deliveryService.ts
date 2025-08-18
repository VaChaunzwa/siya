import { API_BASE_URL } from '../config/constants';

interface DeliveryStop {
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
  createdAt: string;
  updatedAt: string;
}

interface Delivery {
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

interface DeliveryFilters {
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

interface DeliveryStats {
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
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      console.log('Making request to:', url);
      console.log('Request options:', {
        method: options.method || 'GET',
        headers: Object.keys(headers),
        bodyType: options.body ? typeof options.body : 'none'
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

  // Get all deliveries with filtering and pagination
  async getDeliveries(params: DeliveryFilters = {}): Promise<{
    success: boolean;
    data?: {
      deliveries: Delivery[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
    message?: string;
  }> {
    console.log('Fetching deliveries with params:', params);
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const endpoint = `/deliveries${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🌐 API Request URL:', endpoint);
      const response = await this.makeRequest(endpoint);
      console.log('📦 API Response:', { 
        success: response.success, 
        deliveriesCount: response.data?.deliveries?.length || response.data?.length || response.deliveries?.length || 0,
        pagination: response.data?.pagination || response.pagination 
      });

      return {
        success: true,
        data: {
          deliveries: response.data?.deliveries || response.data || response.deliveries || [],
          pagination: response.data?.pagination || response.pagination,
        }
      };
    } catch (error) {
      console.error('❌ Error fetching deliveries:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch deliveries'
      };
    }
  }

  // Get delivery by ID
  async getDeliveryById(deliveryId: string): Promise<{
    success: boolean;
    delivery?: Delivery;
    message?: string;
  }> {
    try {
      const response = await this.makeRequest(`/deliveries/${deliveryId}`);
      return { success: true, delivery: response.data || response.delivery };
    } catch (error) {
      console.error('Error fetching delivery by ID:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch delivery'
      };
    }
  }

  // Create new delivery
  async createDelivery(deliveryData: Partial<Delivery>): Promise<{
    success: boolean;
    delivery?: Delivery;
    message?: string;
    error?: any;
  }> {
    try {
      const response = await this.makeRequest('/deliveries', {
        method: 'POST',
        body: JSON.stringify(deliveryData),
      });
      return { success: true, delivery: response.data.data.delivery };
    } catch (error) {
      console.error('Create delivery error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create delivery',
        error: error.message
      };
    }
  }

  // Update delivery
  async updateDelivery(deliveryId: string, deliveryData: Partial<Delivery>): Promise<{
    success: boolean;
    delivery?: Delivery;
    message?: string;
    error?: any;
  }> {
    console.log('[DeliveryService.updateDelivery] Called with:', {
      deliveryId,
      deliveryData
    });
    try {
      const response = await this.makeRequest(`/deliveries/${deliveryId}`, {
        method: 'PUT',
        body: JSON.stringify(deliveryData),
      });
      console.log('[DeliveryService.updateDelivery] api response:', response);
      const successResult = { success: true, delivery: response.data.data.delivery };
      console.log('[DeliveryService.updateDelivery] Returning from try:', JSON.parse(JSON.stringify(successResult)));
      return successResult;
    } catch (error) {
      console.error('[DeliveryService.updateDelivery] Caught error:', error);
      const errorResult = {
        success: false,
        message: error.message || 'Failed to update delivery',
        error: error.message
      };
      console.log('[DeliveryService.updateDelivery] Returning from catch:', JSON.parse(JSON.stringify(errorResult)));
      return errorResult;
    }
  }

  // Delete delivery
  async deleteDelivery(deliveryId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await this.makeRequest(`/deliveries/${deliveryId}`, {
        method: 'DELETE',
      });
      return { success: true, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete delivery'
      };
    }
  }

  // Get deliveries by client ID
  async getDeliveriesByClient(clientId: string): Promise<{
    success: boolean;
    deliveries?: Delivery[];
    message?: string;
  }> {
    console.log('Fetching deliveries for client:', clientId);
    try {
      const response = await this.makeRequest(`/deliveries/client/${clientId}`);
      console.log('API response for getDeliveriesByClient:', response);
      return { success: true, deliveries: response.data || response.deliveries || [] };
    } catch (error) {
      console.error('Error fetching client deliveries:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch client deliveries'
      };
    }
  }

  // Get deliveries by driver ID
  async getDeliveriesByDriver(driverId: string, params: DeliveryFilters = {}): Promise<{
    success: boolean;
    deliveries?: Delivery[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    message?: string;
  }> {
    console.log(`Fetching deliveries for driver ${driverId} with params:`, params);
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const endpoint = `/deliveries/driver/${driverId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.makeRequest(endpoint);
      console.log('API response for getDeliveriesByDriver:', response);

      return { 
        success: true, 
        deliveries: response.data?.deliveries || response.data || response.deliveries || [],
        pagination: response.data?.pagination || response.pagination
      };
    } catch (error) {
      console.error('Error fetching driver deliveries:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch driver deliveries'
      };
    }
  }

  // Update delivery status
  async updateDeliveryStatus(deliveryId: string, status: string, completedAt: string | null = null): Promise<{
    success: boolean;
    delivery?: Delivery;
    message?: string;
  }> {
    try {
      const response = await this.makeRequest(`/deliveries/${deliveryId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          completedAt
        }),
      });
      return { success: true, delivery: response.data || response.delivery };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update delivery status'
      };
    }
  }

  // Update stop status
  async updateStopStatus(deliveryId: string, stopId: string, status: string, completedAt: string | null = null): Promise<{
    success: boolean;
    stop?: DeliveryStop;
    message?: string;
  }> {
    try {
      const response = await this.makeRequest(`/deliveries/${deliveryId}/stops/${stopId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          completedAt
        }),
      });
      return { success: true, stop: response.data || response.stop };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update stop status'
      };
    }
  }

  // Complete stop with photos and signature (mobile app specific)
  async completeStop(deliveryId: string, stopId: string, completionData: any): Promise<{
    success: boolean;
    stop?: DeliveryStop;
    message?: string;
  }> {
    try {
      console.log('Calling completeStop with:', {
        deliveryId,
        stopId,
        completionData
      });

      const response = await this.makeRequest(`/deliveries/${deliveryId}/stops/${stopId}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'completed',
          ...completionData
        }),
      });

      console.log('API response:', response);
      const result = { success: true, stop: response.data || response.stop };
      console.log('Returning result:', result);
      return result;
    } catch (error) {
      console.error('Error in completeStop:', error);
      const errorResult = {
        success: false,
        message: error.message || 'Failed to complete stop'
      };
      console.log('Returning error result:', errorResult);
      return errorResult;
    }
  }

  // Complete delivery with signature and photos
  async completeDeliveryWithData(deliveryId: string, stopId: string, completionData: any): Promise<{
    success: boolean;
    stop?: DeliveryStop;
    message?: string;
  }> {
    try {
      console.log('Calling completeDeliveryWithData with:', {
        deliveryId,
        stopId,
        completionData
      });

      const response = await this.makeRequest(`/deliveries/${deliveryId}/stops/${stopId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'completed',
          completedAt: new Date().toISOString(),
          ...completionData
        }),
      });

      console.log('API response:', response);
      const result = { success: true, stop: response.data || response.stop };
      console.log('Returning result:', result);
      return result;
    } catch (error) {
      console.error('Error in completeDeliveryWithData:', error);
      const errorResult = {
        success: false,
        message: error.message || 'Failed to complete delivery'
      };
      console.log('Returning error result:', errorResult);
      return errorResult;
    }
  }

  // Get delivery statistics
  async getDeliveryStats(params: DeliveryFilters = {}): Promise<{
    success: boolean;
    stats?: DeliveryStats;
    message?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const endpoint = `/deliveries/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.makeRequest(endpoint);
      return { success: true, stats: response.data || response.stats };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch delivery stats'
      };
    }
  }

  // Get stop images (photos and signature)
  async getStopImages(deliveryId: string, stopId: string): Promise<{
    success: boolean;
    photoUrls: string[];
    signatureUrl: string | null;
    message?: string;
  }> {
    try {
      const response = await this.makeRequest(`/deliveries/${deliveryId}/stops/${stopId}/images`);
      return {
        success: true,
        photoUrls: response.data?.photoUrls || response.photoUrls || [],
        signatureUrl: response.data?.signatureUrl || response.signatureUrl || null
      };
    } catch (error) {
      console.error('Error fetching stop images:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch stop images',
        photoUrls: [],
        signatureUrl: null
      };
    }
  }

  // Assign driver to delivery
  async assignDriver(deliveryId: string, driverId: string): Promise<{
    success: boolean;
    delivery?: Delivery;
    message?: string;
  }> {
    try {
      const response = await this.makeRequest(`/deliveries/${deliveryId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ driverId }),
      });
      return { success: true, delivery: response.data || response.delivery };
    } catch (error) {
      console.error('Error assigning driver:', error);
      return {
        success: false,
        message: error.message || 'Failed to assign driver'
      };
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

export const deliveryService = new DeliveryService();
export default deliveryService;