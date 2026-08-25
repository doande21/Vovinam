import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { Performance, Match, GlobalSettings, ActiveView, BackgroundSlide } from '../types';
import { 
  Plus, Trash2, Play, Pause, Trophy, ArrowLeft, Users, Swords, Settings as SettingsIcon, 
  Eye, EyeOff, Tv, Monitor, RotateCcw, Image, Upload, Sparkles, X, Check, Crown, 
  Sliders, Link as LinkIcon, StickyNote, RefreshCw, ChevronRight, ChevronLeft, Shield, Flame,
  Filter, Award, Edit3, Save, UserPlus, Calculator, SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  performances: Performance[];
  matches: Match[];
  settings: GlobalSettings | null;
  onBack: () => void;
}

export default function AdminDashboard({ performances, matches, settings, onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'combat' | 'backgrounds' | 'thi_quyen' | 'vo_nhac' | 'leaderboard' | 'settings'>('combat');
  
  // Performance State
  const [newPerf, setNewPerf] = useState({ 
    name: '', 
    competitor: '', 
    gender: 'nam' as 'nam' | 'nu' | 'dong_doi_nam' | 'dong_doi_nu' | 'hon_hop',
    bgUrl: '' 
  });
  const [formsGenderFilter, setFormsGenderFilter] = useState<'all' | 'nam' | 'nu' | 'dong_doi_nam' | 'dong_doi_nu' | 'hon_hop'>('all');
  const [leaderboardView, setLeaderboardView] = useState<'nam' | 'nu' | 'dong_doi_nam' | 'dong_doi_nu' | 'hon_hop' | 'vo_nhac'>('nam');
  const [leaderboardFormFilter, setLeaderboardFormFilter] = useState<string>('all');
  
  // Vovinam Forms Preset Suggestions
  const vovinamFormsPresets = [
    'Long Hổ Quyền',
    'Thập Thế Bát Thức Quyền',
    'Tứ Tượng Côn Pháp',
    'Tinh Hoa Lưỡng Nghi Kiếm Pháp',
    'Song Dao Pháp',
    'Nhật Nguyệt Đại Đao Pháp',
    'Song Luyện Kiếm',
    'Song Luyện Dao',
    'Tự Vệ Nữ',
    'Đa Luyện Vũ Khí'
  ];
  
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

  // Admin Direct Score Edit State
  const [editingPerf, setEditingPerf] = useState<{
    id: string;
    name: string;
    competitor: string;
    gender: 'nam' | 'nu' | 'dong_doi_nam' | 'dong_doi_nu' | 'hon_hop';
    category: 'thi_quyen' | 'vo_nhac';
    scores: Record<string, { score: number; name: string }>;
    directTotal?: string;
  } | null>(null);
  const [editScoreMode, setEditScoreMode] = useState<'direct' | 'detailed'>('direct');
  const [quickScoreInput, setQuickScoreInput] = useState<string>('');
  const [directScoreInput, setDirectScoreInput] = useState<string>('');
  const [isSavingScore, setIsSavingScore] = useState(false);

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

  const toggleJudgeScoresVisibilityOnLED = async (hide: boolean) => {
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        hideJudgeScoresOnLED: hide
      }, { merge: true });
    } catch (error) {
      console.error("Error toggling judge scores visibility on LED:", error);
    }
  };

  const projectCategoryLeaderboardToLED = async (
    category: 'nam' | 'nu' | 'dong_doi_nam' | 'dong_doi_nu' | 'hon_hop' | 'vo_nhac' | 'all', 
    formFilter: string = 'all', 
    customTitle?: string
  ) => {
    try {
      const getCategoryTitle = (cat: string) => {
        switch (cat) {
          case 'nu': return 'BẢNG XẾP HẠNG QUYỀN NỮ';
          case 'dong_doi_nam': return 'BẢNG XẾP HẠNG ĐỒNG ĐỘI NAM';
          case 'dong_doi_nu': return 'BẢNG XẾP HẠNG ĐỒNG ĐỘI NỮ';
          case 'hon_hop': return 'BẢNG XẾP HẠNG ĐỒNG ĐỘI NAM - NỮ';
          case 'vo_nhac': return 'BẢNG XẾP HẠNG VÕ NHẠC';
          case 'nam':
          default: return 'BẢNG XẾP HẠNG QUYỀN NAM';
        }
      };

      const title = customTitle || (
        formFilter !== 'all' 
          ? `BẢNG XẾP HẠNG: ${formFilter.toUpperCase()}`
          : getCategoryTitle(category)
      );
      await setDoc(doc(db, 'settings', 'global'), {
        activeView: 'leaderboard',
        activeLeaderboardCategory: category,
        activeLeaderboardFormFilter: formFilter,
        activeLeaderboardTitle: title,
        showScoresAndLeaderboard: true
      }, { merge: true });
    } catch (error) {
      console.error("Error projecting leaderboard:", error);
    }
  };

  // Performance Functions
  const addPerformance = async (category: 'thi_quyen' | 'vo_nhac') => {
    if (!newPerf.name || !newPerf.competitor) return;
    try {
      await addDoc(collection(db, 'performances'), {
        ...newPerf,
        category,
        gender: category === 'vo_nhac' ? (newPerf.gender || 'hon_hop') : (newPerf.gender || 'nam'),
        scores: {},
        totalScore: 0,
        averageScore: 0,
        status: 'pending',
        order: performances.filter(p => (p.category || 'thi_quyen') === category).length + 1,
        createdAt: new Date().toISOString()
      });
      setNewPerf({ name: '', competitor: '', gender: newPerf.gender, bgUrl: '' });
    } catch (error) {
      console.error("Error adding performance:", error);
    }
  };

  // Admin Direct Score Edit Handlers
  const handleOpenScoreEdit = (p: Performance) => {
    const scoresCount = Object.keys(p.scores || {}).length;
    const currentTotal = scoresCount > 0 
      ? Object.values(p.scores).reduce((a, b) => a + (b.score || 0), 0)
      : (p.totalScore ?? p.averageScore ?? 0);

    setEditingPerf({
      id: p.id,
      name: p.name || '',
      competitor: p.competitor || '',
      gender: p.gender || 'nam',
      category: p.category || 'thi_quyen',
      scores: JSON.parse(JSON.stringify(p.scores || {})),
      directTotal: currentTotal > 0 ? currentTotal.toString() : ''
    });
    setDirectScoreInput(currentTotal > 0 ? currentTotal.toString() : '');
    setQuickScoreInput('');
    setEditScoreMode(scoresCount > 0 ? 'detailed' : 'direct');
  };

  const handleJudgeScoreChange = (judgeKey: string, scoreVal: number) => {
    if (!editingPerf) return;
    // Allow any non-negative number, clamp to 0-100 if needed but allow flexible input
    const clamped = Math.max(0, Math.min(100, scoreVal));
    setEditingPerf(prev => {
      if (!prev) return null;
      return {
        ...prev,
        scores: {
          ...prev.scores,
          [judgeKey]: {
            ...prev.scores[judgeKey],
            score: Number(clamped.toFixed(2))
          }
        }
      };
    });
  };

  const handleJudgeScoreDelta = (judgeKey: string, delta: number) => {
    if (!editingPerf || !editingPerf.scores[judgeKey]) return;
    const current = Number(editingPerf.scores[judgeKey].score) || 0;
    handleJudgeScoreChange(judgeKey, current + delta);
  };

  const handleJudgeNameChange = (judgeKey: string, nameVal: string) => {
    if (!editingPerf) return;
    setEditingPerf(prev => {
      if (!prev) return null;
      return {
        ...prev,
        scores: {
          ...prev.scores,
          [judgeKey]: {
            ...prev.scores[judgeKey],
            name: nameVal
          }
        }
      };
    });
  };

  const handleRemoveJudge = (judgeKey: string) => {
    if (!editingPerf) return;
    setEditingPerf(prev => {
      if (!prev) return null;
      const nextScores = { ...prev.scores };
      delete nextScores[judgeKey];
      return {
        ...prev,
        scores: nextScores
      };
    });
  };

  const handleAddJudge = () => {
    if (!editingPerf) return;
    const count = Object.keys(editingPerf.scores).length;
    const newKey = `judge_admin_${Date.now()}_${count + 1}`;
    setEditingPerf(prev => {
      if (!prev) return null;
      return {
        ...prev,
        scores: {
          ...prev.scores,
          [newKey]: {
            name: `Giám định ${count + 1}`,
            score: 85.0
          }
        }
      };
    });
  };

  const handleSetup5Judges = (defaultScore: number = 85.0) => {
    if (!editingPerf) return;
    const newScores: Record<string, { score: number; name: string }> = {};
    for (let i = 1; i <= 5; i++) {
      newScores[`judge_${i}`] = {
        name: `Giám định ${i}`,
        score: defaultScore
      };
    }
    setEditingPerf(prev => {
      if (!prev) return null;
      return { ...prev, scores: newScores };
    });
  };

  const handleResetScores = () => {
    if (!editingPerf) return;
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ điểm của tiết mục này về 0?")) {
      setEditingPerf(prev => {
        if (!prev) return null;
        return { ...prev, scores: {}, directTotal: '0' };
      });
      setDirectScoreInput('0');
    }
  };

  const handleApplyQuickTotal = () => {
    if (!editingPerf || !quickScoreInput.trim()) return;
    const targetVal = parseFloat(quickScoreInput.replace(',', '.'));
    if (isNaN(targetVal) || targetVal < 0) {
      alert("Vui lòng nhập số điểm hợp lệ!");
      return;
    }

    const judgeKeys = Object.keys(editingPerf.scores);
    const count = judgeKeys.length > 0 ? judgeKeys.length : 5;
    const perJudge = parseFloat((targetVal / count).toFixed(2));

    const updated: Record<string, { score: number; name: string }> = {};
    if (judgeKeys.length > 0) {
      judgeKeys.forEach(k => {
        updated[k] = {
          ...editingPerf.scores[k],
          score: perJudge
        };
      });
    } else {
      for (let i = 1; i <= 5; i++) {
        updated[`judge_${i}`] = {
          name: `Giám định ${i}`,
          score: perJudge
        };
      }
    }

    setEditingPerf(prev => {
      if (!prev) return null;
      return { ...prev, scores: updated };
    });
    setQuickScoreInput('');
  };

  // Lưu điểm trực tiếp (Không có hoặc không hiện điểm giám định)
  const handleSaveDirectScoreOnly = async (customScore?: number) => {
    if (!editingPerf) return;
    const scoreText = customScore !== undefined ? customScore.toString() : directScoreInput;
    const directVal = parseFloat(scoreText.replace(',', '.'));
    if (isNaN(directVal) || directVal < 0) {
      alert("Vui lòng nhập số điểm hợp lệ!");
      return;
    }

    setIsSavingScore(true);
    try {
      await updateDoc(doc(db, 'performances', editingPerf.id), {
        name: editingPerf.name.trim(),
        competitor: editingPerf.competitor.trim(),
        gender: editingPerf.gender,
        category: editingPerf.category,
        scores: {}, // Xóa sạch bảng giám định để chỉ lưu và hiện tổng điểm trực tiếp
        totalScore: directVal,
        averageScore: directVal
      });

      setEditingPerf(null);
    } catch (error) {
      console.error("Error saving direct score:", error);
      alert("Lỗi khi lưu điểm trực tiếp: " + (error as Error).message);
    } finally {
      setIsSavingScore(false);
    }
  };

  const handleSaveScoreEdit = async () => {
    if (!editingPerf) return;

    // Nếu đang ở chế độ Nhập Trực Tiếp và không có giám khảo nào
    if (editScoreMode === 'direct') {
      await handleSaveDirectScoreOnly();
      return;
    }

    setIsSavingScore(true);
    try {
      const scoreValues = Object.values(editingPerf.scores).map(s => Number(s.score) || 0);
      const total = scoreValues.reduce((a, b) => a + b, 0);
      const avg = scoreValues.length > 0 ? (total / scoreValues.length) : total;

      await updateDoc(doc(db, 'performances', editingPerf.id), {
        name: editingPerf.name.trim(),
        competitor: editingPerf.competitor.trim(),
        gender: editingPerf.gender,
        category: editingPerf.category,
        scores: editingPerf.scores,
        totalScore: total,
        averageScore: avg
      });

      setEditingPerf(null);
    } catch (error) {
      console.error("Error saving score edit:", error);
      alert("Lỗi khi lưu điểm: " + (error as Error).message);
    } finally {
      setIsSavingScore(false);
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
            label="ĐỐI KHÁNG" 
          />
          <TabButton 
            active={activeTab === 'backgrounds'} 
            onClick={() => setActiveTab('backgrounds')}
            icon={<Image className="w-4 h-4 text-amber-400" />}
            label="BACKGROUND & SLIDES" 
          />
          <TabButton 
            active={activeTab === 'thi_quyen'} 
            onClick={() => setActiveTab('thi_quyen')}
            icon={<Users className="w-4 h-4 text-blue-400" />}
            label="THI QUYỀN (NAM & NỮ)" 
          />
          <TabButton 
            active={activeTab === 'vo_nhac'} 
            onClick={() => setActiveTab('vo_nhac')}
            icon={<Flame className="w-4 h-4 text-emerald-400" />}
            label="VÕ NHẠC" 
          />
          <TabButton 
            active={activeTab === 'leaderboard'} 
            onClick={() => setActiveTab('leaderboard')}
            icon={<Trophy className="w-4 h-4 text-amber-400" />}
            label="BẢNG XẾP HẠNG NỘI DUNG" 
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
        {/* TAB 3: THI QUYỀN (NAM & NỮ) */}
        {/* ========================================================================= */}
        {activeTab === 'thi_quyen' && (
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
                    ? 'Trạng thái: Đang ẨN ĐIỂM (Chấm kín). Khán giả chỉ thấy phông nền, tên bài thi & VĐV.' 
                    : 'Trạng thái: ĐANG CÔNG BỐ KẾT QUẢ TRÊN MÀN HÌNH LED!'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Nút Chuyển Đổi: Ẩn/Hiện Điểm Giám Định Trên Màn LED */}
                <button
                  type="button"
                  onClick={() => toggleJudgeScoresVisibilityOnLED(!settings?.hideJudgeScoresOnLED)}
                  className={`px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all border ${
                    settings?.hideJudgeScoresOnLED
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                  title="Bấm để ẩn hoặc hiện các ô điểm số của từng giám khảo trên màn hình LED"
                >
                  {settings?.hideJudgeScoresOnLED ? (
                    <>
                      <EyeOff className="w-4 h-4 text-amber-400" />
                      <span>Đang Ẩn Giám Định (Chỉ Hiện Tổng Điểm)</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 text-blue-400" />
                      <span>Hiện Chi Tiết Từng Giám Định</span>
                    </>
                  )}
                </button>

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
                      BẬT SHOW KẾT QUẢ LÊN LED
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

            {/* Form Thêm Tiết Mục Thi Quyền */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <h2 className="text-base font-bold flex items-center gap-2 text-white">
                  <Plus className="w-5 h-5 text-blue-400" /> Thêm tiết mục Thi Quyền mới
                </h2>

                {/* Chọn Phân Loại Nội Dung Quyền */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400 px-2 uppercase">Nội dung:</span>
                  <button
                    type="button"
                    onClick={() => setNewPerf({...newPerf, gender: 'nam'})}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                      newPerf.gender === 'nam'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>♂</span> Quyền Nam
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPerf({...newPerf, gender: 'nu'})}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                      newPerf.gender === 'nu'
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30 ring-1 ring-pink-400'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>♀</span> Quyền Nữ
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPerf({...newPerf, gender: 'dong_doi_nam'})}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                      newPerf.gender === 'dong_doi_nam'
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>👥</span> Đồng Đội Nam
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPerf({...newPerf, gender: 'dong_doi_nu'})}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                      newPerf.gender === 'dong_doi_nu'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>👥</span> Đồng Đội Nữ
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPerf({...newPerf, gender: 'hon_hop'})}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                      newPerf.gender === 'hon_hop'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>👫</span> Đồng Đội Cả Nam & Nữ
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons for Vovinam Forms */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Chọn nhanh bài quyền Vovinam:
                </p>
                <div className="flex flex-wrap gap-2">
                  {vovinamFormsPresets.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewPerf({...newPerf, name: preset})}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                        newPerf.name === preset
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <input 
                  placeholder="Tên bài thi (VD: Long Hổ Quyền, Tứ Tượng...)" 
                  value={newPerf.name} 
                  onChange={e => setNewPerf({...newPerf, name: e.target.value})}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 font-semibold"
                />
                <input 
                  placeholder="Họ tên VĐV / Đơn vị thực hiện" 
                  value={newPerf.competitor} 
                  onChange={e => setNewPerf({...newPerf, competitor: e.target.value})}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 font-semibold"
                />
                <button 
                  onClick={() => addPerformance('thi_quyen')} 
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors text-white shadow-lg flex items-center justify-center gap-2 ${
                    newPerf.gender === 'nu' 
                      ? 'bg-pink-600 hover:bg-pink-500 shadow-pink-600/30' 
                      : newPerf.gender === 'dong_doi_nam'
                      ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
                      : newPerf.gender === 'dong_doi_nu'
                      ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                      : newPerf.gender === 'hon_hop'
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                  }`}
                >
                  <Plus className="w-4 h-4" /> Thêm Tiết Mục
                </button>
              </div>
            </div>

            {/* Filter Tabs for Categories */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex-wrap">
                <button
                  onClick={() => setFormsGenderFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                    formsGenderFilter === 'all'
                      ? 'bg-slate-800 text-white shadow border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tất cả ({performances.filter(p => (p.category || 'thi_quyen') === 'thi_quyen').length})
                </button>
                <button
                  onClick={() => setFormsGenderFilter('nam')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1 ${
                    formsGenderFilter === 'nam'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-blue-300'
                  }`}
                >
                  <span>♂</span> Nam ({performances.filter(p => (p.category || 'thi_quyen') === 'thi_quyen' && (p.gender || 'nam') === 'nam').length})
                </button>
                <button
                  onClick={() => setFormsGenderFilter('nu')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1 ${
                    formsGenderFilter === 'nu'
                      ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                      : 'text-slate-400 hover:text-pink-300'
                  }`}
                >
                  <span>♀</span> Nữ ({performances.filter(p => (p.category || 'thi_quyen') === 'thi_quyen' && p.gender === 'nu').length})
                </button>
                <button
                  onClick={() => setFormsGenderFilter('dong_doi_nam')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1 ${
                    formsGenderFilter === 'dong_doi_nam'
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                      : 'text-slate-400 hover:text-cyan-300'
                  }`}
                >
                  <span>👥</span> Đ.Đội Nam ({performances.filter(p => (p.category || 'thi_quyen') === 'thi_quyen' && p.gender === 'dong_doi_nam').length})
                </button>
                <button
                  onClick={() => setFormsGenderFilter('dong_doi_nu')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1 ${
                    formsGenderFilter === 'dong_doi_nu'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-400 hover:text-purple-300'
                  }`}
                >
                  <span>👥</span> Đ.Đội Nữ ({performances.filter(p => (p.category || 'thi_quyen') === 'thi_quyen' && p.gender === 'dong_doi_nu').length})
                </button>
                <button
                  onClick={() => setFormsGenderFilter('hon_hop')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1 ${
                    formsGenderFilter === 'hon_hop'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                >
                  <span>👫</span> Đ.Đội Nam-Nữ ({performances.filter(p => (p.category || 'thi_quyen') === 'thi_quyen' && p.gender === 'hon_hop').length})
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => projectCategoryLeaderboardToLED(formsGenderFilter === 'all' ? 'nam' : formsGenderFilter)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-amber-500/20"
                >
                  <Trophy className="w-4 h-4" /> Chiếu BXH Nội Dung Này Lên LED
                </button>
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
                >
                  Chi Tiết BXH
                </button>
              </div>
            </div>

            {/* Danh Sách Tiết Mục Thi Quyền */}
            <div className="grid gap-4">
              {performances
                .filter(p => (p.category || 'thi_quyen') === 'thi_quyen')
                .filter(p => {
                  if (formsGenderFilter === 'all') return true;
                  return (p.gender || 'nam') === formsGenderFilter;
                })
                .length === 0 ? (
                <div className="text-center py-12 bg-slate-900/60 rounded-3xl border border-slate-800">
                  <p className="text-slate-400 text-sm">Chưa có tiết mục nào trong danh sách. Hãy thêm tiết mục ở trên!</p>
                </div>
              ) : (
                performances
                  .filter(p => (p.category || 'thi_quyen') === 'thi_quyen')
                  .filter(p => {
                    if (formsGenderFilter === 'all') return true;
                    return (p.gender || 'nam') === formsGenderFilter;
                  })
                  .map(p => {
                    const isCurrentActive = settings?.activeId === p.id && settings?.activeView === 'forms';
                    const isShowingScores = isCurrentActive && !isLeaderboardHidden;
                    const scoresCount = Object.keys(p.scores || {}).length;

                    const getPerfBadge = () => {
                      if (p.gender === 'dong_doi_nam') {
                        return { label: '👥 ĐỒNG ĐỘI NAM', cls: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40' };
                      }
                      if (p.gender === 'dong_doi_nu') {
                        return { label: '👥 ĐỒNG ĐỘI NỮ', cls: 'bg-purple-950/60 text-purple-300 border-purple-500/40' };
                      }
                      if (p.gender === 'hon_hop') {
                        return { label: '👫 ĐỒNG ĐỘI NAM - NỮ', cls: 'bg-amber-950/60 text-amber-300 border-amber-500/40' };
                      }
                      if (p.gender === 'nu') {
                        return { label: '♀ QUYỀN NỮ', cls: 'bg-pink-950/60 text-pink-300 border-pink-500/40' };
                      }
                      return { label: '♂ QUYỀN NAM', cls: 'bg-blue-950/60 text-blue-300 border-blue-500/40' };
                    };

                    const badge = getPerfBadge();

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
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${badge.cls}`}>
                              {badge.label}
                            </span>
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
                          <button
                            type="button"
                            onClick={() => handleOpenScoreEdit(p)}
                            className="bg-slate-950/80 hover:bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 hover:border-amber-500/50 text-right min-w-[120px] transition-all group cursor-pointer"
                            title="Bấm để chỉnh sửa điểm trực tiếp bằng quyền Admin"
                          >
                            <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 group-hover:text-amber-400 uppercase font-bold">
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>{scoresCount} giám khảo nộp</span>
                            </div>
                            <p className="text-2xl font-losttype font-score font-black text-amber-400 leading-tight">
                              {(scoresCount > 0 
                                ? Object.values(p.scores).reduce((a, b) => a + (b.score || 0), 0) 
                                : (p.totalScore ?? p.averageScore ?? 0)
                              ).toFixed(1)}
                            </p>
                          </button>

                          {/* Nút Sửa Điểm Trực Tiếp (Admin) */}
                          <button 
                            onClick={() => handleOpenScoreEdit(p)}
                            className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center gap-1.5 transition-all"
                            title="Sửa điểm từng giám khảo hoặc phân bổ lại điểm"
                          >
                            <Edit3 className="w-4 h-4" /> Sửa Điểm
                          </button>

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
        {/* TAB 4: VÕ NHẠC */}
        {/* ========================================================================= */}
        {activeTab === 'vo_nhac' && (
          <div className="space-y-6 font-inter">
            {/* Chế độ Màn hình Công Chiếu LED */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">
                    ĐIỀU KHIỂN CÔNG BỐ KẾT QUẢ VÕ NHẠC (LED)
                  </h3>
                </div>
                <p className="text-xs text-slate-300">
                  {isLeaderboardHidden 
                    ? 'Trạng thái: Đang ẨN ĐIỂM (Chấm kín).' 
                    : 'Trạng thái: ĐANG CÔNG BỐ KẾT QUẢ VÕ NHẠC TRÊN MÀN HÌNH LED!'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Nút Chuyển Đổi: Ẩn/Hiện Điểm Giám Định Trên Màn LED */}
                <button
                  type="button"
                  onClick={() => toggleJudgeScoresVisibilityOnLED(!settings?.hideJudgeScoresOnLED)}
                  className={`px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all border ${
                    settings?.hideJudgeScoresOnLED
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                  title="Bấm để ẩn hoặc hiện các ô điểm số của từng giám khảo trên màn hình LED"
                >
                  {settings?.hideJudgeScoresOnLED ? (
                    <>
                      <EyeOff className="w-4 h-4 text-amber-400" />
                      <span>Đang Ẩn Giám Định (Chỉ Hiện Tổng Điểm)</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span>Hiện Chi Tiết Từng Giám Định</span>
                    </>
                  )}
                </button>

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
                      BẬT SHOW KẾT QUẢ LÊN LED
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      ĐANG SHOW KẾT QUẢ (BẤM ĐỂ ẨN)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Form Thêm Tiết Mục Võ Nhạc */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
              <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-white">
                <Plus className="w-5 h-5 text-emerald-400" /> Thêm tiết mục Võ Nhạc mới
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                  placeholder="Tên bài võ nhạc (VD: Hào Khí Việt Nam, Khát Vọng Tuổi Trẻ...)" 
                  value={newPerf.name} 
                  onChange={e => setNewPerf({...newPerf, name: e.target.value})}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
                <input 
                  placeholder="Tên đội / CLB / Đơn vị biểu diễn" 
                  value={newPerf.competitor} 
                  onChange={e => setNewPerf({...newPerf, competitor: e.target.value})}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
                <button 
                  onClick={() => addPerformance('vo_nhac')} 
                  className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl font-bold text-sm transition-colors text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Thêm Tiết Mục Võ Nhạc
                </button>
              </div>
            </div>

            {/* Quick Action Bar for Vo Nhac */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Danh Sách Biểu Diễn Võ Nhạc ({performances.filter(p => p.category === 'vo_nhac').length})
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => projectCategoryLeaderboardToLED('vo_nhac')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-emerald-600/30"
                >
                  <Trophy className="w-4 h-4" /> Chiếu BXH Võ Nhạc Lên LED
                </button>
                <button
                  onClick={() => { setActiveTab('leaderboard'); setLeaderboardView('vo_nhac'); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
                >
                  Chi Tiết BXH
                </button>
              </div>
            </div>

            {/* Danh Sách Tiết Mục Võ Nhạc */}
            <div className="grid gap-4">
              {performances.filter(p => p.category === 'vo_nhac').length === 0 ? (
                <div className="text-center py-12 bg-slate-900/60 rounded-3xl border border-slate-800">
                  <p className="text-slate-400 text-sm">Chưa có tiết mục Võ Nhạc nào trong danh sách.</p>
                </div>
              ) : (
                performances.filter(p => p.category === 'vo_nhac').map(p => {
                  const isCurrentActive = settings?.activeId === p.id && settings?.activeView === 'forms';
                  const isShowingScores = isCurrentActive && !isLeaderboardHidden;
                  const scoresCount = Object.keys(p.scores || {}).length;

                  return (
                    <div 
                      key={p.id} 
                      className={`p-5 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                        isCurrentActive 
                          ? 'bg-emerald-950/40 border-emerald-500 shadow-2xl ring-1 ring-emerald-500/50' 
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-montserrat font-black text-xl text-white">{p.name}</h3>
                          {isCurrentActive && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider">
                              ĐANG CHIẾU
                            </span>
                          )}
                          {isShowingScores && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-black text-[10px] font-black uppercase tracking-wider animate-pulse">
                              ĐANG SHOW KẾT QUẢ
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300 text-sm font-bold font-montserrat">{p.competitor}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleOpenScoreEdit(p)}
                          className="bg-slate-950/80 hover:bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 hover:border-emerald-500/50 text-right min-w-[120px] transition-all group cursor-pointer"
                          title="Bấm để chỉnh sửa điểm trực tiếp bằng quyền Admin"
                        >
                          <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 group-hover:text-emerald-400 uppercase font-bold">
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>{scoresCount} giám khảo nộp</span>
                          </div>
                          <p className="text-2xl font-losttype font-score font-black text-amber-400 leading-tight">
                            {(scoresCount > 0 
                              ? Object.values(p.scores).reduce((a, b) => a + (b.score || 0), 0) 
                              : (p.totalScore ?? p.averageScore ?? 0)
                            ).toFixed(1)}
                          </p>
                        </button>

                        {/* Nút Sửa Điểm Trực Tiếp (Admin) */}
                        <button 
                          onClick={() => handleOpenScoreEdit(p)}
                          className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition-all"
                          title="Sửa điểm từng giám khảo hoặc phân bổ lại điểm"
                        >
                          <Edit3 className="w-4 h-4" /> Sửa Điểm
                        </button>

                        <button 
                          onClick={() => setLEDView('forms', p.id)}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                            isCurrentActive && isLeaderboardHidden 
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          <Play className="w-4 h-4" /> Chiếu LED
                        </button>

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
        {/* TAB 5: BẢNG XẾP HẠNG TỪNG NỘI DUNG (LEADERBOARD CHUYÊN SÂU) */}
        {/* ========================================================================= */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6 font-inter">
            {/* Header & Sub-Category Selector */}
            <div className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-6 h-6 text-amber-400" />
                    <h2 className="font-bebas text-3xl md:text-4xl text-white tracking-wider">
                      BẢNG XẾP HẠNG TỪNG NỘI DUNG THI ĐẤU
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    Tra cứu huy chương và chiếu bảng xếp hạng riêng biệt cho từng bảng đấu Quyền Nam, Quyền Nữ, Võ Nhạc hoặc từng bài quyền lên màn hình LED
                  </p>
                </div>

                {/* Switch Category Buttons */}
                <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-800 rounded-2xl border border-slate-700">
                  <button
                    onClick={() => { setLeaderboardView('nam'); setLeaderboardFormFilter('all'); }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      leaderboardView === 'nam'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>♂</span> Quyền Nam
                  </button>
                  <button
                    onClick={() => { setLeaderboardView('nu'); setLeaderboardFormFilter('all'); }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      leaderboardView === 'nu'
                        ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>♀</span> Quyền Nữ
                  </button>
                  <button
                    onClick={() => { setLeaderboardView('dong_doi_nam'); setLeaderboardFormFilter('all'); }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      leaderboardView === 'dong_doi_nam'
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>👥</span> Đ.Đội Nam
                  </button>
                  <button
                    onClick={() => { setLeaderboardView('dong_doi_nu'); setLeaderboardFormFilter('all'); }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      leaderboardView === 'dong_doi_nu'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>👥</span> Đ.Đội Nữ
                  </button>
                  <button
                    onClick={() => { setLeaderboardView('hon_hop'); setLeaderboardFormFilter('all'); }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      leaderboardView === 'hon_hop'
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>👫</span> Đ.Đội Nam-Nữ
                  </button>
                  <button
                    onClick={() => { setLeaderboardView('vo_nhac'); setLeaderboardFormFilter('all'); }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      leaderboardView === 'vo_nhac'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-emerald-400" /> Võ Nhạc
                  </button>
                </div>
              </div>

              {/* Broadcast Control Banner */}
              {(() => {
                const isBroadcastingThis = settings?.activeView === 'leaderboard' && 
                  (settings?.activeLeaderboardCategory || 'nam') === leaderboardView &&
                  (settings?.activeLeaderboardFormFilter || 'all') === leaderboardFormFilter;

                const getCategoryDisplayName = (cat: string) => {
                  switch (cat) {
                    case 'nu': return 'QUYỀN NỮ';
                    case 'dong_doi_nam': return 'ĐỒNG ĐỘI NAM';
                    case 'dong_doi_nu': return 'ĐỒNG ĐỘI NỮ';
                    case 'hon_hop': return 'ĐỒNG ĐỘI NAM - NỮ';
                    case 'vo_nhac': return 'VÕ NHẠC';
                    case 'nam':
                    default: return 'QUYỀN NAM';
                  }
                };

                const currentCategoryName = getCategoryDisplayName(leaderboardView);

                return (
                  <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    isBroadcastingThis
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-xl ring-2 ring-emerald-400/40'
                      : 'bg-gradient-to-r from-amber-500/10 via-slate-800 to-slate-800 border-amber-500/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        isBroadcastingThis ? 'bg-emerald-500 text-black' : 'bg-amber-500 text-black'
                      }`}>
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black uppercase text-white tracking-wider">
                            CHIẾU BẢNG XẾP HẠNG: {currentCategoryName}
                          </span>
                          {leaderboardFormFilter !== 'all' && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase">
                              Bài: {leaderboardFormFilter}
                            </span>
                          )}
                          {isBroadcastingThis && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                              ● ĐANG CHIẾU TRỰC TIẾP TRÊN LED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {isBroadcastingThis 
                            ? 'Màn hình LED sân khấu đang hiển thị toàn màn hình Bảng xếp hạng này.'
                            : 'Bấm nút bên cạnh để chuyển màn hình LED sang chế độ vinh danh Bảng xếp hạng này.'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => projectCategoryLeaderboardToLED(leaderboardView, leaderboardFormFilter)}
                      className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shrink-0 ${
                        isBroadcastingThis
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30 active:scale-95'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      {isBroadcastingThis ? 'ĐANG CHIẾU (BẤM ĐỂ LÀM MỚI)' : 'CHIẾU BẢNG NÀY LÊN MÀN LED'}
                    </button>
                  </div>
                );
              })()}

              {/* Secondary Filter: By Specific Form / Technique */}
              {(() => {
                const categoryPerformances = performances.filter(p => {
                  if (leaderboardView === 'vo_nhac') return p.category === 'vo_nhac';
                  const isForm = (p.category || 'thi_quyen') === 'thi_quyen';
                  if (!isForm) return false;
                  return (p.gender || 'nam') === leaderboardView;
                });

                const distinctForms = Array.from(new Set(categoryPerformances.map(p => p.name.trim()).filter(Boolean)));

                if (distinctForms.length <= 1) return null;

                return (
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-amber-400" />
                        Lọc theo bài thi cụ thể trong bảng này:
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {distinctForms.length} bài thi khác nhau
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => setLeaderboardFormFilter('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          leaderboardFormFilter === 'all'
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        Tất cả bài thi ({categoryPerformances.length})
                      </button>

                      {distinctForms.map(formName => {
                        const count = categoryPerformances.filter(p => p.name.trim().toLowerCase() === formName.toLowerCase()).length;
                        const isSelected = leaderboardFormFilter.trim().toLowerCase() === formName.trim().toLowerCase();

                        return (
                          <button
                            key={formName}
                            onClick={() => setLeaderboardFormFilter(formName)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            <span>{formName}</span>
                            <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ${
                              isSelected ? 'bg-black/30 text-slate-950' : 'bg-slate-700 text-slate-300'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Leaderboard Table Content */}
              {(() => {
                const getPerfScore = (p: Performance) => {
                  if (p.scores && Object.keys(p.scores).length > 0) {
                    return Object.values(p.scores).reduce((sum, item) => sum + (item.score || 0), 0);
                  }
                  return p.totalScore ?? p.averageScore ?? 0;
                };

                const targetPerformances = [...performances]
                  .filter(p => {
                    if (leaderboardView === 'vo_nhac') {
                      return p.category === 'vo_nhac';
                    }
                    const isForm = (p.category || 'thi_quyen') === 'thi_quyen';
                    if (!isForm) return false;
                    const gender = p.gender || 'nam';
                    return gender === leaderboardView;
                  })
                  .filter(p => {
                    if (leaderboardFormFilter === 'all') return true;
                    return p.name.trim().toLowerCase() === leaderboardFormFilter.trim().toLowerCase();
                  })
                  .sort((a, b) => getPerfScore(b) - getPerfScore(a));

                const titleText = leaderboardView === 'nam' 
                  ? 'BẢNG XẾP HẠNG QUYỀN NAM'
                  : leaderboardView === 'nu'
                  ? 'BẢNG XẾP HẠNG QUYỀN NỮ'
                  : leaderboardView === 'dong_doi_nam'
                  ? 'BẢNG XẾP HẠNG ĐỒNG ĐỘI NAM'
                  : leaderboardView === 'dong_doi_nu'
                  ? 'BẢNG XẾP HẠNG ĐỒNG ĐỘI NỮ'
                  : leaderboardView === 'hon_hop'
                  ? 'BẢNG XẾP HẠNG ĐỒNG ĐỘI NAM - NỮ'
                  : 'BẢNG XẾP HẠNG VÕ NHẠC VOVINAM';

                if (targetPerformances.length === 0) {
                  return (
                    <div className="text-center py-16 bg-slate-950/60 rounded-2xl border border-slate-800">
                      <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-300 font-bold">Chưa có dữ liệu tiết mục nào cho nội dung này</p>
                      <p className="text-xs text-slate-500 mt-1">Vui lòng vào tab Thi Quyền hoặc Võ Nhạc để thêm bài thi!</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <h3 className="font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <span>🏆</span> {titleText} {leaderboardFormFilter !== 'all' && `• BÀI: ${leaderboardFormFilter.toUpperCase()}`}
                      </h3>
                      <span className="text-xs text-slate-400 font-semibold">
                        Tổng số: {targetPerformances.length} bài thi
                      </span>
                    </div>

                    <div className="grid gap-3">
                      {targetPerformances.map((p, idx) => {
                        const score = getPerfScore(p);
                        const isGold = idx === 0 && score > 0;
                        const isSilver = idx === 1 && score > 0;
                        const isBronze = idx === 2 && score > 0;

                        return (
                          <div 
                            key={p.id}
                            className={`p-4 md:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                              isGold 
                                ? 'bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border-amber-500/50 shadow-lg shadow-amber-500/10'
                                : isSilver 
                                ? 'bg-gradient-to-r from-slate-300/15 via-slate-900 to-slate-900 border-slate-400/40'
                                : isBronze
                                ? 'bg-gradient-to-r from-amber-700/15 via-slate-900 to-slate-900 border-amber-700/40'
                                : 'bg-slate-950/60 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              {/* Rank Badge */}
                              <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-black shadow-md ${
                                isGold 
                                  ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-400' 
                                  : isSilver 
                                  ? 'bg-gradient-to-br from-slate-100 to-slate-400 text-slate-950 ring-2 ring-slate-300' 
                                  : isBronze 
                                  ? 'bg-gradient-to-br from-amber-600 to-amber-900 text-white ring-2 ring-amber-600' 
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}>
                                <span className="text-lg font-losttype font-score leading-none">{idx + 1}</span>
                                <span className="text-[8px] uppercase tracking-tighter">
                                  {isGold ? 'HCV 🥇' : isSilver ? 'HCB 🥈' : isBronze ? 'HCĐ 🥉' : `TOP ${idx + 1}`}
                                </span>
                              </div>

                              <div className="min-w-0">
                                <h4 className="font-montserrat font-black text-lg md:text-xl text-white truncate">
                                  {p.competitor}
                                </h4>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">{p.name}</span>
                                  <span className="text-xs text-slate-500">•</span>
                                  <span className="text-xs text-slate-400">{Object.keys(p.scores || {}).length} giám định đã chấm</span>
                                </div>
                              </div>
                            </div>

                            {/* Scores & Actions */}
                            <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
                              {/* Điểm từng giám khảo nếu có */}
                              {Object.keys(p.scores || {}).length > 0 && (
                                <div className="hidden xl:flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                                  {Object.values(p.scores).map((s, sIdx) => (
                                    <span key={sIdx} className="text-xs font-mono text-slate-300 px-1.5 py-0.5 bg-slate-800 rounded">
                                      {s.score.toFixed(1)}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="text-right min-w-[90px]">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">TỔNG ĐIỂM</p>
                                <p className="text-2xl md:text-3xl font-losttype font-score font-black text-amber-400">
                                  {score.toFixed(1)}
                                </p>
                              </div>

                              {/* Button: Sửa Điểm Trực Tiếp */}
                              <button
                                onClick={() => handleOpenScoreEdit(p)}
                                className="px-3.5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
                                title="Sửa điểm giám định của VĐV này"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Sửa Điểm
                              </button>

                              {/* Button: Chiếu BXH Bài Này */}
                              <button
                                onClick={() => projectCategoryLeaderboardToLED(leaderboardView, p.name)}
                                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
                                title={`Chiếu riêng Bảng xếp hạng bài ${p.name} lên màn hình LED`}
                              >
                                <Award className="w-3.5 h-3.5" /> BXH Bài Này
                              </button>

                              {/* Button: Show Chi Tiết Tiết Mục */}
                              <button
                                onClick={async () => {
                                  await setLEDView('forms', p.id);
                                  await toggleLeaderboardVisibility(true);
                                }}
                                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                                title="Chiếu kết quả VĐV này cùng Bảng xếp hạng lên màn LED"
                              >
                                <Trophy className="w-3.5 h-3.5" /> Show Tiết Mục
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
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
                      const batch = performances.map(p => updateDoc(doc(db, 'performances', p.id), { scores: {}, totalScore: 0, averageScore: 0 }));
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

        {/* ========================================================================= */}
        {/* MODAL CHỈNH SỬA ĐIỂM TRỰC TIẾP (QUYỀN ADMIN) */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {editingPerf && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.92, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 20 }}
                className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-8"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900/40 via-slate-800 to-amber-950/40 p-6 border-b border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Edit3 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bebas text-2xl md:text-3xl text-white tracking-wider">
                          NHẬP & CHỈNH SỬA ĐIỂM TIẾT MỤC
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider">
                          QUYỀN ADMIN
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Hỗ trợ nhập trực tiếp Tổng điểm (không hiện giám định) hoặc chấm chi tiết từng giám khảo.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingPerf(null)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mode Selector Tab inside Modal */}
                <div className="px-6 pt-4 pb-0 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditScoreMode('direct')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                        editScoreMode === 'direct'
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/20'
                          : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                      }`}
                    >
                      <Trophy className="w-4 h-4" />
                      Nhập Trực Tiếp Tổng Điểm (Không Hiện Giám Định)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditScoreMode('detailed');
                        if (Object.keys(editingPerf.scores).length === 0) {
                          handleSetup5Judges(85.0);
                        }
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                        editScoreMode === 'detailed'
                          ? 'bg-blue-600 text-white shadow-md font-black shadow-blue-600/30'
                          : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Chấm Chi Tiết Từng Giám Định (1 - 5 Giám Khảo)
                    </button>
                  </div>

                  {/* LED Judge Display Toggle */}
                  <div className="flex items-center gap-2 py-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Trên Màn LED:</span>
                    <button
                      type="button"
                      onClick={() => toggleJudgeScoresVisibilityOnLED(!settings?.hideJudgeScoresOnLED)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                        settings?.hideJudgeScoresOnLED
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      }`}
                      title="Chuyển đổi ẩn/hiện các ô giám định trên màn hình LED công chiếu"
                    >
                      {settings?.hideJudgeScoresOnLED ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                          <span>Đang Ẩn Giám Định (Chỉ Hiện Tổng Điểm)</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>Hiện Chi Tiết Từng Giám Định</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {/* Thông tin bài thi & VĐV */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Tên Bài Thi / Tiết Mục
                      </label>
                      <input
                        type="text"
                        value={editingPerf.name}
                        onChange={e => setEditingPerf({ ...editingPerf, name: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Họ Tên VĐV / Đơn Vị
                      </label>
                      <input
                        type="text"
                        value={editingPerf.competitor}
                        onChange={e => setEditingPerf({ ...editingPerf, competitor: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Nội Dung Thi Đấu
                      </label>
                      <select
                        value={editingPerf.category === 'vo_nhac' ? 'vo_nhac' : editingPerf.gender}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'vo_nhac') {
                            setEditingPerf({ ...editingPerf, category: 'vo_nhac', gender: 'hon_hop' });
                          } else {
                            setEditingPerf({ ...editingPerf, category: 'thi_quyen', gender: val as any });
                          }
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-amber-500 outline-none"
                      >
                        <option value="nam">♂ Quyền Nam</option>
                        <option value="nu">♀ Quyền Nữ</option>
                        <option value="dong_doi_nam">👥 Quyền Đồng Đội Nam</option>
                        <option value="dong_doi_nu">👥 Quyền Đồng Đội Nữ</option>
                        <option value="hon_hop">👫 Quyền Đồng Đội Cả Nam & Nữ</option>
                        <option value="vo_nhac">🎵 Võ Nhạc Vovinam</option>
                      </select>
                    </div>
                  </div>

                  {/* CHẾ ĐỘ 1: NHẬP TRỰC TIẾP TỔNG ĐIỂM (KHÔNG HIỆN GIÁM ĐỊNH) */}
                  {editScoreMode === 'direct' && (
                    <div className="space-y-5">
                      <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border-2 border-amber-500/40 p-6 rounded-3xl">
                        <div className="flex items-center gap-2 mb-3">
                          <Trophy className="w-5 h-5 text-amber-400" />
                          <h4 className="text-sm font-black text-amber-300 uppercase tracking-wider">
                            NHẬP TỔNG ĐIỂM / ĐIỂM TRUNG BÌNH CHÍNH THỨC
                          </h4>
                        </div>
                        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                          Nhập trực tiếp số điểm cuối cùng của bài thi (Ví dụ: <strong className="text-amber-400 font-mono text-sm">88.5</strong> hoặc <strong className="text-amber-400 font-mono text-sm">344.0</strong>). Hệ thống sẽ lưu và hiển thị trực tiếp con số này lên Màn hình LED & Bảng xếp hạng mà <strong className="text-white">không hiển thị các ô giám định viên</strong>.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="relative flex-1 w-full">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="1000"
                              autoFocus
                              value={directScoreInput}
                              onChange={e => setDirectScoreInput(e.target.value)}
                              placeholder="Nhập số điểm (VD: 88.5)"
                              className="w-full bg-slate-950 border-2 border-amber-400/80 rounded-2xl px-5 py-4 text-center sm:text-left text-3xl md:text-4xl font-losttype font-score font-black text-amber-400 outline-none focus:ring-4 focus:ring-amber-500/30"
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveDirectScoreOnly();
                              }}
                            />
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                const curr = parseFloat(directScoreInput) || 0;
                                setDirectScoreInput((curr + 0.1).toFixed(2));
                              }}
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700"
                            >
                              +0.1
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const curr = parseFloat(directScoreInput) || 0;
                                setDirectScoreInput((curr + 0.5).toFixed(2));
                              }}
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700"
                            >
                              +0.5
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const curr = parseFloat(directScoreInput) || 0;
                                setDirectScoreInput((curr + 1.0).toFixed(2));
                              }}
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700"
                            >
                              +1.0
                            </button>
                          </div>
                        </div>

                        {/* Quick Presets for Score */}
                        <div className="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Điểm mẫu nhanh:</span>
                          {[80.0, 85.0, 87.5, 90.0, 92.5, 95.0, 340.0, 345.0].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setDirectScoreInput(val.toString())}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 rounded-lg text-xs font-mono font-bold transition-all"
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-slate-300">
                            Muốn tạo lại 5 giám định viên từ số điểm này?
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseFloat(directScoreInput) || 85.0;
                            const perJudge = parseFloat((val > 100 ? val / 5 : val).toFixed(2));
                            handleSetup5Judges(perJudge);
                            setEditScoreMode('detailed');
                          }}
                          className="px-3.5 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition-all"
                        >
                          Tự Động Tạo 5 Giám Khảo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CHẾ ĐỘ 2: CHẤM & SỬA CHI TIẾT TỪNG GIÁM ĐỊNH */}
                  {editScoreMode === 'detailed' && (
                    <div className="space-y-6">
                      {/* Banner Thống kê Điểm Tính Toán Trực Tiếp */}
                      {(() => {
                        const judgeValues = Object.values(editingPerf.scores);
                        const total = judgeValues.reduce((sum, item) => sum + (Number(item.score) || 0), 0);
                        const count = judgeValues.length;
                        const avg = count > 0 ? (total / count) : 0;

                        return (
                          <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/40 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                                <Trophy className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                                  TỔNG KẾT ĐIỂM TIẾT MỤC
                                </p>
                                <div className="flex items-baseline gap-3">
                                  <span className="text-3xl md:text-4xl font-losttype font-score font-black text-amber-400">
                                    {total.toFixed(1)}
                                  </span>
                                  <span className="text-xs text-slate-400 font-semibold">
                                    (TB: {avg.toFixed(2)} / {count} Giám khảo)
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Quick actions presets */}
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              <button
                                type="button"
                                onClick={handleAddJudge}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                              >
                                <UserPlus className="w-3.5 h-3.5" /> + Thêm Giám Khảo
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetup5Judges(85.0)}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                                title="Tạo nhanh 5 giám khảo chuẩn (mỗi GK 85.0)"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" /> 5 Giám Khảo Chuẩn
                              </button>
                              <button
                                type="button"
                                onClick={handleResetScores}
                                className="px-3 py-2 bg-red-950/50 hover:bg-red-900/80 text-red-300 border border-red-800/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Reset
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Quick Score Input (Phân bổ nhanh tổng điểm) */}
                      <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex items-center gap-2 shrink-0">
                          <Calculator className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Phân Bổ Nhanh Tổng Điểm:
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 w-full">
                          <input
                            type="text"
                            value={quickScoreInput}
                            onChange={e => setQuickScoreInput(e.target.value)}
                            placeholder="VD: 344.0 (Tự động chia đều cho các giám định)"
                            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 outline-none flex-1"
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleApplyQuickTotal();
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleApplyQuickTotal}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow shrink-0"
                          >
                            Chia Đều Điểm
                          </button>
                        </div>
                      </div>

                      {/* Danh Sách Từng Giám Định */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <span>📋</span> Danh Sách Giám Định & Điểm Chấm Chi Tiết:
                          </h4>
                          <span className="text-xs text-slate-400 font-semibold">
                            {Object.keys(editingPerf.scores).length} Giám định đã nhập
                          </span>
                        </div>

                        {Object.keys(editingPerf.scores).length === 0 ? (
                          <div className="text-center py-10 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
                            <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                            <p className="text-slate-400 font-bold text-sm">Chưa có điểm giám định nào được ghi nhận</p>
                            <div className="flex justify-center gap-3 mt-3">
                              <button
                                type="button"
                                onClick={handleAddJudge}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                              >
                                <UserPlus className="w-4 h-4" /> Thêm Giám Khảo 1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetup5Judges(85.0)}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-black flex items-center gap-1.5"
                              >
                                <SlidersHorizontal className="w-4 h-4" /> Tạo 5 Giám Khảo Chuẩn
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {Object.entries(editingPerf.scores).map(([judgeKey, judgeData], idx) => (
                              <div
                                key={judgeKey}
                                className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-700"
                              >
                                {/* Judge Info & Name */}
                                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                                    {idx + 1}
                                  </div>
                                  <input
                                    type="text"
                                    value={judgeData.name || `Giám định ${idx + 1}`}
                                    onChange={e => handleJudgeNameChange(judgeKey, e.target.value)}
                                    placeholder={`Tên giám định ${idx + 1}`}
                                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-amber-500 outline-none w-full"
                                  />
                                </div>

                                {/* Score Control & Quick Adjustments */}
                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                  {/* Minus Step buttons */}
                                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                                    <button
                                      type="button"
                                      onClick={() => handleJudgeScoreDelta(judgeKey, -1)}
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                                      title="Trừ 1 điểm"
                                    >
                                      -1
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleJudgeScoreDelta(judgeKey, -0.5)}
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                                      title="Trừ 0.5 điểm"
                                    >
                                      -0.5
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleJudgeScoreDelta(judgeKey, -0.1)}
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                                      title="Trừ 0.1 điểm"
                                    >
                                      -0.1
                                    </button>
                                  </div>

                                  {/* Number Input */}
                                  <div className="relative w-28">
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={judgeData.score}
                                      onChange={e => handleJudgeScoreChange(judgeKey, parseFloat(e.target.value) || 0)}
                                      className="w-full bg-slate-900 border-2 border-amber-500/50 rounded-xl px-3 py-2 text-center text-amber-400 font-losttype font-score font-black text-xl outline-none focus:border-amber-400"
                                    />
                                  </div>

                                  {/* Plus step buttons */}
                                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                                    <button
                                      type="button"
                                      onClick={() => handleJudgeScoreDelta(judgeKey, 0.1)}
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                                      title="Cộng 0.1 điểm"
                                    >
                                      +0.1
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleJudgeScoreDelta(judgeKey, 0.5)}
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                                      title="Cộng 0.5 điểm"
                                    >
                                      +0.5
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleJudgeScoreDelta(judgeKey, 1)}
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                                      title="Cộng 1 điểm"
                                    >
                                      +1
                                    </button>
                                  </div>

                                  {/* Delete Judge */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveJudge(judgeKey)}
                                    className="p-2.5 bg-slate-900 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-xl border border-slate-800 transition-colors"
                                    title="Xóa giám định này"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-950 p-6 border-t border-slate-800 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setEditingPerf(null)}
                    className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    Hủy Bỏ
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveScoreEdit}
                    disabled={isSavingScore}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSavingScore ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Đang Lưu Điểm...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" /> Lưu Điểm & Cập Nhật Lên Màn LED
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
