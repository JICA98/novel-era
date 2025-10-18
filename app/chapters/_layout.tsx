import { FetchData } from "@/types";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import { Dimensions, View, SafeAreaView, TouchableOpacity, StatusBar, Animated, BackHandler } from "react-native";
import { ActivityIndicator, Button, IconButton, Title, useTheme } from "react-native-paper";
import { allDownloadsStore, useDownloadStore } from "../../lib/downloads/utils";
import { AppBar } from "../components/appbar";
import { RenderPagedContent } from "./content";
import { RenderChapterProps, chapterKey, ChapterData, fetchChapter, navigateToNextChapter } from "./common";
import { errorPlaceholder } from "../placeholders";
import { isSpeechOrPause, setTTS, SpeechAction, TTS, ttsStore } from "./tts";
import TTSControls from "./ttscontrols";
import { UserPreferences, userPrefStore } from "../userpref";
import { FAB } from 'react-native-paper';
import { MenuItem } from "../components/menu";

const ChapterLayout: React.FC = () => {
    const _props: RenderChapterProps = JSON.parse(useLocalSearchParams().props as string) as RenderChapterProps;
    const downloads = allDownloadsStore((state: any) => state.downloads);
    const props: RenderChapterProps = { ..._props };
    const key = chapterKey(props.repo, props.content, props.id);
    const useChapterData = useDownloadStore({
        key,
        downloads,
        setDownloads: allDownloadsStore((state: any) => state.setDownloads),
    });
    const contentData: FetchData<ChapterData> = useChapterData((state: any) => state.content);
    const setContent = useChapterData((state: any) => state.setContent);
    const setLoading = useChapterData((state: any) => state.setLoading);
    const setUserPref = userPrefStore((state: any) => state.setUserPref);
    const tts: TTS = ttsStore((state: any) => state.tts);
    const setTTStore: (tts: TTS) => void = ttsStore((state: any) => state.setTTS);
    const userPref = userPrefStore((state: any) => state.userPref) as UserPreferences;
    const [focusedMode, setFocusedMode] = useState(
        props.focusedMode || userPref?.readingExperience?.readingMode?.immersiveByDefault || false
    );
    const colors = useTheme().colors;
    const controlsOpacity = useRef(new Animated.Value(1)).current;
    const [controlsVisible, setControlsVisible] = useState(true);
    const hideControlsTimer = useRef<number | null>(null);

    useEffect(() => {
        fetchChapterData();
        
        // Set initial immersive mode based on preferences
        if (userPref?.readingExperience?.readingMode?.immersiveByDefault && !props.focusedMode) {
            setFocusedMode(true);
        }
    }, [userPref?.readingExperience?.readingMode?.immersiveByDefault]);

    // Auto-hide controls functionality
    const startHideControlsTimer = () => {
        if (!userPref?.readingExperience?.readingMode?.autoHideControls || !focusedMode) {
            return;
        }

        const delay = (userPref.readingExperience.readingMode.autoHideDelay || 3) * 1000;
        
        if (hideControlsTimer.current) {
            clearTimeout(hideControlsTimer.current);
        }

        hideControlsTimer.current = setTimeout(() => {
            hideControls();
        }, delay);
    };

    const hideControls = () => {
        Animated.timing(controlsOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setControlsVisible(false);
        });
    };

    const showControls = () => {
        setControlsVisible(true);
        Animated.timing(controlsOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
        startHideControlsTimer();
    };

    const resetControlsTimer = () => {
        if (controlsVisible) {
            startHideControlsTimer();
        }
    };

    // Start auto-hide timer when entering focused mode
    useEffect(() => {
        if (focusedMode && userPref?.readingExperience?.readingMode?.autoHideControls) {
            startHideControlsTimer();
        } else {
            if (hideControlsTimer.current) {
                clearTimeout(hideControlsTimer.current);
            }
            showControls();
        }

        return () => {
            if (hideControlsTimer.current) {
                clearTimeout(hideControlsTimer.current);
            }
        };
    }, [focusedMode, userPref?.readingExperience?.readingMode?.autoHideControls]);

    function fetchChapterData(cached = true) {
        if (cached && contentData.data) { return; }
        setLoading();
        fetchChapter(props.repo, props.content, props.id)
            .then(data => setContent({ data }))
            .catch(error => setContent({ error }));
    }

    let child;
    const hasDataLoaded = contentData.data && !contentData.isLoading;
    if (contentData.isLoading || contentData.data === undefined) {
        child = (
            <View style={styles.listPadding}>
                <ActivityIndicator animating={true} size="large" />
            </View>
        );
    } else if (contentData.error) {
        child = errorPlaceholder({ onRetry: () => fetchChapterData(false) });
    } else {
        child = <RenderPagedContent
            fromPrevious={props.fromPrevious}
            data={contentData.data.chapterContent}
            focusedMode={focusedMode}
            continueReading={props.continueReading}
            enableNextPrev={props.enableNextPrev}
            id={props.id} content={props.content} repo={props.repo}
            speachState={props.speachState}
        />;
    }
    const chapterActions: MenuItem[] = buildChapterActionMenu(setFocusedMode, userPref, props, setUserPref);
    function updateFontSize(add: number) {
        const editorPref = userPref.editorPreferences;
        const newFontSize = editorPref.fontSize + add;
        setUserPref({ ...userPref, editorPreferences: { ...editorPref, fontSize: newFontSize } });
    }

    useEffect(() => {
        const backAction = () => {
            if (focusedMode) {
                setFocusedMode(false);
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction,
        );

        return () => backHandler.remove();
    }, [focusedMode]);

    function updateTTS(state: SpeechAction) {
        let t: TTS = { ...tts, state: state }
        setTTS({ tts: t, setTTS: setTTStore });
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Status bar handling based on reading preferences */}
            {focusedMode && userPref?.readingExperience?.readingMode?.hideStatusBar ? (
                <StatusBar hidden />
            ) : (
                <StatusBar barStyle="default" />
            )}
            
            {/* App bar - hidden in focused mode or when controls are auto-hidden */}
            {!focusedMode && (
                <AppBar title={`Chapter ${props.id}`} actions={hasDataLoaded ? chapterActions : []}></AppBar>
            )}
            
            {/* Main content with gesture handling for enhanced sensitivity */}
            <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={() => {
                    if (focusedMode) {
                        if (!controlsVisible) {
                            showControls();
                        } else {
                            resetControlsTimer();
                        }
                    }
                }}
            >
                {child}
            </TouchableOpacity>
            
            {/* Invisible button for focus mode toggle */}
            {hasDataLoaded && (
                <TouchableOpacity
                    style={styles.invisibleButton}
                    onPress={() => {
                        setFocusedMode(!focusedMode);
                        if (!focusedMode) {
                            showControls();
                        }
                    }}
                />
            )}
            
            {/* Bottom bar with controls - hidden in focused mode or when auto-hidden */}
            {!focusedMode && renderBottomBar()}
            
            {/* Floating TTS controls in focused mode */}
            {focusedMode && isSpeechOrPause(tts.state) && controlsVisible && (
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            margin: 16,
                            right: 0,
                            bottom: 0,
                        },
                        { opacity: controlsOpacity }
                    ]}
                >
                    <FAB
                        size="small"
                        icon={tts.state === 'pause' ? 'play' : 'pause'}
                        onPress={() => {
                            updateTTS(tts.state === 'speak' ? 'pause' : 'speak');
                            resetControlsTimer();
                        }}
                    />
                </Animated.View>
            )}
        </SafeAreaView>
    );

    function renderBottomBar(): React.ReactNode {

        const renderButtonGroup = <>
            <View style={styles.bottomBarStyle}>
                <IconButton icon="crop-free" onPress={() => setFocusedMode(!focusedMode)} />
                <View style={{ width: 16 }} />
                <IconButton icon="minus" onPress={() => updateFontSize(-1)} />
                <View style={{ width: 16 }} />
                <IconButton icon="plus" onPress={() => updateFontSize(1)} />
                <View style={{ width: 16 }} />
                <IconButton icon="volume-high" onPress={() => updateTTS(tts.state === 'speak' ? 'stop' : 'speak')} />
            </View>
        </>;
        return (
            <View style={{
                backgroundColor: colors.surfaceVariant,
                position: 'absolute' as 'absolute', bottom: 0, left: 0, right: 0,
            }}>
                {<TTSControls />}
                {renderButtonGroup}
            </View>
        );
    }
}


