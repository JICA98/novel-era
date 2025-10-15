import * as React from 'react';
import { View } from 'react-native';
import { Button, Dialog, Portal, PaperProvider, Text } from 'react-native-paper';

type Props = {
  title: string;
  description?: string;
  details?: React.ReactNode;
  done?: () => void;
  cancel?: () => void;
  setVisible: (visible: boolean) => void;
};

const PaperDialog = ({ setVisible, title, description, details, done, cancel }: Props) => {

  const hideDialog = () => setVisible(false);

  return (
    <Portal>
      <Dialog visible={true} onDismiss={hideDialog}>
        <Dialog.Title>{title}</Dialog.Title>
        {(description || details) && (
          <Dialog.Content>
            {description && <Text variant="bodyMedium">{description}</Text>}
            {details}
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