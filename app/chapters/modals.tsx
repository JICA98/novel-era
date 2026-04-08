import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Text, IconButton, useTheme, Button, Divider, SegmentedButtons } from 'react-native-paper';
import { UserPreferences, ThemeOptions, userPrefStore } from '../userpref';
import { RenderChapterProps, navigateToNextChapter } from './common';
import Slider from '@react-native-community/slider';
import TTSControls from './ttscontrols';

export const ReaderNavigationToc = ({
    visible,
    onDismiss,
    props
}: {
    visible: boolean;
    onDismiss: () => void;
    props: RenderChapterProps;
}) => {
    const theme = useTheme();
    const currentChapter = parseInt(props.id);
    const maxChapter = props.content.latestChapter || currentChapter;
    const [sliderValue, setSliderValue] = useState(currentChapter);

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onDismiss}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '70%', padding: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text variant="titleLarge">Chapters</Text>
                        <IconButton icon="close" onPress={onDismiss} />
                    </View>
                    <Divider style={{ marginVertical: 8 }} />
                    <View style={{ paddingVertical: 16 }}>
                        <Text>Quick Jump: Chapter {sliderValue} of {maxChapter}</Text>
                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={1}
                            maximumValue={maxChapter}
                            step={1}
                            value={sliderValue}
                            onValueChange={setSliderValue}
                            onSlidingComplete={(val) => {
                                onDismiss();
                                navigateToNextChapter(props, val - currentChapter);
                            }}
                            minimumTrackTintColor={theme.colors.primary}
                            maximumTrackTintColor={theme.colors.outline}
                            thumbTintColor={theme.colors.primary}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export const ReaderAppearanceSettings = ({
    visible,
    onDismiss,
}: {
    visible: boolean;
    onDismiss: () => void;
}) => {
    const theme = useTheme();
    const userPref = userPrefStore((state: any) => state.userPref) as UserPreferences;
    const setUserPref = userPrefStore((state: any) => state.setUserPref);

    const updateEditorPref = (key: keyof UserPreferences['editorPreferences'], value: any) => {
        setUserPref({
            ...userPref,
            editorPreferences: { ...userPref.editorPreferences, [key]: value }
        });
    };

    const updateTheme = (t: ThemeOptions) => {
        setUserPref({ ...userPref, theme: t });
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onDismiss}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text variant="titleLarge">Appearance</Text>
                        <IconButton icon="close" onPress={onDismiss} />
                    </View>
                    <Divider style={{ marginVertical: 8 }} />
                    
                    <Text variant="titleMedium" style={{ marginBottom: 8 }}>Typography</Text>
                    <SegmentedButtons
                        value={userPref.editorPreferences.fontFamily}
                        onValueChange={(val) => updateEditorPref('fontFamily', val)}
                        buttons={[
                            { value: 'serif', label: 'Serif' },
                            { value: 'sans-serif', label: 'Sans' },
                            { value: 'monospace', label: 'Mono' },
                        ]}
                        style={{ marginBottom: 16 }}
                    />

                    <Text variant="titleMedium" style={{ marginBottom: 8 }}>Font Size ({userPref.editorPreferences.fontSize})</Text>
                    <Slider
                        style={{ width: '100%', height: 40 }}
                        minimumValue={12}
                        maximumValue={32}
                        step={1}
                        value={userPref.editorPreferences.fontSize}
                        onValueChange={(val) => updateEditorPref('fontSize', val)}
                        minimumTrackTintColor={theme.colors.primary}
                        maximumTrackTintColor={theme.colors.outline}
                        thumbTintColor={theme.colors.primary}
                    />

                    <Text variant="titleMedium" style={{ marginTop: 8, marginBottom: 8 }}>Themes</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
                        <Button mode={userPref.theme === ThemeOptions.Light ? 'contained' : 'outlined'} onPress={() => updateTheme(ThemeOptions.Light)}>Light</Button>
                        <Button mode={userPref.theme === ThemeOptions.Dark ? 'contained' : 'outlined'} onPress={() => updateTheme(ThemeOptions.Dark)}>Dark</Button>
                        <Button mode={userPref.theme === ThemeOptions.System ? 'contained' : 'outlined'} onPress={() => updateTheme(ThemeOptions.System)}>System</Button>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export const ReaderTTSControlsSettings = ({
    visible,
    onDismiss,
}: {
    visible: boolean;
    onDismiss: () => void;
}) => {
    const theme = useTheme();
    if (!visible) return null;
    return (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, elevation: 10, zIndex: 10 }} pointerEvents="box-none">
            <View style={{ backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.25, shadowRadius: 3.84 }} pointerEvents="auto">
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="titleLarge">TTS Controls</Text>
                    <IconButton icon="close" onPress={onDismiss} />
                </View>
                <Divider style={{ marginVertical: 8 }} />
                <View style={{ paddingBottom: 16 }}>
                    <TTSControls />
                </View>
            </View>
        </View>
    );
};
