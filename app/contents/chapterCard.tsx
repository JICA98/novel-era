import { Content, Repo } from "@/types";
import { chapterKey, fetchChapter } from "../chapters/_layout";
import { router } from "expo-router";
import { View, StyleSheet } from "react-native";
import { List, Title, IconButton, Divider, useTheme, ActivityIndicator } from "react-native-paper";
import { useDownloadStore, startDownload, removeFromStore, allDownloadsStore } from "../downloads/utils";

interface ChapterCardProps {
    index: number;
    start: number;
    repo: Repo;
    content: Content;
}

export function ChapterCard({ index, props }: { index: React.Key, props: ChapterCardProps }) {
    const repo = props.repo;
    const content = props.content;
    const id = `${props.start + props.index + 1}`;
    const key = chapterKey(repo, content, id);
    const downloads = allDownloadsStore((state: any) => state.downloads);
    const setDownloads = allDownloadsStore((state: any) => state.setDownloads);
    const downloadStore = useDownloadStore({ key, downloads, setDownloads });
    const storeContent = downloadStore((state: any) => state.content);
    const setLoading = downloadStore((state: any) => state.setLoading);
    const setContent = downloadStore((state: any) => state.setContent);

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

    return (
        <View key={index}>
            <List.Item
                key={index}
                title={() => <Title style={styles.chapterTitle} >Chapter {id}</Title>}
                right={_ => {
                    if (storeContent.data) {
                        return <IconButton
                            icon="check"
                            mode="contained-tonal"
                            size={14}
                            style={{ marginLeft: 'auto' }}
                            onPress={() => handleRemove()} />;
                    } else if (storeContent.noStarted) {
                        return <IconButton
                            icon="download-outline"
                            size={14}
                            mode="contained-tonal"
                            style={{ marginLeft: 'auto' }}
                            onPress={() => handleDownload()} />;
                    } else
                        if (storeContent?.isLoading) {
                            return <View style={styles.loading}>
                                <ActivityIndicator animating={true} size="small" />
                            </View>;
                        } else {
                            return <IconButton
                                icon="alert-circle-outline"
                                size={14}
                                mode="contained-tonal"
                                style={{ marginLeft: 'auto' }}
                                onPress={() => handleDownload()} />;
                        }
                }}
                onPress={() => router.push(
                    {
                        pathname: '/chapters',
                        params: {
                            id,
                            repo: JSON.stringify(repo),
                            content: JSON.stringify(content)
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
