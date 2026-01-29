
import React, { useState, useMemo } from 'react';
import { TimetableEntry, AttendanceRecord, AttendanceStatus } from '../types';
import { ChevronLeft, ChevronRight, Check, X, Ban, ListChecks, Square, CheckSquare, RotateCcw, BookOpen, MousePointer2 } from 'lucide-react';

interface Props {
  timetable: TimetableEntry[];
  records: AttendanceRecord[];
  onUpdateStatus: (date: string, subjectId: string, status: AttendanceStatus) => void;
}

const AttendanceCalendar: React.FC<Props> = ({ timetable, records, onUpdateStatus }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  const changeMonth = (offset: number) => {
    const d = new Date(selectedMonth);
    d.setMonth(d.getMonth() + offset);
    setSelectedMonth(d);
    setActiveDate(null);
    setSelectedDates(new Set());
  };

  const currentMonth = selectedMonth.getMonth();
  const currentYear = selectedMonth.getFullYear();
  const currentMonthName = selectedMonth.toLocaleString('default', { month: 'long' });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const dateToKey = (day: number) => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getEntriesForDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return [];
    return timetable.filter(e => e.day === dayOfWeek);
  };

  const toggleDateSelection = (dateStr: string) => {
    const newSelection = new Set(selectedDates);
    if (newSelection.has(dateStr)) {
      newSelection.delete(dateStr);
    } else {
      newSelection.add(dateStr);
    }
    setSelectedDates(newSelection);
  };

  const selectAllWorkdays = () => {
    const newSelection = new Set<string>();
    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = dateToKey(i);
      const d = new Date(dStr);
      const day = d.getDay();
      if (day !== 0 && day !== 6 && getEntriesForDate(dStr).length > 0) {
        newSelection.add(dStr);
      }
    }
    setSelectedDates(newSelection);
  };

  const handleBulkAction = (status: AttendanceStatus) => {
    selectedDates.forEach(dateStr => {
      const entries = getEntriesForDate(dateStr);
      entries.forEach(entry => {
        onUpdateStatus(dateStr, entry.id, status);
      });
    });
    setSelectedDates(new Set());
    setIsSelectMode(false);
  };

  const monthlyStats = useMemo(() => {
    const stats = {
      days: { notMarked: 0, off: 0, missed: 0, attended: 0, mixed: 0 },
      lectures: { off: 0, missed: 0, attended: 0, total: 0 }
    };

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = dateToKey(i);
      const entries = getEntriesForDate(dateStr);
      const isWeekend = new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6;

      if (isWeekend || entries.length === 0) {
        stats.days.off++;
        continue;
      }

      const dayRecords = records.filter(r => r.date === dateStr);
      const statuses = dayRecords.map(r => r.status);
      
      if (dayRecords.length === 0) {
        stats.days.notMarked++;
      } else if (dayRecords.length < entries.length) {
        stats.days.mixed++;
      } else if (statuses.every(s => s === AttendanceStatus.PRESENT)) {
        stats.days.attended++;
      } else if (statuses.every(s => s === AttendanceStatus.ABSENT)) {
        stats.days.missed++;
      } else {
        stats.days.mixed++;
      }

      entries.forEach(e => {
        const r = dayRecords.find(rec => rec.subjectId === e.id);
        if (r?.status === AttendanceStatus.PRESENT) {
          stats.lectures.attended++;
          stats.lectures.total++;
        } else if (r?.status === AttendanceStatus.ABSENT) {
          stats.lectures.missed++;
          stats.lectures.total++;
        } else if (r?.status === AttendanceStatus.CANCELLED) {
          stats.lectures.off++;
        }
      });
    }

    const percent = stats.lectures.total === 0 ? 0 : (stats.lectures.attended / stats.lectures.total) * 100;
    
    return { ...stats, percent: isNaN(percent) ? 0 : percent.toFixed(2) };
  }, [selectedMonth, records, timetable, daysInMonth]);

  const subjectStats = useMemo(() => {
    const subjects = Array.from(new Set(timetable.map(t => t.subject)));
    return subjects.map(subjectName => {
      const subjectEntries = timetable.filter(t => t.subject === subjectName);
      const subjectIds = subjectEntries.map(t => t.id);
      const relevantRecords = records.filter(r => subjectIds.includes(r.subjectId));
      
      const present = relevantRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
      const absent = relevantRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
      const total = present + absent;
      const percentage = total === 0 ? 0 : Math.round((present / total) * 100);

      return {
        name: subjectName,
        percentage,
        present,
        total
      };
    });
  }, [timetable, records]);

  const markAllStatus = (dateStr: string, status: AttendanceStatus) => {
    const entries = getEntriesForDate(dateStr);
    entries.forEach(e => onUpdateStatus(dateStr, e.id, status));
    setActiveDate(null);
  };

  return (
    <div className="space-y-6 pb-20 relative">
      {/* Enhanced Calendar Header with Discovery Labels */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-1">
          <button onClick={() => changeMonth(-1)} className="p-2.5 bg-white rounded-2xl transition shadow-sm border border-slate-100">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <button onClick={() => changeMonth(1)} className="p-2.5 bg-white rounded-2xl transition shadow-sm border border-slate-100">
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <div className="text-center">
           <h2 className="text-lg font-black text-slate-900 leading-none">{currentMonthName}</h2>
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentYear}</span>
        </div>
        
        <div className="flex gap-1.5">
          {isSelectMode && (
            <button 
              onClick={selectAllWorkdays}
              className="bg-slate-100 text-slate-600 px-3 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-slate-200"
            >
              All Days
            </button>
          )}
          <button 
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              setSelectedDates(new Set());
              setActiveDate(null);
            }}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl transition-all border font-black text-[9px] uppercase tracking-widest ${
              isSelectMode ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white text-slate-400 border-slate-100'
            }`}
          >
            {isSelectMode ? <X size={14}/> : <ListChecks size={14}/>}
            {isSelectMode ? 'Cancel' : 'Select'}
          </button>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="bg-white p-4 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100">
        <div className="grid grid-cols-7 gap-y-3">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">{d}</div>
          ))}

          {Array.from({ length: (firstDay + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = dateToKey(dayNum);
            const entries = getEntriesForDate(dateStr);
            const isWeekend = new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6;
            const dayRecords = records.filter(r => r.date === dateStr);
            const isToday = new Date().toDateString() === new Date(dateStr).toDateString();
            const isSelected = selectedDates.has(dateStr);
            
            let statusColor = 'bg-slate-100';
            if (isWeekend || (dayNum > 0 && entries.length === 0)) {
              statusColor = 'bg-amber-400';
            } else if (dayRecords.length > 0) {
              const allPresent = dayRecords.length === entries.length && dayRecords.every(r => r.status === AttendanceStatus.PRESENT);
              const allAbsent = dayRecords.length === entries.length && dayRecords.every(r => r.status === AttendanceStatus.ABSENT);
              if (allPresent) statusColor = 'bg-emerald-500';
              else if (allAbsent) statusColor = 'bg-rose-500';
              else statusColor = 'bg-purple-500';
            } else if (entries.length > 0) {
              statusColor = 'bg-slate-200';
            }

            return (
              <div key={dateStr} className="flex flex-col items-center justify-center relative h-12">
                <button 
                  onClick={() => {
                    if (isSelectMode) toggleDateSelection(dateStr);
                    else setActiveDate(activeDate === dateStr ? null : dateStr);
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all relative z-10
                    ${isToday ? 'ring-2 ring-slate-900 ring-offset-2' : ''}
                    ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 
                      activeDate === dateStr ? 'bg-slate-900 text-white' : 'text-slate-600'}
                  `}
                >
                  {isSelected && <div className="absolute -top-1 -right-1 bg-white text-indigo-600 rounded-full border border-indigo-100 p-0.5 shadow-sm"><Check size={8} strokeWidth={4}/></div>}
                  {dayNum}
                </button>
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${statusColor}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Centered Popup for single day */}
      {activeDate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-xs rounded-[2.5rem] shadow-2xl p-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">Schedule</span>
                  <span className="text-base font-black text-slate-800 uppercase">{activeDate.split('-')[2]} {currentMonthName}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setIsSelectMode(true);
                      toggleDateSelection(activeDate);
                      setActiveDate(null);
                    }}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-full"
                    title="Start Multi-Select"
                  >
                    <MousePointer2 size={18}/>
                  </button>
                  <button onClick={() => setActiveDate(null)} className="p-2 bg-slate-50 rounded-full text-slate-400"><X size={18}/></button>
                </div>
              </div>

              {getEntriesForDate(activeDate).length > 0 ? (
                <div className="space-y-4">
                  <button 
                    onClick={() => markAllStatus(activeDate, AttendanceStatus.PRESENT)}
                    className="w-full bg-emerald-500 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                  >
                    <Check size={18} strokeWidth={3}/> Mark All Present
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => markAllStatus(activeDate, AttendanceStatus.ABSENT)} className="bg-rose-500 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-rose-100 flex items-center justify-center gap-2">
                       <X size={14} strokeWidth={3}/> Absent
                    </button>
                    <button onClick={() => markAllStatus(activeDate, AttendanceStatus.CANCELLED)} className="bg-amber-500 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-amber-100 flex items-center justify-center gap-2">
                       <Ban size={14} strokeWidth={3}/> Holiday
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto pr-1 space-y-4 mt-4 border-t pt-4 border-slate-50">
                    {getEntriesForDate(activeDate).map(e => {
                      const r = records.find(rec => rec.date === activeDate && rec.subjectId === e.id);
                      return (
                        <div key={e.id} className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight flex-1 truncate">{e.subject}</span>
                            <div className="flex gap-1">
                              <button onClick={() => onUpdateStatus(activeDate, e.id, AttendanceStatus.PRESENT)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${r?.status === AttendanceStatus.PRESENT ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}><Check size={14} strokeWidth={3}/></button>
                              <button onClick={() => onUpdateStatus(activeDate, e.id, AttendanceStatus.ABSENT)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${r?.status === AttendanceStatus.ABSENT ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-300'}`}><X size={14} strokeWidth={3}/></button>
                              <button onClick={() => onUpdateStatus(activeDate, e.id, AttendanceStatus.CANCELLED)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${r?.status === AttendanceStatus.CANCELLED ? 'bg-slate-200 text-slate-600' : 'bg-slate-50 text-slate-300'}`}><Ban size={14} strokeWidth={3}/></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-3 pt-2 opacity-40">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Attended</span>
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Missed</span>
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Off</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-8 text-center">
                  <Ban className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No classes scheduled</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Floating Bulk Action with Premium Look */}
      {isSelectMode && selectedDates.size > 0 && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-slate-900 p-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[60] animate-in slide-in-from-bottom-10 flex flex-col gap-3">
           <div className="flex items-center justify-between">
             <div className="flex flex-col pl-2">
               <span className="text-white font-black text-base tracking-tighter">{selectedDates.size} Selected</span>
               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Apply Bulk Status</span>
             </div>
             <div className="flex gap-2">
                <div className="flex flex-col items-center gap-1.5">
                  <button onClick={() => handleBulkAction(AttendanceStatus.ABSENT)} className="bg-rose-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-900/20 active:scale-95 transition-transform"><X size={20} strokeWidth={3}/></button>
                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Absent</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <button onClick={() => handleBulkAction(AttendanceStatus.PRESENT)} className="bg-emerald-500 text-white px-6 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-900/20 active:scale-95 transition-transform">Mark Present</button>
                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Present</span>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
          <div className="grid grid-cols-4 divide-x divide-slate-50 text-center">
            <SummaryItem label="Log" value={monthlyStats.days.notMarked} />
            <SummaryItem label="Off" value={monthlyStats.days.off} />
            <SummaryItem label="Miss" value={monthlyStats.days.missed} />
            <SummaryItem label="Att" value={monthlyStats.days.attended} />
          </div>
          <div className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] py-2 text-center">Day Summary</div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
          <div className="grid grid-cols-4 divide-x divide-slate-50 text-center">
            <SummaryItem label="Miss" value={monthlyStats.lectures.missed} />
            <SummaryItem label="Att" value={monthlyStats.lectures.attended} />
            <SummaryItem label="Tot" value={monthlyStats.lectures.total} />
            <SummaryItem label="Pct" value={`${monthlyStats.percent}%`} isMain />
          </div>
          <div className="bg-indigo-50/50 text-indigo-600 text-[9px] font-black uppercase tracking-[0.2em] py-2 text-center">Lecture Precision</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 px-2">
          <BookOpen size={14} className="text-slate-400" />
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Breakdown</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {subjectStats.map(sub => (
            <div key={sub.name} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1 text-center">
              <span className="text-lg font-black text-slate-900 tracking-tighter">{sub.percentage}%</span>
              <span className="text-[9px] font-black text-slate-800 uppercase tracking-tight truncate w-full">{sub.name}</span>
              <span className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">{sub.present}/{sub.total} Logged</span>
            </div>
          ))}
          {subjectStats.length === 0 && (
            <div className="col-span-2 bg-slate-50/50 border border-dashed border-slate-200 p-8 rounded-[2rem] text-center">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No subjects tracked yet</span>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-40 py-4">
        {isSelectMode ? 'Tap dates to add to selection' : 'Tap date for details'}
      </p>
    </div>
  );
};

const SummaryItem: React.FC<{ label: string; value: string | number; isMain?: boolean }> = ({ label, value, isMain }) => (
  <div className="py-5 flex flex-col items-center justify-center gap-1 px-1">
    <span className={`text-base font-black tracking-tight ${isMain ? 'text-indigo-600' : 'text-slate-800'}`}>{value}</span>
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);

export default AttendanceCalendar;
