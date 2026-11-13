import Phaser from "phaser";
import { TEXTURE_IMPORTS } from "../utils/textureImports";

import {
  GRID,
  SCALE,
  ZOOM_MAX,
  ZOOM_START_MULT,
  DRAG_THRESHOLD,
} from "../config/config";

import type { Footprint, Pt, Placed, ModuleDef } from "../modules/module.types";
import { MODULES } from "../modules/moduleDefinitions";
import { useGameStore } from "../../store/useGameStore";
// import windmillspriteIMG from "../assets/spritesheet.png";
// import windmillspritejson from "../assets/spritesheet.json";

// ---- Module definitions -----------------------------------------------------
// w,h      = FOOTPRINT in tiles (what it occupies on the grid)
// texture  = image key; image size is independent of the footprint (tall is fine)
// height/color = only used for the placeholder box when the texture isn't loaded

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
  private hoveredModuleUid: number | null = null;
  private movingModuleUid: number | null = null;

  private gridOffsetX = 24;
  private gridOffsetY = -52;

  private readonly originY = -((GRID.cols + GRID.rows - 2) * GRID.tileH) / 4;

  /**-------------------------------------------------------------------------------------------------------
     * Initializes the isometric game scene.
     * Sets up input handling, the grid, background, placement preview,
     * camera controls, keyboard shortcuts, and React-to-Phaser events.
     -------------------------------------------------------------------------------------------------------*/
  constructor() {
    super("IsoScene");
  }

  // --------------------------------- Assets --------------------------------------------------------------

  /**-------------------------------------------------------------------------------------------------------
     * Loads all image assets required by the game scene.
     * Texture keys are mapped to their corresponding image paths.
     -------------------------------------------------------------------------------------------------------*/
  preload() {
    for (const [key, path] of Object.entries(TEXTURE_IMPORTS)) {
      this.load.image(key, path);
    }
  }

  private initiateGameStateWithDefaultModules() {
    // console.log(this.selected, this.nextUid);
    this.select("habitat");
    // console.log(
    //   `initiateGameStateWithDefaultModules:`,
    //   this.selected,
    //   this.nextUid,
    // );
    this.tryPlace(9, 8);
    this.selected = null;

    this.select("life_support");
    this.tryPlace(11, 8);
    this.selected = null;
  }

  // ---- Isometric math ----------------------------------------------------------
  /** Tile centre in world space. Works with fractional col/row too (it's linear). */
  // private tileToWorld(col: number, row: number): Pt {
  //   return {
  //     x: ((col - row) * GRID.tileW) / 2,
  //     y: this.originY + ((col + row) * GRID.tileH) / 2,
  //   };
  // }

  /**----------------------------------------------------------------------------------------------------------------
     * Converts grid coordinates into world coordinates.
     * Supports fractional tile positions and accounts for tile gaps and grid offsets.
     ----------------------------------------------------------------------------------------------------------------*/
  private tileToWorld(col: number, row: number): Pt {
    const pitchW = GRID.tileW + GRID.gapX;
    const pitchH = GRID.tileH + GRID.gapY;

    return {
      x: ((col - row) * pitchW) / 2 + this.gridOffsetX,
      y: this.originY + ((col + row) * pitchH) / 2 + this.gridOffsetY,
    };
  }

  // private worldToTile(wx: number, wy: number) {
  //   const a = wx / (GRID.tileW / 2);
  //   const b = (wy - this.originY) / (GRID.tileH / 2);
  //   const col = Math.round((a + b) / 2);
  //   const row = Math.round((b - a) / 2);
  //   if (col < 0 || row < 0 || col >= GRID.cols || row >= GRID.rows) return null;
  //   return { col, row };
  // }

  /**----------------------------------------------------------------------------------------------------------------
     * Converts world coordinates into the nearest valid grid tile.
     * Returns null when the calculated tile lies outside the grid boundaries.
     ----------------------------------------------------------------------------------------------------------------*/
  private worldToTile(wx: number, wy: number) {
    const pitchW = GRID.tileW + GRID.gapX;
    const pitchH = GRID.tileH + GRID.gapY;

    // Reverse the grid offset applied in tileToWorld()
    const adjustedX = wx - this.gridOffsetX;
    const adjustedY = wy - this.gridOffsetY;

    const a = adjustedX / (pitchW / 2);
    const b = (adjustedY - this.originY) / (pitchH / 2);

    const col = Math.round((a + b) / 2);
    const row = Math.round((b - a) / 2);

    if (col < 0 || row < 0 || col >= GRID.cols || row >= GRID.rows) {
      return null;
    }

    return { col, row };
  }

  /**----------------------------------------------------------------------------------------------------------------
     * Converts screen coordinates into world coordinates using the active camera.
     * Accounts for camera scrolling, viewport dimensions, and zoom level.
     ----------------------------------------------------------------------------------------------------------------*/
  private screenToWorld(px: number, py: number): Pt {
    const cam = this.cameras.main;
    const z = cam.zoom;
    return {
      x: cam.scrollX + cam.width / 2 - cam.width / (2 * z) + px / z,
      y: cam.scrollY + cam.height / 2 - cam.height / (2 * z) + py / z,
    };
  }

  /**----------------------------------------------------------------------------------------------------------------
     * Calculates the outer diamond-shaped footprint of a rectangular module.
     * Uses the module's grid position, width, and height to determine its corners.
     ----------------------------------------------------------------------------------------------------------------*/
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

  // ---------------------------------- Lifecycle -----------------------------------------------------------

  /**----------------------------------------------------------------------------------------------------------------
     * Creates and initializes the game world after assets have loaded.
     * Sets up the occupancy grid, background, tile grid, placement preview,
     * camera, pointer events, keyboard controls, and custom game events.
     ----------------------------------------------------------------------------------------------------------------*/
  create() {
    this.input.addPointer(1);
    this.input.mouse?.disableContextMenu();

    for (const key of Object.keys(TEXTURE_IMPORTS)) {
      if (this.textures.exists(key)) {
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
      }

    }

    this.occ = Array.from({ length: GRID.cols }, () =>
      new Array<number>(GRID.rows).fill(0),
    );
    this.drawMarsBackground();
    this.drawGrid();
    this.ghost = this.add.graphics().setDepth(100000);
    this.ghostImg = this.add
      .image(0, 0, TEXTURE_IMPORTS.habitat)
      .setVisible(false)
      .setDepth(100001);

    this.refreshCamera(true);
    this.scale.on("resize", () => this.refreshCamera(false));

    this.input.on("pointerdown", this.onDown, this);
    this.input.on("pointermove", this.onMove, this);
    this.input.on("pointerup", this.onUp, this);
    this.input.on("wheel", this.onWheel, this);

    // Test keys: 1 = block, 2 = panel (2x2), 3 = windmill (tall 1x1), 4 = greenHouse (6x6), Esc = none
    // this.input.keyboard?.on("keydown-ONE", () => this.select("sample_extractor"));
    // this.input.keyboard?.on("keydown-TWO", () => this.select("beacon"));
    // this.input.keyboard?.on("keydown-THREE", () =>
    //   this.select("communication"),
    // );
    // this.input.keyboard?.on("keydown-FOUR", () => this.select("greenhouse"));
    // this.input.keyboard?.on("keydown-FIVE", () => this.select("water"));
    // this.input.keyboard?.on("keydown-SIX", () => this.select("communication"));
    // this.input.keyboard?.on("keydown-SEVEN", () => this.select("radar"));
    this.input.keyboard?.on("keydown-ESC", () => this.select(null));

    // React -> Phaser:  game.events.emit("select-module", "panel")
    this.game.events.on("select-module", this.select, this);
    this.game.events.on("begin-module-move", this.beginMove, this);
    this.game.events.on("sync-modules", this.syncModules, this);
    this.events.once("shutdown", () =>
      this.game.events.off("select-module", this.select, this),
    );
    this.events.once("shutdown", () =>
      this.game.events.off("begin-module-move", this.beginMove, this),
    );
    const savedModules = useGameStore.getState().placedModules;
    if (savedModules.length > 0) {
      this.syncModules(savedModules);
    } else {
      this.initiateGameStateWithDefaultModules();
    }
    this.time.delayedCall(0, () => {
      const currentModules = useGameStore.getState().placedModules;
      this.syncModules(currentModules);
    });
  }

  private syncModules(
    modules: Array<{
      id: string;
      instanceId?: string;
      x: number;
      y: number;
      constructionHoursRemaining?: number;
    }>,
  ) {
    for (const module of this.placed.values()) {
      module.view.destroy();
      module.label?.destroy();
      module.ring?.destroy();
    }
    this.placed.clear();
    this.occ = Array.from({ length: GRID.cols }, () =>
      new Array<number>(GRID.rows).fill(0),
    );
    this.nextUid = 1;
    this.movingModuleUid = null;
    this.selected = null;

    for (const savedModule of modules) {
      const def = MODULES[savedModule.id];
      const col = savedModule.y;
      const row = savedModule.x;
      if (!def || !this.canPlace(def, col, row)) continue;

      const uid = this.nextUid++;
      for (let occupiedCol = col; occupiedCol < col + def.w; occupiedCol++) {
        for (let occupiedRow = row; occupiedRow < row + def.h; occupiedRow++) {
          this.occ[occupiedCol][occupiedRow] = uid;
        }
      }
      const created = this.createView(def, col, row);
      const placedEntry: Placed = {
        uid,
        def,
        col,
        row,
        instanceId: savedModule.instanceId,
        constructionHoursRemaining: savedModule.constructionHoursRemaining,
        view: created.view,
        label: created.label,
        ring: created.ring,
      };
      this.placed.set(uid, placedEntry);
      this.attachModuleInteraction(placedEntry);
    }
    this.drawGhost();
  }

  /**----------------------------------------------------------------------------------------------------------------
     * Keeps the camera within the playable world boundaries.
     * Prevents the camera from moving beyond the grid and its configured margins.
     ----------------------------------------------------------------------------------------------------------------*/
  update() {
    this.syncConstructionStatus();
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

  // -------------------------------------------- Camera --------------------------------------------------------------
  // private refreshCamera(initial: boolean) {
  //   const cam = this.cameras.main;
  //   this.halfW = ((GRID.cols + GRID.rows) * GRID.tileW) / 4 + GRID.margin;
  //   this.halfH = ((GRID.cols + GRID.rows) * GRID.tileH) / 4 + GRID.margin;
  //   this.minZoom = Math.min(
  //     cam.width / (this.halfW * 2),
  //     cam.height / (this.halfH * 2),
  //   );

  //   if (initial) {
  //     cam.setZoom(Math.min(this.minZoom * ZOOM_START_MULT, ZOOM_MAX));
  //     cam.centerOn(0, 0);
  //   } else {
  //     cam.setZoom(Phaser.Math.Clamp(cam.zoom, this.minZoom, ZOOM_MAX));
  //   }
  // }

  /**----------------------------------------------------------------------------------------------------------------
     * Calculates the camera's playable boundaries and minimum zoom level.
     * Initializes the camera position on first setup or preserves the current
     * zoom within the permitted limits during subsequent updates.
     ----------------------------------------------------------------------------------------------------------------*/
  private refreshCamera(initial: boolean) {
    const cam = this.cameras.main;

    this.halfW = ((GRID.cols + GRID.rows) * GRID.tileW) / 4 + GRID.margin;
    this.halfH = ((GRID.cols + GRID.rows) * GRID.tileH) / 4 + GRID.margin;

    const fitZoom = Math.min(
      cam.width / (this.halfW * 2),
      cam.height / (this.halfH * 2),
    );

    // Minimum zoom is now the initial zoom level.
    this.minZoom = Math.min(fitZoom * ZOOM_START_MULT, ZOOM_MAX);

    if (initial) {
      cam.setZoom(this.minZoom);
      cam.centerOn(0, 0);
    } else {
      cam.setZoom(Phaser.Math.Clamp(cam.zoom, this.minZoom, ZOOM_MAX));
    }
  }

  /**----------------------------------------------------------------------------------------------------------------
     * Zooms the camera around a specific screen position.
     * Keeps the world point beneath the cursor approximately fixed while zooming.
     ----------------------------------------------------------------------------------------------------------------*/
  private zoomAt(px: number, py: number, targetZoom: number) {
    const cam = this.cameras.main;
    const z2 = Phaser.Math.Clamp(targetZoom, this.minZoom, ZOOM_MAX);
    if (z2 === cam.zoom) return;
    const before = this.screenToWorld(px, py);
    cam.setZoom(z2);
    cam.scrollX = before.x - cam.width / 2 + cam.width / (2 * z2) - px / z2;
    cam.scrollY = before.y - cam.height / 2 + cam.height / (2 * z2) - py / z2;
  }

  // ------------------------------------------ Input ---------------------------------------------------------------

  private isOverlayOpen() {
    return (
      window as Window & { __tharsisOverlayOpen?: boolean }
    ).__tharsisOverlayOpen === true;
  }

  /**----------------------------------------------------------------------------------------------------------------
     * Records the pointer's starting position and updates the hovered grid tile.
     * Prepares the scene to distinguish a click from a camera drag.
     ----------------------------------------------------------------------------------------------------------------*/
  private onDown(p: Phaser.Input.Pointer) {
    if (this.isOverlayOpen()) return;
    this.downX = p.x;
    this.downY = p.y;
    this.dragged = false;
    this.updateHover(p);
  }

  /**----------------------------------------------------------------------------------------------------------------
     * Handles pointer movement, camera dragging, and two-pointer pinch zoom.
     * Updates the hovered tile and placement preview as the pointer moves.
     ----------------------------------------------------------------------------------------------------------------*/
  private onMove(p: Phaser.Input.Pointer) {
    if (this.isOverlayOpen()) return;
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

  /**----------------------------------------------------------------------------------------------------------------
     * Handles pointer release and determines whether to place a module,
     * deselect the current module, or finish a camera gesture.
     ----------------------------------------------------------------------------------------------------------------*/
  private onUp(p: Phaser.Input.Pointer) {
    if (this.isOverlayOpen()) return;
    if (!this.dragged && !this.pinching) {
      if (p.button === 2) {
        if (this.movingModuleUid !== null) {
          this.cancelMove();
        } else if (this.hoveredModuleUid === null) {
          this.select(null);
        }
      } else if (this.hoveredModuleUid !== null) {
        // Module interaction is limited to the sprite/placeholder itself.
        // The hover ring and label are visual-only and must not affect placement.
        this.drawGhost();
      } else if (this.selected) {
        this.updateHover(p);
        const a = this.anchor();
        if (a) this.tryPlace(a.col, a.row);
        this.drawGhost();
      } else {
        this.drawGhost();
      }
    }
    if (!this.input.pointer1.isDown && !this.input.pointer2.isDown) {
      this.pinching = false;
      this.lastPinchDist = 0;
    }
  }

  /**----------------------------------------------------------------------------------------------------------------
     * Handles mouse-wheel zooming around the pointer position.
     * Refreshes the hovered tile and placement preview after zooming.
     ----------------------------------------------------------------------------------------------------------------*/
  private onWheel(
    p: Phaser.Input.Pointer,
    _o: unknown,
    _dx: number,
    dy: number,
  ) {
    if (this.isOverlayOpen()) return;
    this.zoomAt(p.x, p.y, this.cameras.main.zoom * Math.exp(-dy * 0.001));
    this.updateHover(p);
  }

  /**----------------------------------------------------------------------------------------------------------------
     * Converts the pointer position into grid coordinates and updates
     * the placement preview to match the currently hovered tile.
     ----------------------------------------------------------------------------------------------------------------*/
  private updateHover(p: Phaser.Input.Pointer) {
    const w = this.screenToWorld(p.x, p.y);
    this.hoverTile = this.worldToTile(w.x, w.y);
    const hoveredModule = this.hoverTile
      ? this.getModuleAt(this.hoverTile.col, this.hoverTile.row)
      : null;
    this.hoveredModuleUid = hoveredModule?.uid ?? null;
    this.drawGhost();
  }

  // ---------------------------------------------- Building ------------------------------------------------------------

  /**----------------------------------------------------------------------------------------------------------------
     * Selects a module definition by its ID.
     * Clears the selection when null is provided and refreshes the preview.
     ----------------------------------------------------------------------------------------------------------------*/
  private select(id: string | null) {
    this.selected = id ? (MODULES[id] ?? null) : null;
    this.drawGhost();
  }

  /**----------------------------------------------------------------------------------------------------------------
     * Calculates the grid position for the selected module.
     * Centers the module around the hovered tile and clamps its footprint
     * so it remains within the grid boundaries.
     ----------------------------------------------------------------------------------------------------------------*/
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

  /**----------------------------------------------------------------------------------------------------------------
     * Checks whether a module can occupy the specified grid position.
     * Rejects placements that exceed the grid boundaries or overlap
     * tiles already occupied by another module.
     ----------------------------------------------------------------------------------------------------------------*/
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
        if (
          this.occ[c][r] !== 0 &&
          this.occ[c][r] !== this.movingModuleUid
        )
          return false;
    return true;
  }

  /**----------------------------------------------------------------------------------------------------------------
     * Places the selected module at the specified grid position.
     * Reserves its footprint, creates its visual representation, stores its
     * placement data, and emits a module-placed event on success.
     ----------------------------------------------------------------------------------------------------------------*/
  private tryPlace(col: number, row: number) {
    if (this.movingModuleUid !== null) {
      return this.tryMove(col, row);
    }
    // console.log(this.selected, this.nextUid);
    const def = this.selected;
    if (!def || !this.canPlace(def, col, row)) return false;

    const uid = this.nextUid++;
    for (let c = col; c < col + def.w; c++)
      for (let r = row; r < row + def.h; r++) this.occ[c][r] = uid;

    const created = this.createView(def, col, row);
    const placedEntry: Placed = {
      uid,
      def,
      col,
      row,
      view: created.view,
      label: created.label,
      ring: created.ring,
      // instanceId
    };

    this.placed.set(uid, placedEntry);
    this.attachModuleInteraction(placedEntry);

    // console.log(this.selected, this.nextUid);
    // if (this.selected?.id !== "habitat") {
    this.game.events.emit("module-placed", { uid, id: def.id, col, row });
    // }

    this.select(null);
    return true;
  }

  private beginMove(uid: number) {
    const module = this.placed.get(uid);
    if (!module) return;

    this.movingModuleUid = uid;
    this.selected = module.def;
    for (let c = module.col; c < module.col + module.def.w; c++) {
      for (let r = module.row; r < module.row + module.def.h; r++) {
        this.occ[c][r] = 0;
      }
    }
    this.setModuleVisible(module.view, false);
    module.label?.setVisible(false);
    module.ring?.setVisible(false);
    this.drawGhost();
  }

  private cancelMove() {
    const module = this.movingModuleUid
      ? this.placed.get(this.movingModuleUid)
      : undefined;
    if (!module) return;

    for (let c = module.col; c < module.col + module.def.w; c++) {
      for (let r = module.row; r < module.row + module.def.h; r++) {
        this.occ[c][r] = module.uid;
      }
    }
    this.setModuleVisible(module.view, true);
    this.movingModuleUid = null;
    this.selected = null;
    this.drawGhost();
  }

  private tryMove(col: number, row: number) {
    const uid = this.movingModuleUid;
    if (uid === null) return false;
    const module = this.placed.get(uid);
    if (!module || !this.canPlace(module.def, col, row)) return false;

    const oldView = module.view;
    const oldLabel = module.label;
    const oldRing = module.ring;
    oldView.destroy();
    oldLabel?.destroy();
    oldRing?.destroy();

    for (let c = col; c < col + module.def.w; c++) {
      for (let r = row; r < row + module.def.h; r++) {
        this.occ[c][r] = uid;
      }
    }
    const created = this.createView(module.def, col, row);
    const movedModule: Placed = {
      ...module,
      col,
      row,
      view: created.view,
      label: created.label,
      ring: created.ring,
    };
    this.placed.set(uid, movedModule);
    this.attachModuleInteraction(movedModule);
    this.game.events.emit("module-moved", {
      id: module.def.id,
      oldCol: module.col,
      oldRow: module.row,
      col,
      row,
    });
    this.movingModuleUid = null;
    this.selected = null;
    this.drawGhost();
    return true;
  }

  private setModuleVisible(
    view: Phaser.GameObjects.GameObject,
    visible: boolean,
  ) {
    const visibleView = view as Phaser.GameObjects.GameObject & {
      setVisible: (value: boolean) => Phaser.GameObjects.GameObject;
    };
    visibleView.setVisible(visible);
  }

  private setModuleAlpha(
    view: Phaser.GameObjects.GameObject,
    alpha: number,
  ) {
    if (view instanceof Phaser.GameObjects.Container) {
      view.list.forEach((child) => {
        if (child instanceof Phaser.GameObjects.Text) {
          child.setAlpha(1);
        } else if ("setAlpha" in child) {
          (child as Phaser.GameObjects.GameObject & {
            setAlpha: (value: number) => Phaser.GameObjects.GameObject;
          }).setAlpha(alpha);
        }
      });
      return;
    }
    const alphaView = view as Phaser.GameObjects.GameObject & {
      setAlpha: (value: number) => Phaser.GameObjects.GameObject;
    };
    alphaView.setAlpha(alpha);
  }

  /**----------------------------------------------------------------------------------------------------------------
     * Retrieves the placed module occupying a specified grid tile.
     * Returns null when the tile is unoccupied or no matching module exists.
     ----------------------------------------------------------------------------------------------------------------*/
  getModuleAt(col: number, row: number) {
    const uid = this.occ[col]?.[row];
    return uid ? (this.placed.get(uid) ?? null) : null;
  }

  /**----------------------------------------------------------------------------------------------------------------
     * Creates the visual representation of a placed module.
     * Uses a sprite when its texture is available; otherwise, draws a
     * placeholder structure. Also configures its origin, scale, depth,
     * and optional animation.
     ----------------------------------------------------------------------------------------------------------------*/
  private createView(def: ModuleDef, col: number, row: number) {
    const fp = this.footprint(col, row, def.w, def.h);
    // Draw order = the footprint's FRONT tile. Tall sprites overlap tiles behind them correctly.
    const depth = col + def.w - 1 + (row + def.h - 1);

    if (this.textures.exists(def.texture)) {
      // Sprite's bottom-centre sits on the footprint's bottom corner; the image can rise as high as it likes.
      const s = this.spriteAnchor(def, col, row, fp);
      const sprite = this.add
        .sprite(0, 0, def.texture)
        .setOrigin(0.5, s.oy)
        .setScale(def.scale ?? SCALE)
        .setDepth(depth);

      const label = this.add
        .text(0, -Math.max(48, sprite.displayHeight * 0.65 + 32), def.name, {
          fontFamily: "Arial",
          fontSize: "12px",
          color: "#f8fafc",
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          padding: { x: 6, y: 3 },
          stroke: "#020617",
          strokeThickness: 2,
        })
        .setOrigin(0.5, 1)
        .setVisible(false)
        .setDepth(depth + 1);

      const ring = this.add
        .graphics()
        .setVisible(false)
        .setDepth(depth - 0.5);
      this.drawSelectionRing(ring, fp, def);

      const container = this.add
        .container(s.x, s.y)
        .setDepth(depth)
        .add([sprite, label]);

      if (def.anim && this.anims.exists(def.anim)) {
        // random start frame so several windmills don't spin in lock-step
        sprite.play({
          key: def.anim,
          startFrame: Phaser.Math.Between(0, (def.frames ?? 1) - 1),
        });
      }

      return { view: container, label, ring };
    }
    const g = this.add.graphics().setDepth(depth);
    this.drawBox(g, fp, def.height, def.color, 1);

    const label = this.add
      .text(fp.top.x, fp.top.y - 42, def.name, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#f8fafc",
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        padding: { x: 6, y: 3 },
        stroke: "#020617",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 1)
      .setVisible(false)
      .setDepth(depth + 1);

    const ring = this.add
      .graphics()
      .setVisible(false)
      .setDepth(depth - 0.5);
    this.drawSelectionRing(ring, fp);

    return { view: g, label, ring };
  }

  private drawSelectionRing(
    ring: Phaser.GameObjects.Graphics,
    fp: Footprint,
    def?: ModuleDef,
  ) {
    const cx = (fp.top.x + fp.right.x + fp.bottom.x + fp.left.x) / 4;
    const cy = (fp.top.y + fp.right.y + fp.bottom.y + fp.left.y) / 4;

    const baseRx = Math.max(54, (fp.right.x - fp.left.x) * 0.7);
    const baseRy = Math.max(34, (fp.bottom.y - fp.top.y) * 0.6);
    const isRadiationTower = def?.id === "radiation_tower";

    const rx = isRadiationTower ? baseRx * 9 : baseRx;
    const ry = isRadiationTower ? baseRy * 9 : baseRy;
    const color = isRadiationTower ? 0xff4d4d : 0xffffff;

    ring.clear();

    ring.lineStyle(3, color, isRadiationTower ? 1 : 0.95);
    ring.strokeEllipse(cx, cy, rx * 2, ry * 2);
  }

  private updateRingState(module: Placed) {
    if (module.ring) {
      module.ring.setVisible(false);
    }
  }

  private attachModuleInteraction(module: Placed) {
    const target =
      module.view instanceof Phaser.GameObjects.Container
        ? (module.view.list.find(
            (child) =>
              child instanceof Phaser.GameObjects.Sprite ||
              child instanceof Phaser.GameObjects.Graphics,
          ) ?? module.view)
        : module.view;

    if (!(target instanceof Phaser.GameObjects.GameObject)) return;

    target.setInteractive({ useHandCursor: true });
    target.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.isOverlayOpen()) return;
      if (pointer.button === 2) {
        if (this.movingModuleUid !== null) {
          this.cancelMove();
          return;
        }

        this.game.events.emit("module-move-requested", {
          uid: module.uid,
          id: module.def.id,
          col: module.col,
          row: module.row,
        });
        return;
      }
      this.placed.forEach((placed) => this.updateRingState(placed));
      this.drawGhost();
      this.game.events.emit("module-clicked", {
        uid: module.uid,
        id: module.def.id,
        name: module.def.name,
        col: module.col,
        row: module.row,
      });
      // console.log("Module clicked:", module.def.name, {
      //   uid: module.uid,
      //   id: module.def.id,
      //   col: module.col,
      //   row: module.row,
      // });
    });
  }

  private syncConstructionStatus() {
    const stateModules = useGameStore.getState().placedModules;
    this.placed.forEach((module) => {
      const stateModule = stateModules.find(
        (candidate) =>
          candidate.instanceId === module.instanceId ||
          (candidate.id === module.def.id &&
            candidate.x === module.row &&
            candidate.y === module.col),
      );
      const remaining = stateModule?.constructionHoursRemaining ?? 0;
      module.constructionHoursRemaining = remaining;
      if (module.label) {
        module.label.setText(
          remaining > 0
            ? `${module.def.name}\nIN CONSTRUCTION • ${remaining}h`
            : module.def.name,
        );
        module.label.setVisible(
          remaining > 0 || module.uid === this.hoveredModuleUid,
        );
      }
    });
  }

  /**----------------------------------------------------------------------------------------------------------------
     * Calculates the sprite's world position and vertical origin.
     * Supports centered placement for selected modules and bottom-centered
     * placement for modules anchored to the footprint's bottom corner.
     ----------------------------------------------------------------------------------------------------------------*/
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

  // --------------------------------------------------- Drawing -------------------------------------------------------------

  /**----------------------------------------------------------------------------------------------------------------
     * Draws the Mars surface background behind the playable grid.
     * Scales the background image proportionally to cover the playable area.
     ----------------------------------------------------------------------------------------------------------------*/
  private drawMarsBackground() {
    const halfW = ((GRID.cols + GRID.rows) * GRID.tileW) / 4 + GRID.margin;

    const halfH = ((GRID.cols + GRID.rows) * GRID.tileH) / 4 + GRID.margin;

    const source = this.textures
      .get("marsSurface")
      .getSourceImage() as HTMLImageElement;

    // Cover the entire playable area without stretching the image.
    const scale = Math.max(
      (halfW * 2) / source.width,
      (halfH * 2) / source.height,
    );

    this.add
      .image(0, 0, "marsSurface")
      .setOrigin(0.5, 0.5)
      .setScale(scale)
      .setDepth(-10);
  }

  /**----------------------------------------------------------------------------------------------------------------
     * Draws and fills a polygon using the supplied vertices, color, and opacity.
     * Used to render isometric ground tiles and the faces of placeholder modules.
     ----------------------------------------------------------------------------------------------------------------*/
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

  /**----------------------------------------------------------------------------------------------------------------
     * Draws a simple three-dimensional placeholder structure.
     * Creates the top and side faces using the footprint, height, and base color.
     ----------------------------------------------------------------------------------------------------------------*/
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

  private drawGhostGridBoundary(g: Phaser.GameObjects.Graphics) {
    const top = this.tileToWorld(0, 0);
    const right = this.tileToWorld(GRID.cols, 0);
    const bottom = this.tileToWorld(GRID.cols, GRID.rows);
    const left = this.tileToWorld(0, GRID.rows);

    const pts = [
      { x: top.x, y: top.y - GRID.tileH / 2 },
      { x: right.x + GRID.tileW / 2, y: right.y },
      { x: bottom.x, y: bottom.y + GRID.tileH / 2 },
      { x: left.x - GRID.tileW / 2, y: left.y },
    ];

    g.lineStyle(2, 0xffffff, 0.9);
    g.beginPath();
    pts.forEach((pt, index) => {
      if (index === 0) g.moveTo(pt.x, pt.y);
      else g.lineTo(pt.x, pt.y);
    });
    g.closePath();
    g.strokePath();
  }

  /**----------------------------------------------------------------------------------------------------------------
      Renders the selected module's placement preview at the hovered tile.
      Highlights the footprint according to placement validity and displays
      a translucent sprite or placeholder structure.
     ----------------------------------------------------------------------------------------------------------------*/

  private drawGhost() {
    const g = this.ghost;
    g.clear();
    this.ghostImg.setVisible(false);

    const highlightedUid =
      this.movingModuleUid === null ? this.hoveredModuleUid : null;
    this.placed.forEach((module) => {
      const isHighlighted = module.uid === highlightedUid;
      const isConstructing =
        (module.constructionHoursRemaining ?? 0) > 0;
      this.setModuleAlpha(
        module.view,
        isConstructing || isHighlighted ? 0.55 : 1,
      );
      module.label?.setVisible(isConstructing || isHighlighted);
      this.updateRingState(module);
    });

    if (!this.selected) {
      if (this.hoverTile) {
        const fp = this.footprint(this.hoverTile.col, this.hoverTile.row, 1, 1);
        this.poly(g, [fp.top, fp.right, fp.bottom, fp.left], 0xffd166, 0.45);
      }
      return;
    }

    this.drawGhostGridBoundary(g);

    if (!this.hoverTile) return;

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

  /**----------------------------------------------------------------------------------------------------------------
     * Draws the isometric grid by rendering a diamond outline for each tile.
     * Uses the configured tile dimensions and world coordinates.
     ----------------------------------------------------------------------------------------------------------------*/
  private drawGrid() {
    const g = this.add.graphics().setDepth(-1);
    const hw = GRID.tileW / 2;
    const hh = GRID.tileH / 2;

    g.lineStyle(1, 0xffffff, 0.2);

    for (let c = 0; c < GRID.cols; c++) {
      for (let r = 0; r < GRID.rows; r++) {
        const { x, y } = this.tileToWorld(c, r);

        const pts = [
          { x, y: y - hh },
          { x: x + hw, y },
          { x, y: y + hh },
          { x: x - hw, y },
        ];

        g.beginPath();
        g.moveTo(pts[0].x, pts[0].y);

        for (let i = 1; i < pts.length; i++) {
          g.lineTo(pts[i].x, pts[i].y);
        }

        g.closePath();
        g.strokePath();
      }
    }
  }
  // private drawGrid() {
  //   const g = this.add.graphics().setDepth(-1);
  //   const hw = GRID.tileW / 2;
  //   const hh = GRID.tileH / 2;
  //   for (let c = 0; c < GRID.cols; c++) {
  //     for (let r = 0; r < GRID.rows; r++) {
  //       const { x, y } = this.tileToWorld(c, r);
  //       const pts = [
  //         { x, y: y - hh },
  //         { x: x + hw, y },
  //         { x, y: y + hh },
  //         { x: x - hw, y },
  //       ];
  //       // this.poly(g, pts, (c + r) % 2 === 0 ? 0x8a4b32 : 0x7c4330, 1);
  //       g.lineStyle(1, 0xffffff, 0.8);
  //       g.strokePoints(pts, true);
  //     }
  //   }
  // }
}
