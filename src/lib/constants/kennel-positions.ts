// Kennel positions on the floor plan image (percentage-based coordinates)
// x, y = top-left corner as % of image dimensions
// w, h = width and height as % of image dimensions
// Adjust these values to match the exact floor plan layout

export type KennelPosition = {
  code: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

// Right side kennels (east wall) — honden bovenste rij
const rightTopKennels: KennelPosition[] = [
  { code: "H1", x: 72, y: 5, w: 13, h: 6 },
  { code: "H2", x: 72, y: 11.5, w: 13, h: 6 },
  { code: "H3", x: 72, y: 18, w: 13, h: 6 },
  { code: "H4", x: 72, y: 24.5, w: 13, h: 6 },
  { code: "H5", x: 72, y: 31, w: 13, h: 6 },
  { code: "H6", x: 72, y: 37.5, w: 13, h: 6 },
];

// Right side kennels (east wall) — honden onderste rij
const rightBottomKennels: KennelPosition[] = [
  { code: "H7", x: 72, y: 44, w: 13, h: 6 },
  { code: "H8", x: 72, y: 50.5, w: 13, h: 6 },
  { code: "H9", x: 72, y: 57, w: 13, h: 6 },
  { code: "H10", x: 72, y: 63.5, w: 13, h: 6 },
  { code: "H11", x: 72, y: 70, w: 13, h: 6 },
  { code: "H12", x: 72, y: 76.5, w: 13, h: 6 },
];

// Left side kennels (west wall) — katten
const leftKennels: KennelPosition[] = [
  { code: "K1", x: 2, y: 5, w: 13, h: 6 },
  { code: "K2", x: 2, y: 11.5, w: 13, h: 6 },
  { code: "K3", x: 2, y: 18, w: 13, h: 6 },
  { code: "K4", x: 2, y: 24.5, w: 13, h: 6 },
  { code: "K5", x: 2, y: 31, w: 13, h: 6 },
  { code: "K6", x: 2, y: 37.5, w: 13, h: 6 },
  { code: "K7", x: 2, y: 44, w: 13, h: 6 },
  { code: "K8", x: 2, y: 50.5, w: 13, h: 6 },
];

// Top kennels — andere dieren
const topKennels: KennelPosition[] = [
  { code: "A1", x: 30, y: 0, w: 10, h: 4 },
  { code: "A2", x: 42, y: 0, w: 10, h: 4 },
  { code: "A3", x: 54, y: 0, w: 10, h: 4 },
  { code: "A4", x: 66, y: 0, w: 10, h: 4 },
];

export const KENNEL_POSITIONS: KennelPosition[] = [
  ...rightTopKennels,
  ...rightBottomKennels,
  ...leftKennels,
  ...topKennels,
];
