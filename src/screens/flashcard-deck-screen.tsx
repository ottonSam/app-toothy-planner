import { zodResolver } from '@hookform/resolvers/zod';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  createFlashcardCard,
  deleteFlashcardCard,
  getFlashcardDeck,
  getFlashcardDeckGenerationStatus,
  listFlashcardDeckCards,
  type FlashcardCardRequest,
  updateFlashcardCard,
  updateFlashcardDeck,
} from '@/api/flashcards';
import { CardActionsMenu } from '@/components/card-actions-menu';
import { DeleteConfirmationDrawer } from '@/components/delete-confirmation-drawer';
import { FlashcardCardFields } from '@/components/flashcards/card-fields';
import { FlashcardDeckFields } from '@/components/flashcards/deck-fields';
import { FlashcardGenerationStatusCard } from '@/components/flashcards/generation-status-card';
import { ListRequestState } from '@/components/list-request-state';
import { MutationStatusDrawer } from '@/components/mutation-status-drawer';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { BottomDrawer } from '@/components/ui/bottom-drawer';
import { Button } from '@/components/ui/button';
import { useMutationFeedback } from '@/hooks/use-mutation-feedback';
import { useThemePalette } from '@/hooks/use-theme-palette';
import {
  flashcardDeckTypeLabels,
  getFlashcardFront,
  getFlashcardSubtitle,
  isGenerationInProgress,
} from '@/lib/flashcard-utils';
import { queryKeys } from '@/lib/query-keys';
import type { RootDrawerParamList } from '@/navigation/types';
import {
  flashcardCardFormSchema,
  flashcardDeckFormSchema,
  type FlashcardCardFormData,
  type FlashcardDeckFormData,
} from '@/schemas/forms';
import type { FlashcardCardResponse, FlashcardDeckResponse } from '@/types/api';

type FlashcardDeckScreenProps = DrawerScreenProps<RootDrawerParamList, 'FlashcardDeck'>;

const emptyDeckValues: FlashcardDeckFormData = {
  name: '',
  context: '',
  targetLanguage: '',
  baseLanguage: '',
  type: 'VOCABULARY',
};

const emptyCardValues = (type: FlashcardDeckResponse['type']): FlashcardCardFormData => ({
  type,
  word: '',
  baseVerb: '',
  pastSimple: '',
  pastParticiple: '',
  expression: '',
  translation: '',
  phonetic: '',
  level: '',
  usageNote: '',
  active: true,
  tags: '',
  examples: [],
});

