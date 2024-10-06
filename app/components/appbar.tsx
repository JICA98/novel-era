import { router } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconButton, Title, useTheme } from 'react-native-paper';
import { MenuFunction, MenuItem } from './menu';


export const APP_BAR_HEIGHT = 80;

// Define the props for the AppBar component
interface AppBarProps {
    title: string;
    actions?: MenuItem[];
    transparent?: boolean;
}

// Define the AppBar component
export const AppBar: React.FC<AppBarProps> = ({ title, actions, transparent }) => {
    const { colors } = useTheme();
    const surfaceVariantColor = colors.surfaceVariant;
    return (
        <View style={[styles.appBarContainer, {
            backgroundColor:
                transparent ? 'transparent' : surfaceVariantColor
        }]}>
            <IconButton icon="arrow-left" size={24} onPress={router.back} />
            <Text style={[transparent ? styles.titleTransparent : styles.title,
            { color: colors.onBackground }]} numberOfLines={1} ellipsizeMode="tail">
                {title}
            </Text>
            {actions && (<View style={{ paddingVertical: 4.0 }}>
                <MenuFunction children={actions} />
            </View>)}
        </View>
    );
};

const styles = StyleSheet.create({
    appBarContainer: {
        height: APP_BAR_HEIGHT,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        paddingHorizontal: 4,
    },
    titleTransparent: {
        paddingVertical: 12,
        flex: 1,
        fontSize: 20,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.90)',
        textShadowOffset: { width: -1, height: 1 },
    },
    title: {
        paddingVertical: 12,
        flex: 1,
        fontSize: 20,
        textAlign: 'center',

    },
});