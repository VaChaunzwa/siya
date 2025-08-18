import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import DeliveriesScreen from './src/screens/DeliveriesScreen';
import DeliveryDetailScreen from './src/screens/DeliveryDetailScreen';
import DeliveryNoteScreen from './src/screens/DeliveryNoteScreen';
import StopDetailScreen from './src/screens/StopDetailScreen';
import DriverDeliveriesScreen from './src/screens/DriverDeliveriesScreen';
import DriverDeliveryDetailScreen from './src/screens/DriverDeliveryDetailScreen';
import DriverVehicleChecklistScreen from './src/modules/delivery/screens/DriverVehicleChecklistScreen';
import WarehouseScreen from './src/screens/WarehouseScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import WorkFlowScreen from './src/screens/WorkFlowScreen';
import LoginScreen from './src/screens/LoginScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CustomDrawerContent from './src/components/CustomDrawerContent';
import OfflineIndicator from './src/components/OfflineIndicator';

// Services
import authService from './src/services/authService';
import networkService from './src/services/networkService';
import syncService from './src/services/syncService';

// Contexts
import { OfflineProvider } from './src/contexts/OfflineContext';
import { AuthProvider, useAuth } from './src/shared/contexts/AuthContext';

// Theme
import { theme } from './src/theme/theme';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Delivery Stack Navigator
function DeliveryStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background }
      }}
    >
      <Stack.Screen name="DeliveriesList" component={DeliveriesScreen} />
      <Stack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} />
      <Stack.Screen name="DeliveryNote" component={DeliveryNoteScreen} />
      <Stack.Screen name="StopDetail" component={StopDetailScreen} />
    </Stack.Navigator>
  );
}

// Driver Stack Navigator
function DriverStack() {
  return (
    <Stack.Navigator
      initialRouteName="DriverDeliveriesList"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background }
      }}
    >
      <Stack.Screen 
        name="DriverDeliveriesList" 
        component={DriverDeliveriesScreen}
        options={{
          gestureEnabled: false, // Prevent swipe back to avoid navigation issues
        }}
      />
      <Stack.Screen name="DriverDeliveryDetails" component={DriverDeliveryDetailScreen} />
      <Stack.Screen name="DriverVehicleChecklist" component={DriverVehicleChecklistScreen} />
      <Stack.Screen name="StopDetail" component={StopDetailScreen} />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainDrawer() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  const isDriver = authService.isDriver();

  return (
    <Drawer.Navigator 
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: 'transparent'
        }
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      {isDriver ? (
        <Drawer.Screen name="My Deliveries" component={DriverStack} />
      ) : (
        <Drawer.Screen name="Deliveries" component={DeliveryStack} />
      )}
      {!isDriver && (
        <>
          <Drawer.Screen name="WorkFlow" component={WorkFlowScreen} />
          <Drawer.Screen name="Warehouse" component={WarehouseScreen} />
          <Drawer.Screen name="Orders" component={OrdersScreen} />
          <Drawer.Screen name="Settings" component={SettingsScreen} />
        </>
      )}
    </Drawer.Navigator>
  );
}

// Component to handle authentication logic
const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Initialize network and sync services
    const initializeServices = async () => {
      try {
        // Initialize network monitoring
        await networkService.initialize();
        
        // Initialize sync service
        await syncService.initialize();
        
        console.log('✅ Offline services initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing offline services:', error);
      }
    };

    initializeServices();
  }, []);

  const handleLoginSuccess = () => {
    // Login success is now handled by AuthProvider
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <OfflineProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="transparent" translucent />
        <OfflineIndicator />
        {user ? (
          <MainDrawer />
        ) : (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        )}
      </NavigationContainer>
    </OfflineProvider>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}