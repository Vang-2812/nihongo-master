import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { calculateSM2 } from '@/lib/sm2';

export type CardType = 'vocab' | 'kanji';
export type CardStatus = 'new' | 'learning' | 'review';

export interface SRSCard {
  id: string; // e.g. 'vocab_123' or 'kanji_木'
  cardType: CardType;
  contentId: string | number;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  status: CardStatus;
  interval: number;
  easeFactor: number;
  repetitions: number;
  dueDate: string; // YYYY-MM-DD
  lastReviewed: string | null;
  reviewCount: number;
}

export interface SRSStats {
  streak: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  totalXp: number;
  totalReviews: number;
}

export type NewCardInput = Omit<
  SRSCard,
  'interval' | 'easeFactor' | 'repetitions' | 'dueDate' | 'lastReviewed' | 'reviewCount' | 'status'
>;

export interface SRSState {
  cards: Record<string, SRSCard>;
  stats: SRSStats;
  dailyNewLimit: number;
  autoPlayAudio: boolean;
  soundEffects: boolean;

  // Actions
  addCard: (card: NewCardInput) => void;
  addCards: (cards: NewCardInput[]) => void;
  removeCard: (cardId: string) => void;
  setDailyNewLimit: (limit: number) => void;
  setAutoPlayAudio: (enabled: boolean) => void;
  setSoundEffects: (enabled: boolean) => void;
  getDueCards: () => SRSCard[];
  getDueCount: () => number;
  reviewCard: (cardId: string, rating: 1 | 2 | 3 | 4) => { xpEarned: number; nextDueDate: string };
  addXp: (amount: number) => void;
  importData: (data: any) => void;
  exportData: () => any;
  resetProgress: () => void;
}

