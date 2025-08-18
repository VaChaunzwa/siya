import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import API_BASE_URL, { API_ENDPOINTS, HTTP_METHODS } from './apiConfig';

interface User {
  uid: string;
  id: string;
  email: string;
  role: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  clientId?: string;
  tenantId?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

class AuthService {
  private currentUser: User | null = null;
  private authToken: string | null = null;
  private authStateListeners: ((user: User | null) => void)[] = [];

  constructor() {
    this.initializeAuth();
    this.setupFirebaseAuthListener();
  }

  private async initializeAuth() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        this.authToken = token;
        this.currentUser = JSON.parse(userData);
        this.notifyAuthStateChange(this.currentUser);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    console.log('🌐 Making API request:', {
      url,
      method: options.method || 'GET',
      hasAuth: !!this.authToken,
      API_BASE_URL
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('📡 API response:', {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
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
      console.error('API request failed:', error);
      throw error;
    }
  }

  private notifyAuthStateChange(user: User | null) {
    this.authStateListeners.forEach(listener => listener(user));
  }

  private setupFirebaseAuthListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in with Firebase
        try {
          const idToken = await firebaseUser.getIdToken();
          // If we don't have user data in memory, try to load from storage
          if (!this.currentUser) {
            await this.initializeAuth();
          }
        } catch (error) {
          console.error('Error getting Firebase ID token:', error);
        }
      } else {
        // User is signed out
        if (this.currentUser) {
          await this.logout();
        }
      }
    });
  }

  async setFirebaseUser(user: User, idToken: string): Promise<void> {
    try {
      this.authToken = idToken;
      this.currentUser = user;
      
      // Store in AsyncStorage
      await AsyncStorage.setItem('authToken', idToken);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      this.notifyAuthStateChange(this.currentUser);
    } catch (error) {
      console.error('Error setting Firebase user:', error);
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Starting login process...', { email: credentials.email });
      
      // First, authenticate with Firebase
      console.log('🔥 Authenticating with Firebase...');
      
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      const firebaseUser = userCredential.user;
      
      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      console.log('🔥 Firebase authentication successful, got ID token');
      
      // Send ID token to backend
      const response = await this.makeRequest(API_ENDPOINTS.LOGIN, {
        method: HTTP_METHODS.POST,
        body: JSON.stringify({
          email: credentials.email,
          idToken
        }),
      });

      console.log('🔐 Login response received:', { 
        hasToken: !!response.token, 
        hasUser: !!response.user,
        message: response.message 
      });

      // Log the complete user data for debugging
      if (response.user) {
        console.log('👤 User data received:', {
          id: response.user.id,
          email: response.user.email,
          role: response.user.role,
          tenantId: response.user.tenantId,
          firstName: response.user.firstName,
          lastName: response.user.lastName
        });
      }

      // Backend returns { message: 'Login successful', token, user } without success field
      if (response.token && response.user) {
        this.authToken = response.token;
        this.currentUser = response.user;
        
        // Store in AsyncStorage
        await AsyncStorage.setItem('authToken', response.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.user));
        
        this.notifyAuthStateChange(this.currentUser);
        
        return {
          success: true,
          user: response.user,
          token: response.token,
          message: response.message,
        };
      }

      return {
        success: false,
        message: response.message || 'Login failed',
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      // Sign out from Firebase
      await signOut(auth);
      
      if (this.authToken) {
        await this.makeRequest(API_ENDPOINTS.LOGOUT, {
          method: HTTP_METHODS.POST,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local data regardless of API call success
      this.authToken = null;
      this.currentUser = null;
      
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      
      this.notifyAuthStateChange(null);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      const response = await this.makeRequest(API_ENDPOINTS.CURRENT_USER);
      if (response.success && response.user) {
        this.currentUser = response.user;
        await AsyncStorage.setItem('userData', JSON.stringify(response.user));
        return response.user;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      // If API call fails, try to get from storage
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        this.currentUser = JSON.parse(userData);
        return this.currentUser;
      }
    }

    return null;
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  isAuthenticated(): boolean {
    return !!this.authToken && !!this.currentUser;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  getUserRole(): string | null {
    return this.currentUser?.role || null;
  }

  isDriver(): boolean {
    return this.currentUser?.role === 'driver';
  }

  isClient(): boolean {
    return this.currentUser?.role === 'client';
  }

  isFleetManager(): boolean {
    return this.currentUser?.role === 'fleet_manager';
  }

  isDispatcher(): boolean {
    return this.currentUser?.role === 'dispatcher';
  }

  getTenantId(): string | null {
    return this.currentUser?.tenantId || null;
  }
}

// Export singleton instance
export default new AuthService();