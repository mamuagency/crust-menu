import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://rkztlgwfmyyjulfuqsds.supabase.co"; // Project URL بتاعك
export const SUPABASE_ANON_KEY = "sb_publishable_TplcFiE2y-8eAIH-y_r55w_3Mo_WM3H";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
