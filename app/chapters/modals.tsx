import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Text, IconButton, useTheme, Button, Divider, SegmentedButtons, Portal, Modal } from 'react-native-paper';
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
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ flex: 1, backgroundColor: 'transparent' }} style={{ margin: 0, justifyContent: 'flex-start' }}>
                <View style={{ flex: 1, flexDirection: 'row' }}>
                    <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' }}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={onDismiss} activeOpacity={1} />
                    </View>
                    <View style={{ width: '85%', maxWidth: 350, height: '100%', backgroundColor: readerBgColor, flexDirection: 'column', elevation: 16, shadowColor: '#000', shadowOffset: { width: 5, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10 }}>
                    {/* Drawer Header */}
                    <View style={{ padding: 24, paddingBottom: 16, backgroundColor: readerBgColor, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: readerTextColor, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 2 }}>{props.content.author || 'Volume'}</Text>
                            <IconButton icon="close" iconColor={readerTextColor} size={20} style={{ margin: 0 }} onPress={onDismiss} />
                        </View>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: readerTextColor, marginBottom: 8 }} numberOfLines={2}>{props.content.title}</Text>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: readerTextColor, opacity: 0.7 }}>Chapters 1 — {maxChapter}</Text>
                    </View>

                    {/* Chapters List */}
                    <ScrollView style={{ flex: 1, padding: 24 }} showsVerticalScrollIndicator={false}>
                        {/* Previous Chapter */}
                        {currentChapter > 1 && (
                            <TouchableOpacity onPress={() => {
                                onDismiss();
                                navigateToNextChapter(props, -1);
                            }} style={{ padding: 16, borderRadius: 12, marginBottom: 4 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: readerTextColor, opacity: 0.7 }}>Chapter {currentChapter - 1}</Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {/* Current Chapter (Active) */}
                        <View style={{ backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, elevation: 2, marginBottom: 8 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.colors.onPrimary, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>Currently Reading</Text>
                                <IconButton icon="bookmark" iconColor={theme.colors.onPrimary} size={14} style={{ margin: 0, padding: 0, width: 14, height: 14 }} />
                            </View>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.onPrimary }}>Chapter {currentChapter}</Text>
                        </View>

                        {/* Next Chapters */}
                        {Array.from({ length: Math.min(10, maxChapter - currentChapter) }).map((_, i) => {
                            const nextChap = currentChapter + i + 1;
                            return (
                                <TouchableOpacity key={nextChap} onPress={() => {
                                    onDismiss();
                                    navigateToNextChapter(props, i + 1);
                                }} style={{ padding: 16, borderRadius: 12, marginBottom: 4 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 14, fontWeight: '500', color: readerTextColor }}>Chapter {nextChap}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                        {maxChapter - currentChapter > 10 && (
                            <View style={{ padding: 16, alignItems: 'center' }}>
                                <Text style={{ fontSize: 14, color: readerTextColor, opacity: 0.5 }}>... and {maxChapter - currentChapter - 10} more</Text>
                            </View>
                        )}
                        <View style={{ height: 24 }} />
                    </ScrollView>

                    {/* Quick Jump Slider */}
                    <View style={{ padding: 24, borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: readerTextColor, opacity: 0.7, textTransform: 'uppercase' }}>Quick Jump</Text>
                            <View style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 }}>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.colors.onPrimary }}>Ch. {sliderValue} of {maxChapter}</Text>
                            </View>
                        </View>
                        <View style={{ position: 'relative', height: 40, justifyContent: 'center' }}>
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
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: readerTextColor, opacity: 0.7 }}>1</Text>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: readerTextColor, opacity: 0.7 }}>{maxChapter}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    </Portal>
);
};

