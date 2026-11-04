import React, { useState } from "react"
import {
  Users,
  ShieldAlert,
  PhoneCall,
  MapPin,
  Heart,
  AlertTriangle,
  Info
} from "lucide-react"
import { TrustedContactManager } from "../components/TrustedContactManager"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"
import { useLanguage } from "../context/LanguageContext"

export const TrustedContactsPage = () => {
  const { lang } = useLanguage()
  const isTa = lang === "ta"

  const [primaryContact, setPrimaryContact] = useState(null)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 bg-teal-950 border border-teal-500/30 px-2.5 py-0.5 rounded-full font-bold">
            {isTa ? "பாதுகாப்பு & அவசர உதவி" : "Safety & Emergency Network"}
          </span>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs text-slate-400">
            {isTa ? "நம்பகமான நபர்கள்" : "Trusted Contacts"}
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <Users className="w-7 h-7 text-teal-400" />
          <span>
            {isTa ? "நம்பகமான தொடர்புகள் & அவசர இருப்பிடப் பகிர்வு" : "Trusted Contacts & Emergency Location Sharing"}
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
          {isTa
            ? "அவசர இதய அறிகுறி ஏற்படும் தருணத்தில் உங்கள் நேரலை GPS இருப்பிடம் மற்றும் அறிகுறிக் குறிப்பை உடனடியாகப் பெற ஒரு குடும்ப உறுப்பினர் அல்லது மருத்துவரை முதன்மை தொடர்பாளராக பதிவு செய்யுங்கள்."
            : "Manage your emergency contacts to instantly receive your clinical symptom summaries and live GPS location map links during acute health events."}
        </p>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Emergency Hotline Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-950/60 to-slate-900 border border-rose-500/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold flex-shrink-0 animate-pulse">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block">
              National Emergency Dispatch (India)
            </span>
            <span className="text-sm font-extrabold text-white">
              Call 112 (All-in-One) • 108 (Medical Ambulance)
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href="tel:112"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/50"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call 112</span>
          </a>
          <a
            href="tel:108"
            className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/50"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call 108</span>
          </a>
        </div>
      </div>

      {/* Main Trusted Contact Manager Component */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/80">
        <TrustedContactManager onSelectPrimary={setPrimaryContact} />
      </div>

      {/* Educational Safety Protocol Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/60 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-teal-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>{isTa ? "1. தனியுரிமை & பாதுகாப்பு" : "1. Consent & Privacy"}</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {isTa
              ? "உங்கள் அனுமதி இல்லாமல் உங்கள் GPS இருப்பிடம் யாருடனும் பகிரப்படாது."
              : "Location data is only accessed when you explicitly click 'Share My Location'. Nothing is sent automatically."}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/60 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>{isTa ? "2. உறுதிப்படுத்தல் படி" : "2. User Confirmation"}</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {isTa
              ? "அவசரக் குறிப்பு அனுப்பப்படும் முன் என்ன தகவல் செல்கிறது என்பதை நீங்கள் சரிபார்க்கலாம்."
              : "Every alert shows you a full preview of the symptoms and map link before you confirm dispatch."}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/60 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <PhoneCall className="w-4 h-4" />
            <span>{isTa ? "3. 1-கிளிக் SMS / WhatsApp" : "3. 1-Click Multi-Channel"}</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {isTa
              ? "தொலைபேசியின் SMS அல்லது வாட்ஸ்அப் வழியாக ஒரே கிளிக்கில் தகவல் அனுப்பலாம்."
              : "Pre-filled direct links allow 1-click dispatch through your phone's default SMS app or WhatsApp."}
          </p>
        </div>
      </div>
    </div>
  )
}

export default TrustedContactsPage

