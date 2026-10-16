// Art is authored for a 64x32 tile (2:1). SCALE enlarges everything on screen.
export const SCALE = 1.5;

export const GRID = {
  cols: 18,
  rows: 18,
  tileW: 32 * SCALE,
  tileH: 16 * SCALE,
  margin: 260, // extra room so tall sprites near the top edge aren't cut off
  gapX: 8,
  gapY: 8,
};

export const ZOOM_MAX = 1.5;
export const ZOOM_START_MULT = 1.25;
export const DRAG_THRESHOLD = 6;

export const WINDMILL_FRAMES = 30;
export const WINDMILL_FPS = 24;
export const WINDMILL_SCALE = 0.9; // on-screen height = WINDMILL_FRAME * scale (~460px). Tune by eye.
export const WINDMILL_ORIGIN_Y = 0.978; // base-disc centre inside the frame (measured: 1002/1024)
