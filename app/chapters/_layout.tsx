import { FetchData } from "@/types";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, View, TouchableOpacity, StatusBar, Animated, BackHandler } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, IconButton } from "react-native-paper";
import { allDownloadsStore, useDownloadStore } from "../downloads/utils";
import { RenderPagedContent } from "./content";
import { RenderChapterProps, chapterKey, ChapterData, fetchChapter, navigateToNextChapter } from "./common";
import { errorPlaceholder } from "../placeholders";
import { isSpeechOrPause, setTTS, SpeechAction, TTS, ttsStore } from "./tts";
import { UserPreferences, userPrefStore, getReaderTheme } from "../userpref";
import { FAB } from 'react-native-paper';
import { MenuItem } from "../components/menu";
import { router } from "expo-router";
import { ReaderNavigationToc, ReaderAppearanceSettings, ReaderTTSControlsSettings } from "./modals";
import { useAppTheme } from "@/hooks/useAppTheme";

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
    const [focusedMode, setFocusedMode] = useState(props.focusedMode);
    const paperTheme = useAppTheme();
    const colors = paperTheme.colors;
    const readerTheme = getReaderTheme(editorPref.theme, paperTheme.dark);
    const readerBgColor = readerTheme.background;
    const readerTextColor = readerTheme.text;
    const [tocVisible, setTocVisible] = useState(false);
    const [appearanceVisible, setAppearanceVisible] = useState(false);
    const [ttsVisible, setTtsVisible] = useState(false);

    const speakerScale = React.useRef(new Animated.Value(1)).current;
    const speakerAnim = React.useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        if (tts.state === 'speak') {
            speakerAnim.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(speakerScale, {
                        toValue: 1.25,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(speakerScale, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    })
                ])
            );
            speakerAnim.current.start();
        } else {
            if (speakerAnim.current) {
                speakerAnim.current.stop();
            }
            speakerScale.setValue(1);
        }
    }, [tts.state]);

    function navigateBackToContent() {
        if (props.returnToContent) {
            if (props.returnToContentBehavior === 'back') {
                router.back();
                return true;
            }
            router.replace({
                pathname: '/contents' as any,
                params: {
                    content: JSON.stringify(props.content),
                    repo: JSON.stringify(props.repo),
                }
            });
            return true;
        }
        return false;
    }

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
            <ChapterReaderSkeleton
                focusedMode={focusedMode}
                readerBgColor={readerBgColor}
                readerTextColor={readerTextColor}
                mutedColor={colors.outlineVariant}
                surfaceColor={colors.surfaceContainerHighest}
            />
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

    useEffect(() => {
        const backAction = () => {
            if (focusedMode) {
                setFocusedMode(false);
                return true;
            }
            return navigateBackToContent();
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
        <View style={{ flex: 1, backgroundColor: readerBgColor }}>
            <SafeAreaView 
                style={[styles.container, { backgroundColor: 'transparent' }]} 
                edges={['bottom', 'left', 'right', 'top']}
            >
                {!focusedMode && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, zIndex: 100 }}>
                        <IconButton
                            icon="arrow-left"
                            iconColor={readerTextColor}
                            onPress={() => {
                                if (!navigateBackToContent()) {
                                    router.back();
                                }
                            }}
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <IconButton icon="palette" iconColor={readerTextColor} onPress={() => setAppearanceVisible(true)} />
                            <Animated.View style={{ transform: [{ scale: speakerScale }] }}>
                                <IconButton icon="volume-high" iconColor={readerTextColor} onPress={() => {
                                    setTtsVisible(true);
                                    if (!isSpeechOrPause(tts.state)) {
                                        updateTTS('speak');
                                    }
                                }} />
                            </Animated.View>
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
            </SafeAreaView>
            <ReaderTTSControlsSettings visible={ttsVisible} onDismiss={() => setTtsVisible(false)} />
        </View>
    );

}

function ChapterReaderSkeleton({
    focusedMode,
    readerBgColor,
    readerTextColor,
    mutedColor,
    surfaceColor,
}: {
    focusedMode: boolean;
    readerBgColor: string;
    readerTextColor: string;
    mutedColor: string;
    surfaceColor: string;
}) {
    const lineColor = `${readerTextColor}22`;
    const titleColor = `${readerTextColor}18`;
    const chipColor = `${surfaceColor}cc`;
    const paragraphWidths = ['92%', '100%', '96%', '88%', '94%', '98%', '83%', '91%'];

    return (
        <View style={[styles.readerSkeletonContainer, { backgroundColor: readerBgColor }]}>
            {!focusedMode && (
                <View style={styles.readerSkeletonHeader}>
                    <View style={[styles.readerSkeletonIcon, { backgroundColor: chipColor }]} />
                    <View style={styles.readerSkeletonHeaderActions}>
                        <View style={[styles.readerSkeletonIcon, { backgroundColor: chipColor }]} />
                        <View style={[styles.readerSkeletonIcon, { backgroundColor: chipColor }]} />
                        <View
                            style={[
                                styles.readerSkeletonChip,
                                { backgroundColor: chipColor, borderColor: `${mutedColor}33` },
                            ]}
                        />
                    </View>
                </View>
            )}

            <View style={styles.readerSkeletonBody}>
                <View style={[styles.readerSkeletonMeta, { backgroundColor: lineColor }]} />
                <View style={[styles.readerSkeletonTitle, { backgroundColor: titleColor }]} />
                {paragraphWidths.map((width, index) => (
                    <View
                        key={index}
                        style={[
                            styles.readerSkeletonLine,
                            {
                                width: width as any,
                                backgroundColor: lineColor,
                                marginTop: index === 0 ? 0 : 14,
                            },
                        ]}
                    />
                ))}
            </View>
        </View>
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
    readerSkeletonContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    readerSkeletonHeader: {
        flexDirection: 'row' as 'row',
        justifyContent: 'space-between' as 'space-between',
        alignItems: 'center' as 'center',
        marginBottom: 24,
    },
    readerSkeletonHeaderActions: {
        flexDirection: 'row' as 'row',
        alignItems: 'center' as 'center',
        gap: 12,
    },
    readerSkeletonIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    readerSkeletonChip: {
        width: 82,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
    },
    readerSkeletonBody: {
        paddingHorizontal: 4,
        paddingTop: 12,
    },
    readerSkeletonMeta: {
        width: 104,
        height: 12,
        borderRadius: 999,
        marginBottom: 18,
    },
    readerSkeletonTitle: {
        height: 28,
        width: '58%' as any,
        borderRadius: 12,
        marginBottom: 30,
    },
    readerSkeletonLine: {
        height: 14,
        borderRadius: 999,
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
