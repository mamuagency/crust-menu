import { del, get, set } from "idb-keyval";

import { parseMenuState } from "./schema";
import type { MenuState } from "./types";

/**
 * Where menu settings and page images are kept. Swap this implementation for a
 * cloud-backed one to share admin changes across devices.
 */
export interface MenuRepository {
  /** True when changes are visible on every device, not only this browser. */
  readonly shared: boolean;
  load(): Promise<MenuState | null>;
  save(state: MenuState): Promise<void>;
  clear(): Promise<void>;
}

const STORAGE_KEY = "crust-menu-state-v1";

/** Browser storage (IndexedDB): survives refreshes, but only on this device. */
export const browserMenuRepository: MenuRepository = {
  shared: false,
  async load() {
    if (typeof indexedDB === "undefined") return null;
    const raw = await get(STORAGE_KEY);
    return raw ? parseMenuState(raw) : null;
  },
  async save(state) {
    await set(STORAGE_KEY, state);
  },
  async clear() {
    await del(STORAGE_KEY);
  },
};
