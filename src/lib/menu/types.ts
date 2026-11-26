export interface MenuImage {
  id: string;
  /** Image URL: a CDN URL for built-in pages, or a data URL for pages uploaded on this device. */
  src: string;
  name: string;
}

export interface GeneralSettings {
  restaurantName: string;
  subtitle: string;
  menuTitle: string;
  headerText: string;
  showHeader: boolean;
  showCounter: boolean;
  showArrows: boolean;
  showFullscreen: boolean;
}

export interface ThemeSettings {
  presetId: string;
  background: string;
  primary: string;
  accent: string;
  text: string;
  page: string;
  /** 0.6 – 1: share of the available space the book fills. */
  bookScale: number;
  /** 0 – 1: strength of page and book shadows. */
  shadow: number;
  /** 0 – 20 px corner radius of the pages. */
  radius: number;
}

export interface MenuState {
  version: 1;
  general: GeneralSettings;
  theme: ThemeSettings;
  cover: MenuImage;
  backCover?: MenuImage;
  pages: MenuImage[];
}
