// ============================================================
// TETRIS BALANCE — HUD : joueurs, balance, événements, contrôles
// ============================================================
import type { GameState } from '../hooks/useGame';
import { ITEMS } from '../game/handy';
import { WEIGHT_LABEL, WEIGHT_COLOR, MAX_TURNS, fallIntervalFor, BALANCE_MODES } from '../game/constants';

function fallSpeedLabel(mult: number): { label: string; color: string; bars: number } {
  const ms = fallIntervalFor(mult);
  if (ms >= 1200) return { label: 'FLOTTANTE', color: '#aef7ff', bars: 1 };
  if (ms >= 650) return { label: 'LENTE', color: '#39ff6a', bars: 2 };
  if (ms >= 450) return { label: 'MOYENNE', color: '#ffe600', bars: 3 };
  if (ms >= 300) return { label: 'RAPIDE', color: '#ff9f1a', bars: 4 };
  return { label: 'ÉCLAIR', color: '#ff2e63', bars: 5 };
}

export function PlayersPanel({ state }: { state: GameState }) {
  const leaderScore = Math.max(0, ...state.players.map(p => p.score));
  return (
    <div className="flex flex-col gap-3 w-64">
      <h2 className="neon-subtitle text-sm tracking-widest text-cyan-300">JOUEURS</h2>
      {state.players.map((p, i) => {
        const active = i === state.current && state.phase === 'play';
        return (
          <div
            key={p.id}
            className={`player-card ${active ? 'player-card-active' : ''} ${p.eliminated ? 'opacity-40 grayscale' : ''}`}
            style={{ borderColor: p.color, boxShadow: active ? `0 0 18px ${p.color}` : `0 0 6px ${p.color}55` }}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm" style={{ color: p.color, textShadow: `0 0 8px ${p.color}` }}>
                {p.score === leaderScore && p.score > 0 && !p.eliminated ? '👑 ' : ''}{p.name}
              </span>
              <span className="text-red-400 text-xs tracking-tighter">
                {'♥'.repeat(Math.max(0, p.lives))}{'🖤'.repeat(Math.max(0, 3 - p.lives))}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-white text-lg font-black score-font">{p.score}</span>
              <span className="text-xs text-slate-300">
                {p.eliminated ? '💀 ÉLIMINÉ' : p.item ? `${ITEMS[p.item].icon} ${ITEMS[p.item].name}` : `${p.lines} lignes`}
              </span>
            </div>
            {active && <div className="turn-indicator">▶ À TON TOUR</div>}
          </div>
        );
      })}
    </div>
  );
}

export function InfoPanel({ state }: { state: GameState }) {
  const danger = Math.min(1, state.balance.danger);
  const angle = state.balance.angleDeg;
  const piece = state.piece;
  const wColor = piece ? WEIGHT_COLOR[piece.mult >= 4 ? 3 : Math.round(piece.mult)] ?? '#ffe600' : '#888';
  const wLabel = piece ? (piece.mult === 0 ? 'PLUME' : piece.mult >= 4 ? 'ENCLUME' : WEIGHT_LABEL[Math.max(1, Math.round(piece.mult))]) : '';

  return (
    <div className="flex flex-col gap-4 w-64">
      {/* Jauge de la balance */}
      <div className="hud-box">
        <h2 className="neon-subtitle text-sm tracking-widest text-cyan-300 mb-2">
          BALANCE <span className="text-fuchsia-300">{BALANCE_MODES[state.balanceMode].icon} {BALANCE_MODES[state.balanceMode].name}</span>
        </h2>
        <div className="balance-gauge">
          <div className="balance-gauge-center" />
          <div
            className="balance-gauge-needle"
            style={{ transform: `rotate(${angle * 2.2}deg)`, background: danger > 0.75 ? '#ff2e63' : danger > 0.45 ? '#ffe600' : '#00f0ff' }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>◀ GAUCHE</span><span>DROITE ▶</span>
        </div>
        <div className="danger-bar mt-2">
          <div
            className="danger-bar-fill"
            style={{
              width: `${Math.min(100, danger * 100)}%`,
              background: danger > 0.75 ? '#ff2e63' : danger > 0.45 ? '#ffe600' : '#39ff6a',
            }}
          />
        </div>
        <div className="text-center text-xs mt-1" style={{ color: danger > 0.75 ? '#ff2e63' : '#94a3b8' }}>
          {danger > 0.75 ? '⚠ DANGER IMMINENT ⚠' : danger > 0.45 ? 'Instable…' : 'Stable'}
          {state.supportTurns > 0 && <span className="text-cyan-300"> • 🏛️ ×{state.supportTurns}</span>}
        </div>
      </div>

      {/* Pièce courante */}
      {piece && (() => {
        const speed = fallSpeedLabel(piece.mult);
        return (
          <div className="hud-box">
            <h2 className="neon-subtitle text-sm tracking-widest text-cyan-300 mb-2">PIÈCE</h2>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black" style={{ color: piece.def.color, textShadow: `0 0 10px ${piece.def.color}` }}>
                {piece.def.name}
              </span>
              <span className="text-sm font-bold px-2 py-1 rounded" style={{ color: wColor, border: `1px solid ${wColor}`, textShadow: `0 0 8px ${wColor}` }}>
                {wLabel}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-slate-400">CHUTE</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <span
                    key={i}
                    className="speed-bar"
                    style={{
                      background: i <= speed.bars ? speed.color : 'rgba(255,255,255,0.12)',
                      boxShadow: i <= speed.bars ? `0 0 6px ${speed.color}` : 'none',
                    }}
                  />
                ))}
                <span className="text-[10px] font-bold ml-1" style={{ color: speed.color }}>{speed.label}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Événement actif */}
      {state.event && (
        <div className="hud-box event-box">
          <div className="text-sm font-bold text-fuchsia-300">{state.event.def.icon} {state.event.def.name}</div>
          <div className="text-xs text-slate-300 mt-1">{state.event.def.desc}</div>
          <div className="text-[10px] text-slate-400 mt-1">Encore {state.event.turnsLeft} tour{state.event.turnsLeft > 1 ? 's' : ''}</div>
        </div>
      )}

      {/* Tour */}
      <div className="hud-box text-center">
        <span className="text-xs text-slate-400">TOUR</span>
        <div className="text-xl font-black text-white score-font">
          {state.turn}{' '}
          <span className="text-slate-500 text-sm">{state.gameMode === 'INFINI' ? '• ∞' : `/ ${MAX_TURNS}`}</span>
        </div>
      </div>

      {/* Contrôles */}
      <div className="hud-box text-xs text-slate-300 leading-6">
        <h2 className="neon-subtitle text-sm tracking-widest text-cyan-300 mb-1">CONTRÔLES</h2>
        <div>◀ ▶ &nbsp;déplacer</div>
        <div>▲ &nbsp;pivoter</div>
        <div>▼ &nbsp;descendre / poser</div>
        <div><span className="key">ESPACE</span> chute libre</div>
        <div><span className="key">E</span> utiliser l'objet</div>
      </div>
    </div>
  );
}
