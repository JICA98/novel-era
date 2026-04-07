import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

interface AtelierTextProps extends TextProps {
  variant?: 'headline' | 'body' | 'label' | 'title' | 'subtitle' | 'caption';
  italic?: boolean;
  bold?: boolean;
  color?: string;
}

export const AtelierText: React.FC<AtelierTextProps> = ({
  style,
  variant = 'body',
  italic = false,
  bold = false,
  color,
  children,
  ...props
}) => {
  const systemColorScheme = useColorScheme();
  const colorScheme = (systemColorScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  const themeColors = Colors[colorScheme];

  const getFontFamily = () => {
    if (variant === 'headline' || variant === 'title') {
      if (italic && bold) return 'NotoSerif-BoldItalic'; // Note: I didn't download BoldItalic yet, fallback to Bold
      if (italic) return 'NotoSerif-Italic';
      if (bold) return 'NotoSerif-Bold';
      return 'NotoSerif-Regular';
    }

    // Manrope for body, label, subtitle, caption
    if (bold) return 'Manrope-Bold';
    if (variant === 'label') return 'Manrope-SemiBold';
    return 'Manrope-Regular';
  };

  const getFontSize = () => {
    switch (variant) {
      case 'headline': return 32;
      case 'title': return 24;
      case 'subtitle': return 18;
      case 'label': return 14;
      case 'caption': return 12;
      default: return 16;
    }
  };

  return (
    <Text
      style={[
        {
          fontFamily: getFontFamily(),
          fontSize: getFontSize(),
          color: color || themeColors.text,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};
