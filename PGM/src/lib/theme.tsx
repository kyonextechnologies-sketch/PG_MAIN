'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }, []);

  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    // IMPORTANT: If theme is 'system', use system preference, otherwise use the selected theme directly
    // This ensures manual selection (light/dark) overrides system preference
    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    
    console.log('🎨 Applying theme:', { 
      selectedTheme: newTheme, 
      resolvedTheme: resolved,
      isSystem: newTheme === 'system'
    });
    
    setResolvedTheme(resolved);
    
    // Remove all theme classes first
    root.classList.remove('light', 'dark');
    
    // Add the appropriate class based on resolved theme
    if (resolved === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      console.log('✅ Dark mode applied to HTML element');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      console.log('✅ Light mode applied to HTML element');
    }
    
    // Verify the class was added
    console.log('📊 HTML classes after apply:', root.classList.toString());
  }, [getSystemTheme]);

  useEffect(() => {
    setMounted(true);
    // Get theme from localStorage or default to system
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'system';
    setThemeState(savedTheme);
    applyTheme(savedTheme);
  }, [applyTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    console.log('🔄 setTheme called with:', newTheme);
    console.log('📝 Previous theme state:', theme);
    
    // Update state first
    setThemeState(newTheme);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      console.log('💾 Theme saved to localStorage:', newTheme);
    }
    
    // Apply theme immediately - this will use the newTheme directly if it's not 'system'
    applyTheme(newTheme);
  }, [applyTheme, theme]);

  const toggleTheme = useCallback(() => {
    const currentResolved = theme === 'system' ? getSystemTheme() : theme;
    const newTheme = currentResolved === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, getSystemTheme, setTheme]);

  // Listen for system theme changes ONLY when theme is set to 'system'
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') {
      console.log('⏭️ Skipping system theme listener - current theme:', theme);
      return;
    }

    console.log('👂 Listening for system theme changes');
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      console.log('🖥️ System theme changed, applying system theme');
      applyTheme('system');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      console.log('🔇 Removing system theme listener');
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, applyTheme]);

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
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

