import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import networkService from '../services/networkService';
import { theme } from '../theme/theme';

interface OfflineIndicatorProps {
  style?: any;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ style }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [slideAnim] = useState(new Animated.Value(-50));

  useEffect(() => {
    // Initialize with current status
    setIsOnline(networkService.getConnectionStatus());

    // Listen for network changes
    const unsubscribe = networkService.addNetworkListener((status) => {
      setIsOnline(status);
      
      if (!status) {
        // Show offline indicator
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        // Hide offline indicator after a brief delay
        setTimeout(() => {
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, 2000);
      }
    });

    return unsubscribe;
  }, [slideAnim]);

  if (isOnline) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
        style
      ]}
    >
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={16} color="white" />
        <Text style={styles.text}>You're offline</Text>
        <Text style={styles.subText}>Changes will sync when connected</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    zIndex: 1000,
    paddingTop: 40, // Account for status bar
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 8,
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
});

export default OfflineIndicator;