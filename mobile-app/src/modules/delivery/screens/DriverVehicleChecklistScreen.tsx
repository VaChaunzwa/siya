import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  SafeAreaView,
} from 'react-native';
import {useNavigation, DrawerActions} from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SignatureScreen from 'react-native-signature-canvas';
import { LinearGradient } from 'expo-linear-gradient';
import {useAuth} from '../../../shared/contexts/AuthContext';
import vehicleService, {Vehicle, VehicleChecklist, VehicleChecklistItem} from '../../../services/vehicleService';
import {COLORS, SPACING, GLASS_THEME} from '../../../shared/config/constants';
import { theme } from '../../../theme/theme';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorDisplay from '../../../components/ErrorDisplay';
import GlassBackground from '../../../components/GlassBackground';
import GlassCard from '../../../components/GlassCard';
import GlassButton from '../../../components/GlassButton';
import Header from '../../../components/Header';

const CHECKLIST_ITEMS: Omit<VehicleChecklistItem, 'id' | 'status' | 'comments' | 'photos'>[] = [
  // Exterior checks
  {
    category: 'exterior',
    title: 'General Look',
    description: 'Walk a full circle around your vehicle. Look for any obvious new damage, leaning to one side, or hazards around the vehicle.',
  },
  {
    category: 'exterior',
    title: 'Tyres - Visual Check',
    description: 'Glance at all four tyres. Do any look low on air?',
  },
  {
    category: 'exterior',
    title: 'Tyres - Obstructions',
    description: 'Check for any nails, glass, or sharp objects embedded in the tread.',
  },
  {
    category: 'exterior',
    title: 'Under the Vehicle - Leaks',
    description: 'Look for any puddles or fresh drips on the ground under the engine or other parts of the car.',
  },
  {
    category: 'exterior',
    title: 'Windows, Mirrors & Lights - Clarity',
    description: 'Ensure all windows, mirrors, and light lenses are clean enough for clear visibility.',
  },
  {
    category: 'exterior',
    title: 'Windows, Mirrors & Lights - Damage',
    description: 'Check for new cracks on windows that could obstruct your view.',
  },
  {
    category: 'exterior',
    title: 'License Disc',
    description: 'Confirm your vehicle license disc on the windscreen is valid.',
  },
  {
    category: 'exterior',
    title: 'Number Plates',
    description: 'Ensure both number plates are secure, clean, and visible.',
  },
  // Interior checks
  {
    category: 'interior',
    title: 'Clear Driver\'s Area',
    description: 'Ensure the floor is free of rubbish, the floor mat is properly secured, and no items can roll under the brake or accelerator pedals.',
  },
  {
    category: 'interior',
    title: 'Adjust',
    description: 'Set your seat, steering wheel, and mirrors for your optimal driving position.',
  },
  {
    category: 'interior',
    title: 'Warning Lights',
    description: 'Turn the ignition on. All dashboard warning lights should illuminate and then turn off after a few seconds.',
  },
  {
    category: 'interior',
    title: 'Fuel Gauge',
    description: 'Check if you have enough fuel for your journey.',
  },
  {
    category: 'interior',
    title: 'Fasten Seatbelt',
    description: 'Buckle up.',
  },
];

