'use client';

import { useState, useEffect } from 'react';

interface UseDarkModeHook {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function useDarkMode(): UseDarkModeHook {
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // قراءة التفضيل من localStorage في الجانب العميل فقط
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('dark_mode');
    if (stored) setDarkMode(stored === 'true');
  }, []);

  const toggleDarkMode = () => {
    if (typeof window === 'undefined') return;
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('dark_mode', String(next));
    document.documentElement.classList.toggle('dark', next);
  };

  return { darkMode, toggleDarkMode };
} 