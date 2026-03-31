import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  loading: boolean; // initial auth state loading
  setAuth: (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => Promise<void>;
  setIsOnline: (online: boolean) => void;
  initializeAuth: () => () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      loading: true,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      logout: async () => {
        try {
          await signOut(auth);
        } catch (e) {
          console.error('Sign out error:', e);
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      setIsOnline: (online) => set({ isOnline: online }),

      initializeAuth: () => {
        // Online/offline listener
        if (typeof window !== 'undefined') {
          const goOnline = () => get().setIsOnline(true);
          const goOffline = () => get().setIsOnline(false);
          window.addEventListener('online', goOnline);
          window.removeEventListener('offline', goOffline);
        }

        // Firebase Auth state listener
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          if (firebaseUser) {
            try {
              const idToken = await firebaseUser.getIdToken();
              const displayName = firebaseUser.displayName || 'User';

              // Get user data from Firestore
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              if (userDoc.exists()) {
                const data = userDoc.data();
                set({
                  user: {
                    id: firebaseUser.uid,
                    name: data.name || displayName,
                    email: data.email || firebaseUser.email || '',
                    phone: data.phone || null,
                    avatar: data.avatar || null,
                  },
                  token: idToken,
                  isAuthenticated: true,
                  loading: false,
                });
              } else {
                // First time login - create user doc in Firestore
                const userData = {
                  name: displayName,
                  email: firebaseUser.email || '',
                  phone: null,
                  avatar: null,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                };
                await setDoc(doc(db, 'users', firebaseUser.uid), userData);

                set({
                  user: {
                    id: firebaseUser.uid,
                    ...userData,
                  },
                  token: idToken,
                  isAuthenticated: true,
                  loading: false,
                });
              }
            } catch (e) {
              console.error('Auth state error:', e);
              set({ loading: false });
            }
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              loading: false,
            });
          }
        });

        return unsubscribe;
      },
    }),
    {
      name: 'baki-khata-auth',
      partialize: (state) => ({
        // Don't persist auth state - Firebase handles session
      }),
    }
  )
);

// ===== Auth Functions for Components =====

export async function loginUser(email: string, password: string) {
  if (!navigator.onLine) {
    throw new Error('ইন্টারনেট কানেকশন দিন');
  }
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred;
}

export async function signupUser(name: string, email: string, password: string, phone?: string) {
  if (!navigator.onLine) {
    throw new Error('ইন্টারনেট কানেকশন দিন');
  }
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  // Create Firestore user doc
  await setDoc(doc(db, 'users', cred.user.uid), {
    name,
    email,
    phone: phone || null,
    avatar: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return cred;
}
