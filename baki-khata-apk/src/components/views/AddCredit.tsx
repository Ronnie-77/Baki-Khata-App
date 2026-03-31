'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Search, UserPlus, Loader2, Package, CalendarDays, FileText, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { t } from '@/lib/i18n';
import { getCustomers, createCustomer, createTransaction } from '@/lib/firestore-service';

interface CustomerSearch {
  id: string;
  name: string;
  phone: string | null;
  code: string;
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

export default function AddCredit() {
  const { language, navigateToCustomer } = useAppStore();
  const { user } = useAuthStore();
  const lang = language || 'bn';

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [productName, setProductName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearch | null>(null);
  const [searchResults, setSearchResults] = useState<CustomerSearch[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCustomers = useCallback(
    async (searchTerm: string) => {
      if (!user || searchTerm.length < 1) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await getCustomers(user.id, searchTerm);
        setSearchResults(results || []);
        setShowDropdown(true);
      } catch {
        // silently fail
      } finally {
        setIsSearching(false);
      }
    },
    [user]
  );

  const handleNameChange = (value: string) => {
    setCustomerName(value);
    setSelectedCustomer(null);
    setCustomerPhone('');
    setErrors((prev) => ({ ...prev, customerName: '' }));

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCustomers(value.trim());
    }, 300);
  };

  const selectCustomer = (customer: CustomerSearch) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || '');
    setShowDropdown(false);
    setSearchResults([]);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!customerName.trim()) {
      newErrors.customerName = t(lang, 'required');
    }
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = t(lang, 'required');
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
      let customerId = selectedCustomer?.id;

      if (!customerId) {
        // Create new customer
        const newCustomer = await createCustomer(user.id, {
          name: customerName.trim(),
          phone: customerPhone.trim() || undefined,
        });
        customerId = newCustomer.id;
      }

      // Create transaction
      await createTransaction(user.id, {
        customerId,
        type: 'CREDIT',
        amount: parseFloat(amount),
        productName: productName.trim() || undefined,
        date,
        description: description.trim() || undefined,
      });

      toast.success(t(lang, 'creditAdded'));
      navigateToCustomer(customerId!);
    } catch (err: any) {
      toast.error(err?.message || t(lang, 'error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-4 md:p-6"
    >
      {/* Page Title */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight">{t(lang, 'addCredit')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t(lang, 'appTagline')}
        </p>
      </motion.div>

      {/* Form Card */}
      <motion.div variants={itemVariants}>
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5 text-orange-500" />
              {t(lang, 'addCreditForm')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Customer Search */}
            <div className="space-y-2" ref={searchRef}>
              <Label htmlFor="customer-name">
                {t(lang, 'customerName')} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="customer-name"
                  placeholder={t(lang, 'selectCustomer')}
                  value={customerName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="pl-9"
                  disabled={isSubmitting}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <AnimatePresence>
                {showDropdown && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute z-50 w-full max-w-[calc(100%-3rem)] bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto"
                    style={{ marginLeft: '3rem' }}
                  >
                    {searchResults.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-accent text-sm transition-colors text-left"
                        onClick={() => selectCustomer(customer)}
                      >
                        <div>
                          <span className="font-medium">{customer.name}</span>
                          {customer.phone && (
                            <span className="text-muted-foreground ml-2 text-xs">
                              {customer.phone}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {customer.code}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {selectedCustomer && (
                <div className="flex items-center gap-2 text-xs text-emerald-600">
                  <UserPlus className="size-3" />
                  <span>
                    {t(lang, 'existingCustomer')}: {selectedCustomer.name} ({selectedCustomer.code})
                  </span>
                </div>
              )}
              {errors.customerName && (
                <p className="text-destructive text-xs">{errors.customerName}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="customer-phone">{t(lang, 'phone')}</Label>
              <Input
                id="customer-phone"
                placeholder={t(lang, 'phone')}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                readOnly={!!selectedCustomer}
                disabled={!!selectedCustomer || isSubmitting}
                className={selectedCustomer ? 'bg-muted' : ''}
              />
            </div>

            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="product-name" className="flex items-center gap-2">
                <Package className="size-4" />
                {t(lang, 'productName')}
              </Label>
              <Input
                id="product-name"
                placeholder="e.g., চাল ১০ কেজি"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="credit-amount" className="flex items-center gap-2">
                <IndianRupee className="size-4" />
                {t(lang, 'creditAmount')} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  ৳
                </span>
                <Input
                  id="credit-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                  className="pl-8"
                  disabled={isSubmitting}
                />
              </div>
              {errors.amount && (
                <p className="text-destructive text-xs">{errors.amount}</p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="credit-date" className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                {t(lang, 'creditDate')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="credit-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setErrors((prev) => ({ ...prev, date: '' }));
                }}
                disabled={isSubmitting}
              />
              {errors.date && (
                <p className="text-destructive text-xs">{errors.date}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="credit-desc" className="flex items-center gap-2">
                <FileText className="size-4" />
                {t(lang, 'description')}
              </Label>
              <Textarea
                id="credit-desc"
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
              className="w-full h-11 text-base bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t(lang, 'loading')}
                </>
              ) : (
                <>
                  <Package className="size-4" />
                  {t(lang, 'saveCredit')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