export function FlashcardDeckScreen({ navigation, route }: FlashcardDeckScreenProps) {
  const { deckId } = route.params;
  const palette = useThemePalette();
  const queryClient = useQueryClient();
  const feedback = useMutationFeedback();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCardFormOpen, setIsCardFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashcardCardResponse | null>(null);
  const [cardPendingDeletion, setCardPendingDeletion] = useState<FlashcardCardResponse | null>(
    null
  );
  const [page, setPage] = useState(0);
  const screenScrollRef = useRef<ScrollView>(null);
  const handledTerminalJobId = useRef<string | null>(null);
  const deckQuery = useQuery({
    queryKey: queryKeys.flashcardDeck(deckId),
    queryFn: () => getFlashcardDeck(deckId),
  });
  const cardsQuery = useQuery({
    queryKey: queryKeys.flashcardDeckCardPage(deckId, page),
    queryFn: () => listFlashcardDeckCards(deckId, page),
  });
  const jobQuery = useQuery({
    queryKey: queryKeys.flashcardDeckGenerationStatus(deckId),
    queryFn: () => getFlashcardDeckGenerationStatus(deckId),
    refetchInterval: (query) =>
      query.state.data && isGenerationInProgress(query.state.data.status) ? 2000 : false,
  });
  const deckForm = useForm<FlashcardDeckFormData>({
    resolver: zodResolver(flashcardDeckFormSchema),
    defaultValues: emptyDeckValues,
  });
  const cardForm = useForm<FlashcardCardFormData>({
    resolver: zodResolver(flashcardCardFormSchema),
    defaultValues: emptyCardValues('VOCABULARY'),
  });
  const generatedCardCount = jobQuery.data
    ? jobQuery.data.batches.length > 0
      ? jobQuery.data.batches.reduce((total, batch) => total + batch.createdCount, 0)
      : jobQuery.data.createdCount
    : 0;

  const updateMutation = useMutation({
    mutationFn: (data: FlashcardDeckFormData) =>
      updateFlashcardDeck(deckId, {
        name: data.name.trim(),
        context: data.context.trim(),
        targetLanguage: data.targetLanguage.trim(),
        baseLanguage: data.baseLanguage.trim(),
        type: data.type,
      }),
    onError: feedback.showError,
    onSuccess: async (deck) => {
      queryClient.setQueryData(queryKeys.flashcardDeck(deckId), deck);
      queryClient.setQueryData<FlashcardDeckResponse[]>(queryKeys.flashcardDecks, (decks) =>
        decks?.map((currentDeck) => (currentDeck.id === deck.id ? deck : currentDeck))
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.flashcardDecks });
      setIsEditOpen(false);
      feedback.showSuccess('Deck atualizado com sucesso.');
    },
  });
  const saveCardMutation = useMutation({
    mutationFn: (data: FlashcardCardFormData) => {
      const request = toCardRequest(data);
      return editingCard
        ? updateFlashcardCard(editingCard.id, request)
        : createFlashcardCard(deckId, request);
    },
    onError: feedback.showError,
    onSuccess: async () => {
      const wasEditing = Boolean(editingCard);
      const nextPage = wasEditing ? page : Math.floor((cardsQuery.data?.totalElements ?? 0) / 10);
      setIsCardFormOpen(false);
      setEditingCard(null);
      if (nextPage !== page) {
        setPage(nextPage);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.flashcardDeckCards(deckId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.flashcardDecks }),
        queryClient.invalidateQueries({ queryKey: queryKeys.flashcardMetrics }),
      ]);
      feedback.showSuccess(
        wasEditing ? 'Carta atualizada com sucesso.' : 'Carta criada com sucesso.'
      );
    },
  });
  const deleteCardMutation = useMutation({
    mutationFn: (card: FlashcardCardResponse) => deleteFlashcardCard(card.id),
    onError: feedback.showError,
    onSuccess: async (_, card) => {
      const shouldReturnPage = cardsQuery.data?.content.length === 1 && page > 0;
      if (shouldReturnPage) {
        setPage((currentPage) => currentPage - 1);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.flashcardDeckCards(deckId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.flashcardDecks }),
        queryClient.invalidateQueries({ queryKey: queryKeys.flashcardMetrics }),
      ]);
      feedback.showSuccess(`Carta "${getFlashcardFront(card)}" excluida com sucesso.`);
    },
  });

  useEffect(() => {
    const job = jobQuery.data;
    if (!job || isGenerationInProgress(job.status) || handledTerminalJobId.current === job.id) {
      return;
    }

    handledTerminalJobId.current = job.id;
    void queryClient.invalidateQueries({ queryKey: queryKeys.flashcardDeckCards(deckId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.flashcardMetrics });
    void queryClient.invalidateQueries({ queryKey: queryKeys.flashcardDecks });
  }, [deckId, jobQuery.data, queryClient]);

  useEffect(() => {
    if (generatedCardCount === 0) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: queryKeys.flashcardDeckCards(deckId) });
  }, [deckId, generatedCardCount, queryClient]);

  useEffect(() => {
    screenScrollRef.current?.scrollTo({ animated: true, y: 0 });
  }, [page]);

  useEffect(() => {
    const deck = deckQuery.data;
    if (!route.params.edit || !deck) {
      return;
    }

    deckForm.reset({
      name: deck.name,
      context: deck.context,
      targetLanguage: deck.targetLanguage,
      baseLanguage: deck.baseLanguage,
      type: deck.type,
    });
    setIsEditOpen(true);
    navigation.setParams({ edit: false });
  }, [deckForm, deckQuery.data, navigation, route.params.edit]);

  const deck = deckQuery.data;
  const cardsPage = cardsQuery.data;
  const cards = cardsPage?.content ?? [];

  const openCreateCard = () => {
    if (!deck) {
      return;
    }
    setEditingCard(null);
    cardForm.reset(emptyCardValues(deck.type));
    setIsCardFormOpen(true);
  };

  const openEditCard = (card: FlashcardCardResponse) => {
    setEditingCard(card);
    cardForm.reset(cardToFormValues(card));
    setIsCardFormOpen(true);
  };

  const closeCardForm = () => {
    setIsCardFormOpen(false);
    setEditingCard(null);
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenScrollView viewRef={screenScrollRef}>
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityLabel="Voltar para decks"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full"
            onPress={() => navigation.navigate('Flashcards')}>
            <Ionicons color={palette.foreground} name="arrow-back" size={26} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-2xl font-semibold text-foreground" numberOfLines={1}>
              {deck?.name ?? 'Deck'}
            </Text>
            <Text className="text-sm text-muted-foreground">Detalhes e cartas geradas</Text>
          </View>
          <Button disabled={!deck} size="sm" onPress={openCreateCard}>
            Nova carta
          </Button>
        </View>

        {jobQuery.data && jobQuery.data.status !== 'COMPLETED' ? (
          <FlashcardGenerationStatusCard job={jobQuery.data} />
        ) : null}

        {deckQuery.isLoading ? (
          <View className="h-36 animate-pulse rounded-2xl border border-border bg-muted" />
        ) : deckQuery.isError ? (
          <ListRequestState
            data={undefined}
            emptyMessage=""
            error={deckQuery.error}
            isError
            isLoading={false}
            onRetry={() => deckQuery.refetch()}
            renderItem={() => null}
          />
        ) : deck ? (
          <DeckSummary deck={deck} />
        ) : null}

        <View className="flex-row gap-3">
          <Button
            className="flex-1"
            disabled={!deck || (cardsPage?.totalElements ?? 0) === 0}
            onPress={() =>
              deck &&
              navigation.navigate('FlashcardReview', {
                deckId: deck.id,
                deckName: deck.name,
              })
            }>
            Comecar revisao
          </Button>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-foreground">Cartas</Text>
            <Text className="text-sm text-muted-foreground">
              {cardsPage?.totalElements ?? 0} no deck
            </Text>
          </View>
          <ListRequestState
            data={cards}
            emptyMessage={
              jobQuery.data && isGenerationInProgress(jobQuery.data.status)
                ? 'As cartas aparecerao conforme os lotes forem concluidos.'
                : 'Este deck ainda nao possui cartas disponiveis.'
            }
            error={cardsQuery.error}
            isError={cardsQuery.isError}
            isLoading={cardsQuery.isLoading}
            onRetry={() => cardsQuery.refetch()}
            renderItem={(card) => (
              <FlashcardPreview
                card={card}
                key={card.id}
                onDelete={() => setCardPendingDeletion(card)}
                onEdit={() => openEditCard(card)}
              />
            )}
          />
          {cardsPage && cardsPage.totalPages > 1 ? (
            <View className="flex-row items-center gap-3">
              <Button
                className="flex-1"
                disabled={cardsPage.first || cardsQuery.isFetching}
                variant="outline"
                onPress={() => setPage((currentPage) => Math.max(0, currentPage - 1))}>
                Anterior
              </Button>
              <Text className="min-w-20 text-center text-sm text-muted-foreground">
                {cardsPage.page + 1} de {cardsPage.totalPages}
              </Text>
              <Button
                className="flex-1"
                disabled={cardsPage.last || cardsQuery.isFetching}
                variant="outline"
                onPress={() => setPage((currentPage) => currentPage + 1)}>
                Proxima
              </Button>
            </View>
          ) : null}
        </View>
      </ScreenScrollView>

      <BottomDrawer maxHeight="94%" onClose={() => setIsEditOpen(false)} visible={isEditOpen}>
        <Text className="text-xl font-semibold text-foreground">Editar deck</Text>
        <FormProvider {...deckForm}>
          <ScrollView
            className="shrink"
            contentContainerClassName="gap-4 pb-2"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <FlashcardDeckFields />
            <View className="flex-row gap-2 pt-2">
              <Button className="flex-1" variant="secondary" onPress={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                isLoading={updateMutation.isPending}
                onPress={deckForm.handleSubmit((data) => updateMutation.mutate(data))}>
                Salvar
              </Button>
            </View>
          </ScrollView>
        </FormProvider>
      </BottomDrawer>

      <BottomDrawer maxHeight="94%" onClose={closeCardForm} visible={isCardFormOpen}>
        <Text className="text-xl font-semibold text-foreground">
          {editingCard ? 'Editar carta' : 'Nova carta'}
        </Text>
        <FormProvider {...cardForm}>
          <ScrollView
            className="shrink"
            contentContainerClassName="gap-4 pb-2"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <FlashcardCardFields />
            <View className="flex-row gap-2 pt-2">
              <Button className="flex-1" variant="secondary" onPress={closeCardForm}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                isLoading={saveCardMutation.isPending}
                onPress={cardForm.handleSubmit((data) => saveCardMutation.mutate(data))}>
                Salvar
              </Button>
            </View>
          </ScrollView>
        </FormProvider>
      </BottomDrawer>

      <DeleteConfirmationDrawer
        description="A carta e seu historico de revisao serao removidos permanentemente."
        itemName={cardPendingDeletion ? getFlashcardFront(cardPendingDeletion) : undefined}
        onCancel={() => setCardPendingDeletion(null)}
        onConfirm={() => {
          if (cardPendingDeletion) {
            deleteCardMutation.mutate(cardPendingDeletion);
          }
        }}
        title="Excluir carta"
        visible={Boolean(cardPendingDeletion)}
      />

      <MutationStatusDrawer
        message={feedback.message}
        onClose={feedback.closeFeedback}
        status={feedback.status}
      />
    </View>
  );
}

