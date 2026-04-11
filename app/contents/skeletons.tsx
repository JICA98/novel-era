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

export const NovelSkeleton = () => {
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
        backgroundColor: theme.colors.onSurfaceVariant,
    }));

    return (
        <View style={[{ flex: 1, backgroundColor: theme.colors.surface }]}>
            <View style={{ height: 100, width: '100%', marginBottom: 10 }} />
            
            <View style={{ paddingHorizontal: 24, paddingTop: 20, flexDirection: 'row' }}>
                <Animated.View style={[{ width: 140, height: 210, borderRadius: 16 }, animatedStyle]} />
                
                <View style={{ flex: 1, marginLeft: 20, justifyContent: 'center' }}>
                    <Animated.View style={[{ height: 12, width: 60, borderRadius: 6, marginBottom: 12 }, animatedStyle]} />
                    <Animated.View style={[{ height: 28, width: '90%', borderRadius: 8, marginBottom: 8 }, animatedStyle]} />
                    <Animated.View style={[{ height: 28, width: '60%', borderRadius: 8, marginBottom: 16 }, animatedStyle]} />
                    
                    <Animated.View style={[{ height: 16, width: '70%', borderRadius: 8, marginBottom: 24 }, animatedStyle]} />
                    
                    <View style={{ flexDirection: 'row' }}>
                        <Animated.View style={[{ height: 40, width: 40, borderRadius: 20, marginRight: 16 }, animatedStyle]} />
                        <Animated.View style={[{ height: 40, width: 40, borderRadius: 20 }, animatedStyle]} />
                    </View>
                </View>
            </View>

            <View style={{ flexDirection: 'row', paddingHorizontal: 24, marginTop: 40, marginBottom: 24 }}>
                <Animated.View style={[{ height: 24, width: 80, borderRadius: 8, marginRight: 24 }, animatedStyle]} />
                <Animated.View style={[{ height: 24, width: 80, borderRadius: 8 }, animatedStyle]} />
            </View>

            <View style={{ paddingHorizontal: 24 }}>
                <Animated.View style={[{ height: 16, width: '100%', borderRadius: 8, marginBottom: 12 }, animatedStyle]} />
                <Animated.View style={[{ height: 16, width: '90%', borderRadius: 8, marginBottom: 12 }, animatedStyle]} />
                <Animated.View style={[{ height: 16, width: '95%', borderRadius: 8, marginBottom: 12 }, animatedStyle]} />
                <Animated.View style={[{ height: 16, width: '80%', borderRadius: 8, marginBottom: 12 }, animatedStyle]} />
                <Animated.View style={[{ height: 16, width: '85%', borderRadius: 8, marginBottom: 12 }, animatedStyle]} />
            </View>
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


export default function DummySkeletons() {
    return null;
}
