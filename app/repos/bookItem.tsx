import { Content, Repo, normalizeUrl } from "@/types";
import { router } from "expo-router";
import { Pressable, StyleSheet, View, Image, Dimensions } from "react-native";
import { useMemo } from "react";
import { AtelierText } from "@/components/AtelierText";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface BookItemProps {
    repo: Repo;
    item: Content;
    status?: 'Reading' | 'Completed' | 'Dropped' | 'Plan to Read';
    progress?: number; // 0 to 1
    totalChapters?: number;
    lastChapterRead?: string;
    lastReadTimestamp?: number;
    onLinkPress?: (link: string, item: Content) => void;
}

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2; // 2 columns with padding

export default function BookItem({ repo, item, status, progress = 0, totalChapters, lastReadTimestamp, onLinkPress }: BookItemProps) {
    const systemColorScheme = useColorScheme();
    const colorScheme = (systemColorScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
    const themeColors = Colors[colorScheme];
    
    const coverUri = normalizeUrl(item.bookImage, repo.repoUrl) || `https://picsum.photos/seed/${item.bookId}/200/300`;
    const ratingLabel = item.rating ? item.rating : undefined;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return '#15803d'; // Green-700
            case 'Dropped': return themeColors.onSurfaceVariant;
            case 'Plan to Read': return themeColors.outline;
            default: return themeColors.primary;
        }
    };

    return (
        <Pressable
            style={styles.container}
            onPress={() => {
                router.push({
                    pathname: '/contents',
                    params: { content: JSON.stringify(item), repo: JSON.stringify(repo) }
                } as never);
            }}
        >
            <View style={styles.coverWrapper}>
                <Image 
                    source={{ uri: coverUri }} 
                    style={styles.cover} 
                    resizeMode="cover"
                />
                {status ? (
                    <View style={[styles.badge, { backgroundColor: getStatusColor(status) }]}>
                        <AtelierText variant="caption" bold color="#fff" style={styles.badgeText}>
                            {status.toUpperCase()}
                        </AtelierText>
                    </View>
                ) : null}
            </View>
            
            <View style={styles.info}>
                <AtelierText variant="body" bold numberOfLines={1} style={styles.title}>
                    {item.title}
                </AtelierText>
                <AtelierText variant="caption" color={themeColors.onSurfaceVariant} style={styles.subtitle}>
                    {repo.name}
                </AtelierText>
                
                {status === 'Reading' && (
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBarBase, { backgroundColor: themeColors.surfaceContainerHighest }]}>
                            <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: themeColors.primaryContainer }]} />
                        </View>
                    </View>
                )}
                
                {status === 'Completed' && ratingLabel && (
                    <View style={styles.ratingRow}>
                        <MaterialCommunityIcons name="star" size={14} color={themeColors.primary} />
                        <AtelierText variant="caption" bold style={styles.ratingText}>
                            {ratingLabel} Rating
                        </AtelierText>
                    </View>
                )}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        width: COLUMN_WIDTH,
        marginBottom: 24,
    },
    coverWrapper: {
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    cover: {
        width: '100%',
        height: '100%',
    },
    badge: {
        position: 'absolute',
        top: 12,
        left: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        opacity: 0.9,
    },
    badgeText: {
        letterSpacing: 1.5,
        fontSize: 10,
    },
    info: {
        marginTop: 12,
    },
    title: {
        fontSize: 16,
        lineHeight: 20,
    },
    subtitle: {
        marginTop: 4,
        fontSize: 13,
    },
    progressContainer: {
        marginTop: 12,
    },
    progressBarBase: {
        height: 4,
        width: '100%',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    ratingText: {
        marginLeft: 4,
        fontSize: 11,
    },
});
