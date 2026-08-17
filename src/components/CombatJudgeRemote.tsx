import { useState, useEffect } from 'react';
import { Match } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, UserCheck, CheckCircle2, Shield, Zap } from 'lucide-react';
import { processCombatVote, CONSENSUS_WINDOW_MS } from '../utils/combatConsensus';

interface CombatJudgeRemoteProps {
  match: Match | undefined;
  judgeName: string;
  onBack?: () => void;
}

export default function CombatJudgeRemote({ match, judgeName, onBack }: CombatJudgeRemoteProps) {
  const [selectedSeat, setSelectedSeat] = useState<'judge_1' | 'judge_2' | 'judge_3'>(() => {
    return (localStorage.getItem('vovinam_combat_seat') as 'judge_1' | 'judge_2' | 'judge_3') || 'judge_1';
  });

  const [lastClicked, setLastClicked] = useState<{ corner: 'red' | 'blue'; points: number; time: number } | null>(null);
  const [consensusAlert, setConsensusAlert] = useState<string | null>(null);

  const saveSeat = (seat: 'judge_1' | 'judge_2' | 'judge_3') => {
    setSelectedSeat(seat);
    localStorage.setItem('vovinam_combat_seat', seat);
  };

  const getSeatLabel = (seat: 'judge_1' | 'judge_2' | 'judge_3') => {
    if (seat === 'judge_1') return 'Giám định 1';
    if (seat === 'judge_2') return 'Giám định 2';
    return 'Giám định 3';
  };

  // Handle Judge Button Press
  const handleVote = async (corner: 'red' | 'blue', points: number) => {
    if (!match) return;

    // Haptic vibration feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }

    const voteTimestamp = Date.now();
    setLastClicked({ corner, points, time: voteTimestamp });

    const newVote = {
      id: `${selectedSeat}_${voteTimestamp}`,
      judgeId: selectedSeat,
      judgeName: `${getSeatLabel(selectedSeat)} (${judgeName || 'Giám khảo'})`,
      corner,
      points,
      timestamp: voteTimestamp
    };

    // Calculate consensus state
    const { updatedMatch, consensusTriggered, triggeredEvent } = processCombatVote(match, newVote);

    if (consensusTriggered && triggeredEvent) {
      setConsensusAlert(triggeredEvent.description);
      setTimeout(() => setConsensusAlert(null), 2500);
    }

    try {
      await updateDoc(doc(db, 'matches', match.id), {
        redScore: updatedMatch.redScore,
        blueScore: updatedMatch.blueScore,
        activeVotes: updatedMatch.activeVotes,
        ...(updatedMatch.scoreLog ? { scoreLog: updatedMatch.scoreLog } : {})
      });
    } catch (error) {
      console.error("Error submitting combat vote:", error);
    }
  };

  if (!match) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center text-white">
        <Swords className="w-16 h-16 text-slate-600 mb-4 animate-bounce" />
        <h2 className="text-2xl font-black mb-2">Chưa có trận đối kháng nào được kích hoạt</h2>
        <p className="text-slate-400 text-sm max-w-md">
          Vui lòng đợi Ban Tổ chức / Admin chọn trận đấu đối kháng trên hệ thống để bắt đầu chấm điểm.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-8">
      {/* Top Header & Seat Selection */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-30 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="font-black text-sm uppercase tracking-wider text-amber-400">
              CHẤM ĐỐI KHÁNG (3 GIÁM ĐỊNH)
            </span>
          </div>
          <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-300 font-bold">
            Hiệp {match.round || 1}
          </span>
        </div>

        {/* Seat Picker Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          {(['judge_1', 'judge_2', 'judge_3'] as const).map(seat => (
            <button
              key={seat}
              onClick={() => saveSeat(seat)}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                selectedSeat === seat 
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {getSeatLabel(seat)}
            </button>
          ))}
        </div>
      </div>

      {/* Consensus Alert Popup */}
      <AnimatePresence>
        {consensusAlert && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-16 inset-x-4 max-w-lg mx-auto z-50 bg-green-600 text-white p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-green-400 font-bold text-xs sm:text-sm"
          >
            <CheckCircle2 className="w-6 h-6 flex-shrink-0 animate-spin" />
            <span className="flex-1">{consensusAlert}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Match Info Bar */}
      <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="font-bold text-sm text-red-400 truncate max-w-[120px]">{match.redCorner.name}</span>
          <span className="text-xs font-mono font-bold bg-red-950 border border-red-800 px-2 py-0.5 rounded text-red-300">
            {match.redScore || 0}đ
          </span>
        </div>

        <div className="text-slate-500 font-black text-xs">VS</div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-blue-950 border border-blue-800 px-2 py-0.5 rounded text-blue-300">
            {match.blueScore || 0}đ
          </span>
          <span className="font-bold text-sm text-blue-400 truncate max-w-[120px]">{match.blueCorner.name}</span>
          <div className="w-3 h-3 rounded-full bg-blue-500" />
        </div>
      </div>

      {/* Main Touch Scoring Split Screen (Red Left/Top vs Blue Right/Bottom) */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto w-full mt-2">
        {/* RED CORNER BUTTONS */}
        <div className="flex flex-col bg-gradient-to-b from-red-950/70 to-slate-900 border-2 border-red-600/50 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <h3 className="text-lg font-black text-red-400 uppercase tracking-wider">
                GÓC ĐỎ: {match.redCorner.name}
              </h3>
            </div>
            <span className="text-xs font-mono font-bold bg-red-600 text-white px-3 py-1 rounded-full">
              {match.redScore || 0} ĐIỂM
            </span>
          </div>

          <div className="flex-1 flex flex-col gap-3 justify-center min-h-[220px]">
            {/* +1 Point Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVote('red', 1)}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 active:from-red-500 active:to-red-600 hover:brightness-110 p-5 rounded-2xl text-white font-black flex items-center justify-between shadow-lg shadow-red-600/40 border border-red-400/30 transition-all cursor-pointer"
            >
              <div className="text-left">
                <span className="block text-2xl font-black tracking-tight uppercase">+1 ĐIỂM ĐỎ</span>
                <span className="text-xs text-red-200 font-medium">Đòn đấm / Đòn đá trúng đích</span>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner">
                +1
              </div>
            </motion.button>

            {/* +2 Points Button (Leg Attack / Sweep) */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVote('red', 2)}
              className="flex-1 bg-gradient-to-r from-amber-600 to-red-800 active:from-amber-500 active:to-red-700 hover:brightness-110 p-5 rounded-2xl text-white font-black flex items-center justify-between shadow-lg shadow-amber-600/30 border border-amber-400/30 transition-all cursor-pointer"
            >
              <div className="text-left">
                <span className="block text-2xl font-black tracking-tight uppercase">+2 ĐIỂM ĐỎ</span>
                <span className="text-xs text-amber-200 font-medium">Đòn chân tấn công / Quật ngã</span>
              </div>
              <div className="w-14 h-14 bg-amber-500 text-black rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner">
                +2
              </div>
            </motion.button>
          </div>
        </div>

        {/* BLUE CORNER BUTTONS */}
        <div className="flex flex-col bg-gradient-to-b from-blue-950/70 to-slate-900 border-2 border-blue-600/50 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
              <h3 className="text-lg font-black text-blue-400 uppercase tracking-wider">
                GÓC XANH: {match.blueCorner.name}
              </h3>
            </div>
            <span className="text-xs font-mono font-bold bg-blue-600 text-white px-3 py-1 rounded-full">
              {match.blueScore || 0} ĐIỂM
            </span>
          </div>

          <div className="flex-1 flex flex-col gap-3 justify-center min-h-[220px]">
            {/* +1 Point Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVote('blue', 1)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 active:from-blue-500 active:to-blue-600 hover:brightness-110 p-5 rounded-2xl text-white font-black flex items-center justify-between shadow-lg shadow-blue-600/40 border border-blue-400/30 transition-all cursor-pointer"
            >
              <div className="text-left">
                <span className="block text-2xl font-black tracking-tight uppercase">+1 ĐIỂM XANH</span>
                <span className="text-xs text-blue-200 font-medium">Đòn đấm / Đòn đá trúng đích</span>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner">
                +1
              </div>
            </motion.button>

            {/* +2 Points Button (Leg Attack / Sweep) */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVote('blue', 2)}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-800 active:from-cyan-500 active:to-blue-700 hover:brightness-110 p-5 rounded-2xl text-white font-black flex items-center justify-between shadow-lg shadow-cyan-600/30 border border-cyan-400/30 transition-all cursor-pointer"
            >
              <div className="text-left">
                <span className="block text-2xl font-black tracking-tight uppercase">+2 ĐIỂM XANH</span>
                <span className="text-xs text-cyan-200 font-medium">Đòn chân tấn công / Quật ngã</span>
              </div>
              <div className="w-14 h-14 bg-cyan-400 text-black rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner">
                +2
              </div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Bottom Status Info */}
      <div className="px-4 text-center mt-3">
        <p className="text-xs text-slate-500">
          Đang chấm với tư cách: <strong className="text-slate-300">{getSeatLabel(selectedSeat)}</strong> • Cửa sổ đồng thuận: 1.8 giây
        </p>
      </div>
    </div>
  );
}
