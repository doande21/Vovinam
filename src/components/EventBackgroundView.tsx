import { motion } from 'motion/react';
import { ArrowLeft, Maximize2, Minimize2, Trophy, Flame, Shield, Award } from 'lucide-react';
import { useState } from 'react';
import { GlobalSettings } from '../types';

interface EventBackgroundViewProps {
  settings: GlobalSettings | null;
  onBack?: () => void;
}

export default function EventBackgroundView({ settings, onBack }: EventBackgroundViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const eventTitle = settings?.eventTitle || 'VÕ VIỆT TRANH HÙNG ĐOẠT CÓC VƯƠNG 2026';
  const eventSubtitle = settings?.eventSubtitle || 'GIẢI VOVINAM - VIỆT VÕ ĐẠO MỞ RỘNG';
  const organizer = settings?.organizer || 'TRƯỜNG ĐẠI HỌC FPT';
  const bgUrl = settings?.eventBgUrl;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-sans select-none">
      {/* Background Image or Animated Gradient Mesh */}
      {bgUrl ? (
        <div className="absolute inset-0 z-0">
          <img src={bgUrl} alt="Event Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/80" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-[#05050a]">
          {/* Ambient Lighting Rays */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] h-[80vh] bg-[radial-gradient(ellipse_at_top,_#eab3081a_0%,_#1e40af2a_40%,_transparent_75%)] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-[50vw] h-[50vw] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-[50vw] h-[50vw] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />
          
          {/* Diagonal Sport Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
        </div>
      )}

      {/* Top Controls */}
      <div className="absolute top-6 left-6 right-6 z-50 flex items-center justify-between pointer-events-auto">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
        )}
        <div className="ml-auto flex items-center gap-3">
          <button 
            onClick={toggleFullscreen}
            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white transition-all border border-white/10"
            title="Toàn màn hình (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Content Canvas */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between items-center px-8 py-12 text-center">
        {/* Top Header - Organization */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-2 mt-4"
        >
          <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-amber-500/30 backdrop-blur-md shadow-lg shadow-amber-500/5">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 text-sm md:text-base font-black tracking-[0.25em] uppercase">
              {organizer}
            </span>
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-slate-400 text-xs md:text-sm font-semibold tracking-[0.3em] uppercase mt-1">
            {eventSubtitle}
          </p>
        </motion.div>

        {/* Center Title & Crest */}
        <div className="flex flex-col items-center justify-center my-auto max-w-7xl">
          {/* Animated Vovinam Emblem */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative mb-8"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="w-36 h-36 md:w-48 md:h-48 rounded-full border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-blue-600/10 to-amber-500/10 flex items-center justify-center p-2 backdrop-blur-sm"
            >
              <div className="w-full h-full rounded-full border border-dashed border-amber-400/30" />
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/40 border-2 border-amber-200">
                <Trophy className="w-12 h-12 md:w-16 md:h-16 text-black" />
              </div>
            </div>
          </motion.div>

          {/* Main Epic Event Title */}
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight uppercase bg-gradient-to-b from-white via-amber-100 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(234,179,8,0.3)] max-w-5xl"
          >
            {eventTitle}
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            transition={{ duration: 1, delay: 0.6 }}
            className="h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent my-8 max-w-2xl w-full"
          />

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-xl md:text-3xl font-extrabold text-blue-400 uppercase tracking-[0.2em] drop-shadow-md"
          >
            VIỆT VÕ ĐẠO - BÀN TAY THÉP VỚI TRÁI TIM TỪ BI
          </motion.p>
        </div>

        {/* Bottom Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="w-full max-w-4xl bg-white/5 border border-white/10 backdrop-blur-xl px-8 py-4 rounded-2xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 text-amber-400 animate-pulse" />
            <span className="text-sm md:text-base font-bold text-slate-200">
              CHÀO MỪNG QUÝ VỊ ĐẠI BIỂU & VÕ SINH Về THAM DỰ
            </span>
          </div>
          <div className="flex items-center gap-2 bg-blue-600/30 border border-blue-400/30 px-3 py-1 rounded-lg text-xs font-black text-blue-300 uppercase tracking-widest">
            OFFICIAL EVENT
          </div>
        </motion.div>
      </div>
    </div>
  );
}
