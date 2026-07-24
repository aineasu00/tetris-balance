// ============================================================
// TETRIS BALANCE — Rendu canvas : plateau, balance, particules
// ============================================================
import { useEffect, useRef } from 'react';
import { COLS, ROWS } from '../game/constants';
import { dropY } from '../game/logic';
import type { Grid, ActivePiece } from '../game/logic';
import type { GameState, FxEvent } from '../hooks/useGame';

const CELL = 32;
const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;
const W = 760;
const H = 800;
const BOARD_X = (W - BOARD_W) / 2;
const BOARD_Y = 24;
const PIVOT_X = W / 2;
const PIVOT_Y = BOARD_Y + BOARD_H + 46;

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string; size: number;
}
interface FlyingBlock {
  x: number; y: number; vx: number; vy: number;
  rot: number; vrot: number; color: string;
}

export default function GameCanvas({
  stateRef,
  fxQueue,
  onCollapseDone,
}: {
  stateRef: React.MutableRefObject<GameState>;
  fxQueue: React.MutableRefObject<FxEvent[]>;
  onCollapseDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const anim = useRef({
    angle: 0,
    shake: 0,
    particles: [] as Particle[],
    flying: [] as FlyingBlock[],
    collapseUntil: 0,
    collapseCalled: true,
    flashRows: [] as { row: number; until: number }[],
  });

  useEffect(() => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext('2d')!;
    let raf = 0;

    const drawBlock = (gx: number, gy: number, color: string, alpha = 1, scale = 1) => {
      const px = BOARD_X + gx * CELL;
      const py = BOARD_Y + gy * CELL;
      const pad = 2 + (1 - scale) * CELL * 0.5;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = color;
      roundRect(ctx, px + pad, py + pad, CELL - pad * 2, CELL - pad * 2, 5);
      ctx.fill();
      ctx.shadowBlur = 0;
      // reflet néon
      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, px + pad + 3, py + pad + 3, CELL - pad * 2 - 6, (CELL - pad * 2) * 0.35, 4);
      ctx.fill();
      ctx.restore();
    };

    const drawGridBoard = (grid: Grid, piece: ActivePiece | null, danger: number) => {
      // cadre du plateau
      const dangerCol = danger > 0.75 ? '#ff2e63' : danger > 0.45 ? '#ffe600' : '#00f0ff';
      ctx.save();
      ctx.strokeStyle = dangerCol;
      ctx.lineWidth = 3;
      ctx.shadowColor = dangerCol;
      ctx.shadowBlur = 18 + (danger > 0.75 ? 10 * Math.sin(performance.now() / 90) : 0);
      roundRect(ctx, BOARD_X - 6, BOARD_Y - 6, BOARD_W + 12, BOARD_H + 12, 8);
      ctx.stroke();
      ctx.restore();

      // fond du plateau
      ctx.save();
      ctx.fillStyle = 'rgba(8, 10, 26, 0.82)';
      roundRect(ctx, BOARD_X, BOARD_Y, BOARD_W, BOARD_H, 4);
      ctx.fill();
      // lignes de grille subtiles
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 1; x < COLS; x++) { ctx.moveTo(BOARD_X + x * CELL, BOARD_Y); ctx.lineTo(BOARD_X + x * CELL, BOARD_Y + BOARD_H); }
      for (let y = 1; y < ROWS; y++) { ctx.moveTo(BOARD_X, BOARD_Y + y * CELL); ctx.lineTo(BOARD_X + BOARD_W, BOARD_Y + y * CELL); }
      ctx.stroke();
      // ligne du pivot (repère central)
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(PIVOT_X, BOARD_Y);
      ctx.lineTo(PIVOT_X, BOARD_Y + BOARD_H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // cellules verrouillées
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++) {
          const c = grid[y][x];
          if (c) drawBlock(x, y, c.color);
        }

      // fantôme + pièce active
      if (piece) {
        const gy = dropY(grid, piece);
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = piece.def.color;
        ctx.lineWidth = 2;
        for (let y = 0; y < piece.matrix.length; y++)
          for (let x = 0; x < piece.matrix[y].length; x++) {
            if (!piece.matrix[y][x]) continue;
            roundRect(ctx, BOARD_X + (piece.x + x) * CELL + 3, BOARD_Y + (gy + y) * CELL + 3, CELL - 6, CELL - 6, 4);
            ctx.stroke();
          }
        ctx.restore();
        for (let y = 0; y < piece.matrix.length; y++)
          for (let x = 0; x < piece.matrix[y].length; x++)
            if (piece.matrix[y][x] && piece.y + y >= 0)
              drawBlock(piece.x + x, piece.y + y, piece.def.color);
      }
    };

    const drawFulcrum = () => {
      ctx.save();
      // socle
      ctx.shadowColor = '#c44dff';
      ctx.shadowBlur = 22;
      ctx.fillStyle = '#7b2ff7';
      ctx.beginPath();
      ctx.moveTo(PIVOT_X, PIVOT_Y - 4);
      ctx.lineTo(PIVOT_X - 56, PIVOT_Y + 66);
      ctx.lineTo(PIVOT_X + 56, PIVOT_Y + 66);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(PIVOT_X, PIVOT_Y - 4);
      ctx.lineTo(PIVOT_X - 20, PIVOT_Y + 66);
      ctx.lineTo(PIVOT_X + 20, PIVOT_Y + 66);
      ctx.closePath();
      ctx.fill();
      // base au sol
      ctx.fillStyle = '#3a1566';
      roundRect(ctx, PIVOT_X - 90, PIVOT_Y + 66, 180, 12, 6);
      ctx.fill();
      ctx.restore();
    };

    const drawPlatform = (angleRad: number) => {
      ctx.save();
      ctx.translate(PIVOT_X, PIVOT_Y);
      ctx.rotate(angleRad);
      ctx.translate(-PIVOT_X, -PIVOT_Y);
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#0e7490';
      roundRect(ctx, BOARD_X - 40, BOARD_Y + BOARD_H + 8, BOARD_W + 80, 18, 8);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      roundRect(ctx, BOARD_X - 40, BOARD_Y + BOARD_H + 8, BOARD_W + 80, 6, 3);
      ctx.fill();
      ctx.restore();
    };

    const burst = (x: number, y: number, color: string, n = 14, power = 4) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = (0.5 + Math.random()) * power;
        anim.current.particles.push({
          x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5,
          life: 0, maxLife: 30 + Math.random() * 25, color, size: 2 + Math.random() * 4,
        });
      }
    };

    const frame = () => {
      const st = stateRef.current;
      const now = performance.now();
      const a = anim.current;

      // --- consommer les effets ---
      for (const fx of fxQueue.current) {
        if (fx.type === 'clear') {
          fx.rows.forEach(r => {
            a.flashRows.push({ row: r, until: now + 350 });
            for (let x = 0; x < COLS; x += 2)
              burst(BOARD_X + (x + 0.5) * CELL, BOARD_Y + (r + 0.5) * CELL, '#ffffff', 6, 5);
          });
          a.shake = Math.max(a.shake, 6);
        } else if (fx.type === 'lock') {
          burst(BOARD_X + (fx.x + 1.5) * CELL, BOARD_Y + (fx.y + 1.5) * CELL, '#9beaff', 8, 3);
          a.shake = Math.max(a.shake, 3);
        } else if (fx.type === 'dynamite') {
          for (let x = 0; x < COLS; x++)
            burst(BOARD_X + (x + 0.5) * CELL, BOARD_Y + (fx.row + 0.5) * CELL, '#ff9f1a', 8, 6);
          a.shake = Math.max(a.shake, 10);
        } else if (fx.type === 'collapse') {
          a.flying = fx.cells.map(c => ({
            x: BOARD_X + c.x * CELL, y: BOARD_Y + c.y * CELL,
            vx: fx.dir * (1 + Math.random() * 4) + (Math.random() - 0.5) * 3,
            vy: -(2 + Math.random() * 5),
            rot: 0, vrot: (Math.random() - 0.5) * 0.35, color: c.color,
          }));
          a.collapseUntil = now + 1700;
          a.collapseCalled = false;
          a.shake = 18;
        }
      }
      fxQueue.current.length = 0;

      // --- angle de la balance (lissé) ---
      let target = st.balance.angleDeg;
      if (st.phase === 'collapse') target = (st.balance.avgOffset >= 0 ? 1 : -1) * 40;
      // tremblement de terre
      if (st.event?.def.type === 'TREMBLEMENT' && st.phase === 'play') {
        target += Math.sin(now / 55) * (1.2 + st.balance.danger * 2.2);
      }
      a.angle += (target - a.angle) * 0.08;
      const angleRad = (a.angle * Math.PI) / 180;

      // --- fin de l'animation d'effondrement ---
      if (st.phase === 'collapse' && !a.collapseCalled && now > a.collapseUntil) {
        a.collapseCalled = true;
        a.flying = [];
        onCollapseDone();
      }

      // ================= RENDU =================
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      if (a.shake > 0.3) {
        ctx.translate((Math.random() - 0.5) * a.shake, (Math.random() - 0.5) * a.shake);
        a.shake *= 0.88;
      }

      // sol néon
      const grad = ctx.createLinearGradient(0, PIVOT_Y + 78, 0, H);
      grad.addColorStop(0, 'rgba(196,77,255,0.25)');
      grad.addColorStop(1, 'rgba(0,240,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, PIVOT_Y + 78, W, H - PIVOT_Y - 78);
      ctx.strokeStyle = 'rgba(196,77,255,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, PIVOT_Y + 78);
      ctx.lineTo(W, PIVOT_Y + 78);
      ctx.stroke();

      drawFulcrum();
      drawPlatform(angleRad);

      // plateau + pièces (tournent autour du pivot)
      ctx.save();
      ctx.translate(PIVOT_X, PIVOT_Y);
      ctx.rotate(angleRad);
      ctx.translate(-PIVOT_X, -PIVOT_Y);
      drawGridBoard(st.grid, st.phase === 'play' ? st.piece : null, st.balance.danger);
      // blocs qui volent lors de l'effondrement
      for (const b of a.flying) {
        ctx.save();
        ctx.translate(b.x + CELL / 2, b.y + CELL / 2);
        ctx.rotate(b.rot);
        ctx.translate(-CELL / 2, -CELL / 2);
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = b.color;
        roundRect(ctx, 2, 2, CELL - 4, CELL - 4, 5);
        ctx.fill();
        ctx.restore();
        b.x += b.vx; b.y += b.vy; b.vy += 0.35; b.rot += b.vrot;
      }
      ctx.restore();

      // flash de lignes clear
      a.flashRows = a.flashRows.filter(f => f.until > now);
      for (const f of a.flashRows) {
        ctx.save();
        ctx.globalAlpha = (f.until - now) / 350;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.fillRect(BOARD_X, BOARD_Y + f.row * CELL, BOARD_W, CELL);
        ctx.restore();
      }

      // particules
      a.particles = a.particles.filter(p => p.life < p.maxLife);
      for (const p of a.particles) {
        p.life++;
        p.x += p.vx; p.y += p.vy; p.vy += 0.12;
        ctx.save();
        ctx.globalAlpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      }

      ctx.restore();
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [stateRef, fxQueue, onCollapseDone]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="max-h-[86vh] w-auto max-w-full rounded-xl"
      style={{ imageRendering: 'auto' }}
    />
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
