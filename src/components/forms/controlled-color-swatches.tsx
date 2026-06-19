import { Controller, useFormContext } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Field } from '@/components/ui/field';

const colors = [
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#0EA5E9',
  '#6366F1',
  '#A855F7',
  '#EC4899',
  '#EF4444',
];

type ControlledColorSwatchesProps = {
  label: string;
  name: string;
};

export function ControlledColorSwatches({ label, name }: ControlledColorSwatchesProps) {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState }) => (
        <Field error={fieldState.error?.message} label={label}>
          <View className="flex-row flex-wrap gap-3">
            {colors.map((color) => {
              const selected = value === color;

              return (
                <Pressable
                  accessibilityLabel={`Selecionar cor ${color}`}
                  accessibilityRole="button"
                  className={[
                    'h-11 w-11 items-center justify-center rounded-full border-2',
                    selected ? 'border-foreground' : 'border-transparent',
                  ].join(' ')}
                  key={color}
                  onPress={() => onChange(color)}
                  style={{ backgroundColor: color }}>
                  {selected ? <Ionicons color="#ffffff" name="checkmark" size={22} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Field>
      )}
    />
  );
}
