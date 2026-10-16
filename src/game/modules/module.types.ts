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

export type Pt = { x: number; y: number };
export type Footprint = { top: Pt; right: Pt; bottom: Pt; left: Pt };
export interface Placed {
  uid: number;
  def: ModuleDef;
  col: number;
  row: number;
  view: Phaser.GameObjects.GameObject;
}
