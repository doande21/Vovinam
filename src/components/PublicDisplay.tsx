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
              <div className="h-full flex flex-col justify-between pt-20 md:pt-28 lg:pt-32 pb-4 max-w-7xl mx-auto w-full">
                {/* Central Performance Focus Display */}
                <div className="my-auto text-center flex flex-col items-center pt-4 md:pt-8">
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className="max-w-5xl"
                  >
                    {/* Tiêu đề tiết mục dạng BEBAS NEUE */}
                    <p className="font-bebas text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-amber-400 font-normal tracking-[0.2em] uppercase mb-4 drop-shadow-[0_6px_24px_rgba(234,179,8,0.6)]">
                      TIẾT MỤC THI ĐẤU
                    </p>

                    {/* Tiêu đề tên bài thi dạng MONTSERRAT */}
                    <h1 className="font-montserrat text-5xl md:text-7xl lg:text-8xl font-black mb-5 leading-tight tracking-tight text-white drop-shadow-[0_15px_40px_rgba(0,0,0,0.9)]">
                      {activePerformance.name}
                    </h1>

                    {/* Tên vận động viên dạng MONTSERRAT */}
                    <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 px-8 py-3 rounded-3xl shadow-2xl">
                      <p className="font-montserrat text-2xl lg:text-4xl text-blue-300 font-extrabold tracking-wide">
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
              /* Case 2: Revealed Scores & Leaderboard Mode (Công bố kết quả - Tối ưu cỡ chữ siêu to cho màn LED sân khấu) */
              <div className="grid grid-cols-12 gap-6 lg:gap-10 h-full pt-14 md:pt-20 pb-4 max-w-[1600px] mx-auto w-full items-center">
                {/* Active Performance Info (Cột Trái: Thông tin bài thi & Điểm số) */}
                <div className="col-span-12 lg:col-span-7 flex flex-col justify-center gap-4 md:gap-6">
                  {/* Tên bài thi & Tên VĐV Card */}
                  <motion.div
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="bg-black/80 backdrop-blur-xl px-6 py-5 md:px-8 md:py-6 rounded-3xl border border-white/20 shadow-2xl"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-bebas inline-block px-4 py-1 bg-green-600 text-white text-xs md:text-sm font-normal uppercase tracking-wider rounded-full shadow-lg">
                        KẾT QUẢ CHÍNH THỨC
                      </span>
                    </div>
                    {/* Tên bài thi & Tên VĐV */}
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                      <h1 className="font-montserrat text-3xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] truncate">
                        {activePerformance.name}
                      </h1>
                      <div className="bg-amber-500/20 border border-amber-500/40 px-4 py-1.5 rounded-xl shrink-0">
                        <p className="font-montserrat text-lg md:text-2xl text-amber-300 font-extrabold drop-shadow">
                          VĐV: {activePerformance.competitor}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Điểm từng giám khảo */}
                  {Object.entries(activePerformance.scores).length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 font-inter">
                      {Object.entries(activePerformance.scores).map(([judgeId, scoreData], idx) => (
                        <motion.div 
                          key={judgeId}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: idx * 0.04 }}
                          className="bg-black/80 border border-white/20 p-3 md:p-4 rounded-2xl text-center backdrop-blur-xl shadow-xl"
                        >
                          <p className="text-xs md:text-sm text-slate-300 uppercase font-bold mb-1 truncate font-inter">
                            {scoreData.name || `Giám khảo ${idx + 1}`}
                          </p>
                          <p className="text-2xl md:text-3xl lg:text-4xl font-black text-amber-400 font-losttype font-score tracking-wide drop-shadow">
                            {scoreData.score.toFixed(1)}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Điểm trung bình - Thiết kế cực lớn nổi bật trên sân khấu */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 p-1 rounded-3xl shadow-[0_10px_40px_rgba(37,99,235,0.4)]"
                  >
                    <div className="bg-black/90 backdrop-blur-2xl px-6 py-5 md:px-10 md:py-7 rounded-[22px] flex items-center justify-between">
                      <div className="pr-4">
                        <p className="font-bebas text-2xl md:text-3xl lg:text-4xl text-amber-400 tracking-wider uppercase whitespace-nowrap drop-shadow">
                          ĐIỂM TRUNG BÌNH
                        </p>
                        <p className="font-inter text-xs md:text-sm text-blue-200 uppercase tracking-widest whitespace-nowrap opacity-90">
                          OFFICIAL AVERAGE SCORE
                        </p>
                      </div>
                      <p className="font-losttype font-score text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-white drop-shadow-[0_6px_24px_rgba(251,191,36,0.6)]">
                        {activePerformance.averageScore.toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Leaderboard (Cột Phải: Bảng Xếp Hạng) */}
                <div className="col-span-12 lg:col-span-5 bg-black/85 rounded-3xl border border-white/25 p-5 md:p-6 lg:p-7 backdrop-blur-2xl flex flex-col justify-start shadow-2xl">
                  <div>
                    <div className="mb-4 md:mb-5 flex items-center gap-3 text-amber-400">
                      <Trophy className="w-6 h-6 md:w-8 md:h-8 text-amber-400 shrink-0" />
                      <h2 className="font-bebas text-2xl md:text-3xl lg:text-4xl tracking-wider uppercase text-amber-400 whitespace-nowrap">
                        BẢNG XẾP HẠNG
                      </h2>
                    </div>
                    <div className="space-y-2 md:space-y-3 overflow-hidden font-inter">
                      {sortedPerformances.slice(0, 6).map((p, idx) => (
                        <motion.div 
                          key={p.id}
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`flex items-center justify-between px-4 py-2.5 md:py-3.5 rounded-2xl border transition-all ${p.id === activePerformance.id ? 'bg-blue-600/50 border-blue-400 shadow-xl ring-2 ring-blue-400/50' : 'bg-white/5 border-white/10'}`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <span className={`w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center font-black text-xs md:text-sm font-losttype font-score shrink-0 shadow-md ${idx === 0 ? 'bg-yellow-400 text-black' : idx === 1 ? 'bg-slate-200 text-black' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-white/15 text-white'}`}>
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-montserrat font-black text-sm md:text-base lg:text-lg leading-tight text-white truncate">{p.competitor}</p>
                              <p className="font-inter text-xs md:text-sm text-slate-300 uppercase tracking-wider truncate font-medium">{p.name}</p>
                            </div>
                          </div>
                          <p className="font-losttype font-score text-xl md:text-2xl lg:text-3xl font-black text-amber-400 tracking-wide shrink-0 drop-shadow">
                            {p.averageScore.toFixed(2)}
                          </p>
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

