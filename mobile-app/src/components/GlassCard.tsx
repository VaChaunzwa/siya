import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, GLASS_THEME } from '../shared/config/constants';

interface GlassCardProps {
  children: React.ReactNode;
  style?: any;
  intensity?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  style, 
  intensity = GLASS_THEME.blur.intensity 
}) => {
  return (
    <BlurView intensity={intensity} style={[styles.container, style]}>
      <View style={styles.content}>
        {children}
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: GLASS_THEME.borderRadius,
    overflow: 'hidden',
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  content: {
    padding: SPACING.MD,
  },
});

export default GlassCard;