import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { Performance, Match, GlobalSettings, ActiveView } from '../types';
import { Plus, Trash2, Play, Pause, Trophy, ArrowLeft, Users, Swords, Settings as SettingsIcon, Eye, EyeOff, Tv, Monitor, RotateCcw, Image, Upload, Sparkles, X, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminDashboardProps {
  performances: Performance[];
  matches: Match[];
  settings: GlobalSettings | null;
  onBack: () => void;
}

export default function AdminDashboard({ performances, matches, settings, onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'thi_quyen' | 'vo_nhac' | 'combat' | 'settings'>('thi_quyen');
  const [newPerf, setNewPerf] = useState({ name: '', competitor: '', bgUrl: '' });
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
  const [winnerDetails, setWinnerDetails] = useState({ weightClass: '', victoryMethod: '' });

  const isLeaderboardHidden = !settings?.showScoresAndLeaderboard;

  const toggleLeaderboardVisibility = async (show: boolean) => {
    await setDoc(doc(db, 'settings', 'global'), {
      showScoresAndLeaderboard: show
    }, { merge: true });
  };

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
        redScore: 0,
        blueScore: 0,
        redPenalties: 0,
        bluePenalties: 0,
        round: 1,
        timeRemaining: 120,
        isTimerRunning: false,
        activeVotes: [],
        scoreLog: [],
        weightClass: newMatch.weightClass || 'Hạng cân 55kg',
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

  const [eventMeta, setEventMeta] = useState({
    eventTitle: settings?.eventTitle || 'VÕ VIỆT TRANH HÙNG ĐOẠT CÓC VƯƠNG 2026',
    eventSubtitle: settings?.eventSubtitle || 'GIẢI VOVINAM - VIỆT VÕ ĐẠO MỞ RỘNG',
    organizer: settings?.organizer || 'TRƯỜNG ĐẠI HỌC FPT',
    eventBgUrl: settings?.eventBgUrl || ''
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("File ảnh lớn hơn 8MB. Vui lòng chọn ảnh nhẹ hơn để tải mượt mà!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (dataUrl) {
        setEventMeta(prev => ({ ...prev, eventBgUrl: dataUrl }));
        setDoc(doc(db, 'settings', 'global'), {
          eventBgUrl: dataUrl
        }, { merge: true }).catch(console.error);
      }
    };
    reader.readAsDataURL(file);
  };

  const bgPresets = [
    {
      name: 'Vovinam Arena HD',
      url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1920&auto=format&fit=crop&q=80',
      thumb: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=80'
    },
    {
      name: 'Võ Đường Truyền Thống',
      url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1920&auto=format&fit=crop&q=80',
      thumb: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&auto=format&fit=crop&q=80'
    },
    {
      name: 'Sân Khấu Cyber LED',
      url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1920&auto=format&fit=crop&q=80',
      thumb: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&auto=format&fit=crop&q=80'
    },
    {
      name: 'Hào Khí Hoàng Kim',
      url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&auto=format&fit=crop&q=80',
      thumb: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&auto=format&fit=crop&q=80'
    }
  ];

  const applyPresetBg = async (url: string) => {
    setEventMeta(prev => ({ ...prev, eventBgUrl: url }));
    await setDoc(doc(db, 'settings', 'global'), {
      eventBgUrl: url
    }, { merge: true });
  };

  const removeBg = async () => {
    setEventMeta(prev => ({ ...prev, eventBgUrl: '' }));
    await setDoc(doc(db, 'settings', 'global'), {
      eventBgUrl: ''
    }, { merge: true });
  };

  const saveEventMeta = async () => {
    await setDoc(doc(db, 'settings', 'global'), {
      ...eventMeta
    }, { merge: true });
    alert('Đã cập nhật thông tin sự kiện!');
  };

  const setLEDView = async (view: ActiveView, id: string | null = null) => {
    await setDoc(doc(db, 'settings', 'global'), {
      activeView: view,
      activeId: id,
      showWinnerAnimation: false
    }, { merge: true });
  };

  const setWinner = async (matchId: string, winner: 'red' | 'blue') => {
    await updateDoc(doc(db, 'matches', matchId), { 
      winner, 
      status: 'completed',
      weightClass: winnerDetails.weightClass || 'HẠNG CÂN 55KG',
      victoryMethod: winnerDetails.victoryMethod || 'THẮNG ĐIỂM (POINTS)'
    });
    await updateDoc(doc(db, 'settings', 'global'), { showWinnerAnimation: true });
  };

  const resetMatchScores = async (matchId: string) => {
    if (confirm("Bạn có chắc chắn muốn reset điểm số và nhật ký trận đấu này về 0-0?")) {
      await updateDoc(doc(db, 'matches', matchId), {
        redScore: 0,
        blueScore: 0,
        redPenalties: 0,
        bluePenalties: 0,
        activeVotes: [],
        scoreLog: [],
        winner: null,
        status: 'pending',
        timeRemaining: 120,
        isTimerRunning: false
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-xs text-slate-400">Điều khiển Màn hình LED 1, Màn hình TV 2 & Bảng điểm 3 Giám định</p>
            </div>
          </div>
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
            <TabButton active={activeTab === 'thi_quyen'} onClick={() => setActiveTab('thi_quyen')} icon={<Users className="w-4 h-4" />} label="Thi Quyền" />
            <TabButton active={activeTab === 'vo_nhac'} onClick={() => setActiveTab('vo_nhac')} icon={<Users className="w-4 h-4" />} label="Võ Nhạc" />
            <TabButton active={activeTab === 'combat'} onClick={() => setActiveTab('combat')} icon={<Swords className="w-4 h-4" />} label="Đối kháng (2 Màn hình)" />
            <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon className="w-4 h-4" />} label="Cài đặt" />
          </div>
        </header>

        {/* FORMS & MUSIC FORMS MANAGEMENT */}
        {(activeTab === 'thi_quyen' || activeTab === 'vo_nhac') && (
          <div className="space-y-6">
            {/* LEADERBOARD PRIVACY CONTROLLER (Yêu cầu 1 của người dùng) */}
            <div className={`p-6 rounded-2xl border transition-all ${isLeaderboardHidden ? 'bg-amber-950/40 border-amber-500/50' : 'bg-green-950/40 border-green-500/50'}`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-xl ${isLeaderboardHidden ? 'bg-amber-500 text-black' : 'bg-green-500 text-black'}`}>
                    {isLeaderboardHidden ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-wider">
                      {isLeaderboardHidden 
                        ? '🔒 ĐANG ẨN BẢNG ĐIỂM & BXH (Chế độ thi đấu an toàn)' 
                        : '🏆 ĐANG CÔNG BỐ KẾT QUẢ & HIỆN BXH (Chuẩn bị trao giải)'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                      {isLeaderboardHidden 
                        ? 'Màn hình LED chỉ hiển thị phông nền tiết mục & tiến độ giám khảo (Không để lộ điểm số/BXH). Giám khảo vẫn chấm và lưu điểm bình thường.' 
                        : 'Màn hình LED đang hiển thị đầy đủ điểm số chi tiết từng giám khảo, Điểm trung bình và Bảng xếp hạng thứ hạng cao nhất.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleLeaderboardVisibility(false)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${isLeaderboardHidden ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    <EyeOff className="w-4 h-4" /> Ẩn Điểm & BXH
                  </button>
                  <button
                    onClick={() => toggleLeaderboardVisibility(true)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${!isLeaderboardHidden ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    <Trophy className="w-4 h-4" /> Công Bố & Hiện BXH
                  </button>
                </div>
              </div>
            </div>

            {/* Add Performance Form */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" /> Thêm {activeTab === 'thi_quyen' ? 'tiết mục Thi Quyền mới' : 'bài Võ Nhạc mới'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                  placeholder={activeTab === 'thi_quyen' ? "Tên bài quyền (VD: Thập Thế Bát Thức)" : "Tên bài võ nhạc"} 
                  value={newPerf.name} 
                  onChange={e => setNewPerf({...newPerf, name: e.target.value})}
                  className="bg-slate-800 border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input 
                  placeholder="Tên vận động viên / Đội biểu diễn" 
                  value={newPerf.competitor} 
                  onChange={e => setNewPerf({...newPerf, competitor: e.target.value})}
                  className="bg-slate-800 border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button onClick={() => addPerformance(activeTab as 'thi_quyen' | 'vo_nhac')} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition-colors">
                  Thêm tiết mục
                </button>
              </div>
            </div>

            {/* Performance List */}
            <div className="grid gap-4">
              {performances.filter(p => (p.category || 'thi_quyen') === activeTab).map(p => (
                <div key={p.id} className={`p-4 rounded-xl border flex items-center justify-between ${settings?.activeId === p.id && settings?.activeView === 'forms' ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-900 border-slate-800'}`}>
                  <div>
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <p className="text-slate-400 text-sm">{p.competitor}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-4">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">{Object.keys(p.scores || {}).length} giám khảo đã nộp</p>
                      <p className="text-xl font-mono font-bold text-amber-400">{p.averageScore.toFixed(2)}</p>
                    </div>
                    <button 
                      onClick={() => setLEDView('forms', p.id)}
                      className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors ${settings?.activeId === p.id && settings?.activeView === 'forms' ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                      title="Chiếu lên LED"
                    >
                      <Play className="w-4 h-4" /> Chiếu LED
                    </button>
                    <button onClick={() => deleteDoc(doc(db, 'performances', p.id))} className="p-2 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMBAT MANAGEMENT (Yêu cầu 2: 2 Màn hình & 3 Giám khảo đồng thuận) */}
        {activeTab === 'combat' && (
          <div className="space-y-6">
            {/* System Info Banner for Combat */}
            <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-red-950/60 p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3 mb-2">
                <Swords className="w-6 h-6 text-amber-400" />
                <h3 className="text-lg font-black text-amber-400 uppercase tracking-wider">
                  HỆ THỐNG ĐỐI KHÁNG VOVINAM (2 MÀN HÌNH & 3 GIÁM ĐỊNH ĐỒNG THUẬN 2/3)
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 mt-3">
                <div className="bg-black/40 p-3 rounded-xl border border-white/10">
                  <strong className="text-blue-400 block mb-1">📺 Màn hình 1 (Màn hình LED lớn Sân đấu):</strong>
                  Chiếu Tên 2 Võ sĩ Đỏ & Xanh, CLB/Đơn vị, Hạng cân, Thời gian hiệp đấu và Tỉ số chính thức cho khán giả.
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-white/10">
                  <strong className="text-amber-400 block mb-1">🖥️ Màn hình 2 (Màn hình TV Bàn Thư ký & Kỹ thuật):</strong>
                  Hiển thị chi tiết 3 Giám khảo bấm điểm real-time, bộ lọc đồng thuận 2/3, nhật ký đòn đánh và điều khiển timer.
                </div>
              </div>
            </div>

            {/* Add Match Form */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-500" /> Tạo trận đấu đối kháng mới
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                {/* Red Corner Info */}
                <div className="space-y-3 bg-red-950/30 p-4 rounded-xl border border-red-900/40">
                  <h4 className="text-sm font-bold text-red-400 uppercase">Góc ĐỎ (Red Corner)</h4>
                  <input 
                    placeholder="Họ tên võ sĩ Đỏ" 
                    value={newMatch.redName} 
                    onChange={e => setNewMatch({...newMatch, redName: e.target.value})}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  />
                  <input 
                    placeholder="Đơn vị / CLB võ sĩ Đỏ" 
                    value={newMatch.redUnit} 
                    onChange={e => setNewMatch({...newMatch, redUnit: e.target.value})}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-xs outline-none"
                  />
                  <input 
                    placeholder="URL ảnh đối mặt Đỏ (tùy chọn)" 
                    value={newMatch.redPhoto} 
                    onChange={e => setNewMatch({...newMatch, redPhoto: e.target.value})}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-xs outline-none"
                  />
                  <input 
                    placeholder="URL ảnh ăn mừng Đỏ (tùy chọn)" 
                    value={newMatch.redCelebration} 
                    onChange={e => setNewMatch({...newMatch, redCelebration: e.target.value})}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-xs outline-none"
                  />
                </div>

                {/* Blue Corner Info */}
                <div className="space-y-3 bg-blue-950/30 p-4 rounded-xl border border-blue-900/40">
                  <h4 className="text-sm font-bold text-blue-400 uppercase">Góc XANH (Blue Corner)</h4>
                  <input 
                    placeholder="Họ tên võ sĩ Xanh" 
                    value={newMatch.blueName} 
                    onChange={e => setNewMatch({...newMatch, blueName: e.target.value})}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input 
                    placeholder="Đơn vị / CLB võ sĩ Xanh" 
                    value={newMatch.blueUnit} 
                    onChange={e => setNewMatch({...newMatch, blueUnit: e.target.value})}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-xs outline-none"
                  />
                  <input 
                    placeholder="URL ảnh đối mặt Xanh (tùy chọn)" 
                    value={newMatch.bluePhoto} 
                    onChange={e => setNewMatch({...newMatch, bluePhoto: e.target.value})}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-xs outline-none"
                  />
                  <input 
                    placeholder="URL ảnh ăn mừng Xanh (tùy chọn)" 
                    value={newMatch.blueCelebration} 
                    onChange={e => setNewMatch({...newMatch, blueCelebration: e.target.value})}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <input 
                  placeholder="Hạng cân (VD: Hạng cân 55KG)" 
                  value={newMatch.weightClass} 
                  onChange={e => setNewMatch({...newMatch, weightClass: e.target.value})}
                  className="w-1/2 bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-sm outline-none"
                />
                <button onClick={addMatch} className="w-1/2 bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-lg font-bold transition-colors">
                  Tạo trận đấu đối kháng
                </button>
              </div>
            </div>

            {/* Matches List */}
            <div className="grid gap-6">
              {matches.map(m => (
                <div key={m.id} className={`p-6 rounded-2xl border ${settings?.activeId === m.id ? 'bg-slate-900 border-red-500 shadow-xl' : 'bg-slate-900/80 border-slate-800'}`}>
                  {/* Match Header */}
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-6">
                      {/* Red Corner */}
                      <div className="flex items-center gap-3">
                        <img src={m.redCorner.photoUrl} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-red-500" />
                        <div>
                          <p className="text-xs text-red-400 font-bold uppercase">ĐỎ: {m.redCorner.unit || 'Võ sĩ Đỏ'}</p>
                          <h4 className="text-xl font-black text-white">{m.redCorner.name}</h4>
                          <span className="text-2xl font-mono font-black text-red-500">{m.redScore || 0}đ</span>
                        </div>
                      </div>

                      <span className="text-2xl font-black text-slate-600">VS</span>

                      {/* Blue Corner */}
                      <div className="flex items-center gap-3">
                        <img src={m.blueCorner.photoUrl} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500" />
                        <div>
                          <p className="text-xs text-blue-400 font-bold uppercase">XANH: {m.blueCorner.unit || 'Võ sĩ Xanh'}</p>
                          <h4 className="text-xl font-black text-white">{m.blueCorner.name}</h4>
                          <span className="text-2xl font-mono font-black text-blue-500">{m.blueScore || 0}đ</span>
                        </div>
                      </div>
                    </div>

                    {/* Screen Broadcast Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        onClick={() => setLEDView('combat_led', m.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${settings?.activeId === m.id && (settings?.activeView === 'combat_led' || settings?.activeView === 'combat') ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                      >
                        <Monitor className="w-4 h-4" /> 📺 Chiếu Màn hình 1 (LED Sân Đấu)
                      </button>

                      <button 
                        onClick={() => setLEDView('combat_tv', m.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${settings?.activeId === m.id && settings?.activeView === 'combat_tv' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                      >
                        <Tv className="w-4 h-4" /> 🖥️ Chiếu Màn hình 2 (TV Kỹ Thuật)
                      </button>

                      <button 
                        onClick={() => resetMatchScores(m.id)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
                        title="Reset điểm số"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button 
                        onClick={() => deleteDoc(doc(db, 'matches', m.id))}
                        className="p-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-xl transition-colors"
                        title="Xóa trận"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Match Winner Actions */}
                  {m.status !== 'completed' && (
                    <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          placeholder="Hạng cân (VD: Hạng cân 55KG)" 
                          value={winnerDetails.weightClass} 
                          onChange={e => setWinnerDetails({...winnerDetails, weightClass: e.target.value})}
                          className="bg-slate-800 border-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none"
                        />
                        <input 
                          placeholder="Phương thức thắng (VD: Thắng điểm, K.O)" 
                          value={winnerDetails.victoryMethod} 
                          onChange={e => setWinnerDetails({...winnerDetails, victoryMethod: e.target.value})}
                          className="bg-slate-800 border-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setWinner(m.id, 'red')} className="flex-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
                          <Trophy className="w-4 h-4" /> Trao Thắng Cuộc (Góc Đỏ)
                        </button>
                        <button onClick={() => setWinner(m.id, 'blue')} className="flex-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
                          <Trophy className="w-4 h-4" /> Trao Thắng Cuộc (Góc Xanh)
                        </button>
                      </div>
                    </div>
                  )}

                  {m.status === 'completed' && (
                    <div className={`text-center py-2.5 rounded-xl font-black text-sm uppercase tracking-wider ${m.winner === 'red' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                      🏆 WINNER CHIẾN THẮNG: {m.winner === 'red' ? m.redCorner.name : m.blueCorner.name} ({m.victoryMethod || 'THẮNG ĐIỂM'})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
              <h2 className="text-2xl font-bold mb-6 text-center">Chế độ Màn hình Công Chiếu</h2>
              <div className="flex flex-wrap justify-center gap-4">
                <button 
                  onClick={() => setLEDView('event')}
                  className={`px-6 py-4 rounded-xl font-bold transition-all border flex items-center gap-2 ${settings?.activeView === 'event' ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20' : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'}`}
                >
                  <Trophy className="w-5 h-5" /> Chiếu Event Background chính
                </button>
                <button 
                  onClick={() => setLEDView('idle')}
                  className={`px-6 py-4 rounded-xl font-bold transition-all border ${settings?.activeView === 'idle' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}
                >
                  Màn hình chờ Logo Vovinam
                </button>
                <button 
                  onClick={async () => {
                    if (confirm("Bạn có chắc chắn muốn reset toàn bộ điểm chấm của các giám định?")) {
                      const batch = performances.map(p => updateDoc(doc(db, 'performances', p.id), { scores: {}, averageScore: 0 }));
                      await Promise.all(batch);
                      alert("Đã reset tất cả điểm!");
                    }
                  }}
                  className="bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white px-6 py-4 rounded-xl font-bold transition-all border border-red-500/20"
                >
                  Reset tất cả điểm Thi Quyền
                </button>
              </div>
            </div>

            {/* CẤU HÌNH HÌNH NỀN BACKGROUND CHƯƠNG TRÌNH */}
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-400">
                    <Image className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-bebas text-3xl tracking-wider text-white">CẤU HÌNH HÌNH NỀN (BACKGROUND) CHƯƠNG TRÌNH</h2>
                    <p className="text-xs text-slate-400 font-inter">Chọn hoặc tải ảnh phông nền hiển thị trên màn hình LED công chiếu</p>
                  </div>
                </div>

                {eventMeta.eventBgUrl && (
                  <button
                    onClick={removeBg}
                    className="flex items-center gap-2 px-4 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl transition-all font-inter"
                  >
                    <X className="w-4 h-4" /> Xóa ảnh nền (Về mặc định)
                  </button>
                )}
              </div>

              {/* Upload or Link Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                {/* File Upload Box */}
                <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-950/50 transition-all">
                  <Upload className="w-10 h-10 text-amber-400 mb-3 animate-bounce" />
                  <p className="font-bold text-sm text-white mb-1">Tải ảnh từ máy tính của bạn</p>
                  <p className="text-xs text-slate-400 mb-4">Hỗ trợ JPG, PNG, WEBP (Tối đa 8MB)</p>
                  <label className="cursor-pointer px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Chọn file ảnh từ máy
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {/* Direct URL Input */}
                <div className="flex flex-col justify-center bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Hoặc dán đường dẫn ảnh trực tiếp (Image URL)
                  </label>
                  <input 
                    type="text"
                    value={eventMeta.eventBgUrl}
                    onChange={e => setEventMeta({...eventMeta, eventBgUrl: e.target.value})}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs font-mono focus:border-amber-500 outline-none text-white mb-3"
                  />
                  <p className="text-[11px] text-slate-400">
                    💡 Mẹo: Bạn có thể dán link ảnh sự kiện từ Google Drive, Unsplash, Imgur hoặc trang web của trường.
                  </p>
                </div>
              </div>

              {/* Sample Background Presets */}
              <div className="font-inter">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Gợi ý Hình nền Sân đấu Võ thuật Chuẩn HD (Bấm để áp dụng ngay):
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {bgPresets.map((preset, idx) => (
                    <div 
                      key={idx}
                      onClick={() => applyPresetBg(preset.url)}
                      className={`group cursor-pointer relative rounded-xl overflow-hidden border-2 transition-all aspect-video ${eventMeta.eventBgUrl === preset.url ? 'border-amber-400 ring-2 ring-amber-400/40 scale-[1.02]' : 'border-slate-800 hover:border-slate-600'}`}
                    >
                      <img src={preset.thumb} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-2">
                        <span className="text-[11px] font-bold text-white leading-tight">{preset.name}</span>
                        {eventMeta.eventBgUrl === preset.url && (
                          <span className="text-[9px] font-extrabold text-amber-400 flex items-center gap-1 mt-0.5">
                            <Check className="w-3 h-3" /> Đang dùng
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Preview Box */}
              {eventMeta.eventBgUrl && (
                <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-slate-800 font-inter">
                  <span className="text-xs font-bold text-slate-400 block mb-2">Xem trước hình nền hiện tại:</span>
                  <div className="relative aspect-[21/9] max-h-48 rounded-xl overflow-hidden border border-slate-700">
                    <img src={eventMeta.eventBgUrl} alt="Background Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="font-bebas text-2xl text-white tracking-widest uppercase drop-shadow-md">
                        HÌNH NỀN CHƯƠNG TRÌNH SẼ HIỂN THỊ TRÊN MÀN HÌNH LED
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cấu hình Thông tin Sự kiện */}
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 font-inter">
              <h2 className="font-bebas text-3xl tracking-wider mb-6 text-white">Thông tin Tên Sự kiện & Đơn vị</h2>
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 font-semibold focus:border-amber-500 outline-none text-white"
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 font-semibold focus:border-amber-500 outline-none text-white"
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 font-semibold focus:border-amber-500 outline-none text-white"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={saveEventMeta}
                  className="bg-amber-500 hover:bg-amber-600 text-black px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20"
                >
                  Lưu thông tin & Phông nền
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${active ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
    >
      {icon}
      {label}
    </button>
  );
}
