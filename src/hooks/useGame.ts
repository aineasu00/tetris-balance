// ============================================================
// TETRIS BALANCE — Hook principal : machine à états du jeu
// ============================================================
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  TETROMINOES, PLAYER_COLORS, PLAYER_NAMES,
  START_LIVES, MAX_TURNS, EVENT_EVERY, SURPRISE_EVERY,
  fallIntervalFor, LOCK_DELAY_MS,
} from '../game/constants';
import {
  emptyGrid, rotateMatrix, collides,
  lockPiece, clearLines, dropY, computeBalance, rollWeightMult,
} from '../game/logic';
import type { Grid, ActivePiece, BalanceInfo } from '../game/logic';
import { ITEMS, EVENTS, randomItem, randomEvent } from '../game/handy';
import type { ItemType, EventDef } from '../game/handy';
import { sfx } from '../game/sound';

export interface PlayerState {
  id: number;
  name: string;
  color: string;
  score: number;
  lives: number;
  item: ItemType | null;
  eliminated: boolean;
  lines: number;
}

export type Phase = 'menu' | 'play' | 'collapse' | 'gameover';

export interface Banner {
  text: string;
  sub?: string;
  kind: 'info' | 'event' | 'danger' | 'good';
  key: number;
}

export type FxEvent =
  | { type: 'clear'; rows: number[] }
  | { type: 'collapse'; cells: { x: number; y: number; color: string }[]; dir: number }
  | { type: 'lock'; x: number; y: number }
  | { type: 'dynamite'; row: number };

export interface ActiveEvent {
  def: EventDef;
  turnsLeft: number;
  windDir: number;
}

export interface GameState {
  phase: Phase;
  players: PlayerState[];
  grid: Grid;
  current: number;
  piece: ActivePiece | null;
  balance: BalanceInfo;
  supportTurns: number;
  anvilNext: boolean;
  event: ActiveEvent | null;
  banner: Banner | null;
  turn: number;
  winner: number | null;
  collapseReason: string;
  lastGain: { playerId: number; points: number; label: string } | null;
}

const LINE_POINTS = [0, 100, 300, 500, 800];
let bannerKey = 0;

function makeBanner(text: string, kind: Banner['kind'], sub?: string): Banner {
  return { text, sub, kind, key: ++bannerKey };
}

function initialState(): GameState {
  return {
    phase: 'menu',
    players: [],
    grid: emptyGrid(),
    current: 0,
    piece: null,
    balance: computeBalance(emptyGrid()),
    supportTurns: 0,
    anvilNext: false,
    event: null,
    banner: null,
    turn: 1,
    winner: null,
    collapseReason: '',
    lastGain: null,
  };
}

/** Rang du joueur parmi les actifs (0 = leader). Sert au rubber-banding. */
function scoreRank(players: PlayerState[], id: number): { rank: number; count: number } {
  const active = players.filter(p => !p.eliminated);
  const sorted = [...active].sort((a, b) => b.score - a.score);
  return { rank: Math.max(0, sorted.findIndex(p => p.id === id)), count: active.length };
}

/** Génère la pièce du joueur courant avec poids (handicaps inclus). */
function spawnPiece(st: GameState, playerIdx: number): { piece: ActivePiece; banner: Banner | null } {
  const player = st.players[playerIdx];
  const def = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
  const { rank, count } = scoreRank(st.players, player.id);

  let mult = rollWeightMult(rank, count);
  let banner: Banner | null = null;

  if (st.anvilNext) {
    mult = 5;
    banner = makeBanner('⚓ ENCLUME !', 'danger', `${player.name} reçoit une pièce ULTRA LOURDE`);
  } else if (st.event?.def.type === 'PLUIE_FER') {
    mult = Math.min(5, mult + 1.5);
  } else if (st.event?.def.type === 'BRISE') {
    mult = Math.max(0.5, mult * 0.5);
  }

  const size = def.matrix.length;
  const x = size === 2 ? 4 : 3;
  const piece: ActivePiece = { def, matrix: def.matrix, x, y: 0, mult, playerId: player.id };
  return { piece, banner };
}

