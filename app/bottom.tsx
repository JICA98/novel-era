import * as React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { create } from 'zustand'
import SearchLayout from './search';
import Recents from './recents';
import FavoriteScreen from './favorites/_layout';
import Settings from './settings/_layout';
import { AtelierText } from '@/components/AtelierText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export const indexes = {
    favorites: 0,
    explore: 1,
    recents: 2,
    settings: 3
}

export const useBottomIndexStore = create((set) => ({
    index: 0,
    setIndex: (index: number) => set({ index: index })
}))

const MyBottom = () => {
    const index = useBottomIndexStore((state: any) => state.index);
    const setIndex = useBottomIndexStore((state: any) => state.setIndex);
    const systemColorScheme = useColorScheme();
    const colorScheme = (systemColorScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
    const themeColors = Colors[colorScheme];

    const routes = [
        { key: 'favorites', title: 'Library', icon: 'library-shelves' },
        { key: 'explore', title: 'Explore', icon: 'compass' },
        { key: 'recents', title: 'Recents', icon: 'history' },
        { key: 'settings', title: 'Settings', icon: 'cog-outline' },
    ];

    const renderScene = () => {
        switch (index) {
            case 0: return <FavoriteScreen />;
            case 1: return <SearchLayout />;
            case 2: return <Recents />;
            case 3: return <Settings />;
            default: return <FavoriteScreen />;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.sceneContainer}>
                {renderScene()}
            </View>

            {/* Custom Floating Bottom Bar */}
            <View style={styles.navWrapper}>
                <BlurView 
                    intensity={Platform.OS === 'ios' ? 80 : 100} 
                    tint={colorScheme === 'dark' ? 'dark' : 'light'}
                    style={[styles.blurView, { 
                        backgroundColor: colorScheme === 'dark' ? 'rgba(23, 28, 60, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                        borderColor: themeColors.outlineVariant + '33'
                    }]}
                >
                    {routes.map((route, i) => {
                        const isActive = index === i;
                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={() => setIndex(i)}
                                style={[
                                    styles.tabItem,
                                    isActive && { backgroundColor: themeColors.primaryContainer + '22' }
                                ]}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons 
                                    name={route.icon as any} 
                                    size={24} 
                                    color={isActive ? themeColors.primary : themeColors.onSurfaceVariant} 
                                />
                                <AtelierText 
                                    variant="caption" 
                                    bold={isActive}
                                    color={isActive ? themeColors.primary : themeColors.onSurfaceVariant}
                                    style={styles.tabLabel}
                                >
                                    {route.title}
                                </AtelierText>
                            </TouchableOpacity>
                        );
                    })}
                </BlurView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    sceneContainer: {
        flex: 1,
    },
    navWrapper: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
        height: 72,
        borderRadius: 36,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 10,
    },
    blurView: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 12,
        borderWidth: 1,
    },
    tabItem: {
        flex: 1,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
    },
    tabLabel: {
        fontSize: 10,
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

export default MyBottom;