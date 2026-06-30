import { useState } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Platform, Pressable, Text, View } from 'react-native';
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
  const colorFromRgb = (rgb: string) => `rgb(${rgb.split(' ').join(', ')})`;

  const handleToggle = (event: GestureResponderEvent) => {
    event.stopPropagation();
    setIsOpen((current) => !current);
  };

  const handleActionPress = (event: GestureResponderEvent, action: CardActionItem) => {
    event.stopPropagation();
    closeMenu();
    action.onPress();
  };

  return (
    <>
      {isOpen ? (
        <Pressable
          accessibilityLabel="Fechar menu de acoes"
          className="absolute inset-0"
          onPress={closeMenu}
          style={{ zIndex: 20 }}
        />
      ) : null}

      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        className="rounded-full p-2"
        onPress={handleToggle}
        style={{ zIndex: 30 }}>
        <Ionicons color={palette.foreground} name="ellipsis-vertical" size={20} />
      </Pressable>

      {isOpen ? (
        <View
          className="absolute right-4 top-12 min-w-36 overflow-hidden rounded-xl border"
          style={[
            {
              backgroundColor: colorFromRgb(palette.cardRgb),
              borderColor: colorFromRgb(palette.borderRgb),
              opacity: 1,
              zIndex: 40,
            },
            Platform.select({
              web: {
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.18)',
              },
              default: {
                elevation: 8,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.18,
                shadowRadius: 18,
              },
            }),
          ]}>
          {actions.map((action, index) => (
            <View key={action.label}>
              {index > 0 ? (
                <View
                  className="h-px"
                  style={{ backgroundColor: colorFromRgb(palette.borderRgb) }}
                />
              ) : null}
              <Pressable
                accessibilityRole="button"
                className={['px-4 py-3', action.disabled ? 'opacity-50' : ''].join(' ')}
                disabled={action.disabled}
                onPress={(event) => handleActionPress(event, action)}>
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