export function useGame() {
  const [state, setState] = useState<GameState>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const fxQueue = useRef<FxEvent[]>([]);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushFx = useCallback((fx: FxEvent) => { fxQueue.current.push(fx); }, []);

  // Gravité : accumulateurs de chute et de verrouillage au sol
  const gravity = useRef({ acc: 0, lockAcc: 0, key: '' });

  const showBanner = useCallback((banner: Banner, ms = 2400) => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => {
      setState(prev => (prev.banner?.key === banner.key ? { ...prev, banner: null } : prev));
    }, ms);
    return banner;
  }, []);

  // ----------------------------------------------------------
  // Démarrage
  // ----------------------------------------------------------
  const startGame = useCallback((playerCount: number) => {
    const players: PlayerState[] = Array.from({ length: playerCount }, (_, i) => ({
      id: i,
      name: PLAYER_NAMES[i],
      color: PLAYER_COLORS[i],
      score: 0,
      lives: START_LIVES,
      item: null,
      eliminated: false,
      lines: 0,
    }));
    let st: GameState = {
      ...initialState(),
      phase: 'play',
      players,
      banner: makeBanner('QUE LA PARTIE COMMENCE !', 'info', 'À tour de rôle, placez vos pièces… sans faire basculer la balance'),
    };
    const { piece } = spawnPiece(st, 0);
    st = { ...st, piece };
    showBanner(st.banner!, 3000);
    sfx.turn();
    setState(st);
  }, [showBanner]);

  // ----------------------------------------------------------
  // Effondrement
  // ----------------------------------------------------------
  const beginCollapse = useCallback((st: GameState, reason: string): GameState => {
    const cells: { x: number; y: number; color: string }[] = [];
    st.grid.forEach((row, y) => row.forEach((c, x) => { if (c) cells.push({ x, y, color: c.color }); }));
    pushFx({ type: 'collapse', cells, dir: st.balance.avgOffset >= 0 ? 1 : -1 });
    sfx.collapse();

    const players = st.players.map((p, i) => {
      if (i !== st.current) return p;
      const lives = p.lives - 1;
      return { ...p, lives, eliminated: lives <= 0 };
    });
    const culprit = st.players[st.current];
    return {
      ...st,
      phase: 'collapse',
      players,
      grid: emptyGrid(),
      piece: null,
      balance: computeBalance(emptyGrid()),
      collapseReason: reason,
      event: null,
      banner: makeBanner(
        lives0(players, st.current) ? `${culprit.name} EST ÉLIMINÉ !` : '💥 EFFONDREMENT !',
        'danger',
        `${reason} — ${culprit.name} perd une vie`,
      ),
    };
  }, [pushFx]);

  // helper (hors closure)
  function lives0(players: PlayerState[], idx: number) { return players[idx].eliminated; }

  /** Appelé par le canvas quand l'animation d'effondrement est finie. */
  const finishCollapse = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'collapse') return prev;
      const active = prev.players.filter(p => !p.eliminated);
      if (active.length <= 1) {
        sfx.gameover();
        return { ...prev, phase: 'gameover', winner: active.length === 1 ? active[0].id : null, banner: null };
      }
      return advanceTurn({ ...prev, phase: 'play', banner: null });
    });
  }, []);

  // ----------------------------------------------------------
  // Passage au tour suivant
  // ----------------------------------------------------------
  function advanceTurn(st: GameState): GameState {
    let { turn, event, supportTurns } = st;
    turn += 1;
    supportTurns = Math.max(0, supportTurns - 1);
    if (event) {
      const turnsLeft = event.turnsLeft - 1;
      event = turnsLeft > 0 ? { ...event, turnsLeft } : null;
    }

    // Fin de partie au score si on dépasse le nombre de tours max
    const active = st.players.filter(p => !p.eliminated);
    if (turn > MAX_TURNS && active.length > 0) {
      const best = [...active].sort((a, b) => b.score - a.score)[0];
      sfx.gameover();
      return { ...st, turn, event, supportTurns, phase: 'gameover', winner: best.id, banner: null };
    }

    // Joueur suivant (actif)
    let next = st.current;
    do { next = (next + 1) % st.players.length; } while (st.players[next].eliminated);

    let banner: Banner | null = null;
    let anvilNext = st.anvilNext;

    // Événement surprise façon Mario Kart
    if (turn % EVENT_EVERY === 0 && !event) {
      const def = EVENTS[randomEvent()];
      event = { def, turnsLeft: def.duration, windDir: Math.random() < 0.5 ? -1 : 1 };
      banner = makeBanner(`${def.icon} ${def.name} !`, 'event', def.desc);
      sfx.event();
    }

    // Boîte surprise pour le dernier (rubber-banding)
    if (turn % SURPRISE_EVERY === 0) {
      const ranked = [...active].sort((a, b) => a.score - b.score);
      const last = ranked[0];
      if (last && !last.item) {
        const { rank, count } = scoreRank(st.players, last.id);
        const item = randomItem(rank, count);
        st = { ...st, players: st.players.map(p => (p.id === last.id ? { ...p, item } : p)) };
        if (!banner) banner = makeBanner(`🎁 BOÎTE SURPRISE`, 'good', `${last.name} reçoit : ${ITEMS[item].icon} ${ITEMS[item].name} (touche E)`);
        sfx.item();
      }
    }

    let nextSt: GameState = { ...st, turn, event, supportTurns, current: next, anvilNext };
    const { piece, banner: spawnBanner } = spawnPiece(nextSt, next);
    nextSt = { ...nextSt, piece, anvilNext: false, banner: banner ?? spawnBanner };

    // Tour trop haute ? -> effondrement immédiat
    if (collides(nextSt.grid, piece.matrix, piece.x, piece.y)) {
      return beginCollapse(nextSt, 'TOUR TROP HAUTE');
    }

    if (nextSt.banner) showBanner(nextSt.banner);
    sfx.turn();
    return nextSt;
  }

  // ----------------------------------------------------------
  // Verrouillage d'une pièce
  // ----------------------------------------------------------
  const lock = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'play' || !prev.piece) return prev;
      let piece = { ...prev.piece };

      // VENT : décale la pièce au verrouillage
      if (prev.event?.def.type === 'VENT') {
        const dir = prev.event.windDir;
        if (!collides(prev.grid, piece.matrix, piece.x + dir, piece.y)) {
          piece = { ...piece, x: piece.x + dir };
        }
      }

      const y = dropY(prev.grid, piece);
      piece = { ...piece, y };
      pushFx({ type: 'lock', x: piece.x, y });
      sfx.lock();

      let grid = lockPiece(prev.grid, piece);
      const { grid: clearedGrid, cleared } = clearLines(grid);
      grid = clearedGrid;

      const player = prev.players[prev.current];
      let gained = 10 * Math.max(1, Math.round(piece.mult));
      let gainLabel = `+${gained}`;
      let lines = player.lines;
      let item = player.item;

      if (cleared.length > 0) {
        const pts = LINE_POINTS[cleared.length] ?? 800;
        gained += pts;
        gainLabel = `+${gained} (${cleared.length} LIGNE${cleared.length > 1 ? 'S' : ''} !)`;
        lines += cleared.length;
        pushFx({ type: 'clear', rows: cleared });
        sfx.clear();
        if (!item) {
          const { rank, count } = scoreRank(prev.players, player.id);
          item = randomItem(rank, count);
        }
      }

      const supportBoost = prev.supportTurns > 0 ? 2 : 1;
      const balance = computeBalance(grid, supportBoost);

      // Bonus ZEN : balance quasi parfaitement équilibrée
      if (balance.mass > 0 && Math.abs(balance.avgOffset) < 0.25) {
        gained += 50;
        gainLabel += ' • ZEN +50';
      }

      const players = prev.players.map((p, i) =>
        i === prev.current ? { ...p, score: p.score + gained, lines, item } : p,
      );

      let st: GameState = {
        ...prev,
        grid,
        players,
        piece: null,
        balance,
        lastGain: { playerId: player.id, points: gained, label: gainLabel },
      };

      if (balance.collapsed) {
        return beginCollapse(st, 'BALANCE RENVERSÉE');
      }

      return advanceTurn(st);
    });
  }, [beginCollapse, pushFx]);

  // ----------------------------------------------------------
  // Utilisation d'un objet (touche E)
  // ----------------------------------------------------------
  const useItem = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'play' || !prev.piece) return prev;
      const player = prev.players[prev.current];
      if (!player.item) return prev;
      const itemType = player.item;
      const players = prev.players.map((p, i) => (i === prev.current ? { ...p, item: null } : p));
      let st: GameState = { ...prev, players };
      sfx.item();

      switch (itemType) {
        case 'PLUME':
          st = { ...st, piece: { ...prev.piece, mult: 0 } };
          st.banner = makeBanner('🪶 PLUME !', 'good', 'Cette pièce ne pèse plus rien');
          break;
        case 'ENCLUME':
          st = { ...st, anvilNext: true };
          st.banner = makeBanner('⚓ ENCLUME !', 'good', 'La prochaine pièce adverse sera ultra lourde…');
          break;
        case 'PILIER':
          st = { ...st, supportTurns: 3, balance: computeBalance(st.grid, 2) };
          st.banner = makeBanner('🏛️ PILIER !', 'good', 'La balance est renforcée pendant 3 tours');
          break;
        case 'DYNAMITE': {
          let lowest = -1;
          for (let y = st.grid.length - 1; y >= 0; y--) {
            if (st.grid[y].some(c => c)) { lowest = y; break; }
          }
          if (lowest >= 0) {
            const g = st.grid.filter((_, y) => y !== lowest);
            g.unshift(Array(st.grid[0].length).fill(null));
            pushFx({ type: 'dynamite', row: lowest });
            st = { ...st, grid: g, balance: computeBalance(g, st.supportTurns > 0 ? 2 : 1) };
            st.banner = makeBanner('🧨 DYNAMITE !', 'good', 'La ligne la plus basse a explosé');
          } else {
            st.banner = makeBanner('🧨 DYNAMITE', 'info', 'Rien à faire exploser…');
          }
          break;
        }
      }
      showBanner(st.banner);
      return st;
    });
  }, [pushFx, showBanner]);

  // ----------------------------------------------------------
  // Gravité : la pièce tombe naturellement (tension !)
  // Plus elle est lourde, plus elle chute vite.
  // ----------------------------------------------------------
  const TICK = 50;
  useEffect(() => {
    if (state.phase !== 'play') return;
    const id = setInterval(() => {
      const st = stateRef.current;
      if (st.phase !== 'play' || !st.piece) return;
      const g = gravity.current;
      const key = `${st.turn}:${st.current}`;
      if (g.key !== key) { g.key = key; g.acc = 0; g.lockAcc = 0; }
      const p = st.piece;
      const grounded = collides(st.grid, p.matrix, p.x, p.y + 1);
      if (grounded) {
        // au sol : court délai pour glisser/pivoter, puis verrouillage auto
        g.lockAcc += TICK;
        if (g.lockAcc >= LOCK_DELAY_MS) {
          g.lockAcc = 0;
          g.acc = 0;
          lock();
        }
      } else {
        g.lockAcc = 0;
        g.acc += TICK;
        if (g.acc >= fallIntervalFor(p.mult)) {
          g.acc = 0;
          setState(prev => {
            if (prev.phase !== 'play' || !prev.piece) return prev;
            const pp = prev.piece;
            if (collides(prev.grid, pp.matrix, pp.x, pp.y + 1)) return prev;
            return { ...prev, piece: { ...pp, y: pp.y + 1 } };
          });
        }
      }
    }, TICK);
    return () => clearInterval(id);
  }, [state.phase, lock]);

  // ----------------------------------------------------------
  // Entrées clavier
  // ----------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = stateRef.current;
      if (st.phase !== 'play' || !st.piece) return;
      const key = e.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(key)) e.preventDefault();

      if (key === 'e' || key === 'E') { useItem(); return; }
      if (key === ' ' || key === 'Enter') { lock(); return; }

      setState(prev => {
        if (prev.phase !== 'play' || !prev.piece) return prev;
        const p = prev.piece;
        if (key === 'ArrowLeft' && !collides(prev.grid, p.matrix, p.x - 1, p.y)) {
          sfx.move();
          gravity.current.lockAcc = 0; // glisser au sol repousse le verrouillage
          return { ...prev, piece: { ...p, x: p.x - 1 } };
        }
        if (key === 'ArrowRight' && !collides(prev.grid, p.matrix, p.x + 1, p.y)) {
          sfx.move();
          gravity.current.lockAcc = 0;
          return { ...prev, piece: { ...p, x: p.x + 1 } };
        }
        if (key === 'ArrowDown') {
          if (!collides(prev.grid, p.matrix, p.x, p.y + 1)) {
            sfx.move();
            gravity.current.acc = 0; // descente manuelle garde la main
            return { ...prev, piece: { ...p, y: p.y + 1 } };
          }
          // posé au fond : un appui verrouille directement
          setTimeout(lock, 0);
          return prev;
        }
        if (key === 'ArrowUp' || key === 'x' || key === 'X') {
          const rot = rotateMatrix(p.matrix);
          for (const dx of [0, -1, 1, -2, 2]) {
            if (!collides(prev.grid, rot, p.x + dx, p.y)) {
              sfx.rotate();
              gravity.current.lockAcc = 0; // pivoter au sol repousse le verrouillage
              return { ...prev, piece: { ...p, matrix: rot, x: p.x + dx } };
            }
          }
        }
        return prev;
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lock, useItem]);

  const backToMenu = useCallback(() => setState(initialState()), []);

  return { state, stateRef, fxQueue, startGame, finishCollapse, backToMenu, lock, useItem };
}
