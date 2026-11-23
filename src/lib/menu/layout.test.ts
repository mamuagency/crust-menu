import { describe, expect, it } from "vitest";

import {
  chooseOrientation,
  computePageSize,
  getBookView,
  pageAspect,
  pageCounterLabel,
  stageGeometry,
  DEFAULT_IMAGE_ASPECT,
} from "./layout";
import { createDefaultState } from "./defaults";

const aspect = pageAspect(DEFAULT_IMAGE_ASPECT);

describe("book opening", () => {
  it("shows the cover alone before the book is opened", () => {
    expect(getBookView(0, 3, "landscape")).toEqual({ kind: "cover", visible: [0] });
  });

  it("opens onto the first two different internal pages on desktop", () => {
    expect(getBookView(1, 3, "landscape").visible).toEqual([1, 2]);
    expect(getBookView(2, 3, "landscape").visible).toEqual([1, 2]);
  });

  it("shows one page at a time on mobile", () => {
    expect(getBookView(1, 3, "portrait").visible).toEqual([1]);
    expect(getBookView(2, 3, "portrait").visible).toEqual([2]);
  });

  it("leaves an odd last page alone instead of pairing it with the cover", () => {
    expect(getBookView(3, 4, "landscape")).toEqual({ kind: "back", visible: [3] });
  });
});

describe("page counter", () => {
  it("never counts the cover as a menu page", () => {
    expect(pageCounterLabel(getBookView(0, 3, "landscape"), 2)).toBe("Cover");
    expect(pageCounterLabel(getBookView(1, 3, "landscape"), 2)).toBe("Pages 1–2 of 2");
    expect(pageCounterLabel(getBookView(2, 3, "portrait"), 2)).toBe("Page 2 of 2");
  });
});

describe("layout", () => {
  it("uses two pages on a desktop screen", () => {
    expect(chooseOrientation({ width: 1280, height: 640 }, aspect)).toBe("landscape");
  });

  it("uses one page on phones and upright tablets", () => {
    expect(chooseOrientation({ width: 390, height: 640 }, aspect)).toBe("portrait");
    expect(chooseOrientation({ width: 768, height: 860 }, aspect)).toBe("portrait");
  });

  it("keeps the whole book inside the available space", () => {
    const area = { width: 1280, height: 640 };
    const size = computePageSize(area, aspect, "landscape", 1);
    expect(size.height).toBeLessThanOrEqual(640);
    expect(size.width * 2 + 160).toBeLessThanOrEqual(1280);
  });

  it("centres the closed cover by showing only its page", () => {
    expect(stageGeometry(getBookView(0, 3, "landscape"), "landscape", 400)).toEqual({
      width: 400,
      offset: -400,
    });
    expect(stageGeometry(getBookView(1, 3, "landscape"), "landscape", 400).width).toBe(800);
  });
});

describe("default menu", () => {
  it("uses the first uploaded image as the cover and the rest as pages in order", () => {
    const state = createDefaultState();
    expect(state.cover.name).toBe("Cover.jpg");
    expect(state.pages.map((p) => p.name)).toEqual(["Menu_001.jpg", "Menu_002.jpg"]);
  });
});
