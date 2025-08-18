import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import deliveryService from '../services/deliveryService';
import API_BASE_URL from '../services/apiConfig';

interface RouteParams {
  delivery: {
    id: string;
    deliveryNumber: string;
    client: string;
    status: 'delivered' | 'in-progress' | 'pending';
    driver: string;
    vehicle: string;
    progress: string;
    location: string;
    date: string;
  };
}

const DeliveryNoteScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { delivery } = route.params as RouteParams;
  
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    fetchStopImages();
  }, [delivery.id]);

  const fetchStopImages = async () => {
    try {
      setLoadingImages(true);
      console.log('DeliveryNoteScreen - Starting to fetch stop images for delivery:', delivery.id);
      
      // Check if we have a specific stop from route params (like Vue component)
      const routeStop = route.params?.stop;
      if (routeStop) {
        console.log('DeliveryNoteScreen - Using specific stop from route params:', routeStop.id);
        try {
          const stopImages = await deliveryService.getStopImages(delivery.id, routeStop.id);
          console.log('DeliveryNoteScreen - Stop images response for specific stop:', stopImages);
          
          setPhotoUrls(stopImages.photoUrls || []);
          setSignatureUrl(stopImages.signatureUrl || null);
          return;
        } catch (error) {
          console.error('DeliveryNoteScreen - Error fetching images for specific stop:', error);
        }
      }
      
      // Fallback: Get delivery details to find completed stops
      const deliveryDetails = await deliveryService.getDeliveryById(delivery.id);
      console.log('DeliveryNoteScreen - Delivery details:', deliveryDetails);
      
      if (!deliveryDetails || !deliveryDetails.stops) {
        console.log('DeliveryNoteScreen - No stops found in delivery details');
        return;
      }
      
      // Filter for completed stops
      const completedStops = deliveryDetails.stops.filter(stop => 
        stop.status === 'completed' || stop.status === 'delivered'
      );
      
      console.log('DeliveryNoteScreen - Found completed stops:', completedStops.length);
      
      if (completedStops.length === 0) {
        console.log('DeliveryNoteScreen - No completed stops found');
        return;
      }
      
      // For now, just use the first completed stop (like Vue component approach)
      const firstCompletedStop = completedStops[0];
      console.log('DeliveryNoteScreen - Using first completed stop:', firstCompletedStop.id);
      
      try {
        const stopImages = await deliveryService.getStopImages(delivery.id, firstCompletedStop.id);
        console.log('DeliveryNoteScreen - Stop images response:', stopImages);
        
        setPhotoUrls(stopImages.photoUrls || []);
        setSignatureUrl(stopImages.signatureUrl || null);
        
        console.log('DeliveryNoteScreen - Final image results:', {
          photoCount: stopImages.photoUrls?.length || 0,
          hasSignature: !!stopImages.signatureUrl
        });
        
      } catch (error) {
        console.error('DeliveryNoteScreen - Error fetching images for stop:', error);
        
        // Fallback: try to extract from completion data
        try {
          const completionData = (firstCompletedStop as any).completionData;
          if (completionData) {
            const photos = completionData.photos || [];
            const signature = completionData.signature || null;
            
            setPhotoUrls(photos);
            setSignatureUrl(signature);
            
            console.log('DeliveryNoteScreen - Fallback: Using completion data:', {
              photoCount: photos.length,
              hasSignature: !!signature
            });
          }
        } catch (fallbackError) {
          console.error('DeliveryNoteScreen - Fallback image extraction also failed:', fallbackError);
        }
      }
      
    } catch (error) {
      console.error('DeliveryNoteScreen - Error fetching stop images:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return null;
    
    // Get base URL from API config (remove /api suffix)
    const baseUrl = API_BASE_URL.replace(/\/api$/, '');
    console.log('getImageUrl - baseUrl:', baseUrl, 'original url:', url);
    
    // If it's a Firebase Storage URL, use double encoding like the PDF service
    if (url.includes('storage.googleapis.com') || 
        url.includes('firebasestorage.googleapis.com') || 
        url.includes('firebasestorage.app')) {
      const doubleEncodedUrl = encodeURIComponent(encodeURIComponent(url));
      const proxyUrl = `${baseUrl}/proxy-image?url=${doubleEncodedUrl}`;
      console.log('getImageUrl - Firebase proxy URL with double encoding:', proxyUrl);
      return proxyUrl;
    }
    
    // If it's already a full URL (other than Firebase Storage), return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log('getImageUrl - Full URL returned as-is:', url);
      return url;
    }
    
    // For legacy local uploads, construct the full URL
    if (url.startsWith('/uploads')) {
      const fullUrl = `${baseUrl}${url}`;
      console.log('getImageUrl - Legacy upload URL:', fullUrl);
      return fullUrl;
    }
    
    console.log('getImageUrl - URL returned as-is:', url);
    return url;
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const openPhotoModal = (photo: string, index: number) => {
    setSelectedPhoto(photo);
    setSelectedPhotoIndex(index);
    setShowPhotoModal(true);
  };

  const closePhotoModal = () => {
    setShowPhotoModal(false);
    setSelectedPhoto(null);
    setSelectedPhotoIndex(0);
  };

  const previousPhoto = () => {
    if (selectedPhotoIndex > 0) {
      const newIndex = selectedPhotoIndex - 1;
      setSelectedPhotoIndex(newIndex);
      setSelectedPhoto(photoUrls[newIndex]);
    }
  };

  const nextPhoto = () => {
    if (selectedPhotoIndex < photoUrls.length - 1) {
      const newIndex = selectedPhotoIndex + 1;
      setSelectedPhotoIndex(newIndex);
      setSelectedPhoto(photoUrls[newIndex]);
    }
  };

  const formatLocation = (location: any) => {
    if (typeof location === 'string') {
      return location;
    }
    if (typeof location === 'object' && location !== null) {
      if (location.street || location.city || location.state) {
        return [location.street, location.city, location.state].filter(Boolean).join(', ');
      }
      if (location.addressLine1 || location.city || location.province) {
        return [location.addressLine1, location.city, location.province].filter(Boolean).join(', ');
      }
    }
    return 'Location not specified';
  };



  const deliveryItems = [
    {
      id: '1',
      description: 'Premium Fuel - Unleaded 95',
      quantity: '5000L',
      unitPrice: 'R18.50',
      total: 'R92,500.00'
    },
    {
      id: '2',
      description: 'Diesel 50ppm',
      quantity: '3000L',
      unitPrice: 'R16.80',
      total: 'R50,400.00'
    }
  ];

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.surface]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Header
          title="Deliveries Note"
          showBack
          onBackPress={handleBackPress}
          showProfile
        />
        
        {/* Delivery Header */}
        <View style={styles.deliveryHeader}>
          <Text style={styles.deliveryTitle}>{delivery.deliveryNumber}-01</Text>
          <View style={[styles.statusBadge, { backgroundColor: theme.colors.delivered }]}>
            <Text style={styles.statusText}>Delivered</Text>
          </View>
        </View>
        

        
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Company Header */}
          <View style={styles.companyCard}>
            <View style={styles.companyHeader}>
              <Text style={styles.companyName}>ARTNO</Text>
              <Text style={styles.companySubtitle}>SA</Text>
            </View>
            
            <View style={styles.companyDetails}>
              <Text style={styles.companyText}>Artno PTY Ltd</Text>
              <Text style={styles.companyAddress}>
                123 Business District, Cape Town, 8001, South Africa
              </Text>
              <Text style={styles.companyContact}>
                Tel: +27 21 123 4567 | Email: info@artno.com
              </Text>
              <Text style={styles.companyWebsite}>
                Website: www.artno.com
              </Text>
            </View>
          </View>
          
          {/* Delivery Details */}
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Delivery Details</Text>
              <View style={[styles.statusBadge, { backgroundColor: theme.colors.delivered }]}>
                <Text style={styles.statusText}>DELIVERED</Text>
              </View>
            </View>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Client:</Text>
                <Text style={styles.detailValue}>{delivery.client}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Driver:</Text>
                <Text style={styles.detailValue}>{delivery.driver}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vehicle:</Text>
                <Text style={styles.detailValue}>{delivery.vehicle}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{delivery.date}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reference:</Text>
                <Text style={styles.detailValue}>{formatLocation(delivery.location)}</Text>
              </View>
            </View>
          </View>

          {/* Photos and Signature Section */}
          <View style={styles.mediaCard}>
            <Text style={styles.cardTitle}>Delivery Proof</Text>
            
            {loadingImages && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading images...</Text>
              </View>
            )}

            {!loadingImages && photoUrls.length === 0 && !signatureUrl && (
              <View style={styles.noImagesContainer}>
                <Ionicons 
                  name="image-outline" 
                  size={48} 
                  color={theme.colors.onSurfaceVariant} 
                  style={styles.noImagesIcon}
                />
                <Text style={styles.noImagesTitle}>No delivery images available</Text>
                <Text style={styles.noImagesSubtitle}>
                  Images may not be available if the delivery was completed without photo capture, 
                  or if there was an issue syncing the delivery data.
                </Text>
              </View>
            )}

            {/* Signature Section */}
            {signatureUrl && (
              <View style={styles.signatureSection}>
                <Text style={styles.sectionTitle}>Recipient Signature</Text>
                <View style={styles.signatureContainer}>
                  <Image
                    source={{ uri: getImageUrl(signatureUrl) }}
                    style={styles.signatureImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            )}

            {/* Photos Section */}
            {photoUrls.length > 0 && (
              <View style={styles.photosSection}>
                <Text style={styles.sectionTitle}>
                  Delivery Photos ({photoUrls.length})
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.photosScrollView}
                  contentContainerStyle={styles.photosContainer}
                >
                  {photoUrls.map((photo, index) => {
                    const imageUrl = getImageUrl(photo);
                    return imageUrl ? (
                      <TouchableOpacity
                        key={index}
                        style={styles.photoThumbnail}
                        onPress={() => openPhotoModal(imageUrl, index)}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.thumbnailImage}
                          resizeMode="cover"
                        />
                        <View style={styles.photoOverlay}>
                          <Ionicons
                            name="expand-outline"
                            size={20}
                            color={theme.colors.onPrimary}
                          />
                        </View>
                      </TouchableOpacity>
                    ) : null;
                  })}
                </ScrollView>
              </View>
            )}
          </View>
          
          {/* Items to Deliver */}
          <View style={styles.itemsCard}>
            <Text style={styles.cardTitle}>Items to Deliver</Text>
            
            {deliveryItems.map((item, index) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemTotal}>{item.total}</Text>
              </View>
            ))}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>R142,900.00</Text>
            </View>
          </View>
        </ScrollView>

        {/* Photo Modal */}
        <Modal
          visible={showPhotoModal}
          transparent={true}
          animationType="fade"
          onRequestClose={closePhotoModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closePhotoModal}
              >
                <Ionicons name="close" size={24} color={theme.colors.onPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                Photo {selectedPhotoIndex + 1} of {photoUrls.length}
              </Text>
            </View>
            
            <View style={styles.modalContent}>
              {selectedPhoto && (
                <Image
                  source={{ uri: getImageUrl(selectedPhoto) }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              )}
              
              {photoUrls.length > 1 && (
                <View style={styles.modalNavigation}>
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      selectedPhotoIndex === 0 && styles.navButtonDisabled,
                    ]}
                    onPress={previousPhoto}
                    disabled={selectedPhotoIndex === 0}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={24}
                      color={
                        selectedPhotoIndex === 0
                          ? theme.colors.outline
                          : theme.colors.onPrimary
                      }
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      selectedPhotoIndex === photoUrls.length - 1 &&
                        styles.navButtonDisabled,
                    ]}
                    onPress={nextPhoto}
                    disabled={selectedPhotoIndex === photoUrls.length - 1}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={
                        selectedPhotoIndex === photoUrls.length - 1
                          ? theme.colors.outline
                          : theme.colors.onPrimary
                      }
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
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
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md
  },
  deliveryTitle: {
    fontSize: 24,
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

  content: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl
  },
  companyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.md
  },
  companyName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary
  },
  companySubtitle: {
    fontSize: 24,
    fontWeight: '300',
    color: theme.colors.primary,
    marginLeft: 4
  },
  companyDetails: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    paddingTop: theme.spacing.md
  },
  companyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4
  },
  companyAddress: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4
  },
  companyContact: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4
  },
  companyWebsite: {
    fontSize: 14,
    color: theme.colors.primary
  },
  detailsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface
  },
  detailsGrid: {
    gap: theme.spacing.sm
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    flex: 1
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right'
  },
  itemsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
    marginBottom: theme.spacing.sm
  },
  itemDetails: {
    flex: 1,
    marginRight: theme.spacing.md
  },
  itemDescription: {
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '500',
    marginBottom: 2
  },
  itemQuantity: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant
  },
  itemTotal: {
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '600'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 2,
    borderTopColor: theme.colors.primary
  },
  totalLabel: {
    fontSize: 16,
    color: theme.colors.onSurface,
    fontWeight: 'bold'
  },
  totalValue: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: 'bold'
  },
  mediaCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.onSurfaceVariant,
    fontSize: 14
  },
  noImagesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md
  },
  noImagesIcon: {
    marginBottom: theme.spacing.md
  },
  noImagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.sm,
    textAlign: 'center'
  },
  noImagesSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20
  },
  signatureSection: {
    marginBottom: theme.spacing.lg
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.sm
  },
  signatureContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center'
  },
  signatureImage: {
    width: '100%',
    height: 100
  },
  photosSection: {
    marginTop: theme.spacing.md
  },
  photosScrollView: {
    marginTop: theme.spacing.sm
  },
  photosContainer: {
    paddingRight: theme.spacing.md
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    marginRight: theme.spacing.sm,
    borderRadius: theme.roundness,
    overflow: 'hidden',
    position: 'relative'
  },
  thumbnailImage: {
    width: '100%',
    height: '100%'
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 50,
    paddingBottom: theme.spacing.md
  },
  modalCloseButton: {
    padding: theme.spacing.sm
  },
  modalTitle: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '600'
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md
  },
  modalImage: {
    width: '100%',
    height: '80%'
  },
  modalNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    top: '50%',
    marginTop: -24
  },
  navButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center'
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)'
  }
});

export default DeliveryNoteScreen;