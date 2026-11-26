/** Share of a page's width reserved for the binding gutter on its spine side. */
export const GUTTER_RATIO = 0.025;

/** Default image ratio of the uploaded menu pages (1357 × 1920). */
export const DEFAULT_IMAGE_ASPECT = 1357 / 1920;

export type Orientation = "landscape" | "portrait";

export interface Area {
  width: number;
  height: number;
}

/** Horizontal room taken by the side arrows in two-page mode. */
export const LANDSCAPE_SIDE_CHROME = 160;
/** Horizontal breathing room around a single page. */
export const PORTRAIT_SIDE_CHROME = 24;

export function pageAspect(imageAspect: number): number {
  return imageAspect * (1 + GUTTER_RATIO);
}

function fitPageHeight(area: Area, aspect: number, pagesAcross: 1 | 2, sideChrome: number) {
  const width = Math.max(0, area.width - sideChrome);
  return Math.max(0, Math.min(area.height, width / (pagesAcross * aspect)));
}

/**
 * Two pages side by side only when there is room for them to stay large;
 * otherwise (phones, tablets held upright) show one page at a time.
 */
export function chooseOrientation(area: Area, aspect: number): Orientation {
  if (area.width < 720) return "portrait";
  const twoUp = fitPageHeight(area, aspect, 2, LANDSCAPE_SIDE_CHROME);
  const oneUp = fitPageHeight(area, aspect, 1, PORTRAIT_SIDE_CHROME);
  return twoUp >= oneUp * 0.75 ? "landscape" : "portrait";
}

export function computePageSize(
  area: Area,
  aspect: number,
  orientation: Orientation,
  scale: number,
): { width: number; height: number } {
  const height =
    orientation === "landscape"
      ? fitPageHeight(area, aspect, 2, LANDSCAPE_SIDE_CHROME)
      : fitPageHeight(area, aspect, 1, PORTRAIT_SIDE_CHROME);
  const h = Math.floor(height * scale);
  return { width: Math.floor(h * aspect), height: h };
}

export type ViewKind = "cover" | "spread" | "single" | "back" | "closedBack";

export interface BookView {
  kind: ViewKind;
  /** Book indexes (0 = cover) currently visible. */
  visible: number[];
}

/**
 * What the reader sees for a flip index. `totalPages` counts the cover plus
 * every internal page. In two-page mode internal pages pair as (1,2), (3,4)…
 */
export function getBookView(index: number, totalPages: number, orientation: Orientation): BookView {
  const last = totalPages - 1;
  const i = Math.max(0, Math.min(index, last));
  if (i === 0) return { kind: "cover", visible: [0] };
  if (orientation === "portrait") {
    return i === last && last > 0 ? { kind: "closedBack", visible: [i] } : { kind: "single", visible: [i] };
  }
  // Landscape: the final hard page shown alone means the book is closed from behind.
  if (i === last) return { kind: "closedBack", visible: [last] };
  const left = i % 2 === 1 ? i : i - 1;
  const right = left + 1;
  if (right >= last) return { kind: "closedBack", visible: [last] };
  return { kind: "spread", visible: [left, right] };
}

/** Page counter text. Internal pages are numbered from 1; the cover is not counted. */
export function pageCounterLabel(view: BookView, internalCount: number): string {
  if (view.kind === "cover") return "Cover";
  if (view.visible.length === 2) {
    return `Pages ${view.visible[0]}–${view.visible[1]} of ${internalCount}`;
  }
  return `Page ${view.visible[0]} of ${internalCount}`;
}

/**
 * Two-page mode keeps the book block two pages wide; when only one page is
 * showing (closed cover or lone last page) the stage narrows to one page and
 * shifts so that page stays centred.
 */
export function stageGeometry(view: BookView, orientation: Orientation, pageWidth: number) {
  if (orientation === "portrait") return { width: pageWidth, offset: 0 };
  if (view.kind === "cover") return { width: pageWidth, offset: -pageWidth };
  if (view.kind === "back") return { width: pageWidth, offset: 0 };
  return { width: pageWidth * 2, offset: 0 };
}

/** Which side of the spine a book index sits on (binding is on the left in one-page mode). */
export function pageSide(index: number, orientation: Orientation): "left" | "right" {
  if (orientation === "portrait") return "right";
  return index % 2 === 1 ? "left" : "right";
}
