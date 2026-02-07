import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { BlurView } from 'expo-blur';

const { width: screenWidth } = Dimensions.get('window');

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
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
  icon,
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
  
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        style={[baseStyle, style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={theme.colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: theme.borderRadius.lg },
          ]}
        />
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: theme.borderRadius.lg, height: '50%' },
          ]}
        />
        {icon && <>{icon}</>}
        <Text style={[textBaseStyle, { color: '#FFFFFF', marginLeft: icon ? 8 : 0 }, textStyle]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }
  
  if (variant === 'glass') {
    return (
      <TouchableOpacity
        style={[baseStyle, style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <BlurView 
          intensity={20} 
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: theme.borderRadius.lg },
          ]}
        />
        <LinearGradient
          colors={theme.colors.gradients.surface}
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: theme.borderRadius.lg },
          ]}
        />
        {icon && <>{icon}</>}
        <Text style={[
          textBaseStyle, 
          { color: colors.text, marginLeft: icon ? 8 : 0 }, 
          textStyle
        ]}>
          {title}
        </Text>
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
      {icon && <>{icon}</>}
      <Text style={[
        textBaseStyle,
        getTextStyle(variant, colors),
        { marginLeft: icon ? 8 : 0 },
        textStyle,
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const getVariantStyle = (variant: string, colors: any): ViewStyle => {
  switch (variant) {
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
      return {};
  }
};

const getTextStyle = (variant: string, colors: any): TextStyle => {
  switch (variant) {
    case 'outline':
      return { color: theme.colors.primary[500] };
    case 'ghost':
      return { color: theme.colors.primary[500] };
    default:
      return { color: colors.text };
  }
};