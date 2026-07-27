import { z } from 'zod';

import { apiRequest } from '@/api/client';
import {
  flashcardCardResponseSchema,
  flashcardCardPageResponseSchema,
  flashcardDeckResponseSchema,
  flashcardGenerationJobResponseSchema,
  flashcardMetricsResponseSchema,
  flashcardNextCardResponseSchema,
  flashcardReviewRatingResponseSchema,
} from '@/schemas/api';
import type {
  FlashcardCardResponse,
  FlashcardCardPageResponse,
  FlashcardDeckResponse,
  FlashcardDeckType,
  FlashcardGenerationJobResponse,
  FlashcardMetricsResponse,
  FlashcardNextCardResponse,
  FlashcardReviewRating,
  FlashcardReviewRatingResponse,
} from '@/types/api';

const flashcardDeckListSchema = z.array(flashcardDeckResponseSchema);
const flashcardCardListSchema = z.array(flashcardCardResponseSchema);
const flashcardCardCollectionSchema = z.union([
  flashcardCardPageResponseSchema,
  flashcardCardListSchema,
]);
const flashcardReviewRatingListSchema = z.array(flashcardReviewRatingResponseSchema);

export type FlashcardDeckRequest = {
  name: string;
  context: string;
  targetLanguage: string;
  baseLanguage: string;
  type: FlashcardDeckType;
};

export type FlashcardDeckGenerateRequest = FlashcardDeckRequest & {
  cardCount: number;
};

export type FlashcardCardRequest = {
  word?: string | null;
  baseVerb?: string | null;
  pastSimple?: string | null;
  pastParticiple?: string | null;
  expression?: string | null;
  translation: string;
  phonetic?: string | null;
  level?: string | null;
  usageNote?: string | null;
  active?: boolean;
  examples: {
    text: string;
    translation: string;
  }[];
  tags: string[];
};

export function listFlashcardDecks() {
  return apiRequest<FlashcardDeckResponse[]>('/flashcards/decks', {
    schema: flashcardDeckListSchema,
  });
}

export function getFlashcardDeck(deckId: string) {
  return apiRequest<FlashcardDeckResponse>(`/flashcards/decks/${deckId}`, {
    schema: flashcardDeckResponseSchema,
  });
}

export function generateFlashcardDeck(body: FlashcardDeckGenerateRequest) {
  return apiRequest<FlashcardGenerationJobResponse, FlashcardDeckGenerateRequest>(
    '/flashcards/decks/generate',
    {
      method: 'POST',
      body,
      schema: flashcardGenerationJobResponseSchema,
    }
  );
}

export function updateFlashcardDeck(deckId: string, body: FlashcardDeckRequest) {
  return apiRequest<FlashcardDeckResponse, FlashcardDeckRequest>(`/flashcards/decks/${deckId}`, {
    method: 'PUT',
    body,
    schema: flashcardDeckResponseSchema,
  });
}

export function deleteFlashcardDeck(deckId: string) {
  return apiRequest<void>(`/flashcards/decks/${deckId}`, {
    method: 'DELETE',
  });
}

export async function listFlashcardDeckCards(deckId: string, page = 0, size = 10) {
  const response = await apiRequest<FlashcardCardPageResponse | FlashcardCardResponse[]>(
    `/flashcards/decks/${deckId}/cards?page=${page}&size=${size}`,
    {
      schema: flashcardCardCollectionSchema,
    }
  );

  if (!Array.isArray(response)) {
    return response;
  }

  const totalElements = response.length;
  const totalPages = Math.ceil(totalElements / size);
  const content = response.slice(page * size, (page + 1) * size);

  return {
    content,
    page,
    size,
    totalElements,
    totalPages,
    first: page === 0,
    last: totalPages === 0 || page >= totalPages - 1,
  };
}

export function createFlashcardCard(deckId: string, body: FlashcardCardRequest) {
  return apiRequest<FlashcardCardResponse, FlashcardCardRequest>(
    `/flashcards/decks/${deckId}/cards`,
    {
      method: 'POST',
      body,
      schema: flashcardCardResponseSchema,
    }
  );
}

export function updateFlashcardCard(cardId: string, body: FlashcardCardRequest) {
  return apiRequest<FlashcardCardResponse, FlashcardCardRequest>(`/flashcards/cards/${cardId}`, {
    method: 'PUT',
    body,
    schema: flashcardCardResponseSchema,
  });
}

export function deleteFlashcardCard(cardId: string) {
  return apiRequest<void>(`/flashcards/cards/${cardId}`, {
    method: 'DELETE',
  });
}

export function getFlashcardDeckGenerationStatus(deckId: string) {
  return apiRequest<FlashcardGenerationJobResponse>(
    `/flashcards/decks/${deckId}/generation-status`,
    {
      schema: flashcardGenerationJobResponseSchema,
    }
  );
}

export function listFlashcardReviewRatings() {
  return apiRequest<FlashcardReviewRatingResponse[]>('/flashcards/review-ratings', {
    schema: flashcardReviewRatingListSchema,
  });
}

export function getNextFlashcard(deckId?: string) {
  return apiRequest<FlashcardNextCardResponse, { deckId?: string }>(
    '/flashcards/review/next-card',
    {
      method: 'POST',
      body: deckId ? { deckId } : {},
      schema: flashcardNextCardResponseSchema,
    }
  );
}

export function answerFlashcard(cardId: string, rating: FlashcardReviewRating) {
  return apiRequest<FlashcardCardResponse, { rating: FlashcardReviewRating }>(
    `/flashcards/cards/${cardId}/answer`,
    {
      method: 'POST',
      body: { rating },
      schema: flashcardCardResponseSchema,
    }
  );
}

export function getFlashcardMetrics() {
  return apiRequest<FlashcardMetricsResponse>('/flashcards/metrics', {
    schema: flashcardMetricsResponseSchema,
  });
}
