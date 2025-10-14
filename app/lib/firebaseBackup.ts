import { Alert } from 'react-native';
import * as Device from 'expo-device';
import { getDatabase, onValue, ref, get, set } from 'firebase/database';
import { createStore } from '../downloads/utils';
import { UserPreferences } from '../userpref';
import { ChapterTracker, NovelTracker } from '../favorites/tracker';
import { AuthState, AuthUser } from '../lib/auth';
import { app } from '../firebase';
import { Content, Repo } from '@/types';

type VersionedPayload<T> = {
  version: string;
  deviceId: string;
  value: T;
};

export interface CloudBackupSnapshot {
  auth_id: string;
  user_pref?: VersionedPayload<UserPreferences>;
  tracker?: VersionedPayload<Record<string, ChapterTrackerPayload>>;
  fav_pref?: VersionedPayload<Record<string, NovelTrackerPayload>>;
  novels?: VersionedPayload<NovelIndex>;
  created_at?: string;
  updated_at: string;
}

type TrackerReference = {
  repoId: string;
  novelId: string;
};

type ChapterTrackerPayload = Omit<ChapterTracker, 'repo' | 'novel'> & TrackerReference;
type NovelTrackerPayload = Omit<NovelTracker, 'repo' | 'novel'> & TrackerReference;

type NovelIndexEntry = {
  repo: Repo;
  novel: Content;
};

type NovelIndex = Record<string, NovelIndexEntry>;

const realtimeDb = getDatabase(app);
const USER_COLLECTION = 'users';
const DATA_VERSION = '1.0';

export const firebaseStore = createStore(undefined as CloudBackupSnapshot | undefined);

export function setUpFirebaseUser(
  setFirebaseUser: any,
  authUser: AuthUser
): (() => void) | undefined {
  if (authUser?.state !== AuthState.SIGNED_IN || !authUser.authId) {
    return undefined;
  }

  try {
    const userRef = ref(realtimeDb, `${USER_COLLECTION}/${authUser.authId}`);
    setFirebaseUser({ isLoading: true });

    return onValue(
      userRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setFirebaseUser({ data: undefined, isLoading: false });
          return;
        }

        const value = snapshot.val() as CloudBackupSnapshot;
        setFirebaseUser({ data: value, isLoading: false });
      },
      (error) => {
        console.warn('Failed to subscribe to backup data', error);
        setFirebaseUser({ error, isLoading: false });
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
}): Promise<
  | { data: CloudBackupSnapshot; error?: undefined }
  | { data?: undefined; error: unknown }
> {
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

    const chapterCompression = compressChapterPref(chapterPreferences);
    const favoriteCompression = compressNovelPref(favPreferences);

    const novelIndex = mergeNovelIndexes(
      chapterCompression.novelIndex,
      favoriteCompression.novelIndex,
    );

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
        value: JSON.parse(JSON.stringify(chapterCompression.trackers)),
      },
      fav_pref: {
        version: DATA_VERSION,
        deviceId,
        value: JSON.parse(JSON.stringify(favoriteCompression.trackers)),
      },
    };

    if (Object.keys(novelIndex).length > 0) {
      payload.novels = {
        version: DATA_VERSION,
        deviceId,
        value: JSON.parse(JSON.stringify(novelIndex)),
      };
    }

    await set(userRef, payload);

    return { data: payload };
  } catch (error) {
    console.error('Error updating preferences:', error);
    return { error };
  }
}

function compressChapterPref(chapterPref?: Record<string, ChapterTracker>) {
  const trackers: Record<string, ChapterTrackerPayload> = {};
  const novelIndex: NovelIndex = {};

  if (!chapterPref) {
    return { trackers, novelIndex };
  }

  for (const key of Object.keys(chapterPref)) {
    const tracker = chapterPref[key];
    if (!tracker) {
      continue;
    }

    const { repo, novel, ...rest } = tracker;
    const referenceKey = novelReferenceKey(repo.id, novel.bookId);
    if (!novelIndex[referenceKey]) {
      novelIndex[referenceKey] = {
        repo,
        novel,
      };
    }

    trackers[key] = {
      ...rest,
      repoId: repo.id,
      novelId: novel.bookId,
    };
  }

  return { trackers, novelIndex };
}

function compressNovelPref(novelPref?: Record<string, NovelTracker>) {
  const trackers: Record<string, NovelTrackerPayload> = {};
  const novelIndex: NovelIndex = {};

  if (!novelPref) {
    return { trackers, novelIndex };
  }

  for (const key of Object.keys(novelPref)) {
    const tracker = novelPref[key];
    if (!tracker) {
      continue;
    }

    const { repo, novel, ...rest } = tracker;
    const referenceKey = novelReferenceKey(repo.id, novel.bookId);
    if (!novelIndex[referenceKey]) {
      novelIndex[referenceKey] = {
        repo,
        novel,
      };
    }

    trackers[key] = {
      ...rest,
      repoId: repo.id,
      novelId: novel.bookId,
    };
  }

  return { trackers, novelIndex };
}

