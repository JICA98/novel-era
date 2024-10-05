import { Content, Repo } from "@/types";
import { router } from "expo-router";
import { View, StyleSheet } from "react-native";
import { List, Title, IconButton, Divider, ActivityIndicator } from "react-native-paper";
import { useDownloadStore, startDownload, removeFromStore, allDownloadsStore } from "../downloads/utils";
import { chapterKey, RenderChapterProps, fetchChapter } from "../chapters/common";
import { getOrCreateTrackerStore, chapterTrackerStore, ChapterTracker } from "../favorites/tracker";

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
        data: storeContent.data?.chapterContent ?? ''
    };
    const useTracker = getOrCreateTrackerStore({
        chapterId: chapterProps.id,
        repo: props.repo,
        content: props.content,
        allTrackers: chapterTrackerStore((state: any) => state.content),
        setAllTrackers: chapterTrackerStore((state: any) => state.setContent),
    });
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
            return <View style={styles.loading}>
                <ActivityIndicator animating={true} size="small" />
            </View>;
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
            return (<View style={styles.container}>
                <Title style={{ fontSize: 13, opacity: .8 }}>
                    {percentage}/100
                </Title>
            </View>);
        }
    }

    return (
        <View key={id}>
            <List.Item
                key={id}
                right={() => downloadIcon()}
                title={() => <View>
                    <Title style={[styles.chapterTitle]} >Chapter {id}</Title>
                </View>}
                style={{ opacity: completed ? .5 : 1 }}
                description={percentageDesc}
                onPress={() => router.push(
                    {
                        pathname: '/chapters',
                        params: {
                            props: JSON.stringify(chapterProps),
                        }
                    })}
            />
            <Divider />
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listPadding: {
        padding: 16,
    },
    loading: {
        margin: 4.0, paddingHorizontal: 5.0, paddingVertical: 5.0
    },
    errorText: {
        textAlign: 'center',
        margin: 16,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        zIndex: -11,
        elevation: 3,
    },
    appbar: {
        backgroundColor: 'transparent',
        justifyContent: 'center',
    },
    imageBackground: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 100,
    },
    innerView: {
        padding: 16,
    },
    title: {
        fontSize: 15,
        color: 'white',
        fontVariant: ['small-caps'],
        textShadowColor: 'rgba(0, 0, 0, 0.90)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    contentContainer: {
        paddingHorizontal: 16,
    },
    card: {
        marginBottom: 16,
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    chapterTitle: {
        fontSize: 16,
    },
});
