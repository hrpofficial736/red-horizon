import Phaser from "phaser";
import blockImg from "../assets/habitat.png";
import water from "../assets/water extractor.png";
import greenHouse from "../assets/green house.png";
// import windmillspriteIMG from "../assets/spritesheet.png";
// import windmillspritejson from "../assets/spritesheet.json";

// ---- Tunables -------------------------------------------------------------
// Art is authored for a 64x32 tile (2:1). SCALE enlarges everything on screen.
const SCALE = 2;
export const GRID = {
  cols: 16,
  rows: 16,
  tileW: 64 * SCALE,
  tileH: 32 * SCALE,
  margin: 260, // extra room so tall sprites near the top edge aren't cut off
};
const ZOOM_MAX = 2.5;
const ZOOM_START_MULT = 1.25;
const DRAG_THRESHOLD = 6;

// ---- Windmill animation (spritesheet made with pack_frames.py) --------------
const WINDMILL_FRAMES = 30;
const WINDMILL_FPS = 24;
const WINDMILL_SCALE = 0.9; // on-screen height = WINDMILL_FRAME * scale (~460px). Tune by eye.
const WINDMILL_ORIGIN_Y = 0.978; // base-disc centre inside the frame (measured: 1002/1024)

// ---- Module definitions -----------------------------------------------------
// w,h      = FOOTPRINT in tiles (what it occupies on the grid)
// texture  = image key; image size is independent of the footprint (tall is fine)
// height/color = only used for the placeholder box when the texture isn't loaded
export interface ModuleDef {
  id: string;
  w: number;
  h: number;
  texture: string;
  height: number;
  color: number;
  anim?: string; // animation key to play on the placed sprite
  frames?: number; // number of frames (used for a random start frame)
  anchor?: "bottom" | "center"; // bottom = footprint's bottom corner, center = ground centre of footprint
  originY?: number; // sprite origin Y when anchor = "center"
  scale?: number; // overrides SCALE for this module
}
export const MODULES: Record<string, ModuleDef> = {
  block: {
    id: "block",
    w: 1,
    h: 1,
    texture: "block",
    height: 32 * SCALE,
    color: 0x6bbf4e,
    scale: 0.125,
  },
  habitat: {
    id: "habitat",
    w: 2,
    h: 2,
    texture: "habitat",
    height: 62,
    color: 0xcccccc,
    anchor: "center",
    originY: 0.64,
    scale: 0.132,
  },
  water: {
    id: "water",
    w: 2,
    h: 2,
    texture: "water",
    height: 62,
    color: 0xcccccc,
    anchor: "center",
    originY: 0.68,
    scale: 0.3,
  },
  GreenHouse: {
    id: "greenHouse",
    w: 3,
    h: 6,
    texture: "greenHouse",
    height: 62,
    color: 0xcccccc,
    anchor: "center",
    originY: 0.57,
    scale: 0.64,
  },
  panel: {
    id: "panel",
    w: 2,
    h: 2,
    texture: "panel",
    height: 24 * SCALE,
    color: 0x4a6fa5,
  },
  windmill: {
    id: "windmill",
    w: 1,
    h: 1,
    texture: "windmill",
    height: 130 * SCALE,
    color: 0xdddddd,
    anim: "windmill-spin",
    frames: WINDMILL_FRAMES,
    anchor: "center",
    originY: WINDMILL_ORIGIN_Y,
    scale: WINDMILL_SCALE,
  },
};

type Pt = { x: number; y: number };
type Footprint = { top: Pt; right: Pt; bottom: Pt; left: Pt };
interface Placed {
  uid: number;
  def: ModuleDef;
  col: number;
  row: number;
  view: Phaser.GameObjects.GameObject;
}

export class IsoScene extends Phaser.Scene {
  private minZoom = 0.5;
  private halfW = 0;
  private halfH = 0;

  private downX = 0;
  private downY = 0;
  private dragged = false;
  private pinching = false;
  private lastPinchDist = 0;

