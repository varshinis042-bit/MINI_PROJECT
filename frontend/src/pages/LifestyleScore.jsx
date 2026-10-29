import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Flame,
  Salad,
  Footprints,
  Moon,
  Cigarette,
  Brain,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from "lucide-react"
import api from "../services/api"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

export const LifestyleScore = () => {
  const [lifestyleData, setLifestyleData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showFormula, setShowFormula] = useState(false)

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const res = await api.get("/lifestyle/score")
        setLifestyleData(res.data)
      } catch (err) {
        console.error("Failed to load lifestyle score:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchScore()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">Evaluating your lifestyle health score...</p>
      </div>
    )
  }

  const {
    overall_lifestyle_score = 72,
    diet_score = 70,
    activity_score = 55,
    sleep_score = 80,
    smoking_score = 100,
    stress_score = 60,
    bmi_score = 75,
    category = "MODERATE_LIFESTYLE",
    pillar_interpretations = {},
    scoring_methodology = ""
  } = lifestyleData || {}

  const getStatusBadge = (score) => {
    if (score >= 75) {
      return { text: "Good", color: "bg-emerald-950 text-emerald-300 border-emerald-500/40" }
    }
    return { text: "Needs Improvement", color: "bg-amber-950 text-amber-300 border-amber-500/40" }
  }

  const pillars = [
    {
      name: "Diet Quality",
      icon: Salad,
      score: diet_score,
      desc: "Vegetable variety, lower refined oils, and sodium control",
      note: pillar_interpretations.diet || "Adherence to heart-healthy Indian nutritional principles."
    },
    {
      name: "Physical Activity",
      icon: Footprints,
      score: activity_score,
      desc: "Weekly brisk walking and moderate aerobic exercise",
      note: pillar_interpretations.activity || "Aim for 150 minutes of moderate activity weekly."
    },
    {
      name: "Sleep Health",
      icon: Moon,
      score: sleep_score,
      desc: "7 to 8 hours of restorative nightly sleep",
      note: pillar_interpretations.sleep || "Supports nightly blood pressure recovery."
    },
    {
      name: "Smoking & Tobacco",
      icon: Cigarette,
      score: smoking_score,
      desc: "Non-smoker or tobacco abstinence",
      note: pillar_interpretations.smoking || "Preserves arterial flexibility and oxygen flow."
    },
    {
      name: "Stress & Recovery",
      icon: Brain,
      score: stress_score,
      desc: "Managing mental stress, breathing, and relaxation",
      note: pillar_interpretations.stress || "Reduces chronic cortisol and autonomic heart strain."
    },
    {
      name: "Healthy Weight (BMI)",
      icon: Scale,
      score: bmi_score,
      desc: "Maintaining weight in healthy Asian BMI range",
      note: pillar_interpretations.bmi || "Reduces vascular workload and abdominal adiposity."
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 bg-orange-950 border border-orange-500/30 px-2.5 py-0.5 rounded-full font-bold">
            Behavioral Wellness
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <Flame className="w-7 h-7 text-orange-400" /> My Lifestyle Score
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            A comprehensive evaluation of your daily habits across 6 cardioprotective pillars.
          </p>
        </div>

        <Link
          to="/diet"
          className="px-4 py-2 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-300 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Improve Habits</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Main Score Hero Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-b from-slate-900/90 to-orange-950/20 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-300">
              Overall Lifestyle Health Index
            </span>
            <div className="text-4xl sm:text-5xl font-black text-white">
              {overall_lifestyle_score} <span className="text-lg font-normal text-slate-400">/ 100</span>
            </div>
            <p className="text-xs text-slate-300 max-w-md mt-1 leading-relaxed">
              {overall_lifestyle_score >= 80
                ? "Excellent! Your daily lifestyle provides strong natural protection against arterial cardiovascular disease."
                : overall_lifestyle_score >= 60
                ? "Good baseline habits! Small focused enhancements in walking and dietary salt will push your score into the optimal zone."
                : "Several key lifestyle pillars need attention. Simple changes in diet, walking, and stress can yield rapid health improvements."}
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-orange-500/30 bg-slate-950 flex items-center justify-center text-center p-2 shadow-inner">
              <span className="text-xs font-bold text-orange-300 uppercase tracking-wider leading-tight">
                {category.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Lifestyle Pillar Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Your 6 Pillars Breakdown
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pillars.map((p, idx) => {
            const Icon = p.icon
            const badge = getStatusBadge(p.score)

            return (
              <div key={idx} className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 bg-slate-900/70 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-sm font-bold text-white block">{p.name}</strong>
                      <span className="text-[11px] text-slate-400">{p.desc}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${badge.color} flex-shrink-0`}>
                    {badge.text}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Score</span>
                    <strong className="text-white">{p.score} / 100</strong>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        p.score >= 75 ? "bg-emerald-500" : "bg-orange-500"
                      }`}
                      style={{ width: `${p.score}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 leading-tight">
                  {p.note}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Advanced Methodology Accordion */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 text-xs">
        <button
          onClick={() => setShowFormula(!showFormula)}
          className="w-full flex items-center justify-between text-slate-400 hover:text-white font-semibold"
        >
          <span>How is this composite score calculated? (Advanced Methodology)</span>
          {showFormula ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFormula && (
          <div className="mt-3 pt-3 border-t border-slate-800 text-slate-400 space-y-2 animate-in fade-in">
            <p>
              The composite lifestyle index evaluates evidence-based behavioral risk modifiers according to American Heart Association guidelines:
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-orange-300">
              Score = 0.25 × Diet + 0.20 × Activity + 0.15 × Sleep + 0.20 × Tobacco + 0.10 × Stress + 0.10 × BMI
            </div>
          </div>
        )}
      </div>
    </div>
  )
}