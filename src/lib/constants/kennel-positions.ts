// Kennel positions on the floor plan image (percentage-based coordinates)
// x, y = top-left corner as % of image dimensions
// w, h = width and height as % of image dimensions
//
// Herzien in Story 10.12 na visuele analyse van grondplan-kennels.png:
// - A1..A4 staan in de boven-strip, nu breder en correct gepositioneerd
// - K1..K8 op de binnenste (cream) kolom links, uitgespreid over volledige hoogte
// - H1..H12 op de binnenste (cream) kolom rechts, 12 evenredige vakjes
//
// Wanneer Sven een nieuw grondplan aanlevert hoeft enkel deze file bij te
// werken (en eventueel /public/images/grondplan-kennels.png te vervangen).

export type KennelPosition = {
  code: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

// Top row — "andere dieren" (A1..A4): 4 bredere kamers in de bovenste strip
const topKennels: KennelPosition[] = [
  { code: "A1", x: 22, y: 2.5, w: 11, h: 9 },
  { code: "A2", x: 34, y: 2.5, w: 11, h: 9 },
  { code: "A3", x: 46, y: 2.5, w: 11, h: 9 },
  { code: "A4", x: 58, y: 2.5, w: 11, h: 9 },
];

// Left inner column — katten (K1..K8): 8 gestapelde vakjes op cream-kolom
const leftKennels: KennelPosition[] = [
  { code: "K1", x: 20.5, y: 13.8, w: 11, h: 7 },
  { code: "K2", x: 20.5, y: 21.3, w: 11, h: 7 },
  { code: "K3", x: 20.5, y: 28.8, w: 11, h: 7 },
  { code: "K4", x: 20.5, y: 36.3, w: 11, h: 7 },
  { code: "K5", x: 20.5, y: 43.8, w: 11, h: 7 },
  { code: "K6", x: 20.5, y: 51.3, w: 11, h: 7 },
  { code: "K7", x: 20.5, y: 58.8, w: 11, h: 7 },
  { code: "K8", x: 20.5, y: 66.3, w: 11, h: 7 },
];

// Right inner column — honden (H1..H12): 12 gestapelde vakjes op cream-kolom
const rightKennels: KennelPosition[] = [
  { code: "H1", x: 75, y: 12, w: 11, h: 5.3 },
  { code: "H2", x: 75, y: 17.8, w: 11, h: 5.3 },
  { code: "H3", x: 75, y: 23.6, w: 11, h: 5.3 },
  { code: "H4", x: 75, y: 29.4, w: 11, h: 5.3 },
  { code: "H5", x: 75, y: 35.2, w: 11, h: 5.3 },
  { code: "H6", x: 75, y: 41, w: 11, h: 5.3 },
  { code: "H7", x: 75, y: 46.8, w: 11, h: 5.3 },
  { code: "H8", x: 75, y: 52.6, w: 11, h: 5.3 },
  { code: "H9", x: 75, y: 58.4, w: 11, h: 5.3 },
  { code: "H10", x: 75, y: 64.2, w: 11, h: 5.3 },
  { code: "H11", x: 75, y: 70, w: 11, h: 5.3 },
  { code: "H12", x: 75, y: 75.8, w: 11, h: 5.3 },
];

export const KENNEL_POSITIONS: KennelPosition[] = [
  ...topKennels,
  ...leftKennels,
  ...rightKennels,
];
