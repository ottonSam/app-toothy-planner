import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';

import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { BottomDrawer } from '@/components/ui/bottom-drawer';
import { useThemePalette } from '@/hooks/use-theme-palette';
import {
  addDays,
  addMonths,
  formatDateBr,
  parseDateOnly,
  toDateInputValue,
} from '@/lib/date-utils';

type ControlledDateInputProps = {
  label: string;
  name: string;
};

const weekDayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function ControlledDateInput({ label, name }: ControlledDateInputProps) {
  const { control } = useFormContext();
  const [isOpen, setIsOpen] = useState(false);
  const palette = useThemePalette();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState }) => {
        const selectedDate = value ? parseDateOnly(value) : new Date();

        return (
          <Field error={fieldState.error?.message} label={label}>
            <Pressable
              accessibilityRole="button"
              className={[
                'min-h-12 flex-row items-center justify-between rounded-md border bg-card px-3',
                fieldState.error ? 'border-destructive' : 'border-input',
              ].join(' ')}
              onPress={() => setIsOpen(true)}>
              <Text
                className={value ? 'text-base text-foreground' : 'text-base text-muted-foreground'}>
                {value ? formatDateBr(value) : 'Selecionar data'}
              </Text>
              <Ionicons color={palette.mutedForeground} name="calendar-outline" size={20} />
            </Pressable>

            <DatePickerDrawer
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              onSelect={(date) => {
                onChange(toDateInputValue(date));
                setIsOpen(false);
              }}
              selectedDate={selectedDate}
            />
          </Field>
        );
      }}
    />
  );
}

function DatePickerDrawer({
  isOpen,
  onClose,
  onSelect,
  selectedDate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate: Date;
}) {
  const palette = useThemePalette();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const days = useMemo(() => {
    const firstDayOffset = visibleMonth.getDay();
    const firstGridDay = addDays(visibleMonth, -firstDayOffset);
    return Array.from({ length: 42 }, (_, index) => addDays(firstGridDay, index));
  }, [visibleMonth]);
  const weeks = useMemo(
    () => Array.from({ length: 6 }, (_, weekIndex) => days.slice(weekIndex * 7, weekIndex * 7 + 7)),
    [days]
  );

  return (
    <BottomDrawer maxHeight="85%" onClose={onClose} visible={isOpen}>
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityLabel="Mes anterior"
          accessibilityRole="button"
          className="rounded-full bg-secondary p-2"
          onPress={() => setVisibleMonth((date) => addMonths(date, -1))}>
          <Ionicons color={palette.foreground} name="chevron-back" size={20} />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground">
          {visibleMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable
          accessibilityLabel="Proximo mes"
          accessibilityRole="button"
          className="rounded-full bg-secondary p-2"
          onPress={() => setVisibleMonth((date) => addMonths(date, 1))}>
          <Ionicons color={palette.foreground} name="chevron-forward" size={20} />
        </Pressable>
      </View>

      <View className="flex-row gap-1">
        {weekDayLabels.map((day, index) => (
          <Text
            className="flex-1 text-center text-xs font-semibold text-muted-foreground"
            key={`${day}-${index}`}>
            {day}
          </Text>
        ))}
      </View>

      <View className="gap-2">
        {weeks.map((weekDays) => (
          <View className="flex-row" key={weekDays.map(toDateInputValue).join('-')}>
            {weekDays.map((day) => {
              const isSelected = toDateInputValue(day) === toDateInputValue(selectedDate);
              const isSameMonth = day.getMonth() === visibleMonth.getMonth();

              return (
                <Pressable
                  accessibilityRole="button"
                  className="flex-1 items-center"
                  key={toDateInputValue(day)}
                  onPress={() => onSelect(day)}>
                  <View
                    className={[
                      'h-9 w-9 items-center justify-center rounded-full',
                      isSelected ? 'bg-primary' : 'bg-transparent',
                    ].join(' ')}>
                    <Text
                      className={[
                        'text-sm font-semibold',
                        isSelected
                          ? 'text-white'
                          : isSameMonth
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                      ].join(' ')}>
                      {day.getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <Button variant="secondary" onPress={onClose}>
        Cancelar
      </Button>
    </BottomDrawer>
  );
}
