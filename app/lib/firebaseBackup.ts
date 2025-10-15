import { Alert } from 'react-native';
import * as Device from 'expo-device';
import { getDatabase, onValue, ref, get, set } from 'firebase/database';
import { createStore } from '../downloads/utils';
import { UserPreferences } from '../userpref';
import {
  ChapterTracker,
  NovelTracker,
  createChapterTrackerStore,
  createNovelTrackerStore,
  saveTracker,
  saveNovelTracker,
  trackerKey,
  novelKey,
} from '../favorites/tracker';
import { getAllKeys, removeMany } from '../storage';
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


function buildChapterTrackerStoreMap(
  trackers?: Record<string, ChapterTracker>
): Map<string, ReturnType<typeof createChapterTrackerStore>> {
  const storeMap = new Map<string, ReturnType<typeof createChapterTrackerStore>>();

  if (!trackers) {
    return storeMap;
  }

  for (const [key, tracker] of Object.entries(trackers)) {
    if (!tracker) {
      continue;
    }

    storeMap.set(key, createChapterTrackerStore(tracker));
  }

  return storeMap;
}

function buildNovelTrackerStoreMap(
  trackers?: Record<string, NovelTracker>
): Map<string, ReturnType<typeof createNovelTrackerStore>> {
  const storeMap = new Map<string, ReturnType<typeof createNovelTrackerStore>>();

  if (!trackers) {
    return storeMap;
  }

  for (const [key, tracker] of Object.entries(trackers)) {
    if (!tracker) {
      continue;
    }

    storeMap.set(key, createNovelTrackerStore(tracker));
  }

  return storeMap;
}

const CHAPTER_TRACKER_PREFIX = 'trackerv1-';
const FAVORITE_TRACKER_PREFIX = 'favoritev1-';

async function syncChapterTrackerStorage(trackers: Record<string, ChapterTracker>) {
  const keysToKeep = new Set(
    Object.values(trackers).map((tracker) =>
      trackerKey(tracker.repo.id, tracker.novel.bookId, tracker.chapterId)
    )
  );

  const existingKeys = await getAllKeys();
  const removable = existingKeys.filter(
    (key) => key.startsWith(CHAPTER_TRACKER_PREFIX) && !keysToKeep.has(key)
  );

  await removeMany(removable);

  await Promise.all(Object.values(trackers).map((tracker) => saveTracker(tracker)));
}

async function syncFavoriteTrackerStorage(trackers: Record<string, NovelTracker>) {
  const keysToKeep = new Set(
    Object.values(trackers).map((tracker) =>
      novelKey(tracker.repo.id, tracker.novel.bookId)
    )
  );

  const existingKeys = await getAllKeys();
  const removable = existingKeys.filter(
    (key) => key.startsWith(FAVORITE_TRACKER_PREFIX) && !keysToKeep.has(key)
  );

  await removeMany(removable);

  await Promise.all(Object.values(trackers).map((tracker) => saveNovelTracker(tracker)));
}


type RestoreComparisonPayload = {
  previousUserPref?: UserPreferences;
  restoredUserPref?: UserPreferences;
  previousChapters?: Record<string, ChapterTracker>;
  restoredChapters?: Record<string, ChapterTracker>;
  previousFavorites?: Record<string, NovelTracker>;
  restoredFavorites?: Record<string, NovelTracker>;
};

function logRestoreComparison({
  previousUserPref,
  restoredUserPref,
  previousChapters,
  restoredChapters,
  previousFavorites,
  restoredFavorites,
}: RestoreComparisonPayload) {
  const userPrefDiff = buildUserPrefDiff(previousUserPref, restoredUserPref);
  const chapterDiff = buildTrackerDiff(previousChapters, restoredChapters);
  const favoriteDiff = buildTrackerDiff(previousFavorites, restoredFavorites);

  console.log('Restore comparison', {
    userPreferences: userPrefDiff,
    chapters: chapterDiff,
    favorites: favoriteDiff,
  });
}

function buildUserPrefDiff(
  previous?: UserPreferences,
  restored?: UserPreferences
) {
  const previousRecord = previous ?? {};
  const restoredRecord = restored ?? {};

  const previousKeys = Object.keys(previousRecord);
  const restoredKeys = Object.keys(restoredRecord);

  const addedKeys = restoredKeys.filter((key) => !(key in previousRecord));
  const removedKeys = previousKeys.filter((key) => !(key in restoredRecord));
  const potentialUpdates = restoredKeys.filter(
    (key) => key in previousRecord && key in restoredRecord
  );

  const updatedKeys = potentialUpdates.filter((key) =>
    !isDeepEqual((previousRecord as any)[key], (restoredRecord as any)[key])
  );

  return {
    changed: addedKeys.length + removedKeys.length + updatedKeys.length > 0,
    added: addedKeys,
    removed: removedKeys,
    updated: updatedKeys,
  };
}

