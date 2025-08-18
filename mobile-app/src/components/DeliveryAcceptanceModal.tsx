import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { Delivery } from '../services/deliveryService';

interface DeliveryAcceptanceModalProps {
  visible: boolean;
  delivery: Delivery | null;
  onClose: () => void;
  onAcceptAndContinue: (delivery: Delivery) => void;
  onAcceptAndInspect: (delivery: Delivery) => void;
}

const DeliveryAcceptanceModal: React.FC<DeliveryAcceptanceModalProps> = ({
  visible,
  delivery,
  onClose,
  onAcceptAndContinue,
  onAcceptAndInspect,
}) => {
  if (!delivery) return null;

  const handleAcceptAndContinue = () => {
    Alert.alert(
      'Accept Delivery',
      'Are you sure you want to accept this delivery and continue directly?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Continue',
          onPress: () => {
            onAcceptAndContinue(delivery);
            onClose();
          },
        },
      ]
    );
  };

  const handleAcceptAndInspect = () => {
    Alert.alert(
      'Accept Delivery',
      'Are you sure you want to accept this delivery and perform a vehicle inspection first?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Inspect',
          onPress: () => {
            onAcceptAndInspect(delivery);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[theme.colors.surface, theme.colors.surfaceVariant]}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons name="checkmark-circle" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.title}>Accept Delivery</Text>
              <Text style={styles.subtitle}>Delivery #{delivery.deliveryNumber}</Text>
            </View>

            {/* Delivery Info */}
            <View style={styles.deliveryInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.infoText}>{delivery.clientName || 'Unknown Client'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.infoText}>
                  {new Date(delivery.scheduledDate).toLocaleDateString('en-ZA', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.infoText}>
                  {delivery.stops?.length || 0} stop{(delivery.stops?.length || 0) !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.inspectButton}
                onPress={handleAcceptAndInspect}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[theme.colors.secondary, theme.colors.secondaryVariant]}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="car-outline" size={20} color={theme.colors.onSecondary} />
                  <Text style={styles.buttonText}>Accept & Inspect Vehicle</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleAcceptAndContinue}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryVariant]}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="arrow-forward" size={20} color={theme.colors.onPrimary} />
                  <Text style={styles.buttonText}>Accept & Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalContent: {
    padding: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerIcon: {
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  deliveryInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  actionButtons: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  inspectButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  cancelText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textDecorationLine: 'underline',
  },
});

export default DeliveryAcceptanceModal;