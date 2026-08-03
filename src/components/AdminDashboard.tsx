import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { Performance, Match, GlobalSettings } from '../types';
import { Plus, Trash2, Play, Pause, Trophy, ArrowLeft, Users, Swords, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminDashboardProps {
  performances: Performance[];
  matches: Match[];
  settings: GlobalSettings | null;
  onBack: () => void;
}

export default function AdminDashboard({ performances, matches, settings, onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'thi_quyen' | 'vo_nhac' | 'combat' | 'settings'>('thi_quyen');
  const [newPerf, setNewPerf] = useState({ name: '', competitor: '' });
  const [newMatch, setNewMatch] = useState({ 
    redName: '', 
    blueName: '', 
    redPhoto: '', 
    bluePhoto: '',
    redCelebration: '',
    blueCelebration: ''
  });
  const [winnerDetails, setWinnerDetails] = useState({ weightClass: '', victoryMethod: '' });

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
      setNewPerf({ name: '', competitor: '' });
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
          photoUrl: newMatch.redPhoto || `https://picsum.photos/seed/${newMatch.redName}/400`,
          celebrationPhotoUrl: newMatch.redCelebration || newMatch.redPhoto || `https://picsum.photos/seed/${newMatch.redName}_win/800`
        },
        blueCorner: { 
          name: newMatch.blueName, 
          photoUrl: newMatch.bluePhoto || `https://picsum.photos/seed/${newMatch.blueName}/400`,
          celebrationPhotoUrl: newMatch.blueCelebration || newMatch.bluePhoto || `https://picsum.photos/seed/${newMatch.blueName}_win/800`
        },
        winner: null,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setNewMatch({ redName: '', blueName: '', redPhoto: '', bluePhoto: '', redCelebration: '', blueCelebration: '' });
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

  const saveEventMeta = async () => {
    await setDoc(doc(db, 'settings', 'global'), {
      ...eventMeta
    }, { merge: true });
    alert('Đã cập nhật thông tin sự kiện!');
  };

  const setLEDView = async (view: 'forms' | 'combat' | 'idle' | 'event', id: string | null = null) => {
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
      victoryMethod: winnerDetails.victoryMethod || 'THẮNG ĐIỂM'
    });
    await updateDoc(doc(db, 'settings', 'global'), { showWinnerAnimation: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
            <TabButton active={activeTab === 'thi_quyen'} onClick={() => setActiveTab('thi_quyen')} icon={<Users className="w-4 h-4" />} label="Thi Quyền" />
            <TabButton active={activeTab === 'vo_nhac'} onClick={() => setActiveTab('vo_nhac')} icon={<Users className="w-4 h-4" />} label="Võ Nhạc" />
            <TabButton active={activeTab === 'combat'} onClick={() => setActiveTab('combat')} icon={<Swords className="w-4 h-4" />} label="Đối kháng" />
            <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon className="w-4 h-4" />} label="Cài đặt" />
          </div>
        </header>

        {(activeTab === 'thi_quyen' || activeTab === 'vo_nhac') && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" /> Thêm {activeTab === 'thi_quyen' ? 'tiết mục Thi Quyền mới' : 'bài Võ Nhạc mới'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                  placeholder={activeTab === 'thi_quyen' ? "Tên bài quyền" : "Tên bài võ nhạc"} 
                  value={newPerf.name} 
                  onChange={e => setNewPerf({...newPerf, name: e.target.value})}
                  className="bg-slate-800 border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input 
                  placeholder="Tên vận động viên / Đội" 
                  value={newPerf.competitor} 
                  onChange={e => setNewPerf({...newPerf, competitor: e.target.value})}
                  className="bg-slate-800 border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button onClick={() => addPerformance(activeTab as 'thi_quyen' | 'vo_nhac')} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition-colors">
                  Thêm
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {performances.filter(p => (p.category || 'thi_quyen') === activeTab).map(p => (
                <div key={p.id} className={`p-4 rounded-xl border flex items-center justify-between ${settings?.activeId === p.id ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-900 border-slate-800'}`}>
                  <div>
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <p className="text-slate-400">{p.competitor}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-4">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">{Object.keys(p.scores).length} giám khảo</p>
                      <p className="text-xl font-mono font-bold text-blue-400">{p.averageScore.toFixed(2)}</p>
                    </div>
                    <button 
                      onClick={() => setLEDView('forms', p.id)}
                      className={`p-2 rounded-lg transition-colors ${settings?.activeId === p.id ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}
                      title="Chiếu lên LED"
                    >
                      <Play className="w-5 h-5" />
                    </button>
                    <button onClick={() => deleteDoc(doc(db, 'performances', p.id))} className="p-2 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'combat' && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-500" /> Thêm trận đấu mới
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <input 
                    placeholder="Tên võ sĩ Đỏ" 
                    value={newMatch.redName} 
                    onChange={e => setNewMatch({...newMatch, redName: e.target.value})}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                  <input 
                    placeholder="URL ảnh đối mặt (Đỏ)" 
                    value={newMatch.redPhoto} 
                    onChange={e => setNewMatch({...newMatch, redPhoto: e.target.value})}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-xs outline-none"
                  />
                  <input 
                    placeholder="URL ảnh ăn mừng (Đỏ)" 
                    value={newMatch.redCelebration} 
                    onChange={e => setNewMatch({...newMatch, redCelebration: e.target.value})}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-xs outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <input 
                    placeholder="Tên võ sĩ Xanh" 
                    value={newMatch.blueName} 
                    onChange={e => setNewMatch({...newMatch, blueName: e.target.value})}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input 
                    placeholder="URL ảnh đối mặt (Xanh)" 
                    value={newMatch.bluePhoto} 
                    onChange={e => setNewMatch({...newMatch, bluePhoto: e.target.value})}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-xs outline-none"
                  />
                  <input 
                    placeholder="URL ảnh ăn mừng (Xanh)" 
                    value={newMatch.blueCelebration} 
                    onChange={e => setNewMatch({...newMatch, blueCelebration: e.target.value})}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-xs outline-none"
                  />
                </div>
              </div>
              <button onClick={addMatch} className="w-full bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors">
                Tạo trận đấu
              </button>
            </div>

            <div className="grid gap-4">
              {matches.map(m => (
                <div key={m.id} className={`p-6 rounded-xl border ${settings?.activeId === m.id ? 'bg-red-900/20 border-red-500' : 'bg-slate-900 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-8">
                      <div 
                        className={`text-center cursor-pointer group transition-transform hover:scale-105 ${m.winner === 'red' ? 'opacity-100' : m.winner ? 'opacity-40' : ''}`}
                        onClick={() => m.status !== 'completed' && setWinner(m.id, 'red')}
                      >
                        <div className={`w-16 h-16 rounded-full border-4 overflow-hidden mb-2 transition-all ${m.winner === 'red' ? 'border-yellow-500 ring-4 ring-yellow-500/20' : 'border-red-500 group-hover:border-red-400'}`}>
                          <img src={m.redCorner.photoUrl} alt={m.redCorner.name} className="w-full h-full object-cover" />
                        </div>
                        <p className={`font-bold ${m.winner === 'red' ? 'text-yellow-500' : ''}`}>{m.redCorner.name}</p>
                      </div>
                      <span className="text-2xl font-black text-slate-700">VS</span>
                      <div 
                        className={`text-center cursor-pointer group transition-transform hover:scale-105 ${m.winner === 'blue' ? 'opacity-100' : m.winner ? 'opacity-40' : ''}`}
                        onClick={() => m.status !== 'completed' && setWinner(m.id, 'blue')}
                      >
                        <div className={`w-16 h-16 rounded-full border-4 overflow-hidden mb-2 transition-all ${m.winner === 'blue' ? 'border-yellow-500 ring-4 ring-yellow-500/20' : 'border-blue-500 group-hover:border-blue-400'}`}>
                          <img src={m.blueCorner.photoUrl} alt={m.blueCorner.name} className="w-full h-full object-cover" />
                        </div>
                        <p className={`font-bold ${m.winner === 'blue' ? 'text-yellow-500' : ''}`}>{m.blueCorner.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setLEDView('combat', m.id)}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${settings?.activeId === m.id ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}
                      >
                        <Play className="w-4 h-4" /> Chiếu LED
                      </button>
                      <button onClick={() => deleteDoc(doc(db, 'matches', m.id))} className="p-2 bg-slate-800 text-slate-400 hover:bg-red-900/40 hover:text-red-500 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {m.status !== 'completed' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          placeholder="Hạng cân (VD: 55KG)" 
                          value={winnerDetails.weightClass}
                          onChange={e => setWinnerDetails({...winnerDetails, weightClass: e.target.value})}
                          className="bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-yellow-500"
                        />
                        <input 
                          placeholder="Phương thức (VD: K.O, Thắng điểm)" 
                          value={winnerDetails.victoryMethod}
                          onChange={e => setWinnerDetails({...winnerDetails, victoryMethod: e.target.value})}
                          className="bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-yellow-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setWinner(m.id, 'red')} className="flex-1 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2">
                          <Trophy className="w-4 h-4" /> Thắng (Đỏ)
                        </button>
                        <button onClick={() => setWinner(m.id, 'blue')} className="flex-1 bg-blue-600/20 hover:bg-blue-600 text-blue-500 hover:text-white py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2">
                          <Trophy className="w-4 h-4" /> Thắng (Xanh)
                        </button>
                      </div>
                    </div>
                  )}
                  {m.status === 'completed' && (
                    <div className={`text-center py-2 rounded-lg font-bold ${m.winner === 'red' ? 'bg-red-600' : 'bg-blue-600'}`}>
                      WINNER: {m.winner === 'red' ? m.redCorner.name : m.blueCorner.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
              <h2 className="text-2xl font-bold mb-6 text-center">Trạng thái Màn hình LED</h2>
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
                  Màn hình chờ Logo
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
                  Reset tất cả điểm
                </button>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
              <h2 className="text-2xl font-bold mb-6">Cấu hình Background & Thông tin Sự kiện</h2>
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 font-semibold focus:border-amber-500 outline-none"
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 font-semibold focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Đơn vị tổ chức / Trường
                  </label>
                  <input 
                    type="text"
                    value={eventMeta.organizer}
                    onChange={e => setEventMeta({...eventMeta, organizer: e.target.value})}
                    placeholder="VD: TRƯỜNG ĐẠI HỌC FPT"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 font-semibold focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    URL Ảnh phông nền tùy chỉnh (Tùy chọn)
                  </label>
                  <input 
                    type="text"
                    value={eventMeta.eventBgUrl}
                    onChange={e => setEventMeta({...eventMeta, eventBgUrl: e.target.value})}
                    placeholder="https://... (để trống nếu dùng thiết kế mặc định)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 font-semibold focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={saveEventMeta}
                  className="bg-amber-500 hover:bg-amber-600 text-black px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20"
                >
                  Lưu thông tin sự kiện
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
      className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${active ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
    >
      {icon}
      {label}
    </button>
  );
}
