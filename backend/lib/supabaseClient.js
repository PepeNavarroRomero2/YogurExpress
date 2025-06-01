// backend/lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY no están definidos en .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
