declare module "page-flip" {
  export interface FlipSetting {
    startPage: number;
    size: "fixed" | "stretch";
    width: number;
    height: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    drawShadow: boolean;
    flippingTime: number;
    usePortrait: boolean;
    startZIndex: number;
    autoSize: boolean;
    maxShadowOpacity: number;
    showCover: boolean;
    mobileScrollSupport: boolean;
    clickEventForward: boolean;
    useMouseEvents: boolean;
    swipeDistance: number;
    showPageCorners: boolean;
    disableFlipByClick: boolean;
  }
  export interface FlipEvent<T = unknown> {
    data: T;
    object: PageFlip;
  }
  export class PageFlip {
    constructor(element: HTMLElement, setting: Partial<FlipSetting>);
    loadFromHTML(items: HTMLElement[]): void;
    updateFromHtml(items: HTMLElement[]): void;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    flip(page: number, corner?: "top" | "bottom"): void;
    turnToPage(page: number): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getState(): string;
    getOrientation(): "portrait" | "landscape";
    getRender(): { render: (timer: number) => void; drawFrame?: () => void };
    getUI(): { destroy: () => void };
    on(event: "flip", cb: (e: FlipEvent<number>) => void): PageFlip;
    on(event: "changeState", cb: (e: FlipEvent<string>) => void): PageFlip;
    on(event: "init" | "update" | "changeOrientation", cb: (e: FlipEvent) => void): PageFlip;
    off(event: string): void;
  }
}
