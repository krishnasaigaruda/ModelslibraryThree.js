import type { Object3D, AnimationMixer, AnimationAction } from 'three';

export interface CatalogEntry {
  category: string;
  source: 'js' | 'glb';
  module: string;
  factory: string;
  label: string;
  variants: string[];
  /** Extra versions: one list for every variant, or per variant. Named "<variant>-<trim>". */
  trims?: string[] | Record<string, string[]>;
  sub?: string;
  /** Extra search words (synonyms / common names). */
  tags?: string[];
  quality?: 'standard' | 'hd';
  options: Record<string, string>;
}

export const CATALOG: Record<string, CatalogEntry>;
export const CATEGORIES: string[];
export function listModels(): { type: string; variant: string; base: string; trim: string | null; category: string; sub: string | null; source: 'js' | 'glb'; quality: 'standard' | 'hd'; label: string }[];
/** Trims (versions) available for one variant of an entry. */
export function trimsOf(entry: CatalogEntry, variant: string): string[];
/** Every full model name of an entry: each variant plus "<variant>-<trim>". */
export function expandVariants(entry: CatalogEntry): string[];
/** "sedan-sport" → { variant: 'sedan', trim: 'sport' }; unknown → null. */
export function resolveVariant(entry: CatalogEntry, name: string): { variant: string; trim: string | null } | null;

export interface CreateOptions {
  /** Which version of the model, e.g. 'minivan' for a car. */
  variant?: string;
  /** Main color: any CSS color name, hex string or number. */
  color?: string | number;
  /** Uniform scale multiplier. */
  scale?: number;
  /** [x, y, z] position. */
  position?: [number, number, number];
  /** Y rotation in radians, or [x, y, z]. */
  rotation?: number | [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Seed for models with random variation (books, trees, outfits…). */
  seed?: number | string;
  /** Type-specific options — see CATALOG[type].options. */
  [key: string]: unknown;
}

export interface PremadeObject extends Object3D {
  userData: Object3D['userData'] & {
    premade: {
      type: string;
      variant: string;
      options: CreateOptions;
      animations: string[];
      oneShot?: string[];
      exclusive?: string[][];
    };
  };
}

/**
 * Create a model. All of these work:
 *   createObject('car', { variant: 'minivan', color: 'blue' })
 *   createObject('car:minivan', { color: 'blue' })
 *   createObject({ type: 'car', variant: 'minivan', color: 'blue' })
 *   createObject({ Car: 'minivan', Color: 'blue' })
 */
export function createObject(type: string, options?: CreateOptions): Promise<PremadeObject>;
export function createObject(request: CreateOptions & { type?: string }): Promise<PremadeObject>;

/** Load the code (or .glb) for some types ahead of time. */
export function preload(...types: (string | string[])[]): Promise<void>;

/** Where Blender-made .glb files are served from (defaults to the package's models/ folder). */
export function setModelBaseUrl(url: string): void;
/** Where the Draco decoder for compressed HD .glb files is loaded from. */
export function setDracoDecoderPath(path: string): void;

export function parseRequest(a: unknown, b?: CreateOptions): { type: string; variant: string; options: CreateOptions; entry: CatalogEntry };

export interface Animator {
  mixer: AnimationMixer;
  readonly names: string[];
  readonly playing: string[];
  isOneShot(name: string): boolean;
  play(name: string, opts?: { loop?: boolean; fade?: number; speed?: number; exclusive?: boolean }): AnimationAction;
  stop(name?: string, opts?: { fade?: number }): void;
  toggle(name: string, opts?: { loop?: boolean; fade?: number; speed?: number }): boolean;
  isPlaying(name: string): boolean;
  /** setSpeed(0.25) = everything in slow motion; setSpeed('drive', 2) = one animation. */
  setSpeed(speed: number): void;
  setSpeed(name: string, speed: number): void;
  update(delta: number): void;
}

/** Control one object's animations. Call update(delta) every frame. */
export function createAnimator(object: Object3D): Animator;
