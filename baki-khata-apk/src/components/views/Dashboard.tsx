'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Plus,
  Receipt,
  Users,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { t } from '@/lib/i18n';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { getSummary } from '@/lib/firestore-service';

interface RecentTransaction {
  id: string;
  type: 'CREDIT' | 'PAYMENT';
  amount: number;
  date: string;
  customer: {
    id: string;
    name: string;
    code: string;
  };
}

interface SummaryData {
  totalCredit: number;
  totalPaid: number;
  netDue: number;
  totalCustomers: number;
  recentTransactions: RecentTransaction[];
}

function formatAmount(amount: number, lang: 'bn' | 'en'): string {
  const formatted = lang === 'bn'
    ? amount.toLocaleString('bn-BD')
    : amount.toLocaleString();
  return `৳${formatted}`;
}

function formatDate(dateStr: string, lang: 'bn' | 'en'): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-3 md:p-6">
      {/* Summary cards skeleton - always 3 in a row */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5 md:space-y-3">
                  <Skeleton className="h-3 w-14 md:h-4 md:w-24" />
                  <Skeleton className="h-5 w-16 md:h-8 md:w-32" />
                </div>
                <Skeleton className="h-8 w-8 md:h-12 md:w-12 rounded-lg md:rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Quick actions skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      {/* Recent transactions skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { language, navigateTo, navigateToCustomer } = useAppStore();
  const { user } = useAuthStore();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  async function fetchSummary() {
    if (!user) return;
    try {
      setLoading(true);
      const result = await getSummary(user.id);
      setData(result);
    } catch (err: any) {
      toast.error(err?.message || t(language, 'error'));
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <DashboardSkeleton />;

  const totalCredit = data?.totalCredit ?? 0;
  const totalPaid = data?.totalPaid ?? 0;
  const netDue = data?.netDue ?? 0;
  const totalCustomers = data?.totalCustomers ?? 0;
  const recentTransactions = data?.recentTransactions ?? [];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 p-3 md:p-6"
    >
      {/* Summary Cards - always 3 in one row */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {/* Total Credit */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-0 shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 rounded-xl" />
            <CardContent className="relative p-2 md:p-6">
              {/* Mobile: vertical layout */}
              <div className="flex flex-col items-center text-center gap-1 md:hidden">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                  <ArrowUpRight className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400 leading-tight">
                  {t(language, 'totalCredit')}
                </p>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-200 leading-tight">
                  {formatAmount(totalCredit, language)}
                </p>
              </div>
              {/* Desktop: horizontal layout */}
              <div className="hidden md:flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    {t(language, 'totalCredit')}
                  </p>
                  <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">
                    {formatAmount(totalCredit, language)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
                  <ArrowUpRight className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Paid */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-0 shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 rounded-xl" />
            <CardContent className="relative p-2 md:p-6">
              {/* Mobile: vertical layout */}
              <div className="flex flex-col items-center text-center gap-1 md:hidden">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                  <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 leading-tight">
                  {t(language, 'totalPaid')}
                </p>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200 leading-tight">
                  {formatAmount(totalPaid, language)}
                </p>
              </div>
              {/* Desktop: horizontal layout */}
              <div className="hidden md:flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {t(language, 'totalPaid')}
                  </p>
                  <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                    {formatAmount(totalPaid, language)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
                  <ArrowDownLeft className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Net Due */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-0 shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/40 rounded-xl" />
            <CardContent className="relative p-2 md:p-6">
              {/* Mobile: vertical layout */}
              <div className="flex flex-col items-center text-center gap-1 md:hidden">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/50">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                </div>
                <p className="text-[10px] font-medium text-rose-700 dark:text-rose-400 leading-tight">
                  {t(language, 'netDue')}
                </p>
                <p className="text-xs font-bold text-rose-800 dark:text-rose-200 leading-tight">
                  {formatAmount(netDue, language)}
                </p>
              </div>
              {/* Desktop: horizontal layout */}
              <div className="hidden md:flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-rose-700 dark:text-rose-400">
                    {t(language, 'netDue')}
                  </p>
                  <p className="text-2xl font-bold text-rose-800 dark:text-rose-200">
                    {formatAmount(netDue, language)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/50">
                  <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-semibold mb-3">{t(language, 'quickActions')}</h3>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <Button
            onClick={() => navigateTo('add-credit')}
            className="h-auto py-2.5 px-3 md:py-3 md:px-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md rounded-xl text-xs md:text-sm font-medium"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {t(language, 'addCreditBtn')}
          </Button>
          <Button
            onClick={() => navigateTo('record-payment')}
            className="h-auto py-2.5 px-3 md:py-3 md:px-5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-md rounded-xl text-xs md:text-sm font-medium"
          >
            <Receipt className="h-4 w-4 mr-1.5" />
            {t(language, 'paymentRecordBtn')}
          </Button>
        </div>
      </motion.div>

      {/* Total Customers Stat */}
      <motion.div variants={itemVariants}>
        <Card className="relative border-0 shadow-md">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-950/40 dark:to-cyan-950/40 rounded-xl" />
          <CardContent className="relative py-2 px-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/50 shrink-0">
              <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-sky-600 dark:text-sky-400">
                {t(language, 'totalCustomers')}
              </p>
              <p className="text-lg font-bold text-sky-800 dark:text-sky-200">
                {language === 'bn'
                  ? totalCustomers.toLocaleString('bn-BD')
                  : totalCustomers.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">
              {t(language, 'recentTransactions')}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateTo('customers')}
              className="text-primary"
            >
              {t(language, 'viewAll')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Receipt className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">{t(language, 'noTransactions')}</p>
              </div>
            ) : (
              <>
                {/* Mobile: Card layout */}
                <div className="space-y-2 md:hidden">
                  {recentTransactions.map((txn) => (
                    <button
                      key={txn.id}
                      onClick={() => navigateToCustomer(txn.customer.id)}
                      className="w-full text-left rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{formatDate(txn.date, language)}</span>
                        <Badge
                          className={
                            txn.type === 'CREDIT'
                              ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/40 text-[10px]'
                              : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40 text-[10px]'
                          }
                        >
                          {txn.type === 'CREDIT' ? t(language, 'credit') : t(language, 'payment')}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{txn.customer.name}</p>
                      <p className={`text-sm font-bold text-right ${txn.type === 'CREDIT' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {txn.type === 'CREDIT' ? '+' : '-'}{formatAmount(txn.amount, language)}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Desktop: Table layout */}
                <div className="hidden md:block rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="px-4 text-xs">{t(language, 'date')}</TableHead>
                        <TableHead className="px-4 text-xs">{language === 'bn' ? 'গ্রাহক' : 'Customer'}</TableHead>
                        <TableHead className="px-4 text-xs">{t(language, 'type')}</TableHead>
                        <TableHead className="px-4 text-xs text-right">{t(language, 'amount')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTransactions.map((txn) => (
                        <TableRow
                          key={txn.id}
                          className="cursor-pointer"
                          onClick={() => navigateToCustomer(txn.customer.id)}
                        >
                          <TableCell className="px-4 text-xs">{formatDate(txn.date, language)}</TableCell>
                          <TableCell className="px-4 text-xs font-medium">
                            <button
                              onClick={(e) => { e.stopPropagation(); navigateToCustomer(txn.customer.id); }}
                              className="hover:underline text-primary"
                            >
                              {txn.customer.name}
                            </button>
                          </TableCell>
                          <TableCell className="px-4">
                            <Badge
                              className={
                                txn.type === 'CREDIT'
                                  ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/40 hover:bg-red-100'
                                  : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100'
                              }
                            >
                              {txn.type === 'CREDIT' ? t(language, 'credit') : t(language, 'payment')}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 text-xs text-right font-semibold">
                            <span className={txn.type === 'CREDIT' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>
                              {txn.type === 'CREDIT' ? '+' : '-'}{formatAmount(txn.amount, language)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
