import { FetchData } from "@/types";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, View, SafeAreaView, TouchableOpacity, StatusBar, Animated, BackHandler } from "react-native";
import { ActivityIndicator, Button, IconButton, Title, useTheme } from "react-native-paper";
import { allDownloadsStore, useDownloadStore } from "../downloads/utils";
import { RenderPagedContent } from "./content";
import { RenderChapterProps, chapterKey, ChapterData, fetchChapter, navigateToNextChapter } from "./common";
import { errorPlaceholder } from "../placeholders";
import { isSpeechOrPause, setTTS, SpeechAction, TTS, ttsStore } from "./tts";
import TTSControls from "./ttscontrols";
import { UserPreferences, userPrefStore, ReaderThemes } from "../userpref";
import { FAB } from 'react-native-paper';
import { MenuItem } from "../components/menu";
import { router } from "expo-router";
import { ReaderNavigationToc, ReaderAppearanceSettings, ReaderTTSControlsSettings } from "./modals";

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
    const editorPref = userPref.editorPreferences;
    const readerThemeKey = editorPref.theme && ReaderThemes[editorPref.theme as keyof typeof ReaderThemes] ? editorPref.theme : 'light';
    const readerBgColor = ReaderThemes[readerThemeKey as keyof typeof ReaderThemes].background;
    const readerTextColor = ReaderThemes[readerThemeKey as keyof typeof ReaderThemes].text;
    const [focusedMode, setFocusedMode] = useState(props.focusedMode);
    const colors = useTheme().colors;
    const [tocVisible, setTocVisible] = useState(false);
    const [appearanceVisible, setAppearanceVisible] = useState(false);
    const [ttsVisible, setTtsVisible] = useState(false);

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
        <SafeAreaView style={[styles.container, { backgroundColor: readerBgColor }]}>
            {!focusedMode && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16 }}>
                    <IconButton icon="arrow-left" iconColor={readerTextColor} onPress={() => router.back()} />
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <IconButton icon="palette" iconColor={readerTextColor} onPress={() => setAppearanceVisible(true)} />
                        <IconButton icon="volume-high" iconColor={readerTextColor} onPress={() => {
                            if (!isSpeechOrPause(tts.state)) {
                                updateTTS('speak');
                            }
                            setTtsVisible(true);
                        }} />
                        <Button 
                            mode="contained-tonal" 
                            onPress={() => setTocVisible(true)}>
                            Ch. {props.id}
                        </Button>
                    </View>
                </View>
            )}
            {focusedMode && (<StatusBar hidden />)}
            {child}
            {hasDataLoaded && (<TouchableOpacity
                style={styles.invisibleButton}
                onPress={() => setFocusedMode(!focusedMode)}
            />)}
            {
                focusedMode && (isSpeechOrPause(tts.state)) &&
                <>
                    <FAB
                        style={{
                            position: 'absolute',
                            margin: 16,
                            right: 0,
                            bottom: 0,
                        }}
                        size="small"
                        icon={tts.state === 'pause' ? 'play' : 'pause'}
                        onPress={() => updateTTS(tts.state === 'speak' ? 'pause' : 'speak')} />
                </>
            }
            <ReaderNavigationToc visible={tocVisible} onDismiss={() => setTocVisible(false)} props={props} />
            <ReaderAppearanceSettings visible={appearanceVisible} onDismiss={() => setAppearanceVisible(false)} />
            <ReaderTTSControlsSettings visible={ttsVisible} onDismiss={() => setTtsVisible(false)} />
        </SafeAreaView >
    );

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
