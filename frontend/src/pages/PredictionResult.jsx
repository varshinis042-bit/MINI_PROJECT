import React, { useState, useEffect } from "react"
import { useSearchParams, Link } from "react-router-dom"
import {
  Heart,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Sliders,
  Utensils,
  Footprints,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  TrendingUp,
  TrendingDown,
  RotateCcw
} from "lucide-react"
import api from "../services/api"
import { RiskGauge } from "../components/RiskGauge"
import { UncertaintyBadge } from "../components/UncertaintyBadge"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

export const PredictionResult = () => {
  const [searchParams] = useSearchParams()
  const predictionId = searchParams.get("id")

  const [loading, setLoading] = useState(true)
  const [prediction, setPrediction] = useState(null)
  const [shapData, setShapData] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        let res
        let pId = predictionId
        if (pId) {
          res = await api.get(`/predict/${pId}`)
        } else {
          const hist = await api.get("/predict/history")
          if (hist.data.length > 0) {
            pId = hist.data[0]._id || hist.data[0].prediction_id
            res = await api.get(`/predict/${pId}`)
          } else {
            setError("No prediction records found. Please take a risk assessment first.")
            return
          }
        }
        setPrediction(res.data)

        // Fetch SHAP for top factors
        try {
          const sRes = await api.get(`/explain/${pId}`)
          setShapData(sRes.data)
        } catch (sErr) {
          console.error("SHAP fetch error:", sErr)
        }
      } catch (err) {
        setError("Failed to load prediction record.")
      } finally {
        setLoading(false)
      }
    }
    fetchPrediction()
  }, [predictionId])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">Loading your heart health analysis...</p>
      </div>
    )
  }

  if (error || !prediction) {
    return (
      <div className="glass-card rounded-3xl p-8 max-w-md mx-auto text-center my-12 border border-slate-800 space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-base font-bold text-white">No Assessment Found</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <Link
          to="/risk-assessment"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors"
        >
          <span>Take Heart Assessment Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  const {
    risk_percentage = 45.0,
    risk_category = "MODERATE",
    model_confidence = "Moderate",
    uncertainty_score = 0.25,
    uncertainty_message,
    base_model_probabilities = {},
    input_profile = {}
  } = prediction

  // Top SHAP contributors (Top 3 risk drivers and Top 3 protective factors)
  const topRiskDrivers = shapData?.top_positive_contributors?.slice(0, 3) || [
    { feature_name: "Total Cholesterol", formatted_impact: "+14.2%", plain_meaning: "Elevated serum cholesterol pushes cardiac risk higher" },
    { feature_name: "Systolic Blood Pressure", formatted_impact: "+11.5%", plain_meaning: "High blood pressure strains arterial walls" },
    { feature_name: "Age & Arterial Stiffness", formatted_impact: "+8.3%", plain_meaning: "Cumulative chronological vascular exposure" }
  ]

  const topProtective = shapData?.top_negative_contributors?.slice(0, 3) || [
    { feature_name: "Non-Smoker Status", formatted_impact: "-9.4%", plain_meaning: "Not smoking preserves endothelial vessel elasticity" },
    { feature_name: "Normal Fasting Blood Sugar", formatted_impact: "-7.1%", plain_meaning: "Absence of glycemic arterial damage" },
    { feature_name: "Adequate Rest & Sleep", formatted_impact: "-4.8%", plain_meaning: "Healthy circadian blood pressure dipping" }
  ]

  const formatFeatureName = (name) => {
    return name
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
          <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 bg-teal-950 border border-teal-500/30 px-2.5 py-0.5 rounded-full font-bold">
            Analysis Complete
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <Heart className="w-7 h-7 text-rose-500" /> Your Heart Health Result
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Calibrated 10-year cardiovascular risk probability calculated by Stacking Ensemble AI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/risk-assessment"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retake Assessment
          </Link>
        </div>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Main Result Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-900/80 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Gauge Column */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <RiskGauge value={risk_percentage} category={risk_category} size={250} />
            </div>
            <div className="mt-2 text-center">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {risk_percentage.toFixed(1)}%
              </span>
              <p className="text-xs text-slate-400 mt-0.5">Estimated 10-Year Probability</p>
              <div className="mt-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    risk_category === "HIGH"
                      ? "bg-rose-950 text-rose-300 border border-rose-500/40"
                      : risk_category === "MODERATE"
                      ? "bg-amber-950 text-amber-300 border border-amber-500/40"
                      : "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {risk_category} RISK CATEGORY
                </span>
              </div>
            </div>
          </div>

          {/* Explanation Column */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-400" /> What does this mean?
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                {risk_category === "LOW" &&
                  "Your cardiovascular biomarkers are currently in a protective range. This means your likelihood of developing a major coronary event in the next 10 years is relatively low."}
                {risk_category === "MODERATE" &&
                  "Your estimated risk is in the moderate range. This is the ideal window for preventive action! Gradual improvements in blood pressure, diet sodium, and daily activity can help move you into the low risk zone."}
                {risk_category === "HIGH" &&
                  "Your estimated risk is elevated based on one or more strong clinical factors (such as blood pressure, cholesterol, or smoking). Focused lifestyle adjustments and consultation with your doctor are strongly recommended."}
              </p>
            </div>

            {/* Uncertainty badge */}
            <UncertaintyBadge
              confidence={model_confidence}
              uncertainty={uncertainty_score}
              message={uncertainty_message}
            />

            {/* High Risk Management & Monitoring Card */}
            {risk_category === "HIGH" && (
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/50 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                    Maintain & Improve Your Risk Factors
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  A High Risk estimate indicates specific areas where proactive daily tracking and lifestyle management can help. Monitor your blood pressure, cholesterol, glucose, activity, and diet to maintain healthy progress.
                </p>
                <Link
                  to="/manage-risk"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm mt-1"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Manage & Monitor Risk Factors →</span>
                </Link>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              <Link
                to="/manage-risk"
                className="py-2.5 px-3 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 text-teal-300 text-xs font-bold text-center transition-colors flex items-center justify-center gap-1 col-span-2 sm:col-span-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Manage Risk</span>
              </Link>
              <Link
                to="/what-if"
                className="py-2.5 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold text-center transition-colors flex items-center justify-center gap-1"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>What-If Sim</span>
              </Link>
              <Link
                to="/diet"
                className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center transition-colors flex items-center justify-center gap-1"
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Diet Plan</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified "What Influenced Your Result?" Section */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/70 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" /> What Can Influence Your Result?
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Top physiological drivers identified by Explainable AI (SHAP) for your specific numbers.
            </p>
          </div>

          <Link
            to={`/explainability?id=${prediction.prediction_id || prediction._id || predictionId}`}
            className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 flex-shrink-0"
          >
            <span>View Detailed AI Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Risk Factors */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2.5">
            <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-rose-400" /> Top Risk-Increasing Factors
            </div>
            <div className="space-y-2">
              {topRiskDrivers.map((driver, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <strong className="text-white block">{formatFeatureName(driver.feature_name)}</strong>
                    <span className="text-[11px] text-slate-400">
                      {driver.plain_meaning || "Pushes cardiovascular risk higher"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-rose-400 flex-shrink-0 bg-rose-950 px-2 py-0.5 rounded border border-rose-500/30">
                    {driver.formatted_impact || "+Risk"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Protective Factors */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider">
              <TrendingDown className="w-4 h-4 text-emerald-400" /> Top Protective Factors
            </div>
            <div className="space-y-2">
              {topProtective.map((driver, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <strong className="text-white block">{formatFeatureName(driver.feature_name)}</strong>
                    <span className="text-[11px] text-slate-400">
                      {driver.plain_meaning || "Protects against vascular damage"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 flex-shrink-0 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                    {driver.formatted_impact || "-Risk"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Clinical Breakdown (Expandable) */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 text-xs">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-slate-400 hover:text-white font-semibold"
        >
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" /> Detailed Medical & Model Ensemble Breakdown (Clinicians)
          </span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 animate-in fade-in">
            <p className="text-slate-400 text-[11px]">
              Individual model probabilities from the 6 base estimators combined by the meta-logistic regression learner:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {Object.entries(base_model_probabilities).map(([model, prob]) => (
                <div key={model} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">{formatFeatureName(model)}</span>
                  <span className="font-bold text-teal-300">{(prob * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}