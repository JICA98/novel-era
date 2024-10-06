import React from 'react';
import { Dialog, Portal, Button } from 'react-native-paper';

export default function Modal({ title, onResult, content, visible }: {
    title?: string, onResult: (value: boolean) => void,
    content?: React.ReactNode, visible: boolean,
}) {
    title = title || 'Do you want to continue?';
    return (
        <Portal>
            <Dialog visible={visible} onDismiss={() => hideModal(false)}>
                <Dialog.Title>{title}</Dialog.Title>
                {content && <Dialog.Content>{content}</Dialog.Content>}
                <Dialog.Actions>
                    <Button onPress={() => hideModal(false)}>No</Button>
                    <Button onPress={() => hideModal(true)}>Yes</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );

    function hideModal(result: boolean) {
        onResult(result);
    }
}