import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// Cliente único de Supabase, compartido por toda la app.
export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
