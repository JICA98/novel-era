import * as React from 'react';
import { View } from 'react-native';
import { Button, Dialog, Portal, PaperProvider, Text } from 'react-native-paper';

type Props = {
  title: string;
  description?: string;
  done?: () => void;
  cancel?: () => void;
  setVisible: (visible: boolean) => void;
};

const PaperDialog = ({ setVisible, title, description, done, cancel }: Props) => {

  const hideDialog = () => setVisible(false);

  return (
    <Portal>
      <Dialog visible={true} onDismiss={hideDialog}>
        <Dialog.Title>{title}</Dialog.Title>
        {description && (
          <Dialog.Content>
            <Text variant="bodyMedium">{description}</Text>
          </Dialog.Content>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Dialog.Actions>
            <Button onPress={() => { hideDialog(); if (cancel) cancel(); }}>Cancel</Button>
            <Button onPress={() => { hideDialog(); if (done) done(); }}>Confirm</Button>
          </Dialog.Actions>
        </View>
      </Dialog>
    </Portal>
  );
};

export default PaperDialog;