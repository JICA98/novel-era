import React, { useState, useEffect, useRef } from 'react';
import { View, useWindowDimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import PagerView from 'react-native-pager-view';
import { IconButton, useTheme } from 'react-native-paper';
import RenderHtml from 'react-native-render-html';
import { RenderChapterProps, navigateToNextChapter } from './common';
import { ChapterTracker, novelTrackerStore, saveTracker, useNovelTrackerStore } from '../favorites/tracker';

export const RenderPagedContent: React.FC<RenderChapterProps> = (props: RenderChapterProps) => {
    const [pages, setPages] = useState<any[]>([]);
    const { width } = useWindowDimensions();
    const theme = useTheme();
    const scrollViewRef = useRef<ScrollView>(null);
    const chapterId = props.id;
    const useTracker = useNovelTrackerStore({
        chapterId: props.id,
        repo: props.repo,
        content: props.content,
        allTrackers: novelTrackerStore((state: any) => state.content),
        setAllTrackers: novelTrackerStore((state: any) => state.setContent),
    });
    const tracker = useTracker((state: any) => state.content) as ChapterTracker;
    const setTracker = useTracker((state: any) => state.setContent) as (_: ChapterTracker) => void;
    const windowHeight = useWindowDimensions().height;

    // Function to split content into pages
    const splitContentIntoPages = (content: string) => {
        const words = content.split(' ');
        const pageSize = 20500;
        const result = [];

        for (let i = 0; i < words.length; i += pageSize) {
            result.push(words.slice(i, i + pageSize).join(' '));
        }

        return result;
    };

    useEffect(() => {
        const pageContent = splitContentIntoPages(props.data);
        setPages(pageContent);
    }, [props.data]);

    const prevChapBtn = <View style={{ padding: 16, marginBottom: 30, alignItems: 'center' }}>
        <IconButton
            icon={'arrow-up'}
            mode='contained-tonal'
            size={40}
            onPress={() => navigateToNextChapter(props, -1)} />
    </View>;
    const nextChapBtn = <View style={{ padding: 16, marginBottom: 30, alignItems: 'center' }}>
        <IconButton
            icon={'arrow-down'}
            mode='contained-tonal'
            size={40}
            onPress={() => {
                updateChapterProgress(1);
                return navigateToNextChapter(props, 1);
            }} />
    </View>;

    function updateChapterProgress(progress: number) {
        if (!tracker) {
            console.log('Chapter tracker not found', chapterId);
            return;
        }
        const currentTimestamp = Date.now();
        console.log('Updating progress', currentTimestamp);
        const newChapterTracker: ChapterTracker = {
            ...tracker,
            chapterProgress: progress,
            lastRead: currentTimestamp,
            status: progress >= 1 ? 'read' : 'reading',
        };
        setTracker(newChapterTracker);
        saveTracker(newChapterTracker).then(() => console.log('Saved'));
    }
    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const nativeEvent = event.nativeEvent;
        const contentSize = nativeEvent.contentSize.height;
        const currentOffset = nativeEvent.contentOffset.y;
        const totalOffset = contentSize - windowHeight;
        const progress = currentOffset / totalOffset;
        if (progress > 0) {
            updateChapterProgress(progress);
        }
    }

    return (
        <PagerView style={{ flex: 1 }} initialPage={0}>
            {pages.map((eventsHTML, index) => {
                const source = { html: eventsHTML };
                return (
                    <View key={index} style={{ flex: 1, marginHorizontal: 10 }}>

                        <ScrollView ref={scrollViewRef}
                            onScroll={onScroll}
                            onContentSizeChange={(w: number, h: number) => {
                                if (props.fromPrevious) {
                                    scrollViewRef.current?.scrollToEnd({ animated: false });
                                } else if (tracker && tracker.chapterProgress > 0) {
                                    const yOffset = tracker.chapterProgress * (h - windowHeight);
                                    scrollViewRef.current?.scrollTo({ y: yOffset, animated: false })
                                    return;
                                }
                            }}>
                            <View style={{ margin: props.focusedMode ? 40 : 20 }} ></View>
                            {(props.id !== `1` && props.continueReading && props.enableNextPrev) && (
                                prevChapBtn
                            )}
                            <RenderHtml
                                contentWidth={width}
                                source={source}
                                baseStyle={{ fontSize: 18, color: theme.colors.onBackground, fontFamily: 'serif' }}
                                ignoredDomTags={['nf3e90', 'nf5865']}
                            />
                            <View style={{ margin: 20 }} ></View>
                            {(props.id !== props.content.latestChapter?.toString() && props.enableNextPrev) && (
                                nextChapBtn
                            )}
                        </ScrollView>
                    </View>
                );
            })}
        </PagerView>
    );
};