  private selected: ModuleDef | null = MODULES.block;
  private hoverTile: { col: number; row: number } | null = null;
  private ghost!: Phaser.GameObjects.Graphics;
  private ghostImg!: Phaser.GameObjects.Image;

  private occ: number[][] = []; // occ[col][row] = uid of module covering that tile (0 = free)
  private placed = new Map<number, Placed>();
  private nextUid = 1;

  private readonly originY = -((GRID.cols + GRID.rows - 2) * GRID.tileH) / 4;

  constructor() {
    super("IsoScene");
  }

  // ---- Assets --------------------------------------------------------------
  preload() {
    this.load.image("water", water); // 64x64, 1x1 footprint
    this.load.image("habitat", blockImg); // 64x64, 1x1 footprint
    this.load.image("greenHouse", greenHouse); // 64x64, 1x1 footprint
    // this.load.image("panel", "assets/panel.png");       // 2x2: ground diamond 128x64
    // this.load.atlas("windmill", windmillspriteIMG, windmillspritejson);
  }

  // ---- Isometric math ----------------------------------------------------------
  /** Tile centre in world space. Works with fractional col/row too (it's linear). */
  private tileToWorld(col: number, row: number): Pt {
    return {
      x: ((col - row) * GRID.tileW) / 2,
      y: this.originY + ((col + row) * GRID.tileH) / 2,
    };
  }

  private worldToTile(wx: number, wy: number) {
    const a = wx / (GRID.tileW / 2);
    const b = (wy - this.originY) / (GRID.tileH / 2);
    const col = Math.round((a + b) / 2);
    const row = Math.round((b - a) / 2);
    if (col < 0 || row < 0 || col >= GRID.cols || row >= GRID.rows) return null;
    return { col, row };
  }

  private screenToWorld(px: number, py: number): Pt {
    const cam = this.cameras.main;
    const z = cam.zoom;
    return {
      x: cam.scrollX + cam.width / 2 - cam.width / (2 * z) + px / z,
      y: cam.scrollY + cam.height / 2 - cam.height / (2 * z) + py / z,
    };
  }

  /** Ground diamond of a w x h footprint anchored at (col,row). */
  private footprint(col: number, row: number, w: number, h: number): Footprint {
    const hw = GRID.tileW / 2;
    const hh = GRID.tileH / 2;
    const a = this.tileToWorld(col, row);
    const b = this.tileToWorld(col + w - 1, row);
    const c = this.tileToWorld(col + w - 1, row + h - 1);
    const d = this.tileToWorld(col, row + h - 1);
    return {
      top: { x: a.x, y: a.y - hh },
      right: { x: b.x + hw, y: b.y },
      bottom: { x: c.x, y: c.y + hh },
      left: { x: d.x - hw, y: d.y },
    };
  }

  // ---- Lifecycle -----------------------------------------------------------
  create() {
    this.input.addPointer(1);
    this.input.mouse?.disableContextMenu();

    // Pixel art stays crisp; the high-res windmill keeps smooth filtering
    if (this.textures.exists("block"))
      this.textures.get("block").setFilter(Phaser.Textures.FilterMode.NEAREST);

    // Animations are global to the game, so only create once
    if (
      this.textures.exists("windmill") &&
      !this.anims.exists("windmill-spin")
    ) {
      this.anims.create({
        key: "windmill-spin",
        frames: this.anims.generateFrameNames("windmill", {
          start: 1,
          end: WINDMILL_FRAMES,
          zeroPad: 4,
          suffix: ".png",
        }),
        frameRate: WINDMILL_FPS,
        repeat: -1,
      });
    }

    this.occ = Array.from({ length: GRID.cols }, () =>
      new Array<number>(GRID.rows).fill(0),
    );
    this.drawGrid();
    this.ghost = this.add.graphics().setDepth(100000);
    this.ghostImg = this.add
      .image(0, 0, "habitat")
      .setVisible(false)
      .setDepth(100001);

    this.refreshCamera(true);
    this.scale.on("resize", () => this.refreshCamera(false));

    this.input.on("pointerdown", this.onDown, this);
    this.input.on("pointermove", this.onMove, this);
    this.input.on("pointerup", this.onUp, this);
    this.input.on("wheel", this.onWheel, this);

    // Test keys: 1 = block, 2 = panel (2x2), 3 = windmill (tall 1x1), 4 = greenHouse (6x6), Esc = none
    this.input.keyboard?.on("keydown-ONE", () => this.select("habitat"));
    this.input.keyboard?.on("keydown-TWO", () => this.select("panel"));
    this.input.keyboard?.on("keydown-THREE", () => this.select("windmill"));
    this.input.keyboard?.on("keydown-FOUR", () => this.select("GreenHouse"));
    this.input.keyboard?.on("keydown-FIVE", () => this.select("water"));
    this.input.keyboard?.on("keydown-ESC", () => this.select(null));

    // React -> Phaser:  game.events.emit("select-module", "panel")
    this.game.events.on("select-module", this.select, this);
    this.events.once("shutdown", () =>
      this.game.events.off("select-module", this.select, this),
    );
  }

