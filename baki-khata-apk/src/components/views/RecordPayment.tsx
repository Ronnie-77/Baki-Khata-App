'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CreditCard, Loader2, CalendarDays, FileText, IndianRupee, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { t } from '@/lib/i18n';
import { getCustomers, createTransaction } from '@/lib/firestore-service';

interface CustomerOption {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  netDue: number;
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

export default function RecordPayment() {
  const { language, navigateToCustomer } = useAppStore();
  const { user } = useAuthStore();
  const lang = language || 'bn';

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const results = await getCustomers(user.id);
        setCustomers(results || []);
      } catch {
        // silent fail
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, [user]);

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const customer = customers.find((c) => c.id === customerId);
    setSelectedCustomer(customer || null);
    setPaymentAmount('');
    setErrors((prev) => ({ ...prev, customer: '', amount: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedCustomerId) {
      newErrors.customer = t(lang, 'required');
    }
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      newErrors.amount = t(lang, 'required');
    } else if (selectedCustomer && parseFloat(paymentAmount) > selectedCustomer.netDue) {
      newErrors.amount = `Maximum: ৳${selectedCustomer.netDue.toLocaleString()}`;
    }
    if (!date) {
      newErrors.date = t(lang, 'required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;

    setIsSubmitting(true);
    try {
      await createTransaction(user.id, {
        customerId: selectedCustomerId,
        type: 'PAYMENT',
        amount: parseFloat(paymentAmount),
        date,
        description: description.trim() || undefined,
      });

      toast.success(t(lang, 'paymentRecorded'));
      navigateToCustomer(selectedCustomerId);
    } catch (err: any) {
      toast.error(err?.message || t(lang, 'error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-4 md:p-6"
    >
      {/* Page Title */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight">{t(lang, 'recordPayment')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t(lang, 'selectCustomerForPayment')}
        </p>
      </motion.div>

      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Customer Selection Card */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5 text-blue-500" />
                {t(lang, 'selectCustomerForPayment')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Select
                  value={selectedCustomerId}
                  onValueChange={handleCustomerSelect}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t(lang, 'selectCustomer')} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.length === 0 ? (
                      <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                        {t(lang, 'noCustomers')}
                      </div>
                    ) : (
                      customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center justify-between w-full gap-4">
                            <span>{customer.name}</span>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {customer.code}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              {errors.customer && (
                <p className="text-destructive text-xs">{errors.customer}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Selected Customer Info + Payment Form */}
        {selectedCustomer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Current Due Card */}
            <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t(lang, 'currentDue')}</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      ৳{selectedCustomer.netDue.toLocaleString()}
                    </p>
                  </div>
                  <AlertCircle className="size-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            {/* Payment Form Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="size-5 text-emerald-500" />
                  {t(lang, 'paymentForm')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Payment Amount */}
                <div className="space-y-2">
                  <Label htmlFor="payment-amount" className="flex items-center gap-2">
                    <IndianRupee className="size-4" />
                    {t(lang, 'paymentAmount')} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      ৳
                    </span>
                    <Input
                      id="payment-amount"
                      type="number"
                      min="0"
                      max={selectedCustomer.netDue}
                      step="0.01"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => {
                        setPaymentAmount(e.target.value);
                        setErrors((prev) => ({ ...prev, amount: '' }));
                      }}
                      className="pl-8"
                      disabled={isSubmitting}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {lang === 'bn' ? 'সর্বোচ্চ' : 'Max'}: ৳{selectedCustomer.netDue.toLocaleString()}
                  </p>
                  {errors.amount && (
                    <p className="text-destructive text-xs">{errors.amount}</p>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="payment-date" className="flex items-center gap-2">
                    <CalendarDays className="size-4" />
                    {t(lang, 'creditDate')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="payment-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.date && (
                    <p className="text-destructive text-xs">{errors.date}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="payment-desc" className="flex items-center gap-2">
                    <FileText className="size-4" />
                    {t(lang, 'description')}
                  </Label>
                  <Textarea
                    id="payment-desc"
                    placeholder={t(lang, 'description')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    rows={3}
                  />
                </div>

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full h-11 text-base"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t(lang, 'loading')}
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-4" />
                      {t(lang, 'savePayment')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
