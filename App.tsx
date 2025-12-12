import { GameProvider } from './context/GameContext';
import { Scene } from './components/Scene';
import { UI } from './components/UI';
import { HandTracker } from './components/HandTracker';

const App = () => {
  return (
    <GameProvider>
      <div className="w-full h-screen bg-slate-900 overflow-hidden relative selection:bg-emerald-500/30">
        <Scene />
        <UI />
        <HandTracker />
      </div>
    </GameProvider>
  );
};

export default App;
