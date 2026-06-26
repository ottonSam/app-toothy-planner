import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemePalette } from '@/hooks/use-theme-palette';

export type CardActionItem = {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  loadingLabel?: string;
  onPress: () => void;
  variant?: 'default' | 'destructive';
};

type CardActionsMenuProps = {
  accessibilityLabel?: string;
  actions: CardActionItem[];
};

export function CardActionsMenu({
  accessibilityLabel = 'Abrir acoes',
  actions,
}: CardActionsMenuProps) {
  const palette = useThemePalette();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {isOpen ? (
        <Pressable
          accessibilityLabel="Fechar menu de acoes"
          className="absolute inset-0 z-10"
          onPress={closeMenu}
        />
      ) : null}

      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        className="rounded-full p-2"
        onPress={() => setIsOpen((current) => !current)}>
        <Ionicons color={palette.foreground} name="ellipsis-vertical" size={20} />
      </Pressable>

      {isOpen ? (
        <View className="absolute right-4 top-12 z-20 min-w-36 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {actions.map((action, index) => (
            <View key={action.label}>
              {index > 0 ? <View className="h-px bg-border" /> : null}
              <Pressable
                accessibilityRole="button"
                className={['px-4 py-3', action.disabled ? 'opacity-50' : ''].join(' ')}
                disabled={action.disabled}
                onPress={() => {
                  closeMenu();
                  action.onPress();
                }}>
                <Text
                  className={[
                    'text-sm font-semibold',
                    action.variant === 'destructive' ? 'text-destructive' : 'text-foreground',
                  ].join(' ')}>
                  {action.loading && action.loadingLabel ? action.loadingLabel : action.label}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}
