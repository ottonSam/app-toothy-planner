import type { Ref } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenScrollViewProps = ScrollViewProps & {
  children: React.ReactNode;
  contentClassName?: string;
  horizontalPadding?: number;
  viewRef?: Ref<ScrollView>;
};

export function ScreenScrollView({
  children,
  contentClassName = 'gap-6',
  contentContainerStyle,
  horizontalPadding = 16,
  viewRef,
  ...props
}: ScreenScrollViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      ref={viewRef}
      contentContainerStyle={[
        {
          paddingBottom: Math.max(insets.bottom, 16) + 24,
          paddingLeft: horizontalPadding,
          paddingRight: horizontalPadding,
          paddingTop: Math.max(insets.top, 24) + 24,
        },
        contentContainerStyle,
      ]}
      contentContainerClassName={contentClassName}
      {...props}>
      {children}
    </ScrollView>
  );
}
