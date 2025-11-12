/**
 * Theme script to prevent flash of unstyled content
 * This script runs before React hydrates
 */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              const theme = localStorage.getItem('theme') || 'system';
              console.log('[Theme Script] Initial theme from localStorage:', theme);
              
              let resolvedTheme;
              if (theme === 'system') {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                resolvedTheme = systemTheme;
                console.log('[Theme Script] System theme detected:', systemTheme);
              } else {
                resolvedTheme = theme;
                console.log('[Theme Script] Using manual theme:', theme);
              }
              
              const root = document.documentElement;
              
              // Remove all theme classes
              root.classList.remove('light', 'dark');
              
              if (resolvedTheme === 'dark') {
                root.classList.add('dark');
                root.style.colorScheme = 'dark';
                console.log('[Theme Script] ✅ Dark mode applied');
              } else {
                root.classList.remove('dark');
                root.style.colorScheme = 'light';
                console.log('[Theme Script] ✅ Light mode applied');
              }
            } catch (e) {
              console.error('[Theme Script] Error:', e);
            }
          })();
        `,
      }}
    />
  );
}