function DeckSummary({ deck }: { deck: FlashcardDeckResponse }) {
  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row flex-wrap gap-2">
        <Text className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-foreground">
          {flashcardDeckTypeLabels[deck.type]}
        </Text>
        <Text className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
          {deck.targetLanguage} → {deck.baseLanguage}
        </Text>
      </View>
      <View className="gap-1">
        <Text className="text-xs font-semibold uppercase text-muted-foreground">Contexto</Text>
        <Text className="text-sm leading-5 text-foreground">{deck.context}</Text>
      </View>
    </View>
  );
}

function FlashcardPreview({
  card,
  onDelete,
  onEdit,
}: {
  card: FlashcardCardResponse;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const subtitle = getFlashcardSubtitle(card);

  return (
    <View className="gap-2 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">{getFlashcardFront(card)}</Text>
          {subtitle ? <Text className="text-sm text-muted-foreground">{subtitle}</Text> : null}
        </View>
        <View className="flex-row items-center gap-1">
          <Text
            className={[
              'rounded-full px-2 py-1 text-xs font-semibold',
              card.active ? 'bg-success text-white' : 'bg-muted text-muted-foreground',
            ].join(' ')}>
            {card.active ? 'Ativa' : 'Inativa'}
          </Text>
          <CardActionsMenu
            accessibilityLabel={`Abrir acoes da carta ${getFlashcardFront(card)}`}
            actions={[
              { label: 'Editar', onPress: onEdit },
              { label: 'Excluir', onPress: onDelete, variant: 'destructive' },
            ]}
          />
        </View>
      </View>
      <Text className="text-sm text-muted-foreground">{card.translation}</Text>
      {card.tags.length ? (
        <View className="flex-row flex-wrap gap-2">
          {card.tags.map((tag) => (
            <Text
              className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
              key={tag.id}>
              #{tag.name}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function cardToFormValues(card: FlashcardCardResponse): FlashcardCardFormData {
  return {
    type: card.type,
    word: card.word ?? '',
    baseVerb: card.baseVerb ?? '',
    pastSimple: card.pastSimple ?? '',
    pastParticiple: card.pastParticiple ?? '',
    expression: card.expression ?? '',
    translation: card.translation,
    phonetic: card.phonetic ?? '',
    level: card.level ?? '',
    usageNote: card.usageNote ?? '',
    active: card.active,
    tags: card.tags.map((tag) => tag.name).join(', '),
    examples: card.examples.map((example) => ({
      text: example.text,
      translation: example.translation,
    })),
  };
}

function toCardRequest(data: FlashcardCardFormData): FlashcardCardRequest {
  return {
    word: data.word.trim() || null,
    baseVerb: data.baseVerb.trim() || null,
    pastSimple: data.pastSimple.trim() || null,
    pastParticiple: data.pastParticiple.trim() || null,
    expression: data.expression.trim() || null,
    translation: data.translation.trim(),
    phonetic: data.phonetic.trim() || null,
    level: data.level.trim() || null,
    usageNote: data.usageNote.trim() || null,
    active: data.active,
    examples: data.examples
      .filter((example) => example.text.trim() && example.translation.trim())
      .map((example) => ({
        text: example.text.trim(),
        translation: example.translation.trim(),
      })),
    tags: Array.from(
      new Set(
        data.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    ),
  };
}
