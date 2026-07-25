import { useRef, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Modal, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemePalette } from '@/hooks/use-theme-palette';
import { useThemeVariables } from '@/hooks/use-theme-variables';

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

const menuWidth = 160;
const menuItemHeight = 45;
const screenMargin = 8;
const triggerGap = 4;

export function CardActionsMenu({
  accessibilityLabel = 'Abrir acoes',
  actions,
}: CardActionsMenuProps) {
  const palette = useThemePalette();
  const themeVariables = useThemeVariables();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: screenMargin, top: screenMargin });
  const triggerRef = useRef<View>(null);
  const windowDimensions = useWindowDimensions();

  const closeMenu = () => setIsOpen(false);
  const colorFromRgb = (rgb: string) => `rgb(${rgb.split(' ').join(', ')})`;

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      const menuHeight = actions.length * menuItemHeight;
      const left = Math.min(
        Math.max(screenMargin, x + width - menuWidth),
        windowDimensions.width - menuWidth - screenMargin
      );
      const top = Math.max(
        screenMargin,
        Math.min(y + height + triggerGap, windowDimensions.height - menuHeight - screenMargin)
      );

      setMenuPosition({ left, top });
      setIsOpen(true);
    });
  };

  const handleToggle = (event: GestureResponderEvent) => {
    event.stopPropagation();
    if (isOpen) {
      closeMenu();
      return;
    }

    openMenu();
  };

  const handleActionPress = (event: GestureResponderEvent, action: CardActionItem) => {
    event.stopPropagation();
    closeMenu();
    action.onPress();
  };

  return (
    <>
      <Pressable
        ref={triggerRef}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        className="rounded-full p-2"
        onPress={handleToggle}
        style={{ zIndex: 1 }}>
        <Ionicons color={palette.foreground} name="ellipsis-vertical" size={20} />
      </Pressable>

      <Modal transparent visible={isOpen} animationType="none" onRequestClose={closeMenu}>
        <View className="flex-1" style={themeVariables}>
          <Pressable
            accessibilityLabel="Fechar menu de acoes"
            className="absolute inset-0"
            onPress={closeMenu}
          />
          <View
            className="absolute overflow-hidden rounded-xl border"
            style={[
              {
                backgroundColor: colorFromRgb(palette.cardRgb),
                borderColor: colorFromRgb(palette.borderRgb),
                left: menuPosition.left,
                opacity: 1,
                top: menuPosition.top,
                width: menuWidth,
                zIndex: 9999,
              },
              Platform.select({
                web: {
                  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.18)',
                },
                default: {
                  elevation: 24,
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
                    ].join(' ')}
                    style={{
                      color:
                        action.variant === 'destructive'
                          ? colorFromRgb(palette.destructiveRgb)
                          : palette.foreground,
                    }}>
                    {action.loading && action.loadingLabel ? action.loadingLabel : action.label}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}
