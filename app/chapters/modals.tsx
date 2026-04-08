import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Text, IconButton, useTheme, Button, Divider, SegmentedButtons } from 'react-native-paper';
import { UserPreferences, ThemeOptions, userPrefStore, ReaderThemes } from '../userpref';
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
    const userPref = userPrefStore((state: any) => state.userPref) as UserPreferences;
    const editorPref = userPref.editorPreferences;
    const readerThemeKey = editorPref.theme && ReaderThemes[editorPref.theme as keyof typeof ReaderThemes] ? editorPref.theme : 'light';
    const readerBgColor = ReaderThemes[readerThemeKey as keyof typeof ReaderThemes].background;
    const readerTextColor = ReaderThemes[readerThemeKey as keyof typeof ReaderThemes].text;
    const currentChapter = parseInt(props.id);
    const maxChapter = props.content.latestChapter || currentChapter;
    const [sliderValue, setSliderValue] = useState(currentChapter);

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onDismiss}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: readerBgColor, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '70%', padding: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text variant="titleLarge" style={{ color: readerTextColor }}>Chapters</Text>
                        <IconButton icon="close" iconColor={readerTextColor} onPress={onDismiss} />
                    </View>
                    <Divider style={{ marginVertical: 8, backgroundColor: theme.colors.outlineVariant }} />
                    <View style={{ paddingVertical: 16 }}>
                        <Text style={{ color: readerTextColor }}>Quick Jump: Chapter {sliderValue} of {maxChapter}</Text>
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
                            maximumTrackTintColor={theme.colors.outlineVariant}
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

    const resetToDefault = () => {
        setUserPref({
            ...userPref,
            editorPreferences: {
                ...userPref.editorPreferences,
                fontFamily: 'serif',
                fontSize: 18,
                lineHeight: 1.5,
                padding: 16,
                theme: 'light'
            }
        });
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onDismiss}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 32 }}>
                    <View style={{ width: 48, height: 6, backgroundColor: theme.colors.outlineVariant, alignSelf: 'center', borderRadius: 3, marginBottom: 24 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Typography</Text>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, letterSpacing: 1 }}>FONT FAMILY</Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 32 }}>
                        {['serif', 'sans-serif', 'monospace'].map((font) => (
                            <TouchableOpacity
                                key={font}
                                onPress={() => updateEditorPref('fontFamily', font)}
                                style={{
                                    flex: 1,
                                    marginHorizontal: 6,
                                    paddingVertical: 16,
                                    borderRadius: 12,
                                    backgroundColor: userPref.editorPreferences.fontFamily === font ? theme.colors.primary : theme.colors.surfaceVariant,
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{ fontFamily: font, fontSize: 24, color: userPref.editorPreferences.fontFamily === font ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}>Aa</Text>
                                <Text style={{ fontSize: 12, marginTop: 8, color: userPref.editorPreferences.fontFamily === font ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}>
                                    {font === 'serif' ? 'Serif' : font === 'sans-serif' ? 'Sans' : 'Mono'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <IconButton icon="format-size" size={16} iconColor={theme.colors.onSurfaceVariant} style={{ margin: 0 }} />
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Font Size</Text>
                        <IconButton icon="format-size" size={24} iconColor={theme.colors.onSurfaceVariant} style={{ margin: 0 }} />
                    </View>
                    <Slider
                        style={{ width: '100%', height: 40, marginBottom: 24 }}
                        minimumValue={12}
                        maximumValue={32}
                        step={1}
                        value={userPref.editorPreferences.fontSize}
                        onValueChange={(val) => updateEditorPref('fontSize', val)}
                        minimumTrackTintColor={theme.colors.primary}
                        maximumTrackTintColor={theme.colors.outlineVariant}
                        thumbTintColor={theme.colors.primary}
                    />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <IconButton icon="format-line-spacing" size={24} iconColor={theme.colors.onSurfaceVariant} style={{ margin: 0 }} />
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Line Height</Text>
                        <IconButton icon="unfold-more-horizontal" size={24} iconColor={theme.colors.onSurfaceVariant} style={{ margin: 0 }} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 }}>
                        {[ { label: 'Tight', val: 1.2 }, { label: 'Default', val: 1.5 }, { label: 'Loose', val: 1.8 } ].map((lh) => (
                            <TouchableOpacity
                                key={lh.label}
                                onPress={() => updateEditorPref('lineHeight', lh.val)}
                                style={{
                                    flex: 1,
                                    marginHorizontal: 4,
                                    paddingVertical: 12,
                                    borderRadius: 8,
                                    backgroundColor: userPref.editorPreferences.lineHeight === lh.val ? theme.colors.primary : theme.colors.surfaceVariant,
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: userPref.editorPreferences.lineHeight === lh.val ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}>{lh.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 }}>
                        <View style={{ flex: 1, marginRight: 16 }}>
                            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12, letterSpacing: 1 }}>PAGE MARGINS</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => updateEditorPref('padding', 12)} style={{ padding: 8, borderRadius: 24, backgroundColor: userPref.editorPreferences.padding === 12 ? theme.colors.primary : theme.colors.surfaceVariant }}>
                                    <IconButton icon="format-align-right" size={24} style={{ margin: 0 }} iconColor={userPref.editorPreferences.padding === 12 ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
                                </TouchableOpacity>
                                <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.outlineVariant }} />
                                <TouchableOpacity onPress={() => updateEditorPref('padding', 24)} style={{ padding: 8, borderRadius: 24, backgroundColor: userPref.editorPreferences.padding === 24 ? theme.colors.primary : theme.colors.surfaceVariant }}>
                                    <IconButton icon="format-align-center" size={24} style={{ margin: 0 }} iconColor={userPref.editorPreferences.padding === 24 ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
                                </TouchableOpacity>
                                <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.outlineVariant }} />
                                <TouchableOpacity onPress={() => updateEditorPref('padding', 36)} style={{ padding: 8, borderRadius: 24, backgroundColor: userPref.editorPreferences.padding === 36 ? theme.colors.primary : theme.colors.surfaceVariant }}>
                                    <IconButton icon="format-align-left" size={24} style={{ margin: 0 }} iconColor={userPref.editorPreferences.padding === 36 ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12, letterSpacing: 1 }}>THEMES</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                {[ 
                                    { key: 'light', color: '#fcf8fb', border: theme.colors.outline }, 
                                    { key: 'sepia', color: '#F4ECD8', border: 'transparent' }, 
                                    { key: 'dark', color: '#171c3c', border: 'transparent' }, 
                                    { key: 'oled', color: '#000000', border: 'transparent' } 
                                ].map((t) => (
                                    <TouchableOpacity
                                        key={t.key}
                                        onPress={() => updateEditorPref('theme', t.key)}
                                        style={{
                                            width: 40, height: 40, borderRadius: 20,
                                            backgroundColor: t.color,
                                            borderWidth: t.border !== 'transparent' || userPref.editorPreferences.theme === t.key ? 2 : 0,
                                            borderColor: userPref.editorPreferences.theme === t.key ? theme.colors.primary : t.border,
                                            shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2
                                        }}
                                    />
                                ))}
                            </View>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
                        <Button mode="contained-tonal" onPress={resetToDefault} style={{ flex: 1 }} contentStyle={{ paddingVertical: 8 }}>Reset to Default</Button>
                        <Button mode="contained" onPress={onDismiss} style={{ flex: 1 }} contentStyle={{ paddingVertical: 8 }}>Save Changes</Button>
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
    const userPref = userPrefStore((state: any) => state.userPref) as UserPreferences;
    const editorPref = userPref.editorPreferences;
    const readerThemeKey = editorPref.theme && ReaderThemes[editorPref.theme as keyof typeof ReaderThemes] ? editorPref.theme : 'light';
    const readerBgColor = ReaderThemes[readerThemeKey as keyof typeof ReaderThemes].background;
    const readerTextColor = ReaderThemes[readerThemeKey as keyof typeof ReaderThemes].text;
    
    if (!visible) return null;
    return (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, elevation: 10, zIndex: 10 }} pointerEvents="box-none">
            <View style={{ backgroundColor: readerBgColor, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.25, shadowRadius: 3.84 }} pointerEvents="auto">
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="titleLarge" style={{ color: readerTextColor }}>TTS Controls</Text>
                    <IconButton icon="close" iconColor={readerTextColor} onPress={onDismiss} />
                </View>
                <Divider style={{ marginVertical: 8, backgroundColor: theme.colors.outlineVariant }} />
                <View style={{ paddingBottom: 16 }}>
                    <TTSControls />
                </View>
            </View>
        </View>
    );
};
