import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AtelierText } from './AtelierText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';

interface AtelierButtonProps {
  onPress: () => void;
  title: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const AtelierButton: React.FC<AtelierButtonProps> = ({
  onPress,
  title,
  style,
  textStyle,
  icon,
}) => {
  const systemColorScheme = useColorScheme();
  const colorScheme = (systemColorScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  const themeColors = Colors[colorScheme];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.container, style]}
    >
      <LinearGradient
        colors={[themeColors.primary, themeColors.primaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <AtelierText
          variant="label"
          bold
          color={themeColors.onPrimary}
          style={[styles.text, textStyle]}
        >
          {title}
        </AtelierText>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  iconContainer: {
    marginLeft: 8,
  },
});
