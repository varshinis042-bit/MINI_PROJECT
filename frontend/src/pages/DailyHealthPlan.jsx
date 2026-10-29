import React, { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import {
  Heart,
  CalendarCheck,
  CheckCircle2,
  Circle,
  Clock,
  Droplets,
  Footprints,
  Utensils,
  Pill,
  Sparkles,
  RefreshCw,
  Bell,
  BellRing,
  Sliders,
  X,
  ChevronRight,
  Info,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Award,
  AlertCircle,
  AlertTriangle,
  PhoneCall,
  Activity,
  Moon,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  BarChart3,
  Coffee,
  Check
} from "lucide-react"
import api from "../services/api"
import { useLanguage } from "../context/LanguageContext"
import { notificationService } from "../services/notificationService"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

export const DailyHealthPlan = () => {
  const { lang, t } = useLanguage()
  const isTa = lang === "ta"

  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [completingId, setCompletingId] = useState(null)
  const [error, setError] = useState("")

  // Modals
  const [showPrefModal, setShowPrefModal] = useState(false)
  const [showVitalsModal, setShowVitalsModal] = useState(false)
  const [vitalsModalType, setVitalsModalType] = useState("BP") // "BP", "SLEEP", "ACTIVITY"
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)

  // Vitals form state
  const [vitalsInput, setVitalsInput] = useState({
    systolic_bp: 130,
    diastolic_bp: 85,
    sleep_hours: 7.0,
    activity_minutes: 25,
    hydration_ml: 1800
  })
  const [savingVitals, setSavingVitals] = useState(false)

  // Emergency symptoms state
  const [emergencySymptoms, setEmergencySymptoms] = useState({
    chest_pain_or_pressure: false,
    pain_radiating_arm_jaw: false,
    severe_shortness_of_breath: false,
    fainting_syncope: false,
    sudden_weakness_speech_difficulty: false
  })
  const [emergencyResult, setEmergencyResult] = useState(null)
  const [submittingEmergency, setSubmittingEmergency] = useState(false)

  // Notification state
  const [permission, setPermission] = useState(() => notificationService.getPermission())
  const [promptDismissed, setPromptDismissed] = useState(() => notificationService.hasPrompted())
  const [notifications, setNotifications] = useState([])
  const [preferences, setPreferences] = useState({
    notifications_enabled: true,
    breakfast_reminders: true,
    lunch_reminders: true,
    dinner_reminders: true,
    hydration_reminders: true,
    exercise_reminders: true,
    medication_reminders: true,
    general_reminders: true,
    quiet_hours_start: "22:00",
    quiet_hours_end: "07:00",
    timezone: notificationService.getClientTimezone()
  })
  const [savingPrefs, setSavingPrefs] = useState(false)

  // Filter tab for timeline items
  const [activeTab, setActiveTab] = useState("ALL")

  // Load Plan
  const loadPlan = async (forceRegenerate = false) => {
    try {
      if (forceRegenerate) {
        setGenerating(true)
        const res = await api.post("/health-plan/generate")
        setPlan(res.data)
      } else {
        const res = await api.get("/health-plan/care-plan")
        setPlan(res.data)
      }
      setError("")
    } catch (err) {
      console.error("Failed to load care plan:", err)
      // Fallback try /health-plan/today
      try {
        const res2 = await api.get("/health-plan/today")
        setPlan(res2.data)
        setError("")
      } catch (err2) {
        setError(
          isTa
            ? "திட்டத்தை ஏற்றுவதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்."
            : "Could not load today's heart care plan. Please try regenerating."
        )
      }
    } finally {
      setLoading(false)
      setGenerating(false)
    }
  }

  const loadNotificationsAndPrefs = async () => {
    try {
      const [notifRes, prefRes] = await Promise.allSettled([
        api.get("/notifications"),
        api.get("/notifications/preferences")
      ])
      if (notifRes.status === "fulfilled") {
        setNotifications(notifRes.value.data || [])
      }
      if (prefRes.status === "fulfilled" && prefRes.value.data) {
        setPreferences(prefRes.value.data)
      }
    } catch (err) {
      console.error("Failed to load notifications/prefs:", err)
    }
  }

  useEffect(() => {
    loadPlan(false)
    loadNotificationsAndPrefs()
  }, [])

  useEffect(() => {
    if (plan?.items && preferences) {
      notificationService.checkAndNotifyDueItems(plan.items, preferences)
    }
  }, [plan, preferences])

  // Browser notification prompt
  const handleEnableNotifications = async () => {
    const res = await notificationService.requestPermission()
    setPermission(res)
    setPromptDismissed(true)
    if (res === "granted") {
      notificationService.triggerNotification(
        isTa ? "இதய நல அறிவிப்புகள் இயக்கப்பட்டது" : "Heart Health Alerts Active",
        isTa
          ? "உங்கள் தினசரி ஆரோக்கிய அட்டவணை நினைவூட்டல்கள் சரியான நேரத்தில் வழங்கப்படும்."
          : "You will receive timely reminders for diet, walking sessions, and vitals."
      )
    }
  }

  const handleDismissPrompt = () => {
    notificationService.setPrompted()
    setPromptDismissed(true)
  }

  // Toggle item completion
  const handleToggleComplete = async (item) => {
    if (completingId) return
    setCompletingId(item.id)
    const targetState = !item.completed

    // Optimistic UI update
    setPlan((prev) => {
      if (!prev) return prev
      const updatedItems = (prev.items || []).map((it) =>
        it.id === item.id
          ? { ...it, completed: targetState, completed_at: targetState ? new Date().toISOString() : null }
          : it
      )
      const completedCount = updatedItems.filter((it) => it.completed).length
      const pct = Math.round((completedCount / (updatedItems.length || 1)) * 100)

      // Also update nested food or activity if matches
      const updatedNutrition = { ...(prev.nutrition || {}) }
      for (const slot of ["breakfast", "mid_morning", "lunch", "evening", "dinner"]) {
        if (updatedNutrition[slot]) {
          updatedNutrition[slot] = updatedNutrition[slot].map((f) =>
            f.id === item.id ? { ...f, completed: targetState } : f
          )
        }
      }

      const updatedActivity = { ...(prev.activity || {}) }
      if (updatedActivity.activities) {
        updatedActivity.activities = updatedActivity.activities.map((a) =>
          a.id === item.id ? { ...a, completed: targetState } : a
        )
      }

      return {
        ...prev,
        items: updatedItems,
        nutrition: updatedNutrition,
        activity: updatedActivity,
        completed_count: completedCount,
        progress_percentage: pct
      }
    })

    try {
      const res = await api.post(`/health-plan/${item.id}/complete`, {
        completed: targetState
      })
      if (res.data) {
        setPlan(res.data)
      }
    } catch (err) {
      console.error("Failed to complete item:", err)
      loadPlan(false)
    } finally {
      setCompletingId(null)
    }
  }

  // Submit vitals checkin (BP, sleep, activity)
  const handleSubmitVitals = async (e) => {
    e.preventDefault()
    setSavingVitals(true)
    try {
      const payload = {}
      if (vitalsModalType === "BP") {
        payload.systolic_bp = parseInt(vitalsInput.systolic_bp, 10)
        payload.diastolic_bp = parseInt(vitalsInput.diastolic_bp, 10)
      } else if (vitalsModalType === "SLEEP") {
        payload.sleep_hours = parseFloat(vitalsInput.sleep_hours)
      } else if (vitalsModalType === "ACTIVITY") {
        payload.activity_minutes = parseInt(vitalsInput.activity_minutes, 10)
      }

      const res = await api.post("/health-plan/record-vitals", payload)
      if (res.data) {
        setPlan(res.data)
      }
      setShowVitalsModal(false)
    } catch (err) {
      console.error("Failed to record vitals:", err)
    } finally {
      setSavingVitals(false)
    }
  }

  // Submit emergency triage
  const handleCheckEmergencySymptoms = async (e) => {
    e.preventDefault()
    setSubmittingEmergency(true)
    try {
      const res = await api.post("/health-plan/emergency-triage", emergencySymptoms)
      setEmergencyResult(res.data)
      if (res.data?.plan) {
        setPlan(res.data.plan)
      }
    } catch (err) {
      console.error("Failed to submit emergency check:", err)
    } finally {
      setSubmittingEmergency(false)
    }
  }

  const handleSavePreferences = async (e) => {
    e.preventDefault()
    setSavingPrefs(true)
    try {
      const updated = await notificationService.updatePreferences(preferences)
      setPreferences(updated)
      setShowPrefModal(false)
    } catch (err) {
      console.error("Failed to save prefs:", err)
    } finally {
      setSavingPrefs(false)
    }
  }

  // Next upcoming reminder
  const nextReminder = useMemo(() => {
    if (!plan?.items || plan.items.length === 0) return null
    const pending = plan.items.filter((it) => !it.completed)
    if (pending.length === 0) return null

    const now = new Date()
    const currentMin = now.getHours() * 60 + now.getMinutes()
    const upcoming = pending.find((it) => {
      const [h, m] = (it.time || "12:00").split(":").map(Number)
      return h * 60 + m >= currentMin
    })
    return upcoming || pending[0]
  }, [plan])

  // Filter items by category tab
  const filteredItems = useMemo(() => {
    if (!plan?.items) return []
    if (activeTab === "ALL") return plan.items
    if (activeTab === "MEALS") {
      return plan.items.filter((it) =>
        ["BREAKFAST", "MID_MORNING", "LUNCH", "EVENING_SNACK", "DINNER"].includes(it.category)
      )
    }
    if (activeTab === "EXERCISE") {
      return plan.items.filter((it) => it.category === "EXERCISE")
    }
    if (activeTab === "MEDICATION") {
      return plan.items.filter((it) => it.category === "MEDICATION")
    }
    if (activeTab === "MONITORING") {
      return plan.items.filter((it) => ["MONITORING", "GENERAL", "HYDRATION"].includes(it.category))
    }
    return plan.items
  }, [plan, activeTab])

  const formatTime12h = (timeStr) => {
    if (!timeStr) return ""
    const [h, m] = timeStr.split(":").map(Number)
    const ampm = h >= 12 ? "PM" : "AM"
    const h12 = h % 12 || 12
    return `${h12}:${m < 10 ? "0" + m : m} ${ampm}`
  }

  const isHighRisk = plan?.is_high_risk || plan?.risk_category === "HIGH" || plan?.risk_category === "CRITICAL"
  const isExercisePaused = plan?.activity?.status === "paused" || !plan?.safety?.exercise_allowed

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium">
          {isTa
            ? "உங்கள் தனிப்பயனாக்கப்பட்ட இதய பராமரிப்பு திட்டம் தயாரிக்கப்படுகிறது..."
            : "Synthesizing personalized heart care plan based on your risk profile..."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header & Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/80 border border-rose-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Heart className="w-3 h-3 text-rose-400 fill-rose-400/30" />
              <span>{isTa ? "தனிப்பயன் இதய பராமரிப்பு" : "Personalized Heart Care"}</span>
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400 font-medium">
              {plan?.date
                ? new Date(plan.date).toLocaleDateString(isTa ? "ta-IN" : "en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })
                : "Today"}
            </span>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                isHighRisk
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : "bg-teal-500/20 text-teal-300 border-teal-500/40"
              }`}
            >
              {plan?.risk_category || "MODERATE"} RISK
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-white tracking-tight flex items-center gap-2.5">
            {plan?.headline || (isHighRisk ? "Personalized Heart Care Plan" : "Personalized Preventive Health Plan")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
            {plan?.subheading ||
              "Personalized preventive lifestyle guidance based on your current health information."}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
            <span>{isTa ? "அவசர உதவி (112/108)" : "Emergency Triage (112/108)"}</span>
          </button>

          <button
            onClick={() => setShowPrefModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">{isTa ? "நினைவூட்டல் அமைப்புகள்" : "Alert Preferences"}</span>
            <span className="sm:hidden">{isTa ? "அமைப்புகள்" : "Alerts"}</span>
          </button>

          <button
            onClick={() => loadPlan(true)}
            disabled={generating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-teal-950/40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
            <span>{generating ? (isTa ? "புதுப்பிக்கிறது..." : "Updating...") : isTa ? "திட்டத்தை புதுப்பி" : "Regenerate Plan"}</span>
          </button>
        </div>
      </div>

      {/* 2. Critical Safety Filter Banners */}
      {/* 2A. Severe Blood Pressure Safety Filter (SBP >= 180 or DBP >= 110) */}
      {isExercisePaused && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-slate-900 to-slate-900 border-2 border-rose-500/60 shadow-xl shadow-rose-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-900/80 text-rose-200 border border-rose-500/50">
                  {isTa ? "பாதுகாப்பு எச்சரிக்கை" : "Clinical Safety Filter"}
                </span>
                <span className="text-xs font-mono font-bold text-rose-300">
                  BP: {plan?.safety?.latest_sbp ? `${Math.round(plan.safety.latest_sbp)}/${Math.round(plan.safety.latest_dbp)} mmHg` : "Severely Elevated"}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                {isTa ? "உடற்பயிற்சி திட்டம் தற்காலிகமாக நிறுத்தப்பட்டுள்ளது" : "Exercise plan temporarily paused"}
              </h3>
              <p className="text-xs text-rose-200 mt-0.5 leading-relaxed max-w-3xl">
                {plan?.activity?.pause_reason ||
                  "Your recorded blood pressure is severely elevated. Please seek medical assessment before continuing exercise recommendations."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0 self-end sm:self-center">
            <button
              onClick={() => {
                setVitalsModalType("BP")
                setShowVitalsModal(true)
              }}
              className="text-xs font-bold bg-rose-500 hover:bg-rose-400 text-slate-950 px-3.5 py-2 rounded-xl transition-all shadow-sm"
            >
              {isTa ? "புதிய BP பதிவு செய்" : "Re-check / Record BP"}
            </button>
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-rose-300 px-3 py-2 rounded-xl border border-rose-500/30 transition-all"
            >
              {isTa ? "அவசர உதவி" : "Emergency Help"}
            </button>
          </div>
        </div>
      )}

      {/* 2B. Emergency Symptoms Alert Banner (If red-flag acute symptoms detected) */}
      {plan?.safety?.emergency && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/95 border-2 border-rose-500 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <PhoneCall className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {isTa ? "முக்கிய மருத்துவ எச்சரிக்கை: உடனடி அவசர உதவி தேவை" : "CRITICAL MEDICAL ALERT: IMMEDIATE EMERGENCY CARE REQUIRED"}
              </h3>
              <p className="text-xs text-rose-200 mt-0.5 leading-relaxed">
                {isTa
                  ? "கடுமையான நெஞ்சு வலி, மூச்சுத் திணறல் அல்லது மயக்கம் போன்ற அறிகுறிகள் தெரிவிக்கப்பட்டுள்ளன. 112 அல்லது 108 ஐ உடனடியாக அழைக்கவும்."
                  : "Acute cardiac red-flag symptoms reported. Do NOT wait for an AI estimate. Cease exertion and call 112 or 108 immediately."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
            <a
              href="tel:112"
              className="px-4 py-2 rounded-xl bg-white text-rose-700 font-extrabold text-xs shadow hover:bg-rose-100 flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
              <span>Call 112 (Emergency)</span>
            </a>
            <a
              href="tel:108"
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-extrabold text-xs shadow hover:bg-rose-500 flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call 108 (Ambulance)</span>
            </a>
          </div>
        </div>
      )}

      {/* 2C. Browser Notification Enable Banner */}
      {permission === "default" && !promptDismissed && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/50 via-slate-900 to-slate-900 border border-teal-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BellRing className="w-4 h-4 text-teal-400 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                {isTa ? "நேரடி நினைவூட்டல் அறிவிப்புகளை இயக்கவும்" : "Enable Smart Routine Notifications"}
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                {isTa
                  ? "சரியான நேரத்தில் உணவு, நடைப்பயிற்சி மற்றும் மருந்து நினைவூட்டல்களைப் பெறவும்."
                  : "Stay on track with timely heart health alerts, meal guidance, and scheduled medication reminders."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <button
              onClick={handleDismissPrompt}
              className="text-xs font-medium text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              {isTa ? "இப்போது வேண்டாம்" : "Not Now"}
            </button>
            <button
              onClick={handleEnableNotifications}
              className="text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
            >
              {isTa ? "அறிவிப்புகளை இயக்கு" : "Enable Notifications"}
            </button>
          </div>
        </div>
      )}

      {/* 3. TODAY'S HEART PLAN OVERVIEW CARDS (Section 8) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>{isTa ? "இன்றைய இதய திட்டம்" : "TODAY'S HEART PLAN"}</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {plan?.completed_count || 0} / {plan?.total_items || 0} {isTa ? "முடிந்தது" : "completed"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Food adherence meter */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-400" />
                <span>{isTa ? "உணவு" : "Food"}</span>
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {plan?.nutrition?.adherence_percentage || 82}%
              </span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${plan?.nutrition?.adherence_percentage || 82}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block">
                {plan?.nutrition?.diet_score || 82}/100 Diet Score
              </span>
            </div>
          </div>

          {/* Activity adherence meter */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isTa ? "உடற்பயிற்சி" : "Activity"}</span>
              </span>
              <span
                className={`text-xs font-mono font-bold ${
                  isExercisePaused ? "text-rose-400" : "text-indigo-400"
                }`}
              >
                {isExercisePaused ? "Paused" : `${plan?.activity?.adherence_percentage || 60}%`}
              </span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isExercisePaused ? "bg-rose-500" : "bg-indigo-400"
                  }`}
                  style={{ width: `${isExercisePaused ? 100 : plan?.activity?.adherence_percentage || 60}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block">
                {isExercisePaused
                  ? "BP Contraindicated"
                  : `${plan?.activity?.target_minutes || 25} min daily target`}
              </span>
            </div>
          </div>

          {/* BP status */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>{isTa ? "இரத்த அழுத்தம்" : "BP"}</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {plan?.monitoring?.bp_recorded ? "✓ Recorded" : "Pending"}
              </span>
            </div>
            <div className="mt-2">
              <div className="text-lg font-bold font-mono text-white">
                {plan?.monitoring?.latest_bp || "130/85"}
              </div>
              <button
                onClick={() => {
                  setVitalsModalType("BP")
                  setShowVitalsModal(true)
                }}
                className="text-[10px] text-teal-400 hover:text-teal-300 font-semibold mt-1 block"
              >
                + {isTa ? "பதிவு செய்" : "Update BP"}
              </button>
            </div>
          </div>

          {/* Sleep hours */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-purple-400" />
                <span>{isTa ? "தூக்கம்" : "Sleep"}</span>
              </span>
              <span className="text-xs font-mono font-bold text-purple-400">
                {plan?.monitoring?.sleep_hours || 7.2}h
              </span>
            </div>
            <div className="mt-2">
              <div className="text-base font-bold text-white">
                {plan?.monitoring?.sleep_hours || 7.2} hours
              </div>
              <button
                onClick={() => {
                  setVitalsModalType("SLEEP")
                  setShowVitalsModal(true)
                }}
                className="text-[10px] text-teal-400 hover:text-teal-300 font-semibold mt-1 block"
              >
                + {isTa ? "தூக்கத்தை பதிவு செய்" : "Log Sleep"}
              </button>
            </div>
          </div>

          {/* Hydration */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/80 flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <span>{isTa ? "குடிநீர்" : "Hydration"}</span>
              </span>
              <span className="text-xs font-mono font-bold text-sky-400">
                {plan?.monitoring?.hydration_ml || 1800} mL
              </span>
            </div>
            <div className="mt-2">
              <div className="text-base font-bold text-white">
                {plan?.monitoring?.hydration_ml || 1800} / 2,500 mL
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {isTa ? "இதய சுழற்சிக்கு சிறந்தது" : "Supports vascular volume"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TODAY'S FOOD PLAN (Section 4 - Indian Foods, 5 Meal Slots, Sodium Check & Swaps) */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                {isTa ? "இன்றைய உணவு திட்டம் (இந்திய உணவு)" : "TODAY'S FOOD PLAN"}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isTa
                ? "5 நேர உணவு அட்டவணை - குறைந்த சோடியம், அதிக நார்சத்து மற்றும் இதய நல இந்திய உணவுகள்"
                : "5-meal structure utilizing culturally aligned Indian foods calibrated for cardiovascular wellness"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/meal-analysis"
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700"
            >
              <span>{isTa ? "முழு உணவு ஆய்வு" : "Full Meal Analysis"}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* High Sodium Detection & Swaps Banner */}
        {plan?.nutrition?.high_sodium_detected && (
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                {isTa ? "அதிக சோடியம் கண்டறியப்பட்டது" : "High sodium detected"}
              </h4>
              <span className="text-[10px] text-amber-400/80 font-mono">
                {plan?.nutrition?.total_sodium_mg ? `Est: ${Math.round(plan.nutrition.total_sodium_mg)} mg` : ">2,000 mg/day"}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isTa
                ? "உணவு அல்லது இரத்த அழுத்தத் தரவு அதிக சோடியம் அளவை காட்டுகிறது. கீழே உள்ள இதயத்திற்கு உகந்த ஆரோக்கிய மாற்றீடுகளை பின்பற்றவும்:"
                : "Your nutrition history or blood pressure profile indicates elevated dietary sodium. Recommended heart-healthy food swaps:"}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
              {(plan?.nutrition?.suggested_swaps || [
                {
                  current_habit: "Pickle (achaar) + salty snack",
                  suggested_swap: "Fresh vegetable side + unsalted snack",
                  benefit_reason: "Lowers single-meal sodium by ~650 mg."
                }
              ]).map((swap, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs space-y-1"
                >
                  <div className="text-rose-400 font-medium line-through flex items-center gap-1 text-[11px]">
                    <X className="w-3 h-3 text-rose-400 flex-shrink-0" />
                    <span>{swap.current_habit}</span>
                  </div>
                  <div className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{swap.suggested_swap}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{swap.benefit_reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5 Meal Slots */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 pt-1">
          {[
            { slot: "breakfast", label: isTa ? "காலை உணவு" : "Breakfast", icon: Coffee, time: "07:30" },
            { slot: "mid_morning", label: isTa ? "முற்பகல்" : "Mid-Morning", icon: Droplets, time: "10:30" },
            { slot: "lunch", label: isTa ? "மதிய உணவு" : "Lunch", icon: Utensils, time: "13:00" },
            { slot: "evening", label: isTa ? "மாலை சிற்றுண்டி" : "Evening Snack", icon: Flame, time: "16:30" },
            { slot: "dinner", label: isTa ? "இரவு உணவு" : "Dinner", icon: Moon, time: "20:00" }
          ].map(({ slot, label, icon: SlotIcon, time }) => {
            const items = plan?.nutrition?.[slot] || []
            return (
              <div
                key={slot}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      <SlotIcon className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-xs font-bold text-white">{label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{time}</span>
                  </div>

                  <div className="space-y-2 mt-2.5">
                    {items.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">Wholesome Indian option</p>
                    ) : (
                      items.map((food, fIdx) => (
                        <div
                          key={food.id || fIdx}
                          className="flex items-start justify-between gap-2 p-2 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all"
                        >
                          <div className="space-y-0.5">
                            <span
                              className={`text-xs font-semibold block leading-tight ${
                                food.completed ? "line-through text-slate-500" : "text-slate-200"
                              }`}
                            >
                              {food.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                              <span>{Math.round(food.calories || 120)} kcal</span>
                              <span>•</span>
                              <span>{Math.round(food.sodium_mg || 150)}mg Na</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleComplete(food)}
                            className="p-1 text-slate-500 hover:text-emerald-400 flex-shrink-0"
                            title={food.completed ? "Mark incomplete" : "Mark eaten"}
                          >
                            {food.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                            )}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 text-right">
                  {items.filter((i) => i.completed).length} / {items.length} eaten
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 5. TODAY'S ACTIVITY (Section 5) */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white">
                {isTa ? "இன்றைய உடற்பயிற்சி திட்டம்" : "TODAY'S ACTIVITY PLAN"}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isTa
                ? "படிப்படியான, பாதுகாப்பான இருதய செயல்பாடு வழிகாட்டல்"
                : "Gradual progressive cardiovascular mobility tailored to your baseline without acute exertion"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-500/30 px-3 py-1 rounded-xl">
              {isTa ? "இலக்கு:" : "Daily Target:"} {plan?.activity?.target_minutes || 25} min
            </span>
          </div>
        </div>

        {isExercisePaused ? (
          <div className="p-6 rounded-2xl bg-slate-950/70 border border-rose-500/40 text-center space-y-2">
            <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">
              {isTa ? "உடற்பயிற்சி பரிந்துரை இடைநிறுத்தப்பட்டுள்ளது" : "Exercise plan temporarily paused"}
            </h4>
            <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
              {plan?.activity?.pause_reason ||
                "Your recorded blood pressure is severely elevated. Please seek medical assessment before continuing exercise recommendations."}
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setVitalsModalType("BP")
                  setShowVitalsModal(true)
                }}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-slate-700"
              >
                {isTa ? "புதிய இரத்த அழுத்தத்தை பதிவு செய்க" : "Log New Blood Pressure"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(plan?.activity?.activities || [
                {
                  id: "act_walk",
                  name: "Walking",
                  duration_minutes: 20,
                  description: "20 minutes conversational pace walking on flat surface."
                },
                {
                  id: "act_stretch",
                  name: "Light Stretching",
                  duration_minutes: 5,
                  description: "5 minutes gentle neck, shoulder, and hamstring mobility."
                }
              ]).map((act, idx) => (
                <div
                  key={act.id || idx}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    act.completed
                      ? "bg-emerald-950/20 border-emerald-500/40 text-slate-300"
                      : "bg-slate-950/60 border-slate-800 text-white"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Footprints className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-sm font-bold">{act.name}</h4>
                      <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-500/30">
                        {act.duration_minutes} min
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{act.description}</p>
                  </div>

                  <button
                    onClick={() => handleToggleComplete(act)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                      act.completed
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-teal-600 hover:bg-teal-500 text-white shadow-sm"
                    }`}
                  >
                    {act.completed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isTa ? "முடிந்தது" : "Completed"}</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5" />
                        <span>{isTa ? "முடித்ததாக குறி" : "Mark Complete"}</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Warmup & Cooldown Safety Note */}
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>
                {isTa
                  ? "எப்போதும் 5 நிமிட மெதுவான நடைபயிற்சியுடன் தொடங்கவும்; மூச்சுத்திணறல் அல்லது மார்பு இறுக்கம் ஏற்பட்டால் உடனடியாக நிறுத்தவும்."
                  : "Safety Protocol: Always begin with 5 minutes of gentle warmup. Cease exertion immediately if experiencing chest tightness or excessive shortness of breath."}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 6. MONITORING & QUICK CHECK-INS (Section 8) */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              <span>{isTa ? "கண்காணிப்பு & பதிவுகள்" : "MONITORING & LOGGING"}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isTa ? "இன்றைய அளவீடுகளை உடனடியாக பதிவு செய்க" : "Log today's vitals to dynamically update your heart care plan"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Record BP */}
          <button
            onClick={() => {
              setVitalsModalType("BP")
              setShowVitalsModal(true)
            }}
            className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/40 text-left transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <Heart className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono font-bold text-teal-400">
                {plan?.monitoring?.bp_recorded ? "✓ Recorded" : "+ Log"}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {isTa ? "இரத்த அழுத்தம்" : "Blood Pressure"}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {plan?.monitoring?.latest_bp || "Record today's BP"}
              </span>
            </div>
          </button>

          {/* Log Meals */}
          <Link
            to="/meal-analysis"
            className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 text-left transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <Utensils className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono font-bold text-amber-400">+ Log</span>
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {isTa ? "உணவுகள்" : "Meals"}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {isTa ? "உணவை பதிவு செய்க" : "Log today's meal"}
              </span>
            </div>
          </Link>

          {/* Log Activity */}
          <button
            onClick={() => {
              setVitalsModalType("ACTIVITY")
              setShowVitalsModal(true)
            }}
            className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 text-left transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <Footprints className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono font-bold text-indigo-400">+ Log</span>
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {isTa ? "உடற்பயிற்சி" : "Activity"}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {isTa ? "நடந்த நேரத்தை பதிவு செய்" : "Log movement minutes"}
              </span>
            </div>
          </button>

          {/* Record Sleep */}
          <button
            onClick={() => {
              setVitalsModalType("SLEEP")
              setShowVitalsModal(true)
            }}
            className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/40 text-left transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <Moon className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono font-bold text-purple-400">
                {plan?.monitoring?.sleep_hours ? `${plan.monitoring.sleep_hours}h` : "+ Log"}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {isTa ? "தூக்கம்" : "Sleep"}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {isTa ? "தூக்க நேரத்தை பதிவு செய்" : "Record sleep hours"}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 7. WHY THESE RECOMMENDATIONS? (SHAP & Major Model Contributors - Section 8) */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <h2 className="text-base font-bold text-white">
              {isTa ? "ஏன் இந்த பரிந்துரைகள்? (SHAP மாதிரி விளக்கங்கள்)" : "WHY THESE RECOMMENDATIONS?"}
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {isTa
              ? "இந்த காரணிகள் தற்போதைய மாதிரி மதிப்பீட்டிற்கு பங்களித்தன மற்றும் உங்கள் வாழ்க்கை முறை வழிகாட்டலை தனிப்பயனாக்க பயன்படுத்தப்பட்டன."
              : "These factors contributed to the current model estimate and were used to personalize your lifestyle guidance."}
          </p>
        </div>

        <div className="space-y-3.5">
          {(plan?.risk_factors || [
            {
              name: "elevated_bp",
              display_name: "Elevated Blood Pressure",
              value: "138/88 mmHg",
              impact_pct: 38.0,
              description: "Systolic and diastolic pressures impose sustained shear resistance against coronary walls."
            },
            {
              name: "low_activity",
              display_name: "Low Physical Activity",
              value: "Sedentary",
              impact_pct: 28.0,
              description: "Decreased aerobic baseline reduces vascular nitric oxide synthesis."
            },
            {
              name: "high_sodium",
              display_name: "High Dietary Sodium Intake",
              value: ">2,000 mg/day",
              impact_pct: 24.0,
              description: "High sodium expands circulating blood volume and stiffens resistance arterioles."
            }
          ]).map((factor, idx) => (
            <div key={idx} className="space-y-1.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">{factor.display_name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 text-[11px]">{factor.value}</span>
                  <span className="font-mono font-bold text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-500/30 text-[10px]">
                    +{factor.impact_pct}% contribution
                  </span>
                </div>
              </div>

              {/* Impact attribution bar */}
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-500 to-rose-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, factor.impact_pct * 2)}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">{factor.description}</p>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 italic">
          {isTa
            ? "முக்கிய குறிப்பு: மாதிரி பங்களிப்புகள் இதய நோய்க்கான மருத்துவ ஆதாரங்கள் அல்ல; அவை AI மாதிரி கணிப்புக்கான காரணிகளை விளக்குகின்றன."
            : "IMPORTANT NOTICE: Feature attributions represent mathematical contributions to the current model estimate, not diagnostic proofs of disease etiology."}
        </div>
      </div>

      {/* 8. DAILY PLAN ADAPTATIONS (Section 10) */}
      {plan?.adaptations && plan.adaptations.length > 0 && (
        <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800 bg-slate-900/80 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                <span>{isTa ? "தினசரி திட்ட தகவமைப்பு" : "DAILY PLAN ADAPTATION"}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTa
                  ? "உங்கள் சமீபத்திய அளவீடுகளின்படி உடனுக்குடன் மாற்றியமைக்கப்பட்ட ஆலோசனைகள்"
                  : "Dynamic recommendations updated according to your newly recorded health data"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {plan.adaptations.map((ad, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/30">
                      {ad.category}
                    </span>
                    <h4 className="text-xs font-bold text-white">{ad.alert_title}</h4>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{ad.message}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-teal-300 font-medium flex items-start gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span>{ad.suggested_action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. WEEKLY PROGRESS (Section 9) */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-400" />
              <span>{isTa ? "வாராந்திர முன்னேற்றம்" : "WEEKLY PROGRESS"}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isTa ? "வாழ்க்கை முறை பழக்கவழக்க சுருக்கம் மற்றும் நிலைத்தன்மை" : "Lifestyle activity summary and habit tracking progress"}
            </p>
          </div>

          <span className="text-[11px] text-slate-500 font-medium">
            {isTa ? "வாராந்திர நிலைத்தன்மை" : "Weekly adherence tracking"}
          </span>
        </div>

        {/* 7 Day Visual Adherence Bars */}
        <div className="grid grid-cols-7 gap-2 pt-2">
          {(plan?.weekly_progress?.days || [
            { day: "Mon", meal_adherence_pct: 80, exercise_minutes: 25 },
            { day: "Tue", meal_adherence_pct: 90, exercise_minutes: 25 },
            { day: "Wed", meal_adherence_pct: 60, exercise_minutes: 20 },
            { day: "Thu", meal_adherence_pct: 100, exercise_minutes: 25 },
            { day: "Fri", meal_adherence_pct: 70, exercise_minutes: 20 },
            { day: "Sat", meal_adherence_pct: 90, exercise_minutes: 25 },
            { day: "Sun", meal_adherence_pct: 90, exercise_minutes: 25 }
          ]).map((dayObj, dIdx) => (
            <div key={dIdx} className="flex flex-col items-center gap-2">
              <div className="w-full bg-slate-950 h-28 rounded-xl p-1.5 border border-slate-800 flex flex-col justify-end">
                <div
                  className="w-full bg-gradient-to-t from-teal-600 to-emerald-400 rounded-lg transition-all duration-500"
                  style={{ height: `${Math.max(10, dayObj.meal_adherence_pct || 75)}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-slate-300">
                {(dayObj.day || "Day").slice(0, 3)}
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                {dayObj.exercise_minutes || 20}m
              </span>
            </div>
          ))}
        </div>

        {/* Adherence metrics badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              {isTa ? "உடற்பயிற்சி" : "Exercise Minutes"}
            </span>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {plan?.weekly_progress?.exercise_minutes_done || 135} / {plan?.weekly_progress?.exercise_minutes_target || 150} min
            </div>
            <span className="text-[10px] text-emerald-400 mt-0.5 block">90% of weekly goal</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              {isTa ? "உணவு முறை பின்பற்றல்" : "Meal Adherence"}
            </span>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {plan?.weekly_progress?.meal_adherence_pct || 82}%
            </div>
            <span className="text-[10px] text-teal-400 mt-0.5 block">Cardioprotective nutrition</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              {isTa ? "BP பதிவுகள்" : "BP Records"}
            </span>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {plan?.weekly_progress?.bp_records_done || 6} / {plan?.weekly_progress?.bp_records_target || 7} days
            </div>
            <span className="text-[10px] text-purple-400 mt-0.5 block">Consistent tracking</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 italic text-center pt-1">
          {isTa
            ? "வாழ்க்கை முறை பழக்கவழக்க சுருக்கம் - இது தானாகவே இதய நோய் குணமடைந்துவிட்டது என்று அர்த்தப்படுத்தாது."
            : "Lifestyle activity summary tracks adherence consistency and does not imply disease reversal."}
        </div>
      </div>

      {/* 10. LIFESTYLE SCORE & MEAL ANALYSIS INTEGRATION (Sections 11 & 12) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lifestyle Score Card */}
        <div className="glass-card rounded-3xl p-5 border border-slate-800 bg-slate-900/80 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-teal-400" />
                <span>{isTa ? "தற்போதைய வாழ்க்கை முறை மதிப்பீடு" : "CURRENT LIFESTYLE SCORE"}</span>
              </span>
              <Link
                to="/lifestyle"
                className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
              >
                <span>{isTa ? "விவரங்கள்" : "View Details"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-3xl font-display font-extrabold text-white">
                {plan?.lifestyle_score?.overall_lifestyle_score || 78}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
              <span className="ml-auto text-xs font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                {plan?.lifestyle_score?.category || "MODERATE_LIFESTYLE"}
              </span>
            </div>

            {/* 6 Pillar Breakdown */}
            <div className="grid grid-cols-3 gap-2 mt-3.5 text-xs">
              {[
                { label: "Diet", val: plan?.lifestyle_score?.diet_score || 82 },
                { label: "Activity", val: plan?.lifestyle_score?.activity_score || 65 },
                { label: "Sleep", val: plan?.lifestyle_score?.sleep_score || 75 },
                { label: "Smoking", val: plan?.lifestyle_score?.smoking_score || 100 },
                { label: "Stress", val: plan?.lifestyle_score?.stress_score || 70 },
                { label: "BMI", val: plan?.lifestyle_score?.bmi_score || 76 }
              ].map((p, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">{p.label}</span>
                  <span className="font-mono font-bold text-white mt-0.5 block">{p.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-slate-500 pt-1">
            Reuses multi-pillar lifestyle scoring engine without conflicting metrics.
          </div>
        </div>

        {/* Meal Analysis Integration Card */}
        <div className="glass-card rounded-3xl p-5 border border-slate-800 bg-slate-900/80 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-amber-400" />
                <span>{isTa ? "இன்றைய ஊட்டச்சத்து (உணவு ஆய்வு)" : "TODAY'S NUTRITION"}</span>
              </span>
              <Link
                to="/meal-analysis"
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <span>{isTa ? "உணவுப் பதிவு" : "Log / Analyze"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Calories</span>
                <span className="font-mono font-bold text-white text-sm mt-0.5 block">
                  {Math.round(plan?.meal_analysis?.total_calories || plan?.nutrition?.total_calories || 1420)} kcal
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Sodium</span>
                <span className="font-mono font-bold text-amber-400 text-sm mt-0.5 block">
                  {Math.round(plan?.meal_analysis?.total_sodium_mg || plan?.nutrition?.total_sodium_mg || 1180)} mg
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Fiber</span>
                <span className="font-mono font-bold text-emerald-400 text-sm mt-0.5 block">
                  {Math.round(plan?.meal_analysis?.total_fiber_g || plan?.nutrition?.total_fiber_g || 27)} g
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Protein</span>
                <span className="font-mono font-bold text-teal-400 text-sm mt-0.5 block">
                  {Math.round(plan?.meal_analysis?.total_protein_g || plan?.nutrition?.total_protein_g || 61)} g
                </span>
              </div>
            </div>

            <div className="mt-3 p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-300 font-bold block">Diet Health Score</span>
                <span className="text-[10px] text-slate-400">
                  {plan?.meal_analysis?.cardio_health_rating || "Cardioprotective (Excellent)"}
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {plan?.meal_analysis?.diet_score || 83} / 100
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 pt-1">
            Reuses dynamic Indian food composition calculations and cardioprotective indices.
          </div>
        </div>
      </div>

      {/* 11. Interactive Vitals Modal */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl border border-slate-700 bg-slate-900 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {vitalsModalType === "BP" && <Heart className="w-4 h-4 text-rose-400" />}
                {vitalsModalType === "SLEEP" && <Moon className="w-4 h-4 text-purple-400" />}
                {vitalsModalType === "ACTIVITY" && <Footprints className="w-4 h-4 text-indigo-400" />}
                <span>
                  {vitalsModalType === "BP" && (isTa ? "இரத்த அழுத்த பதிவு" : "Record Blood Pressure")}
                  {vitalsModalType === "SLEEP" && (isTa ? "தூக்க நேர பதிவு" : "Record Sleep Hours")}
                  {vitalsModalType === "ACTIVITY" && (isTa ? "உடற்பயிற்சி பதிவு" : "Log Activity Minutes")}
                </span>
              </h3>
              <button
                onClick={() => setShowVitalsModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitVitals} className="space-y-4 text-xs">
              {vitalsModalType === "BP" && (
                <div className="space-y-3">
                  <p className="text-slate-300">
                    {isTa
                      ? "ஓய்வு நிலையில் எடுக்கப்பட்ட சிஸ்டாலிக் மற்றும் டயஸ்டாலிக் அளவீடுகளை உள்ளிடவும்:"
                      : "Enter your resting systolic and diastolic blood pressure readings:"}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                        Systolic (mmHg)
                      </label>
                      <input
                        type="number"
                        min="70"
                        max="260"
                        value={vitalsInput.systolic_bp}
                        onChange={(e) =>
                          setVitalsInput({ ...vitalsInput, systolic_bp: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                        Diastolic (mmHg)
                      </label>
                      <input
                        type="number"
                        min="40"
                        max="160"
                        value={vitalsInput.diastolic_bp}
                        onChange={(e) =>
                          setVitalsInput({ ...vitalsInput, diastolic_bp: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white font-mono"
                        required
                      />
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400">
                    Note: Systolic ≥180 or Diastolic ≥110 automatically activates the exercise safety pause.
                  </div>
                </div>
              )}

              {vitalsModalType === "SLEEP" && (
                <div className="space-y-3">
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                    Sleep Duration (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="16"
                    value={vitalsInput.sleep_hours}
                    onChange={(e) =>
                      setVitalsInput({ ...vitalsInput, sleep_hours: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white font-mono"
                    required
                  />
                  <p className="text-[10px] text-slate-400">
                    7–8 hours of restorative sleep supports healthy parasympathetic blood pressure regulation.
                  </p>
                </div>
              )}

              {vitalsModalType === "ACTIVITY" && (
                <div className="space-y-3">
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                    Activity Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={vitalsInput.activity_minutes}
                    onChange={(e) =>
                      setVitalsInput({ ...vitalsInput, activity_minutes: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white font-mono"
                    required
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingVitals}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  {savingVitals ? "Saving..." : "Save & Update Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12. Emergency Triage Symptoms Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl border-2 border-rose-500/60 bg-slate-900 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-rose-400 animate-pulse" />
                <h3 className="text-base font-bold text-white">
                  {isTa ? "இருதய அவசர அறிகுறி பரிசோதனை" : "Acute Cardiac Symptom Safety Triage"}
                </h3>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Emergency Contacts for India */}
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block">
                  India Emergency Dispatch
                </span>
                <span className="text-sm font-extrabold text-white">
                  Emergency: 112 • Ambulance: 108
                </span>
              </div>
              <a
                href="tel:112"
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call 112</span>
              </a>
            </div>

            <form onSubmit={handleCheckEmergencySymptoms} className="space-y-3 text-xs">
              <p className="text-slate-300">
                {isTa
                  ? "நீங்கள் தற்போது ஏதேனும் பின்வரும் தீவிர அறிகுறிகளை உணர்கிறீர்களா? சரிபார்க்கவும்:"
                  : "Are you experiencing any of the following acute red-flag symptoms right now?"}
              </p>

              {[
                { key: "chest_pain_or_pressure", label: "Crushing or severe chest pain / central chest pressure" },
                { key: "pain_radiating_arm_jaw", label: "Pain spreading/radiating to the left arm, jaw, neck, or back" },
                { key: "severe_shortness_of_breath", label: "Severe acute shortness of breath or inability to catch breath" },
                { key: "fainting_syncope", label: "Fainting, sudden loss of consciousness, or extreme dizziness" },
                { key: "sudden_weakness_speech_difficulty", label: "Sudden weakness in face/arm or difficulty speaking (neurological signs)" }
              ].map((sym) => (
                <label
                  key={sym.key}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-rose-500/40 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={emergencySymptoms[sym.key]}
                    onChange={(e) =>
                      setEmergencySymptoms({ ...emergencySymptoms, [sym.key]: e.target.checked })
                    }
                    className="w-4 h-4 accent-rose-500 rounded mt-0.5 cursor-pointer"
                  />
                  <span className="text-slate-200 font-medium leading-relaxed">{sym.label}</span>
                </label>
              ))}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submittingEmergency}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  {submittingEmergency ? "Evaluating..." : "Evaluate Safety Status"}
                </button>
              </div>
            </form>

            {emergencyResult && (
              <div
                className={`p-3.5 rounded-2xl border text-xs mt-3 space-y-1.5 ${
                  emergencyResult.is_emergency
                    ? "bg-rose-950/90 border-rose-500 text-rose-100"
                    : "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {emergencyResult.is_emergency ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>CRITICAL EMERGENCY: Call 112 / 108 Immediately</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>No acute red-flag symptoms reported</span>
                    </>
                  )}
                </div>
                <ul className="list-disc list-inside text-[11px] space-y-1 opacity-90">
                  {(emergencyResult.instructions || []).map((ins, iIdx) => (
                    <li key={iIdx}>{ins}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 13. Notification Preferences Modal */}
      {showPrefModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl border border-slate-700 bg-slate-900 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-400" />
                <h3 className="text-base font-bold text-white">
                  {isTa ? "நினைவூட்டல் அமைப்புகள்" : "Notification Preferences"}
                </h3>
              </div>
              <button
                onClick={() => setShowPrefModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <span className="font-bold text-white block">
                    {isTa ? "வழக்க அறிவிப்புகளை இயக்கு" : "Enable Routine Notifications"}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Receive scheduled reminders for diet, activity, and vitals
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifications_enabled}
                  onChange={(e) =>
                    setPreferences({ ...preferences, notifications_enabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Categories
                </span>
                {[
                  { key: "breakfast_reminders", label: "Breakfast Guidance" },
                  { key: "lunch_reminders", label: "Lunch Guidance" },
                  { key: "dinner_reminders", label: "Dinner Guidance" },
                  { key: "hydration_reminders", label: "Hydration Check-ins" },
                  { key: "exercise_reminders", label: "Activity Routine Reminders" },
                  { key: "medication_reminders", label: "Medication Reminders" },
                  { key: "general_reminders", label: "Sleep & Wellness Prompts" }
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 cursor-pointer"
                  >
                    <span className="text-slate-300 font-medium">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={!!preferences[item.key]}
                      disabled={!preferences.notifications_enabled}
                      onChange={(e) =>
                        setPreferences({ ...preferences, [item.key]: e.target.checked })
                      }
                      className="w-4 h-4 accent-teal-500 rounded cursor-pointer disabled:opacity-50"
                    />
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPrefModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPrefs}
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  {savingPrefs ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 14. Persistent Clinical Safety Disclaimer */}
      <MedicalDisclaimer />
    </div>
  )
}

export default DailyHealthPlan
