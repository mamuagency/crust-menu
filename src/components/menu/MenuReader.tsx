import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Maximize, Minimize, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FlipBook, type FlipBookHandle, type FlipBookPage } from "@/components/menu/FlipBook";
import {
  chooseOrientation,
  computePageSize,
  DEFAULT_IMAGE_ASPECT,
  getBookView,
  pageAspect,
  pageCounterLabel,
  stageGeometry,
  type Area,
} from "@/lib/menu/layout";
import type { MenuState } from "@/lib/menu/types";
import { cn } from "@/lib/utils";

const FLIP_MS = 800;

interface MenuReaderProps {
  state: MenuState;
  ready: boolean;
  adminOpen: boolean;
  onOpenAdmin: () => void;
}

type FullscreenDoc = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
type FullscreenEl = HTMLElement & { webkitRequestFullscreen?: () => void };

function useArea(ref: React.RefObject<HTMLElement | null>): Area | null {
  const [area, setArea] = useState<Area | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const next = { width: Math.round(rect.width), height: Math.round(rect.height) };
      setArea((prev) => (prev && prev.width === next.width && prev.height === next.height ? prev : next));
    };
    measure();
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(measure, 140);
    });
    observer.observe(el);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [ref]);
  return area;
}

function useImageAspect(src: string): number {
  const [aspect, setAspect] = useState(DEFAULT_IMAGE_ASPECT);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) setAspect(img.naturalWidth / img.naturalHeight);
    };
    img.src = src;
  }, [src]);
  return aspect;
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function MenuReader({ state, ready, adminOpen, onOpenAdmin }: MenuReaderProps) {
  const { general, theme, cover } = state;
  const rootRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<FlipBookHandle>(null);
  const area = useArea(areaRef);
  const imageAspect = useImageAspect(cover.src);
  const aspect = pageAspect(imageAspect);
  // Size and shadow rebuild the book, so wait for sliders to settle.
  const bookScale = useDebounced(theme.bookScale, 200);
  const bookShadow = useDebounced(theme.shadow, 200);

  const pages = useMemo<FlipBookPage[]>(
    () => [
      { id: cover.id, src: cover.src, alt: `${general.restaurantName} menu cover`, hard: true },
      ...state.pages.map((p, i) => ({
        id: p.id,
        src: p.src,
        alt: `${general.restaurantName} menu page ${i + 1}`,
        hard: false,
      })),
    ],
    [cover, state.pages, general.restaurantName],
  );
  const total = pages.length;
  const internalCount = state.pages.length;

  const orientation = area ? chooseOrientation(area, aspect) : "landscape";
  const size = area ? computePageSize(area, aspect, orientation, bookScale) : null;

  const [index, setIndex] = useState(0);
  const [geomIndex, setGeomIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const indexRef = useRef(0);

  const view = getBookView(index, total, orientation);
  const geomView = getBookView(geomIndex, total, orientation);
  const geometry = size ? stageGeometry(geomView, orientation, size.width) : { width: 0, offset: 0 };
  const lastView = getBookView(total - 1, total, orientation);
  const atStart = view.kind === "cover";
  const atEnd = view.visible.includes(lastView.visible[lastView.visible.length - 1] ?? 0);

  // Keep the index valid when pages are removed.
  useEffect(() => {
    if (indexRef.current > total - 1) {
      indexRef.current = Math.max(0, total - 1);
      setIndex(indexRef.current);
      setGeomIndex(indexRef.current);
    }
  }, [total]);

  const handleFlip = useCallback((i: number) => {
    indexRef.current = i;
    setIndex(i);
    setGeomIndex(i);
  }, []);

  const handleState = useCallback(
    (s: string) => {
      setBusy(s !== "read");
      if (s === "flipping") {
        // Drag/click flips: predict the destination so the book slides open or closed in step.
        const current = getBookView(indexRef.current, total, orientation);
        if (current.kind === "cover") setGeomIndex(1);
        else if (current.kind === "back") setGeomIndex(indexRef.current - 1);
      } else if (s === "read") {
        setGeomIndex(indexRef.current);
      }
    },
    [total, orientation],
  );

  const next = useCallback(() => {
    if (view.kind === "cover") setGeomIndex(1);
    else if (orientation === "landscape") setGeomIndex(Math.min(total - 1, (view.visible.at(-1) ?? 0) + 1));
    bookRef.current?.next();
  }, [view, orientation, total]);

  const prev = useCallback(() => {
    const first = view.visible[0] ?? 0;
    if (first <= 1) setGeomIndex(0);
    else if (orientation === "landscape") setGeomIndex(first - 1);
    bookRef.current?.prev();
  }, [view, orientation]);

  const toCover = useCallback(() => {
    setGeomIndex(0);
    bookRef.current?.flipTo(0);
  }, []);

  // Keyboard arrows
  useEffect(() => {
    if (adminOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Home") {
        e.preventDefault();
        toCover();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [adminOpen, next, prev, toCover]);

  // Fullscreen (with an in-page fallback where the browser has no fullscreen API, e.g. iPhone)
  const [fullscreen, setFullscreen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  useEffect(() => {
    const onChange = () => {
      const doc = document as FullscreenDoc;
      setFullscreen(Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const doc = document as FullscreenDoc;
    const el = rootRef.current as FullscreenEl | null;
    if (!el) return;
    if (fullscreen) {
      if (doc.exitFullscreen) void doc.exitFullscreen();
      else doc.webkitExitFullscreen?.();
      return;
    }
    if (focusMode) {
      setFocusMode(false);
      return;
    }
    if (el.requestFullscreen && document.fullscreenEnabled !== false) {
      el.requestFullscreen().catch(() => setFocusMode(true));
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else {
      setFocusMode(true);
    }
  }, [fullscreen, focusMode]);

  const expanded = fullscreen || focusMode;
  const showHeader = general.showHeader && !focusMode;
  const sideArrows = general.showArrows && orientation === "landscape";
  const barArrows = general.showArrows && orientation === "portrait";

  const themeStyle = {
    "--menu-bg": theme.background,
    "--menu-text": theme.text,
    "--menu-primary": theme.primary,
    "--menu-accent": theme.accent,
    "--menu-page": theme.page,
    "--book-shadow": String(theme.shadow),
    "--book-radius": `${theme.radius}px`,
    "--book-duration": `${FLIP_MS}ms`,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      style={themeStyle}
      className="menu-backdrop relative flex h-dvh flex-col overflow-hidden font-sans text-menu-text"
    >
      {showHeader && (
        <header className="animate-menu-rise flex flex-none flex-col items-center px-6 pt-5 text-center sm:pt-7">
          {general.menuTitle && (
            <div className="flex items-center gap-3 text-[0.65rem] font-medium uppercase tracking-eyebrow text-menu-primary">
              <span className="ornament-line w-8 sm:w-12" />
              {general.menuTitle}
              <span className="ornament-line w-8 sm:w-12" />
            </div>
          )}
          <h1 className="mt-1.5 font-display text-4xl font-medium leading-none tracking-wide text-menu-text sm:text-5xl">
            {general.restaurantName}
          </h1>
          {general.subtitle && (
            <p className="mt-2 text-[0.7rem] uppercase tracking-eyebrow text-menu-primary">{general.subtitle}</p>
          )}
          {general.headerText && (
            <p className="mt-1.5 font-display text-sm italic text-menu-muted [@media(max-height:720px)]:hidden">
              {general.headerText}
            </p>
          )}
        </header>
      )}

      <main className="flex min-h-0 flex-1 flex-col">
        <div ref={areaRef} className="relative min-h-0 flex-1 px-3 py-4 sm:py-6">
          {ready && size && size.height > 40 && (
            <div className="animate-menu-rise absolute inset-0 flex items-center justify-center gap-6">
              {sideArrows && (
                <Button
                  variant="bookArrow"
                  size="arrow"
                  onClick={prev}
                  disabled={atStart}
                  aria-label="Previous page"
                >
                  <ChevronLeft />
                </Button>
              )}

              <div
                className="book-stage"
                data-busy={busy}
                style={{ width: geometry.width, height: size.height }}
              >
                <div className="book-track" style={{ transform: `translateX(${geometry.offset}px)` }}>
                  <FlipBook
                    ref={bookRef}
                    pages={pages}
                    pageWidth={size.width}
                    pageHeight={size.height}
                    orientation={orientation}
                    startPage={indexRef.current}
                    shadow={bookShadow}
                    flippingTime={FLIP_MS}
                    onFlip={handleFlip}
                    onStateChange={handleState}
                  />
                </div>
              </div>

              {sideArrows && (
                <Button
                  variant="bookArrow"
                  size="arrow"
                  onClick={next}
                  disabled={atEnd}
                  aria-label={atStart ? "Open the menu" : "Next page"}
                  className={cn(atStart && "animate-menu-nudge")}
                >
                  <ChevronRight />
                </Button>
              )}
            </div>
          )}
        </div>

        <nav
          aria-label="Menu navigation"
          className="flex flex-none items-center justify-center gap-1 px-4 pb-5 sm:gap-2 sm:pb-6"
        >
          <Button
            variant="bookControl"
            size="icon"
            onClick={toCover}
            disabled={atStart}
            aria-label="Back to cover"
            title="Back to cover"
          >
            <BookOpen />
          </Button>
          {barArrows && (
            <Button variant="bookArrow" size="icon" onClick={prev} disabled={atStart} aria-label="Previous page">
              <ChevronLeft />
            </Button>
          )}
          {general.showCounter && (
            <p
              aria-live="polite"
              className="min-w-36 text-center text-[0.7rem] uppercase tracking-[0.25em] text-menu-muted"
            >
              {pageCounterLabel(view, internalCount)}
            </p>
          )}
          {barArrows && (
            <Button
              variant="bookArrow"
              size="icon"
              onClick={next}
              disabled={atEnd}
              aria-label={atStart ? "Open the menu" : "Next page"}
              className={cn(atStart && "animate-menu-nudge")}
            >
              <ChevronRight />
            </Button>
          )}
          {general.showFullscreen && (
            <Button
              variant="bookControl"
              size="icon"
              onClick={toggleFullscreen}
              aria-label={expanded ? "Exit full screen" : "Full screen"}
              title={expanded ? "Exit full screen" : "Full screen"}
            >
              {expanded ? <Minimize /> : <Maximize />}
            </Button>
          )}
        </nav>
      </main>

      <Button
        variant="bookControl"
        size="icon"
        onClick={onOpenAdmin}
        aria-label="Menu settings"
        className="absolute right-2 top-2 opacity-35 hover:opacity-100 focus-visible:opacity-100"
      >
        <Settings2 />
      </Button>
    </div>
  );
}
