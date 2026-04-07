import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';

export const ChapterSkeleton = () => {
    const theme = useTheme();
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 800 }),
                withTiming(0.3, { duration: 800 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <View style={[styles.card, { backgroundColor: (theme.colors as any).surfaceContainerHighest || theme.colors.surfaceVariant }]}>
            <Animated.View style={[styles.idLine, { backgroundColor: theme.colors.onSurfaceVariant }, animatedStyle]} />
            <Animated.View style={[styles.titleLine, { backgroundColor: theme.colors.onSurface }, animatedStyle]} />
            <View style={styles.row}>
                <Animated.View style={[styles.infoLine, { backgroundColor: theme.colors.onSurfaceVariant }, animatedStyle]} />
                <View style={{ flex: 1 }} />
                <Animated.View style={[styles.circle, { backgroundColor: theme.colors.onSurfaceVariant }, animatedStyle]} />
            </View>
        </View>
    );
};

export const ChaptersLoadingView = () => {
    return (
        <View style={{ padding: 24 }}>
            {[1, 2, 3, 4, 5].map(i => <ChapterSkeleton key={i} />)}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        height: 110,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    idLine: {
        height: 10,
        width: 80,
        borderRadius: 5,
        marginBottom: 16,
    },
    titleLine: {
        height: 20,
        width: '60%',
        borderRadius: 10,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoLine: {
        height: 10,
        width: '40%',
        borderRadius: 5,
    },
    circle: {
        width: 24,
        height: 24,
        borderRadius: 12,
    }
});
