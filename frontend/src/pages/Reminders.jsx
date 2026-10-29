import React, { useState, useEffect } from "react"
import {
  Pill,
  Plus,
  Clock,
  CheckCircle2,
  Bell,
  Trash2,
  Calendar,
  AlertCircle,
  Sparkles,
  Droplets,
  Footprints,
  Activity,
  Heart,
  Stethoscope,
  ChevronDown
} from "lucide-react"
import api from "../services/api"
import { useLanguage } from "../context/LanguageContext"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

const QUICK_PRESETS = [
  {
    medicine_name: "Morning Blood Pressure Check",
    tamil_name: "காலை இரத்த அழுத்த பரிசோதனை",
    dosage: "Rest 5 min before reading",
    time: "08:00",
    frequency: "Daily",
    type: "bp"
  },
  {
    medicine_name: "Hydration - Glass of Warm Water",
    tamil_name: "ஒரு டம்ளர் வெந்நீர் அருந்துதல்",
    dosage: "250 ml",
    time: "10:00",
    frequency: "Daily",
    type: "water"
  },
  {
    medicine_name: "Evening 30-Min Brisk Walk",
    tamil_name: "மாலை 30 நிமிட நடைப்பயிற்சி",
    dosage: "Brisk walking at comfortable pace",
    time: "17:30",
    frequency: "Daily",
    type: "walk"
  },
  {
    medicine_name: "Prescribed Heart Medication",
    tamil_name: "மருத்துவர் பரிந்துரைத்த இதய மாத்திரை",
    dosage: "As directed by doctor",
    time: "20:30",
    frequency: "Daily",
    type: "med"
  }
]

