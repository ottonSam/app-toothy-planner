import { TextInput, type TextInputProps } from 'react-native';

import { useThemePalette } from '@/hooks/use-theme-palette';

type AppTextInputProps = TextInputProps & {
  hasError?: boolean;
};

export function AppTextInput({ className, hasError, ...props }: AppTextInputProps) {
  const palette = useThemePalette();

  return (
    <TextInput
      className={[
        'min-h-12 rounded-md border bg-card px-3 text-base text-foreground',
        hasError ? 'border-destructive' : 'border-input',
        className ?? '',
      ].join(' ')}
      placeholderTextColor={palette.mutedForeground}
      {...props}
    />
  );
}
