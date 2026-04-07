import { Content, Repo } from "@/types";
import { router } from "expo-router";
import { View, StyleSheet, Text, TouchableOpacity, Platform } from "react-native";
import { IconButton, ActivityIndicator, useTheme } from "react-native-paper";
import { useDownloadStore, startDownload, removeFromStore, allDownloadsStore } from "../downloads/utils";
import { chapterKey, RenderChapterProps, fetchChapter } from "../chapters/common";
import { getOrCreateTrackerStore, chapterTrackerStore, ChapterTracker } from "../favorites/tracker";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface ChapterCardProps {
    chapterId: string;
    repo: Repo;
    content: Content;
    enableNextPrev: boolean;
}

export function ChapterCard({ props }: { props: ChapterCardProps }) {
    const repo = props.repo;
    const content = props.content;
    const id = props.chapterId;
    const key = chapterKey(repo, content, id);
    const downloads = allDownloadsStore((state: any) => state.downloads);
    const setDownloads = allDownloadsStore((state: any) => state.setDownloads);
    const downloadStore = useDownloadStore({ key, downloads, setDownloads });
    const storeContent = downloadStore((state: any) => state.content);
    const setLoading = downloadStore((state: any) => state.setLoading);
    const setContent = downloadStore((state: any) => state.setContent);
    const chapterProps: RenderChapterProps = {
        focusedMode: false, id, content, repo,
        enableNextPrev: props.enableNextPrev,
        data: storeContent.data?.chapterContent ?? '',
        speachState: 'unknown',
    };
    const useTracker = getOrCreateTrackerStore({
        chapterId: chapterProps.id,
        repo: props.repo,
        content: props.content,
        allTrackers: chapterTrackerStore((state: any) => state.content),
        setAllTrackers: chapterTrackerStore((state: any) => state.setContent),
    });
    const theme = useTheme();
    const tracker = useTracker((state: any) => state.content) as ChapterTracker;
    const completed = tracker.status === 'read';

    function handleDownload(): void {
        console.log('Download chapter');
        startDownload({
            fetcher: () => fetchChapter(repo, content, id),
            setLoading,
            setContent,
        });
    }

    function handleRemove(): void {
        console.log('Remove chapter');
        removeFromStore({ key, downloads, setDownloads });
        setContent({ noStarted: true });
    }

    function downloadIcon() {
        if (storeContent.data) {
            return <IconButton
                icon="check"
                mode="contained-tonal"
                size={14}
                style={{ marginRight: 'auto' }}
                onPress={() => handleRemove()} />;
        } else if (storeContent.noStarted) {
            return <IconButton
                icon="download-outline"
                size={14}
                mode="contained-tonal"
                style={{ marginRight: 'auto' }}
                onPress={() => handleDownload()} />;
        } else if (storeContent?.isLoading) {
            return (
                <View style={styles.activityIndicator}>
                    <ActivityIndicator animating={true} size="small" color={theme.colors.primary} />
                </View>
            );
        } else {
            return <IconButton
                icon="alert-circle-outline"
                size={14}
                mode="contained-tonal"
                style={{ marginRight: 'auto' }}
                onPress={() => handleDownload()} />;
        }
    }

    function percentageDesc() {
        if (!completed && tracker.chapterProgress) {
            const percentage = (Math.min(tracker.chapterProgress, 1) * 100).toFixed(0);
            return (
                <View style={styles.percentageContainer}>
                    <Text style={[styles.percentageText, { color: theme.colors.primary }]}>
                        {percentage}/100
                    </Text>
                </View>
            );
        }
    }

    return (
        <TouchableOpacity
            key={id}
            activeOpacity={0.7}
            style={[styles.chapterItem, { backgroundColor: (theme.colors as any).surfaceContainerHighest, borderColor: theme.colors.outlineVariant }, completed && { opacity: 0.6 }]}
            onPress={() => router.push({
                pathname: '/chapters' as any,
                params: {
                    props: JSON.stringify(chapterProps),
                }
            })}
        >
            <View style={styles.chapterInfo}>
                <View style={styles.chapterHeader}>
                    <Text style={[styles.chapterNumber, { color: theme.colors.onSurfaceVariant }]}>CHAPTER {id}</Text>
                    {id === "104" && ( // Example of NEW badge logic
                        <View style={[styles.newBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                            <Text style={[styles.newBadgeText, { color: theme.colors.onPrimaryContainer }]}>NEW</Text>
                        </View>
                    )}
                </View>
                <Text style={[styles.chapterTitleText, { color: theme.colors.onSurface }]} numberOfLines={1}>
                    {/* In a real app, this would be content.chapterTitle or similar */}
                    {id === "1" ? "The First Thread" : `Chapter Title ${id}`}
                </Text>
                <Text style={[styles.chapterMeta, { color: theme.colors.onSurfaceVariant }]}>
                    Updated {id === "1" ? "2 days ago" : "just now"} • 3.2k words
                </Text>
            </View>

            <View style={styles.chapterActions}>
                {storeContent?.isLoading ? (
                    <ActivityIndicator size="small" color="#171c3c" />
                ) : (
                    <IconButton
                        icon={storeContent.data ? "check-circle" : "arrow-right"}
                        iconColor={storeContent.data ? theme.colors.primary : theme.colors.outline}
                        size={24}
                        onPress={storeContent.data ? handleRemove : handleDownload}
                    />
                )}
            </View>
        </TouchableOpacity>
    );
}


const styles = StyleSheet.create({
    chapterItem: {
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.03)',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    percentageContainer: {
        marginTop: 4,
    },
    percentageText: {
        fontFamily: 'Manrope-Medium',
        fontSize: 12,
        color: '#171c3c',
        opacity: 0.6,
    },
    chapterInfo: {
        flex: 1,
    },
    chapterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    chapterNumber: {
        fontFamily: 'Manrope-ExtraBold',
        fontSize: 10,
        color: '#46464d',
        opacity: 0.4,
        letterSpacing: 1,
    },
    newBadge: {
        backgroundColor: '#ffdcc3',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    newBadgeText: {
        fontFamily: 'Manrope-Bold',
        fontSize: 8,
        color: '#6a3b0e',
    },
    chapterTitleText: {
        fontFamily: 'NotoSerif-Bold',
        fontSize: 18,
        color: '#171c3c',
        marginBottom: 4,
    },
    chapterMeta: {
        fontFamily: 'Manrope-Medium',
        fontSize: 12,
        color: '#46464d',
        opacity: 0.7,
    },
    chapterActions: {
        marginLeft: 12,
    },
    activityIndicator: {
        margin: 8,
    },
});

export default function() { return null; }
