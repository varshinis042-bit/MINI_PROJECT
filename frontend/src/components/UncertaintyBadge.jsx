import React from "react"
import { ShieldCheck, AlertCircle, HelpCircle } from "lucide-react"

export const UncertaintyBadge = ({ confidence = "Moderate", uncertainty = 0.35, message }) => {
  const getStyle = () => {
    switch (confidence.toLowerCase()) {
      case "high":
        return {
          icon: ShieldCheck,
          badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          text: "High Model Confidence"
        }
      case "low":
        return {
          icon: AlertCircle,
          badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          text: "Elevated Uncertainty"
        }
      default:
        return {
          icon: HelpCircle,
          badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          text: "Moderate Confidence"
        }
    }
  }

  const { icon: Icon, badgeBg, text } = getStyle()

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeBg}`}>
          <Icon className="w-3.5 h-3.5" />
          {text} (Uncertainty: {(uncertainty * 100).toFixed(0)}%)
        </span>
      </div>
      {message && (
        <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
          {message}
        </p>
      )}
    </div>
  )
}