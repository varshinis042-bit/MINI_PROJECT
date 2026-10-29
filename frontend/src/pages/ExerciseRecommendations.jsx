import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Footprints,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Clock,
  Sparkles,
  PhoneCall,
  Activity,
  Flame,
  ArrowRight
} from "lucide-react"
import api from "../services/api"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

export const ExerciseRecommendations = () => {
  const [exerciseData, setExerciseData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const res = await api.get("/exercise/recommendations")
        setExerciseData(res.data)
      } catch (err) {
        console.error("Failed to load exercise recommendations:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchExercise()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">Personalizing safe physical activity guidelines...</p>
      </div>
    )
  }

  const {
    exercise_permitted = true,
    safety_status = "CLEARED",
    warning_message,
    risk_tier = "MODERATE",
    weekly_target = "150 minutes per week",
    recommended_aerobic = "Brisk walking or stationary cycling",
    weekly_routine = [],
    warmup_cooldown = [],
    safety_guidelines = []
  } = exerciseData || {}

  // Beginner-friendly activities
  const beginnerActivities = [
    {
      title: "Brisk Outdoor or Treadmill Walking",
      duration: "20–30 mins",
      intensity: "Moderate (Conversational pace)",
      desc: "The safest, most effective cardiovascular exercise. You should be able to talk without gasping."
    },
    {
      title: "Gentle Stretching & Yoga Asanas",
      duration: "10–15 mins",
      intensity: "Light",
      desc: "Tadasana, gentle neck & shoulder rolls, and deep diaphragmatic breathing reduce arterial tension."
    },
    {
      title: "Low-Impact Cycling or Swimming",
      duration: "15–20 mins",
      intensity: "Moderate",
      desc: "Gentle on joints while building cardiac muscular endurance and lowering resting heart rate."
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 bg-indigo-950 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold">
            Cardioprotective Fitness
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <Footprints className="w-7 h-7 text-indigo-400" /> Your Activity Plan
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Conservative, safety-first physical activity routines designed to protect your heart without strain.
          </p>
        </div>

        <Link
          to="/reminders"
          className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Schedule Walk Reminder</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Contraindication Safety Warning (If Severe BP or not permitted) */}
      {!exercise_permitted ? (
        <div className="p-6 rounded-3xl bg-rose-950/40 border-2 border-rose-500 text-rose-200 space-y-3">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-rose-400 flex-shrink-0 animate-pulse" />
            <div>
              <h2 className="text-base font-bold text-rose-300">
                Exercise Suspended — Clinical Safety Notice
              </h2>
              <p className="text-xs text-rose-200 mt-0.5">
                {warning_message || "Severely elevated blood pressure detected (SBP ≥ 180 or DBP ≥ 110 mmHg). Vigorous or moderate exercise is contraindicated until evaluated by a healthcare professional."}
              </p>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-900/40 text-xs text-slate-200 space-y-1">
            <strong>What to do now:</strong>
            <p>1. Rest quietly in a comfortable seated position.</p>
            <p>2. Recheck your blood pressure in 15 minutes.</p>
            <p>3. If acute symptoms occur (chest pain, breathlessness, dizziness), contact emergency services immediately (112 / 108 / 911).</p>
          </div>
        </div>
      ) : (
        <>
          {/* Today's Recommendation Banner */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-b from-slate-900/90 to-indigo-950/20 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Today's Suggestion
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  15–20 minutes of moderate activity
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-lg">
                  {recommended_aerobic || "A 20-minute gentle evening walk around your neighborhood or building compound."}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center sm:text-right flex-shrink-0">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Weekly Target</span>
                <div className="text-base font-bold text-emerald-400 mt-0.5">{weekly_target}</div>
                <span className="text-[10px] text-slate-500">Spread over 4 to 5 days</span>
              </div>
            </div>
          </div>

          {/* Beginner-Friendly Exercise Options */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Recommended Beginner Options:
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {beginnerActivities.map((act, idx) => (
                <div key={idx} className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/70 space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                        {act.duration}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {act.intensity}
                      </span>
                    </div>

                    <strong className="text-sm font-bold text-white block">
                      {act.title}
                    </strong>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {act.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warmup and Safety Guidelines */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/60 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" /> Golden Rules for Safe Heart Activity:
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                <span><strong>The Talk Test:</strong> You should be able to speak comfortably while walking. If out of breath, slow down.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                <span><strong>Warm Up & Cool Down:</strong> Always spend 5 minutes stretching before and after each walk.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                <span><strong>Stay Hydrated:</strong> Drink a glass of water before heading out, especially in warm climates.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span><strong>Stop Immediately:</strong> If you feel any chest heaviness, left arm ache, or dizziness, sit down immediately.</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}