
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { INITIAL_STATE, ALGORITHMS, MOVE_BUTTON_GROUPS, MOVE_INFO } from './constants';
import { applyMove, parseAlgorithm, getInverseAlgorithm } from './services/cubeLogic';
import { CubeState, Move, Algorithm, TrainingMode, ScoreState } from './types';
import Cube3D from './components/Cube3D';

const App: React.FC = () => {
  const [cubeState, setCubeState] = useState<CubeState>(INITIAL_STATE);
  const [selectedAlgo, setSelectedAlgo] = useState<Algorithm>(ALGORITHMS[0]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pendingMove, setPendingMove] = useState<Move | undefined>();
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  
  const [mode, setMode] = useState<TrainingMode>('training');
  const [animSpeed, setAnimSpeed] = useState(350); // Slightly slower for kids to follow
  const [scores, setScores] = useState<ScoreState>({ streak: 0, bestStreak: 0, startTime: null, totalTime: 0, stars: 0 });
  const [customAlgoText, setCustomAlgoText] = useState("");
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<number | null>(null);
  const [showHint, setShowHint] = useState(false);

  const setupRestorationCase = useCallback((algo: Algorithm) => {
    const scrambleMoves = getInverseAlgorithm(algo.moves);
    let tempState = INITIAL_STATE;
    scrambleMoves.forEach(m => {
      tempState = applyMove(tempState, m);
    });
    setCubeState(tempState);
    setCurrentStep(0);
    setElapsedTime(0);
    setIsTimerRunning(false);
    setShowHint(false);
    setFeedback(null);
  }, []);

  const reset = useCallback(() => {
    setupRestorationCase(selectedAlgo);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }, [selectedAlgo, setupRestorationCase]);

  useEffect(() => {
    setupRestorationCase(selectedAlgo);
  }, [selectedAlgo, setupRestorationCase]);

  const handleMove = useCallback((move: Move) => {
    // Critical: Do not allow move if already animating or playing demo
    if (isAnimating || isPlayingDemo || pendingMove) return;

    if (!isTimerRunning && currentStep === 0) {
      setIsTimerRunning(true);
      setScores(prev => ({ ...prev, startTime: Date.now() }));
    }

    // If in challenge mode, check if the move is correct
    if (currentStep < selectedAlgo.moves.length) {
      if (move === selectedAlgo.moves[currentStep]) {
        setFeedback({ text: "对啦！✨", color: "text-green-500" });
        setShowHint(false);
      } else {
        setFeedback({ text: "看清楚步骤哦 💪", color: "text-orange-500" });
        // Don't apply incorrect move in guided training
        return; 
      }
    }

    setPendingMove(move);
    setIsAnimating(true);
  }, [currentStep, isAnimating, isPlayingDemo, pendingMove, selectedAlgo, isTimerRunning]);

  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 0.1);
      }, 100);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [isTimerRunning]);

  const onAnimationComplete = useCallback(() => {
    if (pendingMove) {
      const moveDone = pendingMove;
      setCubeState(prev => applyMove(prev, moveDone));
      
      if (!isPlayingDemo) {
        const nextStep = currentStep + 1;
        if (nextStep >= selectedAlgo.moves.length) {
          setIsTimerRunning(false);
          setFeedback({ text: `还原成功！🏆`, color: "text-purple-600 font-bold text-xl" });
          setScores(prev => ({ 
            ...prev, streak: prev.streak + 1, bestStreak: Math.max(prev.streak + 1, prev.bestStreak)
          }));
        }
        setCurrentStep(nextStep);
      }
      
      setPendingMove(undefined);
    }
  }, [pendingMove, currentStep, selectedAlgo, isPlayingDemo]);

  const startDemo = useCallback(() => {
    if (isAnimating || isPlayingDemo || pendingMove) return;
    setupRestorationCase(selectedAlgo);
    setIsPlayingDemo(true);
    setFeedback({ text: "开始演示...", color: "text-blue-500" });
  }, [isAnimating, isPlayingDemo, pendingMove, selectedAlgo, setupRestorationCase]);

  useEffect(() => {
    if (isPlayingDemo && !isAnimating && !pendingMove) {
      if (currentStep < selectedAlgo.moves.length) {
        const timer = setTimeout(() => {
          setPendingMove(selectedAlgo.moves[currentStep]);
          setIsAnimating(true);
        }, 300);
        return () => clearTimeout(timer);
      } else {
        setIsPlayingDemo(false);
        setFeedback({ text: "轮到你啦！", color: "text-blue-600" });
      }
    }
  }, [isPlayingDemo, isAnimating, pendingMove, currentStep, selectedAlgo]);

  return (
    <div className="min-h-screen bg-[#f0f9ff] flex flex-col lg:flex-row overflow-hidden font-['Nunito']">
      
      <div className="flex-1 relative flex flex-col items-center justify-center p-4">
        <div className="w-full h-[400px] lg:h-full max-h-[800px] relative">
          <Cube3D 
            cubeState={cubeState} 
            isAnimating={isAnimating}
            setIsAnimating={setIsAnimating}
            onAnimationComplete={onAnimationComplete}
            pendingMove={pendingMove}
            animationSpeed={animSpeed}
          />
          
          <div className="absolute top-6 left-6 space-y-4">
             <div className="bg-white/95 backdrop-blur shadow-xl px-6 py-4 rounded-3xl border-4 border-blue-100 min-w-[200px]">
               <h1 className="text-xl kids-font text-blue-600 truncate">{selectedAlgo.name}</h1>
               <div className="flex items-center gap-3 mt-1">
                 <span className="text-sm font-bold text-slate-400">步数: {currentStep}/{selectedAlgo.moves.length}</span>
                 <span className="text-blue-500 font-mono font-bold">{elapsedTime.toFixed(1)}s</span>
               </div>
             </div>
             {feedback && (
               <div className="bg-white px-5 py-2 rounded-2xl shadow-lg border-2 border-yellow-200 animate-pulse text-center">
                 <span className={`${feedback.color} font-bold`}>{feedback.text}</span>
               </div>
             )}
          </div>

          <div className="absolute bottom-6 left-6 flex gap-2">
            <button onClick={() => setAnimSpeed(animSpeed === 350 ? 800 : 350)}
              className="px-4 py-2 bg-white rounded-2xl border-2 border-blue-100 text-blue-500 font-bold shadow-md active:scale-95 transition-all">
              {animSpeed === 350 ? '🚀 快速' : '🐢 慢速'}
            </button>
            <button onClick={() => setShowHint(!showHint)}
              className={`px-4 py-2 rounded-2xl border-2 font-bold shadow-md active:scale-95 transition-all
                ${showHint ? 'bg-yellow-400 border-yellow-500 text-white' : 'bg-white border-yellow-100 text-yellow-600'}`}>
              💡 提示
            </button>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[480px] bg-white shadow-2xl overflow-y-auto p-6 lg:p-8 flex flex-col gap-6 border-l border-slate-100">
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="kids-font text-xl text-blue-500">🎮 魔法指令</h2>
            <button onClick={startDemo} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-700 active:scale-95">
              自动演示
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            {selectedAlgo.moves.map((m, i) => (
              <div key={i} className={`w-10 h-10 flex flex-col items-center justify-center rounded-lg font-bold transition-all
                  ${i === currentStep ? 'bg-blue-600 text-white scale-110 shadow-md ring-4 ring-blue-50' : 'bg-white text-slate-300 border border-slate-100'}
                  ${i < currentStep ? 'bg-green-100 text-green-600' : ''}
                `}>
                <span className="text-[10px]">{MOVE_INFO[m].kid}</span>
                <span className="text-[8px] opacity-40">{m}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {MOVE_BUTTON_GROUPS.map((group, gIdx) => (
              <div key={gIdx} className="flex gap-2">
                 {group.map(move => (
                   <button
                      key={move}
                      disabled={isAnimating || isPlayingDemo}
                      onClick={() => handleMove(move)}
                      className={`flex-1 py-3 px-1 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 border-b-4
                        ${move.includes("'") ? 'bg-rose-50 border-rose-200 text-rose-600' : move.includes("2") ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-blue-50 border-blue-200 text-blue-600'}
                        ${showHint && move === selectedAlgo.moves[currentStep] ? 'ring-4 ring-yellow-400 z-10 scale-105 shadow-xl' : ''}
                        disabled:opacity-40 disabled:grayscale`}
                   >
                     <span className="text-xl font-black kids-font">{MOVE_INFO[move].kid}</span>
                     <span className="text-[9px] font-bold opacity-60">
                        {MOVE_INFO[move].cn} ({move})
                     </span>
                   </button>
                 ))}
              </div>
            ))}
          </div>
          <button onClick={reset} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform">
            ↩️ 重新开始
          </button>
        </section>

        <section className="space-y-4">
           <h2 className="kids-font text-xl text-blue-500">🏆 秘籍选择</h2>
           <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
             {ALGORITHMS.map(algo => (
               <button 
                 key={algo.id}
                 onClick={() => { setSelectedAlgo(algo); }}
                 className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex justify-between items-center ${selectedAlgo.id === algo.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white'}`}
               >
                 <span className="font-bold text-slate-700">{algo.name}</span>
                 <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full">{algo.moves.length}步</span>
               </button>
             ))}
           </div>
        </section>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
