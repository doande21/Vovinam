import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { auth, db, signInWithGoogle } from './firebase';
import { Performance, Match, GlobalSettings } from './types';
import AdminDashboard from './components/AdminDashboard';
import MentorDashboard from './components/MentorDashboard';
import PublicDisplay from './components/PublicDisplay';
import EventBackgroundView from './components/EventBackgroundView';
import { LogIn, Shield, UserCheck, Monitor, Image } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [view, setView] = useState<'home' | 'admin' | 'mentor' | 'led' | 'event_bg'>('home');

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

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isAdmin = user?.email === 'doandeqn123@gmail.com';

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
          <MentorDashboard performances={performances} settings={settings} user={user} onBack={() => setView('home')} />
        ) : (
          <div className="p-8 text-center text-white">Please sign in to judge.</div>
        );
      case 'event_bg':
        return <EventBackgroundView settings={settings} onBack={() => setView('home')} />;
      case 'led':
        return <PublicDisplay performances={performances} matches={matches} settings={settings} onBack={() => setView('home')} />;
      default:
        return (
          <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
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
                onClick={() => setView('admin')}
                disabled={!isAdmin}
                requireAdmin
              />
              <MenuCard 
                title="Giám định (Mentor)" 
                description="Bắt buộc đặt tên Giám định và nhập điểm cho các tiết mục"
                icon={<UserCheck className="w-8 h-8 text-blue-500" />}
                onClick={() => setView('mentor')}
                disabled={!user}
                requireAuth
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

            {!user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={signInWithGoogle}
                className="mt-10 flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-full font-semibold hover:bg-slate-100 transition-colors shadow-lg shadow-white/10"
              >
                <LogIn className="w-5 h-5" />
                Đăng nhập Giám định / Admin với Google
              </motion.button>
            )}

            {user && (
              <div className="mt-8 text-slate-400 flex flex-col items-center gap-2 bg-slate-900/60 border border-slate-800 px-6 py-3 rounded-2xl">
                <p>Đang đăng nhập: <span className="text-white font-bold">{user.displayName || user.email}</span> {isAdmin && <span className="text-xs bg-red-600/30 text-red-400 border border-red-500/30 px-2 py-0.5 rounded ml-2">ADMIN</span>}</p>
                <button onClick={() => auth.signOut()} className="text-xs text-slate-400 underline hover:text-white">Đăng xuất</button>
              </div>
            )}
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

function MenuCard({ title, description, icon, onClick, disabled, requireAuth, requireAdmin }: any) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02, translateY: -5 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`p-8 rounded-2xl border text-left transition-all flex flex-col items-start gap-4 h-full
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
      {disabled && (
        <span className="mt-auto text-xs font-semibold uppercase tracking-wider text-red-400">
          {requireAdmin ? 'Yêu cầu quyền Admin' : requireAuth ? 'Yêu cầu đăng nhập' : ''}
        </span>
      )}
    </motion.button>
  );
}
