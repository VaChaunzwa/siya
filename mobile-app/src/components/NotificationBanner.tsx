import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import authService from '../services/authService';
import notificationService, { Notification } from '../services/notificationService';

interface NotificationBannerProps {
  onNotificationPress?: (notification: Notification) => void;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ onNotificationPress }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDriver, setIsDriver] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        const driverStatus = await authService.isDriver();
        setCurrentUser(user);
        setIsDriver(driverStatus);
        
        if (driverStatus && user) {
          fetchNotifications(user.id);
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    if (notifications.length > 0 && !currentNotification) {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length > 0) {
        showNotification(unreadNotifications[0]);
      }
    }
  }, [notifications, currentNotification]);

  const fetchNotifications = async (userId: string) => {
    try {
      const fetchedNotifications = await notificationService.fetchNotifications();
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const showNotification = (notification: Notification) => {
    setCurrentNotification(notification);
    setIsVisible(true);
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideNotification();
    }, 5000);
  };

  const hideNotification = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      setCurrentNotification(null);
    });
  };

  const handleNotificationPress = async () => {
    if (currentNotification) {
      // Mark as read
      await notificationService.markAsRead(currentNotification.id);
      
      // Update local notifications state
      setNotifications(prev => 
        prev.map(n => 
          n.id === currentNotification.id ? { ...n, read: true } : n
        )
      );
      
      if (onNotificationPress) {
        onNotificationPress(currentNotification);
      }
      
      hideNotification();
    }
  };

  const handleDismiss = async () => {
    if (currentNotification) {
      // Mark as read when dismissed
      await notificationService.markAsRead(currentNotification.id);
      
      // Update local notifications state
      setNotifications(prev => 
        prev.map(n => 
          n.id === currentNotification.id ? { ...n, read: true } : n
        )
      );
    }
    hideNotification();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'car';
      case 'delivery':
        return 'cube';
      case 'stop':
        return 'location';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return '#10B981'; // Green
      case 'delivery':
        return '#F59E0B'; // Orange
      case 'stop':
        return '#6366F1'; // Blue
      default:
        return theme.colors.primary;
    }
  };

  // Notification banner disabled - return null to hide pop-up
  return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          backgroundColor: getNotificationColor(currentNotification.type)
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.notificationContent}
        onPress={handleNotificationPress}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Ionicons 
            name={getNotificationIcon(currentNotification.type) as any} 
            size={20} 
            color="white" 
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {currentNotification.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {currentNotification.message}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: theme.spacing.md,
    right: theme.spacing.md,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 1000,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  textContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  title: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    lineHeight: 16,
  },
  dismissButton: {
    padding: 4,
  },
});

export default NotificationBanner;