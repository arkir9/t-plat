import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  variant?: 'default' | 'outlined' | 'glass';
  isDark?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  onFocus,
  error,
  disabled = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  style,
  inputStyle,
  variant = 'default',
  isDark = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const focusAnim = React.useRef(new Animated.Value(0)).current;
  
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  
  React.useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);
  
  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };
  
  const toggleSecureEntry = () => {
    setIsSecure(!isSecure);
  };
  
  const containerStyle: ViewStyle = {
    marginBottom: theme.spacing.md,
  };
  
  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: multiline ? 'flex-start' : 'center',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: multiline ? theme.spacing.md : 0,
    height: multiline ? undefined : 56,
    minHeight: multiline ? 56 * numberOfLines : undefined,
  };
  
  const textInputStyle: TextStyle = {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: multiline ? 0 : theme.spacing.sm,
    textAlignVertical: multiline ? 'top' : 'center',
  };
  
  const getInputContainerVariantStyle = (): ViewStyle => {
    const borderColor = error 
      ? theme.colors.error 
      : isFocused 
        ? theme.colors.primary[500] 
        : colors.border;
    
    switch (variant) {
      case 'outlined':
        return {
          borderWidth: 2,
          borderColor,
          backgroundColor: 'transparent',
        };
      case 'glass':
        return {
          backgroundColor: theme.colors.overlay.light,
          borderWidth: 1,
          borderColor: borderColor,
        };
      default:
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor,
        };
    }
  };
  
  return (
    <View style={[containerStyle, style]}>
      {label && (
        <Text style={[
          theme.typography.styles.label,
          {
            color: colors.textSecondary,
            marginBottom: theme.spacing.sm,
          },
        ]}>
          {label}
        </Text>
      )}
      
      <View style={[
        inputContainerStyle,
        getInputContainerVariantStyle(),
        disabled && { opacity: 0.6 },
      ]}>
        {isFocused && variant !== 'outlined' && (
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                borderRadius: theme.borderRadius.lg,
                opacity: focusAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.1],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={theme.colors.gradients.primary}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        )}
        
        {leftIcon && (
          <View style={{ marginRight: theme.spacing.sm }}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[textInputStyle, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          editable={!disabled}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          selectionColor={theme.colors.primary[500]}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            onPress={toggleSecureEntry}
            style={{ marginLeft: theme.spacing.sm }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 20 }}>
              {isSecure ? 'Show' : 'Hide'}
            </Text>
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <View style={{ marginLeft: theme.spacing.sm }}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && (
        <Text style={[
          theme.typography.styles.caption,
          {
            color: theme.colors.error,
            marginTop: theme.spacing.xs,
          },
        ]}>
          {error}
        </Text>
      )}
    </View>
  );
};