function buildTrackerDiff(
  previous?: Record<string, ChapterTracker | NovelTracker>,
  restored?: Record<string, ChapterTracker | NovelTracker>
) {
  const prev = previous ?? {};
  const next = restored ?? {};

  const previousKeys = Object.keys(prev);
  const restoredKeys = Object.keys(next);

  const added = restoredKeys.filter((key) => !previousKeys.includes(key));
  const removed = previousKeys.filter((key) => !restoredKeys.includes(key));
  const maybeUpdated = restoredKeys.filter(
    (key) => previousKeys.includes(key) && !added.includes(key)
  );

  const updated = maybeUpdated.filter(
    (key) => !isDeepEqual(prev[key], next[key])
  );

  return {
    addedCount: added.length,
    removedCount: removed.length,
    updatedCount: updated.length,
    unchangedCount: restoredKeys.length - added.length - updated.length,
    addedPreview: added.slice(0, 3),
    removedPreview: removed.slice(0, 3),
    updatedPreview: updated.slice(0, 3),
  };
}

function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (error) {
    console.warn('Failed to compare values for restore diff', error);
    return false;
  }
}


export async function restorePreferences({
  userId,
  userPref,
  chapterPreferences,
  favPreferences,
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
    const novelIndexPayload = parseVersionedPayload(novels);
    const novelIndex = novelIndexPayload?.value ?? {};

    const chapterPref = parseVersionedPayload(tracker);
    const novelPref = parseVersionedPayload(fav_pref);
    const restoredUserPref = pref?.value;
    const restoredChapters: Record<string, ChapterTracker> = chapterPref?.value
      ? ((expandChapterPref(chapterPref.value, novelIndex) ?? {}) as Record<string, ChapterTracker>)
      : ({} as Record<string, ChapterTracker>);
    const restoredFavorites: Record<string, NovelTracker> = novelPref?.value
      ? ((expandNovelPref(novelPref.value, novelIndex) ?? {}) as Record<string, NovelTracker>)
      : ({} as Record<string, NovelTracker>);

    logRestoreComparison({
      previousUserPref: userPref,
      restoredUserPref,
      previousChapters: chapterPreferences,
      restoredChapters,
      previousFavorites: favPreferences,
      restoredFavorites,
    });

    if (restoredUserPref) {
      setUserPref(restoredUserPref);
    }

    await syncChapterTrackerStorage(restoredChapters);
    await syncFavoriteTrackerStorage(restoredFavorites);

    const chapterStores = buildChapterTrackerStoreMap(restoredChapters);
    setAllTrackers(chapterStores);

    const favoriteStores = buildNovelTrackerStoreMap(restoredFavorites);
    setAllNovelTracker(favoriteStores);
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

export type BackupPreviewData = {
  userPref?: UserPreferences;
  chapters?: Record<string, ChapterTracker | ChapterTrackerPayload>;
  favorites?: Record<string, NovelTracker | NovelTrackerPayload>;
  novelIndex?: NovelIndex;
};

export async function fetchBackupPreview(
  userId: string
): Promise<
  | { data: BackupPreviewData; missing?: false; error?: undefined }
  | { data?: undefined; missing: true; error?: undefined }
  | { data?: undefined; missing?: false; error: unknown }
> {
  if (!userId) {
    return { error: new Error('Missing user identifier for preview.') };
  }

  try {
    const snapshot = await get(ref(realtimeDb, `${USER_COLLECTION}/${userId}`));

    if (!snapshot.exists()) {
      return { missing: true };
    }

    const data = snapshot.val() as CloudBackupSnapshot;
    const novelIndex = parseVersionedPayload(data.novels)?.value ?? {};
    const chapterPayload = parseVersionedPayload(data.tracker)?.value;
    const favoritePayload = parseVersionedPayload(data.fav_pref)?.value;

    const expandedChapters = expandChapterPref(chapterPayload, novelIndex);
    const expandedFavorites = expandNovelPref(favoritePayload, novelIndex);

    const chapters = expandedChapters ?? (chapterPayload as Record<string, ChapterTracker | ChapterTrackerPayload> | undefined) ?? {};
    const favorites = expandedFavorites ?? (favoritePayload as Record<string, NovelTracker | NovelTrackerPayload> | undefined) ?? {};
    const userPref = parseVersionedPayload(data.user_pref)?.value;

    return {
      data: {
        userPref,
        chapters,
        favorites,
        novelIndex,
      },
    };
  } catch (error) {
    console.error('Error fetching backup preview:', error);
    return { error };
  }
}
