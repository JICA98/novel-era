import React, { useState, useEffect, useRef } from 'react';
import { View, useWindowDimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import PagerView from 'react-native-pager-view';
import { IconButton, useTheme } from 'react-native-paper';
import RenderHtml from 'react-native-render-html';
import { RenderChapterProps, navigateToNextChapter, textContent } from './common';
import { ChapterTracker, chapterTrackerStore, saveTracker, getOrCreateTrackerStore } from '../favorites/tracker';
import { UserPreferences } from '../settings/types';
import { userPrefStore } from '../storage';
import { htmlToIdSentences, setTTS, toQueue, TTS, ttsStore } from './tts';

export const RenderPagedContent: React.FC<RenderChapterProps> = (props: RenderChapterProps) => {
    const editorPref = (userPrefStore((state: any) => state.userPref) as UserPreferences).editorPreferences;
    const [pages, setPages] = useState<any[]>([]);
    const { width } = useWindowDimensions();
    const theme = useTheme();
    const scrollViewRef = useRef<ScrollView>(null);
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
            hideHistory: false,
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
    console.log('current sentence', tts.currentSentence);
    return (
        <PagerView style={{ flex: 1 }} initialPage={0}>
            {pages.map((eventsHTML, index) => {
                const source = { html: eventsHTML };
                return (
                    <View key={index} style={{ flex: 1, marginHorizontal: 10 }}>

                        <ScrollView ref={scrollViewRef}
                            onScroll={onScroll}
                            onContentSizeChange={(_: number, h: number) => {
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
                                baseStyle={{
                                    fontSize: editorPref.fontSize, color: theme.colors.onBackground,
                                    fontFamily: editorPref.fontFamily,
                                    letterSpacing: editorPref.letterSpacing,
                                }}
                                ignoredDomTags={['nf3e90', 'nf5865']}
                                idsStyles={{
                                    [`${tts.currentSentence}`]: {
                                        backgroundColor: 'black', // Change this to your desired color
                                    },
                                }}
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


function TTSTextComponent(text: string) {

}
