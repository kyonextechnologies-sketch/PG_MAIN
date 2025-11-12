'use client';

import React, { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
  resolvedTheme: 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Always apply dark mode
    const root = document.documentElement;
    const body = document.body;
    const nextRoot = document.getElementById('__next');
    
    // Force dark mode
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.colorScheme = 'dark';
    root.style.setProperty('background-color', '#0a0a0a', 'important');
    body.style.setProperty('background-color', '#0a0a0a', 'important');
    body.style.setProperty('color', '#ededed', 'important');
    if (nextRoot) {
      nextRoot.style.setProperty('background-color', '#0a0a0a', 'important');
      nextRoot.style.setProperty('color', '#ededed', 'important');
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ resolvedTheme: 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

