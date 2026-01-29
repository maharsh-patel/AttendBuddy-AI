
import { GoogleGenAI } from "@google/genai";
import { TimetableEntry, AttendanceRecord, AttendanceStatus, UserSettings, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIResponse = async (
  message: string, 
  history: ChatMessage[],
  timetable: TimetableEntry[],
  records: AttendanceRecord[],
  settings: UserSettings,
  editContext?: { date: string, changes: string },
  monthlyContext?: { month: string, stats: any }
) => {
  const model = "gemini-3-flash-preview";
  
  const isTimetableEmpty = timetable.length === 0;
  const isAttendanceEmpty = records.length === 0;

  // 1. Calculate general stats
  const subjectStats = timetable.reduce((acc: any, entry) => {
    if (!acc[entry.subject]) {
      acc[entry.subject] = { present: 0, total: 0 };
    }
    const subjectRecords = records.filter(r => r.subjectId === entry.id);
    const present = subjectRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const absent = subjectRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
    acc[entry.subject].present += present;
    acc[entry.subject].total += (present + absent);
    return acc;
  }, {});

  const subjectPercentages = Object.entries(subjectStats)
    .map(([subject, stats]: [string, any]) => {
      const pct = stats.total === 0 ? 0 : Math.round((stats.present / stats.total) * 100);
      return `${subject}: ${pct}% (${stats.present}/${stats.total})`;
    })
    .join(", ");

  const totalPresent = records.filter(r => r.status === AttendanceStatus.PRESENT).length;
  const totalAbsent = records.filter(r => r.status === AttendanceStatus.ABSENT).length;
  const overallTotal = totalPresent + totalAbsent;
  const overallPercentage = overallTotal === 0 ? 0 : Math.round((totalPresent / overallTotal) * 100);

  const troubleSubjects = Object.entries(subjectStats)
    .filter(([_, stats]: [any, any]) => {
        const pct = stats.total === 0 ? 100 : (stats.present / stats.total) * 100;
        return pct < settings.targetPercentage;
    })
    .map(([subject]) => subject);

  const todayDay = new Date().getDay();
  const todayClasses = timetable.filter(e => e.day === todayDay).map(e => e.subject).join(", ") || "None scheduled";

  const systemInstruction = `
    You are a supportive, peer-like AI assistant for AttendBuddy.
    
    DATA STATUS:
    - Timetable is ${isTimetableEmpty ? 'EMPTY' : 'Populated'}.
    - Attendance Logs are ${isAttendanceEmpty ? 'EMPTY' : 'Populated'}.

    CRITICAL RULE - MISSING DATA:
    If a student asks a question but the required data is missing:
    1. Politely inform them exactly what data is missing (timetable, attendance logs, or both).
    2. Tell them exactly where to go/what to do:
       - If Timetable is missing: "Please add your subjects in the 'Timetable' tab first."
       - If Attendance is missing: "Please mark your attendance history in the 'Attendance' tab."
    3. Do NOT guess, estimate, or assume any values if they aren't provided.

    GENERAL BEHAVIOR:
    - Overall: ${overallPercentage}% (Target: ${settings.targetPercentage}%)
    - Stats: ${subjectPercentages}
    - Motivational and analytical tone.
    - NO teachers, NO college rules, NO fake data, NO future predictions.
    - Identify SAFE (>=Target), WARNING (within 5% below), or SHORTAGE (>5% below).
  `;

  try {
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction,
      }
    });

    let contextPrompt = `
      [Current Context]
      Date: ${new Date().toDateString()}
      Timetable Empty: ${isTimetableEmpty}
      Attendance Empty: ${isAttendanceEmpty}
      Overall: ${overallPercentage}%
      Summary: ${subjectPercentages}
      [/Current Context]
    `;

    if (editContext) {
      contextPrompt += `
      [Edit Context]
      The student edited attendance for: ${editContext.date}
      Changes: ${editContext.changes}
      [/Edit Context]
      `;
    }

    if (monthlyContext) {
      contextPrompt += `
      [Monthly Context - ${monthlyContext.month}]
      Total lecture days tracked: ${monthlyContext.stats.lectureDays}
      Fully present days: ${monthlyContext.stats.fullPresent}
      Partially absent days: ${monthlyContext.stats.partial}
      Fully absent days: ${monthlyContext.stats.absent}
      [/Monthly Context]
      `;
    }
    
    contextPrompt += `User message: ${message}`;

    const response = await chat.sendMessage({ message: contextPrompt });
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to my database. Please try again later.";
  }
};