  // ---- Camera --------------------------------------------------------------
  private refreshCamera(initial: boolean) {
    const cam = this.cameras.main;
    this.halfW = ((GRID.cols + GRID.rows) * GRID.tileW) / 4 + GRID.margin;
    this.halfH = ((GRID.cols + GRID.rows) * GRID.tileH) / 4 + GRID.margin;
    this.minZoom = Math.min(
      cam.width / (this.halfW * 2),
      cam.height / (this.halfH * 2),
    );

    if (initial) {
      cam.setZoom(Math.min(this.minZoom * ZOOM_START_MULT, ZOOM_MAX));
      cam.centerOn(0, 0);
    } else {
      cam.setZoom(Phaser.Math.Clamp(cam.zoom, this.minZoom, ZOOM_MAX));
    }
  }

  update() {
    const cam = this.cameras.main;
    const viewW = cam.width / cam.zoom;
    const viewH = cam.height / cam.zoom;
    const clampAxis = (center: number, view: number, half: number) =>
      view >= half * 2
        ? 0
        : Phaser.Math.Clamp(center, -half + view / 2, half - view / 2);

    const cx = clampAxis(cam.scrollX + cam.width / 2, viewW, this.halfW);
    const cy = clampAxis(cam.scrollY + cam.height / 2, viewH, this.halfH);
    cam.scrollX = cx - cam.width / 2;
    cam.scrollY = cy - cam.height / 2;
  }

  private zoomAt(px: number, py: number, targetZoom: number) {
    const cam = this.cameras.main;
    const z2 = Phaser.Math.Clamp(targetZoom, this.minZoom, ZOOM_MAX);
    if (z2 === cam.zoom) return;
    const before = this.screenToWorld(px, py);
    cam.setZoom(z2);
    cam.scrollX = before.x - cam.width / 2 + cam.width / (2 * z2) - px / z2;
    cam.scrollY = before.y - cam.height / 2 + cam.height / (2 * z2) - py / z2;
  }

  // ---- Input ---------------------------------------------------------------
  private onDown(p: Phaser.Input.Pointer) {
    this.downX = p.x;
    this.downY = p.y;
    this.dragged = false;
    this.updateHover(p);
  }

  private onMove(p: Phaser.Input.Pointer) {
    const cam = this.cameras.main;
    const { pointer1, pointer2 } = this.input;

    if (pointer1.isDown && pointer2.isDown) {
      this.pinching = true;
      this.dragged = true;
      const dist = Phaser.Math.Distance.Between(
        pointer1.x,
        pointer1.y,
        pointer2.x,
        pointer2.y,
      );
      if (this.lastPinchDist > 0) {
        this.zoomAt(
          (pointer1.x + pointer2.x) / 2,
          (pointer1.y + pointer2.y) / 2,
          cam.zoom * (dist / this.lastPinchDist),
        );
      }
      this.lastPinchDist = dist;
      return;
    }
    this.lastPinchDist = 0;

    if (p.isDown && !this.pinching) {
      if (!this.dragged) {
        if (
          Phaser.Math.Distance.Between(this.downX, this.downY, p.x, p.y) <
          DRAG_THRESHOLD
        )
          return;
        this.dragged = true;
      }
      cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom;
      cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
    }
    this.updateHover(p);
  }

