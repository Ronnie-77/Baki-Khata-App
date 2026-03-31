import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'bn' | 'en';
export type PageView =
  | 'dashboard'
  | 'customers'
  | 'customer-profile'
  | 'add-credit'
  | 'record-payment'
  | 'analytics'
  | 'export'
  | 'edit-profile'
  | 'app-info';

interface AppState {
  currentPage: PageView;
  sidebarOpen: boolean;
  language: Language;
  selectedCustomerId: string | null;
  setCurrentPage: (page: PageView) => void;
  navigateTo: (page: PageView) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setLanguage: (lang: Language) => void;
  setSelectedCustomerId: (id: string | null) => void;
  navigateToCustomer: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentPage: 'dashboard',
      sidebarOpen: false,
      language: 'bn',
      selectedCustomerId: null,
      setCurrentPage: (page) => set({ currentPage: page, sidebarOpen: false }),
      navigateTo: (page) => set({ currentPage: page, sidebarOpen: false }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setLanguage: (lang) => set({ language: lang }),
      setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
      navigateToCustomer: (id) =>
        set({
          currentPage: 'customer-profile',
          selectedCustomerId: id,
          sidebarOpen: false,
        }),
    }),
    {
      name: 'baki-khata-app',
      partialize: (state) => ({ language: state.language }),
    }
  )
);
