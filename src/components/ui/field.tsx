import { Text, View } from 'react-native';

type FieldProps = {
  children: React.ReactNode;
  description?: string;
  error?: string;
  label: string;
};

export function Field({ children, description, error, label }: FieldProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      {children}
      {description ? <Text className="text-xs text-muted-foreground">{description}</Text> : null}
      {error ? (
        <Text className="text-sm font-semibold text-destructive" selectable>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
