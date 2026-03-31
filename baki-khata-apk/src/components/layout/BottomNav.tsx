'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  Wallet,
  BarChart3,
} from 'lucide-react';
import { useAppStore, type PageView } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { t } from '@/lib/i18n';

interface BottomNavItem {
  key: PageView;
  labelKey: 'dashboard' | 'customers' | 'addCredit' | 'recordPayment' | 'analytics';
  icon: React.ElementType;
}

const bottomNavItems: BottomNavItem[] = [
  { key: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { key: 'customers', labelKey: 'customers', icon: Users },
  { key: 'add-credit', labelKey: 'addCredit', icon: PlusCircle },
  { key: 'record-payment', labelKey: 'recordPayment', icon: Wallet },
  { key: 'analytics', labelKey: 'analytics', icon: BarChart3 },
];

export default function BottomNav() {
  const { currentPage, setCurrentPage } = useAppStore();
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const lang = language;

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t bg-background/95 backdrop-blur-lg safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.key;

          return (
            <button
              key={item.key}
              onClick={() => setCurrentPage(item.key)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
              <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-medium leading-tight">
                {t(lang, item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
