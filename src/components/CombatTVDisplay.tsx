import { useState, useEffect } from 'react';
import { Match, GlobalSettings } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Play, Pause, RotateCcw, ArrowLeft, Volume2, ShieldAlert, CheckCircle2, UserCheck, Plus, Minus } from 'lucide-react';
import { CONSENSUS_WINDOW_MS } from '../utils/combatConsensus';

interface CombatTVDisplayProps {
  match: Match;
  settings: GlobalSettings | null;
  onBack?: () => void;
}

export default function CombatTVDisplay({ match, settings, onBack }: CombatTVDisplayProps) {
  const [now, setNow] = useState(Date.now());
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Sync tick for visual expiration of judge click animations
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 150);
    return () => clearInterval(timer);
  }, []);

  // Timer countdown local calculation if running
  const timeRemaining = match.timeRemaining ?? 120;
  const isTimerRunning = !!match.isTimerRunning;

  // Active votes in the last CONSENSUS_WINDOW_MS
  const activeVotes = (match.activeVotes || []).filter(v => now - v.timestamp < CONSENSUS_WINDOW_MS);

  // Defined 3 standard judges slots
  const judgesSlots = [
    { id: 'judge_1', label: 'GIÁM ĐỊNH 1' },
    { id: 'judge_2', label: 'GIÁM ĐỊNH 2' },
    { id: 'judge_3', label: 'GIÁM ĐỊNH 3' }
  ];

  // Helper to toggle timer
  const toggleTimer = async () => {
    await updateDoc(doc(db, 'matches', match.id), {
      isTimerRunning: !isTimerRunning,
      timerLastUpdated: Date.now()
    });
  };

  // Helper to reset timer
  const resetTimer = async (seconds = 120) => {
    await updateDoc(doc(db, 'matches', match.id), {
      timeRemaining: seconds,
      isTimerRunning: false,
      timerLastUpdated: Date.now()
    });
  };

  // Adjust scores manually
  const adjustScore = async (corner: 'red' | 'blue', delta: number) => {
    const field = corner === 'red' ? 'redScore' : 'blueScore';
    const currentVal = corner === 'red' ? (match.redScore || 0) : (match.blueScore || 0);
    const newVal = Math.max(0, currentVal + delta);
    await updateDoc(doc(db, 'matches', match.id), {
      [field]: newVal
    });
  };

  // Adjust penalty
  const adjustPenalty = async (corner: 'red' | 'blue', delta: number) => {
    const field = corner === 'red' ? 'redPenalties' : 'bluePenalties';
    const currentVal = corner === 'red' ? (match.redPenalties || 0) : (match.bluePenalties || 0);
    const newVal = Math.max(0, currentVal + delta);
    await updateDoc(doc(db, 'matches', match.id), {
      [field]: newVal
    });
  };

  // Change round
  const setRound = async (roundNum: number) => {
    await updateDoc(doc(db, 'matches', match.id), {
      round: roundNum
    });
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Header Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-3 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg font-black text-xs tracking-wider uppercase">
              MÀN HÌNH 2: TV KỸ THUẬT & THƯ KÝ
            </span>
            <span className="text-slate-400 text-sm font-semibold">
              Hệ thống Giám định Điện tử Vovinam (Consensus 2/3)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Round Selector */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
            {[1, 2, 3].map(r => (
              <button
                key={r}
                onClick={() => setRound(r)}
                className={`px-3 py-1.5 rounded-lg transition-all ${ (match.round || 1) === r ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white' }`}
              >
                Hiệp {r}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-xl border transition-all ${audioEnabled ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
            title="Âm thanh hiệu ứng đòn đánh"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Scoreboard Dashboard */}
      <div className="flex-1 p-6 grid grid-cols-12 gap-6 max-w-[1920px] mx-auto w-full">
        {/* Left Column: Red Fighter & Score (Col 4) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col bg-gradient-to-b from-red-950/40 via-slate-900/80 to-slate-900/90 border-2 border-red-600/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-red-600" />
          
          <div className="flex items-center justify-between mb-4">
            <span className="px-4 py-1.5 bg-red-600 text-white font-black text-sm uppercase tracking-widest rounded-full shadow-lg shadow-red-600/30">
              GÓC ĐỎ / RED
            </span>
            <span className="text-red-400 text-xs font-bold tracking-wider">
              {match.redCorner.unit || match.weightClass || 'HẠNG CÂN ĐỐI KHÁNG'}
            </span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <img 
              src={match.redCorner.photoUrl} 
              alt={match.redCorner.name} 
              className="w-20 h-20 rounded-2xl object-cover border-2 border-red-500 shadow-md"
            />
            <div>
              <h2 className="font-montserrat text-3xl font-black text-white tracking-tight uppercase line-clamp-1">{match.redCorner.name}</h2>
              <p className="font-inter text-sm text-red-300 font-semibold">{match.redCorner.unit || 'Võ sinh Đỏ'}</p>
            </div>
          </div>

          {/* Huge Score Box */}
          <div className="flex-1 flex flex-col items-center justify-center bg-black/50 border border-red-500/30 rounded-3xl p-6 relative my-2">
            <span className="text-xs text-red-400 font-bold uppercase tracking-widest mb-1">ĐIỂM SỐ ĐỒNG THUẬN CHÍNH THỨC</span>
            <div className="text-8xl lg:text-9xl font-black text-red-500 font-mono tracking-tighter drop-shadow-[0_0_35px_rgba(239,68,68,0.5)]">
              {match.redScore || 0}
            </div>

            {/* Penalties Badge */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Phạt lỗi (Cấm):</span>
              <span className="px-3 py-1 bg-red-950 border border-red-600 text-red-400 font-black text-sm rounded-lg">
                {match.redPenalties || 0}
              </span>
            </div>
          </div>

          {/* Manual Control Steppers for Referees */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-xl border border-slate-700">
              <span className="text-xs font-bold text-slate-300 ml-2">Điểm:</span>
              <div className="flex items-center gap-1">
                <button onClick={() => adjustScore('red', -1)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-red-400 font-bold">
                  <Minus className="w-4 h-4" />
                </button>
                <button onClick={() => adjustScore('red', 1)} className="p-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-bold">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-xl border border-slate-700">
              <span className="text-xs font-bold text-slate-300 ml-2">Phạt (-1):</span>
              <div className="flex items-center gap-1">
                <button onClick={() => adjustPenalty('red', -1)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400">
                  <Minus className="w-4 h-4" />
                </button>
                <button onClick={() => adjustPenalty('red', 1)} className="p-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white font-bold">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Timer, Match State & 3-Judge Consensus Live Monitor (Col 4) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Match Round & Clock */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Swords className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 font-black text-base uppercase tracking-widest">
                HIỆP {match.round || 1} / ROUND {match.round || 1}
              </span>
            </div>

            {/* Big Timer */}
            <div className="text-6xl lg:text-7xl font-mono font-black text-white tracking-tight my-2">
              {formatTime(timeRemaining)}
            </div>

            {/* Timer Buttons */}
            <div className="flex items-center gap-3 mt-4 w-full">
              <button 
                onClick={toggleTimer}
                className={`flex-1 py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg ${isTimerRunning ? 'bg-amber-600 hover:bg-amber-500 text-black shadow-amber-600/20' : 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/20'}`}
              >
                {isTimerRunning ? <><Pause className="w-5 h-5" /> Tạm dừng</> : <><Play className="w-5 h-5" /> Bắt đầu</>}
              </button>

              <button 
                onClick={() => resetTimer(120)}
                className="p-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl text-slate-300 transition-all"
                title="Đặt lại 02:00"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 3-JUDGE LIVE CONSENSUS MONITOR */}
          <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-400" />
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-200">
                  THEO DÕI 3 GIÁM ĐỊNH TRỰC TIẾP
                </h3>
              </div>
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Đồng thuận ≥ 2/3
              </span>
            </div>

            {/* 3 Judge Indicators */}
            <div className="space-y-3 flex-1 flex flex-col justify-around">
              {judgesSlots.map(slot => {
                // Find if this judge has an active vote within 1.8s
                const vote = activeVotes.find(v => v.judgeId === slot.id || v.judgeName.includes(slot.label));
                const isRed = vote?.corner === 'red';
                const isBlue = vote?.corner === 'blue';

                return (
                  <div 
                    key={slot.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                      vote 
                        ? isRed 
                          ? 'bg-red-950/60 border-red-500 shadow-lg shadow-red-600/30 scale-[1.02]' 
                          : 'bg-blue-950/60 border-blue-500 shadow-lg shadow-blue-600/30 scale-[1.02]'
                        : 'bg-slate-800/40 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                        vote 
                          ? isRed ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">{slot.label}</p>
                        <p className="text-[11px] text-slate-400">
                          {vote ? `Đã bấm: ${isRed ? 'Góc ĐỎ' : 'Góc XANH'} (+${vote.points}đ)` : 'Chờ quan sát...'}
                        </p>
                      </div>
                    </div>

                    {/* Active Vote Badge with Pulsing Animation */}
                    <div>
                      {vote ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs uppercase animate-pulse ${
                          isRed ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                        }`}>
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                          +{vote.points} ĐIỂM {isRed ? 'ĐỎ' : 'XANH'}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium px-2 py-1 bg-slate-800 rounded-lg">
                          Sẵn sàng
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanation Note */}
            <div className="mt-4 p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl text-[11px] text-blue-300 leading-relaxed">
              <span className="font-bold">Quy tắc 2/3:</span> Khi ít nhất 2 Giám định cùng bấm cho 1 võ sĩ trong 1.8 giây, điểm sẽ tự động được cộng chính thức vào bảng điểm.
            </div>
          </div>
        </div>

        {/* Right Column: Blue Fighter & Score (Col 4) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col bg-gradient-to-b from-blue-950/40 via-slate-900/80 to-slate-900/90 border-2 border-blue-600/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-blue-600" />
          
          <div className="flex items-center justify-between mb-4">
            <span className="px-4 py-1.5 bg-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-full shadow-lg shadow-blue-600/30">
              GÓC XANH / BLUE
            </span>
            <span className="text-blue-400 text-xs font-bold tracking-wider">
              {match.blueCorner.unit || match.weightClass || 'HẠNG CÂN ĐỐI KHÁNG'}
            </span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <img 
              src={match.blueCorner.photoUrl} 
              alt={match.blueCorner.name} 
              className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
            />
            <div>
              <h2 className="font-montserrat text-3xl font-black text-white tracking-tight uppercase line-clamp-1">{match.blueCorner.name}</h2>
              <p className="font-inter text-sm text-blue-300 font-semibold">{match.blueCorner.unit || 'Võ sinh Xanh'}</p>
            </div>
          </div>

          {/* Huge Score Box */}
          <div className="flex-1 flex flex-col items-center justify-center bg-black/50 border border-blue-500/30 rounded-3xl p-6 relative my-2">
            <span className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-1">ĐIỂM SỐ ĐỒNG THUẬN CHÍNH THỨC</span>
            <div className="text-8xl lg:text-9xl font-black text-blue-500 font-mono tracking-tighter drop-shadow-[0_0_35px_rgba(59,130,246,0.5)]">
              {match.blueScore || 0}
            </div>

            {/* Penalties Badge */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Phạt lỗi (Cấm):</span>
              <span className="px-3 py-1 bg-blue-950 border border-blue-600 text-blue-400 font-black text-sm rounded-lg">
                {match.bluePenalties || 0}
              </span>
            </div>
          </div>

          {/* Manual Control Steppers for Referees */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-xl border border-slate-700">
              <span className="text-xs font-bold text-slate-300 ml-2">Điểm:</span>
              <div className="flex items-center gap-1">
                <button onClick={() => adjustScore('blue', -1)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-blue-400 font-bold">
                  <Minus className="w-4 h-4" />
                </button>
                <button onClick={() => adjustScore('blue', 1)} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-xl border border-slate-700">
              <span className="text-xs font-bold text-slate-300 ml-2">Phạt (-1):</span>
              <div className="flex items-center gap-1">
                <button onClick={() => adjustPenalty('blue', -1)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400">
                  <Minus className="w-4 h-4" />
                </button>
                <button onClick={() => adjustPenalty('blue', 1)} className="p-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white font-bold">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Confirmed Hit Log / Audit Trail */}
        <div className="col-span-12 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
                NHẬT KÝ ĐÒN ĐÁNH ĐƯỢC CÔNG NHẬN (CONFIRMED HITS AUDIT LOG)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Tổng số đòn ghi điểm: {(match.scoreLog || []).length}
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {(!match.scoreLog || match.scoreLog.length === 0) ? (
              <p className="text-xs text-slate-500 italic py-2">Chưa có đòn đánh nào được công nhận 2/3 giám định...</p>
            ) : (
              match.scoreLog.map(event => (
                <div 
                  key={event.id}
                  className={`px-4 py-2.5 rounded-2xl border text-xs font-semibold whitespace-nowrap flex items-center gap-2.5 ${
                    event.corner === 'red' 
                      ? 'bg-red-950/60 border-red-500/50 text-red-200' 
                      : 'bg-blue-950/60 border-blue-500/50 text-blue-200'
                  }`}
                >
                  <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${event.corner === 'red' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                    +{event.points}
                  </span>
                  <span>{event.description}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(event.timestamp).toLocaleTimeString('vi-VN', { minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
