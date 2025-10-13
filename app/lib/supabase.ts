import { Alert } from 'react-native';
import * as Device from 'expo-device';
import { getDatabase, onValue, ref, get, set } from 'firebase/database';
import { createStore } from '../downloads/utils';
import { UserPreferences } from '../userpref';
import { ChapterTracker, NovelTracker } from '../favorites/tracker';
import { AuthState, AuthUser } from '../lib/auth';
import { app } from '../firebase';

type VersionedPayload<T> = {
  version: string;
  deviceId: string;
  value: T;
};

export interface CloudBackupSnapshot {
  auth_id: string;
  user_pref?: VersionedPayload<UserPreferences>;
  tracker?: VersionedPayload<Record<string, ChapterTracker>>;
  fav_pref?: VersionedPayload<Record<string, NovelTracker>>;
  created_at?: string;
  updated_at: string;
}

const resolvedDatabaseUrl =
  process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ??
  app.options.databaseURL ??
  (app.options.projectId ? `https://${app.options.projectId}-default-rtdb.firebaseio.com` : undefined);

const realtimeDb = resolvedDatabaseUrl ? getDatabase(app, resolvedDatabaseUrl) : getDatabase(app);
const USER_COLLECTION = 'users';
const DATA_VERSION = '1.0';

export const supabaseStore = createStore(undefined as CloudBackupSnapshot | undefined);

export function setUpSupabaseUser(
  setSupabaseUser: any,
  authUser: AuthUser
): (() => void) | undefined {
  if (authUser?.state !== AuthState.SIGNED_IN || !authUser.authId) {
    return undefined;
  }

  try {
    const userRef = ref(realtimeDb, `${USER_COLLECTION}/${authUser.authId}`);
    setSupabaseUser({ isLoading: true });

    return onValue(
      userRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setSupabaseUser({ data: undefined, isLoading: false });
          return;
        }

        const value = snapshot.val() as CloudBackupSnapshot;
        setSupabaseUser({ data: value, isLoading: false });
      },
      (error) => {
        console.warn('Failed to subscribe to backup data', error);
        setSupabaseUser({ error, isLoading: false });
      }
    );
  } catch (error) {
    console.info('Error subscribing to user data:', error);
  }

  return undefined;
}

export async function backupPreferences({
  userId,
  userPref,
  chapterPreferences,
  favPreferences,
}: {
  userId: string;
  userPref?: UserPreferences;
  chapterPreferences?: Record<string, ChapterTracker>;
  favPreferences?: Record<string, NovelTracker>;
}) {
  if (!userId) {
    const error = new Error('Missing user identifier for backup.');
    console.error(error.message);
    return { error };
  }

  try {
    const deviceId = Device.modelName ?? 'unknown';
    const now = new Date().toISOString();
    const userRef = ref(realtimeDb, `${USER_COLLECTION}/${userId}`);

    const existingSnapshot = await get(userRef);
    const createdAt = existingSnapshot.exists()
      ? (existingSnapshot.val()?.created_at as string | undefined)
      : now;

    const payload: CloudBackupSnapshot = {
      auth_id: userId,
      created_at: createdAt,
      updated_at: now,
      user_pref: {
        version: DATA_VERSION,
        deviceId,
        value: JSON.parse(JSON.stringify(userPref ?? {})),
      },
      tracker: {
        version: DATA_VERSION,
        deviceId,
        value: JSON.parse(JSON.stringify(compressChapterPref(chapterPreferences) ?? {})),
      },
      fav_pref: {
        version: DATA_VERSION,
        deviceId,
        value: JSON.parse(JSON.stringify(compressNovelPref(favPreferences) ?? {})),
      },
    };

    await set(userRef, payload);

    return { data: payload };
  } catch (error) {
    console.error('Error updating preferences:', error);
    return { error };
  }
}

function compressChapterPref(chapterPref?: Record<string, ChapterTracker>) {
  if (!chapterPref) {
    return chapterPref;
  }
  const compressed = {} as Record<string, ChapterTracker>;
  for (const key in chapterPref) {
    const tracker = chapterPref[key];
    compressed[key] = {
      ...tracker,
      repo: {
        id: tracker.repo.id,
        idName: tracker.repo.idName,
      } as any,
      novel: {
        bookId: tracker.novel.bookId,
        bookImage: tracker.novel.bookImage,
        bookLink: tracker.novel.bookLink,
        title: tracker.novel.title,
        latestChapter: tracker.novel.latestChapter,
      }
    };
  }
  return compressed;
}

function compressNovelPref(novelPref?: Record<string, NovelTracker>) {
  if (!novelPref) {
    return novelPref;
  }
  const compressed = {} as Record<string, NovelTracker>;
  for (const key in novelPref) {
    const tracker = novelPref[key];
    compressed[key] = {
      ...tracker,
      repo: {
        id: tracker.repo.id,
        idName: tracker.repo.idName,
      } as any,
      novel: {
        bookId: tracker.novel.bookId,
        bookImage: tracker.novel.bookImage,
        bookLink: tracker.novel.bookLink,
        title: tracker.novel.title,
        latestChapter: tracker.novel.latestChapter,
      }
    };
  }
  return compressed;
}


export async function restorePreferences({
  userId,
  setUserPref,
  setAllTrackers,
  setAllNovelTracker,
}: {
  userId: string;
  userPref: UserPreferences;
  chapterPreferences: Record<string, ChapterTracker>;
  favPreferences: Record<string, NovelTracker>;
  setUserPref: any;
  setAllTrackers: any;
  setAllNovelTracker: any;
}) {
  if (!userId) {
    Alert.alert('Error', 'Missing user identifier. Sign in and try again.');
    return;
  }

  try {
    const snapshot = await get(ref(realtimeDb, `${USER_COLLECTION}/${userId}`));

    if (!snapshot.exists()) {
      Alert.alert('Info', 'No backup found for this account.');
      return;
    }

    const data = snapshot.val() as CloudBackupSnapshot;
    const { user_pref, tracker, fav_pref } = data;

    const pref = parseVersionedPayload(user_pref);
    if (pref?.value) {
      setUserPref(pref.value);
    }

    const chapterPref = parseVersionedPayload(tracker);
    if (chapterPref?.value) {
      setAllTrackers(chapterPref.value);
    }

    const novelPref = parseVersionedPayload(fav_pref);
    if (novelPref?.value) {
      setAllNovelTracker(novelPref.value);
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    Alert.alert('Error', 'Failed to fetch user data from the cloud.');
  }
}

function parseVersionedPayload<T>(payload?: VersionedPayload<T> | null) {
  if (!payload) {
    return null;
  }

  return {
    version: payload.version,
    deviceId: payload.deviceId,
    value: payload.value,
  };
}
