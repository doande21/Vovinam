import { Match, GlobalSettings } from '../types';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Flame, Crown, RotateCcw, Sparkles } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface CombatLEDDisplayProps {
  match: Match;
  settings: GlobalSettings | null;
  onBack?: () => void;
}

export default function CombatLEDDisplay({ match, settings, onBack }: CombatLEDDisplayProps) {
  const timeRemaining = match.timeRemaining ?? 120;
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleChooseWinner = async (corner: 'red' | 'blue') => {
    try {
      await updateDoc(doc(db, 'matches', match.id), {
        winner: corner,
        status: 'completed',
        victoryMethod: match.victoryMethod || 'THẮNG TRẬN (WINNER)',
        weightClass: match.weightClass || 'HẠNG CÂN 55KG'
      });
      await updateDoc(doc(db, 'settings', 'global'), {
        showWinnerAnimation: true
      });
    } catch (err) {
      console.error('Error selecting winner:', err);
    }
  };

  const handleResetWinner = async () => {
    try {
      await updateDoc(doc(db, 'matches', match.id), {
        winner: null,
        status: 'pending'
      });
      await updateDoc(doc(db, 'settings', 'global'), {
        showWinnerAnimation: false
      });
    } catch (err) {
      console.error('Error resetting winner:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative font-sans select-none flex flex-col justify-between">
      {/* Background Glow & Lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-red-950/40 via-red-900/10 to-transparent" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-950/40 via-blue-900/10 to-transparent" />
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/10 blur-[150px] rounded-full" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-30 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl transition-all border border-white/10"
              title="Quay lại"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <span className="font-bebas px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-normal text-base md:text-lg uppercase tracking-[0.15em] rounded-full shadow-lg shadow-amber-500/20">
              VOVINAM - ĐỐI KHÁNG
            </span>
            <span className="font-bebas text-slate-300 font-normal text-base tracking-widest uppercase hidden sm:inline">
              {match.weightClass || 'HẠNG CÂN 55KG'}
            </span>
          </div>
        </div>

        {/* Center Match Round & Timer Clock */}
        <div className="flex items-center gap-6 bg-black/60 border border-white/15 px-6 py-2 rounded-2xl backdrop-blur-md shadow-2xl">
          <div className="text-center font-inter">
            <span className="text-[10px] text-amber-400 font-black tracking-widest uppercase block">HIỆP ĐẤU</span>
            <span className="font-bebas text-2xl font-normal text-white tracking-wider">ROUND {match.round || 1}</span>
          </div>
          <div className="h-8 w-[1px] bg-white/20" />
          <div className="text-center font-inter">
            <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase block">THỜI GIAN</span>
            <span className="text-2xl font-black font-mono text-amber-300">{formatTime(timeRemaining)}</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <span className="font-montserrat text-xs text-slate-400 font-bold tracking-widest uppercase">
            {settings?.eventTitle || 'VÕ VIỆT TRANH HÙNG 2026'}
          </span>
        </div>
      </header>

      {/* Main Face-Off Arena */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row h-full">
        {/* RED CORNER FIGHTER (BẤM VÀO ĐÂY ĐỂ CHỌN THẮNG) */}
        <div 
          onClick={() => handleChooseWinner('red')}
          className="relative flex-1 flex flex-col justify-end p-8 lg:p-12 overflow-hidden group cursor-pointer transition-all duration-300 hover:ring-4 hover:ring-red-500/50"
          title="Bấm vào hình võ sĩ ĐỎ để công bố THẮNG CUỘC"
        >
          {/* Background Fighter Photo */}
          <div className="absolute inset-0 z-0">
            <img 
              src={match.redCorner.photoUrl} 
              alt={match.redCorner.name} 
              className="w-full h-full object-cover object-top filter contrast-110 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-red-950/30 mix-blend-multiply group-hover:bg-red-950/10 transition-colors" />
          </div>

          {/* Quick Winner Trigger Button on Hover / Mobile */}
          <div className="absolute top-6 left-6 z-30 opacity-80 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 bg-red-600/90 hover:bg-red-500 text-white px-4 py-2 rounded-xl backdrop-blur-md shadow-xl border border-red-400/40 text-xs font-inter font-black uppercase tracking-wider">
              <Crown className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>BẤM CHỌN THẮNG GÓC ĐỎ</span>
            </div>
          </div>

          {/* Red Corner Info */}
          <div className="relative z-20 flex flex-col gap-2">
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3 font-inter"
            >
              <span className="px-5 py-2 bg-red-600 text-white font-black text-sm md:text-base uppercase tracking-[0.25em] rounded-xl shadow-xl shadow-red-600/40">
                GÓC ĐỎ / RED
              </span>
              {match.redCorner.unit && (
                <span className="text-red-400 text-xs md:text-sm font-bold uppercase tracking-wider bg-black/60 px-3 py-1.5 rounded-lg border border-red-500/30">
                  {match.redCorner.unit}
                </span>
              )}
            </motion.div>

            {/* Fighter Name: MONTSERRAT */}
            <motion.h2 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-montserrat text-5xl md:text-7xl lg:text-8xl font-black uppercase text-white tracking-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)] group-hover:text-red-300 transition-colors"
            >
              {match.redCorner.name}
            </motion.h2>
          </div>
        </div>

        {/* Center VS Element */}
        <div className="relative z-30 flex items-center justify-center -my-6 md:my-0 md:-mx-10 pointer-events-none">
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-black/80 border-2 border-amber-500/60 backdrop-blur-xl flex flex-col items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.4)]">
            <span className="font-bebas text-4xl md:text-5xl font-normal text-amber-400 tracking-wider">VS</span>
          </div>
        </div>

        {/* BLUE CORNER FIGHTER (BẤM VÀO ĐÂY ĐỂ CHỌN THẮNG) */}
        <div 
          onClick={() => handleChooseWinner('blue')}
          className="relative flex-1 flex flex-col justify-end p-8 lg:p-12 overflow-hidden group text-right cursor-pointer transition-all duration-300 hover:ring-4 hover:ring-blue-500/50"
          title="Bấm vào hình võ sĩ XANH để công bố THẮNG CUỘC"
        >
          {/* Background Fighter Photo */}
          <div className="absolute inset-0 z-0">
            <img 
              src={match.blueCorner.photoUrl} 
              alt={match.blueCorner.name} 
              className="w-full h-full object-cover object-top filter contrast-110 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-blue-950/30 mix-blend-multiply group-hover:bg-blue-950/10 transition-colors" />
          </div>

          {/* Quick Winner Trigger Button on Hover / Mobile */}
          <div className="absolute top-6 right-6 z-30 opacity-80 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 bg-blue-600/90 hover:bg-blue-500 text-white px-4 py-2 rounded-xl backdrop-blur-md shadow-xl border border-blue-400/40 text-xs font-inter font-black uppercase tracking-wider">
              <span>BẤM CHỌN THẮNG GÓC XANH</span>
              <Crown className="w-4 h-4 text-amber-300 animate-pulse" />
            </div>
          </div>

          {/* Blue Corner Info */}
          <div className="relative z-20 flex flex-col items-end gap-2">
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3 font-inter"
            >
              {match.blueCorner.unit && (
                <span className="text-blue-400 text-xs md:text-sm font-bold uppercase tracking-wider bg-black/60 px-3 py-1.5 rounded-lg border border-blue-500/30">
                  {match.blueCorner.unit}
                </span>
              )}
              <span className="px-5 py-2 bg-blue-600 text-white font-black text-sm md:text-base uppercase tracking-[0.25em] rounded-xl shadow-xl shadow-blue-600/40">
                GÓC XANH / BLUE
              </span>
            </motion.div>

            {/* Fighter Name: MONTSERRAT */}
            <motion.h2 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-montserrat text-5xl md:text-7xl lg:text-8xl font-black uppercase text-white tracking-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)] group-hover:text-blue-300 transition-colors"
            >
              {match.blueCorner.name}
            </motion.h2>
          </div>
        </div>
      </div>

      {/* Winner Overlay if Match Completed & Winner Chosen */}
      {match.winner && settings?.showWinnerAnimation && (
        <WinnerOverlay 
          name={match.winner === 'red' ? match.redCorner.name : match.blueCorner.name}
          unit={match.winner === 'red' ? match.redCorner.unit : match.blueCorner.unit}
          photoUrl={match.winner === 'red' ? match.redCorner.celebrationPhotoUrl : match.blueCorner.celebrationPhotoUrl}
          weightClass={match.weightClass}
          victoryMethod={match.victoryMethod}
          corner={match.winner}
          onReset={handleResetWinner}
        />
      )}
    </div>
  );
}

