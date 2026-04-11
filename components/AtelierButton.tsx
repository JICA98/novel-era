import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { AtelierText } from './AtelierText';
import { useTheme } from 'react-native-paper';

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
  const themeColors = useTheme().colors as any;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.container, style]}
    >
      <View
        style={[styles.gradient, { backgroundColor: themeColors.primary }]}
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
      </View>
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
