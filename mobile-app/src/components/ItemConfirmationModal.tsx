import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DeliveryItem } from '../services/deliveryService';
import { theme } from '../theme/theme';

interface ItemConfirmationModalProps {
  visible: boolean;
  items: DeliveryItem[];
  onConfirm: (confirmedItems: DeliveryItem[]) => void;
  onCancel: () => void;
  customerName: string;
}

const ItemConfirmationModal: React.FC<ItemConfirmationModalProps> = ({
  visible,
  items,
  onConfirm,
  onCancel,
  customerName,
}) => {

  const [confirmedItems, setConfirmedItems] = useState<DeliveryItem[]>([]);

  useEffect(() => {
    if (items) {
      setConfirmedItems(items.map(item => ({ ...item, confirmed: false })));
    }
  }, [items]);

  const toggleItemConfirmation = (index: number) => {
    const updatedItems = [...confirmedItems];
    updatedItems[index] = {
      ...updatedItems[index],
      confirmed: !updatedItems[index].confirmed,
    };
    setConfirmedItems(updatedItems);
  };

  const handleConfirm = () => {
    const unconfirmedItems = confirmedItems.filter(item => !item.confirmed);
    
    if (unconfirmedItems.length > 0) {
      Alert.alert(
        'Incomplete Confirmation',
        `Please confirm all ${confirmedItems.length} items before proceeding.`,
        [{ text: 'OK' }]
      );
      return;
    }

    onConfirm(confirmedItems);
  };

  const allItemsConfirmed = confirmedItems.every(item => item.confirmed);
  const confirmedCount = confirmedItems.filter(item => item.confirmed).length;

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      flex: 1,
    },
    closeButton: {
      padding: 8,
    },
    customerInfo: {
      backgroundColor: theme.colors.surfaceVariant,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    customerText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    instructionText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 20,
    },
    progressContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    progressText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    progressBar: {
      flex: 1,
      height: 6,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 3,
      marginHorizontal: 12,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 3,
    },
    itemsList: {
      maxHeight: 300,
    },
    itemCard: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
    },
    itemCardConfirmed: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}15`,
    },
    itemCardUnconfirmed: {
      borderColor: theme.colors.outline,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    itemName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    itemQuantity: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
      backgroundColor: theme.colors.primary,
      color: theme.colors.onPrimary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    itemDetails: {
      marginBottom: 12,
    },
    itemDetail: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    itemDetailLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
      width: 60,
    },
    itemDetailValue: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    confirmButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      borderWidth: 2,
    },
    confirmButtonConfirmed: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    confirmButtonUnconfirmed: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.outline,
    },
    confirmButtonText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 8,
    },
    confirmButtonTextConfirmed: {
      color: theme.colors.onPrimary,
    },
    confirmButtonTextUnconfirmed: {
      color: theme.colors.onSurfaceVariant,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.outline,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    proceedButton: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },
    proceedButtonDisabled: {
      opacity: 0.5,
    },
    buttonGradient: {
      padding: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    proceedButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onPrimary,
      marginLeft: 8,
    },
    emptyState: {
      alignItems: 'center',
      padding: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 12,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Confirm Items</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <View style={styles.customerInfo}>
            <Text style={styles.customerText}>Delivering to: {customerName}</Text>
          </View>

          <Text style={styles.instructionText}>
            Please confirm each item is present before proceeding to signature.
          </Text>

          {confirmedItems.length > 0 && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {confirmedCount}/{confirmedItems.length}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(confirmedCount / confirmedItems.length) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>Complete</Text>
            </View>
          )}

          <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
            {confirmedItems.length > 0 ? (
              confirmedItems.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.itemCard,
                    item.confirmed
                      ? styles.itemCardConfirmed
                      : styles.itemCardUnconfirmed,
                  ]}
                >
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>
                      {item.description || `Item ${index + 1}`}
                    </Text>
                    <Text style={styles.itemQuantity}>Qty: {item.quantity || 1}</Text>
                  </View>

                  {(item.sku || item.weight || item.dimensions || item.notes) && (
                    <View style={styles.itemDetails}>
                      {item.sku && (
                        <View style={styles.itemDetail}>
                          <Text style={styles.itemDetailLabel}>SKU:</Text>
                          <Text style={styles.itemDetailValue}>{item.sku}</Text>
                        </View>
                      )}
                      {item.weight && (
                        <View style={styles.itemDetail}>
                          <Text style={styles.itemDetailLabel}>Weight:</Text>
                          <Text style={styles.itemDetailValue}>{item.weight}kg</Text>
                        </View>
                      )}
                      {item.dimensions && (
                        <View style={styles.itemDetail}>
                          <Text style={styles.itemDetailLabel}>Size:</Text>
                          <Text style={styles.itemDetailValue}>{item.dimensions}</Text>
                        </View>
                      )}
                      {item.notes && (
                        <View style={styles.itemDetail}>
                          <Text style={styles.itemDetailLabel}>Notes:</Text>
                          <Text style={styles.itemDetailValue}>{item.notes}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      item.confirmed
                        ? styles.confirmButtonConfirmed
                        : styles.confirmButtonUnconfirmed,
                    ]}
                    onPress={() => toggleItemConfirmation(index)}
                  >
                    <Ionicons
                      name={item.confirmed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={
                        item.confirmed
                          ? theme.colors.onPrimary
                          : theme.colors.onSurfaceVariant
                      }
                    />
                    <Text
                      style={[
                        styles.confirmButtonText,
                        item.confirmed
                          ? styles.confirmButtonTextConfirmed
                          : styles.confirmButtonTextUnconfirmed,
                      ]}
                    >
                      {item.confirmed ? 'Confirmed' : 'Confirm Item'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="cube-outline"
                  size={48}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.emptyStateText}>
                  No items specified for this delivery
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.proceedButton,
                !allItemsConfirmed && styles.proceedButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!allItemsConfirmed}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="arrow-forward" size={20} color={theme.colors.onPrimary} />
                <Text style={styles.proceedButtonText}>Proceed to Signature</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ItemConfirmationModal;