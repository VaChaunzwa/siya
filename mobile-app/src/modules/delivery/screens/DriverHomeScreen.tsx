import React, {useMemo} from 'react';
import {View, Text, StyleSheet, ScrollView, RefreshControl} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../../shared/contexts/AuthContext';
import {useDeliveries} from '../../../shared/hooks/useDeliveries';
import {COLORS, SPACING, ROUTES, DELIVERY_STATUS, GLASS_THEME} from '../../../shared/config/constants';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorDisplay from '../../../components/ErrorDisplay';
import GlassBackground from '../../../components/GlassBackground';
import GlassCard from '../../../components/GlassCard';
import GlassButton from '../../../components/GlassButton';

const DriverHomeScreen: React.FC = () => {
  const {user} = useAuth();
  const navigation = useNavigation();
  const {deliveries, isLoading, error, refreshDeliveries} = useDeliveries();

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayDeliveries = deliveries.filter(d => 
      new Date(d.scheduledDate).toDateString() === today
    );
    
    return {
      total: deliveries.length,
      today: todayDeliveries.length,
      completed: deliveries.filter(d => d.status === DELIVERY_STATUS.COMPLETED).length,
      pending: deliveries.filter(d => d.status === DELIVERY_STATUS.PENDING).length,
      inProgress: deliveries.filter(d => d.status === DELIVERY_STATUS.IN_PROGRESS).length,
    };
  }, [deliveries]);

  const navigateToDeliveries = () => {
    navigation.navigate(ROUTES.DRIVER_DELIVERIES as never);
  };

  const navigateToVehicleChecklist = () => {
    navigation.navigate(ROUTES.DRIVER_VEHICLE_CHECKLIST as never);
  };

  if (isLoading && deliveries.length === 0) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  if (error && deliveries.length === 0) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={refreshDeliveries}
        retryText="Reload Dashboard"
      />
    );
  }

  return (
    <GlassBackground>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshDeliveries}
            colors={[COLORS.PRIMARY]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back, {user?.name}!</Text>
          <Text style={styles.subtitle}>Here's your delivery overview</Text>
        </View>

        <View style={styles.content}>
          <GlassCard size="small" clickable onPress={navigateToDeliveries} style={styles.card}>
            <Text style={styles.cardTitle}>Today's Deliveries</Text>
            <Text style={[styles.cardValue, {color: COLORS.PRIMARY}]}>{stats.today}</Text>
          </GlassCard>

          <GlassCard size="small" clickable onPress={navigateToDeliveries} style={styles.card}>
            <Text style={styles.cardTitle}>Completed</Text>
            <Text style={[styles.cardValue, {color: COLORS.SUCCESS}]}>{stats.completed}</Text>
          </GlassCard>

          <GlassCard size="small" clickable onPress={navigateToDeliveries} style={styles.card}>
            <Text style={styles.cardTitle}>Pending</Text>
            <Text style={[styles.cardValue, {color: COLORS.WARNING}]}>{stats.pending}</Text>
          </GlassCard>

          <GlassCard size="small" clickable onPress={navigateToDeliveries} style={styles.card}>
            <Text style={styles.cardTitle}>In Progress</Text>
            <Text style={[styles.cardValue, {color: COLORS.INFO}]}>{stats.inProgress}</Text>
          </GlassCard>

          <GlassCard size="small" clickable onPress={navigateToDeliveries} style={styles.card}>
            <Text style={styles.cardTitle}>Total Assigned</Text>
            <Text style={[styles.cardValue, {color: COLORS.TEXT_PRIMARY}]}>{stats.total}</Text>
          </GlassCard>
        </View>

        <GlassButton
          title="Vehicle Pre-Drive Checklist"
          onPress={navigateToVehicleChecklist}
          variant="primary"
          size="large"
          style={styles.actionButton}
        />

        <GlassButton
          title="View All Deliveries"
          onPress={navigateToDeliveries}
          variant="secondary"
          size="large"
          style={styles.actionButton}
        />

        <GlassButton
          title="📱 Demo: How Notifications Work"
          onPress={() => navigation.navigate('NotificationDemo' as never)}
          variant="outline"
          size="large"
          style={styles.actionButton}
        />
      </ScrollView>
    </GlassBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SPACING.EXTRA_LARGE,
    paddingTop: SPACING.EXTRA_LARGE * 2,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SMALL,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  content: {
    padding: SPACING.MEDIUM,
  },
  card: {
    marginBottom: SPACING.MEDIUM,
    padding: SPACING.LARGE,
  },
  cardTitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SMALL,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  actionButton: {
    margin: SPACING.MEDIUM,
    marginTop: SPACING.LARGE,
  },
});

export default DriverHomeScreen;