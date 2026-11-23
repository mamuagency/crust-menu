import coverAsset from "@/assets/cover.jpg.asset.json";
import page1Asset from "@/assets/menu_001.jpg.asset.json";
import page2Asset from "@/assets/menu_002.jpg.asset.json";

import type { MenuState, ThemeSettings } from "./types";

export interface ThemePreset {
  id: string;
  name: string;
  colors: Pick<ThemeSettings, "background" | "primary" | "accent" | "text" | "page">;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "midnight-gold",
    name: "Midnight Gold",
    colors: { background: "#0a1730", primary: "#c39662", accent: "#efe3d6", text: "#f1e7da", page: "#060f22" },
  },
  {
    id: "espresso",
    name: "Espresso",
    colors: { background: "#1e1410", primary: "#c8915a", accent: "#ead8c0", text: "#f3e6d3", page: "#120c09" },
  },
  {
    id: "ivory-ink",
    name: "Ivory & Ink",
    colors: { background: "#f1eadf", primary: "#9a6b35", accent: "#1d2a44", text: "#1d2433", page: "#ddd1bd" },
  },
  {
    id: "emerald-brass",
    name: "Emerald Brass",
    colors: { background: "#0d2620", primary: "#c9a45c", accent: "#e9e0c9", text: "#efe8d6", page: "#071812" },
  },
  {
    id: "noir",
    name: "Noir",
    colors: { background: "#0d0d0f", primary: "#d4af6a", accent: "#e8e2d6", text: "#ecebe8", page: "#050506" },
  },
];

const defaultPreset = THEME_PRESETS[0]!;

export function createDefaultState(): MenuState {
  return {
    version: 1,
    general: {
      restaurantName: "Crust",
      subtitle: "Dessert & Coffee",
      menuTitle: "The Menu",
      headerText: "In Crust .. we trust",
      showHeader: true,
      showCounter: true,
      showArrows: true,
      showFullscreen: true,
    },
    theme: {
      presetId: defaultPreset.id,
      ...defaultPreset.colors,
      bookScale: 0.96,
      shadow: 0.6,
      radius: 4,
    },
    cover: { id: "default-cover", src: coverAsset.url, name: "Cover.jpg" },
    pages: [
      { id: "default-page-1", src: page1Asset.url, name: "Menu_001.jpg" },
      { id: "default-page-2", src: page2Asset.url, name: "Menu_002.jpg" },
    ],
  };
}
