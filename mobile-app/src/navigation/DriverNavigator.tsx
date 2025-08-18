import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/MaterialIcons";
import DriverHomeScreen from "../modules/delivery/screens/DriverHomeScreen";
import DriverDeliveriesScreen from "../modules/delivery/screens/DriverDeliveriesScreen";
import DriverDeliveryDetailsScreen from "../modules/delivery/screens/DriverDeliveryDetailsScreen";
import DriverVehicleChecklistScreen from "../modules/delivery/screens/DriverVehicleChecklistScreen";
import DriverProfileScreen from "../modules/auth/screens/DriverProfileScreen";
import NotificationDemo from "../components/NotificationDemo";
import { ROUTES, COLORS } from "../shared/config/constants";

const Tab = createBottomTabNavigator();
r;
const Stack = createStackNavigator();

const DeliveryStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={ROUTES.DRIVER_DELIVERIES}
        component={DriverDeliveriesScreen}
        options={{ title: "My Deliveries" }}
      />
      <Stack.Screen
        name={ROUTES.DRIVER_DELIVERY_DETAILS}
        component={DriverDeliveryDetailsScreen}
        options={{ title: "Delivery Details" }}
      />
      <Stack.Screen
        name={ROUTES.DRIVER_VEHICLE_CHECKLIST}
        component={DriverVehicleChecklistScreen}
        options={{ title: "Vehicle Checklist" }}
      />
      <Stack.Screen
        name="NotificationDemo"
        component={NotificationDemo}
        options={{ title: "Notification Demo" }}
      />
    </Stack.Navigator>
  );
};

const DriverNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Deliveries") {
            iconName = "local-shipping";
          } else if (route.name === "Profile") {
            iconName = "person";
          } else {
            iconName = "help";
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.SECONDARY,
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={DriverHomeScreen}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="Deliveries"
        component={DeliveryStack}
        options={{ title: "Deliveries" }}
      />
      <Tab.Screen
        name="Profile"
        component={DriverProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
};

export default DriverNavigator;
