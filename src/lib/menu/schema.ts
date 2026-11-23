import { z } from "zod";

import type { MenuState } from "./types";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const image = z.object({ id: z.string().min(1), src: z.string().min(1), name: z.string() });

export const menuStateSchema = z.object({
  version: z.literal(1),
  general: z.object({
    restaurantName: z.string(),
    subtitle: z.string(),
    menuTitle: z.string(),
    headerText: z.string(),
    showHeader: z.boolean(),
    showCounter: z.boolean(),
    showArrows: z.boolean(),
    showFullscreen: z.boolean(),
  }),
  theme: z.object({
    presetId: z.string(),
    background: hex,
    primary: hex,
    accent: hex,
    text: hex,
    page: hex,
    bookScale: z.number().min(0.5).max(1),
    shadow: z.number().min(0).max(1),
    radius: z.number().min(0).max(24),
  }),
  cover: image,
  pages: z.array(image),
});

/** Returns a valid menu state, or null when the data is not a menu settings file. */
export function parseMenuState(data: unknown): MenuState | null {
  const result = menuStateSchema.safeParse(data);
  return result.success ? (result.data as MenuState) : null;
}
