import React, { useState } from 'react';
import { View, StyleSheet, Text, ImageBackground, TouchableOpacity, Dimensions, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInRight, FadeOutLeft, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { userPrefStore } from './userpref';

const bgImage1 = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbckp6uD8xUgDxdy6yOk1xjbXryxZxKCjACgZlDFXMh9Wnv2NGREPDmDgf8qx2pVbZhxBFiOMnZbDefKW7j_IEFoHIQJJ4JwtFFkeE5Mei8rmrHpIsyZ4s_JbqFNG0MAnZxTwUoyqYYldE0DqjqVok-1LZL50S92NbTsN01IrE1WEzl3f4LjcTV7728eNbiydwMctnKgq3Kwp1BmaHisEDPumPBQtn8FeJVZUxAmZ-PiXvYLIu60UIbGjObaP8Bp1nmSJhnvrZYHTC';
const bgImage3 = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfkpiBxnfv8MaFDkUPpwNL6-0dmquZtC_pclV_jAy6M-H0mJPN-JvaKOadNrkO00wTtfo8MrJhJMXqvJYDGSqcvn7EwqaFI8LXqt3TcM4HEbVJd5NYvQCcgpuce-RUgzz06-J2UqSudKT4RJveeOhot0KH0YkPoAC0DkYhLQplNgpy7OpIQq8O8lolM4JFANFAOB4AIx20KDg2rekEaCMDeFz5ljNwhl9lVW8qPi9IOs5Cr4txZVrK9WtCDlbjQg6-G9qayeK2obk6';

export default function OnboardingScreen() {
    const { width, height } = useWindowDimensions();
    const isSmallDevice = width < 380;
    const isShortDevice = height < 700;
    const [step, setStep] = useState(1);
    const setHasSeenOnboarding = userPrefStore((state: any) => state.setHasSeenOnboarding);

    const finishOnboarding = () => {
        setHasSeenOnboarding(true);
        router.replace('/');
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#111319' }}>
            {step === 1 && (
                <Animated.View key="step1" style={[StyleSheet.absoluteFill, styles.container]} entering={FadeIn} exiting={FadeOutLeft.duration(300)}>
                    <ImageBackground source={{ uri: bgImage1 }} style={styles.bgImage} imageStyle={{ opacity: 0.4 }}>
                        <SafeAreaView style={styles.safeArea}>
                            <View style={styles.header}>
                                <Text style={styles.headerText}>Atelier Novels</Text>
                            </View>
                            
                            <View style={[styles.content, { paddingHorizontal: isSmallDevice ? 20 : 32, paddingBottom: isShortDevice ? 40 : 80 }]}>
                                <Text style={styles.label}>WELCOME TO THE ATELIER</Text>
                                <Text style={[styles.title, { fontSize: isSmallDevice ? 36 : 48, lineHeight: isSmallDevice ? 40 : 52 }]}>
                                    Your Digital{'\n'}
                                    <Text style={[styles.title, styles.titleItalic, { fontSize: isSmallDevice ? 36 : 48, lineHeight: isSmallDevice ? 40 : 52 }]}>Sanctuary</Text> for Stories
                                </Text>
                                <Text style={styles.subtitle}>
                                    Experience light novels like never before in a space designed for deep immersion.
                                </Text>
                                
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(2)}>
                                        <Text style={styles.primaryButtonText}>Get Started</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.secondaryButton} onPress={finishOnboarding}>
                                        <Text style={styles.secondaryButtonText}>Skip</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.featuresRow}>
                                    <View style={styles.featureItem}>
                                        <MaterialIcons name="menu-book" size={24} color="#bec4ed" />
                                        <Text style={styles.featureTitle}>Curated Collections</Text>
                                        <Text style={styles.featureSubtitle}>Hand-picked Excellence</Text>
                                    </View>
                                    <View style={styles.featureItem}>
                                        <MaterialIcons name="visibility-off" size={24} color="#bec4ed" />
                                        <Text style={styles.featureTitle}>Zero Distractions</Text>
                                        <Text style={styles.featureSubtitle}>Pure Reading Mode</Text>
                                    </View>
                                </View>
                            </View>
                        </SafeAreaView>
                    </ImageBackground>
                </Animated.View>
            )}

            {step === 2 && (
                <Animated.View key="step2" style={[StyleSheet.absoluteFill, styles.container2]} entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(300)}>
                    <SafeAreaView style={styles.safeArea}>
                        <View style={styles.header}>
                            <Text style={styles.headerText}>Atelier Novels</Text>
                        </View>
                        <View style={[styles.content2, { paddingTop: isShortDevice ? 20 : 40, paddingHorizontal: isSmallDevice ? 16 : 24 }]}>
                            <Text style={[styles.title2, { fontSize: isSmallDevice ? 32 : 40, lineHeight: isSmallDevice ? 38 : 48 }]}>
                                Read, Listen, <Text style={[styles.title2, styles.titleItalic, { fontSize: isSmallDevice ? 32 : 40, lineHeight: isSmallDevice ? 38 : 48 }]}>Immerse.</Text>
                            </Text>
                            <Text style={styles.subtitle2}>
                                Customize your experience with premium typography and human-like AI narration. Step into a world where every word resonates.
                            </Text>

                            <View style={[styles.cardContainer, { paddingHorizontal: isSmallDevice ? 8 : 0 }]}>
                                <View style={[styles.card, { padding: isSmallDevice ? 20 : 32 }]}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardChapter}>Chapter IV</Text>
                                        <Text style={styles.cardNovel}>The Midnight Library</Text>
                                    </View>
                                    <Text style={styles.cardText} numberOfLines={6}>
                                        The silence of the atelier was not empty; it was a living thing, thick with the scent of old parchment and cold jasmine tea. Elara traced the spine of the ledger...
                                    </Text>
                                    <View style={styles.playerContainer}>
                                        <MaterialIcons name="skip-previous" size={24} color="#c0c5e2" />
                                        <View style={styles.playButton}>
                                            <MaterialIcons name="play-arrow" size={24} color="#282e4f" />
                                        </View>
                                        <MaterialIcons name="skip-next" size={24} color="#c0c5e2" />
                                    </View>
                                </View>

                                <TouchableOpacity style={[styles.primaryButton, { width: '100%', marginTop: 24 }]} onPress={() => setStep(3)}>
                                    <Text style={styles.primaryButtonText}>Next</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeAreaView>
                </Animated.View>
            )}

            {step === 3 && (
                <Animated.View key="step3" style={[StyleSheet.absoluteFill, styles.container2]} entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(300)}>
                    <SafeAreaView style={styles.safeArea}>
                        <View style={styles.header}>
                            <Text style={styles.headerText}>Atelier Novels</Text>
                        </View>
                        <View style={[styles.content2, { paddingTop: isShortDevice ? 10 : 20, paddingHorizontal: isSmallDevice ? 16 : 24, paddingBottom: 40 }]}>
                            
                            <View style={[styles.cardContainer, { paddingHorizontal: isSmallDevice ? 8 : 0, gap: 24, flex: 1, justifyContent: 'center' }]}>
                                
                                <View style={[styles.card, { padding: isSmallDevice ? 20 : 24 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                                        <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(190, 196, 237, 0.2)', justifyContent: 'center', alignItems: 'center' }}>
                                            <MaterialIcons name="graphic-eq" size={24} color="#bec4ed" />
                                        </View>
                                        <View>
                                            <Text style={{ fontFamily: 'Manrope-Bold', fontSize: 14, color: '#e2e2eb' }}>Narration Style</Text>
                                            <Text style={{ fontFamily: 'Manrope-Regular', fontSize: 12, color: '#c5c6d1' }}>AI Voice: Julian (Warm)</Text>
                                        </View>
                                    </View>
                                    <View style={{ height: 6, backgroundColor: '#0c0e14', borderRadius: 999, overflow: 'hidden', marginBottom: 12 }}>
                                        <View style={{ height: '100%', width: '66%', backgroundColor: '#bec4ed', borderRadius: 999 }} />
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={{ fontFamily: 'Manrope-SemiBold', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#8f909b' }}>Emotional Resonance</Text>
                                        <Text style={{ fontFamily: 'Manrope-SemiBold', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#8f909b' }}>High</Text>
                                    </View>
                                </View>

                                <View style={[styles.card, { padding: isSmallDevice ? 20 : 24, paddingBottom: 0, overflow: 'hidden' }]}>
                                    <View style={[StyleSheet.absoluteFill, { opacity: 0.2 }]}>
                                        <ImageBackground source={{ uri: bgImage3 }} style={{ width: '100%', height: '100%' }} />
                                    </View>
                                    <View style={{ zIndex: 10, gap: 12, paddingBottom: 24 }}>
                                        <Text style={{ fontFamily: 'NotoSerif-Bold', fontSize: 18, color: '#bec4ed' }}>Atmosphere</Text>
                                        <Text style={{ fontFamily: 'Manrope-Regular', fontSize: 12, color: '#c0c5e2', lineHeight: 20 }}>Dynamic lighting adjusts to the mood of the text.</Text>
                                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#111319', borderWidth: 2, borderColor: '#bec4ed' }} />
                                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f4f1ea', borderWidth: 1, borderColor: 'rgba(69, 70, 80, 0.2)' }} />
                                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#2d1b1b', borderWidth: 1, borderColor: 'rgba(69, 70, 80, 0.2)' }} />
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity style={[styles.primaryButton, { width: '100%', marginTop: 'auto' }]} onPress={finishOnboarding}>
                                    <Text style={styles.primaryButtonText}>Begin Your Journey</Text>
                                </TouchableOpacity>
                                <Text style={{ textAlign: 'center', fontSize: 10, fontFamily: 'Manrope-SemiBold', textTransform: 'uppercase', letterSpacing: 2, color: '#8f909b', marginTop: -8 }}>
                                    7-day premium trial included
                                </Text>
                            </View>
                        </View>
                    </SafeAreaView>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111319',
    },
    container2: {
        flex: 1,
        backgroundColor: '#111319',
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    bgImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    header: {
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    headerText: {
        fontFamily: 'NotoSerif-Italic',
        fontSize: 24,
        color: '#e0e7ff', // indigo-100
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 32,
        paddingBottom: 80,
    },
    content2: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    label: {
        fontFamily: 'Manrope-SemiBold',
        fontSize: 12,
        letterSpacing: 3,
        color: '#bec4ed',
        marginBottom: 16,
    },
    title: {
        fontFamily: 'NotoSerif-Bold',
        fontSize: 48,
        lineHeight: 52,
        color: '#e2e2eb',
        textShadowColor: 'rgba(190, 196, 237, 0.3)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    titleItalic: {
        fontFamily: 'NotoSerif-Italic',
        color: '#bec4ed',
    },
    subtitle: {
        fontFamily: 'Manrope-Regular',
        fontSize: 18,
        lineHeight: 28,
        color: '#c0c5e2',
        opacity: 0.8,
        marginTop: 24,
        marginBottom: 32,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 48,
    },
    primaryButton: {
        backgroundColor: '#bec4ed',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 999,
        shadowColor: '#bec4ed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        alignItems: 'center',
    },
    primaryButtonText: {
        fontFamily: 'Manrope-Bold',
        color: '#282e4f',
        fontSize: 16,
    },
    secondaryButton: {
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(143, 144, 155, 0.3)',
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontFamily: 'Manrope-SemiBold',
        color: '#bec4ed',
        fontSize: 16,
    },
    featuresRow: {
        flexDirection: 'row',
        gap: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(143, 144, 155, 0.1)',
        paddingTop: 32,
    },
    featureItem: {
        flex: 1,
        gap: 8,
        alignItems: 'flex-start',
    },
    featureTitle: {
        fontFamily: 'NotoSerif-Regular',
        fontSize: 18,
        color: '#e2e2eb',
    },
    featureSubtitle: {
        fontFamily: 'Manrope-Regular',
        fontSize: 12,
        letterSpacing: 1,
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    title2: {
        fontFamily: 'NotoSerif-Bold',
        fontSize: 40,
        lineHeight: 48,
        color: '#e2e2eb',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle2: {
        fontFamily: 'Manrope-Regular',
        fontSize: 16,
        lineHeight: 24,
        color: '#c0c5e2',
        textAlign: 'center',
        opacity: 0.8,
        marginBottom: 40,
    },
    cardContainer: {
        width: '100%',
        maxWidth: 400,
    },
    card: {
        backgroundColor: '#1e1f26',
        borderRadius: 32,
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(143, 144, 155, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    cardHeader: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(143, 144, 155, 0.1)',
        paddingBottom: 24,
        marginBottom: 24,
    },
    cardChapter: {
        fontFamily: 'Manrope-Regular',
        fontSize: 10,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: 'rgba(190, 196, 237, 0.6)',
        marginBottom: 4,
    },
    cardNovel: {
        fontFamily: 'NotoSerif-Bold',
        fontSize: 24,
        color: '#e2e2eb',
    },
    cardText: {
        fontFamily: 'NotoSerif-Regular',
        fontSize: 18,
        lineHeight: 32,
        color: '#e2e2eb',
        opacity: 0.9,
    },
    playerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        marginTop: 32,
        backgroundColor: 'rgba(55, 57, 64, 0.6)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 999,
        alignSelf: 'center',
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#bec4ed',
        justifyContent: 'center',
        alignItems: 'center',
    },
});