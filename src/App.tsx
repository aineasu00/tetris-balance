import { useGame } from './hooks/useGame';
import GameCanvas from './components/GameCanvas';
import { PlayersPanel, InfoPanel } from './components/Hud';
import { MenuScreen, GameOverScreen, Banner } from './components/Screens';

export default function App() {
  const { state, stateRef, fxQueue, startGame, finishCollapse, backToMenu } = useGame();

  return (
    <div className="min-h-screen arcade-bg text-white overflow-hidden select-none">
      <div className="scanlines" />
      {state.phase === 'menu' && <MenuScreen onStart={startGame} />}
      {state.phase === 'gameover' && <GameOverScreen state={state} onRestart={backToMenu} />}
      {(state.phase === 'play' || state.phase === 'collapse') && (
        <div className="flex items-center justify-center gap-6 min-h-screen px-4 py-3 relative z-10">
          <PlayersPanel state={state} />
          <GameCanvas stateRef={stateRef} fxQueue={fxQueue} onCollapseDone={finishCollapse} />
          <InfoPanel state={state} />
        </div>
      )}
      <Banner state={state} />
    </div>
  );
}
