'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Phone,
  Calendar,
  Plus,
  ChevronDown,
  Receipt,
  Save,
  Loader2,
  Package,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { getCustomer, createTransaction } from '@/lib/firestore-service';

interface Transaction {
  id: string;
  type: 'CREDIT' | 'PAYMENT';
  amount: number;
  date: string;
  productName: string | null;
  description: string | null;
}

interface CustomerData {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  totalCredit: number;
  totalPaid: number;
  netDue: number;
  transactionCount: number;
  transactions: Transaction[];
}

function formatAmount(amount: number, lang: 'bn' | 'en'): string {
  if (lang === 'bn') {
    return `৳${amount.toLocaleString('bn-BD')}`;
  }
  return `৳${amount.toLocaleString()}`;
}

function formatDate(dateStr: string, lang: 'bn' | 'en'): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function CustomerProfileSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <Skeleton className="h-9 w-28" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function CustomerProfile() {
  const { language, navigateTo, selectedCustomerId } = useAppStore();
  const { user } = useAuthStore();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Credit form state
  const [creditProductName, setCreditProductName] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDate, setCreditDate] = useState(getTodayDateString());
  const [creditDescription, setCreditDescription] = useState('');

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomer();
    }
  }, [selectedCustomerId]);

  async function fetchCustomer() {
    if (!selectedCustomerId || !user) return;
    try {
      setLoading(true);
      const data = await getCustomer(user.id, selectedCustomerId);
      if (data) {
        setCustomer(data as CustomerData);
      } else {
        toast.error(t(language, 'error'));
        navigateTo('customers');
      }
    } catch (err: any) {
      toast.error(err?.message || t(language, 'error'));
      navigateTo('customers');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCredit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomerId || !user || !creditAmount || parseFloat(creditAmount) <= 0) {
      toast.error(language === 'bn' ? 'পরিমাণ দিন' : 'Enter amount');
      return;
    }
    try {
      setSubmitting(true);
      await createTransaction(user.id, {
        customerId: selectedCustomerId,
        type: 'CREDIT',
        amount: parseFloat(creditAmount),
        productName: creditProductName || undefined,
        description: creditDescription || undefined,
        date: creditDate || undefined,
      });
      toast.success(t(language, 'creditAdded'));
      setCreditProductName('');
      setCreditAmount('');
      setCreditDescription('');
      setCreditDate(getTodayDateString());
      setCreditOpen(false);
      fetchCustomer();
    } catch (err: any) {
      toast.error(err?.message || t(language, 'error'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomerId || !user || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error(language === 'bn' ? 'পেমেন্টের পরিমাণ দিন' : 'Enter payment amount');
      return;
    }
    if (customer && parseFloat(paymentAmount) > customer.netDue) {
      toast.error(
        language === 'bn'
          ? `পেমেন্ট বকেয়ার চেয়ে বেশি হতে পারে নেই (বকেয়া: ${formatAmount(customer.netDue, language)})`
          : `Payment cannot exceed current due (Due: ${formatAmount(customer.netDue, language)})`
      );
      return;
    }
    try {
      setSubmitting(true);
      await createTransaction(user.id, {
        customerId: selectedCustomerId,
        type: 'PAYMENT',
        amount: parseFloat(paymentAmount),
        date: paymentDate || undefined,
      });
      toast.success(t(language, 'paymentRecorded'));
      setPaymentAmount('');
      setPaymentDate(getTodayDateString());
      setPaymentOpen(false);
      fetchCustomer();
    } catch (err: any) {
      toast.error(err?.message || t(language, 'error'));
    } finally {
      setSubmitting(false);
    }
  }

  // Calculate running balance for transaction history
  function getRunningBalances(transactions: Transaction[]): number[] {
    // Transactions come in date desc order, we reverse to calc running balance
    const reversed = [...transactions].reverse();
    const balances: number[] = [];
    let running = 0;
    for (const txn of reversed) {
      if (txn.type === 'CREDIT') {
        running += txn.amount;
      } else {
        running -= txn.amount;
      }
      balances.push(running);
    }
    // Reverse back to match original order
    return balances.reverse();
  }

  if (loading) return <CustomerProfileSkeleton />;
  if (!customer) return null;

  const runningBalances = getRunningBalances(customer.transactions);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 p-4 md:p-6"
    >
      {/* Back button */}
      <motion.div variants={itemVariants}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateTo('customers')}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          {t(language, 'back')}
        </Button>
      </motion.div>

      {/* Customer Header Card */}
      <motion.div variants={itemVariants}>
        <Card className="relative border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/50 dark:via-amber-950/50 dark:to-yellow-950/50" />
          <CardContent className="relative p-5 md:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Avatar */}
              <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xl md:text-2xl font-bold shrink-0 shadow-lg shadow-orange-500/25">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg md:text-xl font-bold text-foreground">{customer.name}</h2>
                <div className="flex flex-col sm:flex-row items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {customer.code}
                  </Badge>
                  {customer.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2 md:gap-3 mt-5">
              <div className="rounded-xl bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-amber-200/60 dark:border-amber-700/30 p-2.5 md:p-3 text-center shadow-sm">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ArrowUpRight className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-[10px] md:text-xs font-medium text-amber-700 dark:text-amber-400">
                    {t(language, 'totalCredit')}
                  </span>
                </div>
                <p className="text-xs md:text-sm font-bold text-amber-800 dark:text-amber-200">
                  {formatAmount(customer.totalCredit, language)}
                </p>
              </div>
              <div className="rounded-xl bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-emerald-200/60 dark:border-emerald-700/30 p-2.5 md:p-3 text-center shadow-sm">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[10px] md:text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {t(language, 'totalPaid')}
                  </span>
                </div>
                <p className="text-xs md:text-sm font-bold text-emerald-800 dark:text-emerald-200">
                  {formatAmount(customer.totalPaid, language)}
                </p>
              </div>
              <div className="rounded-xl bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-rose-200/60 dark:border-rose-700/30 p-2.5 md:p-3 text-center shadow-sm">
                <span className="text-[10px] md:text-xs font-medium text-rose-700 dark:text-rose-400 block mb-1">
                  {t(language, 'netDue')}
                </span>
                <p className="text-xs md:text-sm font-bold text-rose-800 dark:text-rose-200">
                  {formatAmount(customer.netDue, language)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Credit Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-md">
          <Collapsible open={creditOpen} onOpenChange={setCreditOpen}>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                      <Plus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <CardTitle className="text-sm font-semibold">
                      {t(language, 'addCreditForm')}
                    </CardTitle>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                      creditOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <AnimatePresence>
              {creditOpen && (
                <CollapsibleContent forceMount>
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="pt-0 pb-6 px-6">
                      <form onSubmit={handleAddCredit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {t(language, 'productName')}
                            </label>
                            <Input
                              value={creditProductName}
                              onChange={(e) => setCreditProductName(e.target.value)}
                              placeholder={language === 'bn' ? 'পণ্যের নাম (ঐচ্ছিক)' : 'Product name (optional)'}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              {t(language, 'creditAmount')} *
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={creditAmount}
                              onChange={(e) => setCreditAmount(e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {t(language, 'creditDate')}
                            </label>
                            <Input
                              type="date"
                              value={creditDate}
                              onChange={(e) => setCreditDate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {t(language, 'description')}
                            </label>
                            <Input
                              value={creditDescription}
                              onChange={(e) => setCreditDescription(e.target.value)}
                              placeholder={language === 'bn' ? 'বিবরণ (ঐচ্ছিক)' : 'Description (optional)'}
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                        >
                          {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Save className="h-4 w-4 mr-1" />
                          )}
                          {t(language, 'saveCredit')}
                        </Button>
                      </form>
                    </CardContent>
                  </motion.div>
                </CollapsibleContent>
              )}
            </AnimatePresence>
          </Collapsible>
        </Card>
      </motion.div>

      {/* Record Payment Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-md">
          <Collapsible open={paymentOpen} onOpenChange={setPaymentOpen}>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                      <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <CardTitle className="text-sm font-semibold">
                      {t(language, 'paymentForm')}
                    </CardTitle>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                      paymentOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <AnimatePresence>
              {paymentOpen && (
                <CollapsibleContent forceMount>
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="pt-0 pb-6 px-6">
                      <div className="flex items-center justify-between rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800/30 px-4 py-2.5 mb-4">
                        <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                          {t(language, 'currentDue')}
                        </span>
                        <span className="text-base font-bold text-rose-800 dark:text-rose-200">
                          {formatAmount(customer.netDue, language)}
                        </span>
                      </div>
                      <form onSubmit={handleRecordPayment} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              {t(language, 'paymentAmount')} *
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max={customer.netDue}
                              required
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {t(language, 'creditDate')}
                            </label>
                            <Input
                              type="date"
                              value={paymentDate}
                              onChange={(e) => setPaymentDate(e.target.value)}
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          disabled={submitting || customer.netDue <= 0}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                          {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Save className="h-4 w-4 mr-1" />
                          )}
                          {t(language, 'savePayment')}
                        </Button>
                      </form>
                    </CardContent>
                  </motion.div>
                </CollapsibleContent>
              )}
            </AnimatePresence>
          </Collapsible>
        </Card>
      </motion.div>

      {/* Transaction History */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t(language, 'transactionHistory')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {customer.transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Receipt className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">{t(language, 'noTransactions')}</p>
              </div>
            ) : (
              <>
                {/* Mobile: Card layout */}
                <div className="space-y-2 md:hidden">
                  {customer.transactions.map((txn, index) => (
                    <div key={txn.id} className="rounded-lg border p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{formatDate(txn.date, language)}</span>
                        <Badge className={
                          txn.type === 'CREDIT'
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/40 text-[10px]'
                            : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40 text-[10px]'
                        }>
                          {txn.type === 'CREDIT' ? t(language, 'credit') : t(language, 'payment')}
                        </Badge>
                      </div>
                      {txn.productName && (
                        <p className="text-xs text-muted-foreground truncate">{txn.productName}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {t(language, 'balance')}: {formatAmount(runningBalances[index], language)}
                        </span>
                        <span className={`text-sm font-bold ${txn.type === 'CREDIT' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {txn.type === 'CREDIT' ? '+' : '-'}{formatAmount(txn.amount, language)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: Table layout */}
                <div className="hidden md:block max-h-96 overflow-y-auto rounded-lg border scrollbar-thin scrollbar-thumb-muted-foreground/20">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow className="bg-muted/50">
                        <TableHead className="px-3 text-xs">{t(language, 'date')}</TableHead>
                        <TableHead className="px-3 text-xs">{t(language, 'type')}</TableHead>
                        <TableHead className="px-3 text-xs">{t(language, 'productName')}</TableHead>
                        <TableHead className="px-3 text-xs text-right">{t(language, 'amount')}</TableHead>
                        <TableHead className="px-3 text-xs text-right">{t(language, 'balance')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.transactions.map((txn, index) => (
                        <TableRow key={txn.id}>
                          <TableCell className="px-3 text-xs">{formatDate(txn.date, language)}</TableCell>
                          <TableCell className="px-3">
                            <Badge className={
                              txn.type === 'CREDIT'
                                ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/40 hover:bg-red-100 text-[10px]'
                                : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 text-[10px]'
                            }>
                              {txn.type === 'CREDIT' ? t(language, 'credit') : t(language, 'payment')}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-3 text-xs text-muted-foreground">{txn.productName || '—'}</TableCell>
                          <TableCell className={`px-3 text-xs text-right font-semibold ${txn.type === 'CREDIT' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {txn.type === 'CREDIT' ? '+' : '-'}{formatAmount(txn.amount, language)}
                          </TableCell>
                          <TableCell className="px-3 text-xs text-right font-medium text-muted-foreground">{formatAmount(runningBalances[index], language)}</TableCell>
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
