import React from "react"

export const RiskGauge = ({ value = 50, category = "MODERATE", size = 260 }) => {
  const clamped = Math.max(0, Math.min(100, value))
  // Calculate needle angle from -90 to +90 degrees
  const angle = (clamped / 100) * 180 - 90

  const getTierColor = () => {
    if (clamped < 20) return { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", hex: "#10b981" }
    if (clamped < 50) return { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", hex: "#f59e0b" }
    return { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", hex: "#f43f5e" }
  }

  const colors = getTierColor()

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <svg width={size} height={size * 0.62} viewBox="0 0 200 120" className="overflow-visible">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="35%" stopColor="#84cc16" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          <filter id="gaugeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Outer track background */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#1e293b"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Gradient colored arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray="251.3"
          strokeDashoffset="0"
          opacity="0.85"
        />

        {/* Needle */}
        <g transform={`rotate(${angle} 100 100)`} style={{ transition: "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="32"
            stroke="#f8fafc"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#gaugeShadow)"
          />
          <circle cx="100" cy="100" r="7" fill="#f8fafc" />
          <circle cx="100" cy="100" r="3" fill="#0f172a" />
        </g>

        {/* Zone markers */}
        <text x="20" y="115" fill="#64748b" fontSize="8" fontWeight="600" textAnchor="middle">0%</text>
        <text x="65" y="42" fill="#10b981" fontSize="7" fontWeight="600" textAnchor="middle">LOW</text>
        <text x="100" y="22" fill="#f59e0b" fontSize="7" fontWeight="600" textAnchor="middle">MOD</text>
        <text x="135" y="42" fill="#f43f5e" fontSize="7" fontWeight="600" textAnchor="middle">HIGH</text>
        <text x="180" y="115" fill="#64748b" fontSize="8" fontWeight="600" textAnchor="middle">100%</text>
      </svg>

      {/* Main metric display */}
      <div className="text-center mt-[-10px]">
        <div className="flex items-baseline justify-center gap-1">
          <span className="font-display text-4xl font-bold tracking-tight text-white">{clamped.toFixed(1)}</span>
          <span className="text-lg font-semibold text-slate-400">%</span>
        </div>
        <div className="mt-1">
          <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
            {category} RISK
          </span>
        </div>
      </div>
    </div>
  )
}