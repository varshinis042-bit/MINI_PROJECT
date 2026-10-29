import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  Flame,
  ArrowRight,
  Sparkles,
  Scale
} from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts"
import api from "../services/api"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

export const ProgressMonitoring = () => {
  const [progressData, setProgressData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await api.get("/progress")
        setProgressData(res.data)
      } catch (err) {
        console.error("Failed to load progress records:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProgress()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">Loading your heart health progress history...</p>
      </div>
    )
  }

  // Calculate summary delta if multiple records exist
  const firstRecord = progressData.length > 0 ? progressData[0] : null
  const lastRecord = progressData.length > 1 ? progressData[progressData.length - 1] : firstRecord

  const firstRisk = firstRecord ? firstRecord.risk_percentage : 52.0
  const latestRisk = lastRecord ? lastRecord.risk_percentage : 46.5
  const riskDelta = latestRisk - firstRisk

  const firstLife = firstRecord ? firstRecord.lifestyle_score : 65
  const latestLife = lastRecord ? lastRecord.lifestyle_score : 74
  const lifeDelta = latestLife - firstLife

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 bg-purple-950 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-bold">
            Health History
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <LineChartIcon className="w-7 h-7 text-purple-400" /> My Progress
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track how your heart risk probability, blood pressure, and lifestyle score improve over time.
          </p>
        </div>

        <Link
          to="/risk-assessment"
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>New Assessment</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Progress Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Risk change summary */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/80 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-400" /> Cardiovascular Risk Trend
          </span>
          <div className="text-lg font-bold text-white">
            Your risk estimate changed from <span className="text-rose-400">{firstRisk.toFixed(1)}%</span> to{" "}
            <span className="text-emerald-400">{latestRisk.toFixed(1)}%</span>.
          </div>
          <p className="text-xs text-slate-400">
            {riskDelta <= 0
              ? `Great job! Your estimated risk dropped by ${Math.abs(riskDelta).toFixed(1)} percentage points.`
              : "Slight variation in recent readings. Consistent habits will help reverse this."}
          </p>
        </div>

        {/* Lifestyle change summary */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/80 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-400" /> Lifestyle Score Trend
          </span>
          <div className="text-lg font-bold text-white">
            Your lifestyle score changed from <span className="text-slate-300">{firstLife}</span> to{" "}
            <span className="text-teal-300">{latestLife} / 100</span>.
          </div>
          <p className="text-xs text-slate-400">
            {lifeDelta >= 0
              ? `Your daily nutrition and activity habits improved by +${lifeDelta} points!`
              : "Aim to log daily walks to boost your score."}
          </p>
        </div>
      </div>

      {/* Chart 1: 10-Yr Risk Trend */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white">10-Year Cardiovascular Risk (%)</h2>
            <p className="text-xs text-slate-400">Lower is better for your heart.</p>
          </div>
          <span className="text-xs font-mono text-teal-400 bg-teal-950 px-2.5 py-0.5 rounded-full border border-teal-500/30">
            Ensemble Probability
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
              />
              <Line
                type="monotone"
                dataKey="risk_percentage"
                name="Risk %"
                stroke="#f43f5e"
                strokeWidth={3}
                dot={{ fill: "#f43f5e", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Blood Pressure Trajectory */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white">Blood Pressure Tracking (mmHg)</h2>
            <p className="text-xs text-slate-400">Systolic (Upper) vs Diastolic (Lower) pressure over time.</p>
          </div>
          <span className="text-xs font-mono text-indigo-400 bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
            Target: &lt; 120/80
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[50, 180]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <Line
                type="monotone"
                dataKey="systolic_bp"
                name="Systolic (Upper)"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ fill: "#06b6d4", r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="diastolic_bp"
                name="Diastolic (Lower)"
                stroke="#818cf8"
                strokeWidth={2.5}
                dot={{ fill: "#818cf8", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}