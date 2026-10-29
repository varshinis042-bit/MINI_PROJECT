import React, { useState, useEffect } from "react"
import { useSearchParams, Link } from "react-router-dom"
import {
  Lightbulb,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Info
} from "lucide-react"
import api from "../services/api"
import { ShapChart } from "../components/ShapChart"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

export const Explainability = () => {
  const [searchParams] = useSearchParams()
  const predictionId = searchParams.get("id")

  const [loading, setLoading] = useState(true)
  const [explanation, setExplanation] = useState(null)
  const [showAdvancedChart, setShowAdvancedChart] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchExplanation = async () => {
      try {
        let pId = predictionId
        if (!pId) {
          const hist = await api.get("/predict/history")
          if (hist.data.length > 0) {
            pId = hist.data[0]._id || hist.data[0].prediction_id
          } else {
            setError("No previous assessments found. Please complete a risk assessment first.")
            return
          }
        }
        const res = await api.get(`/explain/${pId}`)
        setExplanation(res.data)
      } catch (err) {
        setError("Failed to generate explanations for this assessment.")
      } finally {
        setLoading(false)
      }
    }
    fetchExplanation()
  }, [predictionId])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">Analyzing biological drivers with Explainable AI (SHAP)...</p>
      </div>
    )
  }

  if (error || !explanation) {
    return (
      <div className="glass-card rounded-3xl p-8 max-w-md mx-auto text-center my-12 border border-slate-800 space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-base font-bold text-white">Explanation Unavailable</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <Link
          to="/risk-assessment"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors"
        >
          <span>Take Risk Assessment</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  const {
    base_value = 0.32,
    predicted_probability = 0.48,
    top_positive_contributors = [],
    top_negative_contributors = [],
    natural_language_explanation = "",
    waterfall_chart_data = []
  } = explanation

  const formatName = (str) => {
    return str
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace("Sbp", "Blood Pressure")
      .replace("Dbp", "Diastolic BP")
      .replace("Bmi", "Body Mass Index")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 bg-amber-950 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
            Transparent AI
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <Lightbulb className="w-7 h-7 text-amber-400" /> Why Did I Get This Result?
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            SHAP (Shapley Additive exPlanations) reveals the exact factors that influenced the AI model's estimation.
          </p>
        </div>

        <Link
          to="/what-if"
          className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>What if I improve these?</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Simple Summary Banner */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
          <Sparkles className="w-4 h-4" /> Plain English Summary
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">
          {natural_language_explanation ||
            "Your cardiovascular risk estimate is primarily influenced by your current blood pressure, cholesterol levels, and daily lifestyle habits. Certain factors increase risk while protective habits pull risk down."}
        </p>
        <div className="text-xs text-slate-400 pt-2 border-t border-slate-800/80 flex items-center gap-4 flex-wrap">
          <span>Population Baseline Risk: <strong>{(base_value * 100).toFixed(1)}%</strong></span>
          <span>•</span>
          <span>Your Model Estimate: <strong className="text-white">{(predicted_probability * 100).toFixed(1)}%</strong></span>
        </div>
      </div>

      {/* Two Column Friendly Factor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Factors Increasing Risk */}
        <div className="glass-card rounded-3xl p-6 border border-rose-500/30 bg-rose-950/10 space-y-4">
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
            <h2 className="text-sm font-bold text-rose-300 flex items-center gap-2 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-rose-400" /> Factors Increasing Risk
            </h2>
            <span className="text-[10px] text-rose-400 bg-rose-950 px-2 py-0.5 rounded-full border border-rose-500/30 font-semibold">
              Pushing Risk Higher
            </span>
          </div>

          <div className="space-y-3">
            {top_positive_contributors.slice(0, 5).map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{formatName(item.feature_name)}</span>
                  <span className="text-xs font-extrabold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/40">
                    {item.formatted_impact || `+${(item.shap_value * 100).toFixed(1)}%`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {item.plain_meaning || "Elevated clinical biomarker that increases the statistical probability of vascular events."}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Factors Protecting Your Heart */}
        <div className="glass-card rounded-3xl p-6 border border-emerald-500/30 bg-emerald-950/10 space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
            <h2 className="text-sm font-bold text-emerald-300 flex items-center gap-2 uppercase tracking-wider">
              <TrendingDown className="w-4 h-4 text-emerald-400" /> Factors Protecting Your Heart
            </h2>
            <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
              Pulling Risk Lower
            </span>
          </div>

          <div className="space-y-3">
            {top_negative_contributors.slice(0, 5).map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{formatName(item.feature_name)}</span>
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                    {item.formatted_impact || `${(item.shap_value * 100).toFixed(1)}%`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {item.plain_meaning || "Healthy physiological habit or normal reading that actively protects your arteries."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Technical Waterfall Chart Drawer */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 text-xs">
        <button
          onClick={() => setShowAdvancedChart(!showAdvancedChart)}
          className="w-full flex items-center justify-between text-slate-400 hover:text-white font-semibold"
        >
          <span className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-slate-400" /> Advanced SHAP Waterfall Chart & Technical Values
          </span>
          {showAdvancedChart ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvancedChart && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-in fade-in">
            <p className="text-slate-400 text-xs">
              This chart displays individual Shapley attribution values ($\phi_i$) for each feature relative to the expected base value:
            </p>
            <div className="h-80 w-full pt-2">
              <ShapChart data={waterfall_chart_data} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}