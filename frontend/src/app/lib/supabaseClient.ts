// backend/lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://lhiqakhxftxgtsxogbvn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoaXFha2h4ZnR4Z3RzeG9nYnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjYzODA1MCwiZXhwIjoyMDYyMjE0MDUwfQ.rQqP5Vng1GVP9YbvlbcfE5QGexNS418h4N3iaSuSEM0";

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY no están definidos en .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
