'use client';

import { useState, useSyncExternalStore, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import {
  BookOpen, Mail, Lock, User, Phone, Eye, EyeOff,
  Moon, Sun, ArrowLeft, Loader2, Search, CheckCircle2, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore, loginUser, signupUser } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { t } from '@/lib/i18n';
import { sendResetEmail } from '@/lib/firestore-service';
import { collection, getDocs, query, where, getFirestore } from 'firebase/firestore';
import BackgroundDecoration from '@/components/layout/BackgroundDecoration';

type AuthView = 'login' | 'signup' | 'forgot-password';

export default function AuthPage() {
  const { isAuthenticated, loading, initializeAuth } = useAuthStore();
  const { language, setLanguage } = useAppStore();
  const { setTheme, resolvedTheme } = useTheme();
  const emptySubscribe = () => () => {};
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isDark = mounted && resolvedTheme === 'dark';

  // Initialize Firebase auth listener
  useEffect(() => {
    const unsub = initializeAuth();
    return unsub;
  }, []);

  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [password, setLoginPassword] = useState('');

  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // Forgot password
  const [forgotLogin, setForgotLogin] = useState('');
  const [foundUser, setFoundUser] = useState<{ name: string; email: string; phone: string | null; uid: string } | null>(null);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const lang = language;

  // Firebase Auth - Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !password) {
      toast.error(t(lang, 'required'));
      return;
    }

    setIsLoading(true);
    try {
      await loginUser(loginEmail, password);
      toast.success(t(lang, 'success'));
    } catch (err: any) {
      const msg = err?.code === 'auth/user-not-found'
        ? (lang === 'bn' ? 'এই ইমেইলে কোনো একাউন্ট নেই' : 'No account found with this email')
        : err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential'
        ? (lang === 'bn' ? 'পাসওয়ার্ড সঠিক নয়' : 'Incorrect password')
        : err?.code === 'auth/invalid-email'
        ? (lang === 'bn' ? 'সঠিক ইমেইল দিন' : 'Enter a valid email')
        : err?.message || t(lang, 'error');
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Auth - Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword) {
      toast.error(t(lang, 'required'));
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      toast.error(lang === 'bn' ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match');
      return;
    }
    if (signupPassword.length < 6) {
      toast.error(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await signupUser(signupName, signupEmail, signupPassword, signupPhone);
      toast.success(t(lang, 'success'));
    } catch (err: any) {
      const msg = err?.code === 'auth/email-already-in-use'
        ? (lang === 'bn' ? 'এই ইমেইলে আগেই একাউন্ট আছে' : 'An account already exists with this email')
        : err?.code === 'auth/weak-password'
        ? (lang === 'bn' ? 'পাসওয়ার্ড দুর্বল' : 'Password is too weak')
        : err?.code === 'auth/invalid-email'
        ? (lang === 'bn' ? 'সঠিক ইমেইল দিন' : 'Enter a valid email')
        : err?.message || t(lang, 'error');
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password - Step 1: Find account (search Firestore)
  const handleFindAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotLogin) {
      toast.error(lang === 'bn' ? 'ইমেইল দিন' : 'Enter email');
      return;
    }

    setIsLoading(true);
    try {
      // Search Firestore for user by email
      // Since Firebase Auth users collection may not be searchable by email directly,
      // we use sendPasswordResetEmail which will succeed if user exists
      await sendResetEmail(forgotLogin);
      // If no error, account exists
      setFoundUser({ name: 'User', email: forgotLogin, phone: null, uid: '' });
      setForgotStep(2);
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found') {
        toast.error(lang === 'bn' ? 'এই ইমেইলে কোনো একাউন্ট নেই' : 'No account found with this email');
      } else {
        toast.error(t(lang, 'error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password - Step 2: Just show success (Firebase sends reset email)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStep(3);
  };

  const resetForgotForm = () => {
    setForgotLogin('');
    setFoundUser(null);
    setForgotStep(1);
    setNewPassword('');
    setConfirmNewPassword('');
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  };

  const handleForgotBackToLogin = () => {
    resetForgotForm();
    setCurrentView('login');
  };

  const getPasswordStrength = (pw: string): number => {
    if (!pw) return 0;
    if (pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw)) return 4;
    if (pw.length >= 6) return 2;
    return 1;
  };

  const getStrengthLabel = (pw: string): string => {
    const s = getPasswordStrength(pw);
    if (s === 0) return '';
    if (lang === 'bn') { return s <= 1 ? 'দুর্বল' : s <= 2 ? 'মাঝারি' : 'শক্তিশালী'; }
    return s <= 1 ? 'Weak' : s <= 2 ? 'Medium' : 'Strong';
  };

  const getStrengthColor = (pw: string): string => {
    const s = getPasswordStrength(pw);
    if (s <= 1) return 'bg-red-500';
    if (s <= 2) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const toggleLanguage = () => setLanguage(language === 'bn' ? 'en' : 'bn');
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const variants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  // Don't render auth page if already authenticated
  if (isAuthenticated) return null;

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF7ED] dark:bg-[#1C1410]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Top-right controls for mobile */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleLanguage}
          className="rounded-full backdrop-blur-sm bg-white/80 dark:bg-black/40 border-white/30 dark:border-white/10"
        >
          <span className="text-xs font-bold">{language === 'bn' ? 'EN' : 'BN'}</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full backdrop-blur-sm bg-white/80 dark:bg-black/40 border-white/30 dark:border-white/10"
        >
          {isDark ? <Sun className="h-4 w-4" /> : mounted ? <Moon className="h-4 w-4" /> : null}
        </Button>
      </div>

      {/* Left side - Decorative (SAME AS ORIGINAL) */}
      <div className="relative flex-1 flex items-center justify-center p-8 md:p-12 min-h-[40vh] md:min-h-screen bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 dark:from-amber-900 dark:via-orange-950 dark:to-yellow-950 overflow-hidden">
        <BackgroundDecoration />
        <motion.div
          className="relative z-10 text-center text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/25 backdrop-blur-sm mb-6 shadow-lg shadow-black/10"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <BookOpen className="w-10 h-10" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">{t(lang, 'appName')}</h1>
          <p className="text-lg md:text-xl text-white/80 max-w-md mx-auto leading-relaxed">{t(lang, 'appTagline')}</p>
          <motion.div
            className="mt-8 flex items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex -space-x-2">
              {[
                { icon: '👨', bg: 'bg-blue-400/50' },
                { icon: '👩', bg: 'bg-pink-400/50' },
                { icon: '🧑‍💼', bg: 'bg-emerald-400/50' },
                { icon: '👩‍💼', bg: 'bg-violet-400/50' },
              ].map((user, i) => (
                <motion.div
                  key={i}
                  className={`w-9 h-9 rounded-full border-2 border-white/40 ${user.bg} backdrop-blur-sm flex items-center justify-center text-sm`}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                >
                  {user.icon}
                </motion.div>
              ))}
            </div>
            <span className="text-sm text-white/70">{language === 'bn' ? 'হাজারো ব্যবসায়ী বিশ্বাস করে' : 'Trusted by thousands'}</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Right side - Auth form (SAME UI, Firebase handlers) */}
      <div className="relative flex-1 flex items-center justify-center p-6 md:p-12 overflow-hidden bg-[#FFF7ED] dark:bg-[#1C1410]">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-orange-200/50 dark:bg-orange-950/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-72 h-72 bg-amber-200/40 dark:bg-amber-950/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-48 h-48 bg-yellow-200/30 dark:bg-yellow-950/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/4 w-36 h-36 bg-orange-100/35 dark:bg-orange-900/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* LOGIN */}
            {currentView === 'login' && (
              <motion.div key="login" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t(lang, 'loginTitle')}</h2>
                  <p className="text-muted-foreground">{t(lang, 'loginWith')}</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t(lang, 'email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="login-email" type="email" placeholder={t(lang, 'email')} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="pl-10" disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">{t(lang, 'password')}</Label>
                      <button type="button" onClick={() => { resetForgotForm(); setCurrentView('forgot-password'); }} className="text-sm text-amber-600 dark:text-amber-400 hover:underline">
                        {t(lang, 'forgotPassword')}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder={t(lang, 'password')} value={password} onChange={(e) => setLoginPassword(e.target.value)} className="pl-10 pr-10" disabled={isLoading} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {t(lang, 'login')}
                  </Button>
                </form>
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  {t(lang, 'noAccount')}{' '}
                  <button onClick={() => setCurrentView('signup')} className="text-amber-600 dark:text-amber-400 font-medium hover:underline">{t(lang, 'signup')}</button>
                </div>
              </motion.div>
            )}

            {/* SIGNUP */}
            {currentView === 'signup' && (
              <motion.div key="signup" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t(lang, 'signupTitle')}</h2>
                  <p className="text-muted-foreground">{language === 'bn' ? 'আপনার ব্যবসা পরিচালনা শুরু করুন' : 'Start managing your business'}</p>
                </div>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{t(lang, 'name')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-name" type="text" placeholder={t(lang, 'name')} value={signupName} onChange={(e) => setSignupName(e.target.value)} className="pl-10" disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t(lang, 'email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-email" type="email" placeholder={t(lang, 'email')} value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="pl-10" disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">{t(lang, 'phone')} <span className="text-muted-foreground text-xs">({language === 'bn' ? 'ঐচ্ছিক' : 'optional'})</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-phone" type="tel" placeholder={t(lang, 'phone')} value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} className="pl-10" disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t(lang, 'password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder={t(lang, 'password')} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="pl-10 pr-10" disabled={isLoading} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">{t(lang, 'confirmPassword')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-confirm" type={showConfirmPassword ? 'text' : 'password'} placeholder={t(lang, 'confirmPassword')} value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} className="pl-10 pr-10" disabled={isLoading} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {t(lang, 'signup')}
                  </Button>
                </form>
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  {t(lang, 'hasAccount')}{' '}
                  <button onClick={() => setCurrentView('login')} className="text-amber-600 dark:text-amber-400 font-medium hover:underline">{t(lang, 'login')}</button>
                </div>
              </motion.div>
            )}

            {/* FORGOT PASSWORD */}
            {currentView === 'forgot-password' && (
              <motion.div key="forgot" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                {forgotStep === 1 && (
                  <>
                    <div className="mb-8">
                      <button onClick={handleForgotBackToLogin} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                        <ArrowLeft className="h-4 w-4" /> {t(lang, 'back')}
                      </button>
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t(lang, 'forgotPassword')}</h2>
                      <p className="text-muted-foreground">{lang === 'bn' ? 'আপনার ইমেইল দিয়ে পাসওয়ার্ড রিসেট লিংক পাঠানো হবে' : 'A password reset link will be sent to your email'}</p>
                    </div>
                    <form onSubmit={handleFindAccount} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="forgot-login">{t(lang, 'email')}</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="forgot-login" type="email" placeholder={lang === 'bn' ? 'ইমেইল লিখুন' : 'Enter your email'} value={forgotLogin} onChange={(e) => setForgotLogin(e.target.value)} className="pl-10" disabled={isLoading} autoFocus />
                        </div>
                      </div>
                      <Button type="submit" className="w-full h-11 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        <Search className="h-4 w-4 mr-2" />
                        {lang === 'bn' ? 'রিসেট লিংক পাঠান' : 'Send Reset Link'}
                      </Button>
                    </form>
                  </>
                )}

                {forgotStep === 2 && foundUser && (
                  <>
                    <div className="mb-6">
                      <button onClick={() => setForgotStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                        <ArrowLeft className="h-4 w-4" /> {t(lang, 'back')}
                      </button>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 mb-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 shrink-0">
                          <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{foundUser.email}</p>
                          <p className="text-sm text-muted-foreground truncate">{lang === 'bn' ? 'রিসেট লিংক পাঠানো হয়েছে' : 'Reset link has been sent'}</p>
                        </div>
                      </motion.div>
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{lang === 'bn' ? 'ইমেইল চেক করুন' : 'Check Your Email'}</h2>
                      <p className="text-muted-foreground text-sm">{lang === 'bn' ? 'আপনার ইমেইলে পাঠানো লিংকে ক্লিক করে পাসওয়ার্ড রিসেট করুন' : 'Click the link in your email to reset your password'}</p>
                    </div>
                    <Button onClick={handleForgotBackToLogin} className="w-full h-11 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md">
                      {lang === 'bn' ? 'লগইন করুন' : 'Log In'}
                    </Button>
                  </>
                )}

                {forgotStep === 3 && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">{lang === 'bn' ? 'সফল!' : 'Success!'}</h2>
                    <p className="text-muted-foreground mb-8">{lang === 'bn' ? 'পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে' : 'Password reset link has been sent'}</p>
                    <Button onClick={handleForgotBackToLogin} className="h-11 px-8 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md">
                      {lang === 'bn' ? 'লগইন করুন' : 'Log In'}
                    </Button>
                  </motion.div>
                )}

                {forgotStep < 3 && (
                  <div className="mt-6 text-center text-sm text-muted-foreground">
                    <button onClick={handleForgotBackToLogin} className="text-amber-600 dark:text-amber-400 font-medium hover:underline">{t(lang, 'back')}</button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
