import React from "react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from "recharts"

export const ShapChart = ({ features = [], maxItems = 10 }) => {
  const displayData = features.slice(0, maxItems).map((f) => ({
    name: f.feature_name,
    rawName: f.feature,
    value: f.shap_value,
    direction: f.direction,
    userVal: f.user_value,
    note: f.clinical_note
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const isPositive = data.value > 0
      return (
        <div className="glass-card p-3 rounded-lg text-xs max-w-xs border border-slate-700 shadow-xl">
          <div className="font-bold text-slate-200 mb-1">{data.name}</div>
          <div className="text-slate-400 mb-1">
            Recorded Value: <span className="text-slate-100 font-medium">{data.userVal}</span>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-slate-400">SHAP Attribution:</span>
            <span className={`font-mono font-bold ${isPositive ? "text-rose-400" : "text-emerald-400"}`}>
              {isPositive ? "+" : ""}{data.value.toFixed(4)}
            </span>
          </div>
          <div className="text-[11px] text-slate-300 border-t border-slate-700/60 pt-1.5 leading-snug">
            {data.note}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={displayData}
          margin={{ top: 10, right: 30, left: 140, bottom: 10 }}
        >
          <XAxis
            type="number"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={{ stroke: "#334155" }}
            domain={["auto", "auto"]}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#cbd5e1", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={false}
            width={130}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0} stroke="#64748b" strokeWidth={1.5} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {displayData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.value >= 0 ? "#f43f5e" : "#10b981"}
                opacity={0.9}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}