const DriverVehicleChecklistScreen: React.FC = () => {
  const {user} = useAuth();
  const navigation = useNavigation();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleDropdownVisible, setVehicleDropdownVisible] = useState(false);
  const [checklistItems, setChecklistItems] = useState<VehicleChecklistItem[]>([]);
  const [signature, setSignature] = useState<string>('');
  const [signatureData, setSignatureData] = useState<string>('');
  const [signaturePadVisible, setSignaturePadVisible] = useState(false);
  const [location, setLocation] = useState<{latitude: number; longitude: number; accuracy?: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadVehicles();
    initializeChecklistItems();
    requestLocationPermission();
  }, []);

  const handleMenuPress = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy || undefined,
        });
      } else {
        console.warn('Location permission not granted');
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadVehicles = async () => {
    try {
      setIsLoading(true);
      const availableVehicles = await vehicleService.getAvailableVehicles();
      setVehicles(availableVehicles);
    } catch (err) {
      setError('Failed to load vehicles');
      console.error('Error loading vehicles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeChecklistItems = () => {
    const items: VehicleChecklistItem[] = CHECKLIST_ITEMS.map((item, index) => ({
      ...item,
      id: `item_${index}`,
      status: 'pending',
      comments: '',
      photos: [],
    }));
    setChecklistItems(items);
  };

  const updateItemStatus = (itemId: string, status: 'passed' | 'failed') => {
    setChecklistItems(prev =>
      prev.map(item =>
        item.id === itemId ? {...item, status} : item
      )
    );
  };

  const openCommentModal = (itemId: string) => {
    const item = checklistItems.find(i => i.id === itemId);
    setCurrentItemId(itemId);
    setCommentText(item?.comments || '');
    setShowCommentModal(true);
  };

  const saveComment = () => {
    if (currentItemId) {
      setChecklistItems(prev =>
        prev.map(item =>
          item.id === currentItemId ? {...item, comments: commentText} : item
        )
      );
    }
    setShowCommentModal(false);
    setCurrentItemId(null);
    setCommentText('');
  };

  const takePhoto = async (itemId: string) => {
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
          
          // Convert image to base64 data URL
          const base64DataUrl = await convertImageToBase64(imageUri);
          
          setChecklistItems(prev =>
            prev.map(item =>
              item.id === itemId
                ? {...item, photos: [...(item.photos || []), base64DataUrl]}
                : item
            )
          );
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

  const removePhoto = (itemId: string, photoIndex: number) => {
    setChecklistItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? {
              ...item,
              photos: item.photos?.filter((_, index) => index !== photoIndex) || [],
            }
          : item
      )
    );
  };

  const handleOpenSignaturePad = () => {
    setSignaturePadVisible(true);
  };

  const handleSignatureOK = (signatureBase64: string) => {
    setSignatureData(signatureBase64);
    setSignature('Signature captured');
    setSignaturePadVisible(false);
  };

  const handleSignatureClear = () => {
    setSignatureData('');
    setSignature('');
  };

  const handleSignatureCancel = () => {
    setSignaturePadVisible(false);
  };

  const submitChecklist = async () => {
    if (!selectedVehicle) {
      Alert.alert('Error', 'Please select a vehicle');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    const pendingItems = checklistItems.filter(item => item.status === 'pending');
    if (pendingItems.length > 0) {
      Alert.alert('Error', 'Please complete all checklist items');
      return;
    }

    if (!signatureData) {
      Alert.alert('Error', 'Please provide your signature');
      return;
    }

    try {
      setIsLoading(true);
      
      const checklist: Omit<VehicleChecklist, 'id' | 'createdAt' | 'updatedAt'> = {
        vehicleId: selectedVehicle.id,
        driverId: user.id,
        date: new Date().toISOString(),
        items: checklistItems,
        signature: signatureData,
        completed: true,
        ...(location && {
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: new Date().toISOString(),
          }
        }),
      };

      await vehicleService.createVehicleChecklist(checklist);
      
      Alert.alert(
        'Success',
        'Vehicle checklist completed successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to submit checklist');
      console.error('Error submitting checklist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderVehicleSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Vehicle</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setVehicleDropdownVisible(!vehicleDropdownVisible)}
      >
        <Text style={styles.dropdownButtonText}>
          {selectedVehicle 
            ? `${selectedVehicle.make} ${selectedVehicle.model} - ${selectedVehicle.licensePlate}`
            : 'Select a vehicle...'
          }
        </Text>
        <Ionicons 
          name={vehicleDropdownVisible ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={theme.colors.onSurface} 
        />
      </TouchableOpacity>
      
      {vehicleDropdownVisible && (
        <View style={styles.dropdownList}>
          {vehicles.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.dropdownItem,
                selectedVehicle?.id === vehicle.id && styles.selectedDropdownItem
              ]}
              onPress={() => {
                setSelectedVehicle(vehicle);
                setVehicleDropdownVisible(false);
              }}
            >
              <Text style={[
                styles.dropdownItemText,
                selectedVehicle?.id === vehicle.id && styles.selectedDropdownItemText
              ]}>
                {vehicle.make} {vehicle.model} - {vehicle.licensePlate}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderChecklistItem = (item: VehicleChecklistItem) => (
    <GlassCard key={item.id} style={styles.checklistItem}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <View style={styles.statusButtons}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              styles.passButton,
              item.status === 'passed' && styles.activeButton,
            ]}
            onPress={() => updateItemStatus(item.id, 'passed')}
          >
            <Icon
              name="check"
              size={16}
              color={item.status === 'passed' ? COLORS.WHITE : COLORS.SUCCESS}
            />
            <Text
              style={[
                styles.statusButtonText,
                item.status === 'passed' && styles.activeButtonText,
              ]}
            >
              Pass
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusButton,
              styles.failButton,
              item.status === 'failed' && styles.activeButton,
            ]}
            onPress={() => updateItemStatus(item.id, 'failed')}
          >
            <Icon
              name="close"
              size={16}
              color={item.status === 'failed' ? COLORS.WHITE : COLORS.DANGER}
            />
            <Text
              style={[
                styles.statusButtonText,
                item.status === 'failed' && styles.activeButtonText,
              ]}
            >
              Fail
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.itemDescription}>{item.description}</Text>
      
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openCommentModal(item.id)}
        >
          <Icon name="comment" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.actionButtonText}>
            {item.comments ? 'Edit Comment' : 'Add Comment'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => takePhoto(item.id)}
        >
          <Icon name="camera-alt" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.actionButtonText}>Add Photo</Text>
        </TouchableOpacity>
      </View>

      {item.comments && (
        <View style={styles.commentContainer}>
          <Text style={styles.commentLabel}>Comment:</Text>
          <Text style={styles.commentText}>{item.comments}</Text>
        </View>
      )}

      {item.photos && item.photos.length > 0 && (
        <View style={styles.photosContainer}>
          <Text style={styles.photosLabel}>Photos:</Text>
          <ScrollView horizontal style={styles.photosScroll}>
            {item.photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{uri: photo}} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(item.id, index)}
                >
                  <Icon name="close" size={16} color={COLORS.WHITE} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </GlassCard>
  );

  const renderSignatureSection = () => (
    <GlassCard style={styles.card}>
      <Text style={styles.sectionTitle}>Driver Signature</Text>
      <View style={styles.signatureContainer}>
        <TouchableOpacity
          style={[styles.signatureButton, signatureData ? styles.signatureButtonSigned : null]}
          onPress={handleOpenSignaturePad}
        >
          <Text style={[styles.signatureButtonText, signatureData ? styles.signatureButtonTextSigned : null]}>
            {signatureData ? 'Signed' : 'Tap to Sign'}
          </Text>
        </TouchableOpacity>
        {signatureData && (
          <TouchableOpacity
            style={styles.clearSignatureButton}
            onPress={handleSignatureClear}
          >
            <Text style={styles.clearSignatureButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );

  if (isLoading && vehicles.length === 0) {
    return <LoadingSpinner text="Loading vehicles..." />;
  }

  if (error && vehicles.length === 0) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={loadVehicles}
        retryText="Retry"
      />
    );
  }

  const exteriorItems = checklistItems.filter(item => item.category === 'exterior');
  const interiorItems = checklistItems.filter(item => item.category === 'interior');

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.surface]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Header title="Vehicle Inspection" showProfile onMenuPress={handleMenuPress} />
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Vehicle Pre-Drive Checklist</Text>
            <Text style={styles.subtitle}>Complete all items before driving</Text>
          </View>

        {renderVehicleSelector()}

        {selectedVehicle && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. The Walk-Around (Exterior)</Text>
              {exteriorItems.map(renderChecklistItem)}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Inside the Vehicle (Driver's Seat)</Text>
              {interiorItems.map(renderChecklistItem)}
            </View>

            {renderSignatureSection()}

            <GlassButton
              title="Submit Checklist"
              onPress={submitChecklist}
              variant="primary"
              size="large"
              style={styles.submitButton}
              disabled={isLoading}
            />
          </>
        )}
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showCommentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Comment</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Enter your comment..."
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCommentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveComment}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Signature Pad Modal */}
      <Modal
        visible={signaturePadVisible}
        transparent
        animationType="slide"
        onRequestClose={handleSignatureCancel}
      >
        <View style={styles.signaturePadContainer}>
          <View style={styles.signaturePadHeader}>
            <Text style={styles.signaturePadTitle}>Driver Signature</Text>
            <TouchableOpacity onPress={handleSignatureCancel}>
              <Icon name="close" size={24} color={COLORS.TEXT_PRIMARY} />
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
                margin-top: 8px;
              }
              .m-signature-pad--footer .button {
                background-color: ${COLORS.PRIMARY};
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px 24px;
                font-size: 16px;
                cursor: pointer;
              }
              .m-signature-pad--footer .button.clear {
                background-color: ${COLORS.DANGER};
              }
            `}
          />
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    padding: SPACING.LG,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  section: {
    padding: SPACING.MD,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  card: {
    margin: SPACING.MD,
    padding: SPACING.LG,
  },
  vehicleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.MD,
    borderRadius: 8,
    marginBottom: SPACING.SM,
    backgroundColor: COLORS.glass.backgroundLight,
  },
  selectedVehicle: {
    backgroundColor: COLORS.glass.background,
    borderColor: COLORS.PRIMARY,
    borderWidth: 1,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  vehiclePlate: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  checklistItem: {
    marginBottom: SPACING.MD,
    padding: SPACING.LG,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: 6,
    borderWidth: 1,
    gap: SPACING.XS,
  },
  passButton: {
    borderColor: COLORS.SUCCESS,
  },
  failButton: {
    borderColor: COLORS.DANGER,
  },
  activeButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeButtonText: {
    color: COLORS.WHITE,
  },
  itemDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.MD,
    lineHeight: 20,
  },
  itemActions: {
    flexDirection: 'row',
    gap: SPACING.MD,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
  },
  actionButtonText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
  },
  commentContainer: {
    marginTop: SPACING.MD,
    padding: SPACING.SM,
    backgroundColor: COLORS.glass.backgroundLight,
    borderRadius: 6,
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  commentText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  photosContainer: {
    marginTop: SPACING.MD,
  },
  photosLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
  },
  photosScroll: {
    flexDirection: 'row',
  },
  photoContainer: {
    position: 'relative',
    marginRight: SPACING.SM,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 6,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.DANGER,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureContainer: {
    alignItems: 'center',
  },
  signatureButton: {
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    padding: SPACING.LG,
    width: '100%',
    alignItems: 'center',
    backgroundColor: COLORS.glass.backgroundLight,
  },
  signatureButtonSigned: {
    borderColor: COLORS.SUCCESS,
    backgroundColor: COLORS.glass.background,
  },
  signatureButtonText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  signatureButtonTextSigned: {
    color: COLORS.SUCCESS,
    fontWeight: 'bold',
  },
  clearSignatureButton: {
    marginTop: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.DANGER,
    borderRadius: 6,
  },
  clearSignatureButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
  },
  signaturePadContainer: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    marginTop: 50,
  },
  signaturePadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  signaturePadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  signaturePad: {
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.glass.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    padding: SPACING.MD,
    marginTop: SPACING.SM,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  dropdownList: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    marginTop: SPACING.XS,
    maxHeight: 200,
    elevation: 3,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  selectedDropdownItem: {
    backgroundColor: COLORS.glass.background,
  },
  dropdownItemText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  selectedDropdownItemText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  submitButton: {
    margin: SPACING.MD,
    marginBottom: SPACING.XL,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: SPACING.LG,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    padding: SPACING.MD,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: COLORS.glass.backgroundLight,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.LG,
    gap: SPACING.MD,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.MD,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.glass.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  cancelButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
});

export default DriverVehicleChecklistScreen;