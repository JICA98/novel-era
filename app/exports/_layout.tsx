import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Modal, Image, TouchableOpacity, ScrollView, Dimensions, Animated, Platform } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ExportFormat = "epub" | "pdf";

interface ExportDialogProps {
    maxChapters: number;
    visible: boolean;
    isExporting?: boolean;
    progress?: {
        completed: number;
        total: number;
    };
    onDismiss: () => void;
    onExport: (range: [number, number], format: ExportFormat, includeIllustrations?: boolean) => Promise<void> | void;
    novelTitle?: string;
    novelCover?: string;
}

const { width } = Dimensions.get("window");
const MAX_EXPORT_CHAPTERS = 50;

function FixedWindowSlider({
    styles,
    range,
    maxChapters,
    windowSize,
    disabled,
    trackColor,
    activeTrackColor,
    markerColor,
    markerBorderColor,
    onChange,
}: {
    styles: ReturnType<typeof createStyles>;
    range: [number, number];
    maxChapters: number;
    windowSize: number;
    disabled: boolean;
    trackColor: string;
    activeTrackColor: string;
    markerColor: string;
    markerBorderColor: string;
    onChange: (nextRange: [number, number]) => void;
}) {
    const sliderLength = width - 96;
    const stepWidth = maxChapters > 1 ? sliderLength / (maxChapters - 1) : 0;
    const selectedWidth = windowSize > 1 ? stepWidth * (windowSize - 1) : 0;
    const maxStart = Math.max(1, maxChapters - windowSize + 1);
    const dragStartRef = useRef(range[0]);
    const dragTouchStartXRef = useRef(0);

    const updateFromGesture = (dx: number) => {
        if (disabled || maxChapters <= windowSize || stepWidth <= 0) {
            return;
        }

        const deltaSteps = Math.round(dx / stepWidth);
        const nextStart = Math.max(1, Math.min(maxStart, dragStartRef.current + deltaSteps));
        const nextEnd = Math.min(maxChapters, nextStart + windowSize - 1);
        onChange([nextStart, nextEnd]);
    };

    const beginDrag = (pageX: number) => {
        dragStartRef.current = range[0];
        dragTouchStartXRef.current = pageX;
    };

    const moveDrag = (pageX: number) => {
        updateFromGesture(pageX - dragTouchStartXRef.current);
    };

    const leftPosition = stepWidth > 0 ? (range[0] - 1) * stepWidth : 0;
    const rightPosition = leftPosition + selectedWidth;

    return (
        <View style={[styles.fixedSliderRoot, { width: sliderLength }]}>
            <View style={[styles.fixedSliderTrack, { backgroundColor: trackColor }]} />
            <View
                style={[
                    styles.fixedSliderSelectedTrack,
                    {
                        backgroundColor: activeTrackColor,
                        left: leftPosition,
                        width: Math.max(0, rightPosition - leftPosition),
                    },
                ]}
            />
            <View
                style={[
                    styles.fixedSliderMarkerTouch,
                    { left: leftPosition - 18 },
                ]}
                onStartShouldSetResponder={() => !disabled}
                onMoveShouldSetResponder={() => !disabled}
                onResponderGrant={(event) => beginDrag(event.nativeEvent.pageX)}
                onResponderMove={(event) => moveDrag(event.nativeEvent.pageX)}
            >
                <View
                    style={[
                        styles.fixedSliderMarker,
                        {
                            backgroundColor: markerColor,
                            borderColor: markerBorderColor,
                        },
                    ]}
                />
            </View>
            <View
                style={[
                    styles.fixedSliderMarkerTouch,
                    { left: rightPosition - 18 },
                ]}
                onStartShouldSetResponder={() => !disabled}
                onMoveShouldSetResponder={() => !disabled}
                onResponderGrant={(event) => beginDrag(event.nativeEvent.pageX)}
                onResponderMove={(event) => moveDrag(event.nativeEvent.pageX)}
            >
                <View
                    style={[
                        styles.fixedSliderMarker,
                        {
                            backgroundColor: markerColor,
                            borderColor: markerBorderColor,
                        },
                    ]}
                />
            </View>
        </View>
    );
}

