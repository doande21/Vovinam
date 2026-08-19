import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { auth, db, signInWithGoogle, signInGuest } from './firebase';
import { Performance, Match, GlobalSettings } from './types';
import AdminDashboard from './components/AdminDashboard';
import MentorDashboard from './components/MentorDashboard';
import PublicDisplay from './components/PublicDisplay';
import EventBackgroundView from './components/EventBackgroundView';
import { LogIn, Shield, UserCheck, Monitor, Image, KeyRound, AlertTriangle, X, Check, Edit3, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [localJudgeUser, setLocalJudgeUser] = useState<{ uid: string; displayName: string; email: string | null } | null>(() => {
    const savedUid = localStorage.getItem('vovinam_local_judge_uid');
    const savedName = localStorage.getItem('vovinam_judge_name') || '';
    if (savedUid) {
      return { uid: savedUid, displayName: savedName, email: null };
    }
    return null;
  });

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [view, setView] = useState<'home' | 'admin' | 'mentor' | 'led' | 'event_bg'>('home');

  // Admin PIN state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Mandatory Judge Name Setup Modal for all non-admin logins
  const [showJudgeNameModal, setShowJudgeNameModal] = useState(false);
  const [judgeNameInput, setJudgeNameInput] = useState('');
  const [pendingNextView, setPendingNextView] = useState<'mentor' | 'home' | null>(null);

  // Domain error state
  const [domainError, setDomainError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
      
      // If user logged in and is NOT admin, verify they have set a judge name
      if (firebaseUser) {
        const isAdminUser = firebaseUser.email === 'doandeqn123@gmail.com';
        if (!isAdminUser) {
          const savedName = localStorage.getItem(`vovinam_judge_name_${firebaseUser.uid}`) || localStorage.getItem('vovinam_judge_name') || firebaseUser.displayName || '';
          if (!savedName.trim()) {
            setJudgeNameInput(firebaseUser.displayName || '');
            setShowJudgeNameModal(true);
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Listen to settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as GlobalSettings);
      }
    });

    // Listen to performances
    const qPerformances = query(collection(db, 'performances'), orderBy('order', 'asc'));
    const unsubPerformances = onSnapshot(qPerformances, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Performance));
      setPerformances(data);
    });

    // Listen to matches
    const qMatches = query(collection(db, 'matches'), orderBy('status', 'desc'));
    const unsubMatches = onSnapshot(qMatches, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
      setMatches(data);
    });

    return () => {
      unsubSettings();
      unsubPerformances();
      unsubMatches();
    };
  }, []);

  // Helper to ensure a unique local judge ID exists
  const getOrCreateLocalJudge = () => {
    let localUid = localStorage.getItem('vovinam_local_judge_uid');
    if (!localUid) {
      localUid = 'judge_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('vovinam_local_judge_uid', localUid);
    }
    const savedName = localStorage.getItem('vovinam_judge_name') || '';
    const jUser = { uid: localUid, displayName: savedName, email: null };
    setLocalJudgeUser(jUser);
    return jUser;
  };

  const handleGoogleSignIn = async () => {
    setDomainError(null);
    try {
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        const isAdminUser = loggedUser.email === 'doandeqn123@gmail.com';
        if (isAdminUser) {
          setView('admin');
        } else {
          // Non-admin account: MUST set judge name
          const savedName = localStorage.getItem(`vovinam_judge_name_${loggedUser.uid}`) || localStorage.getItem('vovinam_judge_name') || loggedUser.displayName || '';
          setJudgeNameInput(savedName);
          setPendingNextView('mentor');
          setShowJudgeNameModal(true);
        }
      }
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setDomainError(window.location.hostname);
      } else if (err?.code === 'auth/popup-closed-by-user') {
        // User just closed popup, no error needed
      } else {
        // Graceful fallback to Fast Judge entry
        console.warn("Google sign in failed, providing Judge flow:", err);
        handleJudgeQuickEntry();
      }
    }
  };

  // Safe Judge quick entry (never throws admin-restricted-operation errors)
  const handleJudgeQuickEntry = async () => {
    const jUser = getOrCreateLocalJudge();
    
    // Attempt Firebase guest login silently in background if available
    try {
      await signInGuest();
    } catch (e) {
      // Ignored: local judge profile handles everything reliably
      console.log("Using local judge profile");
    }

    const savedName = localStorage.getItem('vovinam_judge_name') || localStorage.getItem(`vovinam_judge_name_${jUser.uid}`) || '';
    if (!savedName.trim()) {
      setJudgeNameInput('');
      setPendingNextView('mentor');
      setShowJudgeNameModal(true);
    } else {
      setView('mentor');
    }
  };

  // Save mandatory Judge Name
  const handleSaveJudgeName = () => {
    const name = judgeNameInput.trim();
    if (!name) {
      alert("Vui lòng nhập Tên Giám định trước khi tiếp tục!");
      return;
    }

    localStorage.setItem('vovinam_judge_name', name);

    if (user) {
      localStorage.setItem(`vovinam_judge_name_${user.uid}`, name);
    }

    if (localJudgeUser) {
      localStorage.setItem(`vovinam_judge_name_${localJudgeUser.uid}`, name);
      setLocalJudgeUser(prev => prev ? { ...prev, displayName: name } : { uid: 'judge_local', displayName: name, email: null });
    }

    setShowJudgeNameModal(false);

    if (pendingNextView) {
      setView(pendingNextView);
      setPendingNextView(null);
    } else {
      setView('mentor');
    }
  };

  const handleUnlockAdminWithPin = () => {
    if (pinInput === 'vovinam2026' || pinInput === '123456') {
      setIsAdminUnlocked(true);
      setShowAdminPinModal(false);
      setPinInput('');
      setPinError('');
      setView('admin');
    } else {
      setPinError('Mật khẩu Admin không đúng (Mặc định: vovinam2026)');
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isAdmin = user?.email === 'doandeqn123@gmail.com' || isAdminUnlocked;
  const activeJudgeUser = user || localJudgeUser || { uid: 'judge_guest', displayName: localStorage.getItem('vovinam_judge_name') || 'Giám định viên', email: null };

  const renderView = () => {
    switch (view) {
      case 'admin':
        return isAdmin ? (
          <AdminDashboard performances={performances} matches={matches} settings={settings} onBack={() => setView('home')} />
        ) : (
          <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-inter">
            <Shield className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Yêu Cầu Quyền Quản Trị (Admin)</h2>
            <p className="text-slate-400 text-sm max-w-md mb-6">
              Bạn cần đăng nhập bằng tài khoản Admin chính thức hoặc mở khóa bằng Mật khẩu Admin để vào trang này.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setShowAdminPinModal(true)} className="px-6 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-sm">
                Nhập Mật Khẩu Admin
              </button>
              <button onClick={() => setView('home')} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-sm">
                Quay Lại Trang Chủ
              </button>
            </div>
          </div>
        );
      case 'mentor':
        return (
          <MentorDashboard 
            performances={performances} 
            matches={matches} 
            settings={settings} 
            user={activeJudgeUser as any} 
            onBack={() => setView('home')} 
          />
        );
      case 'event_bg':
        return <EventBackgroundView settings={settings} onBack={() => setView('home')} />;
      case 'led':
        return <PublicDisplay performances={performances} matches={matches} settings={settings} onBack={() => setView('home')} />;
      default:
        return (
          <div className="min-h-screen bg-[#070a13] text-white flex flex-col items-center justify-center p-6 relative select-none">
            {/* Background Ambient Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[140px] rounded-full" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-900/20 blur-[140px] rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] bg-amber-500/5 blur-[160px] rounded-full" />
            </div>

            {/* MANDATORY JUDGE NAME MODAL (Bắt buộc đặt tên nếu không phải Admin) */}
            <AnimatePresence>
              {showJudgeNameModal && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-slate-900 border-2 border-blue-500/50 p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl relative font-inter"
                  >
                    <div className="w-14 h-14 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 mb-5 mx-auto">
                      <UserIcon className="w-8 h-8" />
                    </div>

                    <h2 className="text-2xl font-black text-center mb-2 text-white uppercase tracking-wider font-bebas text-3xl">
                      XÁC NHẬN TÊN GIÁM ĐỊNH (JUDGE)
                    </h2>
                    <p className="text-slate-300 text-xs text-center mb-6 leading-relaxed">
                      Theo quy định, tất cả tài khoản Giám khảo chấm thi bắt buộc phải đặt tên để hiển thị trên phiếu chấm và hệ thống của Ban tổ chức.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                          Họ và tên hoặc Vị trí Giám định (*):
                        </label>
                        <input 
                          type="text" 
                          value={judgeNameInput}
                          onChange={e => setJudgeNameInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveJudgeName()}
                          placeholder="VD: Giám định 1 - Thầy Tuấn, Trọng tài Nguyễn Văn A..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 font-bold text-sm text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none"
                          autoFocus
                        />
                        <p className="text-[11px] text-amber-400 font-medium mt-2">
                          💡 Bạn có thể chọn tên nhanh: Giám định 1, Giám định 2, Giám định 3 hoặc điền Họ tên đầy đủ.
                        </p>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {['Giám định 1', 'Giám định 2', 'Giám định 3', 'Tổ Trưởng Trọng Tài'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setJudgeNameInput(preset)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-blue-950 border border-slate-700 hover:border-blue-500 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>

                      <button 
                        onClick={handleSaveJudgeName}
                        disabled={!judgeNameInput.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed py-3.5 rounded-xl font-bold text-sm text-white uppercase tracking-wider transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2"
                      >
                        <Check className="w-5 h-5" />
                        Xác Nhận & Vào Bảng Chấm Điểm
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Admin PIN Unlock Modal */}
            <AnimatePresence>
              {showAdminPinModal && (
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
                    className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative font-inter"
                  >
                    <button 
                      onClick={() => {
                        setShowAdminPinModal(false);
                        setPinError('');
                        setPinInput('');
                      }}
                      className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="w-14 h-14 bg-red-600/20 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-400 mb-6">
                      <KeyRound className="w-8 h-8" />
                    </div>

                    <h2 className="text-2xl font-bold mb-2">Nhập Mật khẩu Admin</h2>
                    <p className="text-slate-400 text-sm mb-6">
                      Mở quyền Quản trị trực tiếp không cần Google OAuth.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <input 
                          type="password" 
                          value={pinInput}
                          onChange={e => {
                            setPinInput(e.target.value);
                            setPinError('');
                          }}
                          onKeyDown={e => e.key === 'Enter' && handleUnlockAdminWithPin()}
                          placeholder="Mật khẩu Admin (vovinam2026)"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 font-semibold focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none text-white"
                          autoFocus
                        />
                        {pinError && <p className="text-red-400 text-xs mt-2 font-medium">{pinError}</p>}
                      </div>

                      <button 
                        onClick={handleUnlockAdminWithPin}
                        className="w-full bg-red-600 hover:bg-red-700 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-red-500/20 text-white"
                      >
                        Xác nhận Mở Quản trị
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10 relative z-10"
            >
              <h1 className="font-bebas text-6xl md:text-7xl mb-2 bg-gradient-to-r from-blue-400 via-amber-300 to-red-400 bg-clip-text text-transparent drop-shadow-md">
                VOVINAM SCORING SYSTEM
              </h1>
              <p className="font-montserrat text-slate-300 text-sm md:text-base font-bold tracking-[0.2em] uppercase">
                Hệ thống chấm điểm võ thuật Vovinam chuyên nghiệp
              </p>
            </motion.div>

            {/* Menu Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl relative z-10 font-inter">
              <MenuCard 
                title="Admin Quản trị" 
                description="Quản lý tiết mục, chọn võ sĩ thắng cuộc, quản lý slides & điều khiển màn hình LED"
                icon={<Shield className="w-8 h-8 text-red-500" />}
                onClick={() => {
                  if (isAdmin) {
                    setView('admin');
                  } else {
                    setShowAdminPinModal(true);
                  }
                }}
                disabled={false}
                badge={isAdmin ? 'Đã kích hoạt' : 'Nhấn để mở PIN/Admin'}
              />
              <MenuCard 
                title="Giám định (Mentor)" 
                description="Bắt buộc đặt tên Giám định và nhập điểm cho các bài thi quyền & võ nhạc"
                icon={<UserCheck className="w-8 h-8 text-blue-500" />}
                onClick={handleJudgeQuickEntry}
                disabled={false}
                badge={localStorage.getItem('vovinam_judge_name') ? `Tên: ${localStorage.getItem('vovinam_judge_name')}` : 'Bắt buộc đặt tên'}
              />
              <MenuCard 
                title="Màn hình LED Thi đấu" 
                description="Hiển thị võ sĩ đối kháng, bài thi quyền, bảng xếp hạng và công bố Quán quân"
                icon={<Monitor className="w-8 h-8 text-green-500" />}
                onClick={() => setView('led')}
              />
              <MenuCard 
                title="Background Sự kiện" 
                description="Chiếu phông nền sự kiện & luân phiên các slides theo điều khiển của Admin"
                icon={<Image className="w-8 h-8 text-amber-400" />}
                onClick={() => setView('event_bg')}
              />
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-10 flex flex-wrap justify-center items-center gap-4 relative z-10 font-inter">
              {!user ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGoogleSignIn}
                    className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-full font-semibold hover:bg-slate-100 transition-colors shadow-lg shadow-white/10 text-sm"
                  >
                    <LogIn className="w-5 h-5" />
                    Đăng nhập Google
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleJudgeQuickEntry}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-lg shadow-blue-500/20 text-sm"
                  >
                    <UserCheck className="w-5 h-5" />
                    Vào Chấm Điểm Giám Định
                  </motion.button>
                </>
              ) : (
                <div className="text-slate-400 flex flex-col sm:flex-row items-center gap-3 bg-slate-900/80 border border-slate-800 px-6 py-3 rounded-2xl">
                  <p className="text-xs sm:text-sm">
                    Đang đăng nhập: <span className="text-white font-bold">{user.displayName || user.email || 'Tài khoản Giám định'}</span> 
                    {isAdmin && <span className="text-xs bg-red-600/30 text-red-400 border border-red-500/30 px-2 py-0.5 rounded ml-2 font-bold">ADMIN</span>}
                  </p>
                  
                  {!isAdmin && (
                    <button 
                      onClick={() => {
                        setJudgeNameInput(localStorage.getItem(`vovinam_judge_name_${user.uid}`) || localStorage.getItem('vovinam_judge_name') || user.displayName || '');
                        setShowJudgeNameModal(true);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-bold underline flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Đổi Tên Giám Định
                    </button>
                  )}

                  <button 
                    onClick={() => { 
                      auth.signOut(); 
                      setIsAdminUnlocked(false); 
                    }} 
                    className="text-xs text-slate-400 underline hover:text-red-400 ml-2"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}

              {!isAdmin && (
                <button 
                  onClick={() => setShowAdminPinModal(true)}
                  className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Mở Quản trị bằng Mật khẩu
                </button>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="font-sans antialiased">
      {renderView()}
    </div>
  );
}

function MenuCard({ title, description, icon, onClick, disabled, badge }: any) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02, translateY: -5 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`p-8 rounded-3xl border text-left transition-all flex flex-col items-start gap-4 h-full relative overflow-hidden font-inter
        ${disabled 
          ? 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed' 
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-600 hover:shadow-2xl hover:shadow-blue-500/10 backdrop-blur-md'}`}
    >
      <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/60">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-black mb-2 text-white">{title}</h3>
        <p className="text-slate-400 text-xs leading-relaxed">{description}</p>
      </div>
      {badge && (
        <span className="mt-auto text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-3 py-1 rounded-xl border border-blue-800/40">
          {badge}
        </span>
      )}
    </motion.button>
  );
}