  private onUp(p: Phaser.Input.Pointer) {
    if (!this.dragged && !this.pinching) {
      if (p.button === 2) {
        this.select(null);
      } else if (this.selected) {
        this.updateHover(p);
        const a = this.anchor();
        if (a) this.tryPlace(a.col, a.row);
        this.drawGhost();
      }
    }
    if (!this.input.pointer1.isDown && !this.input.pointer2.isDown) {
      this.pinching = false;
      this.lastPinchDist = 0;
    }
  }

  private onWheel(
    p: Phaser.Input.Pointer,
    _o: unknown,
    _dx: number,
    dy: number,
  ) {
    this.zoomAt(p.x, p.y, this.cameras.main.zoom * Math.exp(-dy * 0.001));
    this.updateHover(p);
  }

  private updateHover(p: Phaser.Input.Pointer) {
    const w = this.screenToWorld(p.x, p.y);
    this.hoverTile = this.worldToTile(w.x, w.y);
    this.drawGhost();
  }

  // ---- Building ------------------------------------------------------------
  private select(id: string | null) {
    this.selected = id ? (MODULES[id] ?? null) : null;
    this.drawGhost();
  }

  /** Footprint anchor (top corner): centre it on the hovered tile, keep it inside the grid. */
  private anchor() {
    if (!this.selected || !this.hoverTile) return null;
    const { w, h } = this.selected;
    const col = Math.max(
      0,
      Math.min(GRID.cols - w, this.hoverTile.col - Math.floor(w / 2)),
    );
    const row = Math.max(
      0,
      Math.min(GRID.rows - h, this.hoverTile.row - Math.floor(h / 2)),
    );
    return { col, row };
  }

  private canPlace(def: ModuleDef, col: number, row: number) {
    if (
      col < 0 ||
      row < 0 ||
      col + def.w > GRID.cols ||
      row + def.h > GRID.rows
    )
      return false;
    for (let c = col; c < col + def.w; c++)
      for (let r = row; r < row + def.h; r++)
        if (this.occ[c][r] !== 0) return false;
    return true;
  }

  private tryPlace(col: number, row: number) {
    const def = this.selected;
    if (!def || !this.canPlace(def, col, row)) return false;

    const uid = this.nextUid++;
    for (let c = col; c < col + def.w; c++)
      for (let r = row; r < row + def.h; r++) this.occ[c][r] = uid;

    this.placed.set(uid, {
      uid,
      def,
      col,
      row,
      view: this.createView(def, col, row),
    });
    this.game.events.emit("module-placed", { uid, id: def.id, col, row });
    return true;
  }

  /** Which module covers this tile? Use this for click-to-inspect instead of sprite hit boxes. */
  getModuleAt(col: number, row: number) {
    const uid = this.occ[col]?.[row];
    return uid ? (this.placed.get(uid) ?? null) : null;
  }

  private createView(def: ModuleDef, col: number, row: number) {
    const fp = this.footprint(col, row, def.w, def.h);
    // Draw order = the footprint's FRONT tile. Tall sprites overlap tiles behind them correctly.
    const depth = col + def.w - 1 + (row + def.h - 1);

    if (this.textures.exists(def.texture)) {
      // Sprite's bottom-centre sits on the footprint's bottom corner; the image can rise as high as it likes.
      const s = this.spriteAnchor(def, col, row, fp);
      const sprite = this.add
        .sprite(s.x, s.y, def.texture)
        .setOrigin(0.5, s.oy)
        .setScale(def.scale ?? SCALE)
        .setDepth(depth);
      if (def.anim && this.anims.exists(def.anim)) {
        // random start frame so several windmills don't spin in lock-step
        sprite.play({
          key: def.anim,
          startFrame: Phaser.Math.Between(0, (def.frames ?? 1) - 1),
        });
      }
      return sprite;
    }
    const g = this.add.graphics().setDepth(depth);
    this.drawBox(g, fp, def.height, def.color, 1);
    return g;
  }

