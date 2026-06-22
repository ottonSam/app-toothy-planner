import { useRef } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BottomDrawer } from '@/components/ui/bottom-drawer';
import { Button } from '@/components/ui/button';

type ActionConfirmationDrawerProps = {
  confirmLabel: string;
  description: string;
  itemName?: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
};

export function ActionConfirmationDrawer({
  confirmLabel,
  description,
  itemName,
  onCancel,
  onConfirm,
  title,
  visible,
}: ActionConfirmationDrawerProps) {
  const shouldConfirm = useRef(false);
  const confirmedAction = useRef<(() => void) | null>(null);

  const closeAsCancellation = () => {
    shouldConfirm.current = false;
    confirmedAction.current = null;
    onCancel();
  };

  const closeAsConfirmation = () => {
    shouldConfirm.current = true;
    confirmedAction.current = onConfirm;
    onCancel();
  };

  const handleClosed = () => {
    if (!shouldConfirm.current) {
      return;
    }

    shouldConfirm.current = false;
    confirmedAction.current?.();
    confirmedAction.current = null;
  };

  return (
    <BottomDrawer
      contentClassName="gap-5"
      maxHeight="60%"
      onClose={closeAsCancellation}
      onClosed={handleClosed}
      visible={visible}>
      <View className="items-center gap-3">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-success/15">
          <Ionicons color="#4f7d3a" name="checkmark-circle" size={32} />
        </View>
        <View className="gap-2">
          <Text className="text-center text-xl font-semibold text-foreground">{title}</Text>
          {itemName ? (
            <Text className="text-center text-base font-semibold text-foreground">{itemName}</Text>
          ) : null}
          <Text className="text-center text-sm text-muted-foreground">{description}</Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <Button className="flex-1" variant="secondary" onPress={closeAsCancellation}>
          Cancelar
        </Button>
        <Button className="flex-1" onPress={closeAsConfirmation}>
          {confirmLabel}
        </Button>
      </View>
    </BottomDrawer>
  );
}
