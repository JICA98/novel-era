import React, { useState, useEffect, useRef } from 'react';
import { View, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent, FlatList, ScrollView } from 'react-native';
import PagerView from 'react-native-pager-view';
import { IconButton, useTheme } from 'react-native-paper';
import RenderHtml from 'react-native-render-html';
import { RenderChapterProps, navigateToNextChapter } from './common';
import { ChapterTracker, chapterTrackerStore, saveTracker, getOrCreateTrackerStore } from '../favorites/tracker';
import { UserPreferences } from '../settings/types';
import { userPrefStore } from '../storage';
import { buildHtmlFromSentence, htmlToIdSentences, Sentence, toQueue, TTS, ttsStore } from './tts';

export const RenderPagedContent: React.FC<RenderChapterProps> = (props: RenderChapterProps) => {
    const [pages, setPages] = useState<any[]>([]);
    const listRef = useRef<ScrollView>(null);
    const chapterId = props.id;
    const useTracker = getOrCreateTrackerStore({
        chapterId: props.id,
        repo: props.repo,
        content: props.content,
        allTrackers: chapterTrackerStore((state: any) => state.content),
        setAllTrackers: chapterTrackerStore((state: any) => state.setContent),
    });
    const tts: TTS = ttsStore((state: any) => state.tts);
    const setTTStore: (tts: TTS) => void = ttsStore((state: any) => state.setTTS);
    const tracker = useTracker((state: any) => state.content) as ChapterTracker;
    const setTracker = useTracker((state: any) => state.setContent) as (_: ChapterTracker) => void;
    const windowHeight = useWindowDimensions().height;
    const { height } = useWindowDimensions();

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
        const { html, sentences } = htmlToIdSentences(props.data);
        const pageContent = splitContentIntoPages(html);
        setPages(pageContent);
        let tts: TTS = { state: 'unknown', queue: toQueue(sentences) };
        setTTStore(tts);
    }, [props.data]);

    useEffect(() => {
        if (tts.currentSentence) {
            const index = tts.queue.findIndex((sentence) => sentence.id === tts.currentSentence);
            if (index > -1) {
                // listRef.current?.scrollToIndex({ index, animated: true, viewOffset: height / 2.5 });
            }
        }
    }, [tts.currentSentence]);

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
            hideHistory: false,
        };
        setTracker(newChapterTracker);
        saveTracker(newChapterTracker).then(() => console.log('Saved'));
    }
    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        console.log('Scrolling', event);
        const nativeEvent = event.nativeEvent;
        const contentSize = nativeEvent.contentSize.height;
        const currentOffset = nativeEvent.contentOffset.y;
        const totalOffset = contentSize - windowHeight;
        const progress = currentOffset / totalOffset;
        if (progress > 0) {
            updateChapterProgress(progress);
        }
    }
    console.log('current sentence', tts.currentSentence);
    const ListHeaderComponent = (<View>
        <View style={{ margin: props.focusedMode ? 40 : 20 }} ></View>
        {(props.id !== `1` && props.continueReading && props.enableNextPrev) && (
            <View style={{ padding: 16, marginBottom: 30, alignItems: 'center' }}>
                <IconButton
                    icon={'arrow-up'}
                    mode='contained-tonal'
                    size={40}
                    onPress={() => navigateToNextChapter(props, -1)} />
            </View>
        )}
    </View>);
    const ListFooterComponent = (<>{(props.id !== props.content.latestChapter?.toString() && props.enableNextPrev) && (
        nextChapBtn
    )}</>);
    return (
        <PagerView style={{ flex: 1 }} initialPage={0}>
            {pages.map((html, index) => {
                return (
                    <View key={index} style={{ flex: 1, marginHorizontal: 10 }}>
                        <ScrollView
                            ref={listRef}
                            onScroll={onScroll}
                            onContentSizeChange={(_: number, h: number) => {
                                if (props.fromPrevious) {
                                    listRef.current?.scrollToEnd({ animated: false });
                                } else if (tracker && tracker.chapterProgress > 0) {
                                    const yOffset = tracker.chapterProgress * (h - windowHeight);
                                    listRef.current?.scrollTo({ y: yOffset, animated: false });
                                    return;
                                }
                            }}
                        >
                            {ListHeaderComponent}
                            {<RenderComponent html={html} currentSentence={tts.currentSentence} />}
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


function RenderComponent({ html, currentSentence }: { html: string, currentSentence?: string }) {
    const editorPref = (userPrefStore((state: any) => state.userPref) as UserPreferences).editorPreferences;
    const { width } = useWindowDimensions();
    const theme = useTheme();
    return (
        <View style={{ paddingBottom: 15 }}>
            <RenderHtml
                contentWidth={width}
                source={{ html }}
                baseStyle={{
                    fontSize: editorPref.fontSize, color: theme.colors.onBackground,
                    fontFamily: editorPref.fontFamily,
                    letterSpacing: editorPref.letterSpacing,
                }}
                ignoredDomTags={['nf3e90', 'nf5865']}
                idsStyles={{
                    [`${currentSentence}`]: {
                        backgroundColor: 'black',
                    },
                }}
            />
        </View>
    );
}
