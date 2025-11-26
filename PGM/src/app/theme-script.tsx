/**
 * Theme script to prevent flash of unstyled content (FOUC)
 * Uses next-themes recommended approach
 */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              const theme = localStorage.getItem('pgms-theme') || 'system';
              const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              const resolvedTheme = theme === 'system' ? systemTheme : theme;
              
              const root = document.documentElement;
              if (resolvedTheme === 'dark') {
                root.classList.add('dark');
                root.classList.remove('light');
                root.style.colorScheme = 'dark';
              } else {
                root.classList.add('light');
                root.classList.remove('dark');
                root.style.colorScheme = 'light';
              }
            } catch (e) {
              console.error('[Theme Script] Error:', e);
              // Fallback to dark mode
              document.documentElement.classList.add('dark');
            }
          })();
        `,
      }}
    />
  );
}

