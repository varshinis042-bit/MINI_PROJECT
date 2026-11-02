import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  History,
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Calendar,
  Share2,
  Copy,
  ExternalLink,
  PhoneCall,
  Search,
  Filter,
  FileText,
  RotateCcw,
  Stethoscope,
  ChevronRight
} from "lucide-react"
import api from "../services/api"
import { useLanguage } from "../context/LanguageContext"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

export const SymptomHistory = () => {
  const { lang, t } = useLanguage()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterLevel, setFilterLevel] = useState("all")
  const [selectedReport, setSelectedReport] = useState(null)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await api.get("/symptoms/history")
      setReports(res.data || [])
    } catch (err) {
      console.error("Failed to load symptom history:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredReports = reports.filter((r) => {
    if (filterLevel === "all") return true
    return r.urgency_level === parseInt(filterLevel)
  })

  const handleCopySummary = (text) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2500)
  }

  const getUrgencyBadge = (level) => {
    switch (level) {
      case 1:
        return {
          bg: "bg-rose-950/80 border-rose-500 text-rose-300",
          icon: AlertTriangle,
          label: lang === "ta" ? "அவசரம் (நிலை 1)" : "Emergency (Level 1)"
        }
      case 2:
        return {
          bg: "bg-amber-950/80 border-amber-500 text-amber-300",
          icon: ShieldAlert,
          label: lang === "ta" ? "விரைவு சிகிச்சை (நிலை 2)" : "Urgent (Level 2)"
        }
      case 3:
        return {
          bg: "bg-teal-950/80 border-teal-500 text-teal-300",
          icon: Clock,
          label: lang === "ta" ? "வழக்கமான ஆலோசனை (நிலை 3)" : "Routine (Level 3)"
        }
      default:
        return {
          bg: "bg-emerald-950/80 border-emerald-500 text-emerald-300",
          icon: CheckCircle2,
          label: lang === "ta" ? "சுய கவனிப்பு (நிலை 4)" : "Self-Care (Level 4)"
        }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl glass-card border border-teal-500/20 bg-gradient-to-r from-teal-950/40 via-slate-900/60 to-slate-950/80 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-teal-950/50 flex-shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-500/30">
              {lang === "ta" ? "அறிகுறி கண்காணிப்பு வரலாறு" : "Longitudinal Symptom Tracking"}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              {lang === "ta" ? "என் அறிகுறி பரிசோதனை வரலாறு" : "My Symptom Triage History"}
            </h1>
            <p className="text-xs text-slate-300">
              {lang === "ta"
                ? "உங்கள் முந்தைய அறிகுறி பதிவுகள், அவசர வகைப்பாடு மற்றும் மருத்துவ குறிப்புகளை கண்காணிக்கவும்."
                : "Review previous symptom reports, urgency classifications, and clinical handoff notes over time."}
            </p>
          </div>
        </div>

        <Link
          to="/symptom-checker"
          className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-950/50 transition-all hover:scale-105 self-start sm:self-center"
        >
          <Stethoscope className="w-4 h-4" />
          <span>{lang === "ta" ? "புதிய அறிகுறி பரிசோதனை" : "Check New Symptoms"}</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 text-xs font-semibold">
        {[
          { id: "all", label: "All Reports", label_ta: "அனைத்தும்", count: reports.length },
          { id: "1", label: "Level 1: Emergency", label_ta: "நிலை 1: அவசரம்", count: reports.filter((r) => r.urgency_level === 1).length, color: "text-rose-400" },
          { id: "2", label: "Level 2: Urgent", label_ta: "நிலை 2: விரைவு", count: reports.filter((r) => r.urgency_level === 2).length, color: "text-amber-400" },
          { id: "3", label: "Level 3: Routine", label_ta: "நிலை 3: வழக்கம்", count: reports.filter((r) => r.urgency_level === 3).length, color: "text-teal-400" },
          { id: "4", label: "Level 4: Self-Care", label_ta: "நிலை 4: சுய கவனிப்பு", count: reports.filter((r) => r.urgency_level === 4).length, color: "text-emerald-400" }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterLevel(tab.id)}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              filterLevel === tab.id
                ? "bg-teal-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <span>{lang === "ta" ? tab.label_ta : tab.label}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/50">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 glass-card rounded-3xl border border-slate-800">
          <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto mb-3" />
          <p>{lang === "ta" ? "அறிகுறி வரலாறு ஏற்றப்படுகிறது..." : "Loading symptom history..."}</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center space-y-4 glass-card rounded-3xl border border-slate-800 bg-slate-900/40">
          <History className="w-12 h-12 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-white">
              {lang === "ta" ? "அறிகுறி பதிவுகள் எதுவும் கிடைக்கவில்லை" : "No Symptom Reports Found"}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {lang === "ta"
                ? "நீங்கள் இன்னும் எந்த அறிகுறி பரிசோதனையும் செய்யவில்லை. பரிசோதனை செய்து உங்கள் இதய நலனை கண்காணிக்கவும்."
                : "You haven't recorded any symptoms yet. Run an assessment to track your condition over time."}
            </p>
          </div>
          <Link
            to="/symptom-checker"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950/50"
          >
            <Stethoscope className="w-4 h-4" />
            <span>{lang === "ta" ? "இப்போதே அறிகுறி பரிசோதனை செய்க" : "Start Symptom Checker Now"}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const badge = getUrgencyBadge(report.urgency_level)
            const BadgeIcon = badge.icon
            const dateStr = new Date(report.timestamp || report.created_at).toLocaleString()

            return (
              <div
                key={report._id}
                onClick={() => setSelectedReport(report)}
                className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 border border-slate-800 bg-slate-900/70 cursor-pointer transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${badge.bg}`}
                    >
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{dateStr}</span>
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1">
                    <span>{lang === "ta" ? "விவரங்களை காண்க" : "View Details & Summary"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">
                    {lang === "ta" ? report.summary_headline_ta || report.summary_headline : report.summary_headline}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {lang === "ta" ? report.explanation_ta || report.explanation : report.explanation}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                  <span className="text-slate-400 font-semibold">{lang === "ta" ? "அறிகுறிகள்:" : "Symptoms:"}</span>
                  {report.reported_symptoms_summary?.map((sym, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {sym}
                    </span>
                  ))}
                  {report.duration_display && (
                    <span className="text-slate-500 ml-auto">{report.duration_display}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal for Selected Report */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-700 bg-slate-900 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                  {lang === "ta" ? "முழு மருத்துவ அறிக்கை" : "Clinical Triage Summary"}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                  {lang === "ta" ? selectedReport.summary_headline_ta || selectedReport.summary_headline : selectedReport.summary_headline}
                </h3>
                <span className="text-[11px] text-slate-400">
                  Recorded: {new Date(selectedReport.timestamp || selectedReport.created_at).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Explanation */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
              <span className="font-bold text-white block">{lang === "ta" ? "மருத்துவ விளக்கம்:" : "Clinical Assessment:"}</span>
              <p className="text-slate-300 leading-relaxed">
                {lang === "ta" ? selectedReport.explanation_ta || selectedReport.explanation : selectedReport.explanation}
              </p>
            </div>

            {/* Clinical Rule Citations */}
            {selectedReport.matched_rules && selectedReport.matched_rules.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 block">
                  {lang === "ta" ? "பொருந்திய மருத்துவ வழிகாட்டுதல்:" : "Matched Clinical Guidelines:"}
                </span>
                {selectedReport.matched_rules.map((rule, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] space-y-0.5">
                    <span className="font-bold text-white">{rule.rule_name}</span>
                    <p className="text-teal-400 font-medium">Source: {rule.guideline_source}</p>
                    <p className="text-slate-500 italic text-[10px]">Citation: {rule.citation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Preformatted Emergency Summary for copy / share */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">
                {lang === "ta" ? "மருத்துவரிடம் பகிர்வதற்கான சுருக்கம்:" : "Clinical Emergency Summary Note:"}
              </span>
              <pre className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-teal-300 whitespace-pre-wrap leading-relaxed">
                {selectedReport.emergency_summary_text}
              </pre>
            </div>

            {/* Share / Copy Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopySummary(selectedReport.emergency_summary_text)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-teal-400" />
                  <span>{copySuccess ? "Copied!" : (lang === "ta" ? "நகலெடு" : "Copy Note")}</span>
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(selectedReport.emergency_summary_text)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <span>WhatsApp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {selectedReport.urgency_level === 1 && (
                <a
                  href="tel:112"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call 112</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Medical Safety Disclaimer */}
      <MedicalDisclaimer compact={true} />
    </div>
  )
}

export default SymptomHistory
