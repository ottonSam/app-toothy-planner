import { zodResolver } from '@hookform/resolvers/zod';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  deleteFlashcardDeck,
  generateFlashcardDeck,
  getFlashcardMetrics,
  listFlashcardDecks,
} from '@/api/flashcards';
import { CardActionsMenu } from '@/components/card-actions-menu';
import { DeleteConfirmationDrawer } from '@/components/delete-confirmation-drawer';
import { FlashcardDeckFields } from '@/components/flashcards/deck-fields';
import { ControlledInput } from '@/components/forms/controlled-input';
import { ListRequestState } from '@/components/list-request-state';
import { MutationStatusDrawer } from '@/components/mutation-status-drawer';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { BottomDrawer } from '@/components/ui/bottom-drawer';
import { Button } from '@/components/ui/button';
import { useMutationFeedback } from '@/hooks/use-mutation-feedback';
import { useThemePalette } from '@/hooks/use-theme-palette';
import { flashcardDeckTypeLabels } from '@/lib/flashcard-utils';
import { queryKeys } from '@/lib/query-keys';
import type { RootDrawerParamList } from '@/navigation/types';
import {
  flashcardDeckGenerationFormSchema,
  type FlashcardDeckGenerationFormData,
} from '@/schemas/forms';
import type { FlashcardDeckResponse } from '@/types/api';

type FlashcardsScreenProps = DrawerScreenProps<RootDrawerParamList, 'Flashcards'>;

const generationDefaults: FlashcardDeckGenerationFormData = {
  name: '',
  context: '',
  targetLanguage: 'en',
  baseLanguage: 'pt-BR',
  type: 'VOCABULARY',
  cardCount: '20',
};

