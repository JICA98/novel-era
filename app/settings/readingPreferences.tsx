import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { 
    List, 
    Switch, 
    Text, 
    RadioButton, 
    useTheme,
    Divider
} from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { 
    userPrefStore, 
    ReadingExperiencePreferences,
    AutoScrollSettings,
    PageTurnAnimation,
    ReadingModePreferences,
    UserPreferences
} from '../userpref';

interface ReadingPreferencesProps {
    setSnackbarText: (text: string) => void;
}

export default function ReadingPreferences({ setSnackbarText }: ReadingPreferencesProps) {
    const userPref = userPrefStore((state: any) => state.userPref) as UserPreferences;
    const setReadingExperience = userPrefStore((state: any) => state.setReadingExperience);
    const theme = useTheme();
    
    const [autoScrollExpanded, setAutoScrollExpanded] = useState(false);
    const [animationExpanded, setAnimationExpanded] = useState(false);
    const [readingModeExpanded, setReadingModeExpanded] = useState(false);

    if (!userPref) {
        return null;
    }

    const readingExperience = userPref.readingExperience;

    const updateAutoScroll = (updates: Partial<AutoScrollSettings>) => {
        const newReadingExperience: ReadingExperiencePreferences = {
            ...readingExperience,
            autoScroll: { ...readingExperience.autoScroll, ...updates }
        };
        setReadingExperience(newReadingExperience);
        setSnackbarText('Auto-scroll settings updated');
    };

    const updatePageTurnAnimation = (updates: Partial<PageTurnAnimation>) => {
        const newReadingExperience: ReadingExperiencePreferences = {
            ...readingExperience,
            pageTurnAnimation: { ...readingExperience.pageTurnAnimation, ...updates }
        };
        setReadingExperience(newReadingExperience);
        setSnackbarText('Page turn animation settings updated');
    };

    const updateReadingMode = (updates: Partial<ReadingModePreferences>) => {
        const newReadingExperience: ReadingExperiencePreferences = {
            ...readingExperience,
            readingMode: { ...readingExperience.readingMode, ...updates }
        };
        setReadingExperience(newReadingExperience);
        setSnackbarText('Reading mode settings updated');
    };

    return (
        <View>
            {/* Auto-scroll Settings */}
            <List.Accordion
                title="Auto-scroll Settings"
                description={readingExperience.autoScroll.enabled ? "Enabled" : "Disabled"}
                expanded={autoScrollExpanded}
                onPress={() => setAutoScrollExpanded(!autoScrollExpanded)}
                left={(props) => <List.Icon {...props} icon="play-speed" />}
            >
                <List.Item
                    title="Enable Auto-scroll"
                    description="Automatically scroll content while reading"
                    left={(props) => <List.Icon {...props} icon="auto-fix" />}
                    right={() => (
                        <Switch
                            value={readingExperience.autoScroll.enabled}
                            onValueChange={(enabled) => updateAutoScroll({ enabled })}
                        />
                    )}
                />
                
                {readingExperience.autoScroll.enabled && (
                    <>
                        <View style={styles.sliderContainer}>
                            <Text variant="bodyMedium" style={styles.sliderLabel}>
                                Auto-scroll Speed: {readingExperience.autoScroll.speed} pixels/sec
                            </Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={10}
                                maximumValue={200}
                                value={readingExperience.autoScroll.speed}
                                onValueChange={(speed) => updateAutoScroll({ speed: Math.round(speed) })}
                                minimumTrackTintColor={theme.colors.primary}
                                maximumTrackTintColor={theme.colors.outline}
                            />
                        </View>

                        <List.Item
                            title="Pause on TTS"
                            description="Pause auto-scroll when text-to-speech is active"
                            left={(props) => <List.Icon {...props} icon="pause" />}
                            right={() => (
                                <Switch
                                    value={readingExperience.autoScroll.pauseOnTTS}
                                    onValueChange={(pauseOnTTS) => updateAutoScroll({ pauseOnTTS })}
                                />
                            )}
                        />

                        <List.Item
                            title="Resume after TTS"
                            description="Resume auto-scroll when TTS finishes"
                            left={(props) => <List.Icon {...props} icon="play" />}
                            right={() => (
                                <Switch
                                    value={readingExperience.autoScroll.resumeAfterTTS}
                                    onValueChange={(resumeAfterTTS) => updateAutoScroll({ resumeAfterTTS })}
                                />
                            )}
                        />
                    </>
                )}
            </List.Accordion>

            <Divider />

            {/* Page Turn Animation Settings */}
            <List.Accordion
                title="Page Turn Animation"
                description={readingExperience.pageTurnAnimation.enabled 
                    ? `${readingExperience.pageTurnAnimation.type} animation` 
                    : "Disabled"}
                expanded={animationExpanded}
                onPress={() => setAnimationExpanded(!animationExpanded)}
                left={(props) => <List.Icon {...props} icon="animation" />}
            >
                <List.Item
                    title="Enable Animations"
                    description="Enable page turn animations"
                    left={(props) => <List.Icon {...props} icon="animation-play" />}
                    right={() => (
                        <Switch
                            value={readingExperience.pageTurnAnimation.enabled}
                            onValueChange={(enabled) => updatePageTurnAnimation({ enabled })}
                        />
                    )}
                />

                {readingExperience.pageTurnAnimation.enabled && (
                    <>
                        <Text variant="bodyMedium" style={styles.sectionTitle}>
                            Animation Type
                        </Text>
                        <RadioButton.Group
                            value={readingExperience.pageTurnAnimation.type}
                            onValueChange={(type) => 
                                updatePageTurnAnimation({ type: type as 'slide' | 'fade' | 'flip' | 'none' })
                            }
                        >
                            <List.Item
                                title="Slide"
                                description="Smooth sliding transition"
                                left={(props) => <List.Icon {...props} icon="arrow-right" />}
                                right={() => <RadioButton value="slide" />}
                                onPress={() => updatePageTurnAnimation({ type: 'slide' })}
                            />
                            <List.Item
                                title="Fade"
                                description="Gentle fade transition"
                                left={(props) => <List.Icon {...props} icon="blur" />}
                                right={() => <RadioButton value="fade" />}
                                onPress={() => updatePageTurnAnimation({ type: 'fade' })}
                            />
                            <List.Item
                                title="Flip"
                                description="Book-like page flip"
                                left={(props) => <List.Icon {...props} icon="flip-horizontal" />}
                                right={() => <RadioButton value="flip" />}
                                onPress={() => updatePageTurnAnimation({ type: 'flip' })}
                            />
                            <List.Item
                                title="None"
                                description="Instant transition"
                                left={(props) => <List.Icon {...props} icon="close" />}
                                right={() => <RadioButton value="none" />}
                                onPress={() => updatePageTurnAnimation({ type: 'none' })}
                            />
                        </RadioButton.Group>

                        <View style={styles.sliderContainer}>
                            <Text variant="bodyMedium" style={styles.sliderLabel}>
                                Animation Speed: {readingExperience.pageTurnAnimation.speed}ms
                            </Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={100}
                                maximumValue={1000}
                                value={readingExperience.pageTurnAnimation.speed}
                                onValueChange={(speed) => updatePageTurnAnimation({ speed: Math.round(speed) })}
                                minimumTrackTintColor={theme.colors.primary}
                                maximumTrackTintColor={theme.colors.outline}
                            />
                        </View>
                    </>
                )}
            </List.Accordion>

            <Divider />

            {/* Reading Mode Preferences */}
            <List.Accordion
                title="Reading Mode Preferences"
                description={readingExperience.readingMode.immersiveByDefault 
                    ? "Immersive by default" 
                    : "Standard mode"}
                expanded={readingModeExpanded}
                onPress={() => setReadingModeExpanded(!readingModeExpanded)}
                left={(props) => <List.Icon {...props} icon="book-open-page-variant" />}
            >
                <List.Item
                    title="Immersive mode by default"
                    description="Start reading in immersive mode"
                    left={(props) => <List.Icon {...props} icon="fullscreen" />}
                    right={() => (
                        <Switch
                            value={readingExperience.readingMode.immersiveByDefault}
                            onValueChange={(immersiveByDefault) => updateReadingMode({ immersiveByDefault })}
                        />
                    )}
                />

                <List.Item
                    title="Hide status bar"
                    description="Hide status bar in reading mode"
                    left={(props) => <List.Icon {...props} icon="eye-off" />}
                    right={() => (
                        <Switch
                            value={readingExperience.readingMode.hideStatusBar}
                            onValueChange={(hideStatusBar) => updateReadingMode({ hideStatusBar })}
                        />
                    )}
                />

                <List.Item
                    title="Auto-hide controls"
                    description="Automatically hide reading controls"
                    left={(props) => <List.Icon {...props} icon="auto-fix" />}
                    right={() => (
                        <Switch
                            value={readingExperience.readingMode.autoHideControls}
                            onValueChange={(autoHideControls) => updateReadingMode({ autoHideControls })}
                        />
                    )}
                />

                {readingExperience.readingMode.autoHideControls && (
                    <View style={styles.sliderContainer}>
                        <Text variant="bodyMedium" style={styles.sliderLabel}>
                            Auto-hide Delay: {readingExperience.readingMode.autoHideDelay} seconds
                        </Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={1}
                            maximumValue={10}
                            value={readingExperience.readingMode.autoHideDelay}
                            onValueChange={(autoHideDelay) => updateReadingMode({ autoHideDelay: Math.round(autoHideDelay) })}
                            minimumTrackTintColor={theme.colors.primary}
                            maximumTrackTintColor={theme.colors.outline}
                        />
                    </View>
                )}

                <View style={styles.sliderContainer}>
                    <Text variant="bodyMedium" style={styles.sliderLabel}>
                        Navigation Gesture Sensitivity: {readingExperience.readingMode.navigationGestureSensitivity}/10
                    </Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={10}
                        value={readingExperience.readingMode.navigationGestureSensitivity}
                        onValueChange={(navigationGestureSensitivity) => 
                            updateReadingMode({ navigationGestureSensitivity: Math.round(navigationGestureSensitivity) })
                        }
                        minimumTrackTintColor={theme.colors.primary}
                        maximumTrackTintColor={theme.colors.outline}
                    />
                    <Text variant="bodySmall" style={styles.helperText}>
                        Higher values make gestures more sensitive
                    </Text>
                </View>
            </List.Accordion>
        </View>
    );
}

const styles = StyleSheet.create({
    sliderContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderLabel: {
        marginBottom: 8,
    },
    sectionTitle: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
        fontWeight: 'bold',
    },
    helperText: {
        marginTop: 4,
        opacity: 0.7,
    },
});