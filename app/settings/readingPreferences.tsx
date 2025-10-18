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
    TextDisplaySettings,
    ReadingBehaviorSettings,
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
    const [textDisplayExpanded, setTextDisplayExpanded] = useState(false);
    const [behaviorExpanded, setBehaviorExpanded] = useState(false);

    if (!userPref) {
        return null;
    }

    // Ensure all properties exist for backward compatibility
    const readingExperience = {
        ...userPref.readingExperience,
        textDisplay: userPref.readingExperience.textDisplay || {
            fontSize: 16,
            lineSpacing: 1.4,
            paragraphSpacing: 8,
            textAlignment: 'left' as const,
            marginHorizontal: 16,
            marginVertical: 16,
        },
        readingBehavior: userPref.readingExperience.readingBehavior || {
            keepScreenOn: true,
            tapToScroll: true,
            tapScrollDistance: 80,
            volumeKeysForNavigation: false,
            confirmBeforeClosing: false,
        }
    };

    const updateAutoScroll = (updates: Partial<AutoScrollSettings>, showSnackbar: boolean = true) => {
        const newReadingExperience: ReadingExperiencePreferences = {
            ...readingExperience,
            autoScroll: { ...readingExperience.autoScroll, ...updates }
        };
        setReadingExperience(newReadingExperience);
        if (showSnackbar) {
            setSnackbarText('Auto-scroll settings updated');
        }
    };

    const updatePageTurnAnimation = (updates: Partial<PageTurnAnimation>, showSnackbar: boolean = true) => {
        const newReadingExperience: ReadingExperiencePreferences = {
            ...readingExperience,
            pageTurnAnimation: { ...readingExperience.pageTurnAnimation, ...updates }
        };
        setReadingExperience(newReadingExperience);
        if (showSnackbar) {
            setSnackbarText('Page turn animation settings updated');
        }
    };

    const updateReadingMode = (updates: Partial<ReadingModePreferences>, showSnackbar: boolean = true) => {
        const newReadingExperience: ReadingExperiencePreferences = {
            ...readingExperience,
            readingMode: { ...readingExperience.readingMode, ...updates }
        };
        setReadingExperience(newReadingExperience);
        if (showSnackbar) {
            setSnackbarText('Reading mode settings updated');
        }
    };

    const updateTextDisplay = (updates: Partial<TextDisplaySettings>, showSnackbar: boolean = true) => {
        const newReadingExperience: ReadingExperiencePreferences = {
            ...readingExperience,
            textDisplay: { ...readingExperience.textDisplay, ...updates }
        };
        setReadingExperience(newReadingExperience);
        if (showSnackbar) {
            setSnackbarText('Text display settings updated');
        }
    };

    const updateReadingBehavior = (updates: Partial<ReadingBehaviorSettings>, showSnackbar: boolean = true) => {
        const newReadingExperience: ReadingExperiencePreferences = {
            ...readingExperience,
            readingBehavior: { ...readingExperience.readingBehavior, ...updates }
        };
        setReadingExperience(newReadingExperience);
        if (showSnackbar) {
            setSnackbarText('Reading behavior settings updated');
        }
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
                    <View>
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
                    </View>
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
                    <View>
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
                    </View>
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

            <Divider />

            {/* Text Display Settings */}
            <List.Accordion
                title="Text Display"
                description="Font size, spacing, and layout preferences"
                expanded={textDisplayExpanded}
                onPress={() => setTextDisplayExpanded(!textDisplayExpanded)}
                left={(props) => <List.Icon {...props} icon="format-text" />}
            >
                <View style={styles.sliderContainer}>
                    <Text variant="bodyMedium" style={styles.sliderLabel}>
                        Font Size: {readingExperience.textDisplay.fontSize}px
                    </Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={12}
                        maximumValue={32}
                        value={readingExperience.textDisplay.fontSize}
                        onValueChange={(fontSize) => updateTextDisplay({ fontSize: Math.round(fontSize) })}
                        minimumTrackTintColor={theme.colors.primary}
                        maximumTrackTintColor={theme.colors.outline}
                    />
                </View>

                <View style={styles.sliderContainer}>
                    <Text variant="bodyMedium" style={styles.sliderLabel}>
                        Line Spacing: {readingExperience.textDisplay.lineSpacing.toFixed(1)}
                    </Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={1.0}
                        maximumValue={2.5}
                        step={0.1}
                        value={readingExperience.textDisplay.lineSpacing}
                        onValueChange={(lineSpacing) => updateTextDisplay({ lineSpacing: Math.round(lineSpacing * 10) / 10 })}
                        minimumTrackTintColor={theme.colors.primary}
                        maximumTrackTintColor={theme.colors.outline}
                    />
                </View>

                <View style={styles.sliderContainer}>
                    <Text variant="bodyMedium" style={styles.sliderLabel}>
                        Paragraph Spacing: {readingExperience.textDisplay.paragraphSpacing}px
                    </Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={20}
                        value={readingExperience.textDisplay.paragraphSpacing}
                        onValueChange={(paragraphSpacing) => updateTextDisplay({ paragraphSpacing: Math.round(paragraphSpacing) })}
                        minimumTrackTintColor={theme.colors.primary}
                        maximumTrackTintColor={theme.colors.outline}
                    />
                </View>

                <Text variant="bodyMedium" style={styles.sectionTitle}>
                    Text Alignment
                </Text>
                <RadioButton.Group
                    value={readingExperience.textDisplay.textAlignment}
                    onValueChange={(alignment) => 
                        updateTextDisplay({ textAlignment: alignment as 'left' | 'center' | 'justify' })
                    }
                >
                    <List.Item
                        title="Left"
                        description="Align text to the left"
                        left={(props) => <List.Icon {...props} icon="format-align-left" />}
                        right={() => <RadioButton value="left" />}
                        onPress={() => updateTextDisplay({ textAlignment: 'left' })}
                    />
                    <List.Item
                        title="Center"
                        description="Center align text"
                        left={(props) => <List.Icon {...props} icon="format-align-center" />}
                        right={() => <RadioButton value="center" />}
                        onPress={() => updateTextDisplay({ textAlignment: 'center' })}
                    />
                    <List.Item
                        title="Justify"
                        description="Justify text for even edges"
                        left={(props) => <List.Icon {...props} icon="format-align-justify" />}
                        right={() => <RadioButton value="justify" />}
                        onPress={() => updateTextDisplay({ textAlignment: 'justify' })}
                    />
                </RadioButton.Group>

                <View style={styles.sliderContainer}>
                    <Text variant="bodyMedium" style={styles.sliderLabel}>
                        Horizontal Margins: {readingExperience.textDisplay.marginHorizontal}px
                    </Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={8}
                        maximumValue={40}
                        value={readingExperience.textDisplay.marginHorizontal}
                        onValueChange={(marginHorizontal) => updateTextDisplay({ marginHorizontal: Math.round(marginHorizontal) })}
                        minimumTrackTintColor={theme.colors.primary}
                        maximumTrackTintColor={theme.colors.outline}
                    />
                </View>

                <View style={styles.sliderContainer}>
                    <Text variant="bodyMedium" style={styles.sliderLabel}>
                        Vertical Margins: {readingExperience.textDisplay.marginVertical}px
                    </Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={8}
                        maximumValue={40}
                        value={readingExperience.textDisplay.marginVertical}
                        onValueChange={(marginVertical) => updateTextDisplay({ marginVertical: Math.round(marginVertical) })}
                        minimumTrackTintColor={theme.colors.primary}
                        maximumTrackTintColor={theme.colors.outline}
                    />
                </View>
            </List.Accordion>

            <Divider />

            {/* Reading Behavior Settings */}
            <List.Accordion
                title="Reading Behavior"
                description="Screen and interaction preferences"
                expanded={behaviorExpanded}
                onPress={() => setBehaviorExpanded(!behaviorExpanded)}
                left={(props) => <List.Icon {...props} icon="gesture-tap" />}
            >
                <List.Item
                    title="Keep screen on"
                    description="Prevent screen from turning off while reading"
                    left={(props) => <List.Icon {...props} icon="lightbulb-on" />}
                    right={() => (
                        <Switch
                            value={readingExperience.readingBehavior.keepScreenOn}
                            onValueChange={(keepScreenOn) => updateReadingBehavior({ keepScreenOn })}
                        />
                    )}
                />

                <List.Item
                    title="Tap to scroll"
                    description="Tap screen edges to scroll"
                    left={(props) => <List.Icon {...props} icon="gesture-tap" />}
                    right={() => (
                        <Switch
                            value={readingExperience.readingBehavior.tapToScroll}
                            onValueChange={(tapToScroll) => updateReadingBehavior({ tapToScroll })}
                        />
                    )}
                />

                {readingExperience.readingBehavior.tapToScroll && (
                    <View style={styles.sliderContainer}>
                        <Text variant="bodyMedium" style={styles.sliderLabel}>
                            Tap Scroll Distance: {readingExperience.readingBehavior.tapScrollDistance}%
                        </Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={20}
                            maximumValue={100}
                            value={readingExperience.readingBehavior.tapScrollDistance}
                            onValueChange={(tapScrollDistance) => updateReadingBehavior({ tapScrollDistance: Math.round(tapScrollDistance) })}
                            minimumTrackTintColor={theme.colors.primary}
                            maximumTrackTintColor={theme.colors.outline}
                        />
                        <Text variant="bodySmall" style={styles.helperText}>
                            Percentage of screen height to scroll per tap
                        </Text>
                    </View>
                )}

                <List.Item
                    title="Volume keys navigation"
                    description="Use volume keys to navigate pages"
                    left={(props) => <List.Icon {...props} icon="volume-high" />}
                    right={() => (
                        <Switch
                            value={readingExperience.readingBehavior.volumeKeysForNavigation}
                            onValueChange={(volumeKeysForNavigation) => updateReadingBehavior({ volumeKeysForNavigation })}
                        />
                    )}
                />

                <List.Item
                    title="Confirm before closing"
                    description="Ask for confirmation before closing reader"
                    left={(props) => <List.Icon {...props} icon="alert-circle" />}
                    right={() => (
                        <Switch
                            value={readingExperience.readingBehavior.confirmBeforeClosing}
                            onValueChange={(confirmBeforeClosing) => updateReadingBehavior({ confirmBeforeClosing })}
                        />
                    )}
                />
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