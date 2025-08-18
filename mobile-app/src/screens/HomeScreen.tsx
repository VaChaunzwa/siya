import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import NotificationBanner from '../components/NotificationBanner';
import authService from '../services/authService';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 cards per row with margins

interface NavigationCard {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  gradient: string[];
}

const allNavigationCards: NavigationCard[] = [
  {
    id: '1',
    title: 'Deliveries',
    icon: 'car',
    route: 'Deliveries',
    gradient: ['#6366F1', '#8B5CF6']
  },
  {
    id: '2',
    title: 'Work Flow',
    icon: 'git-network',
    route: 'WorkFlow',
    gradient: ['#10B981', '#059669']
  },
  {
    id: '3',
    title: 'Warehouse',
    icon: 'business',
    route: 'Warehouse',
    gradient: ['#F59E0B', '#D97706']
  },
  {
    id: '4',
    title: 'Orders',
    icon: 'receipt',
    route: 'Orders',
    gradient: ['#EF4444', '#DC2626']
  }
];

const driverNavigationCards: NavigationCard[] = [
  {
    id: '1',
    title: 'My Deliveries',
    icon: 'car',
    route: 'My Deliveries',
    gradient: ['#6366F1', '#8B5CF6']
  },
  {
    id: '2',
    title: 'Vehicle Inspection',
    icon: 'clipboard',
    route: 'DriverVehicleChecklist',
    gradient: ['#10B981', '#059669']
  }
];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isDriver, setIsDriver] = useState(false);
  const [navigationCards, setNavigationCards] = useState<NavigationCard[]>(allNavigationCards);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const userIsDriver = await authService.isDriver();
        setIsDriver(userIsDriver);
        setNavigationCards(userIsDriver ? driverNavigationCards : allNavigationCards);
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };

    checkUserRole();
  }, []);

  const handleMenuPress = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const handleCardPress = (route: string) => {
    console.log('🏠 DEBUG: HomeScreen handleCardPress called with route:', route);
    
    if (route === 'DriverVehicleChecklist') {
      // Navigate directly to the vehicle checklist screen within the driver stack
      navigation.navigate('My Deliveries' as never, {
        screen: 'DriverVehicleChecklist'
      } as never);
    } else if (route === 'My Deliveries') {
      // Navigate to the My Deliveries drawer screen which shows the driver deliveries list
      console.log('🏠 DEBUG: Navigating to My Deliveries - should go to driver deliveries list');
      navigation.navigate('My Deliveries' as never);
    } else {
      navigation.navigate(route as never);
    }
  };

  const handleNotificationPress = (notification: any) => {
    // Handle notification press - navigate to relevant screen based on notification type
    if (notification.type === 'assignment' && notification.data?.deliveryId) {
      navigation.navigate('My Deliveries' as never);
    } else if (notification.type === 'delivery' && notification.data?.deliveryId) {
      navigation.navigate('My Deliveries' as never);
    } else if (notification.type === 'stop' && notification.data?.deliveryId) {
      navigation.navigate('My Deliveries' as never);
    } else {
      // Default to My Deliveries for drivers
      if (isDriver) {
        navigation.navigate('My Deliveries' as never);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      // Navigation will be handled by the auth state change in App.tsx
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderNavigationCard = (card: NavigationCard) => (
    <TouchableOpacity
      key={card.id}
      style={styles.cardContainer}
      onPress={() => handleCardPress(card.route)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={card.gradient}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardContent}>
          <Ionicons
            name={card.icon}
            size={32}
            color={theme.colors.onPrimary}
            style={styles.cardIcon}
          />
          <Text style={styles.cardTitle}>{card.title}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.surface]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Header 
          title="Home" 
          showProfile 
          onMenuPress={handleMenuPress}
          onNotificationPress={handleNotificationPress}
        />
        <NotificationBanner onNotificationPress={handleNotificationPress} />
        
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <SearchBar placeholder="Search..." />
          
          <View style={styles.cardsContainer}>
            {navigationCards.map(renderNavigationCard)}
          </View>
        </ScrollView>
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
    flex: 1
  },
  scrollContent: {
    paddingBottom: 100
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg
  },
  cardContainer: {
    width: cardWidth,
    marginBottom: theme.spacing.md
  },
  card: {
    height: 120,
    borderRadius: theme.roundness,
    elevation: theme.elevation.level2,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md
  },
  cardIcon: {
    marginBottom: theme.spacing.sm
  },
  cardTitle: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },

});

export default HomeScreen;