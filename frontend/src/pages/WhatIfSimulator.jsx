import React, { useState, useEffect } from "react"
import { useSearchParams, Link } from "react-router-dom"
import {
  Sliders,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Heart,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  Activity,
  Droplet,
  Flame,
  Scale
} from "lucide-react"
import api from "../services/api"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

export const WhatIfSimulator = () => {
  const [searchParams] = useSearchParams()
  const predictionId = searchParams.get("id")

  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [baselineData, setBaselineData] = useState(null)
  const [simulationResult, setSimulationResult] = useState(null)

  // Modifiable target sliders
  const [targetSbp, setTargetSbp] = useState(120)
  const [targetDbp, setTargetDbp] = useState(80)
  const [targetChol, setTargetChol] = useState(180)
  const [targetGlucose, setTargetGlucose] = useState(95)
  const [targetWeight, setTargetWeight] = useState(72)
  const [targetSmoking, setTargetSmoking] = useState("never")
  const [targetActivity, setTargetActivity] = useState("active")

  useEffect(() => {
    const fetchBaseline = async () => {
      try {
        let pId = predictionId
        if (!pId) {
          const hist = await api.get("/predict/history")
          if (hist.data.length > 0) {
            pId = hist.data[0]._id || hist.data[0].prediction_id
          }
        }

        let prof = null
        if (pId) {
          const res = await api.get(`/predict/${pId}`)
          setBaselineData(res.data)
          prof = res.data.input_profile
        } else {
          const pRes = await api.get("/profile")
          prof = pRes.data
          const predRes = await api.post("/predict", prof)
          setBaselineData(predRes.data)
        }

        if (prof) {
          setTargetSbp(Math.max(110, Math.min(prof.systolic_bp - 14, 120)))
          setTargetDbp(Math.max(70, Math.min(prof.diastolic_bp - 8, 80)))
          setTargetChol(Math.max(150, Math.min(prof.cholesterol - 35, 180)))
          setTargetGlucose(Math.max(85, Math.min(prof.blood_glucose - 15, 95)))
          setTargetWeight(Math.max(50, Math.min(prof.weight_kg - 5, 70)))
          setTargetSmoking("never")
          setTargetActivity("active")
        }
      } catch (err) {
        console.error("Baseline load error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchBaseline()
  }, [predictionId])

  // Run What-If simulation
  const runSimulation = async () => {
    setSimulating(true)
    try {
      const pId = baselineData?.prediction_id || baselineData?._id || predictionId
      const payload = {
        prediction_id: pId || "baseline",
        target_systolic_bp: targetSbp,
        target_diastolic_bp: targetDbp,
        target_cholesterol: targetChol,
        target_blood_glucose: targetGlucose,
        target_weight_kg: targetWeight,
        target_smoking_status: targetSmoking,
        target_physical_activity: targetActivity
      }

      const res = await api.post("/what-if", payload)
      setSimulationResult(res.data)
    } catch (err) {
      console.error("Simulation failed:", err)
    } finally {
      setSimulating(false)
    }
  }

  // Trigger simulation whenever sliders change (with a debounce)
  useEffect(() => {
    if (baselineData) {
      const timer = setTimeout(() => {
        runSimulation()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [targetSbp, targetDbp, targetChol, targetGlucose, targetWeight, targetSmoking, targetActivity, baselineData])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">Loading interactive What-If simulator...</p>
      </div>
    )
  }

  const baselineRisk = baselineData ? baselineData.risk_percentage : 48.0
  const simulatedRisk = simulationResult ? simulationResult.simulated_risk_percentage : baselineRisk - 8.5
  const riskDelta = simulationResult ? simulationResult.risk_delta_percentage : (simulatedRisk - baselineRisk)
  const isImproved = riskDelta < 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 bg-purple-950 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-bold">
            Interactive Simulator
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <Sliders className="w-7 h-7 text-purple-400" /> What Happens If I Improve?
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Adjust target lifestyle habits and blood pressure to see your potential heart risk reduction in real-time.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={simulating}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${simulating ? "animate-spin" : ""}`} />
          <span>Recalculate</span>
        </button>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Outcome Comparison Hero Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-b from-slate-900/90 to-purple-950/20 shadow-2xl">
        <div className="text-center mb-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
            Projected Cardiovascular Risk Comparison
          </span>
          <h2 className="text-base sm:text-lg font-bold text-white mt-1">
            See How Much Healthier Habits Can Protect Your Heart
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Baseline */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Estimated Risk</span>
            <div className="text-3xl font-black text-white">{baselineRisk.toFixed(1)}%</div>
            <span className="text-[11px] text-slate-500 block">Based on your latest records</span>
          </div>

          {/* Delta Pill */}
          <div className="flex flex-col items-center justify-center">
            <div
              className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center shadow-lg transition-all ${
                isImproved
                  ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-300"
                  : "bg-amber-950/50 border-amber-500/50 text-amber-300"
              }`}
            >
              <TrendingDown className={`w-6 h-6 mb-1 ${isImproved ? "text-emerald-400" : "text-amber-400"}`} />
              <div className="text-xl font-extrabold">{riskDelta.toFixed(1)}%</div>
              <span className="text-[11px] font-semibold">
                {isImproved ? "Potential Risk Reduction!" : "Risk Difference"}
              </span>
            </div>
          </div>

          {/* Simulated */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-purple-500/40 text-center space-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase">
              Simulated
            </div>
            <span className="text-xs text-purple-300 uppercase tracking-wider font-semibold">Possible Estimated Risk</span>
            <div className="text-3xl font-black text-emerald-400">{simulatedRisk.toFixed(1)}%</div>
            <span className="text-[11px] text-slate-400 block">With improved target habits</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            💡 <strong>Friendly Notice:</strong> These numbers are hypothetical model projections to illustrate the benefits of positive changes. They are not absolute clinical guarantees.
          </p>
        </div>
      </div>

      {/* Interactive Modifiable Sliders */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-900/80 space-y-6">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" /> Adjust Your Target Improvements
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Slide each control to see how reducing blood pressure, improving cholesterol, or quitting smoking lowers your risk.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Target Systolic BP */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-rose-400" /> Target Systolic Blood Pressure
              </span>
              <span className="text-sm font-bold text-teal-300">{targetSbp} mmHg</span>
            </div>
            <input
              type="range"
              min="100"
              max="180"
              step="2"
              value={targetSbp}
              onChange={(e) => setTargetSbp(parseInt(e.target.value))}
              className="w-full accent-teal-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Optimal: 110-120</span>
              <span>Borderline: 130-140</span>
              <span>High: 150+</span>
            </div>
          </div>

          {/* Target Diastolic BP */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-400" /> Target Diastolic Blood Pressure
              </span>
              <span className="text-sm font-bold text-teal-300">{targetDbp} mmHg</span>
            </div>
            <input
              type="range"
              min="60"
              max="110"
              step="2"
              value={targetDbp}
              onChange={(e) => setTargetDbp(parseInt(e.target.value))}
              className="w-full accent-teal-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Optimal: 70-80</span>
              <span>Borderline: 85-90</span>
              <span>High: 95+</span>
            </div>
          </div>

          {/* Target Cholesterol */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-amber-400" /> Target Total Cholesterol
              </span>
              <span className="text-sm font-bold text-amber-300">{targetChol} mg/dL</span>
            </div>
            <input
              type="range"
              min="140"
              max="300"
              step="5"
              value={targetChol}
              onChange={(e) => setTargetChol(parseInt(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Healthy: &lt;200</span>
              <span>Borderline: 200-239</span>
              <span>Elevated: 240+</span>
            </div>
          </div>

          {/* Target Blood Glucose */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-blue-400" /> Target Fasting Glucose
              </span>
              <span className="text-sm font-bold text-blue-300">{targetGlucose} mg/dL</span>
            </div>
            <input
              type="range"
              min="70"
              max="200"
              step="2"
              value={targetGlucose}
              onChange={(e) => setTargetGlucose(parseInt(e.target.value))}
              className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Normal: 70-99</span>
              <span>Prediabetes: 100-125</span>
              <span>High: 126+</span>
            </div>
          </div>

          {/* Target Smoking */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
            <label className="block text-slate-300 font-semibold">
              Target Smoking Status
            </label>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {["never", "former", "current"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setTargetSmoking(status)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                    targetSmoking === status
                      ? "bg-teal-500/20 border border-teal-500 text-teal-300"
                      : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  {status === "never" ? "Non-Smoker" : status === "former" ? "Quit" : "Smoker"}
                </button>
              ))}
            </div>
          </div>

          {/* Target Physical Activity */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
            <label className="block text-slate-300 font-semibold">
              Target Physical Activity Level
            </label>
            <select
              value={targetActivity}
              onChange={(e) => setTargetActivity(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
            >
              <option value="sedentary">Sedentary (No exercise)</option>
              <option value="light">Light (1-2 days walks)</option>
              <option value="moderate">Moderate (3-5 days brisk walking)</option>
              <option value="active">Active (Daily exercise)</option>
              <option value="very_active">Very Active</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}