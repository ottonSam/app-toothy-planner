import type {
  FlashcardCardResponse,
  FlashcardDeckType,
  FlashcardGenerationStatus,
  FlashcardReviewRating,
} from '@/types/api';

export const flashcardDeckTypeLabels: Record<FlashcardDeckType, string> = {
  VOCABULARY: 'Vocabulario',
  IRREGULAR_VERBS: 'Verbos irregulares',
  EXPRESSIONS: 'Expressoes',
};

export const flashcardGenerationStatusLabels: Record<FlashcardGenerationStatus, string> = {
  PENDING: 'Aguardando',
  RUNNING: 'Gerando',
  COMPLETED: 'Concluida',
  FAILED: 'Falhou',
  CANCELED: 'Cancelada',
  PARTIAL_COMPLETED: 'Concluida parcialmente',
};

export const flashcardRatingLabels: Record<FlashcardReviewRating, string> = {
  AGAIN: 'Errei',
  HARD: 'Dificil',
  GOOD: 'Acertei',
  EASY: 'Facil',
};

export const flashcardRatingDescriptions: Record<FlashcardReviewRating, string> = {
  AGAIN: 'Nao lembrei da resposta',
  HARD: 'Acertei com dificuldade',
  GOOD: 'Acertei normalmente',
  EASY: 'Acertei com facilidade',
};

export function getFlashcardFront(card: FlashcardCardResponse) {
  return card.word ?? card.baseVerb ?? card.expression ?? '';
}

export function getFlashcardSubtitle(card: FlashcardCardResponse) {
  if (card.type === 'IRREGULAR_VERBS') {
    return [card.pastSimple, card.pastParticiple].filter(Boolean).join(' • ');
  }

  return card.phonetic ?? card.level;
}

export function isGenerationInProgress(status: FlashcardGenerationStatus) {
  return status === 'PENDING' || status === 'RUNNING';
}
