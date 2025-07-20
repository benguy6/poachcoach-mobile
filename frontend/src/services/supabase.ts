import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ezdbjkcrtepdihmyunzm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6ZGJqa2NydGVwZGlobXl1bnptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MTIxNzksImV4cCI6MjA2MjM4ODE3OX0.E2NntRtnywLcVUa15IJBO6sR_sH0kT_Kr-UcqzVo-Sw";


export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