export const ReaderAppearanceSettings = ({
    visible,
    onDismiss,
}: {
    visible: boolean;
    onDismiss: () => void;
}) => {
    const userPref = userPrefStore((state: any) => state.userPref) as UserPreferences;
    const setUserPref = userPrefStore((state: any) => state.setUserPref);
    const selectedTheme = userPref.editorPreferences.theme || 'light';

    // Dynamic color mapping based on the selected reader theme
    const getThemeColors = (themeKey: string) => {
        const isDark = themeKey === 'dark' || themeKey === 'oled';
        const isSepia = themeKey === 'sepia';
        
        const baseColors = {
            light: {
                surface: '#ffffff',
                onSurface: '#1b1b1e',
                onSurfaceVariant: '#46464d',
                primary: '#171c3c',
                onPrimary: '#ffffff',
                surfaceHigh: '#eae7ea',
                outline: '#c7c5ce',
                primaryContainer: '#dee1ff',
                onPrimaryContainer: '#141938',
            },
            sepia: {
                surface: '#F4ECD8',
                onSurface: '#2f1500',
                onSurfaceVariant: '#6a3b0e',
                primary: '#532900',
                onPrimary: '#ffffff',
                surfaceHigh: '#e5dec9',
                outline: '#ce8f5b',
                primaryContainer: '#ffdcc3',
                onPrimaryContainer: '#2f1500',
            },
            dark: {
                surface: '#171c3c',
                onSurface: '#dee1ff',
                onSurfaceVariant: '#959ac1',
                primary: '#c0c4ed',
                onPrimary: '#171c3c',
                surfaceHigh: '#2d3252',
                outline: '#404566',
                primaryContainer: '#2d3252',
                onPrimaryContainer: '#dee1ff',
            },
            oled: {
                surface: '#000000',
                onSurface: '#ffffff',
                onSurfaceVariant: 'rgba(255, 255, 255, 0.7)',
                primary: '#ffffff',
                onPrimary: '#000000',
                surfaceHigh: '#1c1c1e',
                outline: '#3a3a3c',
                primaryContainer: '#2c2c2e',
                onPrimaryContainer: '#ffffff',
            }
        };

        return baseColors[themeKey as keyof typeof baseColors] || baseColors.light;
    };

    const colors = getThemeColors(selectedTheme);

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

    const fonts = {
        headline: 'NotoSerif-Bold',
        label: 'Manrope-Bold',
        body: 'Manrope-Medium',
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ flex: 1, backgroundColor: 'transparent' }} style={{ margin: 0, justifyContent: 'flex-end' }}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={onDismiss} activeOpacity={1} />
                    
                    <View style={{ 
                        backgroundColor: colors.surface, 
                    borderTopLeftRadius: 40, 
                    borderTopRightRadius: 40, 
                    paddingHorizontal: 32, 
                    paddingTop: 12, 
                    paddingBottom: 40,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -12 },
                    shadowOpacity: 0.15,
                    shadowRadius: 32,
                    elevation: 20,
                    maxWidth: 600,
                    width: '100%',
                    alignSelf: 'center'
                }}>
                    {/* Drag Handle */}
                    <View style={{ 
                        width: 48, 
                        height: 4, 
                        backgroundColor: colors.onSurfaceVariant, 
                        opacity: 0.15, 
                        alignSelf: 'center', 
                        borderRadius: 2, 
                        marginBottom: 32 
                    }} />

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={{ gap: 28 }}>
                            {/* Font Family Section */}
                            <View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <Text style={{ fontFamily: fonts.headline, fontSize: 18, fontWeight: 'bold', color: colors.onSurface }}>Typography</Text>
                                    <Text style={{ fontSize: 10, fontFamily: fonts.label, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1.5 }}>Font Family</Text>
                                </View>
                                
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    {[
                                        { key: 'serif', label: 'Serif', font: 'NotoSerif-Regular' },
                                        { key: 'sans-serif', label: 'Sans', font: 'Manrope-Medium' },
                                        { key: 'monospace', label: 'Mono', font: 'SpaceMono' }
                                    ].map((item) => (
                                        <TouchableOpacity
                                            key={item.key}
                                            onPress={() => updateEditorPref('fontFamily', item.key)}
                                            style={{
                                                flex: 1,
                                                paddingVertical: 18,
                                                borderRadius: 20,
                                                backgroundColor: userPref.editorPreferences.fontFamily === item.key ? colors.primary : colors.surfaceHigh,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderWidth: userPref.editorPreferences.fontFamily === item.key ? 0 : 1,
                                                borderColor: selectedTheme === 'oled' ? colors.outline : 'transparent'
                                            }}
                                        >
                                            <Text style={{ fontFamily: item.font, fontSize: 22, color: userPref.editorPreferences.fontFamily === item.key ? colors.onPrimary : colors.onSurface }}>Aa</Text>
                                            <Text style={{ fontSize: 10, marginTop: 6, fontFamily: fonts.label, color: userPref.editorPreferences.fontFamily === item.key ? colors.onPrimary : colors.onSurfaceVariant }}>{item.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Font Size & Line Height Row */}
                            <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
                                {/* Font Size */}
                                <View style={{ flex: 1, gap: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <IconButton icon="format-size" size={14} iconColor={colors.onSurfaceVariant} style={{ margin: 0, padding: 0 }} />
                                        <Text style={{ fontSize: 11, fontFamily: fonts.label, color: colors.onSurfaceVariant }}>Font Size</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Slider
                                            style={{ flex: 1, height: 40 }}
                                            minimumValue={12}
                                            maximumValue={32}
                                            step={1}
                                            value={userPref.editorPreferences.fontSize}
                                            onValueChange={(val) => updateEditorPref('fontSize', val)}
                                            minimumTrackTintColor={colors.primary}
                                            maximumTrackTintColor={colors.outline}
                                            thumbTintColor={colors.primary}
                                        />
                                    </View>
                                </View>

                                {/* Line Height */}
                                <View style={{ flex: 1, gap: 12 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <IconButton icon="format-line-spacing" size={16} iconColor={colors.onSurfaceVariant} style={{ margin: 0, padding: 0 }} />
                                            <Text style={{ fontSize: 11, fontFamily: fonts.label, color: colors.onSurfaceVariant }}>Line Height</Text>
                                        </View>
                                        <IconButton icon="unfold-more-horizontal" size={14} iconColor={colors.onSurfaceVariant} style={{ margin: 0, padding: 0 }} />
                                    </View>
                                    <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceHigh, borderRadius: 10, padding: 2 }}>
                                        {[ { label: 'Tight', val: 1.2 }, { label: 'Default', val: 1.5 }, { label: 'Loose', val: 1.8 } ].map((lh) => (
                                            <TouchableOpacity
                                                key={lh.label}
                                                onPress={() => updateEditorPref('lineHeight', lh.val)}
                                                style={{
                                                    flex: 1,
                                                    paddingVertical: 10,
                                                    borderRadius: 8,
                                                    backgroundColor: userPref.editorPreferences.lineHeight === lh.val ? colors.primary : 'transparent',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <Text style={{ fontSize: 10, fontFamily: fonts.label, color: userPref.editorPreferences.lineHeight === lh.val ? colors.onPrimary : colors.onSurfaceVariant }}>{lh.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            {/* Margins & Themes Labels Row */}
                            <View style={{ flexDirection: 'row', gap: 24 }}>
                                <Text style={{ flex: 1, fontSize: 10, fontFamily: fonts.label, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1.5 }}>Page Margins</Text>
                                <Text style={{ flex: 1, fontSize: 10, fontFamily: fonts.label, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1.5 }}>Themes</Text>
                            </View>

                            {/* Margins & Themes Content Row */}
                            <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
                                {/* Margins */}
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <TouchableOpacity 
                                        onPress={() => updateEditorPref('padding', 12)} 
                                        style={{ 
                                            width: 44, height: 44, borderRadius: 22, 
                                            backgroundColor: userPref.editorPreferences.padding === 12 ? colors.primary : colors.surfaceHigh,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <IconButton icon="format-align-right" size={22} style={{ margin: 0 }} iconColor={userPref.editorPreferences.padding === 12 ? colors.onPrimary : colors.onSurfaceVariant} />
                                    </TouchableOpacity>
                                    <View style={{ flex: 1, height: 1, backgroundColor: colors.outline, opacity: 0.3, marginHorizontal: 4 }} />
                                    <TouchableOpacity 
                                        onPress={() => updateEditorPref('padding', 24)} 
                                        style={{ 
                                            width: 44, height: 44, borderRadius: 22, 
                                            backgroundColor: userPref.editorPreferences.padding === 24 ? colors.primary : colors.surfaceHigh,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <IconButton icon="format-align-center" size={22} style={{ margin: 0 }} iconColor={userPref.editorPreferences.padding === 24 ? colors.onPrimary : colors.onSurfaceVariant} />
                                    </TouchableOpacity>
                                    <View style={{ flex: 1, height: 1, backgroundColor: colors.outline, opacity: 0.3, marginHorizontal: 4 }} />
                                    <TouchableOpacity 
                                        onPress={() => updateEditorPref('padding', 36)} 
                                        style={{ 
                                            width: 44, height: 44, borderRadius: 22, 
                                            backgroundColor: userPref.editorPreferences.padding === 36 ? colors.primary : colors.surfaceHigh,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <IconButton icon="format-align-left" size={22} style={{ margin: 0 }} iconColor={userPref.editorPreferences.padding === 36 ? colors.onPrimary : colors.onSurfaceVariant} />
                                    </TouchableOpacity>
                                </View>

                                {/* Themes */}
                                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6 }}>
                                    {[ 
                                        { key: 'light', color: '#fcf8fb' }, 
                                        { key: 'sepia', color: '#F4ECD8' }, 
                                        { key: 'dark', color: '#171c3c' }, 
                                        { key: 'oled', color: '#000000' } 
                                    ].map((t) => (
                                        <TouchableOpacity
                                            key={t.key}
                                            onPress={() => updateEditorPref('theme', t.key)}
                                            style={{
                                                width: 34, height: 34, borderRadius: 17,
                                                backgroundColor: t.color,
                                                borderWidth: 1,
                                                borderColor: userPref.editorPreferences.theme === t.key ? colors.primary : colors.outline,
                                                shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
                                                alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            {userPref.editorPreferences.theme === t.key && (
                                                <View style={{ 
                                                    width: 44, height: 44, borderRadius: 22, 
                                                    borderWidth: 1.5, borderColor: colors.primary, 
                                                    position: 'absolute' 
                                                }} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                                <TouchableOpacity 
                                    onPress={resetToDefault} 
                                    style={{ 
                                        flex: 1, paddingVertical: 18, borderRadius: 32, 
                                        backgroundColor: colors.primaryContainer, 
                                        alignItems: 'center' 
                                    }}
                                >
                                    <Text style={{ color: colors.onPrimaryContainer, fontFamily: fonts.label, fontSize: 14 }}>Reset to Default</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={onDismiss} 
                                    style={{ 
                                        flex: 1, paddingVertical: 18, borderRadius: 32, 
                                        backgroundColor: colors.primary, 
                                        alignItems: 'center',
                                        shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 6
                                    }}
                                >
                                    <Text style={{ color: colors.onPrimary, fontFamily: fonts.label, fontSize: 14 }}>Save Changes</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    </Portal>
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
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={{ flex: 1, backgroundColor: 'transparent' }}
                style={{ margin: 0, justifyContent: 'flex-end' }}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={onDismiss} activeOpacity={1} />
                    <View style={{ alignItems: 'center', marginBottom: 16 }}>
                        <IconButton
                            icon="chevron-down"
                            iconColor="#ffffff"
                            size={32}
                            onPress={onDismiss}
                            style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                margin: 0,
                            }}
                        />
                    </View>
                    <View
                        style={{
                            backgroundColor: readerBgColor,
                            borderTopLeftRadius: 32,
                            borderTopRightRadius: 32,
                            paddingHorizontal: 32,
                            paddingTop: 0,
                            paddingBottom: 0,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -24 },
                            shadowOpacity: 0.4,
                            shadowRadius: 64,
                            borderTopWidth: 1,
                            borderTopColor: 'rgba(255,255,255,0.05)',
                            maxHeight: '85%',
                        }}
                    >
                        <TTSControls />
                    </View>
                </View>
            </Modal>
        </Portal>
    );
};