  /** Where to put the sprite and which origin to use. */
  private spriteAnchor(
    def: ModuleDef,
    col: number,
    row: number,
    fp: Footprint,
  ) {
    if (def.anchor === "center") {
      // sprite's base-centre sits on the middle of the footprint (e.g. a windmill's tower)
      const c = this.tileToWorld(col + (def.w - 1) / 2, row + (def.h - 1) / 2);
      return { x: c.x, y: c.y, oy: def.originY ?? 1 };
    }
    // sprite's bottom-centre sits on the footprint's bottom corner
    return { x: fp.bottom.x, y: fp.bottom.y, oy: 1 };
  }

  // ---- Drawing -------------------------------------------------------------
  private poly(
    g: Phaser.GameObjects.Graphics,
    pts: Pt[],
    color: number,
    alpha: number,
  ) {
    g.fillStyle(color, alpha);
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    g.closePath();
    g.fillPath();
  }

  private drawBox(
    g: Phaser.GameObjects.Graphics,
    fp: Footprint,
    height: number,
    color: number,
    alpha: number,
  ) {
    const up = (p: Pt): Pt => ({ x: p.x, y: p.y - height });
    const shade = (pct: number) =>
      Phaser.Display.Color.IntegerToColor(color).darken(pct).color;
    const { top, right, bottom, left } = fp;
    this.poly(g, [left, bottom, up(bottom), up(left)], shade(25), alpha);
    this.poly(g, [right, bottom, up(bottom), up(right)], shade(45), alpha);
    this.poly(g, [up(top), up(right), up(bottom), up(left)], color, alpha);
  }

  private drawGhost() {
    const g = this.ghost;
    g.clear();
    this.ghostImg.setVisible(false);
    if (!this.hoverTile) return;

    // Nothing selected -> just highlight the hovered tile
    if (!this.selected) {
      const fp = this.footprint(this.hoverTile.col, this.hoverTile.row, 1, 1);
      this.poly(g, [fp.top, fp.right, fp.bottom, fp.left], 0xffd166, 0.45);
      return;
    }

    const a = this.anchor();
    if (!a) return;
    const def = this.selected;
    const ok = this.canPlace(def, a.col, a.row);
    const color = ok ? 0x44ff88 : 0xff4455;
    const fp = this.footprint(a.col, a.row, def.w, def.h);

    this.poly(g, [fp.top, fp.right, fp.bottom, fp.left], color, 0.5); // ground footprint

    if (this.textures.exists(def.texture)) {
      const s = this.spriteAnchor(def, a.col, a.row, fp);
      this.ghostImg
        .setTexture(def.texture, def.anim ? "0001.png" : undefined)
        .setOrigin(0.5, s.oy)
        .setScale(def.scale ?? SCALE)
        .setPosition(s.x, s.y)
        .setAlpha(0.7)
        .setVisible(true);
      if (ok) this.ghostImg.clearTint();
      else this.ghostImg.setTint(0xff6666);
    } else {
      this.drawBox(g, fp, def.height, color, 0.35);
    }
  }

  private drawGrid() {
    const g = this.add.graphics().setDepth(-1);
    const hw = GRID.tileW / 2;
    const hh = GRID.tileH / 2;
    for (let c = 0; c < GRID.cols; c++) {
      for (let r = 0; r < GRID.rows; r++) {
        const { x, y } = this.tileToWorld(c, r);
        const pts = [
          { x, y: y - hh },
          { x: x + hw, y },
          { x, y: y + hh },
          { x: x - hw, y },
        ];
        this.poly(g, pts, (c + r) % 2 === 0 ? 0x8a4b32 : 0x7c4330, 1);
        g.lineStyle(1, 0x3d2016, 0.8);
        g.strokePoints(pts, true);
      }
    }
  }
}
