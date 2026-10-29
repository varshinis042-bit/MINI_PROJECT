import React, { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import {
  Activity,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  PhoneCall,
  Clock,
  Sparkles,
  FileImage,
  RefreshCw,
  Info,
  Heart,
  Droplets,
  Layers
} from "lucide-react"
import api from "../services/api"
import { useLanguage } from "../context/LanguageContext"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

export const EcgMonitor = () => {
  const { language, t } = useLanguage()
  const isTa = language === "ta"
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [analysisResult, setAnalysisResult] = useState(null)
  const [recentScans, setRecentScans] = useState([])
  const [profile, setProfile] = useState(null)
  const [latestPred, setLatestPred] = useState(null)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [histRes, profRes, predRes] = await Promise.allSettled([
        api.get("/ecg/history"),
        api.get("/profile"),
        api.get("/predict/history")
      ])

      if (histRes.status === "fulfilled" && histRes.value.data.length > 0) {
        setRecentScans(histRes.value.data)
        setAnalysisResult(histRes.value.data[0])
      }
      if (profRes.status === "fulfilled") setProfile(profRes.value.data)
      if (predRes.status === "fulfilled" && predRes.value.data.length > 0) {
        setLatestPred(predRes.value.data[0])
      }
    } catch (err) {
      console.error("ECG load error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setErrorMsg(isTa ? "தயவுசெய்து சரியான படக் கோப்பை (PNG, JPG, JPEG) தேர்ந்தெடுக்கவும்." : "Please select a valid image file (PNG, JPG, JPEG).")
      return
    }

    setErrorMsg("")
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile && !previewUrl) {
      setErrorMsg(isTa ? "முதலில் ஒரு ECG படத்தை பதிவேற்றவும்." : "Please select an ECG image first.")
      return
    }

    setAnalyzing(true)
    setErrorMsg("")
    try {
      const payload = {
        image_base64: previewUrl,
        filename: selectedFile?.name || "ecg_trace.png"
      }
      const res = await api.post("/ecg/upload", payload)
      setAnalysisResult(res.data)
      setRecentScans((prev) => [res.data, ...prev.filter((r) => r.id !== res.data.id)])
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || (isTa ? "ECG பகுப்பாய்வு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்." : "ECG analysis failed. Please try again with a clear image."))
    } finally {
      setAnalyzing(false)
    }
  }

  // Load sample synthetic demo ECG
  const handleLoadDemo = () => {
    // Generate a simple waveform image using HTML Canvas
    const canvas = document.createElement("canvas")
    canvas.width = 600
    canvas.height = 200
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, 600, 200)

    // Draw pink ECG grid
    ctx.strokeStyle = "#ffe4e6"
    ctx.lineWidth = 0.5
    for (let x = 0; x < 600; x += 15) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 200)
      ctx.stroke()
    }
    for (let y = 0; y < 200; y += 15) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(600, y)
      ctx.stroke()
    }

    // Draw ECG Lead II waveform
    ctx.strokeStyle = "#0f172a"
    ctx.lineWidth = 2.5
    ctx.beginPath()
    let x = 20
    const baseY = 100
    ctx.moveTo(0, baseY)

    while (x < 580) {
      ctx.lineTo(x + 20, baseY) // isoelectric
      ctx.lineTo(x + 30, baseY - 8) // P wave
      ctx.lineTo(x + 40, baseY)
      ctx.lineTo(x + 50, baseY) // PR segment
      ctx.lineTo(x + 55, baseY + 6) // Q wave
      ctx.lineTo(x + 65, baseY - 60) // R peak
      ctx.lineTo(x + 75, baseY + 18) // S wave
      ctx.lineTo(x + 85, baseY) // J point
      ctx.lineTo(x + 105, baseY - 16) // T wave
      ctx.lineTo(x + 125, baseY)
      x += 135
    }
    ctx.lineTo(600, baseY)
    ctx.stroke()

    const dataUrl = canvas.toDataURL("image/png")
    setPreviewUrl(dataUrl)
    setSelectedFile({ name: "demo_ecg_lead2_strip.png" })
    setErrorMsg("")
  }

  const getQualityBadge = (quality) => {
    if (quality === "Good") return { text: isTa ? "சிறந்த தரம்" : "Good Quality", color: "bg-emerald-950 text-emerald-300 border-emerald-500/40" }
    if (quality === "Fair") return { text: isTa ? "மிதமான தரம்" : "Fair Quality", color: "bg-amber-950 text-amber-300 border-amber-500/40" }
    return { text: isTa ? "குறைந்த தரம் / படிக்க இயலவில்லை" : "Poor / Unreadable", color: "bg-rose-950 text-rose-300 border-rose-500/40" }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 bg-rose-950 border border-rose-500/30 px-2.5 py-0.5 rounded-full font-bold">
            {isTa ? "மென்பொருள் ஆய்வு" : "Software Waveform Analysis"}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <Activity className="w-7 h-7 text-rose-500" /> {isTa ? "ECG இதய கண்காணிப்பு" : "ECG Heart Monitoring"}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isTa
              ? "உங்கள் ECG காகிதத் தாள் அல்லது டிஜிட்டல் படத்தை பதிவேற்றி தரம் மற்றும் அலைவரிசை நிலையை அறியவும்."
              : "Upload an ECG paper tracing or monitor photo for software-based image quality and rhythm pattern evaluation."}
          </p>
        </div>

        {/* Emergency Hotline Button */}
        <Link
          to="/emergency"
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950/50 flex items-center gap-1.5 self-start sm:self-auto animate-pulse"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>{isTa ? "அவசர உதவி (112 / 108)" : "Emergency Check (112 / 108)"}</span>
        </Link>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Critical Medical Disclaimer Warning Box */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-amber-300 block font-bold">
            {isTa ? "முக்கிய மருத்துவ பாதுகாப்பு அறிவிப்பு:" : "Important Clinical Notice on ECG Image Analysis:"}
          </strong>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {isTa
              ? "இந்த மென்பொருள் பகுப்பாய்வு ஆராய்ச்சி மற்றும் விழிப்புணர்வுக்கானது மட்டுமே; இது மருத்துவ நோயறிதல் சாதனம் அல்ல. கடுமையான நெஞ்சு வலி, இடது கை அல்லது தாடை வலி, திடீர் மூச்சுத் திணறல் ஏற்பட்டால், உடனடியாக 112 அல்லது 108-ஐ அழைக்கவும்."
              : "This software-based image evaluation is for research, educational, and decision-support purposes only. It is NOT a diagnostic medical device and does not replace hospital 12-lead ECG interpretation. In case of acute cardiac distress, seek emergency medical care immediately."}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-900/80 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white">
              {isTa ? "ECG படத்தை பதிவேற்றவும் (PNG, JPG, JPEG)" : "Upload ECG Image (PNG, JPG, JPEG)"}
            </h2>
            <p className="text-xs text-slate-400">
              {isTa ? "வெளிச்சமான, தெளிவான காகித அலைவரிசை படத்தை தேர்ந்தெடுக்கவும்." : "Ensure the ECG tracing and grid lines are in focus with minimal shadow."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadDemo}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto border border-slate-700"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isTa ? "மாதிரி ECG-ஐ பயன்படுத்து" : "Load Sample Lead II Strip"}</span>
          </button>
        </div>

        {/* Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-3xl p-6 sm:p-10 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950/80 transition-all space-y-3"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/jpg"
            className="hidden"
          />

          {previewUrl ? (
            <div className="space-y-3">
              <div className="max-h-56 overflow-hidden rounded-2xl border border-slate-700 mx-auto max-w-lg bg-black flex items-center justify-center">
                <img src={previewUrl} alt="ECG Preview" className="max-h-56 object-contain w-full" />
              </div>
              <p className="text-xs text-teal-400 font-medium">
                {selectedFile?.name || "ecg_trace.png"} • {isTa ? "மாற்ற மீண்டும் கிளிக் செய்யவும்" : "Click to select a different image"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center mx-auto">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-white">
                {isTa ? "படத்தை இங்கே கிளிக் செய்து பதிவேற்றவும்" : "Click here to choose your ECG image file"}
              </p>
              <p className="text-xs text-slate-500">
                Supports standard photos of hospital printouts, Apple Watch/smartwatch ECG exports, or monitor screenshots.
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={analyzing || !previewUrl}
            onClick={handleUploadAndAnalyze}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-950/40 flex items-center gap-2 disabled:opacity-40"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{isTa ? "ஆய்வு செய்யப்படுகிறது..." : "Analyzing Waveform..."}</span>
              </>
            ) : (
              <>
                <Activity className="w-4 h-4" />
                <span>{isTa ? "ECG-ஐ பகுப்பாய்வு செய்க" : "Analyze ECG Tracing"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Result Card */}
      {analysisResult && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-900/90 shadow-2xl space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isTa ? "பகுப்பாய்வு முடிவு" : "Software Analysis Output"}
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5 flex items-center gap-2">
                {analysisResult.detected_pattern}
              </h2>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${getQualityBadge(analysisResult.quality_assessment).color}`}>
                {getQualityBadge(analysisResult.quality_assessment).text}
              </span>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                Confidence: {Math.round(analysisResult.confidence_score * 100)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                {isTa ? "மதிப்பிடப்பட்ட இதயத் துடிப்பு" : "Estimated Heart Rate"}
              </span>
              <div className="text-2xl font-bold text-white mt-1">
                {analysisResult.estimated_heart_rate ? `${analysisResult.estimated_heart_rate} BPM` : "N/A"}
              </div>
              <span className="text-[10px] text-slate-500">{isTa ? "கணக்கிடப்பட்ட இடைவெளி" : "Peak cadence estimate"}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                {isTa ? "படத் தரம்" : "Image Quality"}
              </span>
              <div className="text-base font-bold text-teal-300 mt-1">{analysisResult.quality_assessment}</div>
              <span className="text-[10px] text-slate-500">{isTa ? "விகிதம் & மாறுபாடு" : "Grid contrast checked"}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                {isTa ? "அலைவரிசை வடிவம்" : "Waveform Pattern"}
              </span>
              <div className="text-base font-bold text-white mt-1">
                {analysisResult.detected_pattern.includes("Normal") ? "Sinus Cadence" : "Irregular / Variable"}
              </div>
              <span className="text-[10px] text-slate-500">{isTa ? "அலைவரிசை சுழற்சி" : "R-wave inspection"}</span>
            </div>
          </div>

          {/* Details & Observations */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs text-slate-300">
            <strong className="text-white block text-sm">
              {isTa ? "விளக்கக் குறிப்புகள்:" : "Detailed Findings:"}
            </strong>
            <p className="leading-relaxed text-slate-300 text-[11px]">
              {analysisResult.pattern_details}
            </p>
            {analysisResult.technical_observations?.length > 0 && (
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                {analysisResult.technical_observations.map((obs, idx) => (
                  <li key={idx}>{obs}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Connection with Cardiovascular Health Section */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-900/70 space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
            {isTa ? "ஆரோக்கிய தொடர்பு" : "Holistic Clinical Context"}
          </span>
          <h2 className="text-base font-bold text-white mt-0.5">
            {isTa ? "இது உங்கள் ஒட்டுமொத்த இதய நலனுடன் எவ்வாறு தொடர்புடையது?" : "How This Relates to Your Cardiovascular Health"}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isTa
              ? "ஒரு தனித்த ECG படம் இதயத்தின் மின்சார சமிக்ஞையை மட்டுமே காட்டுகிறது. உண்மையான இதய நலன் உங்கள் இரத்த அழுத்தம் மற்றும் கொலஸ்ட்ராலுடன் இணைந்தே கணக்கிடப்படுகிறது."
              : "An isolated ECG snapshot only depicts instantaneous cardiac electrical rhythm. True cardiovascular wellness combines rhythm with blood pressure, lipids, and long-term habits."}
          </p>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <strong className="text-teal-300 flex items-center gap-1.5 font-bold">
              <Heart className="w-4 h-4 text-teal-400" /> {isTa ? "10-ஆண்டு இதய அபாய மாதிரி (ML)" : "10-Year Cardiovascular Risk Model (ML)"}
            </strong>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">{isTa ? "கணிக்கப்பட்ட அபாயம்:" : "Estimated Risk:"}</span>
              <strong className="text-white">{latestPred ? `${latestPred.risk_percentage.toFixed(1)}%` : "48.5%"} ({latestPred ? latestPred.risk_category : "MODERATE"})</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{isTa ? "இரத்த அழுத்தம்:" : "Blood Pressure:"}</span>
              <strong className="text-white">{profile?.systolic_bp || 134}/{profile?.diastolic_bp || 86} mmHg</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{isTa ? "கொலஸ்ட்ரால்:" : "Total Cholesterol:"}</span>
              <strong className="text-white">{profile?.cholesterol || 215} mg/dL</strong>
            </div>
            <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              {isTa ? "6-மாதிரி Stacking Ensemble அல்காரிதம் மூலம் கணக்கிடப்பட்டது." : "Trained on 6 base models with Optuna hyperparameter optimization."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <strong className="text-rose-300 flex items-center gap-1.5 font-bold">
              <Activity className="w-4 h-4 text-rose-400" /> {isTa ? "ECG அலைவரிசை ஆய்வு (மென்பொருள்)" : "ECG Waveform Analysis (Software)"}
            </strong>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">{isTa ? "தற்போதைய நிலை:" : "Current Rhythm:"}</span>
              <strong className="text-white">{analysisResult?.detected_pattern || (isTa ? "பரிசோதிக்கப்படவில்லை" : "Not yet tested")}</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{isTa ? "படத் தரம்:" : "Quality Check:"}</span>
              <strong className="text-teal-300">{analysisResult?.quality_assessment || "N/A"}</strong>
            </div>
            <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              {isTa
                ? "கவனிக்கவும்: ECG ஆய்வு ML மாதிரியுடன் நேரடியாக கலக்கப்படாது; இது தனிப்பட்ட காட்சி குறிப்பு மட்டுமே."
                : "Notice: ECG image findings are maintained as a separate clinical indicator and do not alter the tabular ML prediction."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}