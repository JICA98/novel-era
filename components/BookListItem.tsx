import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Content, Repo, normalizeUrl } from '@/types';
import { AtelierText } from './AtelierText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

function formatRelativeDate(timestamp?: number): string {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatChapterDisplay(progress: number, totalChapters?: number): { current: number; total: number } {
    if (totalChapters && totalChapters > 0) {
        const current = Math.max(1, Math.round(progress * totalChapters));
        return { current, total: totalChapters };
    }
    // Fallback: estimate from progress alone
    const estimatedTotal = progress > 0 ? Math.max(1, Math.round(1 / progress)) * 10 : 10;
    const current = Math.round(progress * estimatedTotal);
    return { current, total: estimatedTotal };
}

function resolveCurrentChapter(progress: number, totalChapters?: number, lastChapterRead?: string): number {
    const parsedLastChapter = Number(lastChapterRead);
    if (Number.isFinite(parsedLastChapter) && parsedLastChapter > 0) {
        return parsedLastChapter;
    }

    return formatChapterDisplay(progress, totalChapters).current;
}

interface BookListItemProps {
    repo: Repo;
    item: Content;
    status?: 'Reading' | 'Completed' | 'Dropped' | 'Plan to Read';
    progress?: number;
    totalChapters?: number;
    lastChapterRead?: string;
    lastReadTimestamp?: number;
    onPress?: () => void;
}

export const BookListItem: React.FC<BookListItemProps> = ({
    repo,
    item,
    status,
    progress = 0,
    totalChapters,
    lastChapterRead,
    lastReadTimestamp,
    onPress
}) => {
    const systemColorScheme = useColorScheme();
    const colorScheme = (systemColorScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
    const themeColors = Colors[colorScheme];

    const coverUri = normalizeUrl(item.bookImage, repo.repoUrl) || `https://picsum.photos/seed/${item.bookId}/200/300`;

    const getStatusColors = (status: string) => {
        switch (status) {
            case 'Completed':
                return { bg: themeColors.surfaceContainerHighest, text: themeColors.onSurfaceVariant };
            case 'Dropped':
                return { bg: '#ffdad6', text: '#93000a' }; // Error container
            case 'Plan to Read':
                return { bg: themeColors.outlineVariant, text: themeColors.onSurfaceVariant };
            default: // Reading
                return { bg: themeColors.secondaryContainer, text: themeColors.onSecondaryContainer };
        }
    };

    const statusTheme = status ? getStatusColors(status) : undefined;

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            router.push({
                pathname: '/contents',
                params: { content: JSON.stringify(item), repo: JSON.stringify(repo) }
            } as any);
        }
    };

    return (
        <TouchableOpacity 
            style={[styles.container, { backgroundColor: 'transparent' }]} 
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <View style={styles.contentRow}>
                {/* Cover Image */}
                <View style={[styles.coverContainer, { backgroundColor: themeColors.surfaceContainer }]}>
                    <Image source={{ uri: coverUri }} style={styles.coverImage} resizeMode="cover" />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.3)']}
                        style={styles.imageOverlay}
                    />
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <View style={styles.headerRow}>
                        <AtelierText variant="body" bold numberOfLines={2} style={styles.title}>
                            {item.title}
                        </AtelierText>
                        {status && statusTheme ? (
                            <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
                                <AtelierText variant="caption" bold style={[styles.statusText, { color: statusTheme.text }]}>
                                    {status.toUpperCase()}
                                </AtelierText>
                            </View>
                        ) : null}
                    </View>

                    <AtelierText variant="caption" color={themeColors.onSurfaceVariant} style={styles.authorText}>
                        {item.author || repo.name} • {item.latestChapter ? `Vol. ${item.latestChapter}` : 'Vol. 01'}
                    </AtelierText>

                    {status === 'Reading' ? (
                        <View style={styles.progressSection}>
                            <View style={styles.progressLabelRow}>
                                <AtelierText variant="caption" bold color={themeColors.onSurfaceVariant} style={styles.progressText}>
                                    Chapter {resolveCurrentChapter(progress, totalChapters, lastChapterRead)} of {formatChapterDisplay(progress, totalChapters).total}
                                </AtelierText>
                                <AtelierText variant="caption" bold color={themeColors.onSurfaceVariant}>
                                    {Math.round(progress * 100)}%
                                </AtelierText>
                            </View>
                            <View style={[styles.progressTrack, { backgroundColor: themeColors.surfaceContainer }]}>
                                <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: themeColors.primary }]} />
                            </View>
                        </View>
                    ) : status === 'Completed' ? (
                        <View style={styles.ratingRow}>
                            <View style={styles.ratingBadge}>
                                <MaterialIcons name="star" size={14} color={themeColors.secondary} />
                                <AtelierText variant="caption" bold color={themeColors.secondary} style={styles.ratingText}>
                                    {item.rating || '4.9'} Rating
                                </AtelierText>
                            </View>
                            <AtelierText variant="caption" color={themeColors.onSurfaceVariant}>
                                {formatRelativeDate(lastReadTimestamp) || `Read ${formatChapterDisplay(progress, totalChapters).total} chapters`}
                            </AtelierText>
                        </View>
                    ) : status === 'Dropped' ? (
                        <View style={styles.droppedSection}>
                            <AtelierText variant="caption" italic color={themeColors.onSurfaceVariant}>
                                Stopped at Chapter {formatChapterDisplay(progress, totalChapters).current}
                            </AtelierText>
                        </View>
                    ) : status === 'Plan to Read' ? (
                        <View style={styles.droppedSection}>
                            <AtelierText variant="caption" italic color={themeColors.onSurfaceVariant}>
                                Not started yet
                            </AtelierText>
                        </View>
                    ) : null}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 8,
    },
    contentRow: {
        flexDirection: 'row',
        gap: 16,
    },
    coverContainer: {
        width: 80,
        height: 120,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
    },
    infoSection: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
    },
    title: {
        flex: 1,
        fontSize: 18,
        lineHeight: 22,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 99,
    },
    statusText: {
        fontSize: 8,
        letterSpacing: 1,
    },
    authorText: {
        marginTop: 4,
    },
    progressSection: {
        marginTop: 12,
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    progressText: {
        fontSize: 10,
    },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 11,
    },
    droppedSection: {
        marginTop: 8,
    },
});
