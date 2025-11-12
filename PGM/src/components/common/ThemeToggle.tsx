'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    console.log('🔄 Changing theme to:', newTheme);
    setTheme(newTheme);
    // Force a small delay to see the change
    setTimeout(() => {
      console.log('✅ Theme changed. Current theme:', newTheme);
      console.log('📊 HTML classes:', document.documentElement.classList.toString());
    }, 100);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200"
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="h-5 w-5 text-gray-200 dark:text-gray-200" />
          ) : (
            <Sun className="h-5 w-5 text-gray-700 dark:text-gray-200" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => handleThemeChange('light')}
          className={cn(
            'cursor-pointer text-gray-900 dark:text-gray-100',
            theme === 'light' && 'bg-gray-100 dark:bg-gray-800'
          )}
        >
          <Sun className="mr-2 h-4 w-4 text-gray-700 dark:text-gray-200" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange('dark')}
          className={cn(
            'cursor-pointer text-gray-900 dark:text-gray-100',
            theme === 'dark' && 'bg-gray-100 dark:bg-gray-800'
          )}
        >
          <Moon className="mr-2 h-4 w-4 text-gray-700 dark:text-gray-200" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange('system')}
          className={cn(
            'cursor-pointer text-gray-900 dark:text-gray-100',
            theme === 'system' && 'bg-gray-100 dark:bg-gray-800'
          )}
        >
          <Monitor className="mr-2 h-4 w-4 text-gray-700 dark:text-gray-200" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

