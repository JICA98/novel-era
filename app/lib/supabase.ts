import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { createStore } from '../downloads/utils';
import { UserPreferences } from '../userpref';
import { ChapterTracker, NovelTracker } from '../favorites/tracker';
import { AuthState, AuthUser } from '../lib/auth';
import * as Device from 'expo-device';
import { Alert } from 'react-native';
import { Json } from '@/database.types';
const supabaseUrl = "https://fbclavuffwejpuqazgwq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiY2xhdnVmZndlanB1cWF6Z3dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNDA3NjYsImV4cCI6MjA1OTYxNjc2Nn0.vcrkKXQQDeBTjzgYZ4IRDR9M2vpOrghMLmaw5W7JSk4";

export interface SupabaseUser {
  authId: string;
  userPreference?: { version: string; deviceId: string; value: UserPreferences };
  favPreferences?: { version: string; deviceId: string; value: Record<string, NovelTracker> };
  chapterPreferences?: { version: string; deviceId: string; value: Record<string, ChapterTracker> };
  createdAt: string;
  updatedAt: string;
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const supabaseStore = createStore(undefined as SupabaseUser | undefined);


export async function setUpSupabaseUser(setSupabaseUser: any, authUser: AuthUser) {
  console.log('supabase auth user', authUser);
  if (authUser?.state !== AuthState.SIGNED_IN || authUser.authId === undefined) {
    return;
  }
  try {

    const channels = supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user', filter: `auth_id=eq.${authUser.authId}` },
        (payload) => {
          console.log('Change received!', payload)
        }
      )
      .subscribe()
  }
  catch (error) {
    console.info('Error fetching user data:', error);
  }
}

export async function backupPreferences(
  { userId, userPref, chapterPreferences, favPreferences }:
    {
      userId: string,
      userPref?: UserPreferences,
      chapterPreferences?: Record<string, ChapterTracker>,
      favPreferences?: Record<string, NovelTracker>
    }
) {
  try {
    const deviceId = Device.modelName;
    const version = '1.0';
    console.log('deviceId', deviceId);
    console.log('userId', userId);
    console.log('userPref', userPref);
    console.log('chapterPreferences', chapterPreferences);
    console.log('favPreferences', favPreferences);

    const toBeSaved = {
      auth_id: userId,
      updated_at: new Date().toISOString(),
      user_pref: {
        version,
        deviceId,
        value: JSON.parse(JSON.stringify(userPref ?? {})),
      },
      tracker: {
        version,
        deviceId: 'deviceId',
        value: JSON.parse(JSON.stringify(compressChapterPref(chapterPreferences) ?? {})),
      },
      fav_pref: {
        version,
        deviceId,
        value: JSON.parse(JSON.stringify(compressNovelPref(favPreferences) ?? {})),
      }
    };
    const { data, error } = await supabase.from('user').upsert(toBeSaved, {
      onConflict: 'auth_id',
    }).eq('auth_id', userId).select();
    console.log('data', data);
    console.log('error', error);
    if (error) {
      return { error };
    } else if (data.length === 0) {
      console.warn('Error', 'No data returned from the server.');
    }
    return { data };
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
  userId, userPref, chapterPreferences, favPreferences,
  setUserPref, setAllTrackers, setAllNovelTracker
}: {
  userId: string;
  userPref: UserPreferences; chapterPreferences: Record<string, ChapterTracker>;
  favPreferences: Record<string, NovelTracker>; setUserPref: any; setAllTrackers: any;
  setAllNovelTracker: any
}) {
  await supabase.from('user').select('*').eq('auth_id', userId).limit(1).single().then(({ data, error }) => {
    if (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to fetch user data from Supabase.');
      return;
    }
    if (!data) {
      console.warn('No data found for user:', userId);
      return;
    }
    const { user_pref, tracker, fav_pref } = data;
    let pref = parseVersionJson(user_pref);
    if (pref?.value) {
      setUserPref(pref.value);
    }
    let chapterPref = parseVersionJson(tracker);
    if (chapterPref?.value) {
      setAllTrackers(chapterPref.value);
    }
    let novelPref = parseVersionJson(fav_pref);
    if (novelPref?.value) {
      setAllNovelTracker(novelPref.value);
    }
  });
}

function parseVersionJson(json?: Json) {
  if (!json) {
    return null;
  }
  const stringJson = JSON.stringify(json);
  const parsed = JSON.parse(stringJson);
  return { version: parsed.version, deviceId: parsed.deviceId, value: parsed.value };
}
