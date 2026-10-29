import React, { useState } from "react"
import { Heart, Droplets, Scale, Wind, Brain, CheckCircle2, AlertTriangle, AlertCircle, X, Sparkles } from "lucide-react"
import { useLanguage } from "../context/LanguageContext"

export const BodyHealthVisualizer = ({ profile, latestPrediction, ecgRecord }) => {
  const { language, t } = useLanguage()
  const isTa = language === "ta"
  const [selectedOrgan, setSelectedOrgan] = useState("heart")

  // Fallbacks if profile not yet completed
  const bpSys = profile?.systolic_bp || 134
  const bpDia = profile?.diastolic_bp || 86
  const chol = profile?.cholesterol || 215
  const glucose = profile?.blood_glucose || 105
  const bmi = profile?.bmi || 25.8
  const hr = profile?.resting_hr || 74
  const smoking = profile?.smoking_status || "former"
  const stress = profile?.stress_level || 3
  const sleep = profile?.sleep_duration || 6.8
  const riskPct = latestPrediction?.risk_percentage || 48.5
  const ecgStatus = ecgRecord?.detected_pattern || (isTa ? "பரிசோதிக்கப்படவில்லை" : "Not yet tested")

  // Status evaluators: "green", "yellow", "red"
  const getHeartStatus = () => (riskPct < 20 ? "green" : riskPct < 50 ? "yellow" : "red")
  const getBloodStatus = () => (bpSys >= 140 || chol >= 240 ? "red" : bpSys >= 130 || chol >= 200 ? "yellow" : "green")
  const getBodyStatus = () => (bmi >= 27.5 ? "red" : bmi >= 23.0 ? "yellow" : "green")
  const getLungsStatus = () => (smoking === "current" ? "red" : smoking === "former" ? "yellow" : "green")
  const getMindStatus = () => (stress >= 4 || sleep < 6 ? "red" : stress === 3 || sleep < 7 ? "yellow" : "green")

  const organData = {
    heart: {
      id: "heart",
      name: isTa ? "இதயம் (Heart)" : "Heart & Rhythm",
      icon: Heart,
      status: getHeartStatus(),
      badgeText: getHeartStatus() === "green" ? (isTa ? "நன்று" : "Good") : getHeartStatus() === "yellow" ? (isTa ? "மிதமான அபாயம்" : "Moderate Risk") : (isTa ? "அதிக அபாயம்" : "High Risk"),
      metrics: [
        { label: isTa ? "இதயத் துடிப்பு" : "Heart Rate", val: `${hr} BPM` },
        { label: isTa ? "10-ஆண்டு இதய அபாயம்" : "10-Yr Cardiovascular Risk", val: `${riskPct.toFixed(1)}%` },
        { label: isTa ? "ECG நிலை" : "ECG Status", val: ecgStatus }
      ],
      tip: isTa
        ? "தினமும் 20 நிமிடங்கள் மிதமான நடைப்பயிற்சி மேற்கொள்வதும், உப்பு மற்றும் எண்ணெய் அளவை குறைப்பதும் இதய சுவர்களை பாதுகாக்கும்."
        : "Engage in 20 minutes of brisk walking daily and limit sodium to protect your coronary arterial walls."
    },
    blood: {
      id: "blood",
      name: isTa ? "இரத்த ஓட்டம் & அழுத்தம் (Blood)" : "Blood & Arteries",
      icon: Droplets,
      status: getBloodStatus(),
      badgeText: getBloodStatus() === "green" ? (isTa ? "இயல்பானது" : "Normal") : (isTa ? "கவனம் தேவை" : "Needs Attention"),
      metrics: [
        { label: isTa ? "இரத்த அழுத்தம்" : "Blood Pressure", val: `${bpSys}/${bpDia} mmHg` },
        { label: isTa ? "கொலஸ்ட்ரால்" : "Total Cholesterol", val: `${chol} mg/dL` },
        { label: isTa ? "இரத்த சர்க்கரை" : "Fasting Glucose", val: `${glucose} mg/dL` }
      ],
      tip: isTa
        ? "பூண்டு, வெந்தயம் மற்றும் முழு தானியங்களை உணவில் சேர்த்துக் கொள்வது கொலஸ்ட்ரால் மற்றும் இரத்த அழுத்தத்தை சீராக வைக்க உதவும்."
        : "Incorporate garlic, methi seeds, and millets to naturally support healthy lipid and blood pressure levels."
    },
    body: {
      id: "body",
      name: isTa ? "உடல் நிறை (Body Mass)" : "Body Composition (BMI)",
      icon: Scale,
      status: getBodyStatus(),
      badgeText: getBodyStatus() === "green" ? (isTa ? "சரியான எடை" : "Normal") : (isTa ? "கண்காணிக்கவும்" : "Overweight / Monitor"),
      metrics: [
        { label: isTa ? "உயரம்" : "Height", val: `${profile?.height_cm || 172} cm` },
        { label: isTa ? "எடை" : "Weight", val: `${profile?.weight_kg || 76} kg` },
        { label: isTa ? "BMI குறியீடு" : "Body Mass Index", val: `${bmi} kg/m²` }
      ],
      tip: isTa
        ? "ஆசிய அளவீட்டின்படி BMI 23-க்கு குறைவாக இருப்பது இதய சுமையை பெருமளவு குறைக்கும்."
        : "Maintaining BMI under 23.0 kg/m² (Asian guideline) significantly relieves systemic vascular resistance."
    },
    lungs: {
      id: "lungs",
      name: isTa ? "நுரையீரல் & சுவாசம் (Lungs)" : "Lungs & Tobacco",
      icon: Wind,
      status: getLungsStatus(),
      badgeText: smoking === "never" ? (isTa ? "புகைப்பிடிக்காதவர் (நன்று)" : "Non-Smoker (Good)") : smoking === "former" ? (isTa ? "முன்னாள் புகைப்பவர்" : "Quit Smoking") : (isTa ? "புகைப்பவர் (அபாயம்)" : "Active Smoker"),
      metrics: [
        { label: isTa ? "புகை நிலை" : "Tobacco Status", val: smoking.toUpperCase() },
        { label: isTa ? "ஆக்ஸிஜன் தரம்" : "Arterial Oxygenation", val: smoking === "current" ? "Reduced" : "Preserved" }
      ],
      tip: isTa
        ? "புகையிலை நுகர்வை முற்றிலும் தவிர்ப்பது இரத்த நாளங்கள் சுருங்குவதை தடுத்து மாரடைப்பு அபாயத்தை பாதியாக குறைக்கிறது."
        : "Complete tobacco avoidance prevents endothelial inflammation and cuts premature coronary attack risk in half."
    },
    mind: {
      id: "mind",
      name: isTa ? "மனநலம் & தூக்கம் (Mind & Sleep)" : "Mind & Sleep Health",
      icon: Brain,
      status: getMindStatus(),
      badgeText: getMindStatus() === "green" ? (isTa ? "சீரான ஓய்வு" : "Well Rested") : (isTa ? "மன அழுத்தம் குறைக்கவும்" : "Manage Stress"),
      metrics: [
        { label: isTa ? "தூங்கும் நேரம்" : "Sleep Duration", val: `${sleep} hrs/night` },
        { label: isTa ? "மன அழுத்தம்" : "Stress Level", val: `${stress} / 5` }
      ],
      tip: isTa
        ? "இரவு 7-8 மணி நேர ஆழ்ந்த உறக்கம் இரத்த அழுத்தத்தை இரவில் இயல்பாக குறைத்து இதயத்தை புத்துணர்ச்சியடையச் செய்கிறது."
        : "7 to 8 hours of restorative nightly sleep allows nocturnal blood pressure dipping, crucial for cardiac rest."
    }
  }

  const active = organData[selectedOrgan] || organData.heart
  const Icon = active.icon

  const getPinColor = (status) => {
    if (status === "green") return "bg-emerald-500 shadow-emerald-500/50 text-white"
    if (status === "yellow") return "bg-amber-400 shadow-amber-500/50 text-slate-950"
    return "bg-rose-500 shadow-rose-500/50 text-white"
  }

  return (
    <div className="glass-card rounded-3xl p-5 sm:p-7 border border-slate-800 bg-slate-900/80 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950 border border-teal-500/30 px-2 py-0.5 rounded-full">
              {isTa ? "உடல் வரைபடம்" : "Interactive Health Map"}
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">{t("body_subtitle")}</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" /> {t("body_title")}
          </h2>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 self-start sm:self-auto">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> {isTa ? "நன்று" : "Good"}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> {isTa ? "கவனம்" : "Attention"}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> {isTa ? "அபாயம்" : "High"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SVG Human Figure Column */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-3xl border border-slate-800/80 relative min-h-[340px]">
          <svg viewBox="0 0 200 360" className="w-48 sm:w-56 h-auto drop-shadow-md">
            {/* Head */}
            <circle cx="100" cy="40" r="24" className="fill-slate-800/90 stroke-slate-700" strokeWidth="2" />
            {/* Neck */}
            <rect x="94" y="64" width="12" height="14" className="fill-slate-800 stroke-slate-700" strokeWidth="1.5" />
            {/* Torso */}
            <path
              d="M 65 78 L 135 78 L 126 185 L 74 185 Z"
              className="fill-slate-800/90 stroke-slate-700"
              strokeWidth="2"
            />
            {/* Arms */}
            <path d="M 65 78 L 38 180 L 46 182 L 72 90 Z" className="fill-slate-800/80 stroke-slate-700" strokeWidth="1.5" />
            <path d="M 135 78 L 162 180 L 154 182 L 128 90 Z" className="fill-slate-800/80 stroke-slate-700" strokeWidth="1.5" />
            {/* Legs */}
            <path d="M 76 185 L 70 330 L 88 330 L 96 185 Z" className="fill-slate-800/90 stroke-slate-700" strokeWidth="2" />
            <path d="M 104 185 L 112 330 L 130 330 L 124 185 Z" className="fill-slate-800/90 stroke-slate-700" strokeWidth="2" />
          </svg>

          {/* Clickable Hotspots overlaying the body */}
          {/* Head / Mind Pin */}
          <button
            onClick={() => setSelectedOrgan("mind")}
            className={`absolute top-[38px] left-[50%] -translate-x-1/2 p-2 rounded-full shadow-lg transition-transform hover:scale-125 z-10 flex items-center justify-center ${getPinColor(getMindStatus())} ${selectedOrgan === "mind" ? "ring-4 ring-white" : ""}`}
            title="Mind & Sleep"
          >
            <Brain className="w-3.5 h-3.5" />
          </button>

          {/* Lungs Pin */}
          <button
            onClick={() => setSelectedOrgan("lungs")}
            className={`absolute top-[98px] left-[38%] -translate-x-1/2 p-2 rounded-full shadow-lg transition-transform hover:scale-125 z-10 flex items-center justify-center ${getPinColor(getLungsStatus())} ${selectedOrgan === "lungs" ? "ring-4 ring-white" : ""}`}
            title="Lungs & Respiration"
          >
            <Wind className="w-3.5 h-3.5" />
          </button>

          {/* Heart Pin */}
          <button
            onClick={() => setSelectedOrgan("heart")}
            className={`absolute top-[108px] left-[62%] -translate-x-1/2 p-2.5 rounded-full shadow-lg transition-transform hover:scale-125 z-10 flex items-center justify-center animate-pulse ${getPinColor(getHeartStatus())} ${selectedOrgan === "heart" ? "ring-4 ring-white" : ""}`}
            title="Heart"
          >
            <Heart className="w-4 h-4 fill-current" />
          </button>

          {/* Blood & Arteries Pin */}
          <button
            onClick={() => setSelectedOrgan("blood")}
            className={`absolute top-[145px] left-[50%] -translate-x-1/2 p-2 rounded-full shadow-lg transition-transform hover:scale-125 z-10 flex items-center justify-center ${getPinColor(getBloodStatus())} ${selectedOrgan === "blood" ? "ring-4 ring-white" : ""}`}
            title="Blood Pressure & Lipids"
          >
            <Droplets className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Core Body / BMI Pin */}
          <button
            onClick={() => setSelectedOrgan("body")}
            className={`absolute top-[185px] left-[50%] -translate-x-1/2 p-2 rounded-full shadow-lg transition-transform hover:scale-125 z-10 flex items-center justify-center ${getPinColor(getBodyStatus())} ${selectedOrgan === "body" ? "ring-4 ring-white" : ""}`}
            title="Body Composition (BMI)"
          >
            <Scale className="w-3.5 h-3.5" />
          </button>

          <span className="text-[10px] text-slate-400 mt-3 font-medium">
            {isTa ? "பகுதியை தொடவும் 👆" : "Tap an icon to inspect 👆"}
          </span>
        </div>

        {/* Selected Organ Information Card Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${getPinColor(active.status)}`}>
                  <Icon className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{active.name}</h3>
                  <span className="text-xs text-slate-400 block">{active.badgeText}</span>
                </div>
              </div>

              <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${
                active.status === "green"
                  ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                  : active.status === "yellow"
                  ? "bg-amber-950 text-amber-300 border-amber-500/40"
                  : "bg-rose-950 text-rose-300 border-rose-500/40"
              }`}>
                {active.badgeText}
              </span>
            </div>

            {/* Metrics List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
              {active.metrics.map((m, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">{m.label}</span>
                  <strong className="text-sm font-bold text-white block mt-0.5">{m.val}</strong>
                </div>
              ))}
            </div>

            {/* Practical What you can do tip */}
            <div className="p-3.5 rounded-2xl bg-teal-950/30 border border-teal-500/30 text-xs text-slate-200 space-y-1">
              <strong className="text-teal-300 flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5" /> {isTa ? "இன்று நீங்கள் செய்யக்கூடியது:" : "What You Can Do Today:"}
              </strong>
              <p className="text-[11px] leading-relaxed text-slate-300">{active.tip}</p>
            </div>
          </div>

          {/* Quick Region Selector Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {Object.keys(organData).map((key) => {
              const o = organData[key]
              const OIcon = o.icon
              const isSel = selectedOrgan === key
              return (
                <button
                  key={key}
                  onClick={() => setSelectedOrgan(key)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    isSel
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  <OIcon className="w-3.5 h-3.5" />
                  <span>{o.name.split(" ")[0]}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}