const styles = {
    container: {
        flex: 1,
    },
    bottomBarStyle: {
        paddingBottom: 2, flexDirection: 'row' as 'row', justifyContent: 'center' as 'center',
    },
    listPadding: {
        marginTop: 80,
        padding: 16,
    },
    errorText: {
        textAlign: 'center',
        margin: 16,
    },
    page: {
        justifyContent: 'center',
        alignItems: 'center',
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    text: {
        fontSize: 18,
        textAlign: 'center',
        margin: 16,
    },
    title: {
        fontSize: 24,
        marginBottom: 16,
    },
    pagerView: {
        flex: 1,
    },
    content: {
        fontSize: 16,
    },
    invisibleButton: {
        position: 'absolute' as 'absolute',
        top: '50%' as any,
        left: '50%' as any,
        width: 110,
        height: 110,
        borderRadius: 25,
        transform: [{ translateX: -50 }, { translateY: -50 }],
        backgroundColor: 'transparent',
    },
    sliderContainer: {
        flex: 1,
        padding: 16,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    }
};

export default ChapterLayout;

function buildChapterActionMenu(
    setFocusedMode: React.Dispatch<React.SetStateAction<boolean>>,
    userPref: UserPreferences, props: RenderChapterProps, setUserPref: any
) {
    const chapterActions: MenuItem[] = [
        {
            leadingIcon: 'crop-free', title: 'Focus Mode', onPress: () => setFocusedMode(true)
        }
    ];
    if (userPref.editorPreferences.hasChapterNumber) {
        chapterActions.push({
            leadingIcon: 'cancel', title: 'Disable Title', onPress: () => {
                userPref.editorPreferences.hasChapterNumber = false;
                setUserPref({ ...userPref });
            }
        });
    }
    if (!userPref.editorPreferences.hasChapterNumber) {
        chapterActions.push({
            leadingIcon: 'format-title', title: 'Enable Title', onPress: () => {
                userPref.editorPreferences.hasChapterNumber = true;
                setUserPref({ ...userPref });
            }
        });
    }
    if (props.enableNextPrev) {
        if (parseInt(props.id) > 1) {
            chapterActions.push({
                leadingIcon: 'arrow-left', title: 'Previous Chapter', onPress: () => navigateToNextChapter(props, -1)
            });
        }
        if (parseInt(props.id) < (props.content.latestChapter ?? 0)) {
            chapterActions.push({
                leadingIcon: 'arrow-right', title: 'Next Chapter', onPress: () => navigateToNextChapter(props)
            });
        }
    }
    return chapterActions;
}
