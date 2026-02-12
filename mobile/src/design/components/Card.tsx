import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'glass' | 'gradient';
  padding?: keyof typeof theme.spacing;
  onPress?: () => void;
  style?: ViewStyle;
  isDark?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'md',
  onPress,
  style,
  isDark = true,
}) => {
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  const paddingValue = theme.spacing[padding];
  
  const baseStyle: ViewStyle = {
    borderRadius: theme.borderRadius.xl,
    padding: paddingValue,
  };
  
  const Component = onPress ? TouchableOpacity : View;
  
  if (variant === 'gradient') {
    return (
      <Component
        style={[baseStyle, style]}
        onPress={onPress}
        activeOpacity={onPress ? 0.9 : 1}
      >
        <LinearGradient
          colors={theme.colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: theme.borderRadius.xl },
          ]}
        />
        {/* Glass highlight effect */}
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.5 }}
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: theme.borderRadius.xl },
          ]}
        />
        {children}
      </Component>
    );
  }
  
  if (variant === 'glass') {
    return (
      <Component
        style={[
          baseStyle,
          {
            backgroundColor: theme.colors.overlay.light,
            borderWidth: 1,
            borderColor: colors.border,
          },
          style,
        ]}
        onPress={onPress}
        activeOpacity={onPress ? 0.9 : 1}
      >
        {children}
      </Component>
    );
  }
  
  return (
    <Component
      style={[
        baseStyle,
        getVariantStyle(variant, colors),
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.95 : 1}
    >
      {children}
    </Component>
  );
};

const getVariantStyle = (variant: string, colors: any): ViewStyle => {
  switch (variant) {
    case 'elevated':
      return {
        backgroundColor: colors.surface,
        ...theme.shadows.lg,
        borderWidth: 1,
        borderColor: colors.borderVariant,
      };
    case 'outlined':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
      };
    default:
      return {};
  }
};