'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import {
  BookOpen,
  LayoutDashboard,
  Users,
  PlusCircle,
  Wallet,
  BarChart3,
  Download,
  UserCog,
  Info,
  LogOut,
  Moon,
  Sun,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAppStore, type PageView } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { t } from '@/lib/i18n';

interface NavItem {
  key: PageView;
  labelKey: 'dashboard' | 'customers' | 'addCredit' | 'recordPayment' | 'analytics' | 'exportData' | 'editProfile' | 'appInfo';
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { key: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { key: 'customers', labelKey: 'customers', icon: Users },
  { key: 'add-credit', labelKey: 'addCredit', icon: PlusCircle },
  { key: 'record-payment', labelKey: 'recordPayment', icon: Wallet },
  { key: 'analytics', labelKey: 'analytics', icon: BarChart3 },
  { key: 'export', labelKey: 'exportData', icon: Download },
  { key: 'edit-profile', labelKey: 'editProfile', icon: UserCog },
  { key: 'app-info', labelKey: 'appInfo', icon: Info },
];

function SidebarContent() {
  const { currentPage, setCurrentPage, language, setLanguage, setSidebarOpen } =
    useAppStore();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const emptySubscribe = () => () => {};
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isDark = mounted && resolvedTheme === 'dark';
  const lang = language;

  const handleNavClick = (page: PageView) => {
    setCurrentPage(page);
  };

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
          <BookOpen className="w-5 h-5" />
        </div>
        <h1 className="text-lg font-bold text-foreground">
          {t(lang, 'appName')}
        </h1>
      </div>

      <Separator />

      {/* User info */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {user?.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.name || (language === 'bn' ? 'ব্যবহারকারী' : 'User')}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || ''}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.key;

            return (
              <Button
                key={item.key}
                variant={isActive ? 'secondary' : 'ghost'}
                className={`w-full justify-start gap-3 h-10 px-3 ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => handleNavClick(item.key)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-sm">{t(lang, item.labelKey)}</span>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 space-y-2 border-t mt-auto">
        {/* Dark mode toggle */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2 text-muted-foreground">
            {isDark ? (
              <Moon className="h-4 w-4" />
            ) : mounted ? (
              <Sun className="h-4 w-4" />
            ) : null}
            <span className="text-sm">
              {isDark
                ? t(lang, 'darkMode')
                : t(lang, 'lightMode')}
            </span>
          </div>
          <Switch
            checked={isDark}
            onCheckedChange={(checked) =>
              setTheme(checked ? 'dark' : 'light')
            }
          />
        </div>

        {/* Language toggle */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 px-3 text-muted-foreground hover:text-foreground"
          onClick={toggleLanguage}
        >
          <Globe className="h-4 w-4" />
          <span className="text-sm">
            {language === 'bn' ? 'বাংলা → English' : 'English → বাংলা'}
          </span>
        </Button>

        <Separator />

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">{t(lang, 'logout')}</span>
        </Button>
      </div>
    </div>
  );
}

export default function AppSidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-background border-r z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{t(useAppStore.getState().language, 'appName')}</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
