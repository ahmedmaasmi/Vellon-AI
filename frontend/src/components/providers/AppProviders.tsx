'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Toaster } from 'sonner';

type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (t: ThemePreference) => void;
  resolved: 'light' | 'dark';
  toggleLightDark: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'vellon-theme';

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within AppProviders');
  }
  return ctx;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [mounted, setMounted] = useState(false);
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
      if (raw === 'light' || raw === 'dark' || raw === 'system') {
        setPreferenceState(raw);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const compute = () => {
      let next: 'light' | 'dark' = 'light';
      if (preference === 'dark') next = 'dark';
      else if (preference === 'light') next = 'light';
      else next = mq.matches ? 'dark' : 'light';
      setResolved(next);
      document.documentElement.classList.toggle('dark', next === 'dark');
    };
    compute();
    mq.addEventListener('change', compute);
    return () => mq.removeEventListener('change', compute);
  }, [preference, mounted]);

  const setPreference = useCallback((t: ThemePreference) => {
    setPreferenceState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleLightDark = useCallback(() => {
    const next = resolved === 'dark' ? 'light' : 'dark';
    setPreference(next);
  }, [resolved, setPreference]);

  const value = useMemo(
    () => ({ preference, setPreference, resolved, toggleLightDark }),
    [preference, setPreference, resolved, toggleLightDark]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <Toaster richColors position="top-center" closeButton />
    </ThemeContext.Provider>
  );
}
