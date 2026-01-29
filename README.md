# AttendBuddy 🎓
### Attendance Tracker with AI Insights

AttendBuddy is a modern, student-centric web application designed to help students track their class attendance and hit their target percentages. It features an integrated AI assistant powered by **Google Gemini** to provide real-time analysis of "safe" days and attendance health.

## ✨ Features
- **Smart Dashboard**: Instantly see your overall attendance percentage vs your target.
- **AI Assistant**: Ask "Am I safe to skip today?" or "How many classes till I hit 75%?"
- **Interactive Calendar**: Log attendance for past days and see monthly trends.
- **Weekly Timetable**: Simple management of your recurring classes.
- **Bulk Logging**: Quickly mark a whole day as Present, Absent, or Holiday.

## 🛠️ Tech Stack
- **React 19** (TypeScript)
- **Vite** (Build Tool)
- **Tailwind CSS** (Styling)
- **Google Gemini API** (AI Logic)
- **Lucide React** (Iconography)

## 🚀 Deployment on Netlify
1. Fork or Clone this repository.
2. Create a new site on **Netlify** and connect this repository.
3. Netlify will use the `netlify.toml` to automatically build the project:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. **Crucial**: Add your Gemini API key in Netlify's **Environment Variables** as `API_KEY`.

## 🔑 Setup
If you want to run this locally:
1. `npm install`
2. Create an environment variable `API_KEY`.
3. `npm run dev`

---
*Created by MAHARSH*