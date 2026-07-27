import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Pressable, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ControlledInput } from '@/components/forms/controlled-input';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { useThemePalette } from '@/hooks/use-theme-palette';
import type { FlashcardCardFormData } from '@/schemas/forms';

export function FlashcardCardFields() {
  const palette = useThemePalette();
  const form = useFormContext<FlashcardCardFormData>();
  const type = form.watch('type');
  const examples = useFieldArray({
    control: form.control,
    name: 'examples',
  });
  const borderColor = `rgb(${palette.borderRgb.split(' ').join(', ')})`;

  return (
    <View className="gap-4">
      {type === 'VOCABULARY' ? (
        <>
          <ControlledInput
            autoCapitalize="none"
            label="Palavra"
            name="word"
            placeholder="Ex.: luggage"
          />
          <ControlledInput autoCapitalize="none" label="Nivel" name="level" placeholder="Ex.: A1" />
        </>
      ) : null}

      {type === 'IRREGULAR_VERBS' ? (
        <>
          <ControlledInput
            autoCapitalize="none"
            label="Verbo base"
            name="baseVerb"
            placeholder="Ex.: write"
          />
          <ControlledInput
            autoCapitalize="none"
            label="Passado simples"
            name="pastSimple"
            placeholder="Ex.: wrote"
          />
          <ControlledInput
            autoCapitalize="none"
            label="Participio passado"
            name="pastParticiple"
            placeholder="Ex.: written"
          />
        </>
      ) : null}

      {type === 'EXPRESSIONS' ? (
        <ControlledInput
          autoCapitalize="sentences"
          label="Expressao"
          name="expression"
          placeholder="Ex.: How are you?"
        />
      ) : null}

      <ControlledInput
        autoCapitalize="sentences"
        label="Traducao"
        name="translation"
        placeholder="Informe a traducao"
      />
      <ControlledInput
        autoCapitalize="none"
        label="Pronuncia"
        name="phonetic"
        placeholder="Ex.: /ˈlʌɡɪdʒ/"
      />
      <ControlledInput
        autoCapitalize="sentences"
        className="min-h-24 py-3"
        label="Nota de uso"
        multiline
        name="usageNote"
        placeholder="Contexto ou observacao opcional"
        textAlignVertical="top"
      />
      <ControlledInput
        autoCapitalize="none"
        description="Separe as tags por virgula."
        label="Tags"
        name="tags"
        placeholder="viagem, aeroporto"
      />

      <Controller
        control={form.control}
        name="active"
        render={({ field: { onChange, value } }) => (
          <Field label="Carta ativa">
            <View className="min-h-12 flex-row items-center justify-between rounded-md border border-input bg-card px-3">
              <Text className="text-sm text-foreground">
                {value ? 'Disponivel para revisao' : 'Fora das revisoes'}
              </Text>
              <Switch
                accessibilityLabel="Alternar carta ativa"
                onValueChange={onChange}
                thumbColor={value ? palette.primary : palette.mutedForeground}
                trackColor={{ false: borderColor, true: palette.primary }}
                value={value}
              />
            </View>
          </Field>
        )}
      />

      <View className="gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">Exemplos</Text>
            <Text className="text-xs text-muted-foreground">O preenchimento e opcional.</Text>
          </View>
          <Button
            size="sm"
            variant="outline"
            onPress={() => examples.append({ text: '', translation: '' })}>
            Adicionar
          </Button>
        </View>

        {examples.fields.map((example, index) => (
          <View className="gap-3 rounded-lg border border-border bg-muted p-3" key={example.id}>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-foreground">Exemplo {index + 1}</Text>
              <Pressable
                accessibilityLabel={`Remover exemplo ${index + 1}`}
                accessibilityRole="button"
                className="h-9 w-9 items-center justify-center rounded-full"
                onPress={() => examples.remove(index)}>
                <Ionicons color={palette.mutedForeground} name="trash-outline" size={19} />
              </Pressable>
            </View>
            <ControlledInput
              autoCapitalize="sentences"
              label="Idioma estudado"
              name={`examples.${index}.text`}
              placeholder="Ex.: My luggage was lost."
            />
            <ControlledInput
              autoCapitalize="sentences"
              label="Traducao do exemplo"
              name={`examples.${index}.translation`}
              placeholder="Ex.: Minha bagagem foi perdida."
            />
          </View>
        ))}
      </View>
    </View>
  );
}
