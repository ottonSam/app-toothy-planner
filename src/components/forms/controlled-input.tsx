import { Controller, useFormContext } from 'react-hook-form';
import type { TextInputProps } from 'react-native';

import { Field } from '@/components/ui/field';
import { AppTextInput } from '@/components/ui/text-input';

type ControlledInputProps = TextInputProps & {
  description?: string;
  label: string;
  name: string;
};

export function ControlledInput({ description, label, name, ...props }: ControlledInputProps) {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onBlur, onChange, value }, fieldState }) => (
        <Field description={description} error={fieldState.error?.message} label={label}>
          <AppTextInput
            hasError={Boolean(fieldState.error)}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value ?? ''}
            {...props}
          />
        </Field>
      )}
    />
  );
}
