import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rkztlgwfmyyjulfuqsds.supabase.co/rest/v1/"; // Project URL بتاعك
const SUPABASE_ANON_KEY = "sb_publishable_TplcFiE2y-8eAIH-y_r55w_3Mo_WM3H";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
