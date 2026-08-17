import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { auth, db, signInWithGoogle, signInGuest } from './firebase';
import { Performance, Match, GlobalSettings } from './types';
import AdminDashboard from './components/AdminDashboard';
import MentorDashboard from './components/MentorDashboard';
import PublicDisplay from './components/PublicDisplay';
import EventBackgroundView from './components/EventBackgroundView';
import { LogIn, Shield, UserCheck, Monitor, Image, KeyRound, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [view, setView] = useState<'home' | 'admin' | 'mentor' | 'led' | 'event_bg'>('home');

  // Admin PIN fallback state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Domain error state
  const [domainError, setDomainError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
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

  const handleGoogleSignIn = async () => {
    setDomainError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setDomainError(window.location.hostname);
      } else {
        alert("Lỗi đăng nhập Google: " + (err?.message || "Không xác định"));
      }
    }
  };

  const handleGuestSignIn = async () => {
    try {
      await signInGuest();
    } catch (err: any) {
      alert("Không thể đăng nhập Chế độ Giám định: " + err.message);
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

  const renderView = () => {
    switch (view) {
      case 'admin':
        return isAdmin ? (
          <AdminDashboard performances={performances} matches={matches} settings={settings} onBack={() => setView('home')} />
        ) : (
          <div className="p-8 text-center text-white">Access Denied. Admin only.</div>
        );
      case 'mentor':
        return user ? (
          <MentorDashboard performances={performances} matches={matches} settings={settings} user={user} onBack={() => setView('home')} />
        ) : (
          <div className="p-8 text-center text-white">Please sign in to judge.</div>
        );
      case 'event_bg':
        return <EventBackgroundView settings={settings} onBack={() => setView('home')} />;
      case 'led':
        return <PublicDisplay performances={performances} matches={matches} settings={settings} onBack={() => setView('home')} />;
      default:
        return (
          <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative">
            {/* Domain Error Modal */}
            <AnimatePresence>
              {domainError && (
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
                    className="bg-slate-900 border border-amber-500/40 p-6 rounded-3xl max-w-lg w-full shadow-2xl relative"
                  >
                    <button 
                      onClick={() => setDomainError(null)}
                      className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-3 text-amber-400 mb-4">
                      <AlertTriangle className="w-8 h-8" />
                      <h3 className="text-xl font-bold text-white">Cần ủy quyền Tên miền Firebase</h3>
                    </div>

                    <p className="text-slate-300 text-sm leading-relaxed mb-4">
                      Tên miền hiện tại <span className="text-amber-400 font-mono font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">{domainError}</span> chưa được thêm vào Danh sách Tên miền Được cấp phép trong Firebase Console.
                    </p>

                    <div className="bg-slate-800/80 p-4 rounded-xl text-xs text-slate-300 space-y-2 mb-6 border border-slate-700">
                      <p className="font-bold text-amber-300">CÁCH KHẮC PHỤC TRÊN FIREBASE CONSOLE:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Vào Firebase Console project <span className="font-bold text-white">vovinam-a0793</span></li>
                        <li>Chọn <span className="font-bold text-white">Authentication</span> &rarr; Cài đặt (<span className="font-bold text-white">Settings</span>)</li>
                        <li>Chuyển qua tab <span className="font-bold text-white">Authorized domains</span></li>
                        <li>Bấm <span className="font-bold text-white">Add domain</span> và điền: <code className="text-amber-300 bg-black/50 px-1 py-0.5 rounded">{domainError}</code></li>
                      </ol>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => {
                          setDomainError(null);
                          handleGuestSignIn();
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
                      >
                        Đăng nhập Chế độ Giám định Nhanh (Không cần Google)
                      </button>
                      <button 
                        onClick={() => {
                          setDomainError(null);
                          setShowAdminPinModal(true);
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-sm text-slate-300 transition-all border border-slate-700"
                      >
                        Mở Admin bằng Mật khẩu
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
                    className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative"
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
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 font-semibold focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                          autoFocus
                        />
                        {pinError && <p className="text-red-400 text-xs mt-2 font-medium">{pinError}</p>}
                      </div>

                      <button 
                        onClick={handleUnlockAdminWithPin}
                        className="w-full bg-red-600 hover:bg-red-700 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-red-500/20"
                      >
                        Xác nhận Mở Quản trị
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10"
            >
              <h1 className="text-5xl font-extrabold mb-3 bg-gradient-to-r from-blue-400 via-amber-300 to-red-400 bg-clip-text text-transparent">
                Vovinam Scoring System
              </h1>
              <p className="text-slate-400 text-lg">Hệ thống chấm điểm võ thuật Vovinam chuyên nghiệp</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
              <MenuCard 
                title="Admin Quản trị" 
                description="Quản lý tiết mục, tạo trận đấu và điều khiển màn hình LED"
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
                description="Bắt buộc đặt tên Giám định và nhập điểm cho các tiết mục"
                icon={<UserCheck className="w-8 h-8 text-blue-500" />}
                onClick={() => {
                  if (!user) {
                    handleGuestSignIn();
                  }
                  setView('mentor');
                }}
                disabled={false}
                badge={user ? 'Đã đăng nhập' : 'Đăng nhập Nhanh'}
              />
              <MenuCard 
                title="Màn hình LED Thi đấu" 
                description="Hiển thị điểm số trực tiếp, võ sĩ và bảng xếp hạng"
                icon={<Monitor className="w-8 h-8 text-green-500" />}
                onClick={() => setView('led')}
              />
              <MenuCard 
                title="Background Sự kiện" 
                description="Chiếu phông nền sự kiện chính cho máy chiếu / màn hình LED"
                icon={<Image className="w-8 h-8 text-amber-400" />}
                onClick={() => setView('event_bg')}
              />
            </div>

            <div className="mt-10 flex flex-wrap justify-center items-center gap-4">
              {!user ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGoogleSignIn}
                    className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-full font-semibold hover:bg-slate-100 transition-colors shadow-lg shadow-white/10"
                  >
                    <LogIn className="w-5 h-5" />
                    Đăng nhập Google
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGuestSignIn}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-lg shadow-blue-500/20"
                  >
                    <UserCheck className="w-5 h-5" />
                    Đăng nhập Nhanh Giám định
                  </motion.button>
                </>
              ) : (
                <div className="text-slate-400 flex flex-col items-center gap-2 bg-slate-900/60 border border-slate-800 px-6 py-3 rounded-2xl">
                  <p>
                    Đang đăng nhập: <span className="text-white font-bold">{user.displayName || user.email || 'Tài khoản Giám định'}</span> 
                    {isAdmin && <span className="text-xs bg-red-600/30 text-red-400 border border-red-500/30 px-2 py-0.5 rounded ml-2">ADMIN</span>}
                  </p>
                  <button onClick={() => { auth.signOut(); setIsAdminUnlocked(false); }} className="text-xs text-slate-400 underline hover:text-white">Đăng xuất</button>
                </div>
              )}

              {!isAdmin && (
                <button 
                  onClick={() => setShowAdminPinModal(true)}
                  className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900/40 border border-slate-800 transition-all"
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
      className={`p-8 rounded-2xl border text-left transition-all flex flex-col items-start gap-4 h-full relative overflow-hidden
        ${disabled 
          ? 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed' 
          : 'bg-slate-900 border-slate-800 hover:border-slate-600 hover:shadow-2xl hover:shadow-blue-500/10'}`}
    >
      <div className="p-3 bg-slate-800 rounded-xl">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
      </div>
      {badge && (
        <span className="mt-auto text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/50 px-2.5 py-1 rounded-md border border-blue-800/40">
          {badge}
        </span>
      )}
    </motion.button>
  );
}

