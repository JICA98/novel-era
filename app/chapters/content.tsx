import React, { useState, useEffect, useRef, memo, useCallback, } from 'react';
import { Text, View, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent, FlatList, ScrollView, ViewToken } from 'react-native';
import PagerView from 'react-native-pager-view';
import { IconButton, useTheme } from 'react-native-paper';
import RenderHtml, { CustomBlockRenderer, CustomMixedRenderer, CustomTextualRenderer } from 'react-native-render-html';
import { RenderChapterProps, navigateToNextChapter } from './common';
import { ChapterTracker, chapterTrackerStore, saveTracker, getOrCreateTrackerStore } from '../favorites/tracker';
import * as Speech from 'expo-speech';
import { buildHtmlFromSentence, htmlToIdSentences, indexOfSentence, isSpeechOrPause, Sentence, setTTS, SpeechAction, toQueue, TTS, ttsStore } from './tts';
import { UserPreferences, userPrefStore } from '../userpref';

export const RenderPagedContent: React.FC<RenderChapterProps> = (props: RenderChapterProps) => {
    const [pages, setPages] = useState<any[]>([]);
    const listRef = useRef<FlatList>(null);
    const [listLoaded, setListLoaded] = useState(false);
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
    const [viewableItems, setViewableItems] = useState<ViewToken<Sentence>[]>([]);
    const windowHeight = useWindowDimensions().height;
    const ttsConfig = (userPrefStore((state: any) => state.userPref) as UserPreferences).ttsConfig;

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
        let tts: TTS = {
            state: props.speachState, sentences, ttsQueue: toQueue(sentences),
            index: 0, ttsConfig
        };
        setTTStore(tts);
        if (tts.state === 'speak') {
            setTTS({ tts, setTTS: setTTStore });
        }
    }, [props.data]);

    const updateViewableItems = ({ viewableItems }:
        { viewableItems: ViewToken<Sentence>[] }): void => {
        setViewableItems(viewableItems);
        if (viewableItems.length && !isSpeechOrPause(tts.state)) {
            const currentSentence = getCurrentSentence(viewableItems);
            if (currentSentence) {
                tts.currentSentence = currentSentence.id;
                setTTStore({ ...tts });
            }
        }
    };

    useEffect(() => {
        if (tts.currentSentence && isSpeechOrPause(tts.state)) {
            scrollToSentence();
            handleLastSentence();
        }

        function scrollToSentence() {
            const isCurrentSentenceVisible = indexOfSentence(viewableItems.map(e => e.item), tts.currentSentence) > -1;
            if (!isCurrentSentenceVisible) {
                const index = indexOfSentence(tts.sentences, tts.currentSentence);
                if (index > -1) {
                    listRef.current?.scrollToIndex({ index, animated: false, viewOffset: 30 });
                    console.log('Scrolling to index', index, tts.ttsQueue.length);
                }
            }
        }

        function handleLastSentence() {
            const queueIndex = indexOfSentence(tts.ttsQueue, tts.currentSentence);
            if (queueIndex === tts.ttsQueue.length - 1) {
                console.log('Last sentence reached');
                const intervalId = setInterval(async () => {
                    const isCompleted = !(await Speech.isSpeakingAsync());
                    console.log('Is speaking', isCompleted);
                    if (isCompleted) {
                        updateChapterProgress(1);
                        clearInterval(intervalId);
                        navigateToNextChapter(props, 1, 'speak');
                    }
                }, 1000);
            }
        }
    }, [tts.currentSentence]);

    function updateChapterProgress(progress: number) {
        if (!tracker) {
            return;
        }
        const currentTimestamp = Date.now();
        const newChapterTracker: ChapterTracker = {
            ...tracker,
            chapterProgress: progress,
            lastRead: currentTimestamp,
            status: progress >= 1 ? 'read' : 'reading',
            hideHistory: false,
        };
        setTracker(newChapterTracker);
        saveTracker(newChapterTracker).then(() => { });
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
        <View style={{ padding: 16, marginBottom: 70, alignItems: 'center' }}>
            <IconButton
                icon={'arrow-down'}
                mode='contained-tonal'
                size={40}
                onPress={() => {
                    updateChapterProgress(1);
                    return navigateToNextChapter(props, 1);
                }} />
        </View>
    )}</>);
    return (
        <PagerView style={{ flex: 1 }} initialPage={0}>
            {pages.map((_, index) => {
                return (
                    <View key={index} style={{ flex: 1, marginHorizontal: 10 }}>
                        <FlatList
                            ref={listRef}
                            onScroll={onScroll}
                            onViewableItemsChanged={updateViewableItems}
                            viewabilityConfig={{ itemVisiblePercentThreshold: 100 }}
                            data={tts.sentences}
                            ListHeaderComponent={ListHeaderComponent}
                            ListFooterComponent={ListFooterComponent}
                            initialNumToRender={tts.sentences.length ? tts.sentences.length : 100}
                            renderItem={({ item }: { item: Sentence }) => (
                                <RenderComponent
                                    sentence={item}
                                    currentSentence={tts.currentSentence}
                                    state={tts.state}
                                />
                            )}
                            keyExtractor={(_) => _.id}
                            onContentSizeChange={(_: number, h: number) => {
                                if (!listLoaded) {
                                    if (props.fromPrevious) {
                                        const offset = (h + 500 - windowHeight);
                                        listRef.current?.scrollToOffset({ offset, animated: false });
                                    } else if (tracker && tracker.chapterProgress > 0 && tts.sentences.length) {
                                        const offset = tracker.chapterProgress * (h - windowHeight);
                                        listRef.current?.scrollToOffset({ offset, animated: false });
                                    }
                                    setListLoaded(true);
                                }
                            }} />
                    </View>
                );
            })}
        </PagerView>
    );

};

