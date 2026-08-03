import { Performance, Match, GlobalSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, ArrowLeft } from 'lucide-react';
import EventBackgroundView from './EventBackgroundView';

interface PublicDisplayProps {
  performances: Performance[];
  matches: Match[];
  settings: GlobalSettings | null;
  onBack: () => void;
}

export default function PublicDisplay({ performances, matches, settings, onBack }: PublicDisplayProps) {
  const activePerformance = performances.find(p => p.id === settings?.activeId);
  const activeMatch = matches.find(m => m.id === settings?.activeId);

  const sortedPerformances = [...performances]
    .filter(p => {
      if (!activePerformance) return true;
      const activeCat = activePerformance.category || 'thi_quyen';
      const pCat = p.category || 'thi_quyen';
      return pCat === activeCat;
    })
    .sort((a, b) => b.averageScore - a.averageScore);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/20 blur-[120px] rounded-full" />
      </div>

      <button onClick={onBack} className="absolute top-4 left-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all">
        <ArrowLeft className="w-6 h-6" />
      </button>

      <AnimatePresence mode="wait">
        {settings?.activeView === 'forms' && activePerformance && (
          <motion.div 
            key="forms"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen flex flex-col p-12"
          >
            <div className="grid grid-cols-12 gap-12 h-full">
              {/* Active Performance Info */}
              <div className="col-span-7 flex flex-col justify-center">
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="mb-12"
                >
                  <div className="flex gap-2 mb-6">
                    <span className="inline-block px-4 py-1 bg-blue-600 text-xs font-black uppercase tracking-[0.3em] rounded-full">
                      Đang thi đấu
                    </span>
                    <span className="inline-block px-4 py-1 bg-[#EAB308] text-black text-xs font-black uppercase tracking-[0.3em] rounded-full">
                      {(activePerformance.category || 'thi_quyen') === 'thi_quyen' ? 'Thi Quyền' : 'Võ Nhạc'}
                    </span>
                  </div>
                  <h1 className="text-8xl font-black mb-4 leading-tight tracking-tighter">
                    {activePerformance.name}
                  </h1>
                  <p className="text-4xl text-slate-400 font-medium">
                    {activePerformance.competitor}
                  </p>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {Object.entries(activePerformance.scores).map(([judgeId, scoreData], idx) => (
                    <motion.div 
                      key={judgeId}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white/5 border border-white/10 p-4 rounded-3xl text-center backdrop-blur-md"
                    >
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 truncate px-2">
                        {scoreData.name}
                      </p>
                      <p className="text-4xl font-black text-blue-400">{scoreData.score.toFixed(1)}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.div 
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="mt-12 bg-gradient-to-r from-blue-600 to-blue-400 p-1 rounded-3xl"
                >
                  <div className="bg-black/40 backdrop-blur-xl p-8 rounded-[22px] flex items-center justify-between">
                    <div>
                      <p className="text-xl text-blue-200 font-bold uppercase tracking-widest">Điểm trung bình</p>
                      <p className="text-2xl text-blue-100 opacity-60">Average Score</p>
                    </div>
                    <p className="text-9xl font-black tracking-tighter">
                      {activePerformance.averageScore.toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Leaderboard */}
              <div className="col-span-5 bg-white/5 rounded-[40px] border border-white/10 p-8 backdrop-blur-md flex flex-col">
                <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-yellow-500" /> BXH {(activePerformance.category || 'thi_quyen') === 'thi_quyen' ? 'THI QUYỀN' : 'VÕ NHẠC'}
                </h2>
                <div className="flex-1 space-y-4 overflow-hidden">
                  {sortedPerformances.slice(0, 6).map((p, idx) => (
                    <motion.div 
                      key={p.id}
                      initial={{ x: 30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex items-center justify-between p-5 rounded-2xl border ${p.id === activePerformance.id ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/5'}`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xl ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-amber-600 text-black' : 'bg-white/10'}`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-lg leading-none mb-1">{p.competitor}</p>
                          <p className="text-xs text-slate-500 uppercase tracking-wider">{p.name}</p>
                        </div>
                      </div>
                      <p className="text-2xl font-black text-blue-400">{p.averageScore.toFixed(2)}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {settings?.activeView === 'combat' && activeMatch && (
          <motion.div 
            key="combat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen relative overflow-hidden bg-black"
          >
            {/* UFC Style Combat Display */}
            <div className="flex h-full">
              {/* Red Corner Fighter */}
              <div className="relative flex-1 overflow-hidden">
                <motion.div 
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="h-full w-full"
                >
                  <img 
                    src={activeMatch.redCorner.photoUrl} 
                    alt="" 
                    className="h-full w-full object-cover object-center"
                  />
                </motion.div>
                
                {/* Red Label */}
                <div className="absolute bottom-12 left-12 z-20">
                  <p className="text-4xl font-black text-red-500 tracking-[0.2em] mb-2">ĐỎ / RED</p>
                  <h2 className="text-8xl font-black text-white uppercase leading-none tracking-tighter">{activeMatch.redCorner.name}</h2>
                </div>
              </div>

              {/* Center VS Divider */}
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md border border-white/20 px-8 py-3 rounded-xl">
                  <span className="text-7xl font-black text-yellow-500 tracking-tighter">VS</span>
                </div>
              </div>

              {/* Blue Corner Fighter */}
              <div className="relative flex-1 overflow-hidden">
                <motion.div 
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="h-full w-full"
                >
                  <img 
                    src={activeMatch.blueCorner.photoUrl} 
                    alt="" 
                    className="h-full w-full object-cover object-center"
                  />
                </motion.div>

                {/* Blue Label */}
                <div className="absolute bottom-12 right-12 z-20 text-right">
                  <p className="text-4xl font-black text-blue-500 tracking-[0.2em] mb-2">XANH / BLUE</p>
                  <h2 className="text-8xl font-black text-white uppercase leading-none tracking-tighter">{activeMatch.blueCorner.name}</h2>
                </div>
              </div>
            </div>

            {/* Winner Overlays */}
            {activeMatch.winner === 'red' && settings.showWinnerAnimation && (
              <WinnerOverlay 
                name={activeMatch.redCorner.name} 
                photoUrl={activeMatch.redCorner.celebrationPhotoUrl} 
                weightClass={activeMatch.weightClass}
                victoryMethod={activeMatch.victoryMethod}
              />
            )}
            {activeMatch.winner === 'blue' && settings.showWinnerAnimation && (
              <WinnerOverlay 
                name={activeMatch.blueCorner.name} 
                photoUrl={activeMatch.blueCorner.celebrationPhotoUrl} 
                weightClass={activeMatch.weightClass}
                victoryMethod={activeMatch.victoryMethod}
              />
            )}
          </motion.div>
        )}

        {settings?.activeView === 'event' && (
          <EventBackgroundView settings={settings} />
        )}

        {settings?.activeView === 'idle' && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen flex flex-col items-center justify-center text-center p-12"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-red-500 blur-[100px] opacity-20"
              />
              <h1 className="text-[12vw] font-black leading-none tracking-tighter mb-8 relative z-10">
                VOVINAM<br/>VIỆT VÕ ĐẠO
              </h1>
            </div>
            <p className="text-4xl text-slate-500 font-medium tracking-[0.5em] uppercase">Hệ Thống Chấm Điểm Điện Tử</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WinnerOverlay({ name, photoUrl, weightClass, victoryMethod }: { name: string; photoUrl: string; weightClass?: string; victoryMethod?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-40 bg-[#050505] flex flex-col overflow-hidden font-sans"
    >
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#1a1a1a_0%,_#050505_100%)] opacity-60" />

      {/* Top Bar */}
      <div className="w-full p-8 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-[0.1em] uppercase">VOVINAM CHAMPION</span>
        </div>
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 transition-colors">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start pt-8 relative z-10">
        {/* Subtitle */}
        <motion.p 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-[#EAB308] font-black tracking-tighter mb-4 text-2xl uppercase"
        >
          VÕ VIỆT TRANH HÙNG ĐOẠT CÓC VƯƠNG 2026
        </motion.p>

        {/* Main Title */}
        <motion.h1 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-[15vw] font-black text-white leading-none tracking-tighter mb-6 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
        >
          WINNER
        </motion.h1>

        {/* Winner Card Container */}
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring", damping: 15 }}
          className="relative w-full max-w-7xl px-16"
        >
          <div className="bg-white p-3 rounded-2xl shadow-[0_60px_120px_rgba(0,0,0,0.9)]">
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
              <img src={photoUrl} alt={name} className="w-full h-full object-cover object-top" />
              
              {/* Card Bottom Overlay */}
              <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-16 flex flex-col justify-end">
                <div className="flex items-center gap-6 mb-8">
                  <span className="bg-[#EAB308] text-black px-5 py-2 text-lg font-black uppercase tracking-wider rounded-sm shadow-lg">
                    {weightClass || 'HẠNG CÂN 55KG'}
                  </span>
                  <span className="text-[#60A5FA] font-black uppercase text-lg tracking-[0.2em] drop-shadow-md">
                    {victoryMethod || 'HOÀNG ĐAI ĐỆ NHỊ CẤP'}
                  </span>
                </div>
                
                <h2 className="text-[8vw] font-black text-white uppercase tracking-tighter leading-none drop-shadow-2xl">
                  {name}
                </h2>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Background Decorative Elements */}
      <div className="absolute top-[25%] left-[8%] w-48 h-1.5 bg-yellow-500/10 rotate-45 blur-md" />
      <div className="absolute bottom-[25%] right-[8%] w-48 h-1.5 bg-white/5 -rotate-45 blur-md" />
    </motion.div>
  );
}
