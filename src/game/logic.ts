// ============================================================
// TETRIS BALANCE — Logique pure : grille, pièces, physique
// ============================================================
import { COLS, ROWS, BOARD_MASS, BASE_SUPPORT, TILT_PER_COL, MAX_VISUAL_TILT } from './constants';
import type { Tetromino } from './constants';

export interface LockedCell {
  color: string;
  weight: number;
  playerId: number;
}

export type Grid = (LockedCell | null)[][];

export interface ActivePiece {
  def: Tetromino;
  matrix: number[][];
  x: number;
  y: number;
  mult: number;      // multiplicateur de poids par cellule (0 = plume)
  playerId: number;
}

export interface BalanceInfo {
  mass: number;        // masse des blocs (sans la masse du plateau)
  torque: number;      // somme des poids * distance au pivot
  avgOffset: number;   // centre de gravité en colonnes (signé)
  angleDeg: number;    // inclinaison visuelle
  danger: number;      // 0..1+ proportion du seuil d'effondrement
  collapsed: boolean;
}

export const emptyGrid = (): Grid =>
  Array.from({ length: ROWS }, () => Array<LockedCell | null>(COLS).fill(null));

export function rotateMatrix(m: number[][]): number[][] {
  const n = m.length;
  const out = Array.from({ length: n }, () => Array(n).fill(0));
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      out[x][n - 1 - y] = m[y][x];
  return out;
}

export function collides(grid: Grid, matrix: number[][], px: number, py: number): boolean {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (!matrix[y][x]) continue;
      const gx = px + x;
      const gy = py + y;
      if (gx < 0 || gx >= COLS || gy >= ROWS) return true;
      if (gy >= 0 && grid[gy][gx]) return true;
    }
  }
  return false;
}

/** Verrouille la pièce dans la grille (retourne une nouvelle grille). */
export function lockPiece(grid: Grid, piece: ActivePiece): Grid {
  const g = grid.map(row => row.map(c => (c ? { ...c } : null)));
  const { matrix, x: px, y: py, def, mult, playerId } = piece;
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (!matrix[y][x]) continue;
      const gy = py + y;
      const gx = px + x;
      if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
        g[gy][gx] = { color: def.color, weight: mult, playerId };
      }
    }
  }
  return g;
}

/** Supprime les lignes complètes. Retourne la nouvelle grille + index des lignes clear. */
export function clearLines(grid: Grid): { grid: Grid; cleared: number[] } {
  const cleared: number[] = [];
  const kept: Grid = [];
  for (let y = 0; y < ROWS; y++) {
    if (grid[y].every(c => c !== null)) cleared.push(y);
    else kept.push(grid[y]);
  }
  if (cleared.length === 0) return { grid, cleared };
  while (kept.length < ROWS) kept.unshift(Array<LockedCell | null>(COLS).fill(null));
  return { grid: kept, cleared };
}

/** Position d'atterrissage de la pièce (pour le fantôme / hard drop). */
export function dropY(grid: Grid, piece: ActivePiece): number {
  let y = piece.y;
  while (!collides(grid, piece.matrix, piece.x, y + 1)) y++;
  return y;
}

// ------------------------------------------------------------
// PHYSIQUE DE LA BALANCE
// Le centre de gravité doit rester dans la base de sustentation.
// ------------------------------------------------------------
export function computeBalance(grid: Grid, supportBoost = 1): BalanceInfo {
  let mass = 0;
  let torque = 0;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = grid[y][x];
      if (!c) continue;
      mass += c.weight;
      torque += c.weight * (x - (COLS - 1) / 2);
    }
  }
  const total = mass + BOARD_MASS;
  const avgOffset = total > 0 ? torque / total : 0;
  const support = BASE_SUPPORT * supportBoost;
  const angleDeg = Math.max(-MAX_VISUAL_TILT, Math.min(MAX_VISUAL_TILT, avgOffset * TILT_PER_COL));
  const danger = Math.abs(avgOffset) / support;
  return {
    mass,
    torque,
    avgOffset,
    angleDeg,
    danger,
    collapsed: Math.abs(avgOffset) > support,
  };
}

/** Tire un multiplicateur de poids avec rubber-banding façon Mario Kart. */
export function rollWeightMult(rank: number, playerCount: number): number {
  // rank 0 = premier (pénalisé), dernier = avantagé
  const r = Math.random();
  const behind = playerCount > 1 ? rank / (playerCount - 1) : 0.5; // 0..1
  if (r < 0.42 - 0.12 * behind) return 1;
  if (r < 0.78 - 0.06 * behind) return 2;
  return 3;
}
