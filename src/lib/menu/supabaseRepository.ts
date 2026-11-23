import { supabase } from "@/lib/supabase";

import { parseMenuState } from "./schema";
import type { MenuRepository } from "./repository";
import type { MenuImage, MenuState } from "./types";

const ROW_ID = "main";
const BUCKET = "menu-images";

/** Turns an image uploaded from the device (data URL) into a public URL in Supabase Storage. */
async function uploadIfNeeded(image: MenuImage): Promise<MenuImage> {
  if (!image.src.startsWith("data:")) return image;

  const blob = await (await fetch(image.src)).blob();
  const ext = blob.type.split("/")[1]?.split("+")[0] || "png";
  const path = `${image.id}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ...image, src: data.publicUrl };
}

/** Cloud storage: everyone reads, only the admin account can write. */
export const supabaseMenuRepository: MenuRepository = {
  shared: true,

  async load() {
    const { data, error } = await supabase
      .from("menu_state")
      .select("data")
      .eq("id", ROW_ID)
      .maybeSingle();
    if (error) throw error;
    return data?.data ? parseMenuState(data.data) : null;
  },

  async save(state: MenuState) {
    const cover = await uploadIfNeeded(state.cover);
    const pages = await Promise.all(state.pages.map(uploadIfNeeded));
    const next: MenuState = { ...state, cover, pages };

    const { error } = await supabase
      .from("menu_state")
      .upsert({ id: ROW_ID, data: next, updated_at: new Date().toISOString() });
    if (error) throw error;
  },

  async clear() {
    const { error } = await supabase.from("menu_state").delete().eq("id", ROW_ID);
    if (error) throw error;
  },
};
