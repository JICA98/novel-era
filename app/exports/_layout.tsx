import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog, Portal, Button, Text, RadioButton } from 'react-native-paper';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

function ExportDialog({
    maxChapters = 1,
    visible = false,
    onDismiss = () => { },
    onExport = (_: any[], __: string) => { }
}): React.JSX.Element {
    const [range, setRange] = useState([1, maxChapters]);
    const [format, setFormat] = useState('epub');

    const handleExport = () => {
        onExport(range, format);
        onDismiss();
    };

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onDismiss}>
                <Dialog.Title>Export Chapters</Dialog.Title>
                <Dialog.Content>
                    <Text>Select chapters to export:</Text>
                    <MultiSlider
                        values={range}
                        min={1}
                        max={maxChapters}
                        onValuesChange={setRange}
                        step={1}
                        allowOverlap={false}
                        snapped />
                    <View style={styles.sliderLabels}>
                        <Text>Chapter {range[0]}</Text>
                        <Text>Chapter {range[1]}</Text>
                    </View>
                    <Text>Select format:</Text>
                    <RadioButton.Group onValueChange={setFormat} value={format}>
                        <RadioButton.Item label="EPUB" value="epub" />
                        <RadioButton.Item label="PDF" value="pdf" />
                    </RadioButton.Group>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={onDismiss}>Cancel</Button>
                    <Button onPress={handleExport}>Export</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}

const styles = StyleSheet.create({
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
});

export default ExportDialog;