function novelReferenceKey(repoId: string, novelId: string): string {
  return `${repoId}::${novelId}`;
}

function mergeNovelIndexes(...indexes: NovelIndex[]): NovelIndex {
  return indexes.reduce<NovelIndex>((acc, index) => {
    for (const key of Object.keys(index)) {
      if (!acc[key]) {
        acc[key] = index[key];
      }
    }
    return acc;
  }, {});
}

function isChapterTrackerCompressed(
  tracker: ChapterTracker | ChapterTrackerPayload
): tracker is ChapterTrackerPayload {
  return 'repoId' in tracker && 'novelId' in tracker;
}

function isNovelTrackerCompressed(
  tracker: NovelTracker | NovelTrackerPayload
): tracker is NovelTrackerPayload {
  return 'repoId' in tracker && 'novelId' in tracker;
}

function expandChapterPref(
  compressed?: Record<string, ChapterTracker | ChapterTrackerPayload>,
  novelIndex?: NovelIndex
): Record<string, ChapterTracker> | undefined {
  if (!compressed) {
    return undefined;
  }

  const result: Record<string, ChapterTracker> = {};

  for (const key of Object.keys(compressed)) {
    const entry = compressed[key];
    if (!entry) {
      continue;
    }

    if (!isChapterTrackerCompressed(entry)) {
      result[key] = entry;
      continue;
    }

    const { repoId, novelId, ...rest } = entry;
    const reference = novelIndex?.[novelReferenceKey(repoId, novelId)];

    if (!reference) {
      console.warn('Missing novel reference for tracker', repoId, novelId);
      continue;
    }

    result[key] = {
      ...rest,
      repo: reference.repo,
      novel: reference.novel,
    };
  }

  return result;
}

function expandNovelPref(
  compressed?: Record<string, NovelTracker | NovelTrackerPayload>,
  novelIndex?: NovelIndex
): Record<string, NovelTracker> | undefined {
  if (!compressed) {
    return undefined;
  }

  const result: Record<string, NovelTracker> = {};

  for (const key of Object.keys(compressed)) {
    const entry = compressed[key];
    if (!entry) {
      continue;
    }

    if (!isNovelTrackerCompressed(entry)) {
      result[key] = entry;
      continue;
    }

    const { repoId, novelId, ...rest } = entry;
    const reference = novelIndex?.[novelReferenceKey(repoId, novelId)];

    if (!reference) {
      console.warn('Missing novel reference for favorite tracker', repoId, novelId);
      continue;
    }

    result[key] = {
      ...rest,
      repo: reference.repo,
      novel: reference.novel,
    };
  }

  return result;
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
}): Promise<
  | { restored: true; missing?: false }
  | { restored: false; missing?: true; error?: undefined }
  | { restored: false; error: unknown; missing?: false }
> {
  if (!userId) {
    Alert.alert('Error', 'Missing user identifier. Sign in and try again.');
    return { restored: false, error: new Error('Missing user identifier') };
  }

  try {
    const snapshot = await get(ref(realtimeDb, `${USER_COLLECTION}/${userId}`));

    if (!snapshot.exists()) {
      Alert.alert('Info', 'No backup found for this account.');
      return { restored: false, missing: true };
    }

    const data = snapshot.val() as CloudBackupSnapshot;
    const { user_pref, tracker, fav_pref, novels } = data;

    const pref = parseVersionedPayload(user_pref);
    if (pref?.value) {
      setUserPref(pref.value);
    }

    const novelIndexPayload = parseVersionedPayload(novels);
    const novelIndex = novelIndexPayload?.value ?? {};

    const chapterPref = parseVersionedPayload(tracker);
    if (chapterPref?.value) {
      const enriched = expandChapterPref(chapterPref.value, novelIndex) ?? chapterPref.value;
      setAllTrackers(enriched);
    }

    const novelPref = parseVersionedPayload(fav_pref);
    if (novelPref?.value) {
      const enrichedFavorites = expandNovelPref(novelPref.value, novelIndex) ?? novelPref.value;
      setAllNovelTracker(enrichedFavorites);
    }
    return { restored: true };
  } catch (error) {
    console.error('Error fetching user data:', error);
    Alert.alert('Error', 'Failed to fetch user data from the cloud.');
    return { restored: false, error };
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
