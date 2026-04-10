import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { AtelierText } from '@/components/AtelierText';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  FadeIn, 
  FadeOut, 
  LinearTransition, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';

interface SettingsSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  initialCollapsed?: boolean;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ 
  title, 
  icon, 
  children, 
  style,
  initialCollapsed = false 
}) => {
  const systemColorScheme = useColorScheme();
  const colorScheme = (systemColorScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  const themeColors = Colors[colorScheme];
  const [isCollapsed, setIsCollapsed] = React.useState(initialCollapsed);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const animatedChevronStyle = useAnimatedStyle(() => {
    return {
      transform: [{ 
        rotate: withTiming(isCollapsed ? '0deg' : '180deg', { duration: 300 }) 
      }],
    };
  });

  return (
    <Animated.View 
      layout={LinearTransition.duration(300)}
      style={[styles.sectionContainer, { backgroundColor: themeColors.surfaceContainerLow }, style]}
    >
      <TouchableOpacity 
        style={[styles.sectionHeader, isCollapsed && { marginBottom: 0 }]} 
        onPress={toggleCollapse}
        activeOpacity={0.7}
      >
        {icon && (
          <MaterialCommunityIcons 
            name={icon as any} 
            size={24} 
            color={themeColors.primary} 
            style={styles.sectionIcon} 
          />
        )}
        <AtelierText variant="title" bold style={styles.sectionTitle}>
          {title}
        </AtelierText>
        <View style={{ flex: 1 }} />
        <Animated.View style={animatedChevronStyle}>
          <MaterialCommunityIcons 
            name="chevron-down" 
            size={24} 
            color={themeColors.outline} 
          />
        </Animated.View>
      </TouchableOpacity>
      {!isCollapsed && (
        <Animated.View 
          entering={FadeIn.duration(300)} 
          exiting={FadeOut.duration(200)}
          style={styles.sectionContent}
        >
          {children}
        </Animated.View>
      )}
    </Animated.View>
  );
};

interface SettingsItemProps {
  title: string;
  description?: string;
  icon?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  disabled?: boolean;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({ 
  title, 
  description, 
  icon, 
  rightElement, 
  onPress,
  showChevron = false,
  disabled = false,
}) => {
  const systemColorScheme = useColorScheme();
  const colorScheme = (systemColorScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  const themeColors = Colors[colorScheme];

  const content = (
    <View style={styles.itemWrapper}>
      <View style={styles.itemMain}>
        {icon && (
          <MaterialCommunityIcons 
             name={icon as any} 
             size={22} 
             color={themeColors.onSurfaceVariant} 
             style={styles.itemIcon} 
          />
        )}
        <View style={styles.itemTextContainer}>
          <AtelierText variant="body" bold style={{ color: themeColors.onSurface }}>
            {title}
          </AtelierText>
          {description && (
            <AtelierText
              variant="caption"
              style={{ color: disabled ? themeColors.outline : themeColors.onSurfaceVariant }}
            >
              {description}
            </AtelierText>
          )}
        </View>
      </View>
      
      <View style={styles.itemRight}>
        {rightElement}
        {showChevron && !disabled && (
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={20} 
            color={themeColors.outline} 
          />
        )}
      </View>
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity 
        style={[styles.itemContainer, disabled && styles.itemDisabled]} 
        onPress={onPress}
        activeOpacity={0.6}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.itemContainer, disabled && styles.itemDisabled]}>
      {content}
    </View>
  );
};

interface StatBoxProps {
  value: string | number;
  label: string;
}

export const StatBox: React.FC<StatBoxProps> = ({ value, label }) => {
  const systemColorScheme = useColorScheme();
  const colorScheme = (systemColorScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  const themeColors = Colors[colorScheme];

  return (
    <View style={[styles.statBox, { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
      <AtelierText 
        variant="subtitle" 
        bold 
        style={{ color: '#ffffff', fontSize: 20, marginBottom: 4, textAlign: 'center' }}
      >
        {value}
      </AtelierText>
      <AtelierText 
        variant="caption" 
        bold 
        style={{ color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}
      >
        {label}
      </AtelierText>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    padding: 20,
    borderRadius: 32,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionIcon: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 20,
  },
  sectionContent: {
    gap: 4,
  },
  itemContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  itemDisabled: {
    opacity: 0.5,
  },
  itemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: 12,
  },
  itemTextContainer: {
    flexDirection: 'column',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statBox: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

export default function SettingsComponentsRoute(): null {
  return null;
}
