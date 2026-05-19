// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdlaajmsafjuouafhndg.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_nu7rkhwKsLeg4see5dT4VQ_fQVnx5mh'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);