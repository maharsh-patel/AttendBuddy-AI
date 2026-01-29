import React, { useState, useRef, useEffect } from 'react';
import { TimetableEntry, AttendanceRecord, UserSettings, ChatMessage, AttendanceStatus } from '../types';
import { getAIResponse } from '../services/geminiService';
import { Send, Bot, Loader2, PieChart, Sun, BarChart3 } from 'lucide-react';

interface Props {
  timetable: TimetableEntry[];
  records: AttendanceRecord[];
  settings: UserSettings;
  lastEdit: { date: string; subject: string; status: AttendanceStatus } | null;
}

const AIChat: React.FC<Props> = ({ timetable, records, settings, lastEdit }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hey! I'm AttendBuddy. I've analyzed your logs. You're tracking well. What's on your mind regarding attendance today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (customMsg?: string) => {
    const userMsg = customMsg || input.trim();
    if (!userMsg || isLoading) return;

    if (!customMsg) setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await getAIResponse(userMsg, messages, timetable, records, settings);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Connectivity issue. Try again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500 max-h-[calc(100dvh-200px)] sm:max-h-[620px]">
      {/* Header */}
      <div className="bg-slate-900 p-4 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Bot size={22} />
          </div>
          <div>
            <h3 className="font-black text-sm">AttendBuddy AI</h3>
            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Active Assistant</span>
          </div>
        </div>
        <div className="flex gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-3xl text-[13px] font-medium leading-relaxed shadow-sm max-w-[85%] ${
              msg.role === 'user' 
              ? 'bg-indigo-600 text-white rounded-br-none' 
              : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="p-4 rounded-3xl bg-white border border-slate-100 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-indigo-600" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thinking</span>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-50 flex flex-col gap-3 shrink-0">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
           <QuickAction label="Safe?" onClick={() => handleSend("Am I safe?")} icon={<PieChart size={12}/>} />
           <QuickAction label="Daily" onClick={() => handleSend("Today's Briefing")} icon={<Sun size={12}/>} />
           <QuickAction label="Pattern" onClick={() => handleSend("Analyze my pattern")} icon={<BarChart3 size={12}/>} />
        </div>
        <div className="flex gap-2">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm outline-none focus:bg-white transition font-medium"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition shadow-lg ${
              input.trim() && !isLoading ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300'
            }`}
          >
            <Send size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

const QuickAction: React.FC<{ label: string; onClick: () => void; icon: React.ReactNode }> = ({ label, onClick, icon }) => (
  <button onClick={onClick} className="flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shrink-0 shadow-md whitespace-nowrap">
    {icon} {label}
  </button>
);

export default AIChat;