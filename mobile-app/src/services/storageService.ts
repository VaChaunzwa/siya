import { getStorage, ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import app, { db } from '../config/firebase';
import authService from './authService';
import networkService from './networkService';

// Initialize Firebase Storage
const storage = getStorage(app);

interface UploadResult {
  downloadURL: string;
  filePath: string;
  metadata: {
    size: number;
    contentType: string;
    timeCreated: string;
  };
}

interface VehicleInspectionData {
  vehicleId: string;
  driverId: string;
  checklistItems?: any[];
  items?: any[]; // Support both property names for backward compatibility
  signature: string;
  photos?: string[];
  completedAt: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: number;
  };
}

class StorageService {
  private readonly TENANT_ID = '2e0cbd91-b40d-4c3e-b8c7-ad39750b8a4a';
  private readonly INSPECTION_PATH = `tenants/${this.TENANT_ID}/vehicle_inspections`;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_BASE = 1000; // 1 second base delay

  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check network connectivity before each attempt
        if (!networkService.getConnectionStatus()) {
          throw new Error('No network connection available');
        }
        
        console.log(`${operationName}: Attempt ${attempt}/${maxRetries}`);
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`${operationName}: Attempt ${attempt} failed:`, error.message);
        
        // Don't retry on certain errors
        if (error.message.includes('Invalid signature format') || 
            error.message.includes('User not authenticated') ||
            error.message.includes('No network connection')) {
          throw error;
        }
        
        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = this.RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
        console.log(`${operationName}: Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error(`${operationName} failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  private async uriToBlob(uri: string, timeout: number = 30000): Promise<Blob> {
    console.log('uriToBlob: starting for uri length:', uri.length);
    console.log('uriToBlob: uri starts with:', uri.substring(0, 50));
    
    try {
      // Check if it's a data URI
      if (uri.startsWith('data:')) {
        console.log('uriToBlob: processing data URI...');
        
        // For React Native, we need to use a different approach
        // Create a Response object from the data URI and then get the blob
        try {
          console.log('uriToBlob: creating response from data URI...');
          const response = new Response(uri);
          console.log('uriToBlob: response created, getting blob...');
          const blob = await response.blob();
          console.log('uriToBlob: blob created from data URI, size:', blob.size, 'type:', blob.type);
          return blob;
        } catch (responseError) {
          console.log('uriToBlob: Response method failed, trying manual conversion...');
          
          // Fallback: manual conversion
          const [header, data] = uri.split(',');
          if (!data) {
            throw new Error('Invalid data URI format');
          }
          
          // Extract mime type from header
          const mimeMatch = header.match(/data:([^;]+)/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
          
          console.log('uriToBlob: extracted mime type:', mimeType);
          console.log('uriToBlob: data length:', data.length);
          
          // Try creating blob with just the base64 string
          const blob = new Blob([data], { type: mimeType });
          console.log('uriToBlob: blob created manually, size:', blob.size, 'type:', blob.type);
          return blob;
        }
      } else {
        // Handle regular URIs with fetch
        console.log('uriToBlob: calling fetch for regular URI...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await fetch(uri, {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          
          console.log('uriToBlob: fetch response status:', response.status, response.statusText);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          console.log('uriToBlob: converting response to blob...');
          const blob = await response.blob();
          console.log('uriToBlob: blob created from fetch, size:', blob.size, 'type:', blob.type);
          return blob;
        } finally {
          clearTimeout(timeoutId);
        }
      }
    } catch (error) {
      console.error('uriToBlob: error occurred:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: Failed to convert URI to blob');
      }
      throw error;
    }
  }

  /**
   * Upload a photo to Firebase Storage from a file URI
   */
  async uploadPhoto(
    imageUri: string,
    fileName: string,
    folder: string = 'photos'
  ): Promise<UploadResult> {
    console.log(`uploadPhoto: starting for ${fileName}`);
    
    return this.retryOperation(async () => {
      console.log('uploadPhoto: converting URI to Blob...');
      const blob = await this.uriToBlob(imageUri);
      console.log('uploadPhoto: URI converted to Blob successfully.');
      
      // Validate blob size (max 10MB for photos)
      if (blob.size > 10 * 1024 * 1024) {
        throw new Error('Photo file too large. Maximum size is 10MB.');
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = `${this.INSPECTION_PATH}/${folder}/${timestamp}_${fileName}`;

      console.log(`uploadPhoto: uploading to ${filePath}, size: ${blob.size} bytes`);
      const storageRef = ref(storage, filePath);
      
      // Determine content type from blob or default to jpeg
      const contentType = blob.type || 'image/jpeg';
      
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType,
        customMetadata: {
          'originalFileName': fileName,
          'uploadTimestamp': new Date().toISOString()
        }
      });
      console.log('uploadPhoto: upload successful.');
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        downloadURL,
        filePath,
        metadata: {
          size: snapshot.metadata.size,
          contentType: snapshot.metadata.contentType || contentType,
          timeCreated: snapshot.metadata.timeCreated
        }
      };
    }, `uploadPhoto(${fileName})`);
  }

  /**
   * Upload signature to Firebase Storage from a data URI
   */
  async uploadSignature(signatureDataUri: string, driverId: string): Promise<UploadResult> {
    console.log('uploadSignature: starting...');
    
    if (!signatureDataUri.startsWith('data:image/png;base64,')) {
      throw new Error('Invalid signature format. Expected data URI.');
    }

    return this.retryOperation(async () => {
      console.log('uploadSignature: converting data URI to Blob...');
      const blob = await this.uriToBlob(signatureDataUri);
      console.log('uploadSignature: data URI converted to Blob successfully.');

      // Validate blob size (max 5MB for signatures)
      if (blob.size > 5 * 1024 * 1024) {
        throw new Error('Signature file too large. Maximum size is 5MB.');
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `signature_${driverId}_${timestamp}.png`;
      const filePath = `${this.INSPECTION_PATH}/signatures/${fileName}`;
      
      console.log(`uploadSignature: uploading to ${filePath}, size: ${blob.size} bytes`);
      const storageRef = ref(storage, filePath);
      
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: 'image/png',
        customMetadata: {
          'uploadedBy': driverId,
          'uploadTimestamp': new Date().toISOString()
        }
      });

      console.log('uploadSignature: upload successful.');
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        downloadURL,
        filePath,
        metadata: {
          size: snapshot.metadata.size,
          contentType: snapshot.metadata.contentType || 'image/png',
          timeCreated: snapshot.metadata.timeCreated
        }
      };
    }, 'uploadSignature');
  }

  /**
   * Save vehicle inspection data to Firestore
   */
  async saveVehicleInspection(inspectionData: VehicleInspectionData): Promise<string> {
    console.log('saveVehicleInspection: starting...');
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get checklist items (support both property names)
      const checklistItems = inspectionData.checklistItems || inspectionData.items || [];

      // Upload signature
      let signatureURL = '';
      if (inspectionData.signature) {
        console.log('saveVehicleInspection: uploading signature...');
        const signatureResult = await this.uploadSignature(inspectionData.signature, inspectionData.driverId);
        signatureURL = signatureResult.downloadURL;
        console.log('saveVehicleInspection: signature uploaded successfully.');
      }

      // Upload photos for each checklist item
      console.log('saveVehicleInspection: uploading photos...');
      const updatedChecklistItems = await Promise.all(
        checklistItems.map(async (item) => {
          if (item.photos && item.photos.length > 0) {
            const uploadedPhotos = await Promise.all(
              item.photos.map(async (photoUri: string, index: number) => {
                const fileName = `${item.id}_photo_${index + 1}.jpg`;
                console.log(`saveVehicleInspection: uploading photo ${fileName}`);
                const result = await this.uploadPhoto(photoUri, fileName, `checklist_items/${item.id}`);
                return result.downloadURL;
              })
            );
            return { ...item, photos: uploadedPhotos };
          }
          return item;
        })
      );
      console.log('saveVehicleInspection: photos uploaded successfully.');

      // Prepare the inspection document
      const inspectionDoc = {
        vehicleId: inspectionData.vehicleId,
        driverId: inspectionData.driverId,
        driverName: user.name || user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown Driver',
        checklistItems: updatedChecklistItems,
        signature: signatureURL,
        completedAt: serverTimestamp(),
        completedDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        tenantId: this.TENANT_ID,
        status: 'completed',
        // Add geolocation if provided
        ...(inspectionData.location && {
          location: {
            latitude: inspectionData.location.latitude,
            longitude: inspectionData.location.longitude,
            accuracy: inspectionData.location.accuracy,
            timestamp: inspectionData.location.timestamp,
            address: null // Will be populated by reverse geocoding if needed
          }
        })
      };

      const docRef = await addDoc(
        collection(db, `tenants/${this.TENANT_ID}/vehicle_inspections`),
        inspectionDoc
      );

      console.log('Vehicle inspection saved with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving vehicle inspection:', error);
      throw new Error(`Failed to save vehicle inspection: ${error.message}`);
    }
  }

  /**
   * Upload multiple photos in batch
   */
  async uploadPhotos(photos: { uri: string; fileName: string }[]): Promise<UploadResult[]> {
    try {
      const uploadPromises = photos.map(photo =>
        this.uploadPhoto(photo.uri, photo.fileName)
      );

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading photos:', error);
      throw new Error('Failed to upload photos');
    }
  }

  /**
   * Upload delivery completion photos and signature to Firebase Storage
   */
  async uploadDeliveryCompletionData(
    deliveryId: string,
    stopId: string,
    photos: string[],
    signature?: string,
    driverId?: string
  ): Promise<{
    photoUrls: string[];
    signatureUrl?: string;
  }> {
    console.log('uploadDeliveryCompletionData: starting...');
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const currentDriverId = driverId || user.uid || 'unknown';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Upload photos to Firebase Storage
      let photoUrls: string[] = [];
      if (photos && photos.length > 0) {
        console.log(`uploadDeliveryCompletionData: uploading ${photos.length} photos...`);
        
        const photoUploadPromises = photos.map(async (photoDataUri, index) => {
          try {
            console.log(`uploadDeliveryCompletionData: processing photo ${index + 1}, data URI length: ${photoDataUri.length}`);
            console.log(`uploadDeliveryCompletionData: photo ${index + 1} data URI starts with: ${photoDataUri.substring(0, 50)}...`);
            
            const fileName = `photo_${index + 1}_${timestamp}.jpg`;
            
            // Convert data URI to blob for upload
            console.log(`uploadDeliveryCompletionData: converting photo ${index + 1} data URI to blob...`);
            const blob = await this.uriToBlob(photoDataUri);
            console.log(`uploadDeliveryCompletionData: photo ${index + 1} blob created, size: ${blob.size} bytes, type: ${blob.type}`);
            
            // Validate blob size (max 10MB for photos)
            if (blob.size > 10 * 1024 * 1024) {
              throw new Error(`Photo ${index + 1} file too large. Maximum size is 10MB.`);
            }
            
            // Use correct delivery path structure: /tenants/tenant_siya_deliveries/deliveries/DEL00001/photos
            const filePath = `tenants/${this.TENANT_ID}_deliveries/deliveries/${deliveryId}/photos/${fileName}`;
            console.log(`uploadDeliveryCompletionData: uploading photo ${index + 1} to ${filePath}`);
            
            const storageRef = ref(storage, filePath);
            const snapshot = await uploadBytes(storageRef, blob, {
              contentType: 'image/jpeg',
              customMetadata: {
                'deliveryId': deliveryId,
                'stopId': stopId,
                'uploadedBy': currentDriverId,
                'uploadTimestamp': new Date().toISOString(),
                'photoIndex': (index + 1).toString()
              }
            });
            
            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log(`uploadDeliveryCompletionData: photo ${index + 1} uploaded successfully to: ${downloadURL}`);
            return downloadURL;
          } catch (photoError) {
            console.error(`uploadDeliveryCompletionData: failed to upload photo ${index + 1}:`, photoError);
            throw new Error(`Failed to upload photo ${index + 1}: ${photoError.message}`);
          }
        });
        
        photoUrls = await Promise.all(photoUploadPromises);
        console.log('uploadDeliveryCompletionData: all photos uploaded successfully.');
      }

      // Upload signature to Firebase Storage
      let signatureUrl: string | undefined;
      if (signature) {
        console.log('uploadDeliveryCompletionData: uploading signature...');
        
        if (!signature.startsWith('data:image/png;base64,')) {
          throw new Error('Invalid signature format. Expected data URI.');
        }

        const blob = await this.uriToBlob(signature);
        
        // Validate blob size (max 5MB for signatures)
        if (blob.size > 5 * 1024 * 1024) {
          throw new Error('Signature file too large. Maximum size is 5MB.');
        }

        const fileName = `signature_${timestamp}.png`;
        const filePath = `tenants/${this.TENANT_ID}_deliveries/deliveries/${deliveryId}/signatures/${fileName}`;
        
        console.log(`uploadDeliveryCompletionData: uploading signature to ${filePath}`);
        const storageRef = ref(storage, filePath);
        
        const snapshot = await uploadBytes(storageRef, blob, {
          contentType: 'image/png',
          customMetadata: {
            'deliveryId': deliveryId,
            'stopId': stopId,
            'uploadedBy': currentDriverId,
            'uploadTimestamp': new Date().toISOString()
          }
        });

        signatureUrl = await getDownloadURL(snapshot.ref);
        console.log('uploadDeliveryCompletionData: signature uploaded successfully.');
      }

      return {
        photoUrls,
        signatureUrl
      };
    } catch (error) {
      console.error('Error uploading delivery completion data:', error);
      throw new Error(`Failed to upload delivery completion data: ${error.message}`);
    }
  }
}

export default new StorageService();