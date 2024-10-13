import { RefreshControl, SafeAreaView, ScrollView, View, Image, Text, FlatList, ImageBackground } from "react-native";
import { IconButton, List, SegmentedButtons, Title, useTheme } from "react-native-paper";
import { ChapterTracker, getAllTrackersAsync, saveTracker } from "./favorites/tracker";
import React, { useState, useCallback, useEffect } from 'react';
import { ChapterCard } from "./contents/chapterCard";
import { timeAgo, RenderChapterProps } from "./chapters/common";
import { router } from "expo-router";
import Modal from "./components/modal";
import { emptyPlaceholder } from "./placeholders";

const PAGE_SIZE = 10;

enum FilterOption {
    ALL = 'all',
    READ = 'read',
    READING = 'reading',
    DELETE = 'delete',
}

export default function Recents() {
    const [loading, setLoading] = useState(true);
    const [filter, setFiler] = useState<FilterOption>(FilterOption.ALL);
    const [refreshing, setRefreshing] = useState(false);
    const [trackers, setTrackers] = useState<ChapterTracker[] | null>(null);
    const [pagination, setPagination] = useState(0);
    const [showDelete, setShowDelete] = useState(false);
    const colors = useTheme().colors;

    async function fetchTrackers() {
        setLoading(true);
        const trackerMap = await getAllTrackersAsync();
        const recentTrackers = Object.values(trackerMap)
            ?.filter((tracker) => !tracker.hideHistory && (tracker.status === 'reading' || tracker.status === 'read'))
            ?.sort((a, b) => b.lastRead - a.lastRead);
        setTrackers(recentTrackers);
        setPagination(0);
        setLoading(false);
    }

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTrackers();
        setTimeout(() => {
            setRefreshing(false);
        }, 200);
    }, []);

    useEffect(() => {
        fetchTrackers();
    }, []);

    if (loading) {
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Loading...</Text>
        </View>;
    }

    const renderBookAccordion = (chapter: ChapterTracker) => {
        return <List.Item id={chapter.novel.bookId}
            title={<Text numberOfLines={2} ellipsizeMode="tail"> {chapter.novel.title}</Text>}
            description={<Text numberOfLines={1} ellipsizeMode="tail"> Chapter {chapter.chapterId} · {timeAgo(chapter.lastRead)}</Text>}
            right={(_) => <IconButton icon="delete" onPress={() => {
                chapter.hideHistory = true;
                saveTracker(chapter).then(() => fetchTrackers());
            }} />}
            onPress={() => {
                const chapterProps: RenderChapterProps = {
                    focusedMode: false, id: chapter.chapterId, content: chapter.novel, repo: chapter.repo,
                    enableNextPrev: true,
                    data: ''
                };
                router.push(
                    {
                        pathname: '/chapters',
                        params: {
                            props: JSON.stringify(chapterProps),
                        }
                    })
            }}
            left={() => (
                <View style={{ marginLeft: 8 }}>
                    <Image
                        source={{ uri: chapter.novel.bookImage }}
                        style={{ width: 60, height: 90 }} />
                </View>
            )}
        >
        </List.Item>;
    };


    async function handleDeleteAll() {
        if (!trackers?.length) {
            return;
        }
        for (let i = 0; i < trackers.length; i++) {
            trackers[i].hideHistory = true;
            await saveTracker(trackers[i]);
        }
        fetchTrackers();
    }

    const paginatedData = getPage(trackers, pagination, PAGE_SIZE, filter);

    return (
        <SafeAreaView style={styles.container}>
            <Modal onResult={(result) => { setShowDelete(false); result && handleDeleteAll(); }} visible={showDelete}
                content={<Text style={{ margin: 16, color: colors.onSurface }}>This will delete all the history and cannot be undone.</Text>}
            />
            <FlatList
                onEndReached={() => {
                    const newPagination = pagination + 1;
                    setPagination(newPagination);
                }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                data={paginatedData}
                ListEmptyComponent={emptyPlaceholder(filter === FilterOption.ALL ? 'Nothing found in recents, try refreshing' :
                    'Nothing found in recents, are you sure you are on the right filter?')}
                renderItem={({ item }) => renderBookAccordion(item)}
                onEndReachedThreshold={0.4}
                ListFooterComponent={<View style={{ height: 100 }} />}
                ListHeaderComponent={
                    <View style={{ marginHorizontal: 8, marginVertical: 12 }}>
                        {handleSegmentedTop()}
                    </View>
                }
            />
        </SafeAreaView>
    );


    function handleSegmentedTop() {
        const actions = [
            {
                value: FilterOption.ALL, label: 'All',
                icon: 'book-open-variant',
            },
            {
                value: FilterOption.READ, label: 'Read',
                icon: 'book-open',
            },
            {
                value: FilterOption.READING, label: 'Reading',
                icon: 'book-open-page-variant',
            },
        ];
        if (trackers?.length) {
            actions.push({
                value: FilterOption.DELETE, label: 'Delete',
                icon: 'delete-sweep'
            },);
        }
        return <SegmentedButtons
            value={filter || ''}
            onValueChange={(option) => {
                switch (option) {
                    case FilterOption.ALL:
                    case FilterOption.READING:
                    case FilterOption.READ:
                        setFiler(option);
                        break;
                    case FilterOption.DELETE:
                        setShowDelete(true);
                        break;
                    default:
                        break;
                }
            }}
            buttons={actions} />;
    }
}

const getPage = (trackers: ChapterTracker[] | null, page: number, pageSize: number, filter: FilterOption) => {
    if (!trackers) {
        return [];
    }
    const start = page * pageSize;
    const end = start + pageSize;
    return trackers.slice(0, end).filter((tracker) => {
        if (filter === FilterOption.ALL) {
            return true;
        }
        return tracker.status === filter;
    });
}

const styles = {
    container: {
        flex: 1,
    },
    text: {
        fontSize: 18,
        margin: 16,
    },
    emptyImage: {
        height: 130,
    }
};