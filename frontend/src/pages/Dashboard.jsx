import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Heart,
  Salad,
  Flame,
  Moon,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Utensils,
  Sliders,
  CheckCircle2,
  PhoneCall,
  Pill,
  Footprints,
  User,
  Activity,
  LineChart,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronRight,
  AlertCircle,
  BarChart3,
  Info,
  ChefHat,
  ShieldCheck
} from "lucide-react"
import api from "../services/api"
import { useAuth } from "../context/AuthContext"
import { useLanguage } from "../context/LanguageContext"
import { RiskGauge } from "../components/RiskGauge"
import { UncertaintyBadge } from "../components/UncertaintyBadge"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"
import { OnboardingModal } from "../components/OnboardingModal"
import { BodyHealthVisualizer } from "../components/BodyHealthVisualizer"
import { TodayHealthPlan } from "../components/TodayHealthPlan"

export const Dashboard = () => {
  const { user } = useAuth()
  const { lang, t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [latestPred, setLatestPred] = useState(null)
  const [lifestyle, setLifestyle] = useState(null)
  const [reminders, setReminders] = useState([])
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Auto-launch onboarding on first visit if not yet completed
  useEffect(() => {
    const completed = localStorage.getItem("cardio_onboarding_completed")
    if (!completed) {
      setShowOnboarding(true)
    }
  }, [])

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [profRes, histRes, lifeRes, remRes] = await Promise.allSettled([
          api.get("/profile"),
          api.get("/predict/history"),
          api.get("/lifestyle/score"),
          api.get("/reminders")
        ])

        if (profRes.status === "fulfilled") setProfile(profRes.value.data)
        if (histRes.status === "fulfilled" && histRes.value.data.length > 0) {
          setLatestPred(histRes.value.data[0])
        }
        if (lifeRes.status === "fulfilled") setLifestyle(lifeRes.value.data)
        if (remRes.status === "fulfilled") setReminders(remRes.value.data)
      } catch (err) {
        console.error("Dashboard data load error:", err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [])

  // Time-based greeting in active language
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t("greeting_morning", "Good Morning")
    if (hour < 17) return t("greeting_afternoon", "Good Afternoon")
    return t("greeting_evening", "Good Evening")
  }

  // Calculate Profile Completion %
  const calculateProfileCompletion = () => {
    if (!profile) return { pct: 60, missing: ["Cholesterol", "Fasting Glucose"] }
    const checks = [
      { key: "age", label: "Age" },
      { key: "height_cm", label: "Height" },
      { key: "weight_kg", label: "Weight" },
      { key: "systolic_bp", label: "Blood Pressure" },
      { key: "cholesterol", label: "Cholesterol" },
      { key: "blood_glucose", label: "Fasting Glucose" }
    ]
    let completed = 0
    const missing = []
    checks.forEach((c) => {
      if (profile[c.key] && profile[c.key] > 0) {
        completed++
      } else {
        missing.push(c.label)
      }
    })
    return {
      pct: Math.round((completed / checks.length) * 100),
      missing
    }
  }

  const { pct: profilePct, missing: profileMissing } = calculateProfileCompletion()
  const userName = user?.full_name ? user.full_name.split(" ")[0] : (lang === "ta" ? "நண்பரே" : "Friend")
  const hasPrediction = !!latestPred
  const riskPct = latestPred ? latestPred.risk_percentage : 0
  const riskCategory = latestPred ? latestPred.risk_category : "LOW"
  const lifeScore = lifestyle ? lifestyle.overall_lifestyle_score : 74
  const dietScore = lifestyle ? lifestyle.diet_score : 70

  // Blood pressure check
  const isHighBp = profile && (profile.systolic_bp >= 140 || profile.diastolic_bp >= 90)

  // Filter pending reminders
  const pendingReminders = reminders.filter((r) => r.status === "upcoming")

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Onboarding Tutorial Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950 border border-teal-500/30 px-2.5 py-0.5 rounded-full">
              {t("app_title")}
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">
              {new Date().toLocaleDateString(lang === "ta" ? "ta-IN" : "en-US", {
                weekday: "short",
                month: "short",
                day: "numeric"
              })}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            {getGreeting()}, <span className="text-teal-400">{userName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {lang === "ta"
              ? "இன்று உங்கள் இதய நலனைப் பேண வழிகாட்டிகள் தயார்."
              : "Let's take care of your heart health today."}
          </p>
        </div>

        {/* Quick Actions Header Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOnboarding(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm hover:text-white"
          >
            <HelpCircle className="w-4 h-4 text-teal-400" />
            <span>{lang === "ta" ? "பயன்படுத்துவது எப்படி?" : "How to use this app?"}</span>
          </button>

          <Link
            to="/risk-assessment"
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-950/40 flex items-center gap-1.5"
          >
            <Heart className="w-4 h-4" />
            <span>{t("nav_risk_assessment")}</span>
          </Link>
        </div>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Centralized 4-Tier Alert Notifications Banner */}
      <div className="space-y-2.5">
        {/* Tier 1: High Cardiovascular Risk Alert */}
        {hasPrediction && riskCategory === "HIGH" && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 flex items-start justify-between gap-3 text-xs text-rose-200 shadow-md shadow-rose-950/30">
            <div className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 flex-shrink-0 animate-pulse"></span>
              <div>
                <strong className="font-bold text-rose-300 block text-sm">
                  {lang === "ta" ? "⚠️ தீவிர இதய அபாய எச்சரிக்கை:" : "⚠️ High Cardiovascular Risk Attention:"}
                </strong>
                <span className="leading-relaxed">
                  {lang === "ta"
                    ? "உங்கள் சமீபத்திய கணக்கீட்டில் இதய அபாய சதவீதம் அதிகமாக உள்ளது. உப்பு மற்றும் எண்ணெயைக் குறைக்கவும், மெதுவான நடைப்பயிற்சி மேற்கொள்ளவும், மருத்துவரை அணுகவும்."
                    : "Your latest assessment indicates elevated cardiovascular risk. Review your personalized diet, gentle activity, and consult your physician."}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 flex-shrink-0">
              <Link
                to="/manage-risk"
                className="font-bold text-teal-300 hover:text-white underline px-2 py-1 rounded bg-teal-900/40"
              >
                {lang === "ta" ? "அபாய மேலாண்மை →" : "Manage Risk →"}
              </Link>
              <Link
                to="/prediction-result"
                className="font-bold text-rose-300 hover:text-white underline px-2 py-1 rounded bg-rose-900/40"
              >
                {lang === "ta" ? "விவரம் →" : "View Result →"}
              </Link>
            </div>
          </div>
        )}

        {/* Tier 2: High Blood Pressure Alert */}
        {isHighBp && (
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>{lang === "ta" ? "இரத்த அழுத்த எச்சரிக்கை:" : "Elevated Blood Pressure:"}</strong>{" "}
                {lang === "ta"
                  ? `உங்கள் இரத்த அழுத்தம் ${profile.systolic_bp}/${profile.diastolic_bp} mmHg ஆக உள்ளது. உணவில் உப்பை குறைக்கவும், ஓய்வெடுக்கவும்.`
                  : `Your blood pressure is recorded at ${profile.systolic_bp}/${profile.diastolic_bp} mmHg. Limit sodium, stay hydrated, and verify with your doctor.`}
              </span>
            </div>
            <Link to="/exercise" className="font-bold text-amber-300 hover:underline flex-shrink-0">
              {lang === "ta" ? "பாதுகாப்பான உடற்பயிற்சி →" : "Safe Exercises →"}
            </Link>
          </div>
        )}

        {/* Tier 3: Pending Reminders Alert */}
        {pendingReminders.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-teal-500/30 flex items-center justify-between gap-3 text-xs text-teal-200">
            <div className="flex items-center gap-2.5">
              <Pill className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>
                <strong>{lang === "ta" ? "நினைவூட்டல்:" : "Reminder:"}</strong>{" "}
                {lang === "ta"
                  ? `இன்று உங்களுக்கு ${pendingReminders.length} மாத்திரை / ஆரோக்கிய நினைவூட்டல்கள் உள்ளன.`
                  : `You have ${pendingReminders.length} upcoming medication/health tasks scheduled today.`}
              </span>
            </div>
            <Link to="/reminders" className="font-bold text-teal-300 hover:underline flex-shrink-0">
              {lang === "ta" ? "நினைவூட்டல்களைக் காண்க →" : "View Schedule →"}
            </Link>
          </div>
        )}

        {/* Tier 4: Profile Completeness Banner */}
        {profilePct < 100 && (
          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>
                {lang === "ta"
                  ? `சுயவிவரம் ${profilePct}% நிறைவடைந்துள்ளது. இரத்த பரிசோதனை முடிவுகளைச் சேர்ப்பது துல்லியத்தை அதிகரிக்கும்.`
                  : `Health Profile is ${profilePct}% complete. Adding recent tests helps make AI recommendations more accurate.`}
              </span>
            </div>
            <Link to="/profile" className="font-bold text-teal-400 hover:underline flex-shrink-0">
              {lang === "ta" ? "சுயவிவரம் பூர்த்தி செய் →" : "Complete Profile →"}
            </Link>
          </div>
        )}
      </div>

      {/* Two Essential Interactive Modules: Human Body Visualizer + Today's Health Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Human Body Health Visualizer (7 cols) */}
        <div className="lg:col-span-7">
          <BodyHealthVisualizer
            profile={profile}
            latestPred={latestPred}
            lifestyle={lifestyle}
          />
        </div>

        {/* Today's Health Plan Daily Checklist (5 cols) */}
        <div className="lg:col-span-5">
          <TodayHealthPlan />
        </div>
      </div>

      {/* Current Heart Health Status & Patient Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Heart Risk Card */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/70 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {lang === "ta" ? "தற்போதைய இதய நிலை" : "Current Heart Health Status"}
              </span>
              <h2 className="text-base font-bold text-white mt-0.5">
                {hasPrediction
                  ? (lang === "ta" ? "10 ஆண்டு மதிப்பிடப்பட்ட இதய அபாயம்" : "10-Year Estimated Cardiovascular Risk")
                  : (lang === "ta" ? "இதய அபாய மதிப்பீடு செய்யப்படவில்லை" : "No Heart Risk Estimated Yet")}
              </h2>
            </div>
            {hasPrediction && (
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  riskCategory === "HIGH"
                    ? "bg-rose-950 text-rose-300 border border-rose-500/40"
                    : riskCategory === "MODERATE"
                    ? "bg-amber-950 text-amber-300 border border-amber-500/40"
                    : "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                }`}
              >
                {riskCategory} {lang === "ta" ? "அபாயம்" : "Risk"}
              </span>
            )}
          </div>

          {hasPrediction ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="flex flex-col items-center justify-center">
                <RiskGauge value={riskPct} category={riskCategory} size={210} />
                <div className="mt-1 text-center">
                  <span className="text-2xl font-bold text-white tracking-tight">{riskPct.toFixed(1)}%</span>
                  <p className="text-[11px] text-slate-400">
                    {lang === "ta" ? "10 ஆண்டு வாய்ப்பு மதிப்பீடு" : "10-year probability estimate"}
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <strong className="text-white block">
                    {lang === "ta" ? "இதன் பொருள் என்ன?" : "What does this mean?"}
                  </strong>
                  <p className="leading-relaxed text-slate-300">
                    {riskCategory === "LOW"
                      ? (lang === "ta"
                          ? "உங்கள் உடல் அளவீடுகள் சாதகமான இதய நலனைக் காட்டுகின்றன. தொடர்ச்சியான நடைப்பயிற்சி மற்றும் சீரான உணவைத் தொடரவும்."
                          : "Your biomarkers indicate favorable cardiovascular health. Continue with regular walks and balanced Indian nutrition.")
                      : riskCategory === "MODERATE"
                      ? (lang === "ta"
                          ? "நடுத்தர அபாயம் என்பது இரத்த அழுத்தத்தை குறைக்க, எண்ணெயை கட்டுப்படுத்த மற்றும் உடற்பயிற்சியை அதிகரிக்க வாய்ப்புள்ளது என்பதைக் குறிக்கிறது."
                          : "Moderate risk indicates opportunities to lower blood pressure, reduce refined oils, and boost aerobic exercise.")
                      : (lang === "ta"
                          ? "அதிகரித்த அபாயம் என்பது இரத்த அழுத்தம் அல்லது கொலஸ்ட்ரால் ஆகியவற்றில் மருத்துவர் ஆலோசனையும் உணவு கட்டுப்பாடும் தேவை என்பதைக் குறிக்கிறது."
                          : "Higher risk indicates that specific clinical factors (like BP or cholesterol) warrant focused lifestyle modifications and medical review.")}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    to="/prediction-result"
                    className="flex-1 text-center py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    {lang === "ta" ? "முடிவு விவரங்கள்" : "View Result Details"}
                  </Link>
                  <Link
                    to="/explainability"
                    className="flex-1 text-center py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    {lang === "ta" ? "காரணங்கள் என்ன?" : "Why this result?"}
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center mx-auto">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">
                {lang === "ta" ? "உங்கள் முதல் இதய பரிசோதனையைத் தொடங்குங்கள்" : "Take your first Heart Risk Assessment"}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {lang === "ta"
                  ? "இரத்த அழுத்தம், நடைப்பயிற்சி மற்றும் சோதனைகள் பற்றிய எளிய கேள்விகளுக்குப் பதிலளித்து உங்கள் இதய அபாய சதவீதத்தை அறியவும்."
                  : "Answer simple health questions about your blood pressure, activity, and tests to see your personalized 10-year heart risk estimate."}
              </p>
              <Link
                to="/risk-assessment"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-950/50 mt-2"
              >
                <span>{lang === "ta" ? "மதிப்பீட்டைத் தொடங்கு" : "Start 2-Minute Assessment"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Profile Snapshot Card */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {lang === "ta" ? "உடல் நிலை சுருக்கம்" : "Health Profile Snapshot"}
              </span>
              <span className="text-xs font-bold text-teal-400">{profilePct}% Complete</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-4">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${profilePct}%` }}
              />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50">
                <span className="text-slate-400">{lang === "ta" ? "வயது & பாலினம்:" : "Age & Sex:"}</span>
                <span className="font-semibold text-white">
                  {profile?.age || 48} yrs • {profile?.sex === "male" ? (lang === "ta" ? "ஆண்" : "Male") : (lang === "ta" ? "பெண்" : "Female")}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50">
                <span className="text-slate-400">{lang === "ta" ? "இரத்த அழுத்தம்:" : "Blood Pressure:"}</span>
                <span className={`font-semibold ${isHighBp ? "text-amber-400" : "text-white"}`}>
                  {profile?.systolic_bp || 120} / {profile?.diastolic_bp || 80} mmHg
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50">
                <span className="text-slate-400">{lang === "ta" ? "உடல் நிறை குறியீடு (BMI):" : "Body Mass Index:"}</span>
                <span className="font-semibold text-white">{profile?.bmi || 24.2} kg/m²</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50">
                <span className="text-slate-400">{lang === "ta" ? "வாழ்வியல் மதிப்பெண்:" : "Lifestyle Score:"}</span>
                <span className="font-bold text-emerald-400">{lifeScore} / 100</span>
              </div>
            </div>
          </div>

          <Link
            to="/profile"
            className="mt-4 w-full text-center py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>{lang === "ta" ? "சுயவிவரத்தை புதுப்பிக்கவும்" : "Update Health Profile"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 6 Large User-Friendly Quick Action Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>{lang === "ta" ? "முக்கிய சேவைகள்" : "Essential Health Actions"}</span>
          </h2>
          <span className="text-xs text-slate-500">
            {lang === "ta" ? "விரைவு பயன்பாட்டு கருவிகள்" : "Quick access tools"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Check Risk */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-rose-500/40 bg-slate-900/80 transition-all flex flex-col justify-between group">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <Heart className="w-5 h-5 fill-rose-500/30" />
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-rose-300 transition-colors">
                1. {t("nav_risk_assessment")}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "ta"
                  ? "சில கேள்விகளுக்கு விடையளித்து உங்கள் இதய அபாய சதவீதத்தைக் கணக்கிடுங்கள்."
                  : "Answer a few health questions and see your estimated cardiovascular risk score."}
              </p>
            </div>
            <Link
              to="/risk-assessment"
              className="mt-4 inline-flex items-center justify-between w-full py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all"
            >
              <span>{lang === "ta" ? "தொடங்கு" : "Start Assessment"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: ECG Monitor */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-teal-500/40 bg-slate-900/80 transition-all flex flex-col justify-between group">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-teal-300 transition-colors">
                2. {t("nav_ecg")}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "ta"
                  ? "ECG தாளின் புகைப்படத்தைப் பதிவேற்றி அலைவடிவத் தரம் மற்றும் சீரான தன்மையை சோதிக்கவும்."
                  : "Upload a photo of an ECG paper strip for software waveform inspection and rhythm checks."}
              </p>
            </div>
            <Link
              to="/ecg"
              className="mt-4 inline-flex items-center justify-between w-full py-2 px-3 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 text-teal-300 text-xs font-bold transition-all"
            >
              <span>{lang === "ta" ? "ECG பதிவேற்று" : "Upload ECG Strip"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: Smart Meal Suggestions */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/40 bg-slate-900/80 transition-all flex flex-col justify-between group">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <ChefHat className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-emerald-300 transition-colors">
                3. {t("nav_meal_suggest")}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "ta"
                  ? "உங்கள் சமையலறை பொருட்களைக் கொண்டு இதயத்திற்கு உகந்த தமிழ் உணவுகளைக் கண்டறியவும்."
                  : "Find heart-healthy South Indian dishes using ingredients you already have at home."}
              </p>
            </div>
            <Link
              to="/meal-suggest"
              className="mt-4 inline-flex items-center justify-between w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all"
            >
              <span>{lang === "ta" ? "உணவுகளைத் தேடு" : "Get Recipes"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4: Medication & Reminders */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-indigo-500/40 bg-slate-900/80 transition-all flex flex-col justify-between group">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <Pill className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors">
                4. {t("nav_reminders")}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "ta"
                  ? "மாத்திரைகள், தண்ணீர் அருந்துதல் மற்றும் நடைப்பயிற்சிக்கான தினசரி அலாரங்கள்."
                  : "Never miss your daily prescribed heart medications, BP checks, or daily walks."}
              </p>
            </div>
            <Link
              to="/reminders"
              className="mt-4 inline-flex items-center justify-between w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all"
            >
              <span>{lang === "ta" ? "நினைவூட்டல்கள்" : "Open Reminders"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 5: Safe Exercise */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-amber-500/40 bg-slate-900/80 transition-all flex flex-col justify-between group">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Footprints className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-amber-300 transition-colors">
                5. {t("nav_exercise")}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "ta"
                  ? "உங்கள் இரத்த அழுத்தத்திற்கு பாதுகாப்பான எளிய நடைப்பயிற்சி மற்றும் பயிற்சிகள்."
                  : "Safe physical activity recommendations calibrated for your heart and blood pressure."}
              </p>
            </div>
            <Link
              to="/exercise"
              className="mt-4 inline-flex items-center justify-between w-full py-2 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all"
            >
              <span>{lang === "ta" ? "பயிற்சித் திட்டம்" : "View Activity Plan"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 6: Emergency Help */}
          <div className="glass-card rounded-2xl p-5 border border-rose-500/40 hover:border-rose-400 bg-rose-950/20 transition-all flex flex-col justify-between group">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-950/50">
                <PhoneCall className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="font-bold text-base text-rose-300 group-hover:text-white transition-colors">
                6. {t("nav_emergency")}
              </h3>
              <p className="text-xs text-rose-200/80 leading-relaxed">
                {lang === "ta"
                  ? "நெஞ்சு வலி போன்ற தீவிர அறிகுறிகள் குறித்த தகவல் மற்றும் உடனடி அவசர அழைப்பு."
                  : "Immediate check for sudden acute symptoms with one-tap emergency call assistance."}
              </p>
            </div>
            <Link
              to="/emergency"
              className="mt-4 inline-flex items-center justify-between w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md"
            >
              <span>{lang === "ta" ? "அவசர சோதனை" : "Emergency Check"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Central Navigation Hub: All Health Tools Directory */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white tracking-tight">
            {lang === "ta" ? "அனைத்து நலக் கருவிகள்" : "All Health Tools & Features"}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === "ta"
              ? "உங்கள் இதய உதவியாளரின் அனைத்துப் பிரிவுகளையும் இங்கிருந்து நேரடியாக அணுகலாம்."
              : "Access every module in your Heart Health Assistant from one place."}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          <Link
            to="/risk-assessment"
            className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-teal-500/40 text-slate-200 transition-all flex items-center gap-2.5"
          >
            <Activity className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <span className="font-semibold truncate">{t("nav_risk_assessment")}</span>
          </Link>

          <Link
            to="/ecg"
            className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-teal-500/40 text-slate-200 transition-all flex items-center gap-2.5"
          >
            <Activity className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <span className="font-semibold truncate">{t("nav_ecg")}</span>
          </Link>

          <Link
            to="/meal-suggest"
            className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 text-slate-200 transition-all flex items-center gap-2.5"
          >
            <ChefHat className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold truncate">{t("nav_meal_suggest")}</span>
          </Link>

          <Link
            to="/diet"
            className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 text-slate-200 transition-all flex items-center gap-2.5"
          >
            <Utensils className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold truncate">{t("nav_diet")}</span>
          </Link>

          <Link
            to="/explainability"
            className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 text-slate-200 transition-all flex items-center gap-2.5"
          >
            <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="font-semibold truncate">{t("nav_explainability")}</span>
          </Link>

          <Link
            to="/what-if"
            className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/40 text-slate-200 transition-all flex items-center gap-2.5"
          >
            <Sliders className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="font-semibold truncate">{t("nav_what_if")}</span>
          </Link>

          <Link
            to="/lifestyle"
            className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-orange-500/40 text-slate-200 transition-all flex items-center gap-2.5"
          >
            <Flame className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <span className="font-semibold truncate">{t("nav_lifestyle")}</span>
          </Link>

          <Link
            to="/reminders"
            className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 text-slate-200 transition-all flex items-center gap-2.5"
          >
            <Pill className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="font-semibold truncate">{t("nav_reminders")}</span>
          </Link>
        </div>
      </div>

      {/* Secondary Research & Model Insights Accordion */}
      <details className="glass-card rounded-2xl p-4 border border-slate-800/80 text-xs text-slate-400 group">
        <summary className="font-semibold text-slate-300 cursor-pointer flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span>{lang === "ta" ? "ஆராய்ச்சி மற்றும் மாதிரி விவரங்கள் (மருத்துவர்கள் & உருவாக்குநர்களுக்கு)" : "Research & Model Insights (For Physicians & Developers)"}</span>
          </span>
          <span className="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="pt-3 mt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400">
          <div>
            <strong className="text-slate-300 block mb-1">
              {lang === "ta" ? "மாதிரி கட்டமைப்பு & அளவுத்திருத்தம்" : "Ensemble Architecture & Calibration"}
            </strong>
            <p>
              Dual-model consensus: CatBoost + XGBoost + LightGBM weighted average with Platt Scaling calibration.
            </p>
          </div>
          <div>
            <strong className="text-slate-300 block mb-1">
              {lang === "ta" ? "விளக்கக் கோட்பாடு" : "Explainability Pipeline"}
            </strong>
            <p>
              Exact TreeSHAP attribution with 95% confidence uncertainty intervals.
            </p>
          </div>
        </div>
      </details>
    </div>
  )
}

export default Dashboard