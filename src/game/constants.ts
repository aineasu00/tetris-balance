// ============================================================
// TETRIS BALANCE — Constantes & tetrominos
// ============================================================

export const COLS = 10;
export const ROWS = 20;

// --- Physique de la balance ---
// La masse du plateau lui-même stabilise la balance en début de partie.
export const BOARD_MASS = 26;
// Seuil d'effondrement : le centre de gravité (en colonnes par rapport au pivot)
// dépasse la demi-largeur de la base de la balance.
export const BASE_SUPPORT = 2.2;
// Inclinaison visuelle : degrés par colonne de déport du centre de gravité.
export const TILT_PER_COL = 8;
export const MAX_VISUAL_TILT = 26; // degrés

// --- Chute naturelle des pièces (gravité) ---
// Plus une pièce est lourde, plus elle tombe vite : le poids devient un piège.
export const FALL_BASE_MS = 850;   // intervalle de chute pour une pièce légère
export const FALL_PER_MULT = 160;  // accélération par point de poids
export const FALL_MIN_MS = 220;    // vitesse max (enclume)
export const FALL_FEATHER_MS = 1500; // une plume flotte
export const LOCK_DELAY_MS = 650;  // délai avant verrouillage au sol

export const fallIntervalFor = (mult: number): number => {
  if (mult <= 0) return FALL_FEATHER_MS;
  return Math.max(FALL_MIN_MS, FALL_BASE_MS - mult * FALL_PER_MULT);
};

// --- Règles ---
export const START_LIVES = 3;
export const MAX_TURNS = 60;
export const EVENT_EVERY = 7; // un événement surprise tous les N tours
export const SURPRISE_EVERY = 8; // boîte surprise pour le dernier

// --- Tetrominos (matrices SRS-like) ---
export interface Tetromino {
  name: string;
  matrix: number[][];
  color: string; // couleur néon principale
}

export const TETROMINOES: Tetromino[] = [
  { name: 'I', color: '#00f0ff', matrix: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
  { name: 'J', color: '#4d7cff', matrix: [[1,0,0],[1,1,1],[0,0,0]] },
  { name: 'L', color: '#ff9f1a', matrix: [[0,0,1],[1,1,1],[0,0,0]] },
  { name: 'O', color: '#ffe600', matrix: [[1,1],[1,1]] },
  { name: 'S', color: '#39ff6a', matrix: [[0,1,1],[1,1,0],[0,0,0]] },
  { name: 'T', color: '#c44dff', matrix: [[0,1,0],[1,1,1],[0,0,0]] },
  { name: 'Z', color: '#ff2e63', matrix: [[1,1,0],[0,1,1],[0,0,0]] },
];

// Couleurs des joueurs (néon)
export const PLAYER_COLORS = ['#00f0ff', '#ff2ed8', '#ffe600', '#39ff6a'];
export const PLAYER_NAMES = ['JOUEUR 1', 'JOUEUR 2', 'JOUEUR 3', 'JOUEUR 4'];

// Poids : multiplicateur appliqué à chaque cellule de la pièce
export type WeightTier = 1 | 2 | 3; // léger / normal / lourd
export const WEIGHT_LABEL: Record<number, string> = { 0: 'PLUME', 1: 'LÉGER', 2: 'NORMAL', 3: 'LOURD' };
export const WEIGHT_COLOR: Record<number, string> = { 0: '#aef7ff', 1: '#39ff6a', 2: '#ffe600', 3: '#ff2e63' };
