import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
  Platform,
  KeyboardAvoidingView,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ImageProxy from '../components/ImageProxy';
import ItemConfirmationModal from '../components/ItemConfirmationModal';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import SignatureScreen from 'react-native-signature-canvas';
import * as ImageManipulator from 'expo-image-manipulator';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import SyncStatusCard from '../components/SyncStatusCard';
import deliveryService, { Delivery, Stop, DeliveryItem } from '../services/deliveryService';
import storageService from '../services/storageService';
import { pdfService } from '../services/pdfService';
import { useOffline } from '../contexts/OfflineContext';

type RouteParams = {
  DriverDeliveryDetail: {
    delivery: Delivery;
  };
};

type DriverDeliveryDetailRouteProp = RouteProp<RouteParams, 'DriverDeliveryDetail'>;

const DriverDeliveryDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<DriverDeliveryDetailRouteProp>();
  const { delivery: initialDelivery } = route.params;
  const { isOnline, pendingOperationsCount, lastSyncTime } = useOffline();
  
  const [delivery, setDelivery] = useState<Delivery>(initialDelivery);
  const [loading, setLoading] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [itemConfirmationModalVisible, setItemConfirmationModalVisible] = useState(false);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientSignature, setRecipientSignature] = useState('');
  const [signaturePadVisible, setSignaturePadVisible] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryPhotos, setDeliveryPhotos] = useState<string[]>([]);
  const [completingStop, setCompletingStop] = useState(false);
  const [confirmedItems, setConfirmedItems] = useState<DeliveryItem[]>([]);

  const refreshDelivery = useCallback(async () => {
    try {
      setLoading(true);
      const updatedDelivery = await deliveryService.getDeliveryById(delivery.id);
      setDelivery(updatedDelivery);
    } catch (error) {
      console.error('Error refreshing delivery:', error);
      Alert.alert('Error', 'Failed to refresh delivery data');
    } finally {
      setLoading(false);
    }
  }, [delivery.id]);

  useEffect(() => {
    refreshDelivery();
  }, []);

  const handleStopPress = (stop: Stop) => {
    if (stop.status === 'completed') {
      // Navigate to stop detail for viewing
      navigation.navigate('StopDetail' as never, { stop, delivery } as never);
    } else {
      // Show options modal for pending stops
      setSelectedStop(stop);
      setOptionsModalVisible(true);
    }
  };

  const handleViewDirections = () => {
    if (!selectedStop) return;
    
    const address = formatAddress(selectedStop.address);
    const encodedAddress = encodeURIComponent(address);
    
    let mapsUrl = '';
    if (Platform.OS === 'ios') {
      mapsUrl = `maps://app?daddr=${encodedAddress}`;
    } else {
      mapsUrl = `google.navigation:q=${encodedAddress}`;
    }
    
    Linking.canOpenURL(mapsUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(mapsUrl);
        } else {
          // Fallback to web Google Maps
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
          Linking.openURL(webUrl);
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open maps application');
      });
    
    setOptionsModalVisible(false);
  };

  const handleOpenCompletionModal = () => {
    setRecipientName('');
    setRecipientSignature('');
    setSignatureData('');
    setReceivedDate(new Date().toISOString().split('T')[0]);
    setCompletionNotes('');
    setDeliveryPhotos([]);
    setConfirmedItems([]);
    setOptionsModalVisible(false);
    
    // Show item confirmation modal first if stop has items
    if (selectedStop?.items && selectedStop.items.length > 0) {
      setItemConfirmationModalVisible(true);
    } else {
      // If no items, go directly to completion modal
      setCompletionModalVisible(true);
    }
  };

  const handleItemConfirmationComplete = (confirmedItemsList: DeliveryItem[]) => {
    setConfirmedItems(confirmedItemsList);
    setItemConfirmationModalVisible(false);
    setCompletionModalVisible(true);
  };

  const handleItemConfirmationCancel = () => {
    setItemConfirmationModalVisible(false);
    setSelectedStop(null);
  };

  const handleCompleteStop = async () => {
    if (!selectedStop || !recipientName.trim() || !signatureData) {
      Alert.alert('Error', 'Please fill in all mandatory fields: Recipient Name and Signature');
      return;
    }

    try {
      setCompletingStop(true);
      
      console.log('Starting delivery completion process...', {
        hasRecipientName: !!recipientName.trim(),
        hasSignature: !!signatureData,
        photosCount: deliveryPhotos.length,
        hasNotes: !!completionNotes.trim()
      });

      // Debug photo data
      if (deliveryPhotos.length > 0) {
        console.log('DEBUG: Photo data details:');
        deliveryPhotos.forEach((photo, index) => {
          console.log(`Photo ${index + 1}:`, {
            length: photo.length,
            startsWithDataUri: photo.startsWith('data:'),
            format: photo.substring(0, 30) + '...'
          });
        });
      }

      // Prepare completion data with base64 photos and signature
      // The backend will handle uploading to Firebase Storage with correct directory structure
      const completionData = {
        recipientName: recipientName.trim(),
        notes: completionNotes.trim(),
        receivedDate: receivedDate,
        completedAt: new Date().toISOString(),
        completedBy: 'driver', // This should be the actual driver ID
        confirmedItems: confirmedItems.length > 0 ? confirmedItems : undefined
      };

      // Add photos and signature as base64 data for backend processing
      if (deliveryPhotos.length > 0) {
        completionData.photos = deliveryPhotos;
      }
      if (signatureData) {
        completionData.signature = signatureData;
      };

      // Log completion data for debugging
      console.log('Completing stop with data:', {
        hasRecipientName: !!completionData.recipientName,
        hasSignature: !!completionData.signature,
        photosCount: Array.isArray(completionData.photos) ? completionData.photos.length : 0,
        hasNotes: !!completionData.notes
      });

      await deliveryService.completeStop(delivery.id, selectedStop.id, completionData);
      
      Alert.alert(
        'Success', 
        'Stop completed successfully!',
        [{ text: 'OK', onPress: () => {
          setCompletionModalVisible(false);
          setSelectedStop(null);
          refreshDelivery();
        }}]
      );
    } catch (error) {
      console.error('Error completing stop:', error);
      Alert.alert('Error', `Failed to complete stop: ${error.message || 'Please try again.'}`);
    } finally {
      setCompletingStop(false);
    }
  };

  const convertImageToBase64 = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        try {
          let imageUri = result.assets[0].uri;
          
          // Resize and compress image using Expo ImageManipulator
          try {
            const resizedImage = await ImageManipulator.manipulateAsync(
              result.assets[0].uri,
              [
                { resize: { width: 800, height: 600 } }
              ],
              {
                compress: 0.8,
                format: ImageManipulator.SaveFormat.JPEG,
              }
            );
            imageUri = resizedImage.uri;
            console.log('Image resized successfully with Expo ImageManipulator');
          } catch (resizeError) {
            console.log('Image resize failed, using original image:', resizeError);
          }
          
          // Convert image to base64 data URL (same as web app)
          const base64DataUrl = await convertImageToBase64(imageUri);
          
          setDeliveryPhotos(prev => {
            const newPhotos = [...prev, base64DataUrl];
            console.log('Added photo as base64 data URL:', `delivery_photo_${newPhotos.length}.jpeg`);
            return newPhotos;
          });
        } catch (error) {
          console.error('Error processing image:', error);
          Alert.alert('Error', 'Failed to process image. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setDeliveryPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleOpenSignaturePad = () => {
    setSignaturePadVisible(true);
  };

  const handleSignatureOK = (signature: string) => {
    setSignatureData(signature);
    setRecipientSignature('Signature captured');
    setSignaturePadVisible(false);
  };

  const handleSignatureClear = () => {
    setSignatureData('');
    setRecipientSignature('');
  };

  const handleSignatureCancel = () => {
    setSignaturePadVisible(false);
  };

  const handleDownloadPDF = async (stop: Stop) => {
    try {
      const tenantCompany = {
        name: 'SIYA Logistics',
        address: {
          street: '123 Business Street',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8001',
          country: 'South Africa'
        },
        phone: '+27 21 123 4567',
        email: 'info@siya.co.za',
        logoUrl: 'https://example.com/logo.png' // Replace with actual logo URL
      };

      await pdfService.generatePDF(stop, delivery, tenantCompany);
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.delivered;
      case 'in_progress':
        return theme.colors.inProgress;
      case 'pending':
        return theme.colors.pending;
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
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-ZA', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getProgressText = () => {
    const completedStops = delivery.stops?.filter(stop => stop.status === 'completed').length || 0;
    const totalStops = delivery.stops?.length || 0;
    return `${completedStops}/${totalStops} stops completed`;
  };

  const getProgressPercentage = () => {
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

  const renderStopItem = (stop: Stop, index: number) => {
    const isCompleted = stop.status === 'completed';
    const canComplete = stop.status === 'pending' || stop.status === 'in_progress';

    return (
      <TouchableOpacity
        key={stop.id}
        style={[
          styles.stopCard,
          isCompleted && styles.completedStopCard
        ]}
        onPress={() => handleStopPress(stop)}
        activeOpacity={0.7}
      >
        <View style={styles.stopHeader}>
          <View style={styles.stopNumber}>
            <Text style={styles.stopNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.stopInfo}>
            <Text style={styles.customerName}>{stop.customerName}</Text>
            <Text style={styles.customerAddress}>{formatAddress(stop.address)}</Text>
            {stop.phone && (
              <Text style={styles.customerPhone}>{stop.phone}</Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(stop.status) }]}>
            <Text style={styles.statusText}>{getStatusText(stop.status)}</Text>
          </View>
        </View>

        {stop.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{stop.notes}</Text>
          </View>
        )}

        {isCompleted && stop.completionData && (
          <View style={styles.completionInfo}>
            <Text style={styles.completionLabel}>Completed by: {stop.completionData.recipientName}</Text>
            {stop.completionData.completedAt && (
              <Text style={styles.completionDate}>
                {formatDate(stop.completionData.completedAt)}
              </Text>
            )}
          </View>
        )}

        <View style={styles.stopActions}>
          {canComplete && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => handleStopPress(stop)}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="checkmark" size={16} color={theme.colors.onPrimary} />
                <Text style={styles.buttonText}>Complete Stop</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          {isCompleted && (
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={() => handleDownloadPDF(stop)}
            >
              <View style={[styles.buttonGradient, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Ionicons name="document-text" size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.buttonText, { color: theme.colors.onSurfaceVariant }]}>PDF</Text>
              </View>
            </TouchableOpacity>
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
        <Header 
          title={delivery.deliveryNumber} 
          showBack 
          onBackPress={() => navigation.goBack()}
        />
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading delivery details...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Delivery Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.deliveryTitle}>{delivery.deliveryNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(delivery.status)}</Text>
                </View>
              </View>
              
              <View style={styles.summaryContent}>
                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={16} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.infoText}>{delivery.clientName || 'Unknown Client'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.infoText}>{formatDate(delivery.scheduledDate)}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.infoText}>{getProgressText()}</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.secondary]}
                    style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={styles.progressText}>{Math.round(getProgressPercentage())}% Complete</Text>
              </View>
            </View>

            {/* Sync Status Card */}
            <SyncStatusCard />

            {/* Stops List */}
            <View style={styles.stopsSection}>
              <Text style={styles.sectionTitle}>Delivery Stops</Text>
              {delivery.stops?.map((stop, index) => renderStopItem(stop, index))}
            </View>
          </ScrollView>
        )}

        {/* Options Modal */}
        <Modal
          visible={optionsModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setOptionsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Stop Options</Text>
                <TouchableOpacity
                  onPress={() => setOptionsModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              {selectedStop && (
                <View style={styles.modalBody}>
                  <Text style={styles.stopDetailsText}>
                    {selectedStop.customerName}
                  </Text>
                  <Text style={styles.stopAddressText}>
                    {formatAddress(selectedStop.address)}
                  </Text>

                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={handleViewDirections}
                  >
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.secondary]}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="navigate" size={16} color={theme.colors.onPrimary} />
                      <Text style={styles.buttonText}>View Directions</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={handleOpenCompletionModal}
                  >
                    <LinearGradient
                      colors={[theme.colors.delivered, '#4CAF50']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="checkmark" size={16} color={theme.colors.onPrimary} />
                      <Text style={styles.buttonText}>Complete Delivery</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Completion Modal */}
        <Modal
          visible={completionModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCompletionModalVisible(false)}
        >
          <KeyboardAvoidingView 
            style={styles.completionModalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={styles.completionModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Complete Stop</Text>
                <TouchableOpacity
                  onPress={() => setCompletionModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              {selectedStop && (
                <ScrollView 
                  style={styles.modalBody}
                  contentContainerStyle={styles.modalBodyContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={styles.stopDetailsText}>
                    {selectedStop.customerName}
                  </Text>
                  <Text style={styles.stopAddressText}>
                    {formatAddress(selectedStop.address)}
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Recipient Name *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={recipientName}
                      onChangeText={setRecipientName}
                      placeholder="Enter recipient name"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Recipient Signature *</Text>
                    <View style={styles.signatureContainer}>
                      <TouchableOpacity
                        style={[styles.signatureButton, recipientSignature ? styles.signatureButtonSigned : null]}
                        onPress={handleOpenSignaturePad}
                      >
                        <Text style={[styles.signatureButtonText, recipientSignature ? styles.signatureButtonTextSigned : null]}>
                          {recipientSignature || 'Tap to Sign'}
                        </Text>
                      </TouchableOpacity>
                      {recipientSignature && (
                        <TouchableOpacity
                          style={styles.clearSignatureButton}
                          onPress={handleSignatureClear}
                        >
                          <Text style={styles.clearSignatureButtonText}>Clear</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Received Date *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={receivedDate}
                      onChangeText={setReceivedDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Delivery Photos (Optional)</Text>
                    <TouchableOpacity
                      style={styles.photoButton}
                      onPress={handleTakePhoto}
                    >
                      <Ionicons name="camera" size={20} color={theme.colors.primary} />
                      <Text style={styles.photoButtonText}>Take Photo</Text>
                    </TouchableOpacity>
                    
                    {deliveryPhotos.length > 0 && (
                      <ScrollView horizontal style={styles.photosContainer}>
                        {deliveryPhotos.map((photo, index) => (
                          <View key={index} style={styles.photoItem}>
                            <ImageProxy
                              source={{ uri: photo }}
                              style={styles.photoPreview}
                              resizeMode="cover"
                            />
                            <TouchableOpacity
                              style={styles.removePhotoButton}
                              onPress={() => handleRemovePhoto(index)}
                            >
                              <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Notes (Optional)</Text>
                    <TextInput
                      style={[styles.textInput, styles.notesInput]}
                      value={completionNotes}
                      onChangeText={setCompletionNotes}
                      placeholder="Add any delivery notes..."
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.completeStopButton}
                    onPress={handleCompleteStop}
                    disabled={completingStop || !recipientName.trim() || !signatureData}
                  >
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.secondary]}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {completingStop ? (
                        <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={16} color={theme.colors.onPrimary} />
                          <Text style={styles.buttonText}>Complete Stop</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Signature Pad Modal */}
        <Modal
          visible={signaturePadVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={handleSignatureCancel}
        >
          <View style={styles.signaturePadContainer}>
            <View style={styles.signaturePadHeader}>
              <Text style={styles.signaturePadTitle}>Recipient Signature</Text>
              <TouchableOpacity onPress={handleSignatureCancel}>
                <Ionicons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
            <SignatureScreen
              ref={null}
              onOK={handleSignatureOK}
              onEmpty={() => Alert.alert('Error', 'Please provide a signature')}
              descriptionText="Sign above"
              clearText="Clear"
              confirmText="Save"
              style={styles.signaturePad}
              webStyle={`
                .m-signature-pad--footer {
                  display: flex;
                  justify-content: space-between;
                  margin-top: 20px;
                }
                .m-signature-pad--footer .button {
                  background-color: ${theme.colors.primary};
                  color: white;
                  border: none;
                  border-radius: 8px;
                  padding: 12px 24px;
                  font-size: 16px;
                  cursor: pointer;
                }
                .m-signature-pad--footer .button.clear {
                  background-color: ${theme.colors.error};
                }
              `}
            />
          </View>
        </Modal>

        {/* Item Confirmation Modal */}
        <ItemConfirmationModal
          visible={itemConfirmationModalVisible}
          items={selectedStop?.items || []}
          onConfirm={handleItemConfirmationComplete}
          onCancel={handleItemConfirmationCancel}
          customerName={selectedStop?.customerName || ''}
        />
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
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant
  },
  summaryCard: {
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
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md
  },
  deliveryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface
  },
  summaryContent: {
    marginBottom: theme.spacing.md
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
    marginTop: theme.spacing.sm
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.outline,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center'
  },
  stopsSection: {
    marginBottom: theme.spacing.xl
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.md
  },
  stopCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  completedStopCard: {
    backgroundColor: theme.colors.surfaceVariant,
    borderColor: theme.colors.delivered
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm
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
    marginRight: theme.spacing.sm
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2
  },
  customerAddress: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2
  },
  customerPhone: {
    fontSize: 14,
    color: theme.colors.primary
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
  notesContainer: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.roundness
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2
  },
  notesText: {
    fontSize: 14,
    color: theme.colors.onSurface
  },
  completionInfo: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.delivered + '20',
    borderRadius: theme.roundness
  },
  completionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.delivered
  },
  completionDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2
  },
  stopActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm
  },
  completeButton: {
    flex: 1,
    borderRadius: theme.roundness
  },
  pdfButton: {
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingBottom: theme.spacing.xl,
    width: '90%',
    maxWidth: 400
  },
  completionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  completionModalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: theme.spacing.xl
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface
  },
  closeButton: {
    padding: theme.spacing.xs
  },
  modalBody: {
    padding: theme.spacing.md
  },
  modalBodyContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl
  },
  stopDetailsText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4
  },
  stopAddressText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.md
  },
  inputGroup: {
    marginBottom: theme.spacing.md
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surface
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top'
  },
  completeStopButton: {
    marginTop: theme.spacing.md,
    borderRadius: theme.roundness
  },
  // Options Modal Styles
  optionButton: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness
  },
  // Photo Styles
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm
  },
  photoButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600'
  },
  photosContainer: {
    marginTop: theme.spacing.sm,
    maxHeight: 100
  },
  photoItem: {
    width: 80,
    height: 80,
    marginRight: theme.spacing.sm,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surfaceVariant,
    position: 'relative',
    overflow: 'hidden'
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: theme.roundness
  },
  removePhotoButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.surface,
    borderRadius: 10
  },
  // Signature Pad Styles
  signaturePadContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface
  },
  signaturePadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline
  },
  signaturePadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface
  },
  signaturePad: {
    flex: 1
  },
  signatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  signatureButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
    alignItems: 'center'
  },
  signatureButtonSigned: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10'
  },
  signatureButtonText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14
  },
  signatureButtonTextSigned: {
    color: theme.colors.primary,
    fontWeight: '600'
  },
  clearSignatureButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.error,
    borderRadius: theme.roundness
  },
  clearSignatureButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
    fontWeight: '600'
  }
});

export default DriverDeliveryDetailScreen;