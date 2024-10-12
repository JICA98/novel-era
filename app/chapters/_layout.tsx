import { FetchData } from "@/types";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, View, SafeAreaView, TouchableOpacity, StatusBar, Animated } from "react-native";
import { ActivityIndicator, Button, IconButton, Title, useTheme } from "react-native-paper";
import { allDownloadsStore, useDownloadStore } from "../downloads/utils";
import { AppBar } from "../components/appbar";
import { RenderPagedContent } from "./content";
import { RenderChapterProps, chapterKey, ChapterData, fetchChapter, navigateToNextChapter } from "./common";
import { errorPlaceholder } from "../placeholders";
import { userPrefStore } from "../storage";
import { UserPreferences } from "../settings/types";
import { setTTS, SpeechAction, TTS, ttsStore } from "./tts";

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
    const [focusedMode, setFocusedMode] = useState(props.focusedMode);
    const colors = useTheme().colors;

    useEffect(() => {
        fetchChapterData();
    }, []);

    function fetchChapterData(cached = true) {
        if (cached && contentData.data) { return; }
        setLoading();
        fetchChapter(props.repo, props.content, props.id)
            .then(data => setContent({ data }))
            .catch(error => setContent({ error }));
    }

    let child;
    const hasDataLoaded = contentData.data && !contentData.isLoading;
    if (contentData.isLoading) {
        child = (
            <View style={styles.listPadding}>
                <ActivityIndicator animating={true} size="large" />
            </View>
        );
    } else if (contentData.error || contentData.data === undefined) {
        child = errorPlaceholder({ onRetry: () => fetchChapterData(false) });
    } else {
        child = <RenderPagedContent
            fromPrevious={props.fromPrevious}
            data={contentData.data.chapterContent}
            focusedMode={focusedMode}
            continueReading={props.continueReading}
            enableNextPrev={props.enableNextPrev}
            id={props.id} content={props.content} repo={props.repo}
        />;
    }
    const chapterActions = [
        {
            leadingIcon: 'crop-free', title: 'Focus Mode', onPress: () => setFocusedMode(true)
        },
    ];
    if (props.enableNextPrev) {
        chapterActions.push({
            leadingIcon: 'arrow-right', title: 'Next Chapter', onPress: () => navigateToNextChapter(props)
        },);
    }
    function updateFontSize(add: number) {
        const editorPref = userPref.editorPreferences;
        const newFontSize = editorPref.fontSize + add;
        setUserPref({ ...userPref, editorPreferences: { ...editorPref, fontSize: newFontSize } });
    }
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {!focusedMode && (
                <AppBar title={`Chapter ${props.id}`} actions={hasDataLoaded ? chapterActions : []}></AppBar>
            )}
            {focusedMode && (<StatusBar hidden />)}
            {child}
            {hasDataLoaded && (<TouchableOpacity
                style={styles.invisibleButton}
                onPress={() => setFocusedMode(!focusedMode)}
            />)}
            {!focusedMode && (renderBottomBar())}
        </SafeAreaView >
    );

    function renderBottomBar(): React.ReactNode {

        function updateTTS(state: SpeechAction) {
            let t: TTS = { ...tts, state: state }
            setTTS({ tts: t, setTTS: setTTStore });
        }

        const bottomBar = <Animated.View style={{
            padding: 16, flexDirection: 'row', justifyContent: 'center', backgroundColor: colors.backdrop
        }}>
            <IconButton icon="crop-free" onPress={() => setFocusedMode(!focusedMode)} />
            <View style={{ width: 16 }} />
            <IconButton icon="minus" onPress={() => updateFontSize(-1)} />
            <View style={{ width: 16 }} />
            <IconButton icon="plus" onPress={() => updateFontSize(1)} />
            <View style={{ width: 16 }} />
            <IconButton icon="volume-high" onPress={() => updateTTS(tts.state === 'speak' ? 'stop' : 'speak')} />
        </Animated.View>;

        return (
            <>
                {(tts.state === 'speak' || tts.state === 'pause' || tts.state === 'resume') && (
                    <View style={{
                        justifyContent: 'center',
                        backgroundColor: colors.backdrop
                    }}>
                        <Button icon={tts.state === 'pause' ? 'play' : 'pause'}
                            onPress={() => updateTTS(tts.state === 'pause' ? 'resume' : 'pause')}>
                            {tts.state === 'pause' ? 'Resume' : 'Pause'}
                        </Button>
                        <Button icon="stop" onPress={() => updateTTS('stop')}>Stop</Button>
                    </View>
                )}
                {bottomBar}
            </>
        );
    }
}


const styles = {
    container: {
        flex: 1,
    },
    bottomBarButtons: {
        // flexDirection: 'row',
        // alignItems: 'center',
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
        position: 'absolute',
        top: '50%',
        left: '50%',
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
        backgroundColor: 'rgba(0,0,0,0.3)',
    }
};

export default ChapterLayout;