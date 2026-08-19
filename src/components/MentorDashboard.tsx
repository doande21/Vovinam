import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Performance, Match, GlobalSettings } from '../types';
import { ArrowLeft, Star, Send, CheckCircle, Edit3, UserCheck, Shield, Swords, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
interface MentorDashboardProps {
  performances: Performance[];
  matches: Match[];
  settings: GlobalSettings | null;
  user: { uid: string; displayName?: string | null; email?: string | null } | User;
  onBack: () => void;
}

export default function MentorDashboard({ performances, matches, settings, user, onBack }: MentorDashboardProps) {
  const [activeTab, setActiveTab] = useState<'forms' | 'combat'>(() => {
    if (settings?.activeView === 'combat' || settings?.activeView === 'combat_led' || settings?.activeView === 'combat_tv') {
      return 'combat';
    }
    return 'forms';
  });

  const [score, setScore] = useState<number | ''>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Judge name handling
  const storageKey = `vovinam_judge_name_${user.uid}`;
  const savedJudgeName = localStorage.getItem(storageKey) || localStorage.getItem('vovinam_judge_name') || user.displayName || '';
  const [judgeName, setJudgeName] = useState<string>(savedJudgeName);
  const [tempNameInput, setTempNameInput] = useState<string>(savedJudgeName);
  const [showNameModal, setShowNameModal] = useState<boolean>(!savedJudgeName.trim());

  const activePerformance = performances.find(p => p.id === settings?.activeId);
  const activeMatch = matches.find(m => m.id === settings?.activeId) || matches[0];

  useEffect(() => {
    // Reset submission state when active performance changes
    setIsSubmitted(false);
    setScore('');
  }, [settings?.activeId]);

  useEffect(() => {
    if (settings?.activeView === 'combat' || settings?.activeView === 'combat_led' || settings?.activeView === 'combat_tv') {
      setActiveTab('combat');
    } else if (settings?.activeView === 'forms') {
      setActiveTab('forms');
    }
  }, [settings?.activeView]);

  const saveJudgeName = () => {
    if (!tempNameInput.trim()) return;
    const finalName = tempNameInput.trim();
    setJudgeName(finalName);
    localStorage.setItem(storageKey, finalName);
    setShowNameModal(false);
  };

  const submitScore = async () => {
    if (!activePerformance || score === '' || score < 40 || score > 90) return;
    if (!judgeName.trim()) {
      setShowNameModal(true);
      return;
    }

    const newScores = { 
      ...activePerformance.scores, 
      [user.uid]: { 
        score: Number(score), 
        name: judgeName.trim()
      } 
    };
    const scoreValues = Object.values(newScores).map(s => s.score);
    const average = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;

    await updateDoc(doc(db, 'performances', activePerformance.id), {
      scores: newScores,
      averageScore: average
    });

    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 relative">
      {/* Mandatory Judge Name Modal */}
      <AnimatePresence>
        {showNameModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl"
            >
              <div className="w-14 h-14 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 mb-6">
                <UserCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Nhập tên Giám định</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Vui lòng đặt tên hiển thị của bạn (Ví dụ: <span className="text-white font-medium">Giám định 1 - Thầy Hoàng</span>) để kết quả chấm điểm ghi nhận chính xác.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Tên Giám định
                  </label>
                  <input 
                    type="text" 
                    value={tempNameInput}
                    onChange={e => setTempNameInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveJudgeName()}
                    placeholder="VD: Giám định 1 - Nguyễn Văn A"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    autoFocus
                  />
                </div>

                <button 
                  onClick={saveJudgeName}
                  disabled={!tempNameInput.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-blue-500/20"
                >
                  Xác nhận Tên Giám định
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Bảng Chấm Điểm Giám Định</h1>
              <p className="text-xs text-slate-400">Vovinam Electronic Scoring System</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setActiveTab('forms')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'forms' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <Music className="w-3.5 h-3.5" />
                Thi Quyền / Võ Nhạc
              </button>
              <button
                onClick={() => setActiveTab('combat')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'combat' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <Swords className="w-3.5 h-3.5" />
                Đối Kháng (3 GĐ)
              </button>
            </div>

            <button 
              onClick={() => {
                setTempNameInput(judgeName);
                setShowNameModal(true);
              }}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-400 transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span className="truncate max-w-[100px]">{judgeName || 'Đặt tên'}</span>
              <Edit3 className="w-3 h-3 text-slate-500" />
            </button>
          </div>
        </header>


        {/* FORMS & MUSIC FORMS SCORING MODE */}
        {activeTab === 'forms' && (
          <AnimatePresence mode="wait">
            {!activePerformance ? (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20 bg-slate-900 rounded-3xl border border-slate-800"
              >
                <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-slate-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-400">Đang chờ Admin bắt đầu tiết mục Thi Quyền / Võ Nhạc...</h2>
                <p className="text-xs text-slate-500 mt-2">Khi Admin chọn tiết mục trên Dashboard, màn hình nhập điểm sẽ tự động xuất hiện tại đây.</p>
              </motion.div>
            ) : (
              <motion.div 
                key="active"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Performance Info Card */}
                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Star className="w-32 h-32" />
                  </div>
                  <div className="flex gap-2 mb-3">
                    <span className="inline-block px-3 py-1 bg-blue-600/20 text-blue-400 text-xs font-bold uppercase tracking-wider rounded-full border border-blue-500/30">
                      Đang biểu diễn
                    </span>
                    <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider rounded-full border border-amber-500/30">
                      {(activePerformance.category || 'thi_quyen') === 'thi_quyen' ? 'Thi Quyền' : 'Võ Nhạc'}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black mb-2">{activePerformance.name}</h2>
                  <p className="text-xl text-slate-400 font-medium">{activePerformance.competitor}</p>
                </div>

                {/* Score Input Card */}
                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
                  <div className="flex items-center justify-between mb-6">
                    <label className="block text-sm font-bold uppercase tracking-wider text-slate-400">
                      Nhập điểm số (Thang điểm: 40 - 90)
                    </label>
                    <span className="text-xs text-slate-500">Giám định: <strong className="text-slate-300">{judgeName}</strong></span>
                  </div>
                  
                  <div className="flex flex-col gap-6">
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.1"
                        min="40"
                        max="90"
                        placeholder="VD: 85.5"
                        value={score}
                        onChange={e => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          setScore(val);
                          setIsSubmitted(false);
                        }}
                        className="w-full bg-slate-800 border-2 border-slate-700 focus:border-blue-500 rounded-2xl p-6 text-5xl font-black text-center outline-none transition-all font-mono"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xl">
                        Điểm
                      </span>
                    </div>

                    {/* Quick Selection Buttons */}
                    <div className="grid grid-cols-5 gap-2">
                      {[70, 75, 80, 85, 90].map(val => (
                        <button
                          key={val}
                          onClick={() => {
                            setScore(val);
                            setIsSubmitted(false);
                          }}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            score === val 
                              ? 'bg-blue-600 border-blue-500 text-white' 
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {val}.0
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={submitScore}
                      disabled={score === '' || score < 40 || score > 90}
                      className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all ${
                        isSubmitted 
                          ? 'bg-green-600 text-white cursor-default' 
                          : score === '' || score < 40 || score > 90
                          ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                      }`}
                    >
                      {isSubmitted ? (
                        <>
                          <CheckCircle className="w-6 h-6" />
                          Đã gửi điểm ({typeof score === 'number' ? score.toFixed(1) : score}) thành công!
                        </>
                      ) : (
                        <>
                          <Send className="w-6 h-6" />
                          Gửi điểm chấm
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Score Status */}
                {activePerformance.scores[user.uid] && (
                  <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between text-sm">
                    <span className="text-slate-400">Điểm bạn đã lưu gần nhất:</span>
                    <span className="font-mono font-bold text-green-400 text-lg">
                      {activePerformance.scores[user.uid].score.toFixed(1)} điểm
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
