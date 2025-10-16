import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import {
    Dialog,
    Portal,
    Button,
    Text,
    RadioButton,
    HelperText,
    ProgressBar,
} from "react-native-paper";
import MultiSlider from "@ptomasroos/react-native-multi-slider";

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
    onExport: (range: [number, number], format: ExportFormat) => Promise<void> | void;
}

function ExportDialog({
    maxChapters,
    visible,
    isExporting = false,
    progress,
    onDismiss,
    onExport,
}: ExportDialogProps): React.JSX.Element {
    const [range, setRange] = useState<[number, number]>([1, Math.max(1, maxChapters)]);
    const [format, setFormat] = useState<ExportFormat>("epub");

    useEffect(() => {
        setRange([1, Math.max(1, maxChapters)]);
    }, [maxChapters, visible]);

    const totalSelected = useMemo(() => range[1] - range[0] + 1, [range]);
    const hasMultipleChapters = maxChapters > 1;

    const handleQuickSelect = (type: "all" | "recent") => {
        if (type === "all") {
            setRange([1, Math.max(1, maxChapters)]);
        }
        if (type === "recent") {
            const windowSize = Math.min(50, Math.max(1, maxChapters));
            const start = Math.max(1, maxChapters - windowSize + 1);
            setRange([start, Math.max(1, maxChapters)]);
        }
    };

    const handleExport = async () => {
        if (isExporting) {
            return;
        }
        await onExport(range, format);
    };

    const renderProgress = () => {
        if (!isExporting || !progress) {
            return null;
        }

        const fraction = progress.total > 0 ? progress.completed / progress.total : 0;
        return (
            <View style={styles.progressWrapper}>
                <ProgressBar progress={fraction} style={styles.progressBar} />
                <Text style={styles.progressLabel}>
                    Exporting {progress.completed} / {progress.total} chapters…
                </Text>
            </View>
        );
    };

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={isExporting ? undefined : onDismiss} dismissable={!isExporting}>
                <Dialog.Title>Export Chapters</Dialog.Title>
                <Dialog.Content>
                    <View style={styles.section}>
                        <Text variant="titleSmall">Chapter range</Text>
                        {hasMultipleChapters ? (
                            <>
                                <MultiSlider
                                    values={range}
                                    min={1}
                                    max={Math.max(1, maxChapters)}
                                    onValuesChange={(value) => setRange([value[0], value[1]])}
                                    step={1}
                                    allowOverlap={false}
                                    enabledOne={!isExporting}
                                    enabledTwo={!isExporting}
                                    snapped
                                />
                                <View style={styles.sliderLabels}>
                                    <Text>Chapter {range[0]}</Text>
                                    <Text>Chapter {range[1]}</Text>
                                </View>
                                <HelperText type="info" visible>
                                    Exporting {totalSelected} chapter{totalSelected === 1 ? "" : "s"}.
                                </HelperText>
                                <View style={styles.quickActions}>
                                    <Button
                                        mode="outlined"
                                        compact
                                        onPress={() => handleQuickSelect("all")}
                                        disabled={isExporting}
                                    >
                                        Everything
                                    </Button>
                                    <Button
                                        mode="outlined"
                                        compact
                                        onPress={() => handleQuickSelect("recent")}
                                        disabled={isExporting || maxChapters <= 1}
                                    >
                                        Latest 50
                                    </Button>
                                </View>
                            </>
                        ) : (
                            <HelperText type="info" visible>
                                Only one chapter is available to export.
                            </HelperText>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text variant="titleSmall">Format</Text>
                        <RadioButton.Group onValueChange={(value) => setFormat(value as ExportFormat)} value={format}>
                            <RadioButton.Item label="EPUB" value="epub" disabled={isExporting} />
                            <RadioButton.Item label="PDF" value="pdf" disabled={isExporting} />
                        </RadioButton.Group>
                    </View>

                    {renderProgress()}
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={onDismiss} disabled={isExporting}>
                        Cancel
                    </Button>
                    <Button mode="contained" onPress={handleExport} disabled={isExporting} loading={isExporting}>
                        {isExporting ? "Exporting…" : "Export"}
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 16,
    },
    sliderLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
    },
    quickActions: {
        flexDirection: "row",
        justifyContent: "flex-start",
        gap: 8,
        marginTop: 12,
    },
    progressWrapper: {
        marginTop: 12,
        gap: 8,
    },
    progressBar: {
        height: 6,
        borderRadius: 4,
    },
    progressLabel: {
        textAlign: "center",
    },
});

export default ExportDialog;