function ExportDialog({
    maxChapters,
    visible,
    isExporting = false,
    progress,
    onDismiss,
    onExport,
    novelTitle = "The Archive of Echoes",
    novelCover = "https://lh3.googleusercontent.com/aida-public/AB6AXuAQ-3Ok_y5NBypa-gbqGSgIulHtSsJD4Y_rYOfmAHzIvilz5ip_rKS_ECZvXfPNat00Fa7g9bofP-XkVC1yvrDHW5vrVsFXbVe_s4tQWIDxoWN5Vmo9jzX9jRMtRioGp7EM2wSqQFCyDBYwT7dpSi_UsUdlVe0NnVfRdU7-wcNuZ6EkuIXY_KZ3vC4z0JWnU3rOBIkOhlE44L_4lUrVJJYKg2HXgGSbHNorQ8lWP2mTQSzbO7LZnnhdxOVRCcKhfTudATPj3ISIDnrL"
}: ExportDialogProps): React.JSX.Element {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const insets = useSafeAreaInsets();
    const [range, setRange] = useState<[number, number]>([1, Math.max(1, maxChapters)]);
    const [format, setFormat] = useState<ExportFormat>("epub");
    const [includeIllustrations, setIncludeIllustrations] = useState(true);
    const chapterWindowSize = Math.min(MAX_EXPORT_CHAPTERS, Math.max(1, maxChapters));
    const lockedDistance = Math.max(0, chapterWindowSize - 1);

    useEffect(() => {
        setRange([1, chapterWindowSize]);
    }, [chapterWindowSize, maxChapters, visible]);

    const handleQuickSelect = (type: "all" | "recent") => {
        if (type === "all") {
            setRange([1, chapterWindowSize]);
        }
        if (type === "recent") {
            const start = Math.max(1, maxChapters - chapterWindowSize + 1);
            setRange([start, Math.max(1, maxChapters)]);
        }
    };

    const updateLockedRange = (nextValues: number[]) => {
        const nextStart = Math.max(1, Math.round(nextValues[0] ?? range[0]));
        const nextEnd = Math.max(1, Math.round(nextValues[1] ?? range[1]));

        if (maxChapters <= chapterWindowSize) {
            setRange([1, Math.max(1, maxChapters)]);
            return;
        }

        const startMoved = nextStart !== range[0];
        const endMoved = nextEnd !== range[1];

        let updatedStart = range[0];
        let updatedEnd = range[1];

        if (startMoved && !endMoved) {
            updatedStart = Math.min(nextStart, maxChapters - lockedDistance);
            updatedEnd = updatedStart + lockedDistance;
        } else if (endMoved && !startMoved) {
            updatedEnd = Math.max(nextEnd, 1 + lockedDistance);
            updatedStart = updatedEnd - lockedDistance;
        } else {
            const movedStartBy = Math.abs(nextStart - range[0]);
            const movedEndBy = Math.abs(nextEnd - range[1]);

            if (movedStartBy >= movedEndBy) {
                updatedStart = Math.min(nextStart, maxChapters - lockedDistance);
                updatedEnd = updatedStart + lockedDistance;
            } else {
                updatedEnd = Math.max(nextEnd, 1 + lockedDistance);
                updatedStart = updatedEnd - lockedDistance;
            }
        }

        updatedStart = Math.max(1, Math.min(updatedStart, maxChapters - lockedDistance));
        updatedEnd = Math.min(maxChapters, updatedStart + lockedDistance);

        setRange([updatedStart, updatedEnd]);
    };

    const handleExport = async () => {
        if (isExporting) {
            return;
        }
        await onExport(range, format, includeIllustrations);
    };

    const hasMultipleChapters = maxChapters > 1;

    // Toggle switch animation
    const switchAnim = useMemo(() => new Animated.Value(includeIllustrations ? 1 : 0), []);
    useEffect(() => {
        Animated.timing(switchAnim, {
            toValue: includeIllustrations ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [includeIllustrations]);

    const switchTranslateX = switchAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 26]
    });
    
    const renderProgress = () => {
        if (!isExporting || !progress) {
            return null;
        }

        const fraction = progress.total > 0 ? progress.completed / progress.total : 0;
        return (
            <View style={styles.progressWrapper}>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${fraction * 100}%` }]} />
                </View>
                <Text style={styles.progressLabel}>
                    Exporting {progress.completed} / {progress.total} chapters…
                </Text>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onDismiss}>
            <View style={styles.container}>
                {/* Close Button Only */}
                <View style={[styles.header, { paddingTop: insets.top || 16 }]}>
                    <TouchableOpacity onPress={onDismiss} disabled={isExporting} style={styles.iconButton}>
                        <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollArea} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}>
                    {/* Hero Section */}
                    <View style={styles.heroSection}>
                        <View style={styles.coverWrapper}>
                            <View style={styles.coverGlow} />
                            <Image source={{ uri: novelCover }} style={styles.coverImage} />
                        </View>
                        <Text style={styles.novelTitle} numberOfLines={2} adjustsFontSizeToFit>{novelTitle}</Text>
                        <Text style={styles.novelSubtitle}>Digital Collection Export</Text>
                    </View>

                    {/* Configuration Grid */}
                    <View style={styles.grid}>
                        
                        {/* Range Selection Area */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={styles.overline}>Range Selection</Text>
                                    <Text style={styles.cardTitle}>Chapter Span</Text>
                                </View>
                                <View style={styles.quickActions}>
                                    <TouchableOpacity 
                                        style={styles.chipAll} 
                                        onPress={() => handleQuickSelect("all")} 
                                        disabled={isExporting}
                                    >
                                        <Text style={styles.chipAllText}>{maxChapters > 50 ? "First 50" : "Everything"}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={styles.chipRecent} 
                                        onPress={() => handleQuickSelect("recent")} 
                                        disabled={isExporting || maxChapters <= 1}
                                    >
                                        <Text style={styles.chipRecentText}>Latest 50</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.sliderContainer}>
                                {hasMultipleChapters ? (
                                    <FixedWindowSlider
                                        styles={styles}
                                        range={range}
                                        maxChapters={Math.max(1, maxChapters)}
                                        windowSize={chapterWindowSize}
                                        disabled={isExporting}
                                        trackColor={theme.colors.surfaceVariant}
                                        activeTrackColor={theme.colors.primary}
                                        markerColor={theme.colors.primary}
                                        markerBorderColor={theme.colors.surface}
                                        onChange={updateLockedRange}
                                    />
                                ) : (
                                    <Text style={styles.singleChapterText}>Only one chapter is available to export.</Text>
                                )}
                            </View>

                            <View style={styles.rangeDisplay}>
                                <View style={styles.rangeDisplayColumn}>
                                    <Text style={styles.rangeDisplayLabel}>From</Text>
                                    <Text style={styles.rangeDisplayText}>Chapter {range[0]}</Text>
                                </View>
                                <View style={styles.rangeDisplayDivider} />
                                <View style={styles.rangeDisplayColumn}>
                                    <Text style={styles.rangeDisplayLabel}>To</Text>
                                    <Text style={styles.rangeDisplayText}>Chapter {range[1]}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Format Selection */}
                        <View style={styles.card}>
                            <Text style={[styles.overline, { marginBottom: 16 }]}>Export Format</Text>
                            <View style={styles.formatRow}>
                                {/* EPUB */}
                                <TouchableOpacity 
                                    style={[styles.formatCard, format === "epub" && styles.formatCardSelected]} 
                                    onPress={() => setFormat("epub")}
                                    disabled={isExporting}
                                    activeOpacity={0.8}
                                >
                                    {format === "epub" && (
                                        <View style={styles.checkBadge}>
                                            <MaterialIcons name="check" size={12} color={theme.colors.onPrimary} />
                                        </View>
                                    )}
                                    <MaterialIcons name="menu-book" size={36} color={format === "epub" ? theme.colors.primary : theme.colors.onSurfaceVariant} style={styles.formatIcon} />
                                    <Text style={styles.formatTitle}>EPUB</Text>
                                    <Text style={styles.formatSubtitle}>E-Reader optimized</Text>
                                </TouchableOpacity>

                                {/* PDF */}
                                <TouchableOpacity 
                                    style={[styles.formatCard, format === "pdf" && styles.formatCardSelected]} 
                                    onPress={() => setFormat("pdf")}
                                    disabled={isExporting}
                                    activeOpacity={0.8}
                                >
                                    {format === "pdf" && (
                                        <View style={styles.checkBadge}>
                                            <MaterialIcons name="check" size={12} color={theme.colors.onPrimary} />
                                        </View>
                                    )}
                                    <MaterialIcons name="picture-as-pdf" size={36} color={format === "pdf" ? theme.colors.primary : theme.colors.onSurfaceVariant} style={styles.formatIcon} />
                                    <Text style={styles.formatTitle}>PDF</Text>
                                    <Text style={styles.formatSubtitle}>Fixed layout</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Additional Options */}
                        <View style={[styles.card, styles.optionCard]}>
                            <View style={styles.optionTextContainer}>
                                <Text style={styles.optionTitle}>Include Illustrations</Text>
                                <Text style={styles.optionSubtitle}>Export embedded light novel artwork</Text>
                            </View>
                            <TouchableOpacity 
                                activeOpacity={0.8} 
                                disabled={isExporting}
                                onPress={() => setIncludeIllustrations(!includeIllustrations)}
                                style={[styles.switchContainer, includeIllustrations ? styles.switchOn : styles.switchOff]}
                            >
                                <Animated.View style={[styles.switchThumb, { transform: [{ translateX: switchTranslateX }] }]} />
                            </TouchableOpacity>
                        </View>

                        {/* Primary CTA */}
                        {isExporting ? (
                            renderProgress()
                        ) : (
                            <TouchableOpacity 
                                activeOpacity={0.9} 
                                onPress={handleExport} 
                                disabled={isExporting}
                            >
                                <LinearGradient 
                                    colors={[theme.colors.primary, theme.colors.primary]} 
                                    start={{ x: 0, y: 0 }} 
                                    end={{ x: 1, y: 1 }} 
                                    style={styles.exportBtn}
                                >
                                    <MaterialIcons name="file-download" size={24} color={theme.colors.onPrimary} />
                                    <Text style={[styles.exportBtnText, { color: theme.colors.onPrimary }]}>Generate Export</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingHorizontal: 24,
        paddingBottom: 16,
        zIndex: 50,
    },
    iconButton: {
        padding: 4,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 32,
    },
    heroSection: {
        alignItems: "center",
        marginBottom: 40,
    },
    coverWrapper: {
        marginBottom: 24,
        position: "relative",
    },
    coverGlow: {
        position: "absolute",
        top: -16,
        left: -16,
        right: -16,
        bottom: -16,
        backgroundColor: theme.colors.primaryContainer,
        opacity: 0.5,
        borderRadius: 9999,
    },
    coverImage: {
        width: 128,
        height: 192,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    novelTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: theme.colors.onBackground,
        marginBottom: 8,
        textAlign: "center",
    },
    novelSubtitle: {
        fontSize: 16,
        fontWeight: "500",
        color: theme.colors.onSurfaceVariant,
        textAlign: "center",
    },
    grid: {
        gap: 24,
    },
    card: {
        backgroundColor: theme.colors.elevation?.level2 || theme.colors.surfaceVariant,
        borderRadius: 24,
        padding: 24,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: 16,
    },
    overline: {
        fontSize: 10,
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: 1.5,
        color: theme.colors.onSurfaceVariant,
        marginBottom: 4,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: theme.colors.onSurface,
    },
    quickActions: {
        flexDirection: "row",
        gap: 8,
    },
    chipAll: {
        backgroundColor: theme.colors.primaryContainer,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    chipAllText: {
        fontSize: 12,
        fontWeight: "bold",
        color: theme.colors.onPrimaryContainer,
    },
    chipRecent: {
        backgroundColor: theme.colors.surfaceVariant,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    chipRecentText: {
        fontSize: 12,
        fontWeight: "bold",
        color: theme.colors.onSurfaceVariant,
    },
    sliderContainer: {
        alignItems: "center",
        paddingVertical: 16,
    },
    fixedSliderRoot: {
        height: 40,
        justifyContent: "center",
    },
    fixedSliderTrack: {
        position: "absolute",
        left: 0,
        right: 0,
        height: 6,
        borderRadius: 3,
    },
    fixedSliderSelectedTrack: {
        position: "absolute",
        height: 6,
        borderRadius: 3,
    },
    fixedSliderMarkerTouch: {
        position: "absolute",
        top: 0,
        width: 36,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    fixedSliderMarker: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    singleChapterText: {
        color: theme.colors.onSurfaceVariant,
        fontStyle: "italic",
        textAlign: "center",
        marginVertical: 16,
    },
    rangeDisplay: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: theme.colors.surfaceVariant,
        opacity: 0.8,
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    rangeDisplayColumn: {
        flex: 1,
        alignItems: "center",
    },
    rangeDisplayLabel: {
        fontSize: 10,
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: -0.5,
        color: theme.colors.onSurfaceVariant,
    },
    rangeDisplayText: {
        fontSize: 16,
        fontWeight: "bold",
        color: theme.colors.onSurface,
    },
    rangeDisplayDivider: {
        width: 1,
        height: 32,
        backgroundColor: theme.colors.outlineVariant,
    },
    formatRow: {
        flexDirection: "row",
        gap: 16,
    },
    formatCard: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "transparent",
        position: "relative",
    },
    formatCardSelected: {
        borderColor: theme.colors.primary,
    },
    checkBadge: {
        position: "absolute",
        top: 12,
        right: 12,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    formatIcon: {
        marginBottom: 8,
    },
    formatTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: theme.colors.onSurface,
    },
    formatSubtitle: {
        fontSize: 10,
        textTransform: "uppercase",
        color: theme.colors.onSurfaceVariant,
        marginTop: 4,
    },
    optionCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    optionTextContainer: {
        flex: 1,
        paddingRight: 16,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: theme.colors.onSurface,
    },
    optionSubtitle: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
        marginTop: 4,
    },
    switchContainer: {
        width: 48,
        height: 24,
        borderRadius: 12,
        justifyContent: "center",
    },
    switchOn: {
        backgroundColor: theme.colors.primary,
    },
    switchOff: {
        backgroundColor: theme.colors.surfaceVariant,
    },
    switchThumb: {
        width: 20,
        height: 20,
        backgroundColor: theme.colors.surface,
        borderRadius: 10,
    },
    exportBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 20,
        borderRadius: 9999,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
        gap: 12,
    },
    exportBtnText: {
        fontSize: 14,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 2,
    },
    progressWrapper: {
        backgroundColor: theme.colors.elevation?.level2 || theme.colors.surfaceVariant,
        padding: 24,
        borderRadius: 24,
        alignItems: "center",
        gap: 12,
    },
    progressBarBg: {
        width: "100%",
        height: 8,
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: 4,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: theme.colors.primary,
        borderRadius: 4,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: "bold",
        color: theme.colors.onSurface,
    }
});

export default ExportDialog;
