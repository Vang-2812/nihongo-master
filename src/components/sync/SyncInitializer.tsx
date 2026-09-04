'use client';

import { useEffect, useRef } from 'react';
import { syncService } from '@/services/syncService';
import { useSRSStore } from '@/stores/srsStore';
import { useKanjiStore } from '@/stores/kanjiStore';
import { useVocabStore } from '@/stores/vocabStore';

export default function SyncInitializer() {
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Start auto sync listeners (window focus, online)
    const cleanup = syncService.initAutoSync();

    // Pull latest data on first page load if sync code exists
    if (syncService.getSyncCode()) {
      syncService.pull().catch(() => {});
    }

    // Subscribe to store updates for debounced auto-push
    const unsubSRS = useSRSStore.subscribe(() => {
      if (isInitialMount.current) return;
      syncService.triggerDebouncedSync();
    });

    const unsubKanji = useKanjiStore.subscribe(() => {
      if (isInitialMount.current) return;
      syncService.triggerDebouncedSync();
    });

    const unsubVocab = useVocabStore.subscribe(() => {
      if (isInitialMount.current) return;
      syncService.triggerDebouncedSync();
    });

    // Mark initial mount complete after a short delay
    const timer = setTimeout(() => {
      isInitialMount.current = false;
    }, 1500);

    return () => {
      cleanup();
      unsubSRS();
      unsubKanji();
      unsubVocab();
      clearTimeout(timer);
    };
  }, []);

  return null;
}