export const Reminders = () => {
  const { lang, t } = useLanguage()
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [notificationStatus, setNotificationStatus] = useState("default")
  const [feedback, setFeedback] = useState("")

  const [formData, setFormData] = useState({
    medicine_name: "",
    dosage: "",
    time: "08:00",
    frequency: "Daily",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    notes: ""
  })

  useEffect(() => {
    fetchReminders()
    if ("Notification" in window) {
      setNotificationStatus(Notification.permission)
    }
  }, [])

  const fetchReminders = async () => {
    try {
      const res = await api.get("/reminders")
      setReminders(res.data)
    } catch (err) {
      console.error("Failed to load reminders:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestNotification = async () => {
    if (!("Notification" in window)) {
      alert(lang === "ta" ? "இந்த உலாவியில் அறிவிப்புகள் ஆதரிக்கப்படவில்லை." : "Browser notifications are not supported in this browser.")
      return
    }
    const permission = await Notification.requestPermission()
    setNotificationStatus(permission)
    if (permission === "granted") {
      new Notification(lang === "ta" ? "இதய நல நினைவூட்டல்கள் தயார்" : "Heart Health Assistant Reminders Active", {
        body: lang === "ta" ? "திட்டமிடப்பட்ட மருந்துகளுக்கான அறிவிப்புகளைப் பெறுவீர்கள்." : "You will receive timely in-app and browser notifications for scheduled health tasks."
      })
    }
  }

  const handleCreate = async (e) => {
    e?.preventDefault()
    if (!formData.medicine_name.trim()) return
    try {
      await api.post("/reminders", formData)
      setShowAddModal(false)
      setFormData({
        medicine_name: "",
        dosage: "",
        time: "08:00",
        frequency: "Daily",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        notes: ""
      })
      setFeedback(lang === "ta" ? "நினைவூட்டல் வெற்றிகரமாக சேர்க்கப்பட்டது!" : "Reminder added successfully!")
      setTimeout(() => setFeedback(""), 3000)
      fetchReminders()
    } catch (err) {
      console.error("Failed to create reminder:", err)
    }
  }

  const handleQuickAdd = async (preset) => {
    const payload = {
      medicine_name: lang === "ta" && preset.tamil_name ? `${preset.tamil_name} (${preset.medicine_name})` : preset.medicine_name,
      dosage: preset.dosage,
      time: preset.time,
      frequency: preset.frequency,
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      notes: "Quick preset added"
    }
    try {
      await api.post("/reminders", payload)
      setFeedback(lang === "ta" ? "விரைவு நினைவூட்டல் சேர்க்கப்பட்டது!" : "Preset added to schedule!")
      setTimeout(() => setFeedback(""), 3000)
      fetchReminders()
    } catch (err) {
      console.error("Quick add failed:", err)
    }
  }

  const handleMarkTaken = async (id) => {
    try {
      await api.post(`/reminders/${id}/taken`)
      setFeedback(lang === "ta" ? "நிறைவு செய்யப்பட்டது! அருமை!" : "Task recorded as completed! Good job!")
      setTimeout(() => setFeedback(""), 3000)
      fetchReminders()
    } catch (err) {
      console.error("Mark taken failed:", err)
    }
  }

  const handleSnooze = async (id) => {
    try {
      await api.post(`/reminders/${id}/snooze`, null, { params: { minutes: 15 } })
      setFeedback(lang === "ta" ? "15 நிமிடங்களுக்கு தள்ளி வைக்கப்பட்டது." : "Reminder snoozed for 15 minutes.")
      setTimeout(() => setFeedback(""), 3000)
      fetchReminders()
    } catch (err) {
      console.error("Snooze failed:", err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm(lang === "ta" ? "இந்த நினைவூட்டலை நீக்க விரும்புகிறீர்களா?" : "Are you sure you want to remove this reminder?")) return
    try {
      await api.delete(`/reminders/${id}`)
      fetchReminders()
    } catch (err) {
      console.error("Delete reminder failed:", err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 bg-teal-950 border border-teal-500/30 px-2 py-0.5 rounded-full font-bold">
              {lang === "ta" ? "தினசரி அட்டவணை" : "Daily Routine"}
            </span>
            {notificationStatus === "granted" && (
              <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <Bell className="w-3 h-3" /> {lang === "ta" ? "அறிவிப்புகள் தயார்" : "Notifications On"}
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <Pill className="w-7 h-7 text-teal-400" />
            <span>{lang === "ta" ? "மருந்து & நல்வாழ்வு நினைவூட்டல்கள்" : "Medication & Routine Reminders"}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {lang === "ta"
              ? "மருத்துவர் அளித்த மருந்துகள், இரத்த அழுத்த பரிசோதனை மற்றும் நடைப்பயிற்சி நினைவூட்டல்களை எளிதாகக் கண்காணிக்கவும்."
              : "Keep track of your doctor-prescribed medications, BP monitoring, hydration, and daily walking routines."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notificationStatus !== "granted" && (
            <button
              onClick={handleRequestNotification}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>{lang === "ta" ? "அறிவிப்பை இயக்கு" : "Enable Alerts"}</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-950/40 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === "ta" ? "புதிய நினைவூட்டல்" : "Add Reminder"}</span>
          </button>
        </div>
      </div>

      <MedicalDisclaimer compact={true} />

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-teal-950/40 border border-teal-500/40 text-xs text-teal-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 1-Click Quick Add Presets Card */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/60 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>{lang === "ta" ? "1-கிளிக் விரைவு நினைவூட்டல்கள்" : "1-Click Quick Add Presets"}</span>
          </h2>
          <span className="text-[11px] text-slate-500">
            {lang === "ta" ? "பொதுவான இதய நலப் பழக்கங்கள்" : "Common heart health routines"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {QUICK_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickAdd(p)}
              className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/40 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                  {lang === "ta" && p.tamil_name ? p.tamil_name : p.medicine_name}
                </span>
                <Plus className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{p.time}</span>
                <span>•</span>
                <span>{p.dosage}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          {lang === "ta" ? `திட்டமிடப்பட்ட நினைவூட்டல்கள் (${reminders.length})` : `Your Scheduled Reminders (${reminders.length})`}
        </h2>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            {lang === "ta" ? "நினைவூட்டல்கள் ஏற்றப்படுகின்றன..." : "Loading reminders..."}
          </div>
        ) : reminders.length === 0 ? (
          <div className="p-8 text-center glass-card rounded-2xl border border-slate-800 space-y-2">
            <Pill className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-white">
              {lang === "ta" ? "நினைவூட்டல்கள் எதுவும் இல்லை" : "No reminders set yet"}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {lang === "ta"
                ? "மேலே உள்ள விரைவுப் பொத்தான்களைப் பயன்படுத்தி அல்லது 'புதிய நினைவூட்டல்' கிளிக் செய்து சேர்க்கவும்."
                : "Add your prescribed medicines, daily walk, or morning BP check to never miss a step."}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {reminders.map((rem) => {
              const isTaken = rem.status === "completed"
              return (
                <div
                  key={rem.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isTaken
                      ? "bg-slate-950/40 border-slate-800/60 opacity-60"
                      : "glass-card border-slate-800 bg-slate-900/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isTaken
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/30"
                          : "bg-teal-950/60 text-teal-400 border border-teal-500/30"
                      }`}
                    >
                      {isTaken ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isTaken ? "line-through text-slate-400" : "text-white"}`}>
                        {rem.medicine_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        <span className="font-semibold text-teal-300">{rem.time}</span>
                        <span>•</span>
                        <span>{rem.dosage || "Standard dose"}</span>
                        <span>•</span>
                        <span className="text-[10px] uppercase font-bold text-slate-500">{rem.frequency}</span>
                      </div>
                      {rem.notes && (
                        <p className="text-[11px] text-slate-500 mt-1 italic">{rem.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {!isTaken ? (
                      <>
                        <button
                          onClick={() => handleMarkTaken(rem.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{lang === "ta" ? "முடித்தேன்" : "Take / Done"}</span>
                        </button>
                        <button
                          onClick={() => handleSnooze(rem.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                        >
                          {lang === "ta" ? "+15 நிமிடம்" : "Snooze 15m"}
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        {lang === "ta" ? "முடிந்தது" : "Completed"}
                      </span>
                    )}

                    <button
                      onClick={() => handleDelete(rem.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title={lang === "ta" ? "நீக்கு" : "Delete"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full rounded-3xl border border-slate-700 p-6 bg-slate-900/95 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Pill className="w-4 h-4 text-teal-400" />
                <span>{lang === "ta" ? "புதிய நினைவூட்டல் சேர்க்கவும்" : "Add Health Reminder"}</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  {lang === "ta" ? "மருந்து / பணியின் பெயர் *" : "Medication / Routine Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === "ta" ? "உதா: அஸ்பிரின் 75mg / நடைப்பயிற்சி" : "e.g. Atorvastatin 10mg, Morning BP, Walk"}
                  value={formData.medicine_name}
                  onChange={(e) => setFormData({ ...formData, medicine_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    {lang === "ta" ? "அளவு / குறிப்பு" : "Dosage / Note"}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1 tablet after food"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    {lang === "ta" ? "நேரம் *" : "Scheduled Time *"}
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    {lang === "ta" ? "அதிர்வெண்" : "Frequency"}
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
                  >
                    <option value="Daily">{lang === "ta" ? "தினமும்" : "Daily"}</option>
                    <option value="Twice Daily">{lang === "ta" ? "ஒரு நாளைக்கு இருமுறை" : "Twice Daily"}</option>
                    <option value="Weekly">{lang === "ta" ? "வாரத்திற்கு ஒருமுறை" : "Weekly"}</option>
                    <option value="As Needed">{lang === "ta" ? "தேவைப்படும் போது" : "As Needed"}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    {lang === "ta" ? "தொடங்கும் தேதி" : "Start Date"}
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  {lang === "ta" ? "கூடுதல் குறிப்பு (விருப்பமானது)" : "Special Instructions"}
                </label>
                <input
                  type="text"
                  placeholder={lang === "ta" ? "உதா: உணவிற்கு பின் குடிக்கவும்" : "e.g. Take with warm water"}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  {lang === "ta" ? "ரத்து" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-950/40"
                >
                  {lang === "ta" ? "சேமி" : "Save Reminder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reminders