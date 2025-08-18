import API_BASE_URL, {API_ENDPOINTS} from './apiConfig';
import authService from './authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Vehicle {
  id: string;
  name: string;
  type: 'van' | 'truck' | 'motorcycle' | 'car';
  licensePlate: string;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  driverAssigned?: string;
  currentLocation?: string;
  fuelLevel: number;
  mileage: number;
  lastMaintenance: string;
  nextMaintenance: string;
  capacity: string;
  year: number;
  make: string;
  model: string;
}

export interface VehicleChecklistItem {
  id: string;
  category: 'exterior' | 'interior';
  title: string;
  description: string;
  status: 'pending' | 'passed' | 'failed';
  comments?: string;
  photos?: string[];
}

export interface VehicleChecklist {
  id: string;
  vehicleId: string;
  driverId: string;
  date: string;
  items: VehicleChecklistItem[];
  signature?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

class VehicleService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    try {
      let token = authService.getAuthToken();
      
      if (!token) {
        token = await AsyncStorage.getItem('authToken');
      }
      
      if (token) {
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };
      }
      
      return {
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return {
        'Content-Type': 'application/json',
      };
    }
  }

  // Get available vehicles for selection
  async getAvailableVehicles(): Promise<Vehicle[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.VEHICLES}?availability=available`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch vehicles: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.vehicles || data.vehicles || data.data || [];
    } catch (error) {
      console.error('Error fetching available vehicles:', error);
      throw error;
    }
  }

  // Get vehicle by ID
  async getVehicleById(vehicleId: string): Promise<Vehicle> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.VEHICLE_BY_ID(vehicleId)}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch vehicle: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.vehicle || data.data;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw error;
    }
  }

  async createVehicleChecklist(checklist: Omit<VehicleChecklist, 'id' | 'createdAt' | 'updatedAt'>): Promise<VehicleChecklist> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.VEHICLE_CHECKLISTS}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(checklist),
      });

      if (!response.ok) {
        throw new Error(`Failed to create vehicle checklist: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.checklist || data.data;
    } catch (error) {
      console.error('Error creating vehicle checklist:', error);
      throw error;
    }
  }

  async updateVehicleChecklist(id: string, updates: Partial<VehicleChecklist>): Promise<VehicleChecklist> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.VEHICLE_CHECKLIST_BY_ID(id)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update vehicle checklist: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.checklist || data.data;
    } catch (error) {
      console.error('Error updating vehicle checklist:', error);
      throw error;
    }
  }

  async getDriverChecklists(driverId: string): Promise<VehicleChecklist[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.DRIVER_CHECKLISTS(driverId)}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch driver checklists: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.checklists || data.data || [];
    } catch (error) {
      console.error('Error fetching driver checklists:', error);
      throw error;
    }
  }
}

export default new VehicleService();