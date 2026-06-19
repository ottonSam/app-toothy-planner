import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

import { useThemePalette } from '@/hooks/use-theme-palette';

type ButtonVariant = 'default' | 'destructive' | 'ghost' | 'outline' | 'secondary';
type ButtonSize = 'default' | 'sm';

type ButtonProps = PressableProps & {
  children: string;
  isLoading?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-primary border-primary',
  destructive: 'bg-destructive border-destructive',
  ghost: 'bg-transparent border-transparent',
  outline: 'bg-transparent border-border',
  secondary: 'bg-secondary border-secondary',
};

const textClasses: Record<ButtonVariant, string> = {
  default: 'text-white',
  destructive: 'text-white',
  ghost: 'text-foreground',
  outline: 'text-foreground',
  secondary: 'text-foreground',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'min-h-12 px-4',
  sm: 'min-h-10 px-3',
};

export function Button({
  children,
  className,
  disabled,
  isLoading,
  size = 'default',
  variant = 'default',
  ...props
}: ButtonProps) {
  const palette = useThemePalette();
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      className={[
        'items-center justify-center rounded-md border',
        variantClasses[variant],
        sizeClasses[size],
        isDisabled ? 'opacity-60' : 'opacity-100',
        className ?? '',
      ].join(' ')}
      disabled={isDisabled}
      {...props}>
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'default' || variant === 'destructive' ? '#fff' : palette.foreground}
        />
      ) : (
        <Text className={['text-sm font-semibold', textClasses[variant]].join(' ')}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}
