import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../shared/config/theme';

interface DemoNotification {
  id: string;
  title: string;
  message: string;
  type: 'assignment' | 'delivery' | 'stop' | 'system';
  timestamp: string;
}

const NotificationDemo: React.FC = () => {
  const [notifications, setNotifications] = useState<DemoNotification[]>([]);
  const [slideAnim] = useState(new Animated.Value(-100));

  const demoNotifications: DemoNotification[] = [
    {
      id: '1',
      title: 'New Delivery Assignment',
      message: 'You have been assigned delivery DEL-001 for ABC Corporation',
      type: 'assignment',
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: '2',
      title: 'Delivery Time Update',
      message: 'Pickup time for delivery DEL-002 has been changed to 2:30 PM',
      type: 'delivery',
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: '3',
      title: 'Route Optimization',
      message: 'Your delivery route has been optimized. Check the updated sequence.',
      type: 'system',
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: '4',
      title: 'Stop Completed',
      message: 'Stop at Metro Supplies has been marked as completed',
      type: 'stop',
      timestamp: new Date().toLocaleTimeString(),
    },
  ];

  const showNotification = (notification: DemoNotification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 2)]); // Keep max 3 notifications
    
    // Animate slide in
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000), // Show for 3 seconds
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Remove notification after animation
      setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, 100);
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'car';
      case 'delivery':
        return 'time';
      case 'stop':
        return 'checkmark-circle';
      case 'system':
        return 'settings';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return '#6366F1';
      case 'delivery':
        return '#F59E0B';
      case 'stop':
        return '#10B981';
      case 'system':
        return '#8B5CF6';
      default:
        return theme.colors.primary;
    }
  };

  const simulateNotification = () => {
    const randomNotification = demoNotifications[Math.floor(Math.random() * demoNotifications.length)];
    const notificationWithTimestamp = {
      ...randomNotification,
      id: `${randomNotification.id}_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    showNotification(notificationWithTimestamp);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Notification Demo</Text>
      <Text style={styles.subtitle}>
        This demonstrates how notifications appear to drivers in real-time
      </Text>

      <TouchableOpacity style={styles.triggerButton} onPress={simulateNotification}>
        <Ionicons name="notifications" size={24} color="white" />
        <Text style={styles.triggerButtonText}>Simulate Notification</Text>
      </TouchableOpacity>

      {/* Notification Display Area */}
      <View style={styles.notificationArea}>
        {notifications.length > 0 && (
          <Animated.View
            style={[
              styles.notification,
              {
                transform: [{ translateY: slideAnim }],
                backgroundColor: getNotificationColor(notifications[0].type),
              },
            ]}
          >
            <View style={styles.notificationContent}>
              <Ionicons
                name={getNotificationIcon(notifications[0].type)}
                size={24}
                color="white"
                style={styles.notificationIcon}
              />
              <View style={styles.notificationText}>
                <Text style={styles.notificationTitle}>{notifications[0].title}</Text>
                <Text style={styles.notificationMessage}>{notifications[0].message}</Text>
                <Text style={styles.notificationTime}>{notifications[0].timestamp}</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How Driver Notifications Work:</Text>
        <Text style={styles.infoText}>
          • Notifications slide down from the top of the screen{'\n'}
          • Different colors indicate different types of notifications{'\n'}
          • Notifications auto-dismiss after 3 seconds{'\n'}
          • Drivers can tap notifications to view details{'\n'}
          • All notifications are stored in the notification center
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.xl,
  },
  triggerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  notificationArea: {
    height: 120,
    marginBottom: theme.spacing.xl,
  },
  notification: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 4,
  },
  notificationTime: {
    color: 'white',
    fontSize: 12,
    opacity: 0.7,
  },
  infoSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
});

export default NotificationDemo;