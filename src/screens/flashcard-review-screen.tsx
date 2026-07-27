import type { DrawerScreenProps } from '@react-navigation/drawer';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { answerFlashcard, getNextFlashcard, listFlashcardReviewRatings } from '@/api/flashcards';
import { ApiError, getApiErrorMessage } from '@/api/client';
import { MutationStatusDrawer } from '@/components/mutation-status-drawer';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { Button } from '@/components/ui/button';
import { useMutationFeedback } from '@/hooks/use-mutation-feedback';
import { useThemePalette } from '@/hooks/use-theme-palette';
import {
  flashcardRatingDescriptions,
  flashcardRatingLabels,
  getFlashcardFront,
} from '@/lib/flashcard-utils';
import { queryKeys } from '@/lib/query-keys';
import type { RootDrawerParamList } from '@/navigation/types';
import type {
  FlashcardCardResponse,
  FlashcardReviewRating,
  FlashcardReviewRatingResponse,
} from '@/types/api';

type FlashcardReviewScreenProps = DrawerScreenProps<RootDrawerParamList, 'FlashcardReview'>;

const defaultRatings: FlashcardReviewRatingResponse[] = (
  ['AGAIN', 'HARD', 'GOOD', 'EASY'] as const
).map((key) => ({
  key,
  name: flashcardRatingLabels[key],
  description: flashcardRatingDescriptions[key],
}));

