import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Performance, GlobalSettings } from '../types';
import { ArrowLeft, Star, Send, CheckCircle, Edit3, UserCheck, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';

interface MentorDashboardProps {
  performances: Performance[];
  settings: GlobalSettings | null;
  user: User;
  onBack: () => void;
}

export default function MentorDashboard({ performances, settings, user, onBack }: MentorDashboardProps) {
  const [score, setScore] = useState<number | ''>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Judge name handling
  const storageKey = `vovinam_judge_name_${user.uid}`;
  const savedJudgeName = localStorage.getItem(storageKey) || user.displayName || '';
  const [judgeName, setJudgeName] = useState<string>(savedJudgeName);
  const [tempNameInput, setTempNameInput] = useState<string>(savedJudgeName);
  const [showNameModal, setShowNameModal] = useState<boolean>(!savedJudgeName.trim());

  const activePerformance = performances.find(p => p.id === settings?.activeId);

  useEffect(() => {
    // Reset submission state when active performance changes
    setIsSubmitted(false);
    setScore('');
  }, [settings?.activeId]);

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
    <div className="min-h-screen bg-slate-950 text-white p-6 relative">
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

      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Bảng chấm điểm Giám định</h1>
              <p className="text-xs text-slate-400">Vovinam Scoring System</p>
            </div>
          </div>

          <button 
            onClick={() => {
              setTempNameInput(judgeName);
              setShowNameModal(true);
            }}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl text-xs font-bold text-blue-400 transition-all"
          >
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="truncate max-w-[120px]">{judgeName || 'Đặt tên'}</span>
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </header>

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
              <h2 className="text-xl font-semibold text-slate-400">Đang chờ Admin bắt đầu tiết mục...</h2>
            </motion.div>
          ) : isSubmitted ? (
            <motion.div 
              key="submitted"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-20 bg-green-900/20 rounded-3xl border border-green-500/50"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-400 mb-2">Đã gửi điểm thành công!</h2>
              <p className="text-slate-400">Điểm của bạn: <span className="text-white font-bold">{score}</span></p>
              <p className="mt-2 text-xs text-blue-300">Ghi nhận dưới tên: <span className="font-bold">{judgeName}</span></p>
              <p className="mt-4 text-sm text-slate-500">Vui lòng chờ tiết mục tiếp theo</p>
            </motion.div>
          ) : (
            <motion.div 
              key="active"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl"
            >
              <div className="mb-8">
                <span className="text-blue-500 font-bold uppercase tracking-widest text-xs">Đang diễn ra</span>
                <h2 className="text-3xl font-bold mt-1">{activePerformance.name}</h2>
                <p className="text-slate-400 text-lg">{activePerformance.competitor}</p>
              </div>

               <div className="space-y-6">
                <div>
                  <label className="block text-slate-400 mb-2 font-medium">Nhập điểm (40 - 90)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="40"
                    max="90"
                    value={score}
                    onChange={e => setScore(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ví dụ: 85.5"
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-6 py-4 text-3xl font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[60, 70, 75, 80, 85].map(v => (
                    <button 
                      key={v}
                      onClick={() => setScore(v)}
                      className="py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={submitScore}
                  disabled={score === '' || score < 40 || score > 90}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/20"
                >
                  <Send className="w-6 h-6" /> Gửi điểm số ({judgeName || 'Chưa đặt tên'})
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 p-6 bg-slate-900/50 rounded-2xl border border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center font-black text-blue-400">
              {judgeName ? judgeName.charAt(0).toUpperCase() : 'G'}
            </div>
            <div>
              <p className="font-bold flex items-center gap-2">
                {judgeName || 'Chưa đặt tên Giám định'}
                <button 
                  onClick={() => {
                    setTempNameInput(judgeName);
                    setShowNameModal(true);
                  }}
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-normal"
                >
                  <Edit3 className="w-3 h-3" /> Sửa
                </button>
              </p>
              <p className="text-xs text-slate-500">{user.email || 'Tài khoản Giám định'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

