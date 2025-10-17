import { View, StyleSheet, Text, Alert } from "react-native";
import { TTS, ttsStore, SpeechAction, setTTS, isSpeechOrPause } from "./tts";
import { Button, Icon, IconButton, Title, useTheme, ActivityIndicator } from "react-native-paper";
import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import Slider from '@react-native-community/slider';
import { defaultTTSConfig, TTSConfig, UserPreferences, userPrefStore } from "../userpref";
import { MD3Colors } from "react-native-paper/lib/typescript/types";
import * as Speech from 'expo-speech';
import SelectDropdown from 'react-native-select-dropdown';
import { create } from "zustand";

// Constants
const DEBOUNCE_DELAY = 300;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

// Display value multipliers for different slider types
const DISPLAY_MULTIPLIERS = {
    rate: 10,
    volume: 100,
    pitch: 10,
} as const;

// Validation ranges
const VALIDATION_RANGES = {
    rate: { min: 0.1, max: 2.0, step: 0.1 },
    volume: { min: 0, max: 1, step: 0.1 },
    pitch: { min: 0.5, max: 2.0, step: 0.1 },
} as const;

type SetTTSConfig = (ttsConfig: TTSConfig) => void;

interface Speaker extends Speech.Voice {
    speaker: string;
}

interface VoicesState {
    content: Speaker[];
    isLoading: boolean;
    error: string | null;
    retryCount: number;
    setContent: (content: Speaker[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setRetryCount: (count: number) => void;
}

interface SliderControlProps {
    label: string;
    value: number;
    onValueChange: (value: number) => void;
    min: number;
    max: number;
    step: number;
    colors: MD3Colors;
    defaultValue: number;
    multiplier?: number;
}

/**
 * System default voice configuration
 */
const systemVoice: Speaker = { 
    speaker: 'System Default', 
    identifier: "system", 
    language: "System Default", 
    name: "System Default", 
    quality: Speech.VoiceQuality.Default 
};

/**
 * Default voices list with fallback speakers
 */
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

/**
 * Enhanced voices store with error handling and loading states
 */
export const voicesStore = create<VoicesState>((set, get) => ({
    content: defaultVoices,
    isLoading: false,
    error: null,
    retryCount: 0,
    setContent: (content: Speaker[]) => set({ content, error: null }),
    setLoading: (isLoading: boolean) => set({ isLoading }),
    setError: (error: string | null) => set({ error }),
    setRetryCount: (retryCount: number) => set({ retryCount }),
}));

/**
 * Utility functions for value validation and clamping
 */
const validateAndClamp = (value: number, min: number, max: number): number => {
    if (isNaN(value) || !isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
};

const roundToStep = (value: number, step: number): number => {
    return Math.round(value / step) * step;
};

/**
 * Shallow comparison function to prevent unnecessary re-renders
 */
const shallowEqual = (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    if (!obj1 || !obj2) return false;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (let key of keys1) {
        if (obj1[key] !== obj2[key]) return false;
    }
    
    return true;
};

/**
 * Debounce utility for preventing excessive updates
 */
const useDebounce = (callback: Function, delay: number) => {
    const timeoutRef = useRef<NodeJS.Timeout | number | null>(null);
    
    return useCallback((...args: any[]) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current as NodeJS.Timeout);
        }
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
};

/**
 * Enhanced voice setup function with retry logic and error handling
 */
export async function setUpVoices(retryCount = 0): Promise<void> {
    const { setContent, setLoading, setError } = voicesStore.getState();
    
    try {
        setLoading(true);
        setError(null);
        
        const voices = await Speech.getAvailableVoicesAsync();
        const filteredVoices = voices?.filter(x => x.language === 'en-US') || [];
        
        if (filteredVoices.length > 0) {
            const availableVoices = defaultVoices.filter(x => 
                filteredVoices.findIndex(e => e.identifier === x.identifier) !== -1
            );
            setContent([systemVoice, ...availableVoices]);
        } else {
            // Fallback to default voices if no system voices are available
            setContent([systemVoice, ...defaultVoices]);
        }
    } catch (error) {
        console.error('Error setting up voices:', error);
        
        if (retryCount < MAX_RETRY_ATTEMPTS) {
            setTimeout(() => {
                setUpVoices(retryCount + 1);
            }, RETRY_DELAY * (retryCount + 1));
            setError(`Retrying voice setup... (${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
        } else {
            setError('Failed to load voices. Using default voices.');
            setContent([systemVoice, ...defaultVoices]);
        }
    } finally {
        setLoading(false);
    }
}


/**
 * Main TTSControls component with comprehensive optimizations
 */
const TTSControls: React.FC = React.memo(() => {
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Store subscriptions at the top level (cached selectors to prevent infinite loops)
    const userPref = userPrefStore(useCallback((state: any) => state.userPref, [])) as UserPreferences;
    const ttsConfig = useMemo(() => userPref?.ttsConfig || defaultTTSConfig, [userPref?.ttsConfig]);
    
    const tts: TTS = ttsStore(useCallback((state: any) => state.tts, [])) || useMemo(() => ({ 
        state: 'unknown' as SpeechAction, 
        sentences: [], 
        ttsQueue: [], 
        index: 0 
    }), []);
    
    const voices = voicesStore(useCallback((state) => state.content, []));
    const voicesLoading = voicesStore(useCallback((state) => state.isLoading, []));
    const voicesError = voicesStore(useCallback((state) => state.error, []));
    
    const colors = useTheme().colors;

    // Memoized derived values
    const controlVisible = useMemo(() => isSpeechOrPause(tts.state), [tts.state]);
    
    // Store action creators with error handling (memoized to prevent re-creation)
    const setUserPref: SetTTSConfig = useMemo(() => (config: TTSConfig) => {
        try {
            const setter = (userPrefStore.getState() as any).setTTSConfig;
            setter(config);
        } catch (error) {
            console.error('Error setting user preferences:', error);
            Alert.alert('Error', 'Failed to save TTS settings. Please try again.');
        }
    }, []);
    
    const setTTStore: (tts: TTS) => void = useMemo(() => (ttsState: TTS) => {
        try {
            const setter = (ttsStore.getState() as any).setTTS;
            setter(ttsState);
        } catch (error) {
            console.error('Error setting TTS state:', error);
            Alert.alert('Error', 'Failed to update TTS state. Please try again.');
        }
    }, []);
    
    const updateTTSConfig: SetTTSConfig = useMemo(() => (config: TTSConfig) => {
        try {
            const updater = (ttsStore.getState() as any).updateTTSConfig;
            updater(config);
        } catch (error) {
            console.error('Error updating TTS config:', error);
            Alert.alert('Error', 'Failed to update TTS configuration. Please try again.');
        }
    }, []);

    // Initialize voices on component mount
    useEffect(() => {
        setUpVoices();
    }, []);

    /**
     * Safely update TTS state with error handling
     */
    const updateTTS = useCallback(async (state: SpeechAction) => {
        if (isUpdating || tts.state === state) return; // Prevent duplicate updates
        
        try {
            setIsUpdating(true);
            const updatedTTS: TTS = { ...tts, state };
            await setTTS({ tts: updatedTTS, setTTS: setTTStore });
        } catch (error) {
            console.error('Error updating TTS:', error);
            Alert.alert('Error', 'Failed to update TTS. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    }, [tts, setTTStore, isUpdating]);

    /**
     * Debounced TTS config update to prevent excessive calls
     */
    const debouncedUpdateTTSConfig = useDebounce(
        useCallback((newConfig: TTSConfig) => {
            // Only update if config actually changed (using shallow comparison)
            if (shallowEqual(newConfig, ttsConfig)) return;
            
            setUserPref(newConfig);
            updateTTSConfig(newConfig);
        }, [setUserPref, updateTTSConfig, ttsConfig]),
        DEBOUNCE_DELAY
    );

    /**
     * Validate and update TTS configuration
     */
    const updateTTSConfigBoth = useCallback((newConfig: TTSConfig) => {
        // Validate all config values
        const validatedConfig: TTSConfig = {
            rate: validateAndClamp(newConfig.rate, VALIDATION_RANGES.rate.min, VALIDATION_RANGES.rate.max),
            volume: validateAndClamp(newConfig.volume, VALIDATION_RANGES.volume.min, VALIDATION_RANGES.volume.max),
            pitch: validateAndClamp(newConfig.pitch, VALIDATION_RANGES.pitch.min, VALIDATION_RANGES.pitch.max),
            voice: newConfig.voice || defaultTTSConfig.voice,
        };

        // Only update if different from current config (using shallow comparison)
        if (!shallowEqual(validatedConfig, ttsConfig)) {
            debouncedUpdateTTSConfig(validatedConfig);
        }
    }, [debouncedUpdateTTSConfig, ttsConfig]);

    /**
     * Memoized voice selection component
     */
    const voiceSelector = useMemo(() => {
        if (voicesLoading) {
            return (
                <Button mode="contained-tonal" style={styles.dropdownButtonStyle} disabled>
                    <ActivityIndicator size="small" />
                    <View style={{ width: 8 }} />
                    <Title style={{ fontSize: 16 }}>Loading...</Title>
                </Button>
            );
        }

        if (voicesError) {
            return (
                <Button 
                    mode="contained-tonal" 
                    style={styles.dropdownButtonStyle}
                    onPress={() => {
                        setUpVoices();
                    }}
                >
                    <Icon source="refresh" size={20} />
                    <View style={{ width: 8 }} />
                    <Title style={{ fontSize: 16 }}>Retry</Title>
                </Button>
            );
        }

        if (!voices || !Array.isArray(voices) || voices.length === 0) {
            return (
                <Button mode="contained-tonal" style={styles.dropdownButtonStyle} disabled>
                    <Icon source="microphone-off" size={20} />
                    <View style={{ width: 8 }} />
                    <Title style={{ fontSize: 16 }}>No Voices</Title>
                </Button>
            );
        }

        // Memoize the voice data to prevent recreation
        const voiceData = voices.map((voice) => ({ 
            title: voice.name, 
            id: voice.identifier, 
            label: voice.speaker 
        }));

        const selectedVoiceIndex = Math.max(0, voices.findIndex((voice) => voice.identifier === ttsConfig.voice));
        const selectedVoice = voices.find((voice) => voice.identifier === ttsConfig.voice) || voices[0];

        return (
            <SelectDropdown
                defaultValue={ttsConfig.voice}
                data={voiceData}
                onSelect={(item) => {
                    updateTTSConfigBoth({ ...ttsConfig, voice: item.id });
                }}
                defaultValueByIndex={selectedVoiceIndex}
                renderButton={(__, _) => {
                    if (!selectedVoice) return null;
                    return (
                        <Button mode="contained-tonal" style={styles.dropdownButtonStyle}>
                            <Icon source="microphone" size={20} />
                            <View style={{ width: 8 }} />
                            <Title style={{ fontSize: 16 }}>{selectedVoice.speaker}</Title>
                        </Button>
                    );
                }}
                renderItem={(item, _, isSelected) => {
                    return (
                        <View style={[
                            styles.dropdownItemStyle,
                            { 
                                backgroundColor: colors.background, 
                                ...(isSelected && { backgroundColor: colors.primary }) 
                            }
                        ]}>
                            <Text style={[
                                styles.dropdownItemTxtStyle, 
                                {
                                    color: colors.primary,
                                    ...(isSelected && { color: colors.background })
                                }
                            ]}>
                                {item.label}
                            </Text>
                        </View>
                    );
                }}
                showsVerticalScrollIndicator={false}
                dropdownStyle={[styles.dropdownMenuStyle, { backgroundColor: colors.surface }]}
            />
        );
    }, [voices, voicesLoading, voicesError, ttsConfig.voice, colors, updateTTSConfigBoth]);

    /**
     * Memoized control buttons
     */
    const controlButtons = useMemo(() => (
        <View style={styles.bottomBarStyle}>
            <IconButton 
                icon="stop" 
                onPress={() => updateTTS('stop')} 
                disabled={isUpdating}
            />
            <View style={{ width: 16 }} />
            <IconButton 
                icon={tts.state === 'pause' ? 'play' : 'pause'}
                onPress={() => updateTTS(tts.state === 'pause' ? 'speak' : 'pause')} 
                disabled={isUpdating}
            />
            <View style={{ width: 16 }} />
            {voiceSelector}
        </View>
    ), [tts.state, isUpdating, updateTTS, voiceSelector]);

    /**
     * Memoized TTS configuration options
     */
    const ttsConfigOptions = useMemo(() => {
        // Create stable change handlers to prevent re-renders
        const handleRateChange = (value: number) => updateTTSConfigBoth({ ...ttsConfig, rate: value });
        const handleVolumeChange = (value: number) => updateTTSConfigBoth({ ...ttsConfig, volume: value });
        const handlePitchChange = (value: number) => updateTTSConfigBoth({ ...ttsConfig, pitch: value });

        return (
            <View style={{ paddingHorizontal: 10 }}>
                <SliderControl
                    label="Rate"
                    value={ttsConfig.rate}
                    onValueChange={handleRateChange}
                    min={VALIDATION_RANGES.rate.min}
                    max={VALIDATION_RANGES.rate.max}
                    step={VALIDATION_RANGES.rate.step}
                    colors={colors}
                    defaultValue={defaultTTSConfig.rate}
                    multiplier={DISPLAY_MULTIPLIERS.rate}
                />
                <SliderControl
                    label="Volume"
                    value={ttsConfig.volume}
                    onValueChange={handleVolumeChange}
                    min={VALIDATION_RANGES.volume.min}
                    max={VALIDATION_RANGES.volume.max}
                    step={VALIDATION_RANGES.volume.step}
                    colors={colors}
                    defaultValue={defaultTTSConfig.volume}
                    multiplier={DISPLAY_MULTIPLIERS.volume}
                />
                <SliderControl
                    label="Pitch"
                    value={ttsConfig.pitch}
                    onValueChange={handlePitchChange}
                    min={VALIDATION_RANGES.pitch.min}
                    max={VALIDATION_RANGES.pitch.max}
                    step={VALIDATION_RANGES.pitch.step}
                    colors={colors}
                    defaultValue={defaultTTSConfig.pitch}
                    multiplier={DISPLAY_MULTIPLIERS.pitch}
                />
            </View>
        );
    }, [ttsConfig.rate, ttsConfig.volume, ttsConfig.pitch, colors, updateTTSConfigBoth]);

    if (!controlVisible) {
        return null;
    }

    return (
        <View style={{ paddingHorizontal: 5, paddingTop: 5 }}>
            {ttsConfigOptions}
            {controlButtons}
        </View>
    );
});

const styles = StyleSheet.create({
    bottomBarStyle: {
        flexDirection: 'row' as 'row', 
        justifyContent: 'center' as 'center',
    },
    dropdownButtonStyle: {
        width: 200,
        height: 50,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    dropdownButtonTxtStyle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '500',
        color: '#151E26',
    },
    dropdownButtonArrowStyle: {
        fontSize: 28,
    },
    dropdownButtonIconStyle: {
        fontSize: 28,
        marginRight: 8,
    },
    dropdownMenuStyle: {
        width: 200,
        borderRadius: 8,
    },
    dropdownItemStyle: {
        width: '100%',
        flexDirection: 'row',
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
    },
    dropdownItemTxtStyle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '500',
    },
    dropdownItemIconStyle: {
        fontSize: 28,
        marginRight: 8,
    },
    // New slider control styles
    sliderContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
        paddingHorizontal: 5,
    },
    sliderLabel: {
        fontSize: 12,
        fontWeight: '600',
        minWidth: 50,
    },
    sliderValueContainer: {
        width: 40,
        alignItems: 'center',
        marginHorizontal: 8,
    },
    sliderValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    sliderWrapper: {
        flex: 1,
        paddingHorizontal: 10,
    },
    sliderControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sliderButton: {
        padding: 0,
        margin: 2,
    },
    sliderButtonPlaceholder: {
        width: 32,
        height: 32,
    },
});

/**
 * Enhanced SliderControl component with validation and error handling
 */
const SliderControl: React.FC<SliderControlProps> = React.memo(({ 
    label, 
    value, 
    onValueChange, 
    min, 
    max, 
    step, 
    colors, 
    defaultValue,
    multiplier = 10
}) => {
    const [localValue, setLocalValue] = useState(value);
    const [isDefaultValue, setIsDefaultValue] = useState(value === defaultValue);

    // Debounced value change to prevent excessive updates
    const debouncedOnValueChange = useDebounce(
        useCallback((newValue: number) => {
            const validatedValue = validateAndClamp(newValue, min, max);
            const steppedValue = roundToStep(validatedValue, step);
            onValueChange(steppedValue);
        }, [onValueChange, min, max, step]),
        DEBOUNCE_DELAY
    );

    // Update local value when prop changes
    useEffect(() => {
        setLocalValue(value);
        setIsDefaultValue(Math.abs(value - defaultValue) < step / 2);
    }, [value, defaultValue, step]);

    /**
     * Handle slider value changes with validation
     */
    const handleValueChange = useCallback((newValue: number) => {
        if (isNaN(newValue) || !isFinite(newValue)) {
            return;
        }
        
        const clampedValue = validateAndClamp(newValue, min, max);
        setLocalValue(clampedValue);
        debouncedOnValueChange(clampedValue);
    }, [min, max, debouncedOnValueChange]);

    /**
     * Handle increment/decrement with step validation
     */
    const adjustValue = useCallback((delta: number) => {
        const newValue = validateAndClamp(localValue + delta, min, max);
        const steppedValue = roundToStep(newValue, step);
        handleValueChange(steppedValue);
    }, [localValue, min, max, step, handleValueChange]);

    /**
     * Reset to default value
     */
    const resetToDefault = useCallback(() => {
        handleValueChange(defaultValue);
    }, [defaultValue, handleValueChange]);

    /**
     * Calculate display value with proper formatting
     */
    const displayValue = useMemo(() => {
        const scaledValue = localValue * multiplier;
        return multiplier === 100 ? 
            Math.round(scaledValue).toString() : 
            scaledValue.toFixed(1);
    }, [localValue, multiplier]);

    return (
        <View style={styles.sliderContainer}>
            <Title style={styles.sliderLabel}>{label}</Title>
            <View style={styles.sliderValueContainer}>
                <Title style={styles.sliderValue}>{displayValue}</Title>
            </View>
            <View style={styles.sliderWrapper}>
                <Slider
                    value={localValue}
                    onValueChange={setLocalValue}
                    onSlidingComplete={handleValueChange}
                    minimumValue={min}
                    maximumValue={max}
                    step={step}
                    thumbTintColor={colors.primary}
                    minimumTrackTintColor={colors.secondary}
                    maximumTrackTintColor={colors.primary}
                />
            </View>
            <View style={styles.sliderControls}>
                {!isDefaultValue ? (
                    <IconButton 
                        size={16} 
                        style={styles.sliderButton}
                        icon="refresh" 
                        onPress={resetToDefault}
                        iconColor={colors.primary}
                    />
                ) : (
                    <View style={styles.sliderButtonPlaceholder} />
                )}
                <IconButton 
                    size={16} 
                    style={styles.sliderButton} 
                    icon="minus" 
                    onPress={() => adjustValue(-step)}
                    disabled={localValue <= min}
                    iconColor={localValue <= min ? colors.outline : colors.primary}
                />
                <IconButton 
                    size={16} 
                    style={styles.sliderButton} 
                    icon="plus" 
                    onPress={() => adjustValue(step)}
                    disabled={localValue >= max}
                    iconColor={localValue >= max ? colors.outline : colors.primary}
                />
            </View>
        </View>
    );
});

// Set display name for debugging
TTSControls.displayName = 'TTSControls';
SliderControl.displayName = 'SliderControl';

export default TTSControls;