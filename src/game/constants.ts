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

// --- Modes de balance ---
// Chaque mode change la physique pour mettre la pression différemment.
export type BalanceModeId = 'STABLE' | 'CORDE_RAIDE' | 'PIVOT_MOBILE' | 'TEMPETE' | 'USURE';

export interface BalanceMode {
  id: BalanceModeId;
  name: string;
  icon: string;
  desc: string;
  support: number;   // demi-largeur de la base de sustentation (colonnes)
  boardMass: number; // masse propre du plateau (stabilité de départ)
}

export const BALANCE_MODES: Record<BalanceModeId, BalanceMode> = {
  STABLE:       { id: 'STABLE',       name: 'STABLE',      icon: '⚖️', desc: 'La balance classique, tolérante.', support: 2.2, boardMass: 26 },
  CORDE_RAIDE:  { id: 'CORDE_RAIDE',  name: 'CORDE RAIDE', icon: '🤸', desc: 'Base étroite : ça bascule VITE.', support: 1.5, boardMass: 22 },
  PIVOT_MOBILE: { id: 'PIVOT_MOBILE', name: 'PIVOT MOBILE', icon: '🛼', desc: 'Le pivot patine de gauche à droite en permanence !', support: 2.2, boardMass: 26 },
  TEMPETE:      { id: 'TEMPETE',      name: 'TEMPÊTE',     icon: '🌪️', desc: 'Des rafales imprévisibles secouent la balance.', support: 2.0, boardMass: 26 },
  USURE:        { id: 'USURE',        name: 'USURE',       icon: '🪓', desc: "La balance s'affaiblit tour après tour…", support: 2.4, boardMass: 26 },
};

// PIVOT MOBILE : déport du pivot (en colonnes), période 10 s, amplitude ±1,1 col.
export const pivotOffsetAt = (tMs: number): number =>
  Math.sin((tMs * Math.PI) / 5000) * 1.1;

// USURE : la base se rétrécit à chaque tour (min 50 %).
export const wearScale = (turn: number): number =>
  Math.max(0.5, 1 - (turn - 1) * 0.012);

// TEMPÊTE : amplitude des rafales (colonnes) + oscillation visuelle.
export const GUST_AMPLITUDE = 0.5;
export const gustSwayAt = (tMs: number): number =>
  Math.sin(tMs / 350) * 2.2 + Math.sin(tMs / 130) * 0.8;

// --- Modes de jeu ---
export type GameMode = 'TOURS' | 'INFINI';
export const GAME_MODES: Record<GameMode, { name: string; icon: string; desc: string }> = {
  TOURS:  { name: '60 TOURS', icon: '⏱️', desc: 'Sprint au score : le meilleur total au tour 60 gagne' },
  INFINI: { name: 'INFINI',   icon: '♾️', desc: "Pas de limite : l'élimination seule décide du vainqueur" },
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
