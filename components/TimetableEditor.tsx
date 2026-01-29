
import React, { useState } from 'react';
import { TimetableEntry } from '../types';
import { Plus, Trash2, CalendarDays } from 'lucide-react';

interface Props {
  timetable: TimetableEntry[];
  setTimetable: React.Dispatch<React.SetStateAction<TimetableEntry[]>>;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const TimetableEditor: React.FC<Props> = ({ timetable, setTimetable }) => {
  const [subject, setSubject] = useState('');
  const [day, setDay] = useState(1);

  const addEntry = () => {
    if (!subject.trim()) return;
    const newEntry: TimetableEntry = {
      id: Math.random().toString(36).substr(2, 9),
      day,
      subject: subject.toUpperCase()
    };
    setTimetable([...timetable, newEntry]);
    setSubject('');
  };

  const removeEntry = (id: string) => {
    setTimetable(timetable.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-8 pb-20 px-1">
      <div className="flex flex-col gap-1 px-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Schedule</h2>
        <p className="text-slate-400 text-sm font-medium">Your fixed weekly classes.</p>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">Class Name</label>
          <input 
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Physics"
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white transition font-bold text-slate-800"
          />
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">Day</label>
            <select 
              value={day}
              onChange={e => setDay(parseInt(e.target.value))}
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800 appearance-none"
            >
              {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
            </select>
          </div>
          <button 
            onClick={addEntry}
            className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center self-end shadow-lg shadow-indigo-100 active:scale-90 transition-transform"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {DAYS.map((dayName, idx) => {
          const dayEntries = timetable.filter(e => e.day === idx + 1);
          return (
            <div key={dayName} className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <CalendarDays size={14} className="text-indigo-600" />
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">{dayName}</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {dayEntries.length === 0 ? (
                  <div className="bg-white/50 border border-dashed border-slate-200 p-6 rounded-3xl text-center">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No classes</p>
                  </div>
                ) : (
                  dayEntries.map(entry => (
                    <div key={entry.id} className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
                      <span className="text-sm font-black text-slate-800 tracking-tight">{entry.subject}</span>
                      <button 
                        onClick={() => removeEntry(entry.id)}
                        className="p-2 text-rose-500 bg-rose-50 rounded-xl"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimetableEditor;
