import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  InteractionManager,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BottomDrawerProps = {
  children: React.ReactNode;
  contentClassName?: string;
  maxHeight?: `${number}%` | number;
  onClose: () => void;
  onClosed?: () => void;
  visible: boolean;
};

export function BottomDrawer({
  children,
  contentClassName = 'gap-4',
  maxHeight = '90%',
  onClose,
  onClosed,
  visible,
}: BottomDrawerProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [isPresented, setIsPresented] = useState(visible);
  const animationProgress = useRef(new Animated.Value(visible ? 0 : 1)).current;
  const animationRef = useRef<ReturnType<typeof Animated.timing> | null>(null);
  const onClosedRef = useRef(onClosed);
  const isMountedRef = useRef(true);

  useEffect(() => {
    onClosedRef.current = onClosed;
  }, [onClosed]);

  const notifyClosedAfterInteractions = () => {
    requestAnimationFrame(() => {
      InteractionManager.runAfterInteractions(() => {
        if (isMountedRef.current) {
          onClosedRef.current?.();
        }
      });
    });
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      animationRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    animationRef.current?.stop();

    if (visible) {
      setIsPresented(true);
      animationProgress.setValue(1);
      animationRef.current = Animated.timing(animationProgress, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: Platform.OS !== 'web',
      });
      animationRef.current.start();
    } else {
      Keyboard.dismiss();
      if (Platform.OS === 'ios') {
        animationProgress.setValue(1);
        setIsPresented(false);
        notifyClosedAfterInteractions();
        return;
      }

      animationRef.current = Animated.timing(animationProgress, {
        duration: 180,
        easing: Easing.in(Easing.cubic),
        toValue: 1,
        useNativeDriver: Platform.OS !== 'web',
      });
      animationRef.current.start(({ finished }) => {
        if (finished && isMountedRef.current) {
          setIsPresented(false);
          notifyClosedAfterInteractions();
        }
      });
    }

    return () => {
      animationRef.current?.stop();
    };
  }, [animationProgress, visible]);

  const translateY = animationProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(height, 400)],
  });
  const resolvedMaxHeight =
    typeof maxHeight === 'number' ? maxHeight : (height * Number.parseFloat(maxHeight)) / 100;

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible={isPresented}>
      <View className="flex-1 justify-end" pointerEvents={visible ? 'box-none' : 'none'}>
        <Animated.View
          pointerEvents="box-none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'black',
              opacity: animationProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 0],
              }),
            },
          ]}>
          <Pressable
            accessibilityLabel="Fechar drawer"
            accessibilityRole="button"
            className="flex-1"
            onPress={onClose}
          />
        </Animated.View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
          pointerEvents="box-none">
          <Animated.View style={{ width: '100%', transform: [{ translateY }] }}>
            <View
              className={[
                'rounded-t-3xl border border-border bg-card px-5 pt-3',
                contentClassName,
              ].join(' ')}
              style={{
                maxHeight: resolvedMaxHeight,
                paddingBottom: Math.max(insets.bottom, 16),
              }}>
              <View className="h-1 w-12 self-center rounded-full bg-border" />
              {children}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