function getCurrentSentence(viewables: ViewToken<Sentence>[]): Sentence | undefined {
    if (viewables[0]?.index === 0) {
        return viewables[0]?.item?.children?.[0];
    }
    const initialChildren = viewables[0]?.item?.children;
    if (initialChildren && initialChildren.length > 5) {
        return initialChildren[5];
    }
    const children = viewables[1]?.item?.children ?? initialChildren;
    if (children && children.length) {
        const currentSentence = children[1] ?? children[0];
        return currentSentence;
    }
    return undefined;
}


const RenderComponent = memo(({ sentence, currentSentence, state }:
    { sentence: Sentence, currentSentence?: string, state: SpeechAction }) => {
    const editorPref = (userPrefStore((state: any) => state.userPref) as UserPreferences).editorPreferences;
    const setCurrentSentence: (s: string) => void = ttsStore((state: any) => state.setCurrentSentence);
    const { width } = useWindowDimensions();
    const theme = useTheme();
    const sentenceStyle: any = {};
    if (isSpeechOrPause(state) && currentSentence) {
        sentenceStyle[currentSentence] = {
            backgroundColor: theme.colors.primary,
            color: theme.colors.onPrimary,
        };
    }
    return (
        <View style={{ paddingBottom: 0 }}>
            <RenderHtml
                contentWidth={width}
                source={{ html: sentence.html ?? '' }}
                baseStyle={{
                    fontSize: editorPref.fontSize,
                    color: theme.colors.onBackground,
                    fontFamily: editorPref.fontFamily,
                    letterSpacing: editorPref.letterSpacing,
                }}
                ignoredDomTags={['nf3e90', 'nf5865']}
                idsStyles={sentenceStyle}
                tagsStyles={{
                    a: {
                        color: theme.colors.onSurface,
                        textDecorationLine: 'none',
                    }
                }}
                renderersProps={{
                    a: {
                        onPress(_, __, attr, ___) {
                            console.log('Link pressed', attr.id);
                            if (attr.id) {
                                setCurrentSentence(attr.id);
                            }
                        },
                    }
                }}
            />
        </View>
    );
}, (prevProps, nextProps) => {
    return prevProps.sentence.html === nextProps.sentence.html
        && prevProps.currentSentence === nextProps.currentSentence && prevProps.state === nextProps.state;
});

