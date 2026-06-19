import { useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';

import { Field } from '@/components/ui/field';
import { BottomDrawer } from '@/components/ui/bottom-drawer';

type SelectOption = {
  label: string;
  value: string;
};

type ControlledSelectProps = {
  label: string;
  name: string;
  options: SelectOption[];
  placeholder?: string;
};

export function ControlledSelect({
  label,
  name,
  options,
  placeholder = 'Selecione',
}: ControlledSelectProps) {
  const { control } = useFormContext();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState }) => {
        const selected = options.find((option) => option.value === value);

        return (
          <Field error={fieldState.error?.message} label={label}>
            <Pressable
              accessibilityRole="button"
              className={[
                'min-h-12 justify-center rounded-md border bg-card px-3',
                fieldState.error ? 'border-destructive' : 'border-input',
              ].join(' ')}
              onPress={() => setIsOpen(true)}>
              <Text
                className={
                  selected ? 'text-base text-foreground' : 'text-base text-muted-foreground'
                }>
                {selected?.label ?? placeholder}
              </Text>
            </Pressable>

            <BottomDrawer maxHeight="70%" onClose={() => setIsOpen(false)} visible={isOpen}>
              <Text className="text-lg font-semibold text-foreground">{label}</Text>
              <ScrollView contentContainerClassName="gap-2">
                {options.map((option) => (
                  <Pressable
                    accessibilityRole="button"
                    className={[
                      'rounded-lg border px-4 py-3',
                      option.value === value ? 'border-primary bg-accent' : 'border-border bg-card',
                    ].join(' ')}
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}>
                    <Text className="text-base font-semibold text-foreground">{option.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </BottomDrawer>
          </Field>
        );
      }}
    />
  );
}