export function formatLocalDate(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getYesterdayLocalDate(date: Date = new Date()): string {
  const yesterday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  return formatLocalDate(yesterday);
}

const initialStats: SRSStats = {
  streak: 0,
  lastActiveDate: null,
  totalXp: 0,
  totalReviews: 0,
};

export const useSRSStore = create<SRSState>()(
  persist(
    (set, get) => ({
      cards: {},
      stats: initialStats,
      dailyNewLimit: 20,
      autoPlayAudio: true,
      soundEffects: true,

      addCard: (cardInput) => {
        const state = get();
        if (state.cards[cardInput.id]) {
          return;
        }

        const today = formatLocalDate();
        const newCard: SRSCard = {
          ...cardInput,
          status: 'new',
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          dueDate: today,
          lastReviewed: null,
          reviewCount: 0,
        };

        set({
          cards: {
            ...state.cards,
            [cardInput.id]: newCard,
          },
        });
      },

      addCards: (cardInputs) => {
        const state = get();
        const today = formatLocalDate();
        const newCards = { ...state.cards };

        for (const input of cardInputs) {
          if (!newCards[input.id]) {
            newCards[input.id] = {
              ...input,
              status: 'new',
              interval: 0,
              easeFactor: 2.5,
              repetitions: 0,
              dueDate: today,
              lastReviewed: null,
              reviewCount: 0,
            };
          }
        }

        set({ cards: newCards });
      },

      removeCard: (cardId) => {
        const state = get();
        if (!state.cards[cardId]) return;
        const { [cardId]: _, ...remainingCards } = state.cards;
        set({ cards: remainingCards });
      },

      setDailyNewLimit: (limit) => {
        set({ dailyNewLimit: Math.max(1, limit) });
      },

      setAutoPlayAudio: (enabled) => {
        set({ autoPlayAudio: enabled });
      },

      setSoundEffects: (enabled) => {
        set({ soundEffects: enabled });
      },

      getDueCards: () => {
        const state = get();
        const today = formatLocalDate();
        const allCards = Object.values(state.cards);

        const dueReviewCards = allCards.filter(
          (c) => c.status !== 'new' && c.dueDate <= today
        );
        const newCards = allCards
          .filter((c) => c.status === 'new')
          .slice(0, state.dailyNewLimit);

        return [...dueReviewCards, ...newCards];
      },

      getDueCount: () => {
        return get().getDueCards().length;
      },

      reviewCard: (cardId, rating) => {
        const state = get();
        const card = state.cards[cardId];
        if (!card) {
          throw new Error(`Card not found: ${cardId}`);
        }

        const now = new Date();
        const today = formatLocalDate(now);
        const yesterday = getYesterdayLocalDate(now);

        const sm2Result = calculateSM2(
          {
            rating,
            repetitions: card.repetitions,
            interval: card.interval,
            easeFactor: card.easeFactor,
          },
          now
        );

        const newStatus: CardStatus =
          rating === 1 ? 'learning' : sm2Result.repetitions >= 2 ? 'review' : 'learning';

        const updatedCard: SRSCard = {
          ...card,
          repetitions: sm2Result.repetitions,
          interval: sm2Result.interval,
          easeFactor: sm2Result.easeFactor,
          dueDate: sm2Result.dueDate,
          lastReviewed: today,
          reviewCount: (card.reviewCount || 0) + 1,
          status: newStatus,
        };

        let newStreak = state.stats.streak;
        if (state.stats.lastActiveDate === today) {
          newStreak = state.stats.streak === 0 ? 1 : state.stats.streak;
        } else if (state.stats.lastActiveDate === yesterday) {
          newStreak = state.stats.streak + 1;
        } else {
          newStreak = 1;
        }

        const updatedStats: SRSStats = {
          streak: newStreak,
          lastActiveDate: today,
          totalXp: state.stats.totalXp + sm2Result.xpEarned,
          totalReviews: state.stats.totalReviews + 1,
        };

        set({
          cards: {
            ...state.cards,
            [cardId]: updatedCard,
          },
          stats: updatedStats,
        });

        return {
          xpEarned: sm2Result.xpEarned,
          nextDueDate: sm2Result.dueDate,
        };
      },

      addXp: (amount) => {
        if (amount <= 0) return;
        const state = get();
        const now = new Date();
        const today = formatLocalDate(now);
        const yesterday = getYesterdayLocalDate(now);

        let newStreak = state.stats.streak;
        if (state.stats.lastActiveDate === today) {
          newStreak = state.stats.streak === 0 ? 1 : state.stats.streak;
        } else if (state.stats.lastActiveDate === yesterday) {
          newStreak = state.stats.streak + 1;
        } else {
          newStreak = 1;
        }

        set({
          stats: {
            ...state.stats,
            totalXp: state.stats.totalXp + amount,
            streak: newStreak,
            lastActiveDate: today,
          },
        });
      },

      importData: (data) => {
        if (!data || typeof data !== 'object') return;

        set((state) => {
          let newCards = { ...state.cards };
          if (data.cards) {
            if (Array.isArray(data.cards)) {
              data.cards.forEach((c: SRSCard) => {
                if (c && c.id) {
                  newCards[c.id] = c;
                }
              });
            } else if (typeof data.cards === 'object') {
              newCards = { ...newCards, ...data.cards };
            }
          }

          const newStats: SRSStats = data.stats
            ? {
                streak:
                  typeof data.stats.streak === 'number'
                    ? data.stats.streak
                    : state.stats.streak,
                lastActiveDate:
                  data.stats.lastActiveDate !== undefined
                    ? data.stats.lastActiveDate
                    : state.stats.lastActiveDate,
                totalXp:
                  typeof data.stats.totalXp === 'number'
                    ? data.stats.totalXp
                    : state.stats.totalXp,
                totalReviews:
                  typeof data.stats.totalReviews === 'number'
                    ? data.stats.totalReviews
                    : state.stats.totalReviews,
              }
            : state.stats;

          return {
            cards: newCards,
            stats: newStats,
            dailyNewLimit:
              typeof data.dailyNewLimit === 'number'
                ? data.dailyNewLimit
                : typeof data.settings?.dailyNewLimit === 'number'
                ? data.settings.dailyNewLimit
                : state.dailyNewLimit,
            autoPlayAudio:
              typeof data.autoPlayAudio === 'boolean'
                ? data.autoPlayAudio
                : typeof data.settings?.autoPlayAudio === 'boolean'
                ? data.settings.autoPlayAudio
                : state.autoPlayAudio,
            soundEffects:
              typeof data.soundEffects === 'boolean'
                ? data.soundEffects
                : typeof data.settings?.soundEffects === 'boolean'
                ? data.settings.soundEffects
                : state.soundEffects,
          };
        });
      },

      exportData: () => {
        const state = get();
        return {
          version: 1,
          exportedAt: new Date().toISOString(),
          cards: state.cards,
          stats: state.stats,
          dailyNewLimit: state.dailyNewLimit,
          autoPlayAudio: state.autoPlayAudio,
          soundEffects: state.soundEffects,
        };
      },

      resetProgress: () => {
        set({
          cards: {},
          stats: {
            streak: 0,
            lastActiveDate: null,
            totalXp: 0,
            totalReviews: 0,
          },
        });
      },
    }),
    {
      name: 'nihongo_srs_storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
    }
  )
);
