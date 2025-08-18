// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'https://api-xmxd6n643a-uc.a.run.app/api'  // Firebase Functions URL for development
  : 'https://api-xmxd6n643a-uc.a.run.app/api';  // Firebase Functions URL for production

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  CURRENT_USER: '/auth/profile',

  // Delivery endpoints
  DELIVERIES: '/deliveries',
  DELIVERY_BY_ID: (id: string) => `/deliveries/${id}`,
  DELIVERIES_BY_DRIVER: (driverId: string) => `/deliveries/driver/${driverId}`,
  DELIVERY_STATS: '/deliveries/stats',

  // Stop endpoints
  DELIVERY_STOPS: (deliveryId: string) => `/deliveries/${deliveryId}/stops`,
  STOP_BY_ID: (deliveryId: string, stopId: string) =>
    `/deliveries/${deliveryId}/stops/${stopId}`,
  STOP_IMAGES: (deliveryId: string, stopId: string) =>
    `/deliveries/${deliveryId}/stops/${stopId}/images`,
  UPDATE_STOP_STATUS: (deliveryId: string, stopId: string) =>
    `/deliveries/${deliveryId}/stops/${stopId}/status`,
  COMPLETE_STOP: (deliveryId: string, stopId: string) =>
    `/deliveries/${deliveryId}/stops/${stopId}/complete`,

  // Vehicle endpoints
  VEHICLES: '/vehicles',
  VEHICLE_BY_ID: (id: string) => `/vehicles/${id}`,
  VEHICLE_CHECKLISTS: '/vehicle-checklists',
  VEHICLE_CHECKLIST_BY_ID: (id: string) => `/vehicle-checklists/${id}`,
  DRIVER_CHECKLISTS: (driverId: string) => `/vehicle-checklists/driver/${driverId}`,
};

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

export default API_BASE_URL;
