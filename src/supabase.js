import {createClient} from '@supabase/supabase-js';
export const sb=createClient(import.meta.env.VITE_SUPABASE_URL||'http://localhost:54321',import.meta.env.VITE_SUPABASE_ANON_KEY||'missing-key');