export function FlashcardsScreen({ navigation }: FlashcardsScreenProps) {
  const palette = useThemePalette();
  const queryClient = useQueryClient();
  const feedback = useMutationFeedback();
  const decksQuery = useQuery({
    queryKey: queryKeys.flashcardDecks,
    queryFn: listFlashcardDecks,
  });
  const metricsQuery = useQuery({
    queryKey: queryKeys.flashcardMetrics,
    queryFn: getFlashcardMetrics,
  });
  const form = useForm<FlashcardDeckGenerationFormData>({
    resolver: zodResolver(flashcardDeckGenerationFormSchema),
    defaultValues: generationDefaults,
  });
  const formOpenState = useFormOpenState();
  const [deckPendingDeletion, setDeckPendingDeletion] = useState<FlashcardDeckResponse | null>(
    null
  );

  const generationMutation = useMutation({
    mutationFn: (data: FlashcardDeckGenerationFormData) =>
      generateFlashcardDeck({
        name: data.name.trim(),
        context: data.context.trim(),
        targetLanguage: data.targetLanguage.trim(),
        baseLanguage: data.baseLanguage.trim(),
        type: data.type,
        cardCount: Number(data.cardCount),
      }),
    onError: feedback.showError,
    onSuccess: async (job) => {
      formOpenState.close();
      form.reset(generationDefaults);
      await queryClient.invalidateQueries({ queryKey: queryKeys.flashcardDecks });
      await queryClient.invalidateQueries({ queryKey: queryKeys.flashcardMetrics });
      navigation.navigate('FlashcardDeck', { deckId: job.deckId, jobId: job.id });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (deck: FlashcardDeckResponse) => deleteFlashcardDeck(deck.id),
    onError: feedback.showError,
    onSuccess: async (_, deck) => {
      setDeckPendingDeletion(null);
      queryClient.removeQueries({ queryKey: queryKeys.flashcardDeck(deck.id) });
      queryClient.removeQueries({ queryKey: queryKeys.flashcardDeckCards(deck.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.flashcardDecks });
      await queryClient.invalidateQueries({ queryKey: queryKeys.flashcardMetrics });
      feedback.showSuccess('Deck excluido com sucesso.');
    },
  });

  const openGenerationForm = () => {
    form.reset(generationDefaults);
    formOpenState.open();
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenScrollView>
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityLabel="Abrir menu"
            accessibilityRole="button"
            onPress={() => navigation.openDrawer()}>
            <Ionicons color={palette.foreground} name="menu" size={28} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-3xl font-semibold text-foreground">Flash cards</Text>
            <Text className="text-sm text-muted-foreground">
              Crie decks com IA e revise uma carta por vez.
            </Text>
          </View>
          <Button size="sm" onPress={openGenerationForm}>
            Novo
          </Button>
        </View>

        {metricsQuery.data ? <FlashcardMetrics metrics={metricsQuery.data} /> : null}

        <View className="gap-3">
          <Text className="text-lg font-semibold text-foreground">Seus decks</Text>
          <ListRequestState
            data={decksQuery.data}
            emptyMessage="Crie seu primeiro deck e deixe a IA preparar as cartas."
            error={decksQuery.error}
            isError={decksQuery.isError}
            isLoading={decksQuery.isLoading}
            onRetry={() => decksQuery.refetch()}
            renderEmptyAction={() => (
              <Button onPress={openGenerationForm}>Gerar deck com IA</Button>
            )}
            renderItem={(deck) => (
              <FlashcardDeckCard
                deck={deck}
                key={deck.id}
                onOpen={() => navigation.navigate('FlashcardDeck', { deckId: deck.id })}
                onEdit={() => navigation.navigate('FlashcardDeck', { deckId: deck.id, edit: true })}
                onDelete={() => setDeckPendingDeletion(deck)}
                onReview={() =>
                  navigation.navigate('FlashcardReview', {
                    deckId: deck.id,
                    deckName: deck.name,
                  })
                }
              />
            )}
          />
        </View>
      </ScreenScrollView>

      <BottomDrawer maxHeight="94%" onClose={formOpenState.close} visible={formOpenState.isOpen}>
        <Text className="text-xl font-semibold text-foreground">Gerar deck com IA</Text>
        <Text className="text-sm text-muted-foreground">
          Informe o que deseja estudar. A geracao acontece em segundo plano.
        </Text>
        <FormProvider {...form}>
          <ScrollView
            className="shrink"
            contentContainerClassName="gap-4 pb-2"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <FlashcardDeckFields />
            <ControlledInput
              description="A API divide geracoes grandes em lotes de ate 100 cartas."
              keyboardType="number-pad"
              label="Quantidade de cartas"
              name="cardCount"
              placeholder="20"
            />
            <View className="flex-row gap-2 pt-2">
              <Button className="flex-1" variant="secondary" onPress={formOpenState.close}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                isLoading={generationMutation.isPending}
                onPress={form.handleSubmit((data) => generationMutation.mutate(data))}>
                Gerar
              </Button>
            </View>
          </ScrollView>
        </FormProvider>
      </BottomDrawer>

      <DeleteConfirmationDrawer
        description="O deck e todas as suas cartas serao removidos permanentemente."
        itemName={deckPendingDeletion?.name}
        onCancel={() => setDeckPendingDeletion(null)}
        onConfirm={() => {
          if (deckPendingDeletion) {
            deleteMutation.mutate(deckPendingDeletion);
          }
        }}
        title="Excluir deck?"
        visible={Boolean(deckPendingDeletion)}
      />

      <MutationStatusDrawer
        message={feedback.message}
        onClose={feedback.closeFeedback}
        status={feedback.status}
      />
    </View>
  );
}

function useFormOpenState() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}

function FlashcardMetrics({
  metrics,
}: {
  metrics: Awaited<ReturnType<typeof getFlashcardMetrics>>;
}) {
  return (
    <View className="w-full flex-row flex-wrap gap-3">
      <MetricCard label="Cartas ativas" value={metrics.activeCards} />
      <MetricCard label="Para revisar" value={metrics.dueCards} />
      <MetricCard label="Revisadas hoje" value={metrics.reviewedToday} />
      <MetricCard label="Taxa de acerto" suffix="%" value={metrics.accuracyRate} />
    </View>
  );
}

function MetricCard({
  label,
  suffix = '',
  value,
}: {
  label: string;
  suffix?: string;
  value: number;
}) {
  return (
    <View className="min-w-36 flex-1 gap-1 rounded-2xl border border-border bg-card px-4 py-3">
      <Text className="text-2xl font-semibold text-foreground">
        {Math.round(value)}
        {suffix}
      </Text>
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </View>
  );
}

function FlashcardDeckCard({
  deck,
  onDelete,
  onEdit,
  onOpen,
  onReview,
}: {
  deck: FlashcardDeckResponse;
  onDelete: () => void;
  onEdit: () => void;
  onOpen: () => void;
  onReview: () => void;
}) {
  const palette = useThemePalette();

  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-accent">
          <Ionicons color={palette.primary} name="albums-outline" size={24} />
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-lg font-semibold text-foreground">{deck.name}</Text>
          <Text className="text-sm text-muted-foreground">
            {flashcardDeckTypeLabels[deck.type]}
          </Text>
        </View>
        <CardActionsMenu
          accessibilityLabel={`Abrir acoes do deck ${deck.name}`}
          actions={[
            { label: 'Visualizar', onPress: onOpen },
            { label: 'Editar', onPress: onEdit },
            { label: 'Excluir', onPress: onDelete, variant: 'destructive' },
          ]}
        />
      </View>

      <Text className="text-sm text-muted-foreground" numberOfLines={2}>
        {deck.context}
      </Text>

      <View className="flex-row items-center">
        <Text className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
          {deck.targetLanguage} → {deck.baseLanguage}
        </Text>
      </View>

      <Button className="w-full" onPress={onReview}>
        Iniciar revisao
      </Button>
    </View>
  );
}
