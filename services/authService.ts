// services/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole, AccessibilityPrefs } from '@/types';

const DEFAULT_ACCESSIBILITY_PREFS: AccessibilityPrefs = {
  fontSize: 'large',
  highContrast: false,
  reduceMotion: false,
};

export async function registerUser(
  email: string,
  password: string,
  displayName: string,
  role: UserRole
): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });

  const profile: Omit<UserProfile, 'uid'> = {
    displayName,
    email,
    role,
    trustedContacts: [],
    accessibilityPrefs: DEFAULT_ACCESSIBILITY_PREFS,
    isVerified: false,
    isBanned: false,
    createdAt: new Date(),
    lastSeen: new Date(),
  };

  await setDoc(doc(db, 'users', cred.user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  });

  return { uid: cred.user.uid, ...profile };
}

export async function signIn(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await updateDoc(doc(db, 'users', cred.user.uid), {
    lastSeen: serverTimestamp(),
  });
  return cred.user;
}

export async function signOut(): Promise<void> {
  if (auth.currentUser) {
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      lastSeen: serverTimestamp(),
    });
  }
  await firebaseSignOut(auth);
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid: snap.id,
    ...data,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    lastSeen: data.lastSeen?.toDate() ?? new Date(),
  } as UserProfile;
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const { uid: _uid, createdAt, ...rest } = updates as any;
  await updateDoc(doc(db, 'users', uid), rest);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
