import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { createDefaultState } from "./defaults";
import { browserMenuRepository, type MenuRepository } from "./repository";
import type { MenuState } from "./types";

interface MenuStore {
  /** False until saved settings have been read from storage. */
  loaded: boolean;
  saved: MenuState;
  draft: MenuState;
  dirty: boolean;
  /** Whether saved changes reach other devices. */
  shared: boolean;
  updateDraft: (update: (state: MenuState) => MenuState) => void;
  replaceDraft: (state: MenuState) => void;
  save: () => Promise<void>;
  discard: () => void;
  resetToDefault: () => Promise<void>;
}

const MenuStoreContext = createContext<MenuStore | null>(null);

export function MenuStoreProvider({
  children,
  repository = browserMenuRepository,
}: {
  children: ReactNode;
  repository?: MenuRepository;
}) {
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState<MenuState>(createDefaultState);
  const [draft, setDraft] = useState<MenuState>(saved);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    repository
      .load()
      .then((stored) => {
        if (cancelled || !stored) return;
        setSaved(stored);
        setDraft(stored);
      })
      .catch((error: unknown) => console.error("Could not load saved menu", error))
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  const updateDraft = useCallback((update: (state: MenuState) => MenuState) => {
    setDraft((current) => update(current));
    setDirty(true);
  }, []);

  const replaceDraft = useCallback((state: MenuState) => {
    setDraft(state);
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    await repository.save(draft);
    setSaved(draft);
    setDirty(false);
  }, [draft, repository]);

  const discard = useCallback(() => {
    setDraft(saved);
    setDirty(false);
  }, [saved]);

  const resetToDefault = useCallback(async () => {
    await repository.clear();
    const fresh = createDefaultState();
    setSaved(fresh);
    setDraft(fresh);
    setDirty(false);
  }, [repository]);

  const value = useMemo<MenuStore>(
    () => ({
      loaded,
      saved,
      draft,
      dirty,
      shared: repository.shared,
      updateDraft,
      replaceDraft,
      save,
      discard,
      resetToDefault,
    }),
    [loaded, saved, draft, dirty, repository.shared, updateDraft, replaceDraft, save, discard, resetToDefault],
  );

  return <MenuStoreContext.Provider value={value}>{children}</MenuStoreContext.Provider>;
}

export function useMenuStore(): MenuStore {
  const store = useContext(MenuStoreContext);
  if (!store) throw new Error("useMenuStore must be used inside MenuStoreProvider");
  return store;
}
