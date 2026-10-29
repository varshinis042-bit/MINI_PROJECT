import React from "react"

export const StatCard = ({ title, value, unit = "", subtitle, icon: Icon, trend, color = "emerald" }) => {
  const colorMap = {
    emerald: "from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/20",
    rose: "from-rose-500/20 to-pink-500/5 text-rose-400 border-rose-500/20",
    amber: "from-amber-500/20 to-yellow-500/5 text-amber-400 border-amber-500/20",
    blue: "from-blue-500/20 to-cyan-500/5 text-blue-400 border-blue-500/20",
    indigo: "from-indigo-500/20 to-purple-500/5 text-indigo-400 border-indigo-500/20"
  }

  const activeColor = colorMap[color] || colorMap.emerald

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${activeColor} rounded-full blur-3xl pointer-events-none`} />
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <Icon className="w-5 h-5 text-slate-200" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="font-display text-3xl font-bold text-white tracking-tight">{value}</span>
        {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
      </div>

      {subtitle && (
        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-2">
          {trend && (
            <span className={trend > 0 ? "text-rose-400 font-semibold" : "text-emerald-400 font-semibold"}>
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
          )}
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  )
}