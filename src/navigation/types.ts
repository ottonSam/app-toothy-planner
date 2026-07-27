export type RootDrawerParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: undefined;
  Financial: undefined;
  Objectives: undefined;
  Calendars: undefined;
  Focus: undefined;
  Flashcards: undefined;
  FlashcardDeck: { deckId: string; edit?: boolean; jobId?: string };
  FlashcardReview: { deckId: string; deckName: string };
  Profile: undefined;
};
