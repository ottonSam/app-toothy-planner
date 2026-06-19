import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFormContext } from 'react-hook-form';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { listFoods } from '@/api/diet';
import { Field } from '@/components/ui/field';
import { AppTextInput } from '@/components/ui/text-input';
import { useThemePalette } from '@/hooks/use-theme-palette';
import { queryKeys } from '@/lib/query-keys';

type ControlledFoodAutocompleteProps = {
  label: string;
  name: string;
};

export function ControlledFoodAutocomplete({ label, name }: ControlledFoodAutocompleteProps) {
  const { control } = useFormContext();
  const palette = useThemePalette();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onBlur, onChange, value }, fieldState }) => (
        <FoodAutocompleteField
          error={fieldState.error?.message}
          isOpen={isOpen}
          label={label}
          onBlur={onBlur}
          onChange={(nextValue) => {
            onChange(nextValue);
            setIsOpen(true);
          }}
          onClose={() => setIsOpen(false)}
          onFocus={() => setIsOpen(true)}
          palette={palette}
          value={value ?? ''}
        />
      )}
    />
  );
}

function FoodAutocompleteField({
  error,
  isOpen,
  label,
  onBlur,
  onChange,
  onClose,
  onFocus,
  palette,
  value,
}: {
  error?: string;
  isOpen: boolean;
  label: string;
  onBlur: () => void;
  onChange: (value: string) => void;
  onClose: () => void;
  onFocus: () => void;
  palette: ReturnType<typeof useThemePalette>;
  value: string;
}) {
  const deferredSearch = useDeferredValue(value.trim());
  const canSearch = deferredSearch.length >= 2;
  const foodsQuery = useQuery({
    enabled: isOpen && canSearch,
    queryKey: queryKeys.dietFoods(deferredSearch),
    queryFn: () => listFoods(deferredSearch),
  });

  return (
    <Field
      description="Selecione uma sugestao ou mantenha um nome novo digitado."
      error={error}
      label={label}>
      <AppTextInput
        autoCapitalize="words"
        hasError={Boolean(error)}
        onBlur={onBlur}
        onChangeText={onChange}
        onFocus={onFocus}
        placeholder="Ex: Maca, arroz, pao frances"
        value={value}
      />

      {isOpen && canSearch ? (
        <View className="overflow-hidden rounded-md border border-border bg-card">
          {foodsQuery.isLoading ? (
            <View className="flex-row items-center gap-2 p-3">
              <ActivityIndicator color={palette.primary} size="small" />
              <Text className="text-sm text-muted-foreground">Buscando alimentos...</Text>
            </View>
          ) : null}

          {foodsQuery.isError ? (
            <Text className="p-3 text-sm text-destructive">
              Nao foi possivel buscar alimentos. O nome digitado ainda pode ser usado.
            </Text>
          ) : null}

          {foodsQuery.isSuccess && !foodsQuery.data.length ? (
            <Text className="p-3 text-sm text-muted-foreground">
              Alimento novo. Os dados nutricionais serao consultados ao salvar.
            </Text>
          ) : null}

          {foodsQuery.data?.slice(0, 6).map((food) => (
            <Pressable
              accessibilityRole="button"
              className="border-b border-border px-3 py-3 last:border-b-0"
              key={food.id}
              onPress={() => {
                onChange(food.name);
                onClose();
              }}>
              <Text className="text-sm font-semibold text-foreground">{food.name}</Text>
              <Text className="text-xs text-muted-foreground">{food.portionDescription}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Field>
  );
}
