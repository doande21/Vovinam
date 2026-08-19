import { Performance, Match, GlobalSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import EventBackgroundView from './EventBackgroundView';
import CombatLEDDisplay from './CombatLEDDisplay';
import CombatTVDisplay from './CombatTVDisplay';

interface PublicDisplayProps {
  performances: Performance[];
  matches: Match[];
  settings: GlobalSettings | null;
  onBack: () => void;
}

export default function PublicDisplay({ performances, matches, settings, onBack }: PublicDisplayProps) {
  const activePerformance = performances.find(p => p.id === settings?.activeId);
  const activeMatch = matches.find(m => m.id === settings?.activeId) || matches[0];

  const sortedPerformances = [...performances]
    .filter(p => {
      if (!activePerformance) return true;
      const activeCat = activePerformance.category || 'thi_quyen';
      const pCat = p.category || 'thi_quyen';
      return pCat === activeCat;
    })
    .sort((a, b) => b.averageScore - a.averageScore);

  const showScores = !!settings?.showScoresAndLeaderboard;
  const currentBgUrl = activePerformance?.bgUrl || settings?.eventBgUrl;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative font-sans select-none">
      {/* Dynamic Background Image (Màu sắc nguyên bản 100%, không đổ bóng, không tối màu) */}
      {currentBgUrl ? (
        <div className="absolute inset-0 z-0">
          <img 
            src={currentBgUrl} 
            alt="Event Background" 
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/30 blur-[130px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-900/25 blur-[130px] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-amber-500/5 blur-[160px] rounded-full" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
        </div>
      )}

      <button onClick={onBack} className="absolute top-4 left-4 z-50 p-2.5 bg-white/10 hover:bg-white/25 rounded-full transition-all border border-white/10 backdrop-blur-md">
        <ArrowLeft className="w-6 h-6 text-white" />
      </button>

      <AnimatePresence mode="wait">
        {settings?.activeView === 'forms' && activePerformance && (
          <motion.div 
            key={showScores ? "forms-revealed" : "forms-hidden"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen flex flex-col p-8 lg:p-12 relative z-10"
          >
            {/* Case 1: Hidden Scores & Leaderboard Mode (Chế độ thi đấu kín - chỉ hiện phông biểu diễn) */}
            {!showScores ? (
              <div className="h-full flex flex-col justify-between py-4 max-w-7xl mx-auto w-full">
                {/* Header Tag */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-inter inline-block px-5 py-2 bg-blue-600 text-white text-xs sm:text-sm font-extrabold uppercase tracking-[0.25em] rounded-full shadow-lg shadow-blue-600/30">
                      ĐANG BIỂU DIỄN
                    </span>
                    <span className="font-inter inline-block px-5 py-2 bg-[#EAB308] text-black text-xs sm:text-sm font-black uppercase tracking-[0.25em] rounded-full shadow-lg shadow-amber-500/20">
                      {(activePerformance.category || 'thi_quyen') === 'thi_quyen' ? 'THI QUYỀN VOVINAM' : 'VÕ NHẠC VOVINAM'}
                    </span>
                  </div>
                </div>

                {/* Central Performance Focus Display */}
                <div className="my-auto text-center flex flex-col items-center">
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className="max-w-5xl"
                  >
                    {/* Tiêu đề tiết mục dạng BEBAS NEUE */}
                    <p className="font-bebas text-3xl sm:text-4xl lg:text-5xl text-amber-400 font-normal tracking-[0.25em] uppercase mb-4 drop-shadow-[0_4px_16px_rgba(234,179,8,0.4)]">
                      TIẾT MỤC THI ĐẤU
                    </p>

                    {/* Tiêu đề tên bài thi dạng MONTSERRAT */}
                    <h1 className="font-montserrat text-6xl md:text-8xl lg:text-9xl font-black mb-6 leading-tight tracking-tight text-white drop-shadow-[0_15px_40px_rgba(0,0,0,0.9)]">
                      {activePerformance.name}
                    </h1>

                    {/* Tên vận động viên dạng MONTSERRAT */}
                    <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 px-8 py-4 rounded-3xl shadow-2xl">
                      <p className="font-montserrat text-3xl lg:text-5xl text-blue-300 font-extrabold tracking-wide">
                        {activePerformance.competitor}
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Discreet Judge Progress Bar */}
                <div className="bg-black/60 border border-white/15 p-6 rounded-3xl backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center justify-between mb-4 font-inter">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-400 animate-spin" />
                      <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                        TIẾN ĐỘ CHẤM CỦA HỘI ĐỒNG GIÁM KHẢO
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      Đã ghi nhận: {Object.keys(activePerformance.scores || {}).length} giám khảo
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 font-inter">
                    {Object.entries(activePerformance.scores || {}).length === 0 ? (
                      <div className="col-span-full text-center py-3 text-slate-400 text-sm font-medium">
                        Các giám khảo đang theo dõi phần thi và sẽ nhập điểm trên thiết bị cầm tay...
                      </div>
                    ) : (
                      Object.entries(activePerformance.scores).map(([judgeId, scoreData], idx) => (
                        <div 
                          key={judgeId}
                          className="bg-green-500/15 border border-green-500/35 p-3 rounded-2xl flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-xs font-bold text-green-300 truncate">
                            {scoreData.name || `Giám khảo ${idx + 1}`}: Đã nộp điểm
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Case 2: Revealed Scores & Leaderboard Mode (Công bố kết quả) */
              <div className="grid grid-cols-12 gap-8 lg:gap-12 h-full">
                {/* Active Performance Info */}
                <div className="col-span-12 lg:col-span-7 flex flex-col justify-center">
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="mb-8"
                  >
                    <div className="flex gap-2 mb-4">
                      <span className="font-bebas inline-block px-4 py-1.5 bg-green-600 text-white text-base font-normal uppercase tracking-[0.2em] rounded-full">
                        KẾT QUẢ CHÍNH THỨC
                      </span>
                      <span className="font-bebas inline-block px-4 py-1.5 bg-[#EAB308] text-black text-base font-normal uppercase tracking-[0.2em] rounded-full">
                        {(activePerformance.category || 'thi_quyen') === 'thi_quyen' ? 'THI QUYỀN' : 'VÕ NHẠC'}
                      </span>
                    </div>
                    {/* Tên bài thi: MONTSERRAT */}
                    <h1 className="font-montserrat text-5xl md:text-7xl font-black mb-2 leading-tight tracking-tight text-white drop-shadow-lg">
                      {activePerformance.name}
                    </h1>
                    {/* Tên VĐV: MONTSERRAT */}
                    <p className="font-montserrat text-3xl text-slate-300 font-extrabold">
                      {activePerformance.competitor}
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 font-inter">
                    {Object.entries(activePerformance.scores).map(([judgeId, scoreData], idx) => (
                      <motion.div 
                        key={judgeId}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.08 }}
                        className="bg-black/50 border border-white/10 p-4 rounded-2xl text-center backdrop-blur-md"
                      >
                        <p className="text-[11px] text-slate-400 uppercase font-bold mb-1 truncate px-1 font-inter">
                          {scoreData.name}
                        </p>
                        <p className="text-3xl font-black text-amber-400 font-mono">{scoreData.score.toFixed(1)}</p>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div 
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 p-1 rounded-3xl shadow-2xl"
                  >
                    <div className="bg-black/70 backdrop-blur-xl p-6 lg:p-8 rounded-[22px] flex items-center justify-between">
                      <div>
                        <p className="font-bebas text-2xl lg:text-3xl text-blue-200 tracking-wider uppercase">ĐIỂM TRUNG BÌNH</p>
                        <p className="font-inter text-xs text-blue-100 opacity-70 uppercase tracking-wider">OFFICIAL AVERAGE SCORE</p>
                      </div>
                      <p className="font-montserrat text-7xl lg:text-9xl font-black tracking-tight text-white font-mono">
                        {activePerformance.averageScore.toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Leaderboard */}
                <div className="col-span-12 lg:col-span-5 bg-black/60 rounded-[36px] border border-white/15 p-6 lg:p-8 backdrop-blur-xl flex flex-col justify-between shadow-2xl">
                  <div>
                    <h2 className="font-bebas text-3xl lg:text-4xl tracking-wider mb-6 flex items-center gap-3 text-amber-400">
                      <Trophy className="w-8 h-8 text-amber-400" /> BẢNG XẾP HẠNG {(activePerformance.category || 'thi_quyen') === 'thi_quyen' ? 'THI QUYỀN' : 'VÕ NHẠC'}
                    </h2>
                    <div className="space-y-3 overflow-hidden font-inter">
                      {sortedPerformances.slice(0, 6).map((p, idx) => (
                        <motion.div 
                          key={p.id}
                          initial={{ x: 30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`flex items-center justify-between p-4 rounded-2xl border ${p.id === activePerformance.id ? 'bg-blue-600/30 border-blue-500 shadow-lg' : 'bg-white/5 border-white/10'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-lg ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-amber-600 text-black' : 'bg-white/10 text-white'}`}>
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-montserrat font-bold text-base leading-none mb-1 text-white">{p.competitor}</p>
                              <p className="font-inter text-xs text-slate-400 uppercase tracking-wider">{p.name}</p>
                            </div>
                          </div>
                          <p className="font-mono text-2xl font-black text-amber-400">{p.averageScore.toFixed(2)}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {(settings?.activeView === 'combat' || settings?.activeView === 'combat_led') && activeMatch && (
          <CombatLEDDisplay match={activeMatch} settings={settings} onBack={onBack} />
        )}

        {settings?.activeView === 'combat_tv' && activeMatch && (
          <CombatTVDisplay match={activeMatch} settings={settings} onBack={onBack} />
        )}

        {settings?.activeView === 'event' && (
          <EventBackgroundView settings={settings} onBack={onBack} />
        )}

        {settings?.activeView === 'idle' && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen flex flex-col items-center justify-center text-center p-12 relative z-10"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-red-500 blur-[100px] opacity-20"
              />
              <h1 className="font-bebas text-[14vw] font-normal leading-none tracking-wider mb-4 relative z-10 text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                VOVINAM<br/>VIỆT VÕ ĐẠO
              </h1>
            </div>
            <p className="font-montserrat text-2xl md:text-3xl text-amber-400 font-bold tracking-[0.3em] uppercase">
              Hệ Thống Chấm Điểm Điện Tử
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

