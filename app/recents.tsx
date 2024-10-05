import { RefreshControl, SafeAreaView, ScrollView, View, Image, Text } from "react-native";
import { List } from "react-native-paper";
import { ChapterTracker, getAllTrackersAsync } from "./favorites/tracker";
import React, { useState, useCallback, useEffect } from 'react';
import { ChapterCard } from "./contents/chapterCard";
import { timeAgo } from "./chapters/common";

export default function Recents() {

    const [refreshing, setRefreshing] = useState(false);
    const [trackers, setTrackers] = useState<ChapterTracker[] | null>(null);

    async function fetchTrackers() {
        const trackerMap = await getAllTrackersAsync();
        setTrackers(Object.values(trackerMap));
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

    const recentTrackers = trackers?.sort((a, b) => b.lastRead - a.lastRead);

    const groupedTrackers = recentTrackers?.reduce((acc, tracker) => {
        if (tracker.status === 'reading' || tracker.status === 'read') {
            const bookId = tracker.novel.bookId;
            if (!acc[bookId]) {
                acc[bookId] = [];
            }
            acc[bookId]?.push(tracker);
        }
        return acc;
    }, {} as Record<string, ChapterTracker[]>);

    const renderBookAccordion = (chapters: ChapterTracker[]) => {
        const chapter = chapters[0];
        return <List.Accordion id={chapter.novel.bookId}
            title={<Text numberOfLines={2} ellipsizeMode="tail"> {chapter.novel.title}</Text>}
            description={<Text numberOfLines={1} ellipsizeMode="tail"> {chapter.novel.author} · {timeAgo(chapter.lastRead)}</Text>}
            left={() => (
                <View style={{ marginLeft: 8 }}>
                    <Image
                        source={{ uri: chapter.novel.bookImage }}
                        style={{ width: 60, height: 90 }} />
                </View>
            )}

        >
            {chapters.map((tracker) => {
                return (
                    <ChapterCard props={{
                        content: tracker.novel,
                        repo: tracker.repo,
                        chapterId: tracker.chapterId,
                        enableNextPrev: false
                    }} />
                );
            })}
        </List.Accordion>;
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} >
                <List.Section>
                    {groupedTrackers && Object.values(groupedTrackers).map((chapters) => {
                        return renderBookAccordion(chapters);
                    })}
                </List.Section>
                <View style={{ marginBottom: 120 }} />
            </ScrollView>
        </SafeAreaView>
    );

}

const styles = {
    container: {
        flex: 1,
    },
    text: {
        fontSize: 18,
        margin: 16,
    },
};