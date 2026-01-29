
import React, { useMemo } from 'react';
import { TimetableEntry, AttendanceRecord, AttendanceStatus, UserSettings } from '../types';
import { Check, X, Ban, Plus, ChevronRight, CircleSlash, ClipboardList, Zap, ShieldCheck, AlertCircle } from 'lucide-react';

interface Props {
  timetable: TimetableEntry[];
  records: AttendanceRecord[];
  settings: UserSettings;
  onSwitchTab: (tab: any) => void;
  onUpdateStatus: (date: string, subjectId: string, status: AttendanceStatus) => void;
}

const Dashboard: React.FC<Props> = ({ timetable, records, settings, onSwitchTab, onUpdateStatus }) => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay();
  
  const formattedDate = today.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const todayClasses = useMemo(() => {
    return timetable.filter(entry => entry.day === dayOfWeek);
  }, [timetable, dayOfWeek]);

  // Calculate Overall Status and Suggestion
  const overallHealth = useMemo(() => {
    const p = records.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const a = records.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const t = p + a;
    const target = settings.targetPercentage / 100;

    if (t === 0) return { pct: '0', text: 'Start logging your attendance to see insights.', status: 'neutral' };

    const currentPct = (p / t) * 100;
    
    if (p / t >= target) {
      const canMiss = Math.floor(p / target - t);
      const text = canMiss <= 0 
        ? "You're right on target! Try not to miss any more today." 
        : `You can safely miss ${canMiss} lectures and stay above ${settings.targetPercentage}%.`;
      return { pct: currentPct.toFixed(1), text, status: 'safe' };
    } else {
      const mustAttend = Math.ceil((target * t - p) / (1 - target));
      const text = `You need to attend ${mustAttend} more lectures to hit your ${settings.targetPercentage}% goal.`;
      return { pct: currentPct.toFixed(1), text, status: 'warning' };
    }
  }, [records, settings.targetPercentage]);

  const calculateInsight = (subjectId: string) => {
    const subjectRecords = records.filter(r => r.subjectId === subjectId);
    const p = subjectRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const a = subjectRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const t = p + a;
    const target = settings.targetPercentage / 100;

    if (t === 0) return { pct: '0', text: 'no data', color: 'text-slate-400' };

    const currentPct = (p / t) * 100;
    const pctStr = Math.round(currentPct).toString();

    if (p / t >= target) {
      const canMiss = Math.floor((p / target) - t);
      return { pct: pctStr, text: canMiss <= 0 ? "Safe (barely)" : `Can miss ${canMiss}`, color: 'text-emerald-500' };
    } else {
      const mustAttend = Math.ceil((target * t - p) / (1 - target));
      return { pct: pctStr, text: `Attend ${mustAttend} more`, color: 'text-rose-500' };
    }
  };

  const handleBulkMark = (status: AttendanceStatus) => {
    todayClasses.forEach(c => onUpdateStatus(dateStr, c.id, status));
  };

  if (timetable.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-400">
          <ClipboardList className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Empty Schedule</h2>
          <p className="text-slate-400 text-xs px-10 font-medium">Add your weekly classes in the Timetable tab to start tracking.</p>
        </div>
        <button onClick={() => onSwitchTab('timetable')} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">
          Set Timetable
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 px-1">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{formattedDate}</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Lectures</p>
        </div>
        <button onClick={() => onSwitchTab('timetable')} className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-indigo-600">
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>

      {/* Overall Status Pulse Card */}
      <div className={`p-6 rounded-[2.5rem] border shadow-xl transition-all duration-500 flex flex-col gap-4 ${
        overallHealth.status === 'safe' ? 'bg-emerald-50/50 border-emerald-100' : 
        overallHealth.status === 'warning' ? 'bg-rose-50/50 border-rose-100' : 
        'bg-white border-slate-100'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              overallHealth.status === 'safe' ? 'bg-emerald-500 text-white' : 
              overallHealth.status === 'warning' ? 'bg-rose-500 text-white' : 
              'bg-slate-200 text-slate-400'
            }`}>
              {overallHealth.status === 'safe' ? <ShieldCheck size={18}/> : overallHealth.status === 'warning' ? <AlertCircle size={18}/> : <Zap size={18}/>}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Status</span>
          </div>
          <div className="text-right">
             <span className={`text-2xl font-black tracking-tighter ${
               overallHealth.status === 'safe' ? 'text-emerald-600' : 
               overallHealth.status === 'warning' ? 'text-rose-600' : 
               'text-slate-400'
             }`}>{overallHealth.pct}%</span>
          </div>
        </div>
        <p className={`text-[13px] font-bold leading-relaxed ${
           overallHealth.status === 'safe' ? 'text-emerald-700' : 
           overallHealth.status === 'warning' ? 'text-rose-700' : 
           'text-slate-400'
        }`}>
          {overallHealth.text}
        </p>
      </div>

      {/* Refined Bulk Log Section */}
      <div className="bg-slate-900 p-5 rounded-[2.5rem] flex items-center justify-between shadow-2xl border border-white/5">
         <div className="flex flex-col pl-2">
           <span className="text-[11px] font-black text-white uppercase tracking-widest">Bulk Log</span>
           <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Fast Track</span>
         </div>
         <div className="flex gap-2">
            <StatusAction 
              onClick={() => handleBulkMark(AttendanceStatus.ABSENT)} 
              icon={<X size={18} strokeWidth={3}/>} 
              color="bg-rose-500" 
              label="Absent"
              dark
            />
            <StatusAction 
              onClick={() => handleBulkMark(AttendanceStatus.PRESENT)} 
              icon={<Check size={18} strokeWidth={3}/>} 
              color="bg-emerald-500" 
              label="Present"
              dark
            />
            <StatusAction 
              onClick={() => handleBulkMark(AttendanceStatus.CANCELLED)} 
              icon={<CircleSlash size={18} strokeWidth={3}/>} 
              color="bg-amber-500" 
              label="Holiday"
              dark
            />
         </div>
      </div>

      <div className="space-y-4">
        {todayClasses.length === 0 ? (
          <div className="bg-white py-16 rounded-[2.5rem] border border-slate-100 text-center space-y-4">
             <div className="p-4 bg-amber-50 rounded-full text-amber-500 inline-block">
               <Ban size={32} />
             </div>
             <p className="text-slate-900 font-black text-base uppercase tracking-widest">No Classes Today</p>
          </div>
        ) : (
          todayClasses.map(subject => {
            const insight = calculateInsight(subject.id);
            const record = records.find(r => r.date === dateStr && r.subjectId === subject.id);
            const status = record?.status || AttendanceStatus.NOT_SET;

            return (
              <div key={subject.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
                    <span className={`text-lg font-black ${insight.color}`}>{insight.pct}%</span>
                    <span className="text-[8px] font-black text-slate-300 uppercase">Track</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-slate-900 truncate leading-tight">{subject.subject}</h3>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${insight.color}`}>{insight.text}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                   <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Status Log</span>
                     <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Today</span>
                   </div>
                   <div className="flex gap-2">
                     <StatusAction 
                        active={status === AttendanceStatus.CANCELLED} 
                        onClick={() => onUpdateStatus(dateStr, subject.id, AttendanceStatus.CANCELLED)} 
                        icon={<CircleSlash size={18}/>} 
                        color="bg-amber-500" 
                        label="Off"
                      />
                     <StatusAction 
                        active={status === AttendanceStatus.ABSENT} 
                        onClick={() => onUpdateStatus(dateStr, subject.id, AttendanceStatus.ABSENT)} 
                        icon={<X size={18}/>} 
                        color="bg-rose-500" 
                        label="Miss"
                      />
                     <StatusAction 
                        active={status === AttendanceStatus.PRESENT} 
                        onClick={() => onUpdateStatus(dateStr, subject.id, AttendanceStatus.PRESENT)} 
                        icon={<Check size={18}/>} 
                        color="bg-emerald-500" 
                        label="Attended"
                      />
                   </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button onClick={() => onSwitchTab('calendar')} className="w-full bg-slate-100 p-5 rounded-3xl flex items-center justify-between text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">
        Full Attendance History <ChevronRight size={16} />
      </button>
    </div>
  );
};

interface StatusActionProps {
  active?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  color: string;
  label: string;
  dark?: boolean;
}

const StatusAction: React.FC<StatusActionProps> = ({ active, onClick, icon, color, label, dark }) => {
  const bgColor = active || (dark && !active) ? color : 'bg-slate-50';
  const textColor = active || dark ? 'text-white' : 'text-slate-300';
  const labelColor = dark ? 'text-slate-500' : 'text-slate-300';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button 
        onClick={onClick} 
        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-sm ${bgColor} ${textColor} active:scale-95`}
      >
        {icon}
      </button>
      <span className={`text-[7px] font-black uppercase tracking-widest ${labelColor}`}>{label}</span>
    </div>
  );
};

export default Dashboard;
