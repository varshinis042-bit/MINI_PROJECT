import React, { useState } from "react"
import { AlertTriangle, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react"

export const MedicalDisclaimer = ({ compact = false, collapsible = true }) => {
  const [expanded, setExpanded] = useState(!collapsible)

  if (compact) {
    return (
      <div className="bg-amber-950/30 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs text-amber-200/90 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>For health estimation and lifestyle support. Not a doctor or medical diagnosis.</span>
        </div>
        <span className="text-[10px] text-amber-400/80 font-mono hidden sm:inline">Emergency: 112 / 108</span>
      </div>
    )
  }

  return (
    <div className="glass-card border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 my-3 bg-amber-950/15">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>Medical & AI Safety Notice</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              This system provides AI-based estimates for personal lifestyle awareness and decision support. It does NOT provide a medical diagnosis or prescription.
            </p>
          </div>
        </div>

        {collapsible && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
            title={expanded ? "Show less" : "Read full disclaimer"}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-amber-500/20 text-[11px] text-slate-400 space-y-1.5 animate-in fade-in duration-150">
          <p>
            • Statistical model predictions and Indian diet/exercise plans are educational guidelines based on Framingham and ACC/AHA cardiovascular cohorts.
          </p>
          <p>
            • <strong>Emergency Notice:</strong> If you experience severe chest pain, left arm/jaw pain, cold sweats, or acute breathlessness, seek immediate medical care or call <strong>112 / 108 / 911</strong>.
          </p>
        </div>
      )}
    </div>
  )
}