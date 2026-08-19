import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { Performance, Match, GlobalSettings, ActiveView, BackgroundSlide } from '../types';
import { 
  Plus, Trash2, Play, Pause, Trophy, ArrowLeft, Users, Swords, Settings as SettingsIcon, 
  Eye, EyeOff, Tv, Monitor, RotateCcw, Image, Upload, Sparkles, X, Check, Crown, 
  Sliders, Link as LinkIcon, StickyNote, RefreshCw, ChevronRight, ChevronLeft, Shield, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  performances: Performance[];
  matches: Match[];
  settings: GlobalSettings | null;
  onBack: () => void;
}

export default function AdminDashboard({ performances, matches, settings, onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'thi_quyen' | 'vo_nhac' | 'combat' | 'backgrounds' | 'settings'>('combat');
  
  // Performance State
  const [newPerf, setNewPerf] = useState({ name: '', competitor: '', bgUrl: '' });
  
  // Combat State
  const [newMatch, setNewMatch] = useState({ 
    redName: '', 
    blueName: '', 
    redUnit: '',
    blueUnit: '',
    redPhoto: '', 
    bluePhoto: '',
    redCelebration: '',
    blueCelebration: '',
    weightClass: 'Hạng cân 55kg'
  });

  // Slide / Background Manager State
  const [newSlide, setNewSlide] = useState({
    title: '',
    note: '',
    url: ''
  });
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editSlideData, setEditSlideData] = useState({ title: '', note: '', url: '' });

  // Event Meta Info
  const [eventMeta, setEventMeta] = useState({
    eventTitle: settings?.eventTitle || 'VÕ VIỆT TRANH HÙNG ĐOẠT CÓC VƯƠNG 2026',
    eventSubtitle: settings?.eventSubtitle || 'GIẢI VOVINAM - VIỆT VÕ ĐẠO MỞ RỘNG',
    organizer: settings?.organizer || 'TRƯỜNG ĐẠI HỌC FPT',
    eventBgUrl: settings?.eventBgUrl || ''
  });

  // Preset sample backgrounds
  const bgPresets = [
    {
      title: 'Phông Khai Mạc Hoàng Kim',
      note: 'Dùng chiếu lúc khai mạc, đón đại biểu & phát biểu',
      url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1920&auto=format&fit=crop&q=80',
      thumb: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=80'
    },
    {
      title: 'Võ Đường Truyền Thống Vovinam',
      note: 'Phông nền biểu diễn bài quyền & võ nhạc tôn vinh võ đạo',
      url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1920&auto=format&fit=crop&q=80',
      thumb: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&auto=format&fit=crop&q=80'
    },
    {
      title: 'Sàn Đấu Đối Kháng Bốc Lửa',
      note: 'Phông nền hiệu ứng ánh sáng đỏ xanh rực lửa thi đấu',
      url: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1920&auto=format&fit=crop&q=80',
      thumb: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=200&auto=format&fit=crop&q=80'
    },
    {
      title: 'Lễ Trao Giải & Bế Mạc',
      note: 'Phông nền vinh danh quán quân và trao huy chương',
      url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1920&auto=format&fit=crop&q=80',
      thumb: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200&auto=format&fit=crop&q=80'
    }
  ];

  // Global settings updater
  const setLEDView = async (view: ActiveView, id: string | null = null) => {
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        activeView: view,
        activeId: id
      }, { merge: true });
    } catch (error) {
      console.error("Error setting LED view:", error);
    }
  };

  const toggleLeaderboardVisibility = async (show: boolean) => {
    await setDoc(doc(db, 'settings', 'global'), {
      showScoresAndLeaderboard: show
    }, { merge: true });
  };

  // Performance Functions
  const addPerformance = async (category: 'thi_quyen' | 'vo_nhac') => {
    if (!newPerf.name || !newPerf.competitor) return;
    try {
      await addDoc(collection(db, 'performances'), {
        ...newPerf,
        category,
        scores: {},
        averageScore: 0,
        status: 'pending',
        order: performances.filter(p => (p.category || 'thi_quyen') === category).length + 1,
        createdAt: new Date().toISOString()
      });
      setNewPerf({ name: '', competitor: '', bgUrl: '' });
    } catch (error) {
      console.error("Error adding performance:", error);
    }
  };

  // Combat Functions
  const addMatch = async () => {
    if (!newMatch.redName || !newMatch.blueName) return;
    try {
      await addDoc(collection(db, 'matches'), {
        redCorner: { 
          name: newMatch.redName, 
          unit: newMatch.redUnit || 'Đoàn VĐV Đỏ',
          photoUrl: newMatch.redPhoto || `https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80`,
          celebrationPhotoUrl: newMatch.redCelebration || newMatch.redPhoto || `https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80`
        },
        blueCorner: { 
          name: newMatch.blueName, 
          unit: newMatch.blueUnit || 'Đoàn VĐV Xanh',
          photoUrl: newMatch.bluePhoto || `https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80`,
          celebrationPhotoUrl: newMatch.blueCelebration || newMatch.bluePhoto || `https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80`
        },
        round: 1,
        timeRemaining: 120,
        isTimerRunning: false,
        weightClass: newMatch.weightClass || 'Hạng cân 55kg',
        victoryMethod: 'THẮNG TRẬN (WINNER)',
        winner: null,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setNewMatch({ 
        redName: '', 
        blueName: '', 
        redUnit: '', 
        blueUnit: '', 
        redPhoto: '', 
        bluePhoto: '', 
        redCelebration: '', 
        blueCelebration: '',
        weightClass: 'Hạng cân 55kg'
      });
    } catch (error) {
      console.error("Error adding match:", error);
    }
  };

  // Declare Winner directly by clicking on Red or Blue
  const handleDeclareWinner = async (matchId: string, winner: 'red' | 'blue', victoryMethod = 'THẮNG ĐIỂM (POINTS)') => {
    try {
      await updateDoc(doc(db, 'matches', matchId), {
        winner,
        status: 'completed',
        victoryMethod
      });
      await updateDoc(doc(db, 'settings', 'global'), {
        showWinnerAnimation: true
      });
    } catch (err) {
      console.error('Error declaring winner:', err);
    }
  };

  const handleResetWinner = async (matchId: string) => {
    try {
      await updateDoc(doc(db, 'matches', matchId), {
        winner: null,
        status: 'pending'
      });
      await updateDoc(doc(db, 'settings', 'global'), {
        showWinnerAnimation: false
      });
    } catch (err) {
      console.error('Error resetting winner:', err);
    }
  };

  // Slides / Background Manager Functions
  const currentSlides: BackgroundSlide[] = settings?.slides || [
    {
      id: 'default_1',
      title: 'Phông Khai Mạc Giải Đấu Vovinam 2026',
      note: 'Dùng chiếu đầu giờ đón khách & lễ khai mạc',
      url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1920&auto=format&fit=crop&q=80',
      active: true,
      order: 1
    },
    {
      id: 'default_2',
      title: 'Võ Đường Truyền Thống Vovinam FPT',
      note: 'Chiếu giữa các bài biểu diễn quyền võ đạo',
      url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1920&auto=format&fit=crop&q=80',
      active: false,
      order: 2
    }
  ];

  const handleAddSlide = async (andBroadcast = false) => {
    if (!newSlide.url || !newSlide.title) {
      alert('Vui lòng nhập Tiêu đề / Ghi chú nhận biết và Link URL hoặc Tải ảnh lên!');
      return;
    }

    const slideId = 'slide_' + Date.now();
    const newSlideItem: BackgroundSlide = {
      id: slideId,
      title: newSlide.title.trim(),
      note: newSlide.note.trim() || undefined,
      url: newSlide.url.trim(),
      active: andBroadcast,
      order: currentSlides.length + 1,
      createdAt: new Date().toISOString()
    };

    const updatedSlides = [...currentSlides, newSlideItem];

    const updates: Partial<GlobalSettings> = {
      slides: updatedSlides
    };

    if (andBroadcast) {
      updates.activeSlideId = slideId;
      updates.eventBgUrl = newSlideItem.url;
      updates.activeView = 'event';
    }

    await setDoc(doc(db, 'settings', 'global'), updates, { merge: true });
    setNewSlide({ title: '', note: '', url: '' });
  };

  const handleBroadcastSlide = async (slide: BackgroundSlide) => {
    await setDoc(doc(db, 'settings', 'global'), {
      activeSlideId: slide.id,
      eventBgUrl: slide.url,
      activeView: 'event'
    }, { merge: true });
  };

  const handleDeleteSlide = async (slideId: string) => {
    const updated = currentSlides.filter(s => s.id !== slideId);
    await setDoc(doc(db, 'settings', 'global'), {
      slides: updated,
      activeSlideId: settings?.activeSlideId === slideId ? (updated[0]?.id || null) : settings?.activeSlideId,
      eventBgUrl: settings?.activeSlideId === slideId ? (updated[0]?.url || '') : settings?.eventBgUrl
    }, { merge: true });
  };

  const handleToggleAutoSlideshow = async () => {
    const nextState = !settings?.isAutoSlideshow;
    await setDoc(doc(db, 'settings', 'global'), {
      isAutoSlideshow: nextState,
      activeView: 'event'
    }, { merge: true });
  };

  const handleSetInterval = async (interval: number) => {
    await setDoc(doc(db, 'settings', 'global'), {
      slideshowInterval: interval
    }, { merge: true });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isForNewSlide = true) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("File ảnh lớn hơn 8MB. Vui lòng chọn ảnh nhẹ hơn để lưu trữ nhanh chóng!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (dataUrl) {
        if (isForNewSlide) {
          setNewSlide(prev => ({
            ...prev,
            url: dataUrl,
            title: prev.title || file.name.replace(/\.[^/.]+$/, '')
          }));
        } else {
          setEventMeta(prev => ({ ...prev, eventBgUrl: dataUrl }));
          setDoc(doc(db, 'settings', 'global'), {
            eventBgUrl: dataUrl
          }, { merge: true }).catch(console.error);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const saveSlideEdit = async (slideId: string) => {
    const updated = currentSlides.map(s => {
      if (s.id === slideId) {
        return {
          ...s,
          title: editSlideData.title,
          note: editSlideData.note,
          url: editSlideData.url
        };
      }
      return s;
    });

    await setDoc(doc(db, 'settings', 'global'), {
      slides: updated
    }, { merge: true });
    setEditingSlideId(null);
  };

  const saveEventMeta = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        ...eventMeta
      }, { merge: true });
      alert("Đã lưu thông tin sự kiện & phông nền thành công!");
    } catch (error) {
      console.error("Error saving event meta:", error);
    }
  };

  const isLeaderboardHidden = !settings?.showScoresAndLeaderboard;

  return (
    <div className="min-h-screen bg-[#070a13] text-white p-4 md:p-8 font-sans select-none">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl transition-all"
              title="Quay lại"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-amber-400" />
                <h1 className="font-bebas text-3xl md:text-4xl text-white tracking-wider">
                  BẢNG ĐIỀU KHIỂN BAN TỔ CHỨC (ADMIN)
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-inter mt-0.5">
                Quản lý thi đấu, công bố người thắng cuộc và luân phiên chiếu nội dung trực tiếp
              </p>
            </div>
          </div>

          {/* Quick Broadcast Status */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl font-inter">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">MÀN HÌNH LED ĐANG CHIẾU</span>
              <span className="text-xs font-black text-amber-400 uppercase">
                {settings?.activeView === 'combat' || settings?.activeView === 'combat_led' ? 'Trận Đối Kháng' :
                 settings?.activeView === 'event' ? 'Phông Nền & Slides Sự Kiện' :
                 settings?.activeView === 'forms' ? 'Tiết Mục Biểu Diễn' : 'Màn Hình Chờ'}
              </span>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="flex flex-wrap gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl font-inter">
          <TabButton 
            active={activeTab === 'combat'} 
            onClick={() => setActiveTab('combat')}
            icon={<Crown className="w-4 h-4 text-red-400" />}
            label="ĐỐI KHÁNG (BẤM CHỌN THẮNG)" 
          />
          <TabButton 
            active={activeTab === 'backgrounds'} 
            onClick={() => setActiveTab('backgrounds')}
            icon={<Image className="w-4 h-4 text-amber-400" />}
            label="QUẢN LÝ BACKGROUND & SLIDES" 
          />
          <TabButton 
            active={activeTab === 'thi_quyen'} 
            onClick={() => setActiveTab('thi_quyen')}
            icon={<Users className="w-4 h-4 text-blue-400" />}
            label="THI QUYỀN" 
          />
          <TabButton 
            active={activeTab === 'vo_nhac'} 
            onClick={() => setActiveTab('vo_nhac')}
            icon={<Flame className="w-4 h-4 text-emerald-400" />}
            label="VÕ NHẠC" 
          />
          <TabButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<SettingsIcon className="w-4 h-4 text-slate-400" />}
            label="CÀI ĐẶT SỰ KIỆN" 
          />
        </nav>

        {/* ========================================================================= */}
        {/* TAB 1: COMBAT MANAGEMENT (BỎ CHẤM ĐIỂM, CHỌN NGƯỜI THẮNG BẰNG 1 CÚ NHẤP) */}
        {/* ========================================================================= */}
        {activeTab === 'combat' && (
          <div className="space-y-6">
            {/* Guide Card */}
            <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-blue-950/40 p-6 rounded-2xl border border-slate-800 font-inter">
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-6 h-6 text-amber-400" />
                <h3 className="text-lg font-black text-amber-400 uppercase tracking-wider">
                  ĐIỀU HÀNH ĐỐI KHÁNG - CÔNG BỐ NGƯỜI THẮNG CUỘC
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                Theo thể thức mới: <strong>Không hiển thị bảng điểm số</strong> trên màn hình công chiếu. Khi tổ trọng tài công bố kết quả, bạn chỉ cần <strong>nhấn vào hình hoặc nút của võ sĩ thắng</strong> (Đỏ hoặc Xanh) để màn hình LED lập tức phát hoạt cảnh vinh danh quán quân hoành tráng!
              </p>
            </div>

            {/* Form Tạo Trận Đấu Mới */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 font-inter">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <Plus className="w-5 h-5 text-red-500" /> Tạo trận đấu đối kháng mới
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                {/* Góc Đỏ */}
                <div className="space-y-3 bg-red-950/20 p-4 rounded-xl border border-red-900/40">
                  <h4 className="text-xs font-black text-red-400 uppercase tracking-wider">VÕ SĨ GÓC ĐỎ (RED CORNER)</h4>
                  <input 
                    placeholder="Họ và tên võ sĩ Đỏ (*)" 
                    value={newMatch.redName} 
                    onChange={e => setNewMatch({...newMatch, redName: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none text-white font-medium"
                  />
                  <input 
                    placeholder="Đơn vị / CLB / Trường (VD: Vovinam FPT Cần Thơ)" 
                    value={newMatch.redUnit} 
                    onChange={e => setNewMatch({...newMatch, redUnit: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none text-slate-300"
                  />
                  <input 
                    placeholder="URL ảnh võ sĩ Đỏ (Link ảnh)" 
                    value={newMatch.redPhoto} 
                    onChange={e => setNewMatch({...newMatch, redPhoto: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none text-slate-400 font-mono"
                  />
                </div>

                {/* Góc Xanh */}
                <div className="space-y-3 bg-blue-950/20 p-4 rounded-xl border border-blue-900/40">
                  <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider">VÕ SĨ GÓC XANH (BLUE CORNER)</h4>
                  <input 
                    placeholder="Họ và tên võ sĩ Xanh (*)" 
                    value={newMatch.blueName} 
                    onChange={e => setNewMatch({...newMatch, blueName: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none text-white font-medium"
                  />
                  <input 
                    placeholder="Đơn vị / CLB / Trường (VD: Vovinam TP.HCM)" 
                    value={newMatch.blueUnit} 
                    onChange={e => setNewMatch({...newMatch, blueUnit: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none text-slate-300"
                  />
                  <input 
                    placeholder="URL ảnh võ sĩ Xanh (Link ảnh)" 
                    value={newMatch.bluePhoto} 
                    onChange={e => setNewMatch({...newMatch, bluePhoto: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none text-slate-400 font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  placeholder="Hạng cân (VD: Hạng cân 55KG Nam)" 
                  value={newMatch.weightClass} 
                  onChange={e => setNewMatch({...newMatch, weightClass: e.target.value})}
                  className="sm:w-1/2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none text-white"
                />
                <button 
                  onClick={addMatch} 
                  className="sm:w-1/2 bg-red-600 hover:bg-red-500 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 text-white"
                >
                  <Plus className="w-4 h-4" /> Thêm Trận Đấu Đối Kháng
                </button>
              </div>
            </div>

            {/* Danh sách các Trận Đấu */}
            <div className="grid gap-6">
              {matches.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 font-inter">
                  <Swords className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Chưa có trận đấu nào. Hãy tạo trận đấu mới ở phía trên!</p>
                </div>
              ) : (
                matches.map(m => (
                  <div 
                    key={m.id} 
                    className={`p-6 rounded-3xl border transition-all ${settings?.activeId === m.id && (settings?.activeView === 'combat' || settings?.activeView === 'combat_led') ? 'bg-slate-900 border-amber-500 shadow-2xl ring-1 ring-amber-500/50' : 'bg-slate-900/80 border-slate-800'}`}
                  >
                    {/* Top Bar: Hạng cân & Nút Chiếu */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6 font-inter">
                      <div className="flex items-center gap-3">
                        <span className="px-3.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-black uppercase tracking-wider">
                          {m.weightClass || 'HẠNG CÂN 55KG'}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">
                          Trận: Round {m.round || 1}
                        </span>
                        {m.winner && (
                          <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${m.winner === 'red' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                            <Crown className="w-3.5 h-3.5 text-amber-300" />
                            ĐÃ THẮNG: {m.winner === 'red' ? m.redCorner.name : m.blueCorner.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setLEDView('combat_led', m.id)}
                          className={`px-5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${settings?.activeId === m.id && (settings?.activeView === 'combat_led' || settings?.activeView === 'combat') ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 ring-2 ring-red-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
                        >
                          <Monitor className="w-4 h-4" /> Chiếu Lên LED Sân Đấu
                        </button>
                        <button 
                          onClick={() => deleteDoc(doc(db, 'matches', m.id))} 
                          className="p-2 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-xl transition-colors"
                          title="Xóa trận đấu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* TWO FIGHTERS FACE-OFF CARDS - CLICK TO CHOOSE WINNER */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* RED CORNER CARD */}
                      <div 
                        onClick={() => handleDeclareWinner(m.id, 'red')}
                        className={`group cursor-pointer relative overflow-hidden rounded-2xl border-2 transition-all p-5 flex flex-col justify-between ${m.winner === 'red' ? 'bg-red-950/80 border-red-500 ring-4 ring-red-500/50 shadow-2xl shadow-red-600/30' : 'bg-gradient-to-br from-red-950/40 via-slate-900 to-black border-red-900/40 hover:border-red-500'}`}
                      >
                        <div className="flex items-center gap-4">
                          <img 
                            src={m.redCorner.photoUrl} 
                            alt={m.redCorner.name} 
                            className="w-20 h-20 rounded-2xl object-cover object-top border-2 border-red-500 shadow-md group-hover:scale-105 transition-transform" 
                          />
                          <div className="flex-1">
                            <span className="text-[11px] font-black text-red-400 uppercase tracking-widest block">GÓC ĐỎ (RED)</span>
                            <h4 className="font-montserrat text-2xl font-black text-white group-hover:text-red-300 transition-colors">
                              {m.redCorner.name}
                            </h4>
                            <p className="text-xs text-slate-400 font-inter">{m.redCorner.unit || 'Đoàn VĐV Đỏ'}</p>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-red-900/30 flex items-center justify-between font-inter">
                          <button 
                            type="button"
                            className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${m.winner === 'red' ? 'bg-red-600 text-white shadow-lg' : 'bg-red-950/80 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/40'}`}
                          >
                            <Crown className="w-4 h-4 text-amber-300" />
                            {m.winner === 'red' ? '👑 ĐANG LÀ NGƯỜI THẮNG CUỘC' : '👉 BẤM VÀO ĐÂY ĐỂ CHỌN ĐỎ THẮNG'}
                          </button>
                        </div>
                      </div>

                      {/* BLUE CORNER CARD */}
                      <div 
                        onClick={() => handleDeclareWinner(m.id, 'blue')}
                        className={`group cursor-pointer relative overflow-hidden rounded-2xl border-2 transition-all p-5 flex flex-col justify-between ${m.winner === 'blue' ? 'bg-blue-950/80 border-blue-500 ring-4 ring-blue-500/50 shadow-2xl shadow-blue-600/30' : 'bg-gradient-to-br from-blue-950/40 via-slate-900 to-black border-blue-900/40 hover:border-blue-500'}`}
                      >
                        <div className="flex items-center gap-4">
                          <img 
                            src={m.blueCorner.photoUrl} 
                            alt={m.blueCorner.name} 
                            className="w-20 h-20 rounded-2xl object-cover object-top border-2 border-blue-500 shadow-md group-hover:scale-105 transition-transform" 
                          />
                          <div className="flex-1">
                            <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest block">GÓC XANH (BLUE)</span>
                            <h4 className="font-montserrat text-2xl font-black text-white group-hover:text-blue-300 transition-colors">
                              {m.blueCorner.name}
                            </h4>
                            <p className="text-xs text-slate-400 font-inter">{m.blueCorner.unit || 'Đoàn VĐV Xanh'}</p>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-blue-900/30 flex items-center justify-between font-inter">
                          <button 
                            type="button"
                            className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${m.winner === 'blue' ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-950/80 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/40'}`}
                          >
                            <Crown className="w-4 h-4 text-amber-300" />
                            {m.winner === 'blue' ? '👑 ĐANG LÀ NGƯỜI THẮNG CUỘC' : '👉 BẤM VÀO ĐÂY ĐỂ CHỌN XANH THẮNG'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Reset Winner Button if Winner Selected */}
                    {m.winner && (
                      <div className="mt-4 pt-3 flex items-center justify-end font-inter">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResetWinner(m.id);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Hủy kết quả người thắng (Đấu lại / Bỏ chọn)
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: QUẢN LÝ BACKGROUND & SLIDES (CÓ GHI CHÚ NOTE & LINK URL LUÂN PHIÊN) */}
        {/* ========================================================================= */}
        {activeTab === 'backgrounds' && (
          <div className="space-y-6">
            {/* Live Controller Bar */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 font-inter">
              <div>
                <h3 className="text-lg font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-5 h-5" /> BỘ ĐIỀU KHIỂN CHIẾU BACKGROUND & SLIDES TRỰC TIẾP
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Luân phiên chiếu trực tiếp các hình nền, banner khai mạc, nhà tài trợ, phông thi đấu lên màn hình LED
                </p>
              </div>

              {/* Auto Slideshow Toggle */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleToggleAutoSlideshow}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${settings?.isAutoSlideshow ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}`}
                >
                  <RefreshCw className={`w-4 h-4 ${settings?.isAutoSlideshow ? 'animate-spin' : ''}`} />
                  {settings?.isAutoSlideshow ? 'ĐANG TỰ ĐỘNG LUÂN PHIÊN SLIDES' : 'BẬT TỰ ĐỘNG CHUYỂN SLIDES'}
                </button>

                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400">Thời gian:</span>
                  {[5, 10, 15, 30].map(secs => (
                    <button
                      key={secs}
                      onClick={() => handleSetInterval(secs)}
                      className={`px-2 py-1 rounded text-xs font-bold transition-all ${(settings?.slideshowInterval || 10) === secs ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
                    >
                      {secs}s
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setLEDView('event')}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${settings?.activeView === 'event' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                >
                  <Play className="w-4 h-4" /> Chiếu Ngay Lên LED
                </button>
              </div>
            </div>

            {/* Form Thêm Slide / Background Mới */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 font-inter space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" /> Thêm Background / Nội Dung Mới Vào Danh Sách
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ô Tên & Ghi chú */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <StickyNote className="w-3.5 h-3.5 text-amber-400" />
                      Tên / Ghi chú nhận biết (*):
                    </label>
                    <input 
                      type="text"
                      placeholder="VD: Phông Khai Mạc, Banner Nhà Tài Trợ, Background 55kg..."
                      value={newSlide.title}
                      onChange={e => setNewSlide({ ...newSlide, title: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Ghi chú chi tiết / Thời điểm chiếu:
                    </label>
                    <input 
                      type="text"
                      placeholder="VD: Chiếu lúc đón đại biểu 8h00, hoặc giờ giải lao 15 phút..."
                      value={newSlide.note}
                      onChange={e => setNewSlide({ ...newSlide, note: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-300 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Ô Nhập Link URL hoặc Tải Ảnh */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                      Đường dẫn URL ảnh (*):
                    </label>
                    <input 
                      type="text"
                      placeholder="https://images.unsplash.com/photo-... hoặc link Google Drive"
                      value={newSlide.url}
                      onChange={e => setNewSlide({ ...newSlide, url: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-2 transition-colors">
                      <Upload className="w-4 h-4 text-amber-400" /> Hoặc tải ảnh từ máy tính
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, true)} className="hidden" />
                    </label>
                    {newSlide.url && (
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Đã có ảnh
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => handleAddSlide(false)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  Lưu vào Danh sách
                </button>
                <button
                  onClick={() => handleAddSlide(true)}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" /> Lưu & Chiếu Lên LED Ngay
                </button>
              </div>
            </div>

            {/* Gợi Ý Nhanh Các Mẫu Background Chuẩn */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 font-inter">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Gợi Ý Mẫu Background Vovinam Chuẩn HD (Bấm để thêm nhanh vào danh sách):
                </h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {bgPresets.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setNewSlide({
                        title: preset.title,
                        note: preset.note,
                        url: preset.url
                      });
                    }}
                    className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-800 hover:border-amber-400 bg-slate-950 p-2 transition-all"
                  >
                    <div className="aspect-video rounded-xl overflow-hidden relative mb-2">
                      <img src={preset.thumb} alt={preset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <p className="text-xs font-bold text-white truncate">{preset.title}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{preset.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Danh Sách Các Slide Đang Quản Lý */}
            <div className="space-y-3 font-inter">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                DANH SÁCH BACKGROUND & SLIDES TRÌNH CHIẾU ({currentSlides.length})
              </h3>

              <div className="grid gap-4">
                {currentSlides.map((slide, idx) => {
                  const isCurrentActive = (settings?.activeSlideId === slide.id || settings?.eventBgUrl === slide.url) && settings?.activeView === 'event';
                  const isEditing = editingSlideId === slide.id;

                  return (
                    <div
                      key={slide.id}
                      className={`p-4 md:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${isCurrentActive ? 'bg-slate-900 border-amber-500 ring-2 ring-amber-500/40 shadow-xl' : 'bg-slate-900/80 border-slate-800'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-28 h-18 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-black aspect-video">
                          <img src={slide.url} alt={slide.title} className="w-full h-full object-cover" />
                          <span className="absolute top-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            #{idx + 1}
                          </span>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2 flex-1">
                            <input 
                              value={editSlideData.title}
                              onChange={e => setEditSlideData({...editSlideData, title: e.target.value})}
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                              placeholder="Tiêu đề / Tên nhận biết"
                            />
                            <input 
                              value={editSlideData.note}
                              onChange={e => setEditSlideData({...editSlideData, note: e.target.value})}
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300"
                              placeholder="Ghi chú chi tiết"
                            />
                            <input 
                              value={editSlideData.url}
                              onChange={e => setEditSlideData({...editSlideData, url: e.target.value})}
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-400"
                              placeholder="Link URL ảnh"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => saveSlideEdit(slide.id)} className="px-3 py-1 bg-emerald-600 rounded text-xs font-bold text-white">Lưu</button>
                              <button onClick={() => setEditingSlideId(null)} className="px-3 py-1 bg-slate-700 rounded text-xs text-slate-300">Hủy</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base text-white">{slide.title}</h4>
                              {isCurrentActive && (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                                  ĐANG CHIẾU TRỰC TIẾP
                                </span>
                              )}
                            </div>
                            {slide.note && (
                              <p className="text-xs text-amber-300 font-medium mt-1 flex items-center gap-1">
                                <StickyNote className="w-3 h-3 text-amber-400" />
                                {slide.note}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-500 font-mono truncate max-w-md mt-1">
                              {slide.url}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                          onClick={() => handleBroadcastSlide(slide)}
                          className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${isCurrentActive ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
                        >
                          <Play className="w-4 h-4" /> {isCurrentActive ? 'Đang Chiếu' : 'Chiếu Slide Này'}
                        </button>

                        <button
                          onClick={() => {
                            setEditingSlideId(slide.id);
                            setEditSlideData({ title: slide.title, note: slide.note || '', url: slide.url });
                          }}
                          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                          title="Sửa ghi chú / URL"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteSlide(slide.id)}
                          className="p-2.5 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-xl transition-colors"
                          title="Xóa slide"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3 & 4: THI QUYỀN & VÕ NHẠC */}
        {/* ========================================================================= */}
        {(activeTab === 'thi_quyen' || activeTab === 'vo_nhac') && (
          <div className="space-y-6 font-inter">
            {/* Chế độ Màn hình Công Chiếu LED & Bật/Tắt Show Kết Quả */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">
                    ĐIỀU KHIỂN CÔNG BỐ KẾT QUẢ & BẢNG ĐIỂM (LED)
                  </h3>
                </div>
                <p className="text-xs text-slate-300">
                  {isLeaderboardHidden 
                    ? 'Chế độ hiện tại: Đang ẨN ĐIỂM (Chấm kín). Khán giả chỉ thấy tên bài thi & VĐV.' 
                    : 'Chế độ hiện tại: ĐANG SHOW KẾT QUẢ & BẢNG XẾP HẠNG chính thức trên màn hình LED!'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => toggleLeaderboardVisibility(isLeaderboardHidden)}
                  className={`px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-lg ${
                    isLeaderboardHidden 
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-400/50 animate-pulse' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/40 ring-2 ring-emerald-400/50'
                  }`}
                >
                  {isLeaderboardHidden ? (
                    <>
                      <Eye className="w-4 h-4" />
                      BẬT SHOW KẾT QUẢ & BẢNG XẾP HẠNG LÊN LED
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      ĐANG SHOW KẾT QUẢ (BẤM ĐỂ ẨN / CHẤM KÍN)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Form Thêm Tiết Mục */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
              <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-white">
                <Plus className="w-5 h-5 text-blue-400" /> Thêm tiết mục {activeTab === 'thi_quyen' ? 'Thi Quyền' : 'Võ Nhạc'} mới
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                  placeholder="Tên bài thi (VD: Long Hổ Quyền, Tứ Tượng...)" 
                  value={newPerf.name} 
                  onChange={e => setNewPerf({...newPerf, name: e.target.value})}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
                <input 
                  placeholder="Họ tên VĐV / Đơn vị thực hiện" 
                  value={newPerf.competitor} 
                  onChange={e => setNewPerf({...newPerf, competitor: e.target.value})}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
                <button 
                  onClick={() => addPerformance(activeTab as 'thi_quyen' | 'vo_nhac')} 
                  className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold text-sm transition-colors text-white shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Thêm Tiết Mục
                </button>
              </div>
            </div>

            {/* Danh Sách Tiết Mục */}
            <div className="grid gap-4">
              {performances.filter(p => (p.category || 'thi_quyen') === activeTab).length === 0 ? (
                <div className="text-center py-12 bg-slate-900/60 rounded-3xl border border-slate-800">
                  <p className="text-slate-400 text-sm">Chưa có tiết mục nào trong danh sách. Hãy thêm tiết mục ở trên!</p>
                </div>
              ) : (
                performances.filter(p => (p.category || 'thi_quyen') === activeTab).map(p => {
                  const isCurrentActive = settings?.activeId === p.id && settings?.activeView === 'forms';
                  const isShowingScores = isCurrentActive && !isLeaderboardHidden;
                  const scoresCount = Object.keys(p.scores || {}).length;

                  return (
                    <div 
                      key={p.id} 
                      className={`p-5 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                        isCurrentActive 
                          ? 'bg-blue-950/40 border-blue-500 shadow-2xl ring-1 ring-blue-500/50' 
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-montserrat font-black text-xl text-white">{p.name}</h3>
                          {isCurrentActive && (
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider">
                              ĐANG CHIẾU
                            </span>
                          )}
                          {isShowingScores && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider animate-pulse">
                              ĐANG SHOW KẾT QUẢ
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300 text-sm font-bold font-montserrat">{p.competitor}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800 text-right min-w-[120px]">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">{scoresCount} giám khảo nộp</p>
                          <p className="text-2xl font-losttype font-score font-black text-amber-400 leading-tight">
                            {p.averageScore ? p.averageScore.toFixed(2) : '0.00'}
                          </p>
                        </div>

                        {/* Nút Chiếu Biểu Diễn (Chấm Kín) */}
                        <button 
                          onClick={() => setLEDView('forms', p.id)}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                            isCurrentActive && isLeaderboardHidden 
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                          title="Chiếu phông thi đấu lên LED (Chấm kín)"
                        >
                          <Play className="w-4 h-4" /> Chiếu LED
                        </button>

                        {/* Nút Công Bố Kết Quả / Show Điểm Ngay */}
                        <button 
                          onClick={async () => {
                            await setLEDView('forms', p.id);
                            await toggleLeaderboardVisibility(true);
                          }}
                          className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                            isShowingScores 
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400' 
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                          }`}
                        >
                          <Trophy className="w-4 h-4" />
                          {isShowingScores ? 'Đang Show Điểm' : 'Show Kết Quả'}
                        </button>

                        <button 
                          onClick={() => deleteDoc(doc(db, 'performances', p.id))} 
                          className="p-2.5 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-xl transition-colors"
                          title="Xóa tiết mục"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: CÀI ĐẶT SỰ KIỆN CHUNG */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6 font-inter">
            {/* Chế độ Màn hình Công Chiếu Nhanh */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <h2 className="text-lg font-bold mb-4 text-white">Chuyển Đổi Nhanh Màn Hình Công Chiếu LED</h2>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => setLEDView('event')}
                  className={`px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border flex items-center gap-2 ${settings?.activeView === 'event' ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20' : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'}`}
                >
                  <Trophy className="w-4 h-4" /> Chiếu Phông Nền Sự Kiện & Slides
                </button>
                <button 
                  onClick={() => setLEDView('idle')}
                  className={`px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border ${settings?.activeView === 'idle' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}
                >
                  Màn Hình Chờ Logo Vovinam
                </button>
                <button 
                  onClick={async () => {
                    if (confirm("Bạn có chắc chắn muốn reset toàn bộ điểm chấm của các giám định?")) {
                      const batch = performances.map(p => updateDoc(doc(db, 'performances', p.id), { scores: {}, averageScore: 0 }));
                      await Promise.all(batch);
                      alert("Đã reset tất cả điểm!");
                    }
                  }}
                  className="bg-red-900/20 hover:bg-red-600 text-red-400 hover:text-white px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border border-red-500/20"
                >
                  Reset Tất Cả Điểm Thi Quyền
                </button>
              </div>
            </div>

            {/* Cấu hình Thông tin Tên Sự kiện & Khẩu hiệu */}
            <div className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
              <h2 className="font-bebas text-3xl tracking-wider text-white">THÔNG TIN TÊN SỰ KIỆN & ĐƠN VỊ TỔ CHỨC</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Tên Sự kiện (Dòng chính)
                  </label>
                  <input 
                    type="text"
                    value={eventMeta.eventTitle}
                    onChange={e => setEventMeta({...eventMeta, eventTitle: e.target.value})}
                    placeholder="VD: VÕ VIỆT TRANH HÙNG ĐOẠT CÓC VƯƠNG 2026"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 font-semibold focus:border-amber-500 outline-none text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Tên phụ / Khẩu hiệu
                  </label>
                  <input 
                    type="text"
                    value={eventMeta.eventSubtitle}
                    onChange={e => setEventMeta({...eventMeta, eventSubtitle: e.target.value})}
                    placeholder="VD: GIẢI VOVINAM - VIỆT VÕ ĐẠO MỞ RỘNG"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 font-semibold focus:border-amber-500 outline-none text-white text-sm"
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Đơn vị tổ chức / Trường
                  </label>
                  <input 
                    type="text"
                    value={eventMeta.organizer}
                    onChange={e => setEventMeta({...eventMeta, organizer: e.target.value})}
                    placeholder="VD: TRƯỜNG ĐẠI HỌC FPT"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 font-semibold focus:border-amber-500 outline-none text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={saveEventMeta}
                  className="bg-amber-500 hover:bg-amber-600 text-black px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
                >
                  Lưu Thông Tin Sự Kiện
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${active ? 'bg-slate-800 text-white shadow-lg border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
    >
      {icon}
      {label}
    </button>
  );
}
