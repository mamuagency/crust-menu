import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { PageFlip } from "page-flip";

import { pageSide, type Orientation } from "@/lib/menu/layout";

export interface FlipBookPage {
  id: string;
  src: string;
  alt: string;
  hard: boolean;
}

export interface FlipBookHandle {
  next: () => void;
  prev: () => void;
  flipTo: (index: number) => void;
}

interface FlipBookProps {
  pages: FlipBookPage[];
  pageWidth: number;
  pageHeight: number;
  orientation: Orientation;
  startPage: number;
  shadow: number;
  flippingTime: number;
  onFlip: (index: number) => void;
  onStateChange: (state: string) => void;
}

/**
 * Wraps the StPageFlip engine. The engine moves page nodes around itself, so the
 * pages are built outside React inside an empty host element and rebuilt when
 * size, orientation or the page list changes.
 */
export const FlipBook = forwardRef<FlipBookHandle, FlipBookProps>(function FlipBook(
  { pages, pageWidth, pageHeight, orientation, startPage, shadow, flippingTime, onFlip, onStateChange },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const callbacks = useRef({ onFlip, onStateChange });
  callbacks.current = { onFlip, onStateChange };
  const startRef = useRef(startPage);
  startRef.current = startPage;

  useImperativeHandle(ref, () => ({
    next: () => flipRef.current?.flipNext("bottom"),
    prev: () => flipRef.current?.flipPrev("bottom"),
    flipTo: (index) => {
      const flip = flipRef.current;
      if (!flip) return;
      if (flip.getCurrentPageIndex() === index) return;
      flip.flip(index, "bottom");
    },
  }));

  const pagesKey = pages.map((p) => `${p.id}:${p.hard}`).join("|");

  useEffect(() => {
    const host = hostRef.current;
    if (!host || pages.length === 0 || pageWidth < 40 || pageHeight < 40) return;
    let disposed = false;
    let instance: PageFlip | null = null;
    const root = document.createElement("div");
    root.style.width = `${orientation === "landscape" ? pageWidth * 2 : pageWidth}px`;
    root.style.height = `${pageHeight}px`;
    host.appendChild(root);

    const elements = pages.map((page, index) => {
      const el = document.createElement("div");
      el.className = "flip-page";
      el.dataset["density"] = page.hard ? "hard" : "soft";
      el.dataset["side"] = pageSide(index, orientation);
      const img = document.createElement("img");
      img.className = "flip-page__img";
      img.src = page.src;
      img.alt = page.alt;
      img.draggable = false;
      img.decoding = "async";
      el.appendChild(img);
      return el;
    });

    void import("page-flip").then(({ PageFlip }) => {
      if (disposed) return;
      const start = Math.min(Math.max(0, startRef.current), pages.length - 1);
      instance = new PageFlip(root, {
        width: pageWidth,
        height: pageHeight,
        size: "fixed",
        minWidth: pageWidth,
        maxWidth: pageWidth,
        minHeight: pageHeight,
        maxHeight: pageHeight,
        showCover: true,
        usePortrait: true,
        autoSize: false,
        startPage: start,
        drawShadow: shadow > 0,
        maxShadowOpacity: Math.max(0.05, shadow),
        flippingTime,
        mobileScrollSupport: false,
        useMouseEvents: true,
        showPageCorners: true,
        swipeDistance: 30,
        clickEventForward: true,
        disableFlipByClick: false,
        startZIndex: 0,
      });
      instance.loadFromHTML(elements);
      instance.on("flip", (e) => callbacks.current.onFlip(e.data));
      instance.on("changeState", (e) => callbacks.current.onStateChange(e.data));
      flipRef.current = instance;
      callbacks.current.onFlip(instance.getCurrentPageIndex());
    });

    return () => {
      disposed = true;
      if (instance) {
        // The engine has no stop for its animation loop; neutralise it, then detach listeners.
        const render = instance.getRender();
        render.render = () => {};
        try {
          instance.getUI().destroy();
        } catch {
          /* already detached */
        }
      }
      if (flipRef.current === instance) flipRef.current = null;
      root.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagesKey, pageWidth, pageHeight, orientation, shadow, flippingTime]);

  return <div ref={hostRef} style={{ width: orientation === "landscape" ? pageWidth * 2 : pageWidth, height: pageHeight }} />;
});
