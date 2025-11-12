/**
 * Theme script to prevent flash of unstyled content
 * Always applies dark mode
 */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              const root = document.documentElement;
              
              // Always apply dark mode
              root.classList.add('dark');
              root.classList.remove('light');
              root.style.colorScheme = 'dark';
              root.style.setProperty('background-color', '#0a0a0a', 'important');
              if (document.body) {
                document.body.style.setProperty('background-color', '#0a0a0a', 'important');
                document.body.style.setProperty('color', '#ededed', 'important');
              }
              const nextRoot = document.getElementById('__next');
              if (nextRoot) {
                nextRoot.style.setProperty('background-color', '#0a0a0a', 'important');
                nextRoot.style.setProperty('color', '#ededed', 'important');
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

