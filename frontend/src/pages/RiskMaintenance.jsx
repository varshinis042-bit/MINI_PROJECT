import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  ShieldCheck,
  Activity,
  Droplet,
  Flame,
  Scale,
  Footprints,
  Utensils,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Info,
  Heart,
  Save,
  RotateCcw
} from "lucide-react"
import api from "../services/api"
import { useLanguage } from "../context/LanguageContext"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

export const RiskMaintenance = () => {
  const { lang, t } = useLanguage()
  const isTa = lang === "ta"

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState("")
  const [profile, setProfile] = useState(null)
  const [latestPred, setLatestPred] = useState(null)
  const [progressHistory, setProgressHistory] = useState([])

  // Measurement input fields
  const [measurements, setMeasurements] = useState({
    systolic_bp: 130,
    diastolic_bp: 84,
    cholesterol: 200,
    blood_glucose: 100,
    weight_kg: 75,
    resting_hr: 72
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [profRes, predRes, progRes] = await Promise.allSettled([
        api.get("/profile"),
        api.get("/predict/history"),
        api.get("/progress")
      ])

      if (profRes.status === "fulfilled" && profRes.value.data) {
        const p = profRes.value.data
        setProfile(p)
        setMeasurements({
          systolic_bp: p.systolic_bp || 130,
          diastolic_bp: p.diastolic_bp || 84,
          cholesterol: p.cholesterol || 200,
          blood_glucose: p.blood_glucose || 100,
          weight_kg: p.weight_kg || 75,
          resting_hr: p.resting_hr || 72
        })
      }

      if (predRes.status === "fulfilled" && predRes.value.data.length > 0) {
        setLatestPred(predRes.value.data[0])
      }

      if (progRes.status === "fulfilled" && progRes.value.data) {
        setProgressHistory(progRes.value.data)
      }
    } catch (err) {
      console.error("Failed to load risk maintenance data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setMeasurements((prev) => ({
      ...prev,
      [field]: Number(value) || 0
    }))
  }

  const handleRecordMeasurements = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess("")

    try {
      // 1. Record progress check-in
      const checkinPayload = {
        systolic_bp: measurements.systolic_bp,
        diastolic_bp: measurements.diastolic_bp,
        cholesterol: measurements.cholesterol,
        blood_glucose: measurements.blood_glucose,
        weight_kg: measurements.weight_kg,
        resting_hr: measurements.resting_hr,
        risk_percentage: latestPred ? latestPred.risk_percentage : 45.0,
        lifestyle_score: 75,
        created_at: new Date().toISOString()
      }
      await api.post("/progress", checkinPayload)

      // 2. Also update patient profile baseline if available
      if (profile) {
        const updatedProfile = {
          ...profile,
          systolic_bp: measurements.systolic_bp,
          diastolic_bp: measurements.diastolic_bp,
          cholesterol: measurements.cholesterol,
          blood_glucose: measurements.blood_glucose,
          weight_kg: measurements.weight_kg,
          resting_hr: measurements.resting_hr
        }
        await api.put("/profile", updatedProfile)
      }

      setSaveSuccess(
        isTa
          ? "அளவீடுகள் வெற்றிகரமாக பதிவு செய்யப்பட்டு முன்னேற்றப் பட்டியலில் சேர்க்கப்பட்டன!"
          : "Measurements successfully recorded and added to your progress timeline!"
      )

      // Refresh progress history
      const progRes = await api.get("/progress")
      if (progRes.data) setProgressHistory(progRes.data)

      setTimeout(() => setSaveSuccess(""), 4500)
    } catch (err) {
      console.error("Failed to save measurements:", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">
          {isTa ? "பராமரிப்பு விவரங்கள் ஏற்றப்படுகின்றன..." : "Loading risk factor maintenance guide..."}
        </p>
      </div>
    )
  }

  const isHighRisk = latestPred?.risk_category === "HIGH"
  const recentRecords = progressHistory.slice(-5).reverse()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 bg-teal-950 border border-teal-500/30 px-2.5 py-0.5 rounded-full font-bold">
            {isTa ? "இதய நல பராமரிப்பு" : "Health Management & Monitoring"}
          </span>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs text-slate-400">
            {isTa ? "ஆரோக்கிய கண்காணிப்பு வழிகாட்டி" : "Risk Factor Maintenance"}
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-teal-400" />
          <span>
            {isTa ? "இதய அபாய காரணிகள் பராமரிப்பு & கண்காணிப்பு" : "Risk Factor Maintenance & Monitoring"}
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
          {isTa
            ? "உயர்ந்த இதய அபாய முடிவுகள் என்பது ஒரு எச்சரிக்கையே அன்றி இறுதி நோய் கண்டறிதல் அல்ல. தொடர் கண்காணிப்பு மற்றும் வாழ்க்கை முறை மாற்றங்களால் உங்கள் அளவீடுகளை சீராக்க முடியும்."
            : "Practical guidance to regularly monitor, record, and maintain your cardiovascular biomarkers and daily habits over time."}
        </p>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Context Banner: High Risk Guidance */}
      {isHighRisk ? (
        <div className="glass-card rounded-3xl p-5 border border-rose-500/40 bg-rose-950/20 space-y-2">
          <div className="flex items-start gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-500 mt-1 flex-shrink-0 animate-pulse"></span>
            <div>
              <h2 className="text-sm font-bold text-rose-200">
                {isTa ? "உயர் அபாய நிலை மேலாண்மை வழிகாட்டல்:" : "Proactive High-Risk Management Guidance"}
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {isTa
                  ? "உங்கள் சமீபத்திய கணக்கீட்டில் மதிப்பிடப்பட்ட அபாய சதவீதம் உயர்ந்துள்ளது. இது ஒரே இரவில் ஏற்படும் மாற்றமல்ல; உங்கள் இரத்த அழுத்தம், கொலஸ்ட்ரால், சர்க்கரை மற்றும் உணவை முறைப்படுத்துவதன் மூலம் இதய சுமையை கணிசமாகக் குறைக்க முடியும். மருத்துவ ஆலோசனையுடன் இந்த பராமரிப்பு முறைகளைப் பின்பற்றவும்."
                  : "An elevated risk estimate highlights modifiable markers where consistent daily maintenance and physician consultation can make a substantial impact. Focus on steady, verifiable improvements across blood pressure, lipids, and dietary sodium."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <Link
              to="/what-if"
              className="font-semibold text-teal-300 hover:text-white flex items-center gap-1 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-teal-500/30 transition-colors"
            >
              <span>{isTa ? "மாற்றங்களின் பலனை சோதிக்க (What-If) →" : "Simulate Improvements in What-If →"}</span>
            </Link>
            <Link
              to="/diet"
              className="font-semibold text-emerald-300 hover:text-white flex items-center gap-1 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition-colors"
            >
              <span>{isTa ? "இதய நல உணவு முறை →" : "Heart-Healthy Indian Diet →"}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-4 border border-teal-500/30 bg-teal-950/20 flex items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <Heart className="w-5 h-5 text-teal-400 flex-shrink-0" />
            <span>
              {isTa
                ? "தொடர்ச்சியான சுய கண்காணிப்பு ஆரோக்கியமான அளவீடுகளை நிலைநிறுத்த உதவுகிறது."
                : "Active preventive monitoring helps keep your biomarkers stable and prevents progressive vascular strain."}
            </span>
          </div>
          <Link to="/risk-assessment" className="font-semibold text-teal-300 hover:underline flex-shrink-0">
            {isTa ? "புதிய மதிப்பீடு →" : "Check Risk Again →"}
          </Link>
        </div>
      )}

      {/* 6 Key Areas to Regularly Monitor and Maintain */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" />
            <span>{isTa ? "வழக்கமாக கண்காணிக்க வேண்டிய 6 முக்கிய அம்சங்கள்" : "6 Key Areas to Monitor & Maintain"}</span>
          </h2>
          <span className="text-[11px] text-slate-400">
            {isTa ? "பராமரிப்பு வழிகாட்டிகள்" : "Lifestyle Management"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Blood Pressure Tracking */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>{isTa ? "1. இரத்த அழுத்த கண்காணிப்பு" : "1. Blood Pressure Tracking"}</span>
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                {isTa ? "இலக்கு: < 130/80 mmHg" : "Target: < 130/80 mmHg"}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isTa
                ? "அமைதியாக 5 நிமிடங்கள் அமர்ந்த பின் அளவீடு எடுக்கவும். புகைப்பிடித்தல் அல்லது காபி அருந்திய உடனேயே எடுக்க வேண்டாம். காலை மற்றும் மாலை இரண்டு வேளைகளிலும் அளவீடு செய்வது துல்லியமான சராசரியைத் தரும்."
                : "Sit quietly for 5 minutes before recording. Measure both morning and evening. Avoid caffeine, tobacco, or exercise 30 minutes prior. Consistent readings $<130/80\\text{ mmHg}$ reduce mechanical arterial stress."}
            </p>
            <div className="text-[11px] text-teal-300 flex items-center gap-1.5 pt-1 border-t border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>{isTa ? "உணவில் உப்பை குறைப்பது BP-யை சீராக்கும்" : "Limiting dietary sodium directly lowers systolic resistance"}</span>
            </div>
          </div>

          {/* 2. Cholesterol Tracking */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-rose-400" />
                <span>{isTa ? "2. கொலஸ்ட்ரால் பரிசோதனை" : "2. Cholesterol Tracking"}</span>
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                {isTa ? "இலக்கு: < 200 mg/dL" : "Target: < 200 mg/dL"}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isTa
                ? "மொத்த கொலஸ்ட்ரால் 200 mg/dL-க்கு குறைவாகவும், LDL கொழுப்பை குறைவாகவும் பராமரிக்கவும். 3 முதல் 6 மாதங்களுக்கு ஒருமுறை மருத்துவ ஆய்வகத்தில் லிப்பிட் பரிசோதனை (Lipid Profile) செய்து பார்க்கவும்."
                : "Target total cholesterol $<200\\text{ mg/dL}$ with low LDL and healthy HDL. Schedule a standard fasting lipid profile every 3–6 months. Insoluble and soluble fibers naturally clear circulating bile acids."}
            </p>
            <div className="text-[11px] text-teal-300 flex items-center gap-1.5 pt-1 border-t border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>{isTa ? "பாசிப்பருப்பு, ஓட்ஸ் மற்றும் கொண்டைக்கடலை உதவும்" : "Moong dal, oats, and chickpeas bind excess cholesterol"}</span>
            </div>
          </div>

          {/* 3. Blood Glucose Tracking */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-cyan-400" />
                <span>{isTa ? "3. இரத்த சர்க்கரை மேலாண்மை" : "3. Blood Glucose Tracking"}</span>
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                {isTa ? "இலக்கு: < 100 mg/dL (உணவுக்கு முன்)" : "Target: < 100 mg/dL (Fasting)"}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isTa
                ? "காலை வெறும் வயிற்று சர்க்கரை 100 mg/dL-க்கு கீழ் இருக்க வேண்டும். தீட்டிய வெள்ளை அரிசிக்கு பதிலாக கைக்குத்தல் அரிசி, ராகி மற்றும் கம்பு போன்ற சிறுதானியங்களை பயன்படுத்தவும்."
                : "Maintain fasting glucose $<100\\text{ mg/dL}$ and monitor HbA1c periodically. Chronic high glucose damages coronary microvasculature. Swap refined white rice for finger millet (Ragi) or brown rice."}
            </p>
            <div className="text-[11px] text-teal-300 flex items-center gap-1.5 pt-1 border-t border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>{isTa ? "சிறுதானியங்கள் சர்க்கரை உயர்வை தடுக்கும்" : "Millets provide low-GI sustained energy release"}</span>
            </div>
          </div>

          {/* 4. Physical Activity Monitoring */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-emerald-400" />
                <span>{isTa ? "4. வழக்கமான நடை & உடற்பயிற்சி" : "4. Physical Activity Routine"}</span>
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                {isTa ? "இலக்கு: 150 நிமிடம் / வாரம்" : "Target: 150 mins / week"}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isTa
                ? "வாரத்திற்கு 150 நிமிடங்கள் மிதமான நடைப்பயிற்சி (தினமும் 20-30 நிமிடம்) மேற்கொள்ளவும். இரத்த அழுத்தம் அதிகமாக இருக்கும் போது கடினமான எடையை தூக்குவதைத் தவிர்க்கவும்."
                : "Aim for 150 minutes of weekly moderate aerobic walking (20–30 mins/day at conversational pace). If blood pressure is severely elevated, avoid heavy lifting or straining and consult your physician first."}
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">{isTa ? "அனுலோம் விலோம், சாந்த ஆசனங்கள்" : "Anulom Vilom & gentle pacing"}</span>
              <Link to="/exercise" className="text-teal-300 font-semibold hover:underline">
                {isTa ? "உடற்பயிற்சி வழிகாட்டல் →" : "Exercise Plan →"}
              </Link>
            </div>
          </div>

          {/* 5. Healthy Diet Habits */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-indigo-400" />
                <span>{isTa ? "5. ஆரோக்கியமான உணவுப் பழக்கங்கள்" : "5. Healthy Diet Habits"}</span>
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                {isTa ? "சோடியம்: < 2,000 mg/நாள்" : "Sodium: < 2,000 mg/day"}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isTa
                ? "ஊறுகாய், அப்பளம் மற்றும் வறுத்த உணவுகளை தவிர்க்கவும். உணவில் உப்பை அரை ஸ்பூன் அளவிற்குள் கட்டுப்படுத்தவும். மதிய உணவில் தயிர் மற்றும் காய்கறி சாலட் சேர்த்துக் கொள்ளவும்."
                : "Limit sodium intake below 2,000 mg/day (DASH principle). Minimize papads, pickles (achaar), and bakery fats. Rotate cold-pressed plant oils and incorporate roasted makhana instead of fried snacks."}
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">{isTa ? "மோர், பூண்டு, காய்கறி கூட்டுகள்" : "Curd, garlic, vegetable sabzi"}</span>
              <Link to="/diet" className="text-teal-300 font-semibold hover:underline">
                {isTa ? "உணவுத் திட்டம் காண்க →" : "View Diet Plan →"}
              </Link>
            </div>
          </div>

          {/* 6. Regular Health Check-ups */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-teal-400" />
                <span>{isTa ? "6. வழக்கமான மருத்துவ பரிசோதனை" : "6. Regular Health Check-ups"}</span>
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                {isTa ? "தவறாமல் மாத்திரை உட்கொள்ளுதல்" : "Medication Adherence"}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isTa
                ? "மருத்துவர் பரிந்துரைத்த மாத்திரைகளை (BP, கொலஸ்ட்ரால்) குறித்த நேரத்தில் உட்கொள்ளவும். சுயமாக மாத்திரைகளை நிறுத்தவோ குறைக்கவோ கூடாது. உங்கள் வீட்டில் உள்ள BP கருவியின் துல்லியத்தை சரிபார்க்கவும்."
                : "Take all doctor-prescribed medications as directed without self-adjusting doses. Schedule regular clinical check-ups with your cardiologist or primary care physician to verify home readings."}
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">{isTa ? "நினைவூட்டல் அட்டவணை" : "Routine Reminders"}</span>
              <Link to="/reminders" className="text-teal-300 font-semibold hover:underline">
                {isTa ? "நினைவூட்டல்கள் →" : "Set Reminders →"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Measurement Tracking & Recording Form */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-5">
        <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Save className="w-5 h-5 text-teal-400" />
              <span>{isTa ? "உங்கள் அளவீடுகளை பதிவு செய்க / புதுப்பிக்கவும்" : "Record / Update Your Current Measurements"}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isTa
                ? "இன்றைய அளவீடுகளைப் பதிவு செய்து உங்கள் முன்னேற்றப் பாதையைக் கண்காணிக்கவும்."
                : "Log your recent measurements to update your health baseline and record a progress check-in."}
            </p>
          </div>
          <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full self-start sm:self-auto font-mono">
            {new Date().toLocaleDateString(isTa ? "ta-IN" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {saveSuccess && (
          <div className="p-3.5 rounded-2xl bg-teal-950/50 border border-teal-500/40 text-xs text-teal-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        <form onSubmit={handleRecordMeasurements} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Systolic BP */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isTa ? "சிஸ்டாலிக் BP (Systolic mmHg)" : "Systolic BP (mmHg)"}
              </label>
              <input
                type="number"
                min="80"
                max="240"
                value={measurements.systolic_bp}
                onChange={(e) => handleInputChange("systolic_bp", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">{isTa ? "இயல்பானது: < 120" : "Desirable: < 120"}</span>
            </div>

            {/* Diastolic BP */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isTa ? "டயஸ்டாலிக் BP (Diastolic mmHg)" : "Diastolic BP (mmHg)"}
              </label>
              <input
                type="number"
                min="50"
                max="140"
                value={measurements.diastolic_bp}
                onChange={(e) => handleInputChange("diastolic_bp", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">{isTa ? "இயல்பானது: < 80" : "Desirable: < 80"}</span>
            </div>

            {/* Cholesterol */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isTa ? "மொத்த கொலஸ்ட்ரால் (Total Chol mg/dL)" : "Total Cholesterol (mg/dL)"}
              </label>
              <input
                type="number"
                min="100"
                max="450"
                value={measurements.cholesterol}
                onChange={(e) => handleInputChange("cholesterol", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">{isTa ? "இயல்பானது: < 200" : "Desirable: < 200"}</span>
            </div>

            {/* Blood Glucose */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isTa ? "இரத்த சர்க்கரை (Glucose mg/dL)" : "Fasting Glucose (mg/dL)"}
              </label>
              <input
                type="number"
                min="60"
                max="350"
                value={measurements.blood_glucose}
                onChange={(e) => handleInputChange("blood_glucose", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">{isTa ? "இயல்பானது: 70 - 99" : "Normal Fasting: 70–99"}</span>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isTa ? "உடல் எடை (Weight kg)" : "Body Weight (kg)"}
              </label>
              <input
                type="number"
                min="35"
                max="200"
                step="0.5"
                value={measurements.weight_kg}
                onChange={(e) => handleInputChange("weight_kg", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">{isTa ? "ஆசிய BMI: 18.5 - 22.9" : "Asian BMI range: 18.5–22.9"}</span>
            </div>

            {/* Resting Heart Rate */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isTa ? "இதயத் துடிப்பு (Resting HR BPM)" : "Resting Heart Rate (BPM)"}
              </label>
              <input
                type="number"
                min="45"
                max="140"
                value={measurements.resting_hr}
                onChange={(e) => handleInputChange("resting_hr", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">{isTa ? "இயல்பானது: 60 - 80" : "Normal Resting: 60–80"}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {isTa ? "அளவீடுகள் உங்கள் சுயவிவரத்திலும் சேமிக்கப்படும்." : "Entries update both your profile and progress trajectory."}
            </span>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-950/40 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isTa ? "சேமிக்கப்படுகிறது..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isTa ? "முன்னேற்றத்தை பதிவு செய்" : "Save & Record Check-In"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Progress Over Time History */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span>{isTa ? "சமீபத்திய கண்காணிப்பு முன்னேற்றம்" : "Recent Monitoring & Progress Check-Ins"}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isTa
                ? "காலப்போக்கில் உங்கள் அளவீடுகள் எவ்வாறு முன்னேறுகின்றன என்பதைக் காணுங்கள்."
                : "Tracking your recorded measurements across clinical check-in dates."}
            </p>
          </div>
          <Link
            to="/progress"
            className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
          >
            <span>{isTa ? "முழு வரைபடம் காண்க →" : "View Full Charts →"}</span>
          </Link>
        </div>

        {recentRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="pb-2">{isTa ? "தேதி" : "Date"}</th>
                  <th className="pb-2">{isTa ? "இரத்த அழுத்தம்" : "Blood Pressure"}</th>
                  <th className="pb-2">{isTa ? "கொலஸ்ட்ரால்" : "Cholesterol"}</th>
                  <th className="pb-2">{isTa ? "சர்க்கரை" : "Blood Glucose"}</th>
                  <th className="pb-2">{isTa ? "எடை" : "Weight"}</th>
                  <th className="pb-2 text-right">{isTa ? "மதிப்பிடப்பட்ட அபாயம்" : "Estimated Risk"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {recentRecords.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2.5 text-slate-300">
                      {rec.created_at ? rec.created_at.substring(0, 10) : rec.date || "Logged"}
                    </td>
                    <td className="py-2.5 text-white font-semibold">
                      {rec.systolic_bp || 130} / {rec.diastolic_bp || 84} <span className="text-[10px] text-slate-400">mmHg</span>
                    </td>
                    <td className="py-2.5 text-slate-300">
                      {rec.cholesterol || 200} <span className="text-[10px] text-slate-400">mg/dL</span>
                    </td>
                    <td className="py-2.5 text-slate-300">
                      {rec.blood_glucose || 100} <span className="text-[10px] text-slate-400">mg/dL</span>
                    </td>
                    <td className="py-2.5 text-slate-300">
                      {rec.weight_kg ? `${rec.weight_kg} kg` : "—"}
                    </td>
                    <td className="py-2.5 text-right font-bold text-teal-400">
                      {rec.risk_percentage ? `${rec.risk_percentage}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            <p>{isTa ? "இன்னும் பதிவுகள் இல்லை. மேலே உள்ள படிவத்தைப் பயன்படுத்தி முதல் அளவீட்டைப் பதிவு செய்க." : "No recorded check-ins yet. Use the form above to record your first measurement checkpoint."}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RiskMaintenance
