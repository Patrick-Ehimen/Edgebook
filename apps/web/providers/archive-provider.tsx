'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type ArchiveActivity = {
  id: string;
  when: string; // ISO
  text: string;
  type?: string;
};

export type ArchiveSettings = {
  sundayReminder: boolean;
  showSidebarCount: boolean;
  autoRestoreSameDay: boolean;
  excludeTradesFromPurge: boolean;
  extendedRetention: boolean;
};

const DEFAULT_SETTINGS: ArchiveSettings = {
  sundayReminder: true,
  showSidebarCount: true,
  autoRestoreSameDay: false,
  excludeTradesFromPurge: true,
  extendedRetention: false,
};

type ArchiveCtx = {
  activity: ArchiveActivity[];
  settings: ArchiveSettings;
  retentionDays: number;
  everHadActivity: boolean;
  lastPurge: { count: number; when: string } | null;
  recordActivity: (entry: Omit<ArchiveActivity, 'id' | 'when'>) => void;
  recordPurge: (count: number) => void;
  updateSetting: <K extends keyof ArchiveSettings>(key: K, value: ArchiveSettings[K]) => void;
};

const ArchiveCtx = createContext<ArchiveCtx>({
  activity: [],
  settings: DEFAULT_SETTINGS,
  retentionDays: 30,
  everHadActivity: false,
  lastPurge: null,
  recordActivity: () => {},
  recordPurge: () => {},
  updateSetting: () => {},
});

export function useArchiveSettings() {
  return useContext(ArchiveCtx);
}

const STORAGE_KEY = 'eb-archive-v3';

type PersistedState = {
  activity: ArchiveActivity[];
  settings: ArchiveSettings;
  lastPurge: { count: number; when: string } | null;
};

const EMPTY_STATE: PersistedState = { activity: [], settings: DEFAULT_SETTINGS, lastPurge: null };

export function ArchiveProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => {
    if (typeof window === 'undefined') return EMPTY_STATE;
    try {
      localStorage.removeItem('eb-archive-v1');
      localStorage.removeItem('eb-archive-v2');
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as PersistedState;
    } catch {
      // fall through to empty default
    }
    return EMPTY_STATE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  function recordActivity(entry: Omit<ArchiveActivity, 'id' | 'when'>) {
    const activityEntry: ArchiveActivity = {
      ...entry,
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      when: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, activity: [activityEntry, ...prev.activity].slice(0, 30) }));
  }

  function recordPurge(count: number) {
    setState((prev) => ({ ...prev, lastPurge: { count, when: new Date().toISOString() } }));
  }

  function updateSetting<K extends keyof ArchiveSettings>(key: K, value: ArchiveSettings[K]) {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, [key]: value } }));
  }

  const retentionDays = state.settings.extendedRetention ? 60 : 30;

  const value: ArchiveCtx = {
    activity: state.activity,
    settings: state.settings,
    retentionDays,
    everHadActivity: state.activity.length > 0,
    lastPurge: state.lastPurge,
    recordActivity,
    recordPurge,
    updateSetting,
  };

  return <ArchiveCtx.Provider value={value}>{children}</ArchiveCtx.Provider>;
}
