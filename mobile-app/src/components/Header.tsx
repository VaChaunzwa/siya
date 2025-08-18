import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import notificationService, { Notification } from '../services/notificationService';
import authService from '../services/authService';

const { width } = Dimensions.get('window');

interface HeaderProps {
  title: string;
  showProfile?: boolean;
  showBack?: boolean;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  onProfilePress?: () => void;
  onNotificationPress?: (notification: Notification) => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showProfile = false,
  showBack = false,
  onBackPress,
  onMenuPress,
  onProfilePress,
  onNotificationPress
}) => {
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDriver, setIsDriver] = useState(false);

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const driverStatus = await authService.isDriver();
        setIsDriver(driverStatus);
        
        if (driverStatus) {
          const fetchedNotifications = await notificationService.fetchNotifications();
          setNotifications(fetchedNotifications);
          setUnreadCount(notificationService.getUnreadCount());
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();

    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
      setUnreadCount(notificationService.getUnreadCount());
    });

    return unsubscribe;
  }, []);

  const handleNotificationPress = () => {
    setShowNotificationDropdown(true);
  };

  const handleNotificationItemPress = async (notification: Notification) => {
    await notificationService.markAsRead(notification.id);
    setShowNotificationDropdown(false);
    if (onNotificationPress) {
      onNotificationPress(notification);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
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
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.onSurface}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onMenuPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="menu"
              size={24}
              color={theme.colors.onSurface}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerSection}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.rightSection}>
        {isDriver && (
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleNotificationPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="notifications"
              size={24}
              color={theme.colors.onSurface}
            />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {showProfile && (
          <TouchableOpacity
            style={styles.profileButton}
            onPress={onProfilePress}
            activeOpacity={0.7}
          >
            <View style={styles.profileContainer}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
                }}
                style={styles.profileImage}
              />
              <View style={styles.onlineIndicator} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Notification Dropdown Modal */}
      <Modal
        visible={showNotificationDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotificationDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNotificationDropdown(false)}
        >
          <View style={styles.notificationDropdown}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Recent Notifications</Text>
              <TouchableOpacity
                onPress={() => setShowNotificationDropdown(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.notificationList} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={styles.emptyNotifications}>
                  <Ionicons name="notifications-off" size={32} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.emptyText}>No notifications</Text>
                </View>
              ) : (
                notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      !notification.read && styles.unreadNotification
                    ]}
                    onPress={() => handleNotificationItemPress(notification)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.notificationIconContainer}>
                      <Ionicons
                        name={getNotificationIcon(notification.type)}
                        size={20}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      <Text style={styles.notificationMessage} numberOfLines={2}>
                        {notification.message}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatTime(notification.createdAt)}
                      </Text>
                    </View>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    height: 60,
    backgroundColor: 'transparent'
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start'
  },
  centerSection: {
    flex: 2,
    alignItems: 'center'
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    textAlign: 'center'
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative'
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center'
  },
  profileButton: {
    width: 40,
    height: 40
  },
  profileContainer: {
    position: 'relative',
    width: 40,
    height: 40
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.secondary,
    borderWidth: 2,
    borderColor: theme.colors.surface
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: theme.spacing.md
  },
  notificationDropdown: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    width: width * 0.85,
    maxHeight: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface
  },
  closeButton: {
    padding: 4
  },
  notificationList: {
    maxHeight: 300
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    marginTop: theme.spacing.sm
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline
  },
  unreadNotification: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)'
  },
  notificationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm
  },
  notificationContent: {
    flex: 1
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2
  },
  notificationMessage: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 16,
    marginBottom: 4
  },
  notificationTime: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.sm,
    marginTop: 4
  }
});

export default Header;