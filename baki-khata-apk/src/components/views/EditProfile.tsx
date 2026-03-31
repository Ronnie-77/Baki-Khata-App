'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  User,
  Camera,
  Loader2,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { t } from '@/lib/i18n';
import { updateProfile, changePassword } from '@/lib/firestore-service';

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

export default function EditProfile() {
  const { language } = useAppStore();
  const { user, updateUser } = useAuthStore();
  const lang = language || 'bn';

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(lang === 'bn' ? 'শুধুমাত্র ছবি ফাইল আপলোড করুন' : 'Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(lang === 'bn' ? 'ফাইল সাইজ ৫MB এর কম হতে হবে' : 'File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Resize to 200x200 using canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Crop to center square
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setAvatarPreview(resizedDataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!user) {
      toast.error(lang === 'bn' ? 'প্রথমে লগইন করুন' : 'Please login first');
      return;
    }
    if (!name.trim()) {
      toast.error(t(lang, 'required'));
      return;
    }

    setIsSavingProfile(true);
    try {
      const payload: Record<string, string | null | undefined> = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || null,
      };
      if (avatarPreview) {
        payload.avatar = avatarPreview;
      }

      const updatedData = await updateProfile(user.id, {
        name: payload.name as string,
        email: payload.email as string | undefined,
        phone: payload.phone as string | null,
        avatar: payload.avatar as string | undefined,
      });

      // Filter out undefined values and update store
      const cleanUpdate: Record<string, any> = {};
      if (updatedData.name !== undefined) cleanUpdate.name = updatedData.name;
      if (updatedData.email !== undefined) cleanUpdate.email = updatedData.email;
      if (updatedData.phone !== undefined) cleanUpdate.phone = updatedData.phone;
      if (updatedData.avatar !== undefined) cleanUpdate.avatar = updatedData.avatar;
      updateUser(cleanUpdate);
      toast.success(t(lang, 'profileUpdated'));
    } catch (err: any) {
      toast.error(err?.message || t(lang, 'error'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};
    if (!oldPassword) {
      newErrors.oldPassword = t(lang, 'required');
    }
    if (!newPassword) {
      newErrors.newPassword = t(lang, 'required');
    } else if (newPassword.length < 6) {
      newErrors.newPassword = lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = lang === 'bn' ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match';
    }
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!user) {
      toast.error(lang === 'bn' ? 'প্রথমে লগইন করুন' : 'Please login first');
      return;
    }
    if (!validatePassword()) return;

    setIsSavingPassword(true);
    try {
      await changePassword(oldPassword, newPassword);
      toast.success(t(lang, 'passwordChanged'));
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
    } catch (err: any) {
      toast.error(err?.message || t(lang, 'error'));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
        <h1 className="text-2xl font-bold tracking-tight">{t(lang, 'editProfileTitle')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {lang === 'bn' ? 'আপনার প্রোফাইল তথ্য আপডেট করুন' : 'Update your profile information'}
        </p>
      </motion.div>

      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Profile Section */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5 text-blue-500" />
                {lang === 'bn' ? 'প্রোফাইল তথ্য' : 'Profile Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="size-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-lg">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="size-full object-cover"
                      />
                    ) : (
                      getInitials(name || 'U')
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="size-6 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="size-4" />
                    {t(lang, 'uploadPhoto')}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lang === 'bn' ? 'JPG, PNG (সর্বোচ্চ ৫MB)' : 'JPG, PNG (max 5MB)'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="profile-name" className="flex items-center gap-2">
                  <User className="size-4" />
                  {t(lang, 'name')}
                </Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t(lang, 'name')}
                  disabled={isSavingProfile}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="profile-email" className="flex items-center gap-2">
                  <Mail className="size-4" />
                  {t(lang, 'email')}
                </Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t(lang, 'email')}
                  disabled={isSavingProfile}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="profile-phone" className="flex items-center gap-2">
                  <Phone className="size-4" />
                  {t(lang, 'phone')}
                </Label>
                <Input
                  id="profile-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t(lang, 'phone')}
                  disabled={isSavingProfile}
                />
              </div>

              {/* Save Profile */}
              <Button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="w-full h-11"
                size="lg"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t(lang, 'loading')}
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    {t(lang, 'saveChanges')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Password Section */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5 text-amber-500" />
                {t(lang, 'changePassword')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Old Password */}
              <div className="space-y-2">
                <Label htmlFor="old-password" className="flex items-center gap-2">
                  <Lock className="size-4" />
                  {t(lang, 'oldPassword')}
                </Label>
                <div className="relative">
                  <Input
                    id="old-password"
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value);
                      setPasswordErrors((prev) => ({ ...prev, oldPassword: '' }));
                    }}
                    placeholder={t(lang, 'oldPassword')}
                    disabled={isSavingPassword}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showOldPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {passwordErrors.oldPassword && (
                  <p className="text-destructive text-xs">{passwordErrors.oldPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new-password" className="flex items-center gap-2">
                  <Lock className="size-4" />
                  {t(lang, 'newPassword')}
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordErrors((prev) => ({ ...prev, newPassword: '' }));
                    }}
                    placeholder={t(lang, 'newPassword')}
                    disabled={isSavingPassword}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-destructive text-xs">{passwordErrors.newPassword}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="flex items-center gap-2">
                  <Lock className="size-4" />
                  {t(lang, 'confirmPassword')}
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  placeholder={t(lang, 'confirmPassword')}
                  disabled={isSavingPassword}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-destructive text-xs">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              {/* Change Password */}
              <Button
                onClick={handleChangePassword}
                disabled={isSavingPassword}
                variant="outline"
                className="w-full h-11"
                size="lg"
              >
                {isSavingPassword ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t(lang, 'loading')}
                  </>
                ) : (
                  <>
                    <Shield className="size-4" />
                    {t(lang, 'changePassword')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
