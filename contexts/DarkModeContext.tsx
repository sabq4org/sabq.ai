'use client';

import React, { createContext, useContext } from 'react';
import { useTheme } from './ThemeContext';

interface DarkModeContextType {
  darkMode: boolean;
  mounted: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType>({
  darkMode: false,
  mounted: false,
  toggleDarkMode: () => {}
});

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, toggleTheme, mounted } = useTheme();
  
  return (
    <DarkModeContext.Provider value={{ 
      darkMode: resolvedTheme === 'dark', 
      mounted,
      toggleDarkMode: toggleTheme 
    }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkModeContext() {
  return useContext(DarkModeContext);
} 