import React, { useState } from "react"
import {
  AlertOctagon,
  PhoneCall,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  PhoneForwarded,
  ArrowRight
} from "lucide-react"
import api from "../services/api"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

export const EmergencyModule = () => {
  const [symptoms, setSymptoms] = useState({
    chest_pressure_or_pain: false,
    pain_radiating_arm_jaw_back: false,
    shortness_of_breath: false,
    cold_sweating: false,
    nausea_or_vomiting: false,
    lightheadedness_syncope: false,
    sudden_onset: false
  })

  const [triageResult, setTriageResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const toggleSymptom = (key) => {
    setSymptoms((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleCheck = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post("/emergency/check", symptoms)
      setTriageResult(res.data)
    } catch (err) {
      console.error("Emergency triage check failed:", err)
    } finally {
      setLoading(false)
    }
  }

  const symptomLabels = [
    { key: "chest_pressure_or_pain", label: "Chest Pressure, Tightness, Squeezing, or Heavy Pain" },
    { key: "pain_radiating_arm_jaw_back", label: "Pain Spreading to Left Arm, Shoulder, Neck, Jaw, or Back" },
    { key: "shortness_of_breath", label: "Sudden Unexplained Shortness of Breath / Trouble Breathing" },
    { key: "cold_sweating", label: "Cold Sweating / Sudden Profuse Diaphoresis" },
    { key: "lightheadedness_syncope", label: "Dizziness, Severe Lightheadedness, or Fainting" },
    { key: "nausea_or_vomiting", label: "Sudden Severe Nausea or Indigestion-like Distress" },
    { key: "sudden_onset", label: "Symptoms Began Suddenly or Under Extreme Exertion" }
  ]

  const hasAnySelected = Object.values(symptoms).some(Boolean)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Red Alert Header */}
      <div className="p-6 rounded-3xl bg-rose-950/40 border-2 border-rose-500 text-rose-100 shadow-2xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse shadow-lg shadow-rose-950/50">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-900/60 px-2.5 py-0.5 rounded-full border border-rose-400/30">
              Immediate Safety Triage
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Acute Heart Symptoms Emergency Check
            </h1>
          </div>
        </div>

        <p className="text-xs text-rose-200 leading-relaxed">
          If you or someone near you is experiencing severe discomfort right now, <strong>do not wait for an AI risk prediction</strong>. Standard AI calculations are suspended during acute symptoms.
        </p>

        {/* Emergency Call Buttons */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <a
            href="tel:112"
            className="py-3 px-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm text-center shadow-lg shadow-rose-950/80 flex items-center justify-center gap-1.5 transition-transform hover:scale-105"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call 112</span>
          </a>
          <a
            href="tel:108"
            className="py-3 px-2 rounded-2xl bg-rose-700 hover:bg-rose-600 text-white font-extrabold text-sm text-center shadow-lg shadow-rose-950/80 flex items-center justify-center gap-1.5 transition-transform hover:scale-105"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call 108</span>
          </a>
          <a
            href="tel:911"
            className="py-3 px-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm text-center border border-slate-700 flex items-center justify-center gap-1.5 transition-transform hover:scale-105"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call 911</span>
          </a>
        </div>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Triage Checklist Form */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-900/80 space-y-6">
        <div>
          <h2 className="text-base font-bold text-white">
            Are you experiencing any of these acute signs right now?
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select every symptom you or the patient are currently feeling.
          </p>
        </div>

        <form onSubmit={handleCheck} className="space-y-3">
          {symptomLabels.map((item) => (
            <div
              key={item.key}
              onClick={() => toggleSymptom(item.key)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                symptoms[item.key]
                  ? "bg-rose-950/30 border-rose-500 text-rose-200 shadow-sm"
                  : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <span className="font-semibold">{item.label}</span>
              <input
                type="checkbox"
                checked={symptoms[item.key]}
                onChange={() => {}}
                className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
              />
            </div>
          ))}

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-950/50 flex items-center gap-2"
            >
              <PhoneForwarded className="w-4 h-4" />
              <span>Evaluate Acute Symptoms Now</span>
            </button>
          </div>
        </form>
      </div>

      {/* Triage Result Display */}
      {triageResult && (
        <div
          className={`glass-card rounded-3xl p-6 sm:p-8 border-2 shadow-2xl space-y-4 animate-in fade-in ${
            triageResult.is_emergency
              ? "bg-rose-950/50 border-rose-500 text-rose-100"
              : "bg-emerald-950/30 border-emerald-500/50 text-emerald-100"
          }`}
        >
          <div className="flex items-start gap-3">
            {triageResult.is_emergency ? (
              <AlertTriangle className="w-8 h-8 text-rose-400 flex-shrink-0 animate-bounce" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            )}
            <div>
              <h3 className="text-lg font-black text-white">
                {triageResult.is_emergency ? "POSSIBLE MEDICAL EMERGENCY" : "No Critical Red-Flag Symptoms Selected"}
              </h3>
              <p className="text-xs mt-1 leading-relaxed text-slate-200">
                {triageResult.headline_warning ||
                  (triageResult.is_emergency
                    ? "Please seek emergency medical help immediately. Do not drive yourself."
                    : "No acute cardiac symptoms reported. You may proceed with routine risk prediction and lifestyle tracking.")}
              </p>
            </div>
          </div>

          {triageResult.is_emergency && (
            <div className="p-4 rounded-2xl bg-rose-900/40 border border-rose-500/40 text-xs space-y-2">
              <strong className="text-white block font-bold text-sm">Action steps to take right now:</strong>
              <ul className="list-disc list-inside space-y-1 text-rose-200">
                <li>Call emergency dispatch (112 / 108 / 911) immediately.</li>
                <li>Sit upright in a comfortable chair or rest with head elevated.</li>
                <li>Loosen any tight clothing around your collar and chest.</li>
                <li>Do NOT attempt vigorous exercise, drive yourself, or dismiss chest tightness as mere gas.</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}