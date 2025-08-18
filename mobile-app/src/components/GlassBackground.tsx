import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GLASS_THEME } from '../shared/config/constants';

interface GlassBackgroundProps {
  children: React.ReactNode;
  style?: any;
}

const GlassBackground: React.FC<GlassBackgroundProps> = ({ children, style }) => {
  return (
    <LinearGradient
      colors={GLASS_THEME.gradients.background}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GlassBackground;