import { useState } from 'react';
import type { ReactNode } from 'react';
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
  renderOption?: (option: SelectOption, state: { selected: boolean }) => ReactNode;
  renderValue?: (option: SelectOption) => ReactNode;
};

export function ControlledSelect({
  label,
  name,
  options,
  placeholder = 'Selecione',
  renderOption,
  renderValue,
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
              {selected ? (
                (renderValue?.(selected) ?? (
                  <Text className="text-base text-foreground">{selected.label}</Text>
                ))
              ) : (
                <Text className="text-base text-muted-foreground">{placeholder}</Text>
              )}
            </Pressable>

            <BottomDrawer maxHeight="70%" onClose={() => setIsOpen(false)} visible={isOpen}>
              <Text className="text-lg font-semibold text-foreground">{label}</Text>
              <ScrollView contentContainerClassName="gap-2">
                {options.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      className={[
                        'rounded-lg border px-4 py-3',
                        isSelected ? 'border-primary bg-accent' : 'border-border bg-card',
                      ].join(' ')}
                      key={option.value}
                      onPress={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}>
                      {renderOption?.(option, { selected: isSelected }) ?? (
                        <Text className="text-base font-semibold text-foreground">
                          {option.label}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </BottomDrawer>
          </Field>
        );
      }}
    />
  );
}
