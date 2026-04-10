import { View, StyleSheet, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { TTS, ttsStore, SpeechAction, setTTS, isSpeechOrPause } from "./tts";
import { Button, Icon, IconButton, Title, useTheme } from "react-native-paper";
import React, { useEffect } from "react";
import Slider from '@react-native-community/slider';
import { defaultTTSConfig, TTSConfig, UserPreferences, userPrefStore, ReaderThemes } from "../userpref";
import { MD3Colors } from "react-native-paper/lib/typescript/types";
import * as Speech from 'expo-speech';
import { create } from "zustand";

type SetTTSConfig = (ttsConfig: TTSConfig) => void;

interface Speaker extends Speech.Voice {
    speaker: string;
}

const systemVoice = { speaker: 'Mary', identifier: "system", language: "System Default", name: "System Default", quality: Speech.VoiceQuality.Default };

const defaultVoices: Speaker[] = [
    { speaker: 'Patricia', identifier: "en-us-x-tpf-local", language: "en-US", name: "en-us-x-tpf-local", quality: Speech.VoiceQuality.Enhanced },
    { speaker: 'Jennifer', identifier: "en-us-x-sfg-network", language: "en-US", name: "en-us-x-sfg-network", quality: Speech.VoiceQuality.Enhanced },
    { speaker: 'Linda', identifier: "en-us-x-sfg-local", language: "en-US", name: "en-us-x-sfg-local", quality: Speech.VoiceQuality.Enhanced },
    { speaker: 'Elizabeth', identifier: "en-us-x-iob-local", language: "en-US", name: "en-us-x-iob-local", quality: Speech.VoiceQuality.Enhanced },
    { speaker: 'Smith', identifier: "en-us-x-tpd-network", language: "en-US", name: "en-us-x-tpd-network", quality: Speech.VoiceQuality.Enhanced },
    { speaker: 'Barbara', identifier: "en-us-x-tpc-network", language: "en-US", name: "en-us-x-tpc-network", quality: Speech.VoiceQuality.Enhanced },
    { speaker: 'Susan', identifier: "en-us-x-iob-network", language: "en-US", name: "en-us-x-iob-network", quality: Speech.VoiceQuality.Enhanced },
    { speaker: 'Johnson', identifier: "en-us-x-iol-network", language: "en-US", name: "en-us-x-iol-network", quality: Speech.VoiceQuality.Enhanced },
    { speaker: 'Williams', identifier: "en-us-x-iom-network", language: "en-US", name: "en-us-x-iom-network", quality: Speech.VoiceQuality.Enhanced },
    { speaker: 'Brown', identifier: "en-us-x-iom-local", language: "en-US", name: "en-us-x-iom-local", quality: Speech.VoiceQuality.Enhanced },
    { speaker: 'Jessica', identifier: "en-US-language", language: "en-US", name: "en-US-language", quality: Speech.VoiceQuality.Enhanced },
    { speaker: 'Jones', identifier: "en-us-x-tpd-local", language: "en-US", name: "en-us-x-tpd-local", quality: Speech.VoiceQuality.Enhanced },
    { speaker: 'Sarah', identifier: "en-us-x-iog-network", language: "en-US", name: "en-us-x-iog-network", quality: Speech.VoiceQuality.Enhanced },
    { speaker: 'Karen', identifier: "en-us-x-tpf-network", language: "en-US", name: "en-us-x-tpf-network", quality: Speech.VoiceQuality.Enhanced },
    { speaker: 'Kia', identifier: "en-us-x-iog-local", language: "en-US", name: "en-us-x-iog-local", quality: Speech.VoiceQuality.Enhanced },
    { speaker: 'Gracia', identifier: "en-us-x-tpc-local", language: "en-US", name: "en-us-x-tpc-local", quality: Speech.VoiceQuality.Enhanced },
    { speaker: 'Davis', identifier: "en-us-x-iol-local", language: "en-US", name: "en-us-x-iol-local", quality: Speech.VoiceQuality.Enhanced }
];
export const voicesStore = create<any>((set) => ({
    content: defaultVoices,
    setContent: (content: any[]) => set({ content }),
}))

const avatarImages = [
    require('../../assets/narrator_avatar.png'),
    require('../../assets/avatar_1.png'),
    require('../../assets/avatar_2.png'),
    require('../../assets/avatar_3.png'),
    require('../../assets/avatar_4.png'),
    require('../../assets/avatar_5.png'),
    require('../../assets/avatar_6.png'),
    require('../../assets/avatar_7.png'),
    require('../../assets/avatar_8.png'),
    require('../../assets/avatar_9.png'),
    require('../../assets/avatar_10.png'),
    require('../../assets/avatar_11.png'),
    require('../../assets/avatar_12.png'),
    require('../../assets/avatar_13.png'),
    require('../../assets/avatar_14.png'),
    require('../../assets/avatar_15.png'),
    require('../../assets/avatar_16.png'),
    require('../../assets/avatar_17.png'),
];

export function setUpVoices(setVoices: any) {
    Speech.getAvailableVoicesAsync().then((voices) => {
        voices = voices?.filter(x => x.language === 'en-US');
        if (voices.length) {
            voices = defaultVoices.filter(x => voices.findIndex(e => e.identifier === x.identifier) !== -1);
            setVoices([systemVoice, ...voices]);
        }
    });
}


export default function TTSControls() {
    const userPref = userPrefStore((state: any) => state.userPref) as UserPreferences;
    const ttsConfig = userPref.ttsConfig;
    const editorPref = userPref.editorPreferences;
    const readerThemeKey = editorPref.theme && ReaderThemes[editorPref.theme as keyof typeof ReaderThemes] ? editorPref.theme : 'light';
    const readerBgColor = ReaderThemes[readerThemeKey as keyof typeof ReaderThemes].background;
    const readerTextColor = ReaderThemes[readerThemeKey as keyof typeof ReaderThemes].text;
    const setUserPref: SetTTSConfig = (userPrefStore((state: any) => state.setTTSConfig));
    const tts: TTS = ttsStore((state: any) => state.tts);
    const setTTStore: (tts: TTS) => void = ttsStore((state: any) => state.setTTS);
    const updateTTSConfig: SetTTSConfig = ttsStore((state: any) => state.updateTTSConfig);
    const controlVisible = isSpeechOrPause(tts.state);
    const voices: Speaker[] = voicesStore((state) => state.content);
    const theme = useTheme();
    const colors = theme.colors;

    function updateTTS(state: SpeechAction) {
        let t: TTS = { ...tts, state: state }
        setTTS({ tts: t, setTTS: setTTStore });
    }

    function updateTTSConfigBoth(ttsConfig: TTSConfig) {
        setUserPref(ttsConfig);
        updateTTSConfig(ttsConfig);
    }

    const voicesSelect = (
        <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: readerTextColor, marginBottom: 12 }}>Narrator</Text>
            <View style={{ gap: 12 }}>
                {voices.map((voice, index) => {
                    const isSelected = ttsConfig.voice === voice.identifier;
                    return (
                        <TouchableOpacity
                            key={voice.identifier}
                            onPress={() => updateTTSConfigBoth({ ...ttsConfig, voice: voice.identifier })}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 16,
                                borderRadius: 16,
                                backgroundColor: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
                                borderWidth: 1,
                                borderColor: isSelected ? theme.colors.primary : 'rgba(255,255,255,0.05)',
                            }}
                        >
                            <View style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1e293b', marginRight: 16 }}>
                                <Image source={avatarImages[index % avatarImages.length]} style={{ width: '100%', height: '100%', opacity: isSelected ? 1 : 0.6 }} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: isSelected ? theme.colors.primary : readerTextColor }}>{voice.speaker}</Text>
                                <Text style={{ fontSize: 12, color: readerTextColor, opacity: 0.6 }}>{voice.language}</Text>
                            </View>
                            {isSelected && <Icon source="check-circle" size={24} color={theme.colors.primary} />}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    const speedPresets = [0.8, 1.0, 1.2, 1.5, 2.0];
    const speedControls = (
        <View style={{ marginTop: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: readerTextColor, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 2 }}>Playback Speed</Text>
                {ttsConfig.rate !== defaultTTSConfig.rate && (
                    <TouchableOpacity onPress={() => updateTTSConfigBoth({ ...ttsConfig, rate: defaultTTSConfig.rate })}>
                        <Icon source="refresh" size={18} color={readerTextColor} />
                    </TouchableOpacity>
                )}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                {speedPresets.map((speed) => {
                    const isActive = ttsConfig.rate === speed;
                    return (
                        <TouchableOpacity
                            key={speed}
                            onPress={() => updateTTSConfigBoth({ ...ttsConfig, rate: speed })}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                alignItems: 'center',
                                borderRadius: 12,
                                backgroundColor: isActive ? 'rgba(192, 196, 237, 0.1)' : 'transparent',
                                borderWidth: 1,
                                borderColor: isActive ? 'rgba(192, 196, 237, 0.2)' : 'transparent',
                            }}
                        >
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: isActive ? theme.colors.primary : readerTextColor, opacity: isActive ? 1 : 0.5 }}>{speed.toFixed(1)}x</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    const centerAction = (
        <View style={{ alignItems: 'center', marginBottom: 32, paddingTop: 0 }}>
            <View style={{ position: 'relative', width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }}>
                {tts.state === 'speak' && (
                    <View style={{ position: 'absolute', width: 140, height: 140, backgroundColor: theme.colors.primary, opacity: 0.2, borderRadius: 70 }} />
                )}
                <TouchableOpacity
                    onPress={() => updateTTS(tts.state === 'pause' ? 'speak' : (tts.state === 'speak' ? 'pause' : 'speak'))}
                    style={{
                        width: 96,
                        height: 96,
                        borderRadius: 48,
                        backgroundColor: theme.colors.primaryContainer,
                        alignItems: 'center',
                        justifyContent: 'center',
                        elevation: 10,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.3,
                        shadowRadius: 20,
                    }}
                >
                    <Icon source={tts.state === 'speak' ? 'pause' : 'play'} size={48} color={theme.colors.onPrimaryContainer} />
                </TouchableOpacity>
            </View>
            <Text style={{ marginTop: 16, fontSize: 12, fontWeight: 'bold', color: readerTextColor, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 2 }}>
                {tts.state === 'speak' ? 'Narration Active' : 'Narration Paused'}
            </Text>
        </View>
    );

    const sliderControls = (
        <View style={{ flexDirection: 'row', gap: 24, marginTop: 16 }}>
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: readerTextColor, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>Volume</Text>
                        {ttsConfig.volume !== defaultTTSConfig.volume && (
                            <TouchableOpacity onPress={() => updateTTSConfigBoth({ ...ttsConfig, volume: defaultTTSConfig.volume })}>
                                <Icon source="refresh" size={16} color={readerTextColor} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Icon source="volume-high" size={18} color={readerTextColor} />
                </View>
                <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={0}
                    maximumValue={1}
                    step={0.1}
                    value={ttsConfig.volume}
                    onValueChange={(val) => updateTTSConfigBoth({ ...ttsConfig, volume: val })}
                    minimumTrackTintColor={theme.colors.primary}
                    maximumTrackTintColor={theme.colors.outlineVariant}
                    thumbTintColor={theme.colors.primary}
                />
            </View>
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: readerTextColor, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>Pitch</Text>
                        {ttsConfig.pitch !== defaultTTSConfig.pitch && (
                            <TouchableOpacity onPress={() => updateTTSConfigBoth({ ...ttsConfig, pitch: defaultTTSConfig.pitch })}>
                                <Icon source="refresh" size={16} color={readerTextColor} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Icon source="waveform" size={18} color={readerTextColor} />
                </View>
                <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={0.5}
                    maximumValue={2.0}
                    step={0.1}
                    value={ttsConfig.pitch}
                    onValueChange={(val) => updateTTSConfigBoth({ ...ttsConfig, pitch: val })}
                    minimumTrackTintColor={theme.colors.primary}
                    maximumTrackTintColor={theme.colors.outlineVariant}
                    thumbTintColor={theme.colors.primary}
                />
            </View>
        </View>
    );

    return (
        <ScrollView style={{ paddingHorizontal: 0 }} showsVerticalScrollIndicator={false}>
            {centerAction}
            {sliderControls}
            {speedControls}
            {voicesSelect}
        </ScrollView>
    );
}
