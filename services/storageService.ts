// services/storageService.ts
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload an image from a local URI to Firebase Storage.
 * Returns the public download URL.
 */
export async function uploadImage(
  localUri: string,
  path: string // e.g. 'avatars/uid.jpg' or 'posts/uid/timestamp.jpg'
): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}

/**
 * Upload a user's avatar and return the download URL.
 */
export async function uploadAvatar(uid: string, localUri: string): Promise<string> {
  return uploadImage(localUri, `avatars/${uid}.jpg`);
}

/**
 * Upload a post image and return the download URL.
 */
export async function uploadPostImage(uid: string, localUri: string): Promise<string> {
  const filename = `${Date.now()}.jpg`;
  return uploadImage(localUri, `posts/${uid}/${filename}`);
}

/**
 * Upload an event cover image and return the download URL.
 */
export async function uploadEventImage(uid: string, localUri: string): Promise<string> {
  const filename = `${Date.now()}.jpg`;
  return uploadImage(localUri, `events/${uid}/${filename}`);
}

/**
 * Delete a file from Storage by its full path.
 */
export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}
