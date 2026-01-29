
import React, { useState, useEffect, useRef } from 'react';
import { AttendanceStatus, TimetableEntry, AttendanceRecord, UserSettings } from './types';
import Dashboard from './components/Dashboard';
import TimetableEditor from './components/TimetableEditor';
import AttendanceCalendar from './components/AttendanceCalendar';
import AIChat from './components/AIChat';
import { LayoutDashboard, Calendar, ClipboardList, MessageSquare, Settings, CheckCircle2, Download, Upload } from 'lucide-react';

const STORAGE_KEYS = {
  TIMETABLE: 'attendbuddy_timetable',
  ATTENDANCE: 'attendbuddy_records',
  SETTINGS: 'attendbuddy_settings'
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'timetable' | 'ai' | 'settings'>('dashboard');
  const [timetable, setTimetable] = useState<TimetableEntry[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.TIMETABLE) : null;
    return saved ? JSON.parse(saved) : [];
  });
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ATTENDANCE) : null;
    return saved ? JSON.parse(saved) : [];
  });
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SETTINGS) : null;
    return saved ? JSON.parse(saved) : { targetPercentage: 75 };
  });
  const [lastEdit, setLastEdit] = useState<{ date: string; subject: string; status: AttendanceStatus } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeout = useRef<any>(null);

  const triggerSaveFeedback = () => {
    setIsSaving(true);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => setIsSaving(false), 1500);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(timetable));
    triggerSaveFeedback();
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
    triggerSaveFeedback();
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    triggerSaveFeedback();
  }, [settings]);

  const updateRecord = (date: string, subjectId: string, status: AttendanceStatus) => {
    const subjectName = timetable.find(t => t.id === subjectId)?.subject || 'Unknown';
    setRecords(prev => {
      const filtered = prev.filter(r => !(r.date === date && r.subjectId === subjectId));
      if (status === AttendanceStatus.NOT_SET) return filtered;
      return [...filtered, { date, subjectId, status }];
    });
    setLastEdit({ date, subject: subjectName, status });
  };

  const calculateOverallStats = () => {
    const present = records.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const absent = records.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const total = present + absent;
    const percentage = total === 0 ? 0 : (present / total) * 100;
    return { percentage: percentage.toFixed(2), target: settings.targetPercentage };
  };

  const stats = calculateOverallStats();

  return (
    <div className="min-h-[100dvh] bg-[#0d111d] sm:bg-[#1e293b] flex items-center justify-center p-0 overflow-hidden antialiased">
      {/* Desktop Polish: Sophisticated Background Glows */}
      <div className="hidden sm:block fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[45%] h-[45%] bg-indigo-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Strict Mobile Container Ratio (Targeting iPhone Pro dimensions on desktop) */}
      <div className="relative w-full h-[100dvh] sm:max-w-[420px] sm:h-[860px] sm:max-h-[95dvh] bg-white flex flex-col font-sans select-none sm:rounded-[3.25rem] sm:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] overflow-hidden sm:border-[12px] sm:border-slate-800 z-10 transition-all duration-700 ease-in-out">
        
        {/* Mobile Header */}
        <header className="bg-white/95 backdrop-blur-xl px-6 py-5 flex items-center justify-between shrink-0 z-40 safe-top border-b border-slate-50">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-[#0d111d] tracking-tighter leading-none">Buddy</h1>
            <div className={`transition-all duration-500 flex items-center gap-1.5 mt-1.5 ${isSaving ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Syncing</span>
            </div>
          </div>
          <div className="bg-[#0d111d] text-white px-4 py-2 rounded-2xl shadow-xl shadow-slate-200 transition-transform active:scale-95">
            <span className="text-[14px] font-black tracking-tight">{stats.percentage}%</span>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="w-full px-5 pt-4 pb-32">
            {activeTab === 'dashboard' && <Dashboard timetable={timetable} records={records} settings={settings} onSwitchTab={setActiveTab} onUpdateStatus={updateRecord} />}
            {activeTab === 'calendar' && <AttendanceCalendar timetable={timetable} records={records} onUpdateStatus={updateRecord} />}
            {activeTab === 'timetable' && <TimetableEditor timetable={timetable} setTimetable={setTimetable} />}
            {activeTab === 'ai' && <AIChat timetable={timetable} records={records} settings={settings} lastEdit={lastEdit} />}
            {activeTab === 'settings' && <SettingsPanel settings={settings} setSettings={setSettings} onRecordsUpdate={setRecords} onTimetableUpdate={setTimetable} onSettingsUpdate={setSettings} />}
          </div>
        </main>

        {/* Premium Floating Navigation */}
        <nav className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[88%] bg-[#0d111d]/95 backdrop-blur-md shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6)] rounded-[2.5rem] z-50 py-1.5 px-3 safe-bottom border border-white/10">
          <div className="flex justify-between items-center h-14">
            <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20}/>} label="Home" />
            <TabButton active={activeTab === 'timetable'} onClick={() => setActiveTab('timetable')} icon={<ClipboardList size={20}/>} label="Plan" />
            <TabButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<Calendar size={20}/>} label="Logs" />
            <TabButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<MessageSquare size={20}/>} label="AI" />
            <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={20}/>} label="Set" />
          </div>
        </nav>
        
        {/* Device Aesthetic: Notch */}
        <div className="hidden sm:block absolute left-1/2 -translate-x-1/2 top-0 w-28 h-6 bg-[#0d111d] rounded-b-2xl z-50 shadow-inner" />
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-0.5 transition-all duration-300 flex-1 ${active ? 'text-white scale-110' : 'text-slate-500'}`}>
    <div className={`p-1 transition-all ${active ? 'opacity-100 translate-y-[-2px]' : 'opacity-60 translate-y-0'}`}>
      {icon}
    </div>
    <span className={`text-[7px] font-black uppercase tracking-widest leading-none transition-all ${active ? 'opacity-100 scale-100 h-auto mt-0.5' : 'opacity-0 scale-50 h-0 overflow-hidden'}`}>{label}</span>
  </button>
);

interface SettingsPanelProps {
  settings: UserSettings;
  setSettings: any;
  onRecordsUpdate: any;
  onTimetableUpdate: any;
  onSettingsUpdate: any;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, setSettings, onRecordsUpdate, onTimetableUpdate, onSettingsUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = { 
      timetable: JSON.parse(localStorage.getItem(STORAGE_KEYS.TIMETABLE) || '[]'), 
      records: JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]'), 
      settings 
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AttendBuddy_Backup.json`;
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.timetable) onTimetableUpdate(data.timetable);
        if (data.records) onRecordsUpdate(data.records);
        if (data.settings) onSettingsUpdate(data.settings);
      } catch (err) { alert("Import Failed: Check file format."); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
      <div className="flex flex-col gap-1 px-1 pt-4">
        <h2 className="text-2xl font-black text-[#0d111d] tracking-tighter">Preferences</h2>
        <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Custom Environment</p>
      </div>

      <div className="bg-[#f8fafc] p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-7">Target Goal</label>
        <div className="space-y-6">
          <input 
            type="range" 
            min="50" 
            max="100" 
            value={settings.targetPercentage} 
            onChange={(e) => setSettings({ ...settings, targetPercentage: parseInt(e.target.value) })} 
            className="w-full h-2.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#0d111d]" 
          />
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-[#0d111d] tracking-tighter">{settings.targetPercentage}%</span>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Requirement</span>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-1">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">System Data</label>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={handleExport} className="flex flex-col items-center justify-center gap-3 bg-[#0d111d] text-white p-7 rounded-[2.25rem] active:scale-95 transition-all shadow-xl shadow-slate-900/10">
            <Download size={20} strokeWidth={2.5}/>
            <span className="text-[9px] font-black uppercase tracking-widest">Backup</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-3 bg-white border-2 border-slate-100 text-[#0d111d] p-7 rounded-[2.25rem] active:scale-95 transition-all">
            <Upload size={20} strokeWidth={2.5}/>
            <span className="text-[9px] font-black uppercase tracking-widest">Restore</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
        </div>
      </div>

      <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 shrink-0 shadow-sm border border-emerald-100/50">
           <CheckCircle2 size={18} strokeWidth={3}/>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-black text-emerald-900 uppercase tracking-wide">Secure Storage</p>
          <p className="text-[9px] font-semibold text-emerald-600/70 leading-relaxed">Your data remains private and local to this device.</p>
        </div>
      </div>
    </div>
  );
};

export default App;
