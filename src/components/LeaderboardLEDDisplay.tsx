import React from 'react';
import { Performance, GlobalSettings } from '../types';
import { motion } from 'motion/react';
import { Trophy, ArrowLeft, Award, Sparkles } from 'lucide-react';

interface LeaderboardLEDDisplayProps {
  performances: Performance[];
  settings: GlobalSettings | null;
  onBack: () => void;
}

export default function LeaderboardLEDDisplay({ performances, settings, onBack }: LeaderboardLEDDisplayProps) {
  // Driven 100% by Admin Settings
  const effectiveCategory = settings?.activeLeaderboardCategory || 'nam';
  const effectiveFormFilter = settings?.activeLeaderboardFormFilter || 'all';

  const getTotalScore = (p: Performance) => {
    if (p.scores && Object.keys(p.scores).length > 0) {
      return Object.values(p.scores).reduce((sum, item) => sum + (item.score || 0), 0);
    }
    return p.totalScore ?? p.averageScore ?? 0;
  };

  // Filter performances according to Admin-selected category and specific form
  const categoryPerformances = performances.filter(p => {
    if (effectiveCategory === 'vo_nhac') {
      return p.category === 'vo_nhac';
    }
    const isForm = (p.category || 'thi_quyen') === 'thi_quyen';
    if (!isForm) return false;
    const gender = p.gender || 'nam';
    return gender === effectiveCategory;
  });

  const filteredPerformances = categoryPerformances
    .filter(p => {
      if (effectiveFormFilter === 'all') return true;
      return p.name.trim().toLowerCase() === effectiveFormFilter.trim().toLowerCase();
    })
    .sort((a, b) => getTotalScore(b) - getTotalScore(a));

  // Determine Category Title
  const isFemale = effectiveCategory === 'nu';
  const isMusic = effectiveCategory === 'vo_nhac';

  const defaultCategoryTitle = isMusic
    ? 'BẢNG XẾP HẠNG BIỂU DIỄN VÕ NHẠC'
    : isFemale
    ? 'BẢNG XẾP HẠNG THI QUYỀN - BẢNG NỮ (♀)'
    : 'BẢNG XẾP HẠNG THI QUYỀN - BẢNG NAM (♂)';

  const displayTitle = settings?.activeLeaderboardTitle || (
    effectiveFormFilter !== 'all'
      ? `BẢNG XẾP HẠNG BÀI: ${effectiveFormFilter.toUpperCase()}`
      : defaultCategoryTitle
  );

  const currentBgUrl = settings?.eventBgUrl;

  const top1 = filteredPerformances[0];
  const top2 = filteredPerformances[1];
  const top3 = filteredPerformances[2];
  const remainingPerformances = filteredPerformances.slice(3);

  return (
    <div className="min-h-screen bg-black text-white overflow-y-auto relative font-inter select-none">
      {/* Background Image / Lighting (Không đổ bóng, không tối màu, 100% nguyên bản) */}
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
          <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] blur-[140px] rounded-full ${
            isMusic ? 'bg-emerald-900/30' : isFemale ? 'bg-pink-900/30' : 'bg-blue-900/30'
          }`} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-900/25 blur-[140px] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-amber-500/5 blur-[160px] rounded-full" />
        </div>
      )}

      {/* Back button (Discreet) */}
      <button 
        onClick={onBack} 
        className="absolute top-4 left-4 z-50 p-2.5 bg-black/40 hover:bg-white/20 text-white/60 hover:text-white rounded-full transition-all border border-white/10 backdrop-blur-md"
        title="Quay lại"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col min-h-screen justify-center">
        {/* Empty State */}
        {filteredPerformances.length === 0 ? (
          <div className="my-auto text-center py-20 bg-black/80 backdrop-blur-xl rounded-[32px] border border-white/20 max-w-2xl mx-auto w-full p-8">
            <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold font-montserrat text-white mb-2">Chưa có kết quả cho nội dung này</h3>
            <p className="text-slate-300 text-sm">
              Ban tổ chức và các Giám định đang hoàn tất việc chấm điểm. Vui lòng đón xem!
            </p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto w-full space-y-6 my-auto">
            {/* Unified Header */}
            <div className="bg-black/80 backdrop-blur-xl rounded-[32px] border border-white/20 p-6 md:p-8 lg:p-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 mb-6 border-b border-white/15">
                <div>
                  <h1 className="font-bebas text-4xl sm:text-5xl md:text-6xl tracking-wide uppercase text-amber-400 leading-none">
                    {displayTitle}
                  </h1>
                </div>
                <span className={`font-inter text-xs md:text-sm font-black uppercase tracking-wider px-4 py-1.5 rounded-full border ${
                  isMusic
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : isFemale
                    ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}>
                  {isMusic ? 'VÕ NHẠC VOVINAM' : isFemale ? 'QUYỀN NỮ (♀)' : 'QUYỀN NAM (♂)'}
                </span>
              </div>

              {/* Leaderboard Cards List */}
              <div className="space-y-3 font-inter">
                {filteredPerformances.map((p, idx) => {
                  const total = getTotalScore(p);
                  const formattedScore = total.toFixed(2);
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`flex items-center justify-between px-5 py-4 md:py-4.5 rounded-2xl border transition-all ${
                        idx === 0
                          ? 'bg-white/10 border-amber-400/50'
                          : idx === 1
                          ? 'bg-white/5 border-slate-300/40'
                          : idx === 2
                          ? 'bg-white/5 border-amber-600/40'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0 pr-4">
                        {/* Rank Badge Circle */}
                        <div className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black text-base md:text-lg font-losttype font-score shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-black shadow-lg'
                            : idx === 1
                            ? 'bg-slate-200 text-black'
                            : idx === 2
                            ? 'bg-amber-600 text-white'
                            : 'bg-[#2a2a2a] text-white border border-white/15'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="font-montserrat font-black text-lg sm:text-xl md:text-2xl leading-tight text-white truncate">
                            {p.competitor}
                          </p>
                          <p className="font-inter text-xs sm:text-sm text-slate-300 uppercase tracking-wide truncate font-semibold mt-0.5">
                            {p.name}
                          </p>
                        </div>
                      </div>

                      <p className="font-losttype font-score text-3xl sm:text-4xl md:text-5xl font-black text-amber-400 tracking-tight shrink-0">
                        {formattedScore}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