export function FlashcardReviewScreen({ navigation, route }: FlashcardReviewScreenProps) {
  const { deckId, deckName } = route.params;
  const palette = useThemePalette();
  const queryClient = useQueryClient();
  const feedback = useMutationFeedback();
  const [isRevealed, setIsRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const requestedInitialCard = useRef(false);
  const ratingsQuery = useQuery({
    queryKey: queryKeys.flashcardReviewRatings,
    queryFn: listFlashcardReviewRatings,
  });
  const nextCardMutation = useMutation({
    mutationFn: () => getNextFlashcard(deckId),
    onSuccess: () => setIsRevealed(false),
  });
  const { mutate: fetchNextCard } = nextCardMutation;
  const answerMutation = useMutation({
    mutationFn: ({ cardId, rating }: { cardId: string; rating: FlashcardReviewRating }) =>
      answerFlashcard(cardId, rating),
    onError: feedback.showError,
    onSuccess: () => {
      setReviewedCount((count) => count + 1);
      setIsRevealed(false);
      fetchNextCard();
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.flashcardMetrics }),
        queryClient.invalidateQueries({ queryKey: queryKeys.flashcardDeckCards(deckId) }),
      ]);
    },
  });

  useEffect(() => {
    if (requestedInitialCard.current) {
      return;
    }

    requestedInitialCard.current = true;
    fetchNextCard();
  }, [fetchNextCard]);

  const card = nextCardMutation.data?.card;
  const noCards =
    nextCardMutation.error instanceof ApiError && nextCardMutation.error.status === 404;
  const ratings = ratingsQuery.data ?? defaultRatings;

  return (
    <View className="flex-1 bg-background">
      <ScreenScrollView contentClassName="min-h-full gap-6">
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityLabel="Voltar para o deck"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full"
            onPress={() => navigation.navigate('FlashcardDeck', { deckId })}>
            <Ionicons color={palette.foreground} name="arrow-back" size={26} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-2xl font-semibold text-foreground" numberOfLines={1}>
              {deckName}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {reviewedCount
                ? `${reviewedCount} ${reviewedCount === 1 ? 'carta revisada' : 'cartas revisadas'}`
                : 'Revisao do deck'}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Encerrar revisao"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full border border-border"
            onPress={() => navigation.navigate('FlashcardDeck', { deckId })}>
            <Ionicons color={palette.foreground} name="close" size={22} />
          </Pressable>
        </View>

        {nextCardMutation.isPending ? (
          <ReviewLoadingCard />
        ) : noCards ? (
          <ReviewEmptyState
            onBack={() => navigation.navigate('FlashcardDeck', { deckId })}
            onRetry={fetchNextCard}
          />
        ) : nextCardMutation.isError ? (
          <ReviewErrorState
            message={getApiErrorMessage(nextCardMutation.error)}
            onRetry={fetchNextCard}
          />
        ) : card ? (
          <>
            <ReviewCard card={card} isRevealed={isRevealed} />
            {!isRevealed ? (
              <Button onPress={() => setIsRevealed(true)}>Mostrar resposta</Button>
            ) : (
              <View className="gap-3">
                <Text className="text-center text-sm font-semibold text-foreground">
                  Como foi lembrar desta carta?
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {ratings.map((rating) => (
                    <RatingButton
                      disabled={answerMutation.isPending}
                      key={rating.key}
                      onPress={() => answerMutation.mutate({ cardId: card.id, rating: rating.key })}
                      rating={rating}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        ) : null}
      </ScreenScrollView>

      <MutationStatusDrawer
        message={feedback.message}
        onClose={feedback.closeFeedback}
        status={feedback.status}
      />
    </View>
  );
}

function ReviewCard({ card, isRevealed }: { card: FlashcardCardResponse; isRevealed: boolean }) {
  return (
    <View className="min-h-96 justify-center gap-6 rounded-3xl border border-border bg-card p-6">
      <View className="items-center gap-3">
        <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Frente
        </Text>
        <Text className="text-center text-4xl font-semibold text-foreground" selectable>
          {getFlashcardFront(card)}
        </Text>
        {card.phonetic ? (
          <Text className="text-center text-base text-muted-foreground">{card.phonetic}</Text>
        ) : null}
        {card.examples.length && !isRevealed ? (
          <View className="items-center gap-2 pt-1">
            {card.examples.map((example, index) => (
              <Text
                className="text-center text-sm leading-5 text-foreground"
                key={`${example.text}-${index}`}
                selectable>
                {example.text}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      {isRevealed ? (
        <View className="gap-5 border-t border-border pt-5">
          <View className="items-center gap-2">
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Resposta
            </Text>
            {card.type === 'IRREGULAR_VERBS' ? (
              <Text className="text-center text-lg font-semibold text-foreground">
                {card.pastSimple} • {card.pastParticiple}
              </Text>
            ) : null}
            <Text className="text-center text-2xl font-semibold text-primary" selectable>
              {card.translation}
            </Text>
          </View>

          {card.examples.length ? (
            <View className="gap-3 rounded-2xl bg-muted p-4">
              <Text className="text-xs font-semibold uppercase text-muted-foreground">
                Exemplos
              </Text>
              {card.examples.map((example, index) => (
                <View key={`view-${example.text}-${index}`} className="gap-1">
                  <Text
                    className="text-sm leading-5 text-foreground"
                    key={`${example.text}-${index}`}
                    selectable>
                    {example.text}
                  </Text>
                  <Text
                    className="text-sm text-muted-foreground"
                    key={`${example.translation}-${index}`}
                    selectable>
                    {example.translation}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {card.usageNote ? (
            <View className="gap-1">
              <Text className="text-xs font-semibold uppercase text-muted-foreground">
                Nota de uso
              </Text>
              <Text className="text-sm leading-5 text-foreground" selectable>
                {card.usageNote}
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <></>
      )}
    </View>
  );
}

function RatingButton({
  disabled,
  onPress,
  rating,
}: {
  disabled: boolean;
  onPress: () => void;
  rating: FlashcardReviewRatingResponse;
}) {
  const backgroundClass = {
    AGAIN: 'border-destructive',
    HARD: 'border-warning',
    GOOD: 'border-primary',
    EASY: 'border-success',
  }[rating.key];

  return (
    <Pressable
      accessibilityHint={flashcardRatingDescriptions[rating.key]}
      accessibilityRole="button"
      className={[
        'min-h-16 min-w-[47%] flex-1 items-center justify-center rounded-xl border-2 bg-card px-3 py-2',
        backgroundClass,
        disabled ? 'opacity-50' : '',
      ].join(' ')}
      disabled={disabled}
      onPress={onPress}>
      <Text className="font-semibold text-foreground">{flashcardRatingLabels[rating.key]}</Text>
      <Text className="text-center text-xs text-muted-foreground">
        {flashcardRatingDescriptions[rating.key]}
      </Text>
    </Pressable>
  );
}

function ReviewLoadingCard() {
  return (
    <View className="min-h-96 animate-pulse items-center justify-center gap-3 rounded-3xl border border-border bg-muted p-6">
      <Text className="text-base font-semibold text-foreground">Escolhendo a proxima carta...</Text>
      <Text className="text-center text-sm text-muted-foreground">
        A prioridade considera dificuldade, erros e tempo desde a ultima revisao.
      </Text>
    </View>
  );
}

function ReviewEmptyState({ onBack, onRetry }: { onBack: () => void; onRetry: () => void }) {
  return (
    <View className="items-center gap-4 rounded-3xl border border-border bg-card p-8">
      <Text className="text-center text-xl font-semibold text-foreground">
        Nenhuma carta disponivel
      </Text>
      <Text className="text-center text-sm text-muted-foreground">
        Aguarde a geracao terminar ou verifique se o deck possui cartas ativas.
      </Text>
      <View className="w-full flex-row gap-2">
        <Button className="flex-1" variant="secondary" onPress={onBack}>
          Voltar
        </Button>
        <Button className="flex-1" onPress={onRetry}>
          Tentar novamente
        </Button>
      </View>
    </View>
  );
}

function ReviewErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="items-center gap-4 rounded-3xl border border-border bg-card p-8">
      <Text className="text-center text-xl font-semibold text-foreground">
        Nao foi possivel carregar
      </Text>
      <Text className="text-center text-sm text-muted-foreground" selectable>
        {message}
      </Text>
      <Button onPress={onRetry}>Tentar novamente</Button>
    </View>
  );
}