function WinnerOverlay({ 
  name, 
  unit,
  photoUrl, 
  weightClass, 
  victoryMethod, 
  corner,
  onReset
}: { 
  name: string; 
  unit?: string;
  photoUrl: string; 
  weightClass?: string; 
  victoryMethod?: string; 
  corner: 'red' | 'blue';
  onReset?: () => void;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 bg-[#050505] flex flex-col overflow-hidden font-sans"
    >
      {/* Dynamic Background Glow */}
      <div className={`absolute inset-0 ${corner === 'red' ? 'bg-[radial-gradient(circle_at_50%_40%,_#7f1d1d_0%,_#050505_100%)]' : 'bg-[radial-gradient(circle_at_50%_40%,_#1e3a8a_0%,_#050505_100%)]'} opacity-70`} />

      {/* Top Bar */}
      <div className="w-full p-8 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Trophy className="w-7 h-7 text-black" />
          </div>
          <span className="font-bebas text-4xl font-normal text-white tracking-wider uppercase">VOVINAM CHAMPION</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md font-inter">
            <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="text-sm font-bold text-amber-400 uppercase tracking-widest">
              KẾT QUẢ CHÍNH THỨC
            </span>
          </div>

          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl border border-white/20 text-xs font-bold text-white transition-all backdrop-blur-md font-inter"
              title="Đổi lại kết quả / Quay lại màn hình trận đấu"
            >
              <RotateCcw className="w-4 h-4" /> Đổi kết quả / Đấu tiếp
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start pt-4 relative z-10">
        {/* Subtitle */}
        <motion.p 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="font-bebas text-amber-400 font-normal tracking-[0.2em] mb-1 text-3xl uppercase"
        >
          VÕ VIỆT TRANH HÙNG ĐOẠT CÓC VƯƠNG 2026
        </motion.p>

        {/* Main Title: BEBAS NEUE */}
        <motion.h1 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-bebas text-[14vw] font-normal text-white leading-none tracking-wide mb-2 drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
        >
          WINNER
        </motion.h1>

        {/* Winner Card Container */}
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', damping: 15 }}
          className="relative w-full max-w-6xl px-12"
        >
          <div className="bg-white p-3 rounded-3xl shadow-[0_60px_120px_rgba(0,0,0,0.95)]">
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden">
              <img src={photoUrl} alt={name} className="w-full h-full object-cover object-top" />
              
              {/* Card Bottom Overlay */}
              <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black via-black/50 to-transparent p-12 flex flex-col justify-end">
                <div className="flex items-center gap-4 mb-4 font-inter">
                  <span className="bg-amber-400 text-black px-4 py-1.5 text-sm font-extrabold uppercase tracking-wider rounded-lg shadow-lg">
                    {weightClass || 'HẠNG CÂN 55KG'}
                  </span>
                  <span className="text-blue-400 font-extrabold uppercase text-sm tracking-[0.2em] drop-shadow-md">
                    {victoryMethod || 'THẮNG ĐIỂM (POINTS)'}
                  </span>
                  {unit && (
                    <span className="bg-white/20 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg backdrop-blur-md">
                      {unit}
                    </span>
                  )}
                </div>
                
                {/* Winner Name: MONTSERRAT */}
                <h2 className="font-montserrat text-[6vw] font-black text-white uppercase tracking-tight leading-none drop-shadow-2xl">
                  {name}
                </h2>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
