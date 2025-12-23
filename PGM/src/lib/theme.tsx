'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useEffect } from 'react';
import type { ComponentProps } from 'react';

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

/**
 * Wraps next-themes and keeps `color-scheme` in sync so native UI
 * (scrollbars, form controls) also follow the selected theme.
 */
function ColorSchemeSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    const root = document.documentElement;
    root.style.colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light';
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="pgms-theme"
      enableColorScheme
      {...props}
    >
      <ColorSchemeSync />
      {children}
    </NextThemesProvider>
  );
}

// Re-export useTheme from next-themes for convenience
export { useTheme } from 'next-themes';

