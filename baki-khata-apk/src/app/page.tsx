'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import AuthPage from '@/components/views/AuthPage';
import Dashboard from '@/components/views/Dashboard';
import CustomerList from '@/components/views/CustomerList';
import CustomerProfile from '@/components/views/CustomerProfile';
import AddCredit from '@/components/views/AddCredit';
import RecordPayment from '@/components/views/RecordPayment';
import Analytics from '@/components/views/Analytics';
import ExportData from '@/components/views/ExportData';
import EditProfile from '@/components/views/EditProfile';
import AppInfo from '@/components/views/AppInfo';
import AppLayout from '@/components/layout/AppLayout';

export default function Home() {
  const { isAuthenticated, loading } = useAuthStore();
  const { currentPage } = useAppStore();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Render authenticated views with layout
  return (
    <main className="min-h-screen bg-background">
      <AppLayout>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {currentPage === 'dashboard' && <Dashboard />}
            {currentPage === 'customers' && <CustomerList />}
            {currentPage === 'customer-profile' && <CustomerProfile />}
            {currentPage === 'add-credit' && <AddCredit />}
            {currentPage === 'record-payment' && <RecordPayment />}
            {currentPage === 'analytics' && <Analytics />}
            {currentPage === 'export' && <ExportData />}
            {currentPage === 'edit-profile' && <EditProfile />}
            {currentPage === 'app-info' && <AppInfo />}
          </motion.div>
        </AnimatePresence>
      </AppLayout>
    </main>
  );
}
