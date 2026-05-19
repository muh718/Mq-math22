import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, LogOut, ChevronRight, RotateCcw, Award, User, Users } from 'lucide-react';
import { MATHEMATICS_DATABASE } from './questionsData';
import { supabase } from './supabaseClient';

const TOPICS = ['الباب الخامس', 'الباب السادس', 'الباب السابع', 'الباب الثامن'];
const SUBJECT_ID = "MqMath22";

const CSS_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&family=Amiri:wght@700&display=swap');
  
  body, html { 
    font-family: 'Tajawal', sans-serif; 
    margin: 0; padding: 0;
    background-color: #020617; color: white;
    user-select: none;
    overflow: hidden !important; 
    width: 100vw; height: 100dvh; 
  }

  .classic-title { font-family: 'Amiri', serif; }
  
  .glass-box {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255,255,255,0.1);
  }

  .input-field {
    width: 100%;
    background: rgba(30, 41, 59, 0.8);
    border: 2px solid rgba(255,255,255,0.1);
    color: white !important;
    text-align: center;
    padding: 1.2rem;
    border-radius: 1rem;
    font-size: 1.2rem;
    font-weight: 700;
    outline: none;
    transition: border-color 0.3s;
  }
  .input-field:focus { border-color: #3b82f6; }

  .hex-text { 
    font-weight: 900; 
    fill: white;
    pointer-events: none !important; 
    filter: drop-shadow(0 2px 4px rgba(0,0,0,1));
    font-family: 'Tajawal', sans-serif;
  }
  
  @media (max-width: 767px) { .hex-text { font-size: 24px; } }
  @media (min-width: 768px) { .hex-text { font-size: 22px; } }
`;

const GRID_SIZE = 5;
const HEX_RADIUS = 95; 
const HEX_X_STRETCH = 1.30; 
const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS * HEX_X_STRETCH; 
const HEX_HEIGHT = 2 * HEX_RADIUS; 
const VERT_DIST = HEX_HEIGHT * 0.75;
const VB_WIDTH = (GRID_SIZE * HEX_WIDTH) + (HEX_WIDTH / 2);
const VB_HEIGHT = ((GRID_SIZE - 1) * VERT_DIST) + HEX_HEIGHT;

const THICKNESS_X = 105; 
const THICKNESS_Y = 91;  

function getNeighbors(r, c) {
  const neighbors = [];
  const dirs = (r % 2 === 0) 
    ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]] 
    : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
  
  for (const [dr, dc] of dirs) {
    const nr = r + dr; const nc = c + dc;
    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) neighbors.push({ r: nr, c: nc });
  }
  return neighbors;
}

// فحص وجود مسار متصل للاعب معين (رأسي أو أفقي)
function checkWinningPath(grid, player, direction) {
  const playerTiles = grid.filter(t => t.owner === player);
  if (playerTiles.length === 0) return false;

  const tileMap = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
  playerTiles.forEach(t => { tileMap[t.r][t.c] = true; });

  const queue = [];
  const visited = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));

  if (direction === 'VERT') {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (tileMap[0][c]) { queue.push({ r: 0, c: c }); visited[0][c] = true; }
    }
    while (queue.length > 0) {
      const curr = queue.shift();
      if (curr.r === GRID_SIZE - 1) return true;
      for (const n of getNeighbors(curr.r, curr.c)) {
        if (tileMap[n.r][n.c] && !visited[n.r][n.c]) { visited[n.r][n.c] = true; queue.push(n); }
      }
    }
  } else {
    for (let r = 0; r < GRID_SIZE; r++) {
      if (tileMap[r][0]) { queue.push({ r: r, c: 0 }); visited[r][0] = true; }
    }
    while (queue.length > 0) {
      const curr = queue.shift();
      if (curr.c === GRID_SIZE - 1) return true;
      for (const n of getNeighbors(curr.r, curr.c)) {
        if (tileMap[n.r][n.c] && !visited[n.r][n.c]) { visited[n.r][n.c] = true; queue.push(n); }
      }
    }
  }
  return false;
}

// دالة خاصة بالنمط الفردي: تفحص هل ما زال بإمكان اللاعب الأخضر الوصول من الأعلى للأسفل؟
// إذا كانت كل المسارات مغلقة بسبب اللون الأسود، تعود بـ true (أي تعذر إكمال المسار)
function checkIsPathBlockedCompletely(grid) {
  const tileMap = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
  // الخلايا المملوكة للمنافس (الأسود) نعتبرها مغلقة تماماً (false)
  grid.forEach(t => {
    if (t.owner === 'P2' || t.owner === 'BLACK') {
      tileMap[t.r][t.c] = false;
    }
  });

  const queue = [];
  const visited = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));

  for (let c = 0; c < GRID_SIZE; c++) {
    if (tileMap[0][c]) {
      queue.push({ r: 0, c: c });
      visited[0][c] = true;
    }
  }

  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr.r === GRID_SIZE - 1) return false; // ما زال هناك أمل ويوجد مسار مفتوح للأسفل

    for (const n of getNeighbors(curr.r, curr.c)) {
      if (tileMap[n.r][n.c] && !visited[n.r][n.c]) {
        visited[n.r][n.c] = true;
        queue.push(n);
      }
    }
  }
  return true; // تعذر الوصول تماماً، اللوحة انقطعت!
}

export default function App() {
  const [view, setView] = useState('START'); 
  const [gameMode, setGameMode] = useState('SOLO'); // 'SOLO' أو 'MULTI'
  const [pNames, setPNames] = useState({ p1: '', p2: '' });
  const [matchRounds, setMatchRounds] = useState(3);
  const [currentRound, setCurrentRound] = useState(1);
  const [scores, setScores] = useState({ P1: 0, P2: 0 });
  const [grid, setGrid] = useState([]);
  const [turn, setTurn] = useState('P1');
  const [activeQ, setActiveQ] = useState(null);
  const [roundWinner, setRoundWinner] = useState(null);
  const [isSaving, setIsSaving] = useState(false); 
  
  const [usedQuestionIds, setUsedQuestionIds] = useState(() => {
    const saved = localStorage.getItem('mq_used_questions');
    return saved ? JSON.parse(saved) : [];
  });

  const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

  const roundConfig = useMemo(() => {
    if (gameMode === 'SOLO') {
      return {
        P1: { dir: 'VERT', color: '#10b981', label: 'مسار رأسي (أخضر)' },
        P2: { dir: 'HORIZ', color: '#000000', label: 'عائق اللوحة (أسود)' },
        bg: { vSide: '#10b981', hSide: '#1e293b' }
      };
    }
    const isP1Vertical = currentRound % 2 !== 0;
    return {
      P1: { dir: isP1Vertical ? 'VERT' : 'HORIZ', color: '#10b981', label: isP1Vertical ? 'رأسي (أخضر)' : 'أفقي (أخضر)' },
      P2: { dir: isP1Vertical ? 'HORIZ' : 'VERT', color: '#ef4444', label: isP1Vertical ? 'أفقي (أحمر)' : 'رأسي (أحمر)' },
      bg: { vSide: isP1Vertical ? '#10b981' : '#ef4444', hSide: isP1Vertical ? '#ef4444' : '#10b981' }
    };
  }, [currentRound, gameMode]);

  const isFormValid = useMemo(() => {
    if (gameMode === 'SOLO') return pNames.p1.trim().length > 0;
    return pNames.p1.trim().length > 0 && pNames.p2.trim().length > 0;
  }, [pNames, gameMode]);

  const uploadScoresToSupabase = async (finalScores) => {
    setIsSaving(true);
    try {
      const rowsToInsert = [
        { 
          student_name: pNames.p1.trim(), 
          section_number: 1, 
          score_achieved: finalScores.P1, 
          is_winner: gameMode === 'SOLO' ? finalScores.P1 >= Math.ceil(matchRounds / 2) : finalScores.P1 > finalScores.P2,
          subject_id: SUBJECT_ID 
        }
      ];

      if (gameMode === 'MULTI') {
        rowsToInsert.push({ 
          student_name: pNames.p2.trim(), 
          section_number: 1, 
          score_achieved: finalScores.P2, 
          is_winner: finalScores.P2 > finalScores.P1,
          subject_id: SUBJECT_ID 
        });
      }

      const { error } = await supabase.from('students_scores').insert(rowsToInsert);
      if (error) throw error;
    } catch (err) {
      console.error("Supabase Database Error:", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const initRound = () => {
    const newGrid = [];
    const topicsList = shuffle([...TOPICS, ...TOPICS, ...TOPICS, ...TOPICS, ...TOPICS, ...TOPICS, ...TOPICS]); 
    let idx = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        newGrid.push({ id: `${r}-${c}`, r, c, label: topicsList[idx++], owner: null });
      }
    }
    setGrid(newGrid);
    setTurn('P1');
    setRoundWinner(null);
  };

  const handleStartGame = () => {
    setScores({ P1: 0, P2: 0 });
    setCurrentRound(1);
    initRound();
    setView('GAME');
  };

  const handleTileClick = (tile) => {
    if (tile.owner || roundWinner) return; 
    
    let possibleQs = MATHEMATICS_DATABASE.filter(q => q.topic === tile.label);
    let freshQs = possibleQs.filter(q => !usedQuestionIds.includes(q.id));
    
    if (freshQs.length === 0) {
      const remainingIds = usedQuestionIds.filter(id => !possibleQs.some(q => q.id === id));
      setUsedQuestionIds(remainingIds);
      localStorage.setItem('mq_used_questions', JSON.stringify(remainingIds));
      freshQs = possibleQs; 
    }

    const selectedQ = freshQs.length > 0 
        ? freshQs[Math.floor(Math.random() * freshQs.length)] 
        : { id: `backup_${Date.now()}`, topic: tile.label, q: `سؤال احتياطي في ${tile.label}`, a: ["1", "2", "3", "4"] };

    if (!selectedQ.id.startsWith('backup_')) {
      const updatedIds = [...usedQuestionIds, selectedQ.id];
      setUsedQuestionIds(updatedIds);
      localStorage.setItem('mq_used_questions', JSON.stringify(updatedIds));
    }

    setActiveQ({ tile, q: selectedQ.q, opts: shuffle([...selectedQ.a]), ans: selectedQ.a[0] });
  };

  const checkGameStatus = (updatedGrid, dynamicTurn) => {
    if (gameMode === 'SOLO') {
      // 1. فحص فوز اللاعب الفردي باكتمال مساره الرأسي
      const isPlayerWin = checkWinningPath(updatedGrid, 'P1', 'VERT');
      if (isPlayerWin) {
        const newScores = { ...scores, P1: scores.P1 + 1 };
        setScores(newScores);
        setRoundWinner('P1');
        handleRoundTransition(newScores);
        return;
      }

      // 2. فحص خسارة اللاعب الفردي بتعذر إكمال المسار بسبب الحواجز السوداء
      const isBlocked = checkIsPathBlockedCompletely(updatedGrid);
      if (isBlocked) {
        const newScores = { ...scores, P2: scores.P2 + 1 }; // تحتسب جولة فوز للأسود
        setScores(newScores);
        setRoundWinner('BLACK');
        handleRoundTransition(newScores);
        return;
      }
      
      // في النمط الفردي، الدور دائماً يرجع لـ P1 حتى لو أخطأ
      setTurn('P1');

    } else {
      // منطق نمط المتسابقين المشترك التقليدي
      const currentDirection = roundConfig[dynamicTurn].dir;
      const isWin = checkWinningPath(updatedGrid, dynamicTurn, currentDirection);

      if (isWin) {
        const newScores = { ...scores, [dynamicTurn]: scores[turn] + 1 };
        setScores(newScores);
        setRoundWinner(dynamicTurn);
        handleRoundTransition(newScores);
      } else {
        setTurn(dynamicTurn === 'P1' ? 'P2' : 'P1');
      }
    }
  };

  const handleRoundTransition = (currentScores) => {
    const winThreshold = Math.ceil(matchRounds / 2);
    if (currentScores.P1 >= winThreshold || currentScores.P2 >= winThreshold) {
      uploadScoresToSupabase(currentScores); 
      setTimeout(() => setView('MATCH_OVER'), 1500);
    } else {
      setTimeout(() => { setCurrentRound(prev => prev + 1); }, 1500);
    }
  };

  useEffect(() => {
    if (view === 'GAME' && currentRound > 1) initRound();
  }, [currentRound]);

  const submitAnswer = (opt) => {
    const newGrid = [...grid];
    const idx = newGrid.findIndex(t => t.id === activeQ.tile.id);
    
    if (opt === activeQ.ans) {
      newGrid[idx].owner = 'P1';
      setGrid(newGrid);
      setActiveQ(null);
      checkGameStatus(newGrid, 'P1');
    } else {
      // إذا أخطأ: تلون أسود في النمط الفردي، أو تذهب للمتسابق الثاني في النمط الزوجي
      if (gameMode === 'SOLO') {
        newGrid[idx].owner = 'BLACK';
        setGrid(newGrid);
        setActiveQ(null);
        checkGameStatus(newGrid, 'P1');
      } else {
        setActiveQ(null);
        checkGameStatus(newGrid, 'P1'); // يغير الدور لـ P2 داخل الدالة
      }
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#020617] overflow-hidden" dir="rtl">
      <style>{CSS_STYLES}</style>

      {view === 'START' && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 w-full h-full relative overflow-y-auto">
          
          <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-20">
            <span className="bg-slate-900/60 px-6 py-3 rounded-2xl border border-blue-500/20 backdrop-blur-md text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-blue-300 drop-shadow-[0_0_12px_rgba(59,130,246,0.3)]">
              ثانوية رضوى
            </span>
            <span className="bg-slate-900/60 px-6 py-3 rounded-2xl border border-blue-500/20 backdrop-blur-md text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-blue-300 drop-shadow-[0_0_12px_rgba(59,130,246,0.3)]">
              أ/ محمد القرني
            </span>
          </div>

          <div className="text-center space-y-4 mb-6 z-10 pt-20">
            <h1 className="text-[clamp(2.5rem,8vw,5rem)] leading-none classic-title font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-200 to-blue-500 drop-shadow-2xl">
              مسابقة الرياضيات
            </h1>
            <p className="text-blue-300 font-bold text-[clamp(1.2rem,3vw,1.8rem)] m-0">الصف الثاني الثانوي</p>
            <p className="text-white/60 text-sm md:text-base font-medium bg-slate-900/30 px-4 py-1 rounded-full inline-block border border-white/5">الفصل الدراسي الثاني</p>
          </div>
          
          <div className="glass-box p-8 rounded-[2rem] w-full max-w-xl flex flex-col gap-6 z-10 shadow-2xl">
            
            {/* اختيار نمط اللعب */}
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setGameMode('SOLO')} className={`p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 border-2 transition-all ${gameMode === 'SOLO' ? 'bg-blue-600/30 border-blue-500 shadow-md scale-105' : 'bg-slate-800/40 border-transparent'}`}>
                <User size={24} /> متسابق واحد
              </button>
              <button type="button" onClick={() => setGameMode('MULTI')} className={`p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 border-2 transition-all ${gameMode === 'MULTI' ? 'bg-blue-600/30 border-blue-500 shadow-md scale-105' : 'bg-slate-800/40 border-transparent'}`}>
                <Users size={24} /> متسابقان
              </button>
            </div>

            {/* حقول الأسماء التفاعلية حسب النمط */}
            <div className="flex flex-col gap-4">
              {gameMode === 'SOLO' ? (
                <input type="text" placeholder="اكتب اسمك هنا" className="input-field" value={pNames.p1} onChange={e => setPNames({...pNames, p1: e.target.value})} />
              ) : (
                <>
                  <input type="text" placeholder="اسم المتسابق الأول" className="input-field" value={pNames.p1} onChange={e => setPNames({...pNames, p1: e.target.value})} />
                  <input type="text" placeholder="اسم المتسابق الثاني" className="input-field" value={pNames.p2} onChange={e => setPNames({...pNames, p2: e.target.value})} />
                </>
              )}
            </div>
            
            <button onClick={() => setView('ROUNDS')} disabled={!isFormValid} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-[1rem] font-black text-xl active:scale-95 transition-all shadow-lg disabled:opacity-40 flex items-center justify-center gap-2">
              التالي <ChevronRight className="rotate-180" />
            </button>
          </div>
        </div>
      )}

      {view === 'ROUNDS' && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 w-full h-full animate-in fade-in">
          <Trophy size={100} className="text-yellow-500 mb-6 drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]" />
          <h2 className="text-3xl font-black text-white classic-title mb-10 text-center">اختر طول المسابقة</h2>
          <div className="grid grid-cols-3 gap-4 w-full max-w-lg mb-10">
            {[1, 3, 5].map(num => (
              <button key={num} onClick={() => setMatchRounds(num)} className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all ${matchRounds === num ? 'border-blue-500 bg-blue-900/40 shadow-[0_0_25px_rgba(59,130,246,0.4)] scale-105' : 'border-white/10 bg-slate-800/50'}`}>
                <span className="text-4xl font-black text-white mb-2">{num}</span>
                <span className="text-slate-400 font-bold text-sm">جولات</span>
              </button>
            ))}
          </div>
          <button onClick={handleStartGame} className="w-full max-w-lg bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-black text-2xl active:scale-95 transition-all shadow-xl">
            بدء التحدي الآن
          </button>
        </div>
      )}

      {view === 'GAME' && (
        <div className="flex-1 flex flex-col w-full h-full overflow-hidden relative">
          <header className="h-[80px] shrink-0 p-2 md:px-6 glass-box flex justify-between items-center z-20 border-b border-white/10">
            <div className={`flex-1 h-full max-w-[200px] px-2 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${turn === 'P1' && !roundWinner ? 'bg-emerald-500/30 border-emerald-500 scale-105' : 'opacity-40 border-transparent'}`}>
              <span className="text-[10px] md:text-sm font-black opacity-80">{roundConfig.P1.label} (فوز: {scores.P1})</span>
              <div className="text-sm md:text-base font-black truncate w-full text-center">{pNames.p1}</div>
            </div>
            <div className="shrink-0 px-2 text-center flex flex-col items-center">
               <div className="classic-title text-xl md:text-3xl whitespace-nowrap text-blue-400 leading-none">الجولة {currentRound}</div>
               <span className="text-[10px] md:text-xs text-slate-400 font-bold">من {matchRounds} جولات</span>
            </div>
            <div className={`flex-1 h-full max-w-[200px] px-2 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${turn === 'P2' && !roundWinner ? 'bg-slate-900/80 border-slate-700 scale-105' : 'opacity-40 border-transparent'}`}>
              <span className="text-[10px] md:text-sm font-black opacity-80">{roundConfig.P2.label} (فوز: {scores.P2})</span>
              <div className="text-sm md:text-base font-black truncate w-full text-center">{gameMode === 'SOLO' ? 'عائق اللوحة' : pNames.p2}</div>
            </div>
          </header>

          <main className="flex-1 relative w-full h-full bg-[#010409]">
             {roundWinner && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
                   <div className="text-center p-8 bg-slate-900/90 border border-white/20 rounded-3xl shadow-2xl max-w-md">
                      <Trophy className="mx-auto text-yellow-500 mb-4" size={64} />
                      <h2 className="text-3xl font-black text-white mb-2">نهاية الجولة!</h2>
                      <p className="text-xl text-slate-300">
                        الفائز: <span className="font-extrabold text-blue-400">{roundWinner === 'P1' ? pNames.p1 : (gameMode === 'SOLO' ? 'عائق اللوحة الاسود' : pNames.p2)}</span>
                      </p>
                   </div>
                </div>
             )}

             <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
                 <svg viewBox={`${-THICKNESS_X} ${-THICKNESS_Y} ${VB_WIDTH + (THICKNESS_X * 2)} ${VB_HEIGHT + (THICKNESS_Y * 2)}`} className="w-full h-full drop-shadow-2xl" style={{ maxHeight: '100%', maxWidth: '100%' }} preserveAspectRatio="xMidYMid meet">
                      <defs>
                          <clipPath id="refined-rounded-frame"><rect x={-THICKNESS_X} y={-THICKNESS_Y} width={VB_WIDTH + (THICKNESS_X * 2)} height={VB_HEIGHT + (THICKNESS_Y * 2)} rx="40" /></clipPath>
                      </defs>
                      <g className="opacity-80 pointer-events-none" clipPath="url(#refined-rounded-frame)">
                          <rect x={-THICKNESS_X} y={-THICKNESS_Y} width={THICKNESS_X + (HEX_WIDTH/1.5)} height={VB_HEIGHT + (THICKNESS_Y*2)} fill={roundConfig.bg.hSide} />
                          <rect x={VB_WIDTH - (HEX_WIDTH/1.5)} y={-THICKNESS_Y} width={THICKNESS_X + (HEX_WIDTH/1.5)} height={VB_HEIGHT + (THICKNESS_Y*2)} fill={roundConfig.bg.hSide} />
                          <rect x={-THICKNESS_X} y={-THICKNESS_Y} width={VB_WIDTH + (THICKNESS_X*2)} height={THICKNESS_Y + (HEX_HEIGHT*0.25)} fill={roundConfig.bg.vSide} />
                          <rect x={-THICKNESS_X} y={VB_HEIGHT - (HEX_HEIGHT*0.25)} width={VB_WIDTH + (THICKNESS_X*2)} height={THICKNESS_Y + (HEX_HEIGHT*0.35)} fill={roundConfig.bg.vSide} />
                      </g>
                      <g>
                      {grid.map(c => {
                          const xOff = (c.r % 2 === 0) ? 0 : (HEX_WIDTH / 2);
                          const cx = (c.c * HEX_WIDTH) + xOff + (HEX_WIDTH / 2);
                          const cy = (c.r * VERT_DIST) + (HEX_HEIGHT / 2);
                          
                          // تحديد لون الخلية بناءً على المالك
                          let hexColor = "#1e293b";
                          if (c.owner === 'P1') hexColor = "#10b981";
                          else if (c.owner === 'P2') hexColor = "#ef4444";
                          else if (c.owner === 'BLACK') hexColor = "#000000"; // تلوين الخلية بالأسود عند الخطأ في الفردي

                          return (
                          <g key={c.id}>
                              <polygon className="cursor-pointer hover:brightness-125 transition-all" onClick={() => handleTileClick(c)} points={Array.from({length: 6}).map((_, i) => `${cx + (HEX_RADIUS * Math.cos((Math.PI/180)*(60*i-30)) * HEX_X_STRETCH)},${cy + HEX_RADIUS * Math.sin((Math.PI/180)*(60*i-30))}`).join(' ')} fill={hexColor} stroke="#475569" strokeWidth="5" />
                              {!c.owner && <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="hex-text">{c.label}</text>}
                          </g>
                          );
                      })}
                      </g>
                  </svg>
             </div>
          </main>
        </div>
      )}

      {view === 'MATCH_OVER' && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 w-full h-full text-center space-y-6">
          <Award size={120} className="text-yellow-400 drop-shadow-[0_0_30px_rgba(234,179,8,0.6)]" />
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 classic-title">انتهاء المسابقة الكاملة!</h1>
          <p className="text-2xl font-bold">الفائز النهائي بالتحدي:</p>
          <div className="text-4xl font-black bg-blue-600/30 border border-blue-500/50 px-12 py-4 rounded-2xl shadow-lg">
             {scores.P1 > scores.P2 ? pNames.p1 : (gameMode === 'SOLO' ? 'عائق اللوحة' : pNames.p2)}
          </div>
          {isSaving && <p className="text-sm text-blue-400 animate-pulse">جاري رصد النتائج في قاعدة البيانات...</p>}
          <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-lg font-bold flex items-center gap-2 transition active:scale-95 border border-white/10">
             <RotateCcw size={18}/> العودة للرئيسية
          </button>
        </div>
      )}

      {activeQ && (
        <div className="fixed inset-0 z-[100] w-screen h-screen bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="glass-box border-2 flex flex-col w-full max-w-4xl rounded-[2rem] p-6 md:p-12 text-center space-y-8" style={{ borderColor: '#3b82f6' }}>
            <div className="inline-block px-10 py-3 rounded-full font-black text-2xl shadow-lg self-center bg-blue-600">{activeQ.tile.label}</div>
            <h3 className="text-[clamp(1.3rem,3.5vh,2.8rem)] leading-tight font-black text-white" dangerouslySetInnerHTML={{ __html: activeQ.q }} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pt-4">
              {activeQ.opts.map((o, i) => (
                <button key={i} onClick={() => submitAnswer(o)} className="w-full bg-slate-800 text-white p-6 rounded-2xl border-2 border-white/5 hover:bg-blue-700 transition-all text-xl md:text-2xl font-bold active:scale-95 flex items-center justify-center min-h-[90px]" dangerouslySetInnerHTML={{ __html: o }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}