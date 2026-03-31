'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Menu, Moon, Sun, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore, type PageView } from '@/store/app-store';
import { t, type TranslationKey } from '@/lib/i18n';
import AppSidebar from './AppSidebar';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

const pageTitles: Record<PageView, TranslationKey> = {
  'dashboard': 'dashboard',
  'customers': 'customers',
  'customer-profile': 'customerProfile',
  'add-credit': 'addCredit',
  'record-payment': 'recordPayment',
  'analytics': 'analytics',
  'export': 'exportData',
  'edit-profile': 'editProfile',
  'app-info': 'appInfo',
};

export default function AppLayout({ children }: AppLayoutProps) {
  const { currentPage, language, setLanguage, toggleSidebar } = useAppStore();
  const { setTheme, resolvedTheme } = useTheme();
  const emptySubscribe = () => () => {};
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isDark = mounted && resolvedTheme === 'dark';
  const titleKey = pageTitles[currentPage] || 'dashboard';

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      {/* Main content area */}
      <div className="md:ml-64 min-h-screen flex flex-col transition-all duration-200">
        {/* Top bar - hidden on mobile (bottom nav handles it) */}
        <header className="hidden md:block sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b">
          <div className="flex items-center justify-between h-14 px-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                {t(language, titleKey)}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Globe className="h-4 w-4" />
                <span className="text-xs font-medium">
                  {language === 'bn' ? 'EN' : 'BN'}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="text-muted-foreground hover:text-foreground"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : mounted ? (
                  <Moon className="h-4 w-4" />
                ) : null}
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile top bar - just hamburger + title + controls */}
        <header className="md:hidden sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b">
          <div className="flex items-center justify-between h-12 px-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-sm font-semibold text-foreground truncate flex-1 text-center">
              {t(language, titleKey)}
            </h2>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
              >
                <span className="text-[10px] font-bold">
                  {language === 'bn' ? 'EN' : 'BN'}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : mounted ? (
                  <Moon className="h-4 w-4" />
                ) : null}
              </Button>
            </div>
          </div>
        </header>

        {/* Content area - with bottom padding for mobile nav */}
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom Navigation - mobile only */}
      <BottomNav />
    </div>
  );
}
