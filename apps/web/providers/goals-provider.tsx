'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type GoalDef = {
  id: string;
  label: string;
  period: 'daily' | 'weekly' | 'monthly';
  target: string;
  unit: string;
  current: number;
  pct: number;
  status: 'on-track' | 'ahead' | 'drift' | 'safe';
};

export type RuleDef = {
  id: string;
  label: string;
  desc: string;
  level: 'soft' | 'hard';
  enabled: boolean;
  params: { label: string; value: string; unit?: string }[];
  triggerCount: number;
};

export type AccountConfig = {
  presetName: string;
  goals: GoalDef[];
  rules: RuleDef[];
};

type GoalsCtx = {
  configByAccount: Record<string, AccountConfig>;
  setAccountConfig: (accountId: string, config: AccountConfig) => void;
  addGoal: (accountId: string, goal: GoalDef) => void;
  updateGoal: (
    accountId: string,
    goalId: string,
    patch: Partial<Pick<GoalDef, 'label' | 'target' | 'unit' | 'period'>>,
  ) => void;
  addRule: (accountId: string, rule: RuleDef) => void;
  toggleRule: (accountId: string, ruleId: string, enabled: boolean) => void;
  resetAccount: (accountId: string) => void;
};

const GoalsCtx = createContext<GoalsCtx>({
  configByAccount: {},
  setAccountConfig: () => {},
  addGoal: () => {},
  updateGoal: () => {},
  addRule: () => {},
  toggleRule: () => {},
  resetAccount: () => {},
});

export function useGoals() {
  return useContext(GoalsCtx);
}

const STORAGE_KEY = 'eb-goals-config';

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [configByAccount, setConfig] = useState<Record<string, AccountConfig>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, AccountConfig>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configByAccount));
  }, [configByAccount]);

  function setAccountConfig(accountId: string, config: AccountConfig) {
    setConfig((prev) => ({ ...prev, [accountId]: config }));
  }

  function addGoal(accountId: string, goal: GoalDef) {
    setConfig((prev) => {
      const cur = prev[accountId];
      if (!cur) return prev;
      return { ...prev, [accountId]: { ...cur, goals: [...cur.goals, goal] } };
    });
  }

  function updateGoal(
    accountId: string,
    goalId: string,
    patch: Partial<Pick<GoalDef, 'label' | 'target' | 'unit' | 'period'>>,
  ) {
    setConfig((prev) => {
      const cur = prev[accountId];
      if (!cur) return prev;
      return {
        ...prev,
        [accountId]: {
          ...cur,
          goals: cur.goals.map((g) => (g.id === goalId ? { ...g, ...patch } : g)),
        },
      };
    });
  }

  function addRule(accountId: string, rule: RuleDef) {
    setConfig((prev) => {
      const cur = prev[accountId];
      if (!cur) return prev;
      return { ...prev, [accountId]: { ...cur, rules: [...cur.rules, rule] } };
    });
  }

  function toggleRule(accountId: string, ruleId: string, enabled: boolean) {
    setConfig((prev) => {
      const cur = prev[accountId];
      if (!cur) return prev;
      return {
        ...prev,
        [accountId]: {
          ...cur,
          rules: cur.rules.map((r) => (r.id === ruleId ? { ...r, enabled } : r)),
        },
      };
    });
  }

  function resetAccount(accountId: string) {
    setConfig((prev) => {
      const next = { ...prev };
      delete next[accountId];
      return next;
    });
  }

  return (
    <GoalsCtx.Provider
      value={{
        configByAccount,
        setAccountConfig,
        addGoal,
        updateGoal,
        addRule,
        toggleRule,
        resetAccount,
      }}
    >
      {children}
    </GoalsCtx.Provider>
  );
}
