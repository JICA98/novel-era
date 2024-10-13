import { View } from "react-native";
import { TTS, ttsStore, SpeechAction, setTTS, isSpeechOrPause } from "./tts";
import { Button, IconButton, Title, useTheme } from "react-native-paper";
import React, { useEffect } from "react";
import Slider from '@react-native-community/slider';
import { defaultTTSConfig, TTSConfig, UserPreferences, userPrefStore } from "../userpref";
import { MD3Colors } from "react-native-paper/lib/typescript/types";
import * as Speech from 'expo-speech';

type SetTTSConfig = (ttsConfig: TTSConfig) => void;

export default function TTSControls() {
    const ttsConfig = (userPrefStore((state: any) => state.userPref) as UserPreferences).ttsConfig;
    const setUserPref: SetTTSConfig = (userPrefStore((state: any) => state.setTTSConfig));
    const tts: TTS = ttsStore((state: any) => state.tts);
    const setTTStore: (tts: TTS) => void = ttsStore((state: any) => state.setTTS);
    const updateTTSConfig: SetTTSConfig = ttsStore((state: any) => state.updateTTSConfig);
    const controlVisible = isSpeechOrPause(tts.state);
    const colors = useTheme().colors;

    function updateTTS(state: SpeechAction) {
        let t: TTS = { ...tts, state: state }
        setTTS({ tts: t, setTTS: setTTStore });
    }

    function updateTTSConfigBoth(ttsConfig: TTSConfig) {
        setUserPref(ttsConfig);
        updateTTSConfig(ttsConfig);
    }

    useEffect(() => {
        Speech.getAvailableVoicesAsync().then((voices) => {
            console.log(voices);
        });
    }, []);

    const controlButtons = <>
        <View style={styles.bottomBarStyle}>
            <IconButton icon="stop" onPress={() => updateTTS('stop')} />
            <View style={{ width: 16 }} />
            <IconButton icon={tts.state === 'pause' ? 'play' : 'pause'}
                onPress={() => updateTTS(tts.state === 'pause' ? 'speak' : 'pause')} />
        </View>
    </>;
    const ttsConfigOptions = <>
        <View style={{ paddingHorizontal: 10 }}>
            <SliderControl
                label={"Rate"}
                value={ttsConfig.rate}
                onValueChange={(value) => updateTTSConfigBoth({ ...ttsConfig, rate: value })}
                min={0.1}
                max={2.0}
                step={0.1}
                colors={colors}
                defaultValue={defaultTTSConfig.rate}
            />
            <SliderControl
                label={"Volume"}
                value={ttsConfig.volume}
                onValueChange={(value) => updateTTSConfigBoth({ ...ttsConfig, volume: value })}
                min={0}
                max={1}
                step={0.1}
                colors={colors}
                defaultValue={defaultTTSConfig.volume}
            />
            <SliderControl
                label={"Pitch"}
                value={ttsConfig.pitch}
                onValueChange={(value) => updateTTSConfigBoth({ ...ttsConfig, pitch: value })}
                min={0.5}
                max={2.0}
                step={0.1}
                colors={colors}
                defaultValue={defaultTTSConfig.pitch}
            />
        </View>
    </>

    return (controlVisible && <>
        <View style={{ paddingHorizontal: 5, paddingTop: 5 }}>
            {ttsConfigOptions}
            {controlButtons}
        </View>
    </>);
}

const styles = {
    bottomBarStyle: {
        flexDirection: 'row' as 'row', justifyContent: 'center' as 'center',
    },
};

function SliderControl({ label, value, onValueChange, min, max, step, colors, defaultValue }:
    {
        label: string, value: number, onValueChange: (value: number) => void,
        min: number, max: number, step: number, colors: MD3Colors
        defaultValue: number
    }) {
    return (
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
            <Title style={{ fontSize: 10 }}>{label}</Title>
            <View style={{ width: 10 }}></View>
            <Title style={{ fontSize: 15 }}>{(value * 10).toFixed(0)}</Title>
            <View style={{ flex: 1 }}>
                <Slider
                    value={value}
                    onValueChange={onValueChange}
                    minimumValue={min}
                    maximumValue={max}
                    step={step}
                    thumbTintColor={colors.primary}
                    minimumTrackTintColor={colors.secondary}
                    maximumTrackTintColor={colors.primary}
                />
            </View>
            {defaultValue !== value && <IconButton size={16} style={{ padding: 0, margin: 0 }}
                icon="refresh" onPress={() => onValueChange(defaultValue)} />}
            {defaultValue === value && <View style={{ marginHorizontal: 10 }}></View>}
            <IconButton size={16} style={{ padding: 0, margin: 0 }} icon="minus" onPress={() => onValueChange(value - step)} />
            <IconButton size={16} style={{ padding: 0, margin: 0 }} icon="plus" onPress={() => onValueChange(value + step)} />
        </View>
    );
}