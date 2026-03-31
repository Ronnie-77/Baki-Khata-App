'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  IndianRupee,
  Crown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { t } from '@/lib/i18n';
import { getAnalytics } from '@/lib/firestore-service';

interface MonthlyData {
  month: string;
  credit: number;
  payment: number;
  net: number;
}

interface TopDebtor {
  id: string;
  name: string;
  code: string;
  netDue: number;
}

interface AnalyticsData {
  totalTransactions: number;
  totalCredit: number;
  totalPaid: number;
  netDue: number;
  monthlyData: MonthlyData[];
  topDebtors: TopDebtor[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const bengaliMonths: Record<string, string> = {
  Jan: 'জানু',
  Feb: 'ফেব্রু',
  Mar: 'মার্চ',
  Apr: 'এপ্রি',
  May: 'মে',
  Jun: 'জুন',
  Jul: 'জুলা',
  Aug: 'আগ',
  Sep: 'সেপ্টে',
  Oct: 'অক্টো',
  Nov: 'নভে',
  Dec: 'ডিসে',
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="relative overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center size-10 rounded-lg ${color}`}
            >
              <Icon className="size-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-bold">{value}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Analytics() {
  const { language, navigateToCustomer } = useAppStore();
  const { user } = useAuthStore();
  const lang = language || 'bn';

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const result = await getAnalytics(user.id);
        setData(result as AnalyticsData);
      } catch {
        // silent fail
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [user]);

  const formatMonth = (month: string) => {
    if (lang === 'bn') {
      const parts = month.split(' ');
      const bnMonth = bengaliMonths[parts[0]] || parts[0];
      return `${bnMonth} ${parts[1]}`;
    }
    return month;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 md:p-6 text-center text-muted-foreground py-20">
        {t(lang, 'noTransactions')}
      </div>
    );
  }

  const chartData = data.monthlyData.map((m) => ({
    ...m,
    month: formatMonth(m.month),
  }));

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-4 md:p-6"
    >
      {/* Page Title */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight">{t(lang, 'analytics')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t(lang, 'appTagline')}
        </p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={BarChart3}
          label={t(lang, 'totalTransactions')}
          value={data.totalTransactions}
          color="bg-blue-500"
        />
        <StatCard
          icon={TrendingUp}
          label={t(lang, 'totalCredit')}
          value={`৳${data.totalCredit.toLocaleString()}`}
          color="bg-red-500"
        />
        <StatCard
          icon={TrendingDown}
          label={t(lang, 'totalPaid')}
          value={`৳${data.totalPaid.toLocaleString()}`}
          color="bg-emerald-500"
        />
        <StatCard
          icon={Wallet}
          label={t(lang, 'netDue')}
          value={`৳${data.netDue.toLocaleString()}`}
          color="bg-orange-500"
        />
      </div>

      {/* Monthly Summary Bar Chart */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5 text-blue-500" />
              {t(lang, 'monthlySummary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-72 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--popover))',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                    formatter={(value: number) => [`৳${value.toLocaleString()}`, '']}
                  />
                  <Legend
                    formatter={(value: string) =>
                      value === 'credit'
                        ? t(lang, 'creditGiven')
                        : t(lang, 'paymentReceived')
                    }
                  />
                  <Bar
                    dataKey="credit"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="payment"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top 5 Debtors Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="size-5 text-amber-500" />
              {t(lang, 'topDebtors')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topDebtors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <IndianRupee className="size-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t(lang, 'noCustomers')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">{t(lang, 'rank')}</TableHead>
                      <TableHead>{t(lang, 'name')}</TableHead>
                      <TableHead>{t(lang, 'customerCode')}</TableHead>
                      <TableHead className="text-right">{t(lang, 'due')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topDebtors.map((debtor, index) => (
                      <TableRow
                        key={debtor.id}
                        className={`cursor-pointer transition-colors ${
                          index === 0
                            ? 'bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40'
                            : ''
                        }`}
                        onClick={() => navigateToCustomer(debtor.id)}
                      >
                        <TableCell>
                          {index === 0 ? (
                            <Badge className="bg-amber-500 text-white border-0">
                              #{index + 1}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground font-medium">
                              #{index + 1}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{debtor.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{debtor.code}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600 dark:text-red-400">
                          ৳{debtor.netDue.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
