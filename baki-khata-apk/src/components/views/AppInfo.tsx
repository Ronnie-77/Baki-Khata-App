'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle2,
  Code2,
  Users,
  BarChart3,
  Shield,
  Smartphone,
  Globe,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/app-store';
import { t } from '@/lib/i18n';

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

const features = [
  {
    icon: Users,
    titleKey: 'customers' as const,
    desc: { bn: 'সহজে গ্রাহক তৈরি ও পরিচালনা করুন', en: 'Create and manage customers easily' },
  },
  {
    icon: BookOpen,
    titleKey: 'addCredit' as const,
    desc: { bn: 'গ্রাহকের বাকি দ্রুত যোগ করুন', en: 'Add customer credit quickly' },
  },
  {
    icon: CheckCircle2,
    titleKey: 'recordPayment' as const,
    desc: { bn: 'পেমেন্ট রেকর্ড ও ট্র্যাক করুন', en: 'Record and track payments' },
  },
  {
    icon: BarChart3,
    titleKey: 'analytics' as const,
    desc: { bn: 'ব্যবসার বিশ্লেষণ ও রিপোর্ট দেখুন', en: 'View business analytics and reports' },
  },
  {
    icon: Globe,
    titleKey: 'exportData' as const,
    desc: { bn: 'ডাটা PDF ও Excel ফরম্যাটে ডাউনলোড', en: 'Download data in PDF & Excel format' },
  },
  {
    icon: Shield,
    titleKey: 'editProfile' as const,
    desc: { bn: 'সুরক্ষিত প্রোফাইল ও পাসওয়ার্ড ব্যবস্থাপনা', en: 'Secure profile & password management' },
  },
  {
    icon: Smartphone,
    titleKey: null,
    titleOverride: { bn: 'রেসপন্সিভ ডিজাইন', en: 'Responsive Design' },
    desc: { bn: 'যেকোনো ডিভাইসে চমৎকারভাবে কাজ করে', en: 'Works beautifully on any device' },
  },
  {
    icon: Sparkles,
    titleKey: null,
    titleOverride: { bn: 'বাংলা সাপোর্ট', en: 'Bengali Support' },
    desc: { bn: 'সম্পূর্ণ বাংলা ভাষায় ব্যবহার করুন', en: 'Full Bengali language support' },
  },
];

export default function AppInfo() {
  const { language } = useAppStore();
  const lang = language || 'bn';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-4 md:p-6"
    >
      {/* Page Title */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight">{t(lang, 'appInfoTitle')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t(lang, 'appTagline')}
        </p>
      </motion.div>

      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* App Info Card */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 p-8 text-white text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="inline-flex items-center justify-center size-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 shadow-lg"
              >
                <BookOpen className="size-10" />
              </motion.div>
              <h2 className="text-3xl font-bold">{t(lang, 'appName')}</h2>
              <p className="text-white/80 text-sm mt-1">{t(lang, 'appTagline')}</p>
              <Badge className="mt-3 bg-white/20 text-white border-white/30 hover:bg-white/30">
                {t(lang, 'appVersion')}: v১.০.০
              </Badge>
            </div>
            <CardContent className="p-6">
              <p className="text-muted-foreground leading-relaxed text-center">
                {t(lang, 'appDescription')}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-5 text-purple-500" />
                {lang === 'bn' ? 'প্রধান ফিচারসমূহ' : 'Key Features'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10 shrink-0">
                        <Icon className="size-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">
                          {feature.titleKey
                            ? t(lang, feature.titleKey)
                            : feature.titleOverride?.[lang] || ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {feature.desc[lang]}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Developer Info Card */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
            <CardContent className="relative p-6">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{
                    background: [
                      'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      'linear-gradient(135deg, #8b5cf6, #ec4899)',
                      'linear-gradient(135deg, #ec4899, #3b82f6)',
                      'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    ],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="flex items-center justify-center size-14 rounded-xl shrink-0"
                >
                  <Code2 className="size-7 text-white" />
                </motion.div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    {t(lang, 'developerInfo')}
                  </p>
                  <p className="text-lg font-bold">{t(lang, 'developerName')}</p>
                  <p className="text-sm text-muted-foreground">{t(lang, 'developerRole')}</p>
                  <p className="text-xs text-primary mt-0.5">{t(lang, 'developerEmail')}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {lang === 'bn'
                    ? 'এই অ্যাপটি Next.js, TypeScript, Tailwind CSS এবং Prisma দিয়ে তৈরি'
                    : 'Built with Next.js, TypeScript, Tailwind CSS & Prisma'}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">Next.js</Badge>
                  <Badge variant="secondary" className="text-xs">TypeScript</Badge>
                  <Badge variant="secondary" className="text-xs">Tailwind</Badge>
                  <Badge variant="secondary" className="text-xs">Prisma</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {t(lang, 'appName')}. {lang === 'bn' ? 'সর্বস্বত্ব সংরক্ষিত' : 'All rights reserved'}.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
