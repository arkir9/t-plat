import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  isDark?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  isDark = true,
}) => {
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  
  const sizeStyles = {
    sm: { height: 40, paddingHorizontal: 16, fontSize: 14 },
    md: { height: 48, paddingHorizontal: 24, fontSize: 16 },
    lg: { height: 56, paddingHorizontal: 32, fontSize: 16 },
    xl: { height: 64, paddingHorizontal: 40, fontSize: 18 },
  };
  
  const currentSize = sizeStyles[size];
  
  const baseStyle: ViewStyle = {
    height: currentSize.height,
    paddingHorizontal: currentSize.paddingHorizontal,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: fullWidth ? '100%' : undefined,
    opacity: disabled ? 0.6 : 1,
  };
  
  const textBaseStyle: TextStyle = {
    fontSize: currentSize.fontSize,
    fontWeight: '600',
    letterSpacing: -0.2,
  };
  
  if (loading) {
    return (
      <TouchableOpacity
        style={[baseStyle, getVariantStyle(variant, colors), style]}
        disabled={true}
        activeOpacity={0.8}
      >
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? '#FFFFFF' : theme.colors.primary[500]} 
        />
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      style={[baseStyle, getVariantStyle(variant, colors), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[
        textBaseStyle,
        getTextStyle(variant, colors),
        textStyle,
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const getVariantStyle = (variant: string, colors: any): ViewStyle => {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: theme.colors.primary[500],
      };
    case 'secondary':
      return {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary[500],
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
      };
    default:
      return {
        backgroundColor: theme.colors.primary[500],
      };
  }
};

const getTextStyle = (variant: string, colors: any): TextStyle => {
  switch (variant) {
    case 'primary':
      return { color: '#FFFFFF' };
    case 'outline':
      return { color: theme.colors.primary[500] };
    case 'ghost':
      return { color: theme.colors.primary[500] };
    default:
      return { color: colors.text };
  }
};