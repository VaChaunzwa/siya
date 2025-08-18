import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../theme/theme";
import authService from "../services/authService";

const CustomDrawerContent = (props) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isDriver, setIsDriver] = useState(false);

  useEffect(() => {
    const getCurrentUser = async () => {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      setIsDriver(authService.isDriver());
    };
    getCurrentUser();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      props.navigation.closeDrawer();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navigateToScreen = (screenName, params = null) => {
    console.log('📱 DEBUG: CustomDrawerContent navigateToScreen called with:', screenName, params);
    if (params) {
      props.navigation.navigate(screenName, params);
    } else {
      props.navigation.navigate(screenName);
    }
  };

  return (
    <LinearGradient
      colors={["rgba(0, 0, 0, 0.5)", "rgba(0, 0, 0, 0.8)"]}
      style={styles.container}
    >
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Info */}
        {currentUser && (
          <View style={styles.userSection}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={24} color="white" />
              </View>
              <View>
                <Text style={styles.userName}>{currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : currentUser.name || 'User'}</Text>
                <Text style={styles.userRole}>{currentUser.role?.replace('_', ' ').toUpperCase() || 'USER'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
          </View>
        )}

        {/* Navigation Items */}
        <View style={styles.navigationSection}>
          {isDriver ? (
            <>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => {
                  props.navigation.closeDrawer();
                  props.navigation.navigate("My Deliveries", { 
                    screen: "DriverDeliveriesList" 
                  });
                }}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="car-outline" size={24} color="white" />
                </View>
                <Text style={styles.navText}>My Deliveries</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navItem}
                onPress={() => {
                  props.navigation.closeDrawer();
                  props.navigation.navigate("My Deliveries", { 
                    screen: "DriverVehicleChecklist" 
                  });
                }}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="clipboard-outline" size={24} color="white" />
                </View>
                <Text style={styles.navText}>Vehicle Inspection</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => navigateToScreen("Deliveries")}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="car-outline" size={24} color="white" />
                </View>
                <Text style={styles.navText}>Deliveries</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navItem}
                onPress={() => navigateToScreen("WorkFlow")}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="git-network-outline" size={24} color="white" />
                </View>
                <Text style={styles.navText}>Work Flow</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navItem}
                onPress={() => navigateToScreen("Warehouse")}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="business-outline" size={24} color="white" />
                </View>
                <Text style={styles.navText}>Warehouse</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navItem}
                onPress={() => navigateToScreen("Orders")}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="receipt-outline" size={24} color="white" />
                </View>
                <Text style={styles.navText}>Orders</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.divider} />

          {!isDriver && (
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigateToScreen("Settings")}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="settings-outline" size={24} color="white" />
              </View>
              <Text style={styles.navText}>Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      </DrawerContentScrollView>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <View style={styles.iconContainer}>
          <Ionicons name="log-out-outline" size={24} color="white" />
        </View>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
  },
  userSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  userName: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  userRole: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "400",
  },
  navigationSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  navText: {
    color: "white",
    fontSize: 18,
    fontWeight: "400",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginVertical: 20,
    marginHorizontal: 0,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 40,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  logoutText: {
    color: "white",
    fontSize: 18,
    fontWeight: "400",
    letterSpacing: 0.5,
  },
});

export default CustomDrawerContent;
