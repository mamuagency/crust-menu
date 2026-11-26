import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from "@/lib/supabase";

import { parseMenuState } from "./schema";
import type { MenuRepository } from "./repository";
import type { MenuImage, MenuState } from "./types";
import { clearUploads, startUploads, updateUpload } from "./uploadProgress";

const ROW_ID = "main";
const BUCKET = "menu-images";

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Uploads a file and reports real progress (0-100). */
async function uploadWithProgress(path: string, blob: Blob, onProgress: (p: number) => void): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("You are not logged in. Please log in again.");

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(path)}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", SUPABASE_ANON_KEY);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.setRequestHeader("Content-Type", blob.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(blob);
  });
}

async function uploadIfNeeded(image: MenuImage): Promise<MenuImage> {
  if (!image.src.startsWith("data:")) return image;

  const blob = dataUrlToBlob(image.src);
  const ext = blob.type.split("/")[1]?.split("+")[0] || "png";
  const path = `${image.id}-${Date.now()}.${ext}`;

  try {
    await uploadWithProgress(path, blob, (percent) => updateUpload(image.id, { percent }));
  } catch (error) {
    updateUpload(image.id, { status: "error" });
    throw error;
  }
  updateUpload(image.id, { percent: 100, status: "done" });

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ...image, src: data.publicUrl };
}

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
    const pending = [state.cover, ...state.pages].filter((i) => i.src.startsWith("data:"));
    if (pending.length > 0) startUploads(pending.map((i) => ({ id: i.id, name: i.name })));

    try {
      const cover = await uploadIfNeeded(state.cover);
      const pages = await Promise.all(state.pages.map(uploadIfNeeded));
      const next: MenuState = { ...state, cover, pages };

      const { error } = await supabase
        .from("menu_state")
        .upsert({ id: ROW_ID, data: next, updated_at: new Date().toISOString() });
      if (error) throw error;
      clearUploads(1500);
    } catch (error) {
      clearUploads(5000);
      throw error;
    }
  },

  async clear() {
    const { error } = await supabase.from("menu_state").delete().eq("id", ROW_ID);
    if (error) throw error;
  },
};
