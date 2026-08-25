import { Match, GlobalSettings } from '../types';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Flame, Crown, RotateCcw, Sparkles } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface CombatLEDDisplayProps {
  match?: Match;
  matches?: Match[];
  performances?: any[];
  settings: GlobalSettings | null;
  onBack?: () => void;
}

export default function CombatLEDDisplay({ match: directMatch, matches, settings, onBack }: CombatLEDDisplayProps) {
  const match = directMatch || (matches && matches[0]) || ({
    id: 'default',
    redCorner: { name: 'VĐV ĐỎ', photoUrl: '', celebrationPhotoUrl: '', unit: '' },
    blueCorner: { name: 'VĐV XANH', photoUrl: '', celebrationPhotoUrl: '', unit: '' },
    redScore: 0,
    blueScore: 0,
    round: 1,
    timeRemaining: 120,
    winner: null,
    status: 'pending'
  } as Match);

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

        {/* Center Match Round Badge */}
        <div className="bg-black/60 border border-white/15 px-6 py-2 rounded-2xl backdrop-blur-md shadow-2xl text-center">
          <span className="text-[10px] text-amber-400 font-bold tracking-widest uppercase block font-inter">HIỆP ĐẤU</span>
          <span className="font-bebas text-2xl md:text-3xl font-normal text-white tracking-wider">ROUND {match.round || 1}</span>
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
          photoUrl={(match.winner === 'red' ? (match.redCorner.celebrationPhotoUrl || match.redCorner.photoUrl) : (match.blueCorner.celebrationPhotoUrl || match.blueCorner.photoUrl)) || ''}
          weightClass={match.weightClass}
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
  onReset
}: { 
  name: string; 
  unit?: string;
  photoUrl: string; 
  weightClass?: string; 
  corner?: 'red' | 'blue';
  onReset?: () => void;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-between p-4 md:p-6 overflow-hidden font-sans select-none"
    >
      {/* Top Floating Control Bar */}
      <div className="w-full flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bebas text-2xl md:text-3xl text-amber-400 font-normal tracking-widest uppercase">
            NGƯỜI CHIẾN THẮNG
          </span>
          {weightClass && (
            <span className="bg-white/10 text-slate-300 px-3 py-1 rounded-lg text-xs font-bold font-inter uppercase">
              {weightClass}
            </span>
          )}
        </div>

        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-xs font-bold text-slate-200 transition-all font-inter cursor-pointer"
            title="Đổi lại kết quả / Quay lại màn hình trận đấu"
          >
            <RotateCcw className="w-4 h-4" /> Đổi kết quả / Đấu tiếp
          </button>
        )}
      </div>

      {/* Center: Original Photo of the Winner (100% Nguyên bản, không đổ bóng, không che phủ) */}
      <div className="flex-1 flex items-center justify-center w-full min-h-0 my-2 relative z-10">
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={name} 
            className="max-h-full max-w-full h-auto w-auto object-contain rounded-xl"
          />
        ) : (
          <div className="w-64 h-64 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 font-bold">
            Chưa có ảnh
          </div>
        )}
      </div>

      {/* Bottom: Winner Name (Rõ ràng, không đổ bóng đè lên ảnh) */}
      <div className="w-full text-center py-2 z-20 shrink-0">
        <h2 className="font-montserrat text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-tight">
          {name}
        </h2>
        {unit && (
          <p className="font-inter text-sm md:text-base font-bold text-amber-400 uppercase tracking-widest mt-1">
            {unit}
          </p>
        )}
      </div>
    </motion.div>
  );
}
