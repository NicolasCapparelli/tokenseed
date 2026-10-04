/** Where a knob is shown. Sprout shows only required knobs and traits. */
export type Level = "sprout" | "grow" | "craft";

export type KnobValue = string | number | boolean | string[];

/** UI hint: the editor picks a control from this, never from the knob id. */
export type Control =
  | "text"
  | "color"
  | "colorList"
  | "font"
  | "slider"
  | "segmented"
  | "select"
  | "toggle"
  | "visualChoice"
  | "multiSelect";

export interface KnobOption<V extends string = string> {
  value: V;
  label: string;
}

export interface KnobBase {
  /** Namespaced and permanent. A rename ships a migration, never an in-place change. */
  id: string;
  label: string;
  help: string;
  group: string;
  levels: Level[];
  control: Control;
  required?: boolean;
  /** Engine version that introduced this knob. */
  since: string;
  /** Whether "pick the one you like" and Shuffle may change it. Defaults to true. */
  explorable?: boolean;
  /** Show only when another knob has one of these values. */
  visibleWhen?: Record<string, KnobValue[]>;
}

export interface EnumKnob extends KnobBase {
  type: "enum";
  options: KnobOption[];
  default: string;
}

export interface NumberKnob extends KnobBase {
  type: "number";
  min: number;
  max: number;
  step: number;
  unit?: string;
  default: number;
}

export interface BooleanKnob extends KnobBase {
  type: "boolean";
  default: boolean;
}

export interface ColorKnob extends KnobBase {
  type: "color";
  /** Empty string means "let the engine choose". */
  default: string;
}

export interface ColorListKnob extends KnobBase {
  type: "colorList";
  max: number;
  default: string[];
}

export interface FontKnob extends KnobBase {
  type: "font";
  /** Empty string means "choose for me" from the curated list. */
  default: string;
}

export interface TextKnob extends KnobBase {
  type: "text";
  default: string;
}

/** Any subset of a fixed list of options, e.g. which optional component recipes to include. */
export interface SetKnob extends KnobBase {
  type: "set";
  options: KnobOption[];
  default: string[];
}

export type Knob = EnumKnob | NumberKnob | BooleanKnob | ColorKnob | ColorListKnob | FontKnob | TextKnob | SetKnob;

/** How a trait position (0..1) maps onto one knob. */
export type Influence =
  | { kind: "lerp"; from: number; to: number }
  /** Pick the value whose threshold is the highest one <= the trait position. */
  | { kind: "steps"; steps: [threshold: number, value: KnobValue][] };

export interface Trait {
  id: string;
  /** [low end, high end] */
  label: [string, string];
  help: string;
  since: string;
  influences: Record<string, Influence>;
}

export interface Preset {
  id: string;
  label: string;
  description: string;
  kind: "product" | "style";
  knobs?: Record<string, KnobValue>;
  traits?: Record<string, number>;
}
