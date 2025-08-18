import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import ImageProxy from '../components/ImageProxy';
import { DeliveryStop, Delivery } from '../services/deliveryService';
import deliveryService from '../services/deliveryService';
import { pdfService } from '../services/pdfService';

interface RouteParams {
  stop: DeliveryStop;
  delivery: Delivery;
  stopNumber: number;
}

const StopDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { stop, delivery, stopNumber } = route.params as RouteParams;
  
  const [images, setImages] = useState<{ photoUrls: string[]; signatureUrl: string | null }>({ photoUrls: [], signatureUrl: null });
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const handleBackPress = () => {
    navigation.goBack();
  };

  useEffect(() => {
    if (stop.status === 'completed') {
      loadStopImages();
    }
  }, [stop.id, delivery.id]);

  const loadStopImages = async () => {
    try {
      setLoadingImages(true);
      const stopImages = await deliveryService.getStopImages(delivery.id, stop.id);
      setImages(stopImages);
    } catch (error) {
      console.error('Error loading stop images:', error);
      Alert.alert('Error', 'Failed to load delivery images');
    } finally {
      setLoadingImages(false);
    }
  };

  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
  };

  const getStatusColor = (status: string) => {
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

  const getStatusText = (status: string) => {
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

  const handleDownloadPDF = async () => {
    try {
      // Get tenant company information (you should replace this with actual tenant data)
      const tenantCompany = {
        name: 'SIYA DELIVERIES',
        logoUrl: null, // Add actual tenant logo URL here
        address: {
          addressLine1: 'Nyalu House',
          addressLine2: '44 Siemert Road',
          suburb: 'Doornfontein',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2094'
        }
      };

      const result = await pdfService.generatePDF({
        stop,
        delivery,
        stopNumber,
        client: { name: 'BPSA' },
        company: tenantCompany,
      });

      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate delivery note PDF');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
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

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.surface]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Header
          title={`Stop ${stopNumber}`}
          onBackPress={handleBackPress}
          showBackButton
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.scrollContent}>
            {/* Stop Header */}
            <View style={styles.stopHeader}>
              <View style={styles.stopNumber}>
                <Text style={styles.stopNumberText}>{stopNumber}</Text>
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.deliveryNumber}>{delivery.deliveryNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(stop.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(stop.status)}</Text>
                </View>
              </View>
            </View>

            {/* Customer Information */}
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Customer Information</Text>
              
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color={theme.colors.onSurfaceVariant} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Customer Name</Text>
                  <Text style={styles.infoValue}>{stop.customerName}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color={theme.colors.onSurfaceVariant} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{formatAddress(stop.address)}</Text>
                </View>
              </View>

              {stop.customerPhone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={16} color={theme.colors.onSurfaceVariant} style={styles.infoIcon} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{stop.customerPhone}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Delivery Information */}
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Delivery Information</Text>
              
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color={theme.colors.onSurfaceVariant} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Driver</Text>
                  <Text style={styles.infoValue}>{delivery.driverName || 'Not assigned'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="car-outline" size={16} color={theme.colors.onSurfaceVariant} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Vehicle</Text>
                  <Text style={styles.infoValue}>{delivery.vehicleRegistration || 'Not assigned'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.onSurfaceVariant} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Scheduled Date</Text>
                  <Text style={styles.infoValue}>{formatDate(delivery.scheduledDate)}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="flag-outline" size={16} color={theme.colors.onSurfaceVariant} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Priority</Text>
                  <Text style={styles.infoValue}>{delivery.priority || 'Normal'}</Text>
                </View>
              </View>
            </View>

            {/* Notes */}
            {stop.notes && (
              <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>Notes</Text>
                <Text style={styles.notesText}>{stop.notes}</Text>
              </View>
            )}

            {/* Completion Data */}
            {stop.completionData && (
              <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>Completion Details</Text>
                <View style={styles.completionData}>
                  {Object.entries(stop.completionData).map(([key, value]) => (
                    <View key={key} style={styles.completionRow}>
                      <Text style={styles.completionKey}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</Text>
                      <Text style={styles.completionValue}>{String(value)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Delivery Images */}
            {stop.status === 'completed' && (
              <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>Delivery Images</Text>
                {loadingImages ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Loading images...</Text>
                  </View>
                ) : (
                  <View>
                    {/* Delivery Photos */}
                    {images.photoUrls.length > 0 && (
                      <View style={styles.imageSection}>
                        <Text style={styles.imageSectionTitle}>Delivery Photos</Text>
                        <View style={styles.imageGrid}>
                          {images.photoUrls.map((photoUrl, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.imageContainer}
                              onPress={() => handleImagePress(photoUrl)}
                            >
                              <ImageProxy
                                source={{ uri: photoUrl }}
                                style={styles.thumbnailImage}
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Signature */}
                    {images.signatureUrl && (
                      <View style={styles.imageSection}>
                        <Text style={styles.imageSectionTitle}>Recipient Signature</Text>
                        <TouchableOpacity
                          style={styles.signatureContainer}
                          onPress={() => handleImagePress(images.signatureUrl!)}
                        >
                          <ImageProxy
                            source={{ uri: images.signatureUrl }}
                            style={styles.signatureImage}
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* No Images Message */}
                    {images.photoUrls.length === 0 && !images.signatureUrl && (
                      <View style={styles.noImagesContainer}>
                        <Ionicons name="image-outline" size={48} color={theme.colors.onSurfaceVariant} />
                        <Text style={styles.noImagesText}>No delivery images available</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Download Button */}
            <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPDF} activeOpacity={0.8}>
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
                <Text style={styles.downloadText}>Download Stop Note PDF</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseArea} onPress={closeImageModal}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={closeImageModal}>
                <Ionicons name="close" size={30} color="white" />
              </TouchableOpacity>
              {selectedImage && (
                <ImageProxy
                  source={{ uri: selectedImage }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
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
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md
  },
  stopNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md
  },
  stopNumberText: {
    color: theme.colors.onPrimary,
    fontSize: 18,
    fontWeight: 'bold'
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  deliveryNumber: {
    fontSize: 20,
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
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  cardTitle: {
    fontSize: 18,
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
  notesText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
    fontStyle: 'italic'
  },
  completionData: {
    marginTop: theme.spacing.sm
  },
  completionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline
  },
  completionKey: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    flex: 1
  },
  completionValue: {
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right'
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant
  },
  imageSection: {
    marginBottom: theme.spacing.md
  },
  imageSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.sm
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.roundness,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  thumbnailImage: {
    width: '100%',
    height: '100%'
  },
  signatureContainer: {
    height: 120,
    borderRadius: theme.roundness,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceVariant
  },
  signatureImage: {
    width: '100%',
    height: '100%'
  },
  noImagesContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg
  },
  noImagesText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.sm,
    textAlign: 'center'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: theme.spacing.sm
  },
  fullScreenImage: {
    width: '90%',
    height: '80%'
  }
});

export default StopDetailScreen;