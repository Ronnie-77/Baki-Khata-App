'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Users,
  User,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/lib/i18n';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { getCustomers, getSummary } from '@/lib/firestore-service';

interface Customer {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  netDue: number;
  totalCredit: number;
  totalPaid: number;
  transactionCount: number;
  createdAt: string;
}

interface SummaryData {
  totalCredit: number;
  totalPaid: number;
  netDue: number;
  totalCustomers: number;
}

function formatAmount(amount: number, lang: 'bn' | 'en'): string {
  if (lang === 'bn') {
    return `৳${amount.toLocaleString('bn-BD')}`;
  }
  return `৳${amount.toLocaleString()}`;
}

function getDueColor(netDue: number): string {
  if (netDue <= 0) return 'emerald';
  if (netDue <= 5000) return 'amber';
  return 'red';
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function CustomerListSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      {/* Summary stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      {/* Customer cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function CustomerList() {
  const { language, navigateTo, navigateToCustomer } = useAppStore();
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    if (!user) return;
    try {
      setLoading(true);
      const [customersData, summaryData] = await Promise.all([
        getCustomers(user.id),
        getSummary(user.id),
      ]);
      setCustomers(customersData);
      setSummary(summaryData);
    } catch (err: any) {
      toast.error(err?.message || t(language, 'error'));
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [customers, searchQuery]);

  if (loading) return <CustomerListSkeleton />;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 p-4 md:p-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <h2 className="text-xl font-bold">{t(language, 'customerList')}</h2>
        <Button
          onClick={() => navigateTo('add-credit')}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {t(language, 'newCustomer')}
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t(language, 'searchCustomer')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </motion.div>

      {/* Summary stat cards */}
      {summary && (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-3 gap-3"
        >
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 p-4 text-center">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {t(language, 'totalCredit')}
            </p>
            <p className="text-base font-bold text-amber-800 dark:text-amber-200 mt-1">
              {formatAmount(summary.totalCredit, language)}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 p-4 text-center">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {t(language, 'totalPaid')}
            </p>
            <p className="text-base font-bold text-emerald-800 dark:text-emerald-200 mt-1">
              {formatAmount(summary.totalPaid, language)}
            </p>
          </div>
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 p-4 text-center">
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {t(language, 'netDue')}
            </p>
            <p className="text-base font-bold text-rose-800 dark:text-rose-200 mt-1">
              {formatAmount(summary.netDue, language)}
            </p>
          </div>
        </motion.div>
      )}

      {/* Customer Cards Grid */}
      {filteredCustomers.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center justify-center py-16 text-muted-foreground"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
            <Users className="h-10 w-10 opacity-40" />
          </div>
          <p className="text-sm font-medium">
            {searchQuery
              ? t(language, 'searchCustomer')
              : t(language, 'noCustomers')}
          </p>
          {!searchQuery && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigateTo('add-credit')}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t(language, 'newCustomer')}
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            const dueColor = getDueColor(customer.netDue);
            const borderColor =
              dueColor === 'emerald'
                ? 'border-l-emerald-500'
                : dueColor === 'amber'
                ? 'border-l-amber-500'
                : 'border-l-red-500';
            const bgColor =
              dueColor === 'emerald'
                ? 'bg-emerald-50 dark:bg-emerald-950/40'
                : dueColor === 'amber'
                ? 'bg-amber-50 dark:bg-amber-950/40'
                : 'bg-rose-50 dark:bg-rose-950/40';
            const textColor =
              dueColor === 'emerald'
                ? 'text-emerald-700 dark:text-emerald-400'
                : dueColor === 'amber'
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-rose-700 dark:text-rose-400';

            return (
              <motion.div key={customer.id} variants={itemVariants}>
                <Card
                  className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${borderColor}`}
                  onClick={() => navigateToCustomer(customer.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm leading-tight">
                            {customer.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {customer.code}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
                    </div>

                    {customer.phone && (
                      <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{customer.phone}</span>
                      </div>
                    )}

                    <div
                      className={`flex items-center justify-between rounded-lg ${bgColor} px-3 py-2`}
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        {t(language, 'due')}
                      </span>
                      <span className={`text-sm font-bold ${textColor}`}>
                        {formatAmount(customer.netDue, language)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
