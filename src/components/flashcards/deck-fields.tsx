import { ControlledInput } from '@/components/forms/controlled-input';
import { ControlledSelect } from '@/components/forms/controlled-select';

export function FlashcardDeckFields() {
  return (
    <>
      <ControlledInput
        autoCapitalize="sentences"
        label="Nome do deck"
        name="name"
        placeholder="Ex: Ingles para viagens"
      />
      <ControlledInput
        description="A IA usa este texto para escolher palavras, verbos ou expressoes relevantes."
        label="Contexto"
        multiline
        name="context"
        numberOfLines={4}
        placeholder="Ex: Situacoes comuns em aeroportos, hoteis e restaurantes"
        textAlignVertical="top"
      />
      <ControlledInput
        autoCapitalize="none"
        autoCorrect={false}
        description="Use um codigo de idioma, como en, es ou fr."
        label="Idioma de estudo"
        name="targetLanguage"
        placeholder="en"
      />
      <ControlledInput
        autoCapitalize="none"
        autoCorrect={false}
        description="Idioma usado nas traducoes, como pt-BR."
        label="Idioma base"
        name="baseLanguage"
        placeholder="pt-BR"
      />
      <ControlledSelect
        label="Tipo de conteudo"
        name="type"
        options={[
          { label: 'Vocabulario', value: 'VOCABULARY' },
          { label: 'Verbos irregulares', value: 'IRREGULAR_VERBS' },
          { label: 'Expressoes', value: 'EXPRESSIONS' },
        ]}
      />
    </>
  );
}
