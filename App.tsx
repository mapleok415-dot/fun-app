
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
  const [animSpeed, setAnimSpeed] = useState(300);
  const [scores, setScores] = useState<ScoreState>({ streak: 0, bestStreak: 0, startTime: null, totalTime: 0, stars: 0 });
  const [customAlgoText, setCustomAlgoText] = useState("");
  
  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<number | null>(null);

  // Hint state
  const [showHint, setShowHint] = useState(false);

  // Helper to setup the cube so that applying the formula results in Solved
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

  // Initial setup
  useEffect(() => {
    setupRestorationCase(selectedAlgo);
  }, [selectedAlgo, setupRestorationCase]);

  const handleMove = useCallback((move: Move) => {
    if (isAnimating || isPlayingDemo) return;

    // Start timer on first move if not running
    if (!isTimerRunning && currentStep === 0) {
      setIsTimerRunning(true);
      setScores(prev => ({ ...prev, startTime: Date.now() }));
    }

    if (currentStep < selectedAlgo.moves.length) {
      if (move === selectedAlgo.moves[currentStep]) {
        setFeedback({ text: "对啦！✨", color: "text-green-500" });
        setShowHint(false);
      } else {
        setFeedback({ text: mode === 'training' ? "看清楚步骤哦 💪" : "记错公式啦 🤔", color: "text-orange-500" });
        setScores(prev => ({ ...prev, streak: 0 }));
        return; 
      }
    }

    setPendingMove(move);
    setIsAnimating(true);
  }, [currentStep, isAnimating, isPlayingDemo, selectedAlgo, mode, isTimerRunning]);

  // Timer Effect
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 0.1);
      }, 100);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  const onAnimationComplete = useCallback(() => {
    if (pendingMove) {
      setCubeState(prev => applyMove(prev, pendingMove));
      if (!isPlayingDemo) {
        const nextStep = currentStep + 1;
        if (nextStep >= selectedAlgo.moves.length) {
          setIsTimerRunning(false);
          const finalTime = elapsedTime;
          let stars = 1;
          if (finalTime < selectedAlgo.moves.length * 1.5) stars = 3;
          else if (finalTime < selectedAlgo.moves.length * 3) stars = 2;
          
          setFeedback({ text: `还原成功！用时 ${finalTime.toFixed(1)}s ⭐ ${stars}星`, color: "text-purple-600 font-bold" });
          setScores(prev => ({ 
            ...prev, 
            totalTime: finalTime, 
            stars: Math.max(prev.stars, stars),
            streak: prev.streak + 1,
            bestStreak: Math.max(prev.streak + 1, prev.bestStreak)
          }));
          setCurrentStep(nextStep);
        } else {
          setCurrentStep(nextStep);
        }
      }
      setPendingMove(undefined);
    }
  }, [pendingMove, currentStep, selectedAlgo, isPlayingDemo, elapsedTime]);

  const startDemo = useCallback(() => {
    if (isAnimating || isPlayingDemo) return;
    setupRestorationCase(selectedAlgo);
    setIsPlayingDemo(true);
    setFeedback({ text: "观察如何还原...", color: "text-blue-500" });
  }, [isAnimating, isPlayingDemo, selectedAlgo, setupRestorationCase]);

  useEffect(() => {
    if (isPlayingDemo && !isAnimating) {
      if (currentStep < selectedAlgo.moves.length) {
        const timer = setTimeout(() => {
          setPendingMove(selectedAlgo.moves[currentStep]);
          setIsAnimating(true);
          setCurrentStep(prev => prev + 1);
        }, animSpeed + 150);
        return () => clearTimeout(timer);
      } else {
        setIsPlayingDemo(false);
        setFeedback({ text: "演示完毕，轮到你还原了！", color: "text-blue-600" });
      }
    }
  }, [isPlayingDemo, isAnimating, currentStep, selectedAlgo, animSpeed]);

  const addCustomAlgo = () => {
    const moves = parseAlgorithm(customAlgoText);
    if (moves.length === 0) return;
    const newAlgo: Algorithm = {
      id: `custom-${Date.now()}`,
      name: `自定义还原`,
      description: customAlgoText,
      moves,
      category: 'custom'
    };
    ALGORITHMS.push(newAlgo);
    setSelectedAlgo(newAlgo);
    setCustomAlgoText("");
  };

  const toggleHint = () => {
    setShowHint(!showHint);
    if (!showHint) {
      setFeedback({ text: `提示：执行 ${selectedAlgo.moves[currentStep]} 步`, color: "text-blue-400" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row overflow-hidden">
      
      {/* Left Column: 3D Scene */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4 bg-white lg:bg-transparent">
        <div className="w-full h-[450px] lg:h-full max-h-[850px] relative">
          <Cube3D 
            cubeState={cubeState} 
            isAnimating={isAnimating}
            setIsAnimating={setIsAnimating}
            onAnimationComplete={onAnimationComplete}
            pendingMove={pendingMove}
            animationSpeed={animSpeed}
          />
          
          {/* Main Status HUD (Top Left) */}
          <div className="absolute top-8 left-8 space-y-4">
             <div className="bg-white/90 backdrop-blur shadow-xl px-6 py-4 rounded-3xl border border-slate-100 min-w-[200px]">
               <h1 className="text-2xl kids-font text-blue-600 truncate max-w-[220px]">{selectedAlgo.name}</h1>
               <p className="text-[10px] text-slate-400 font-bold -mt-1 mb-2">目标：还原魔方</p>
               <div className="flex items-center gap-3 mt-1">
                 <span className="text-sm font-bold text-slate-400">步数: {currentStep}/{selectedAlgo.moves.length}</span>
                 <div className="h-4 w-px bg-slate-200" />
                 <span className="text-blue-500 font-mono font-bold">{elapsedTime.toFixed(1)}s</span>
                 <div className="h-4 w-px bg-slate-200" />
                 <span className="text-yellow-500 font-bold">★ {scores.stars}</span>
               </div>
             </div>
             {feedback && (
               <div className="bg-white/95 px-6 py-3 rounded-2xl shadow-lg border border-slate-50 animate-bounce">
                 <span className={`${feedback.color} font-black`}>{feedback.text}</span>
               </div>
             )}
          </div>

          {/* Floating Tool Palette (Top Right - docked to cube side) */}
          <div className="absolute top-8 right-8 flex flex-col gap-3">
            <button 
              onClick={() => setAnimSpeed(animSpeed === 300 ? 800 : 300)}
              className={`w-14 h-14 flex flex-col items-center justify-center rounded-2xl shadow-lg border-2 transition-all 
                ${animSpeed === 300 ? 'bg-white border-blue-100 text-blue-500' : 'bg-blue-600 border-blue-700 text-white'}`}
              title="切换动画速度"
            >
              <span className="text-xl">{animSpeed === 300 ? '🚀' : '🐢'}</span>
              <span className="text-[10px] font-black uppercase tracking-tighter">{animSpeed === 300 ? '极速' : '慢放'}</span>
            </button>

            <button 
              onClick={toggleHint}
              className={`w-14 h-14 flex flex-col items-center justify-center rounded-2xl shadow-lg border-2 transition-all
                ${showHint ? 'bg-yellow-400 border-yellow-500 text-white' : 'bg-white border-yellow-100 text-yellow-600'}`}
              title="提示下一步"
            >
              <span className="text-xl">💡</span>
              <span className="text-[10px] font-black uppercase tracking-tighter">提示</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Controls */}
      <div className="w-full lg:w-[480px] bg-white shadow-2xl overflow-y-auto p-6 lg:p-10 flex flex-col gap-8">
        
        {/* Mode & Global Actions */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest font-black text-slate-400">选择练习模式</h2>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => { setMode('training'); reset(); }}
              className={`py-3 rounded-2xl font-bold border-2 transition-all ${mode === 'training' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
            >
              跟练模式
            </button>
            <button 
              onClick={() => { setMode('exam'); reset(); }}
              className={`py-3 rounded-2xl font-bold border-2 transition-all ${mode === 'exam' ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
            >
              考试模式
            </button>
          </div>
        </section>

        {/* Algorithm Steps Display */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-xs uppercase tracking-widest font-black text-slate-400">还原公式步骤</h2>
            <button onClick={startDemo} className="text-xs text-blue-600 font-bold hover:underline">自动演示还原</button>
          </div>
          <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-3xl min-h-[80px]">
            {selectedAlgo.moves.map((m, i) => (
              <div 
                key={i} 
                className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-sm transition-all
                  ${i === currentStep ? 'bg-blue-600 text-white scale-125 shadow-lg ring-4 ring-blue-100' : 'bg-white text-slate-400 border border-slate-200'}
                  ${i < currentStep ? 'bg-green-100 text-green-600 border-green-200' : ''}
                  ${mode === 'exam' && i >= currentStep ? 'opacity-20 blur-[2px]' : ''}
                  ${showHint && i === currentStep ? 'animate-pulse bg-yellow-400 ring-4 ring-yellow-200 text-white' : ''}
                `}
              >
                {m}
              </div>
            ))}
          </div>
          {mode === 'exam' && <p className="text-[10px] text-center text-slate-300">考试模式隐藏了还原路径，加油哦！</p>}
        </section>

        {/* Controls Grid */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest font-black text-slate-400">操作控制区</h2>
          <div className="grid grid-cols-1 gap-3">
            {MOVE_BUTTON_GROUPS.map((group, gIdx) => (
              <div key={gIdx} className="flex gap-2">
                 {group.map(move => (
                   <button
                      key={move}
                      disabled={isAnimating || isPlayingDemo}
                      onClick={() => handleMove(move)}
                      className={`flex-1 group py-3 px-1 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 border-b-4
                        ${move.includes("'") ? 'bg-orange-50 border-orange-200' : move.includes("2") ? 'bg-slate-100 border-slate-300' : 'bg-blue-50 border-blue-200'}
                        ${showHint && move === selectedAlgo.moves[currentStep] ? 'ring-4 ring-yellow-300 z-10 scale-105 shadow-xl shadow-yellow-100' : ''}
                        disabled:opacity-40
                      `}
                   >
                     <span className="text-[10px] font-bold text-slate-400 mb-1">{MOVE_INFO[move].cn}</span>
                     <span className="text-base font-black text-slate-700">{move}</span>
                     <span className="text-xs mt-1 text-slate-400 group-hover:scale-125 transition-transform">{MOVE_INFO[move].icon}</span>
                   </button>
                 ))}
              </div>
            ))}
          </div>
          <button onClick={reset} className="w-full py-4 mt-2 bg-slate-800 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-200">
            重置当前关卡
          </button>
        </section>

        {/* Library */}
        <section className="space-y-4">
           <div className="flex justify-between items-center">
             <h2 className="text-xs uppercase tracking-widest font-black text-slate-400">公式挑战库</h2>
             <span className="text-[10px] text-slate-300 font-bold">{ALGORITHMS.length} 个还原公式</span>
           </div>
           <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
             {ALGORITHMS.map(algo => (
               <button 
                 key={algo.id}
                 onClick={() => { setSelectedAlgo(algo); }}
                 className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${selectedAlgo.id === algo.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-50 bg-slate-50'}`}
               >
                 <div className="flex justify-between items-start">
                    <span className="font-black text-slate-700 text-sm">{algo.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold 
                      ${algo.category === 'basic' ? 'bg-green-100 text-green-600' : algo.category === 'advanced' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                      {algo.category === 'basic' ? '基础' : algo.category === 'advanced' ? '进阶' : '挑战'}
                    </span>
                 </div>
                 <p className="text-[10px] text-slate-400 mt-1 truncate">{algo.moves.join(' ')}</p>
               </button>
             ))}
           </div>
        </section>

        {/* Custom Input */}
        <section className="pt-4 border-t border-slate-100 pb-8">
           <div className="flex gap-2">
             <input 
               type="text" 
               placeholder="添加新的还原步骤 (如 R U R' U')" 
               className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-300"
               value={customAlgoText}
               onChange={(e) => setCustomAlgoText(e.target.value)}
             />
             <button onClick={addCustomAlgo} className="bg-slate-800 text-white px-6 rounded-xl font-black text-xs">添加</button>
           </div>
        </section>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .kids-font { font-family: 'ZCOOL KuaiLe', sans-serif; }
      `}</style>
    </div>
  );
};

export default App;
