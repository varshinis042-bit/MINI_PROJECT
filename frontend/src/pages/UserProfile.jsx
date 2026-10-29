import React, { useState, useEffect } from "react"
import { User, Save, CheckCircle2, AlertCircle, Languages, Heart, Shield } from "lucide-react"
import api from "../services/api"
import { useLanguage } from "../context/LanguageContext"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

export const UserProfile = () => {
  const { lang, setLang, t } = useLanguage()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile")
        setProfile(res.data)
      } catch (err) {
        console.error("Profile load failed:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleChange = (field, val) => {
    setProfile((prev) => ({ ...prev, [field]: val }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg("")
    try {
      const res = await api.put("/profile", profile)
      setProfile(res.data)
      setMsg(lang === "ta" ? "உங்கள் உடல் விவரங்கள் வெற்றிகரமாக சேமிக்கப்பட்டன." : "Health profile updated successfully.")
      setTimeout(() => setMsg(""), 3500)
    } catch (err) {
      console.error("Profile update failed:", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">
          {lang === "ta" ? "சுயவிவரம் ஏற்றப்படுகிறது..." : "Loading user profile..."}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="pb-2 border-b border-slate-800">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-teal-400" />
          <span>{lang === "ta" ? "நோயாளியின் நல விவரங்கள் & சுயவிவரம்" : "Patient Health Baseline & Profile"}</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {lang === "ta"
            ? "எதிர்கால இதய மதிப்பீடுகள் மற்றும் உணவுக் கணக்கீடுகளுக்காக உங்கள் மருத்துவ விவரங்களைப் புதுப்பித்துக் கொள்ளுங்கள்."
            : "Maintain your personal clinical baseline to streamline future cardiovascular assessments and Indian meal plans."}
        </p>
      </div>

      <MedicalDisclaimer compact={true} />

      {msg && (
        <div className="p-3.5 rounded-2xl bg-teal-950/40 border border-teal-500/40 text-xs text-teal-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Language Preference Card */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center flex-shrink-0">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {lang === "ta" ? "செயலி மொழி விருப்பம்" : "Application Language Preference"}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === "ta" ? "முழுமையான தமிழ் மற்றும் ஆங்கில இருமொழி ஆதரவு" : "Toggle between English and authentic Tamil across the app"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              lang === "en"
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLang("ta")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              lang === "ta"
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            தமிழ்
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            <span>{lang === "ta" ? "அடிப்படை உடல் அளவீடுகள்" : "Demographic & Anthropometric Baseline"}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {lang === "ta" ? "வயது (ஆண்டுகள்)" : "Age (years)"}
              </label>
              <input
                type="number"
                value={profile.age || ""}
                onChange={(e) => handleChange("age", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {lang === "ta" ? "பாலினம்" : "Biological Sex"}
              </label>
              <select
                value={profile.sex || "male"}
                onChange={(e) => handleChange("sex", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              >
                <option value="male">{lang === "ta" ? "ஆண் (Male)" : "Male"}</option>
                <option value="female">{lang === "ta" ? "பெண் (Female)" : "Female"}</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {lang === "ta" ? "உயரம் (செ.மீ)" : "Height (cm)"}
              </label>
              <input
                type="number"
                value={profile.height_cm || ""}
                onChange={(e) => handleChange("height_cm", parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {lang === "ta" ? "எடை (கிலோ)" : "Weight (kg)"}
              </label>
              <input
                type="number"
                value={profile.weight_kg || ""}
                onChange={(e) => handleChange("weight_kg", parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            <span>{lang === "ta" ? "மருத்துவ ஆய்வக & இரத்த அழுத்த அளவீடுகள்" : "Clinical & Laboratory Biomarkers"}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {lang === "ta" ? "சுருங்கு இரத்த அழுத்தம் (Systolic BP - mmHg)" : "Systolic BP (mmHg)"}
              </label>
              <input
                type="number"
                value={profile.systolic_bp || ""}
                onChange={(e) => handleChange("systolic_bp", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {lang === "ta" ? "விரிவு இரத்த அழுத்தம் (Diastolic BP - mmHg)" : "Diastolic BP (mmHg)"}
              </label>
              <input
                type="number"
                value={profile.diastolic_bp || ""}
                onChange={(e) => handleChange("diastolic_bp", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {lang === "ta" ? "மொத்த கொலஸ்ட்ரால் (mg/dL)" : "Total Cholesterol (mg/dL)"}
              </label>
              <input
                type="number"
                value={profile.cholesterol || ""}
                onChange={(e) => handleChange("cholesterol", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {lang === "ta" ? "வெறும் வயிற்று சர்க்கரை (Fasting Glucose - mg/dL)" : "Fasting Blood Glucose (mg/dL)"}
              </label>
              <input
                type="number"
                value={profile.blood_glucose || ""}
                onChange={(e) => handleChange("blood_glucose", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            <span>{lang === "ta" ? "வாழ்வியல் மற்றும் பழக்கவழக்கங்கள்" : "Lifestyle & Behavioral Habits"}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {lang === "ta" ? "புகைபிடிக்கும் பழக்கம்" : "Smoking Status"}
              </label>
              <select
                value={profile.smoking_status || "never"}
                onChange={(e) => handleChange("smoking_status", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              >
                <option value="never">{lang === "ta" ? "எப்போதும் இல்லை (Never)" : "Never smoked"}</option>
                <option value="former">{lang === "ta" ? "முன்னர் புகைபிடித்தவர் (Former)" : "Former smoker"}</option>
                <option value="current">{lang === "ta" ? "தற்போது புகைபிடிப்பவர் (Current)" : "Current smoker"}</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {lang === "ta" ? "உடற்பயிற்சி நிலை" : "Physical Activity Level"}
              </label>
              <select
                value={profile.physical_activity || "moderate"}
                onChange={(e) => handleChange("physical_activity", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              >
                <option value="sedentary">{lang === "ta" ? "உடலுழைப்பற்ற நிலை (Sedentary)" : "Sedentary (< 30 min/week)"}</option>
                <option value="moderate">{lang === "ta" ? "மிதமான பயிற்சி (150 min/வாரம்)" : "Moderate (150 min/week)"}</option>
                <option value="vigorous">{lang === "ta" ? "தீவிர உடற்பயிற்சி (Vigorous)" : "Vigorous (> 250 min/week)"}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-950/40 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? (lang === "ta" ? "சேமிக்கப்படுகிறது..." : "Saving...") : (lang === "ta" ? "விவரங்களை சேமி" : "Save Profile Baseline")}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default UserProfile