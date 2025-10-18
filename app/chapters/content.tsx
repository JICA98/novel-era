import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent, FlatList, ViewToken, Animated } from 'react-native';
import PagerView from 'react-native-pager-view';
import { IconButton } from 'react-native-paper';
import { RenderChapterProps, navigateToNextChapter } from './common';
import { ChapterTracker, chapterTrackerStore, saveTracker, getOrCreateTrackerStore } from '../../lib/favorites/tracker';
import * as Speech from 'expo-speech';
import { htmlToIdSentences, indexOfSentence, isSpeechOrPause, Sentence, setTTS, toQueue, TTS, ttsStore } from './tts';
import { UserPreferences, userPrefStore } from '../userpref';
import SentenceRenderer from './html';

export const RenderPagedContent: React.FC<RenderChapterProps> = (props: RenderChapterProps) => {
    const [pages, setPages] = useState<any[]>([]);
    const listRef = useRef<FlatList>(null);
    const [listLoaded, setListLoaded] = useState(false);
    const autoScrollTimerRef = useRef<number | null>(null);
    const [isAutoScrolling, setIsAutoScrolling] = useState(false);
    const [autoScrollPaused, setAutoScrollPaused] = useState(false);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const fadeAnimation = useRef(new Animated.Value(1)).current;
    const slideAnimation = useRef(new Animated.Value(0)).current;
    const flipAnimation = useRef(new Animated.Value(0)).current;
    const userPref = userPrefStore((state: any) => state.userPref) as UserPreferences;
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
    const ttsConfig = userPref?.ttsConfig;
    const editorPref = userPref?.editorPreferences;
    const readingExperience = userPref?.readingExperience;

    const splitContentIntoPages = (content: string) => {
        const words = content.split(' ');
        const pageSize = 20500;
        const result = [];

        for (let i = 0; i < words.length; i += pageSize) {
            result.push(words.slice(i, i + pageSize).join(' '));
        }
        return result;
    };

    // Page turn animation functions
    const animatePageTurn = useCallback((direction: 'next' | 'prev') => {
        if (!readingExperience?.pageTurnAnimation.enabled) {
            return;
        }

        const animationType = readingExperience.pageTurnAnimation.type;
        const animationSpeed = readingExperience.pageTurnAnimation.speed;

        switch (animationType) {
            case 'fade':
                Animated.sequence([
                    Animated.timing(fadeAnimation, {
                        toValue: 0,
                        duration: animationSpeed / 2,
                        useNativeDriver: true,
                    }),
                    Animated.timing(fadeAnimation, {
                        toValue: 1,
                        duration: animationSpeed / 2,
                        useNativeDriver: true,
                    }),
                ]).start();
                break;

            case 'slide':
                const slideValue = direction === 'next' ? -windowHeight : windowHeight;
                Animated.sequence([
                    Animated.timing(slideAnimation, {
                        toValue: slideValue,
                        duration: animationSpeed / 2,
                        useNativeDriver: true,
                    }),
                    Animated.timing(slideAnimation, {
                        toValue: 0,
                        duration: animationSpeed / 2,
                        useNativeDriver: true,
                    }),
                ]).start();
                break;

            case 'flip':
                Animated.sequence([
                    Animated.timing(flipAnimation, {
                        toValue: 1,
                        duration: animationSpeed / 2,
                        useNativeDriver: true,
                    }),
                    Animated.timing(flipAnimation, {
                        toValue: 0,
                        duration: animationSpeed / 2,
                        useNativeDriver: true,
                    }),
                ]).start();
                break;

            case 'none':
            default:
                // No animation
                break;
        }
    }, [readingExperience?.pageTurnAnimation, fadeAnimation, slideAnimation, flipAnimation, windowHeight]);

    const getPageAnimationStyle = useCallback(() => {
        if (!readingExperience?.pageTurnAnimation.enabled) {
            return {};
        }

        const animationType = readingExperience.pageTurnAnimation.type;

        switch (animationType) {
            case 'fade':
                return {
                    opacity: fadeAnimation,
                };

            case 'slide':
                return {
                    transform: [{ translateY: slideAnimation }],
                };

            case 'flip':
                return {
                    transform: [{
                        rotateY: flipAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '180deg'],
                        }),
                    }],
                };

            case 'none':
            default:
                return {};
        }
    }, [readingExperience?.pageTurnAnimation, fadeAnimation, slideAnimation, flipAnimation]);

    // Auto-scroll functionality
    const startAutoScroll = useCallback(() => {
        if (!readingExperience?.autoScroll.enabled || !listRef.current) {
            return;
        }

        const speed = readingExperience.autoScroll.speed;
        const scrollInterval = 50; // Update every 50ms for smooth scrolling
        const scrollStep = (speed * scrollInterval) / 1000; // Calculate step size

        setIsAutoScrolling(true);
        setAutoScrollPaused(false);

        autoScrollTimerRef.current = setInterval(() => {
            listRef.current?.scrollToOffset({
                offset: Math.max(0, getCurrentScrollOffset() + scrollStep),
                animated: true
            });
        }, scrollInterval);
    }, [readingExperience?.autoScroll.enabled, readingExperience?.autoScroll.speed]);

    const stopAutoScroll = useCallback(() => {
        if (autoScrollTimerRef.current) {
            clearInterval(autoScrollTimerRef.current);
            autoScrollTimerRef.current = null;
        }
        setIsAutoScrolling(false);
        setAutoScrollPaused(false);
    }, []);

    const pauseAutoScroll = useCallback(() => {
        if (autoScrollTimerRef.current) {
            clearInterval(autoScrollTimerRef.current);
            autoScrollTimerRef.current = null;
        }
        setAutoScrollPaused(true);
    }, []);

    const resumeAutoScroll = useCallback(() => {
        if (autoScrollPaused && readingExperience?.autoScroll.enabled) {
            startAutoScroll();
        }
    }, [autoScrollPaused, readingExperience?.autoScroll.enabled, startAutoScroll]);

    const getCurrentScrollOffset = useCallback(() => {
        // This is a simplified way to get scroll offset
        // In a real implementation, you might need to track this more accurately
        return 0;
    }, []);

    // Handle TTS state changes for auto-scroll
    useEffect(() => {
        if (!readingExperience?.autoScroll.enabled) {
            return;
        }

        const isTTSActive = isSpeechOrPause(tts.state);
        
        if (isTTSActive && readingExperience.autoScroll.pauseOnTTS) {
            if (isAutoScrolling) {
                pauseAutoScroll();
            }
        } else if (!isTTSActive && readingExperience.autoScroll.resumeAfterTTS && autoScrollPaused) {
            resumeAutoScroll();
        }
    }, [tts.state, readingExperience?.autoScroll, isAutoScrolling, autoScrollPaused, pauseAutoScroll, resumeAutoScroll]);

    // Start auto-scroll when enabled
    useEffect(() => {
        if (readingExperience?.autoScroll.enabled && listLoaded && !isAutoScrolling && !isSpeechOrPause(tts.state)) {
            startAutoScroll();
        } else if (!readingExperience?.autoScroll.enabled && isAutoScrolling) {
            stopAutoScroll();
        }

        return () => {
            stopAutoScroll();
        };
    }, [readingExperience?.autoScroll.enabled, listLoaded, startAutoScroll, stopAutoScroll, isAutoScrolling, tts.state]);

    useEffect(() => {
        let data = props.data;
        if (editorPref?.hasChapterNumber) {
            data = `<p>Chapter — ${props.id}</p>${data}`;
        }
        const { html, sentences } = htmlToIdSentences(data);
        const pageContent = splitContentIntoPages(html);
        setPages(pageContent);
        let tts: TTS = {
            state: props.speachState, sentences, ttsQueue: toQueue(sentences),
            index: 0, ttsConfig: ttsConfig || { rate: 1, voice: 'system', pitch: 1, volume: 0.8 }
        };
        setTTStore(tts);
        if (tts.state === 'speak') {
            setTTS({ tts, setTTS: setTTStore });
        }
    }, [props.data, editorPref?.hasChapterNumber, ttsConfig]);

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
        <PagerView 
            style={{ flex: 1 }} 
            initialPage={0}
            // Enable overdrag for better gesture sensitivity
            overdrag={true}
            onPageSelected={(e) => {
                const newIndex = e.nativeEvent.position;
                if (newIndex !== currentPageIndex) {
                    const direction = newIndex > currentPageIndex ? 'next' : 'prev';
                    animatePageTurn(direction);
                    setCurrentPageIndex(newIndex);
                }
            }}
        >
            {pages.map((_, index) => {
                const animatedStyle = getPageAnimationStyle();
                return (
                    <Animated.View 
                        key={index} 
                        style={[
                            { flex: 1, marginHorizontal: 10 },
                            animatedStyle
                        ]}
                    >
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
                                <SentenceRenderer
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
                    </Animated.View>
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

// Default export to satisfy Expo Router
export default function ChapterContent() {
    return null;
}

