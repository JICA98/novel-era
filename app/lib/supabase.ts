import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fbclavuffwejpuqazgwq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiY2xhdnVmZndlanB1cWF6Z3dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNDA3NjYsImV4cCI6MjA1OTYxNjc2Nn0.vcrkKXQQDeBTjzgYZ4IRDR9M2vpOrghMLmaw5W7JSk4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
