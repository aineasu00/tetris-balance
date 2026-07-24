// ============================================================
// TETRIS BALANCE — Écrans : menu principal & fin de partie
// ============================================================
import type { GameState } from '../hooks/useGame';

export function MenuScreen({ onStart }: { onStart: (players: number) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4 relative z-10">
      <div className="text-center">
        <h1 className="game-title text-5xl md:text-7xl">TETRIS</h1>
        <h1 className="game-title-alt text-4xl md:text-6xl mt-2">BALANCE</h1>
        <p className="text-cyan-200 mt-4 text-sm md:text-base tracking-widest">
          UN TETRIS SUR UN FIL • TOUR PAR TOUR • 2-4 JOUEURS
        </p>
      </div>

      <div className="rules-box">
        <p>⚖️ Chaque pièce a un <b>poids</b> — placez-la sans faire basculer la balance !</p>
        <p>⏱️ Les pièces <b>tombent toutes seules</b> : plus elles sont lourdes, plus elles dévalent vite. Une enclume ne pardonne pas…</p>
        <p>💥 Trop de poids d'un côté = <b>effondrement</b> et une vie en moins.</p>
        <p>🎁 Objets bonus, poids variables et événements surprises façon <b>Mario Kart</b>.</p>
        <p>🏆 Dernier joueur debout — ou meilleur score au tour 60 — gagne la partie.</p>
      </div>

      <div className="flex gap-4">
        {[2, 3, 4].map(n => (
          <button key={n} onClick={() => onStart(n)} className="start-btn">
            {n} JOUEURS
          </button>
        ))}
      </div>

      <p className="text-slate-400 text-xs">Même clavier pour tous • ◀▶ déplacer • ▲ pivoter • ▼ poser • ESPACE chute • E objet</p>
    </div>
  );
}

export function GameOverScreen({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const winner = state.winner !== null ? state.players[state.winner] : null;
  const ranking = [...state.players].sort((a, b) => b.score - a.score);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4 relative z-10">
      <h1 className="game-title text-4xl md:text-6xl">PARTIE TERMINÉE</h1>
      {winner ? (
        <div className="text-center">
          <div className="text-6xl mb-3">🏆</div>
          <div className="text-3xl font-black" style={{ color: winner.color, textShadow: `0 0 20px ${winner.color}` }}>
            {winner.name} GAGNE !
          </div>
        </div>
      ) : (
        <div className="text-2xl text-slate-300">ÉGALITÉ GÉNÉRALE !</div>
      )}

      <div className="rules-box w-full max-w-md">
        {ranking.map((p, i) => (
          <div key={p.id} className="flex justify-between items-center py-1">
            <span style={{ color: p.color, textShadow: `0 0 8px ${p.color}` }}>
              {['🥇', '🥈', '🥉', '4️⃣'][i]} {p.name} {p.eliminated ? '💀' : ''}
            </span>
            <span className="text-white font-bold score-font">{p.score} pts • {p.lines} lignes</span>
          </div>
        ))}
      </div>

      <button onClick={onRestart} className="start-btn">↻ REJOUER</button>
    </div>
  );
}

export function Banner({ state }: { state: GameState }) {
  if (!state.banner) return null;
  const b = state.banner;
  const colors: Record<string, string> = {
    info: '#00f0ff',
    event: '#ff2ed8',
    danger: '#ff2e63',
    good: '#39ff6a',
  };
  const c = colors[b.kind];
  return (
    <div key={b.key} className="banner-overlay">
      <div className="banner-text" style={{ color: c, textShadow: `0 0 24px ${c}, 0 0 60px ${c}` }}>{b.text}</div>
      {b.sub && <div className="banner-sub">{b.sub}</div>}
    </div>
  );
}
