import { useRef } from 'react';
import { Image, Text } from 'react-native';

import { BottomDrawer } from '@/components/ui/bottom-drawer';
import { Button } from '@/components/ui/button';

const errorAsset = require('../../assets/errorgator.png');
const successAsset = require('../../assets/sucessgator.png');

export type MutationStatus = 'error' | 'idle' | 'success';

type MutationStatusDrawerProps = {
  message: string;
  onClose: () => void;
  status: MutationStatus;
  title?: string;
};

export function MutationStatusDrawer({
  message,
  onClose,
  status,
  title,
}: MutationStatusDrawerProps) {
  const displayedFeedback = useRef<{
    message: string;
    status: Exclude<MutationStatus, 'idle'>;
    title?: string;
  }>({
    message,
    status: status === 'idle' ? 'error' : status,
    title,
  });

  if (status !== 'idle') {
    displayedFeedback.current = {
      message,
      status,
      title,
    };
  }

  const feedback = displayedFeedback.current;

  return (
    <BottomDrawer
      contentClassName="items-center gap-4"
      maxHeight="75%"
      onClose={onClose}
      visible={status !== 'idle'}>
      <Image
        className="h-28 w-28"
        resizeMode="contain"
        source={feedback.status === 'success' ? successAsset : errorAsset}
        style={{ height: 112, width: 112 }}
      />
      <Text className="text-center text-xl font-semibold text-foreground">
        {feedback.title ??
          (feedback.status === 'success' ? 'Requisicao concluida' : 'Algo deu errado')}
      </Text>
      <Text className="text-center text-sm text-muted-foreground" selectable>
        {feedback.message}
      </Text>
      <Button className="w-full" onPress={onClose}>
        Entendi
      </Button>
    </BottomDrawer>
  );
}
