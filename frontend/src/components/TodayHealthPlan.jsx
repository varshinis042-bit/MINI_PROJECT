import React, { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Trophy,
  Droplets,
  Pill,
  Footprints,
  Utensils,
  Heart,
  CalendarCheck,
  ChevronRight,
  RefreshCw,
  Clock
} from "lucide-react"
import api from "../services/api"
import { useLanguage } from "../context/LanguageContext"
import { useAuth } from "../context/AuthContext"

export const TodayHealthPlan = () => {
  const { language, lang, t } = useLanguage()
  const { user } = useAuth()
  const isTa = (language || lang) === "ta"

  const todayKey = `cardio_plan_${new Date().toISOString().split("T")[0]}`

  // Default fallback habits if API is unreachable
  const defaultTasks = [
    { id: "water", title: "Drink 8 glasses of clean water", title_ta: "8 டம்ளர் தூய தண்ணீர் குடிக்கவும்", category: "HYDRATION", time: "07:00", completed: false },
    { id: "meds", title: "Take doctor-prescribed morning/night medicine", title_ta: "பரிந்துரைக்கப்பட்ட மாத்திரைகளை உட்கொள்ளவும்", category: "MEDICATION", time: "08:00", completed: false },
    { id: "walk", title: "15–20 minutes of brisk walking or stretching", title_ta: "15–20 நிமிடம் நடைப்பயிற்சி செய்யவும்", category: "EXERCISE", time: "17:30", completed: false },
    { id: "diet", title: "Eat a heart-healthy fiber-rich breakfast/meal", title_ta: "ஆரோக்கியமான நார்ச்சத்துள்ள காலை உணவு உட்கொள்ளவும்", category: "BREAKFAST", time: "08:30", completed: false },
    { id: "bp", title: "Check blood pressure reading if scheduled", title_ta: "திட்டமிடப்பட்டிருந்தால் இரத்த அழுத்தத்தை பரிசோதிக்கவும்", category: "GENERAL", time: "11:00", completed: false },
    { id: "sleep", title: "Restful sleep for 7–8 hours tonight", title_ta: "இரவு 7–8 மணி நேரம் ஆழ்ந்து தூங்கவும்", category: "GENERAL", time: "22:00", completed: false }
  ]

  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  // Fetch plan from backend
  const fetchPlan = async (forceRegenerate = false) => {
    try {
      if (forceRegenerate) {
        setRefreshing(true)
        const res = await api.post("/health-plan/generate")
        setPlan(res.data)
      } else {
        const res = await api.get("/health-plan/today")
        setPlan(res.data)
      }
    } catch (err) {
      console.warn("Could not fetch health plan from API, using offline fallback:", err)
      // Fallback to local storage if API fails or unauthenticated
      try {
        const saved = localStorage.getItem(todayKey)
        const completedMap = saved ? JSON.parse(saved) : {}
        const items = defaultTasks.map((t) => ({
          ...t,
          completed: !!completedMap[t.id]
        }))
        const completedCount = items.filter((i) => i.completed).length
        setPlan({
          date: new Date().toISOString().split("T")[0],
          items,
          completed_count: completedCount,
          total_items: items.length,
          completion_percentage: Math.round((completedCount / items.length) * 100)
        })
      } catch (e) {
        // Safe fallback
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPlan(false)
  }, [user])

  // Handle task completion
  const toggleItem = async (item) => {
    if (togglingId) return
    setTogglingId(item.id)
    const target = !item.completed

    // Optimistic update
    setPlan((prev) => {
      if (!prev) return prev
      const updated = prev.items.map((it) => (it.id === item.id ? { ...it, completed: target } : it))
      const count = updated.filter((it) => it.completed).length
      return {
        ...prev,
        items: updated,
        completed_count: count,
        completion_percentage: Math.round((count / updated.length) * 100)
      }
    })

    // Store in localStorage as well
    try {
      const saved = localStorage.getItem(todayKey)
      const map = saved ? JSON.parse(saved) : {}
      map[item.id] = target
      localStorage.setItem(todayKey, JSON.stringify(map))
    } catch (e) {
      // ignore
    }

    try {
      const res = await api.post(`/health-plan/${item.id}/complete`, { completed: target })
      if (res.data?.plan) {
        setPlan(res.data.plan)
      }
    } catch (err) {
      console.warn("Offline or unauthenticated completion toggle:", err)
    } finally {
      setTogglingId(null)
    }
  }

  // Next reminder calculation
  const nextReminder = useMemo(() => {
    if (!plan?.items || plan.items.length === 0) return null
    const pending = plan.items.filter((it) => !it.completed)
    if (pending.length === 0) return null

    const now = new Date()
    const currentMin = now.getHours() * 60 + now.getMinutes()

    const upcoming = pending.find((it) => {
      if (!it.time) return false
      const [h, m] = it.time.split(":").map(Number)
      return h * 60 + m >= currentMin
    })

    return upcoming || pending[0]
  }, [plan])

  const getTaskIcon = (category) => {
    switch (category) {
      case "BREAKFAST":
      case "LUNCH":
      case "DINNER":
        return Utensils
      case "HYDRATION":
        return Droplets
      case "EXERCISE":
        return Footprints
      case "MEDICATION":
        return Pill
      default:
        return Heart
    }
  }

  const getTaskColor = (category) => {
    switch (category) {
      case "BREAKFAST":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30"
      case "LUNCH":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
      case "DINNER":
        return "text-teal-400 bg-teal-500/10 border-teal-500/30"
      case "HYDRATION":
        return "text-sky-400 bg-sky-500/10 border-sky-500/30"
      case "EXERCISE":
        return "text-indigo-400 bg-indigo-500/10 border-indigo-500/30"
      case "MEDICATION":
        return "text-rose-400 bg-rose-500/10 border-rose-500/30"
      default:
        return "text-purple-400 bg-purple-500/10 border-purple-500/30"
    }
  }

  const formatTime12h = (timeStr) => {
    if (!timeStr) return ""
    const [h, m] = timeStr.split(":").map(Number)
    const ampm = h >= 12 ? "PM" : "AM"
    const h12 = h % 12 || 12
    return `${h12}:${m < 10 ? "0" + m : m} ${ampm}`
  }

  const items = plan?.items || defaultTasks
  const percent = plan?.completion_percentage || 0
  const completedCount = plan?.completed_count || 0
  const totalTasks = plan?.total_items || items.length

  return (
    <div className="glass-card rounded-3xl p-5 sm:p-7 border border-slate-800 bg-slate-900/80 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CalendarCheck className="w-3 h-3" />
              {isTa ? "தினசரி பழக்கம்" : "Daily Routine"}
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">{t("plan_subtitle")}</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> {t("plan_title")}
          </h2>
        </div>

        {/* Progress percent badge & Actions */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => fetchPlan(true)}
            disabled={refreshing}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title={t("refresh_plan", "Regenerate Plan")}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-teal-400" : ""}`} />
          </button>

          <div className="text-right">
            <span className="text-xs font-bold text-white block">{percent}% {t("plan_completed")}</span>
            <span className="text-[10px] text-slate-400">{completedCount} of {totalTasks} {isTa ? "பணிகள்" : "actions"}</span>
          </div>

          {percent === 100 && (
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center animate-bounce">
              <Trophy className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Highlight Next Reminder Banner */}
      {nextReminder && (
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-teal-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                {t("next_reminder", "Next Reminder")} • {formatTime12h(nextReminder.time)}
              </span>
              <span className="text-xs font-semibold text-white">
                {isTa && nextReminder.title_ta ? nextReminder.title_ta : nextReminder.title}
              </span>
            </div>
          </div>
          <button
            onClick={() => toggleItem(nextReminder)}
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors flex-shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t("mark_complete", "Done")}</span>
          </button>
        </div>
      )}

      {/* Task Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {items.slice(0, 6).map((task) => {
          const isDone = !!task.completed
          const TaskIcon = getTaskIcon(task.category)
          const colorStyles = getTaskColor(task.category)

          return (
            <div
              key={task.id}
              onClick={() => toggleItem(task)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                isDone
                  ? "bg-emerald-950/20 border-emerald-500/40 text-slate-300 shadow-sm"
                  : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${isDone ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : colorStyles}`}>
                  <TaskIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {task.time && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatTime12h(task.time)}
                      </span>
                    )}
                  </div>
                  <span className={`font-semibold text-[11px] sm:text-xs block truncate ${isDone ? "line-through text-slate-400" : "text-white"}`}>
                    {isTa && task.title_ta ? task.title_ta : task.title}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Action / Link to Full Routine */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <span className="text-[11px] text-slate-400">
          {isTa ? "தனிப்பயனாக்கப்பட்ட தினசரி ஆரோக்கிய அட்டவணை" : "Daily cardiovascular wellness schedule"}
        </span>
        <Link
          to="/health-plan"
          className="flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300 group transition-colors"
        >
          <span>{t("view_full_plan", "View Full Plan")}</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {percent === 100 && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/40 text-center text-xs text-emerald-300 flex items-center justify-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>
            {isTa
              ? "சிறப்பு! இன்றைய அனைத்து ஆரோக்கிய பணிகளையும் முடித்துவிட்டீர்கள்! உங்கள் இதயம் நன்றியுடன் இருக்கிறது!"
              : "Awesome job! You completed all daily heart-protective habits today!"}
          </span>
        </div>
      )}
    </div>
  )
}

export default TodayHealthPlan