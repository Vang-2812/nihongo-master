'use client';

import { useSRSStore } from '@/stores/srsStore';
import { useKanjiStore } from '@/stores/kanjiStore';
import { useVocabStore } from '@/stores/vocabStore';

const SYNC_CODE_KEY = 'nihongo_sync_code';
const LAST_SYNC_TIME_KEY = 'nihongo_last_sync_time';

export interface SyncStatus {
  syncCode: string | null;
  lastSyncTime: number | null;
  isSyncing: boolean;
  error: string | null;
}

let syncTimeout: NodeJS.Timeout | null = null;
let isSyncingInProgress = false;

export const syncService = {
  /**
   * Get the active Sync Code for this device
   */
  getSyncCode(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(SYNC_CODE_KEY);
  },

  /**
   * Set the active Sync Code
   */
  setSyncCode(code: string | null): void {
    if (typeof window === 'undefined') return;
    if (code) {
      localStorage.setItem(SYNC_CODE_KEY, code.trim().toUpperCase());
    } else {
      localStorage.removeItem(SYNC_CODE_KEY);
      localStorage.removeItem(LAST_SYNC_TIME_KEY);
    }
  },

  /**
   * Get the timestamp of the last successful sync
   */
  getLastSyncTime(): number | null {
    if (typeof window === 'undefined') return null;
    const val = localStorage.getItem(LAST_SYNC_TIME_KEY);
    return val ? parseInt(val, 10) : null;
  },

  /**
   * Generates a new unique sync code on the cloud
   */
  async generateNewCode(deviceName?: string): Promise<{ success: boolean; syncCode?: string; error?: string }> {
    try {
      const res = await fetch('/api/sync/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName }),
      });
      const json = await res.json();

      if (json.success && json.syncCode) {
        this.setSyncCode(json.syncCode);
        // Automatically push initial data
        await this.push();
        return { success: true, syncCode: json.syncCode };
      }
      return { success: false, error: json.error || 'Không thể tạo mã đồng bộ.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi kết nối máy chủ.' };
    }
  },

  /**
   * Collects all user progress from local Zustand stores
   */
  collectLocalData() {
    const srs = useSRSStore.getState();
    const kanji = useKanjiStore.getState();
    const vocab = useVocabStore.getState();

    return {
      cards: srs.cards,
      stats: srs.stats,
      kanjiStatus: kanji.kanjiStatus,
      vocabProgress: {
        lessonProgress: vocab.lessonProgress,
        vocabStatus: vocab.vocabStatus,
      },
      preferences: {
        dailyNewLimit: srs.dailyNewLimit,
        autoPlayAudio: srs.autoPlayAudio,
        soundEffects: srs.soundEffects,
      },
      updatedAt: Date.now(),
    };
  },

  /**
   * Pushes local progress to the cloud
   */
  async push(): Promise<{ success: boolean; error?: string }> {
    const code = this.getSyncCode();
    if (!code) return { success: false, error: 'Chưa liên kết mã đồng bộ.' };

    if (isSyncingInProgress) return { success: true };
    isSyncingInProgress = true;

    try {
      const payload = {
        syncCode: code,
        ...this.collectLocalData(),
      };

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        const now = Date.now();
        localStorage.setItem(LAST_SYNC_TIME_KEY, now.toString());
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      isSyncingInProgress = false;
    }
  },

  /**
   * Pulls remote progress from the cloud and merges into local stores
   */
  async pull(customCode?: string): Promise<{ success: boolean; error?: string; hasData?: boolean }> {
    const code = customCode || this.getSyncCode();
    if (!code) return { success: false, error: 'Chưa có mã đồng bộ.' };

    try {
      const res = await fetch(`/api/sync?code=${encodeURIComponent(code)}`);
      const json = await res.json();

      if (!json.success) {
        return { success: false, error: json.error };
      }

      if (!json.hasData) {
        // Code exists but no data pushed yet
        if (customCode) this.setSyncCode(customCode);
        return { success: true, hasData: false };
      }

      const { data, updatedAt } = json;

      // Apply data to local Zustand stores safely
      if (data.cards || data.stats) {
        useSRSStore.getState().importData({
          cards: data.cards || {},
          stats: data.stats || { streak: 0, lastActiveDate: null, totalXp: 0, totalReviews: 0 },
        });
      }

      if (data.kanjiStatus) {
        useKanjiStore.getState().importKanjiProgress(data.kanjiStatus);
      }

      if (data.vocabProgress) {
        useVocabStore.getState().importVocabProgress({
          lessonProgress: data.vocabProgress.lessonProgress || {},
          vocabStatus: data.vocabProgress.vocabStatus || {},
        });
      }

      if (data.preferences) {
        if (typeof data.preferences.dailyNewLimit === 'number') {
          useSRSStore.getState().setDailyNewLimit(data.preferences.dailyNewLimit);
        }
        if (typeof data.preferences.autoPlayAudio === 'boolean') {
          useSRSStore.getState().setAutoPlayAudio(data.preferences.autoPlayAudio);
        }
        if (typeof data.preferences.soundEffects === 'boolean') {
          useSRSStore.getState().setSoundEffects(data.preferences.soundEffects);
        }
      }

      if (customCode) {
        this.setSyncCode(customCode);
      }

      localStorage.setItem(LAST_SYNC_TIME_KEY, (updatedAt || Date.now()).toString());
      return { success: true, hasData: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Trigger a debounced background sync
   */
  triggerDebouncedSync(): void {
    if (!this.getSyncCode()) return;

    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }

    syncTimeout = setTimeout(() => {
      this.push().catch(() => {});
    }, 3000); // 3-second debounce
  },

  /**
   * Initializes background listeners (window focus, online event)
   */
  initAutoSync(): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleFocus = () => {
      if (navigator.onLine && this.getSyncCode()) {
        this.pull().catch(() => {});
      }
    };

    const handleOnline = () => {
      if (this.getSyncCode()) {
        this.push().catch(() => {});
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  },
};
