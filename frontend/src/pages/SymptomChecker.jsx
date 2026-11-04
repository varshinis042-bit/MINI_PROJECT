import React, { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import {
  Stethoscope,
  PhoneCall,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Mic,
  MicOff,
  MapPin,
  Share2,
  Copy,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  HeartPulse,
  Info,
  UserCheck,
  Plus,
  Trash2,
  ExternalLink,
  RotateCcw,
  Activity,
  History,
  FileText
} from "lucide-react"
import api from "../services/api"
import { useLanguage } from "../context/LanguageContext"
import { useAuth } from "../context/AuthContext"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"
import { EmergencyLocationShareModal } from "../components/EmergencyLocationShareModal"

export const SymptomChecker = () => {
  const { lang, t } = useLanguage()
  const { user } = useAuth()

  // Step Wizard State (1: Symptoms & Voice, 2: Confirm & Locations, 3: Onset & Duration, 4: Severity & Trend, 5: Medical History, 6: Assessment Result)
  const [step, setStep] = useState(1)

  // Symptom Description & NLP
  const [description, setDescription] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [nlpLoading, setNlpLoading] = useState(false)
  const [nlpResult, setNlpResult] = useState(null)

  // Structured Questionnaire Fields
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [symptomLocation, setSymptomLocation] = useState("chest")
  const [onsetDateTime, setOnsetDateTime] = useState(() => {
    const now = new Date()
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  })
  const [onsetType, setOnsetType] = useState("not_sure") // "sudden", "gradual", "not_sure"
  const [duration, setDuration] = useState("not_sure")   // "<15m", "15-30m", "1-2h", ">2h", "days", "not_sure"
  const [severity, setSeverity] = useState("not_sure")   // "mild", "moderate", "severe", "not_sure"
  const [isWorsening, setIsWorsening] = useState("not_sure") // "worsening", "same", "improving", "not_sure"

  // Medical History
  const [medicalHistory, setMedicalHistory] = useState({
    diabetes: "no",
    high_blood_pressure: "no",
    high_cholesterol: "no",
    previous_heart_disease: "no",
    previous_heart_attack: "no",
    previous_stroke: "no",
    current_medications: "",
    allergies: "",
    other_conditions: ""
  })

  // Geolocation & Emergency Sharing
  const [locationCoords, setLocationCoords] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationShared, setLocationShared] = useState(false)
  const [trustedContacts, setTrustedContacts] = useState([])
  const [showContactModal, setShowContactModal] = useState(false)
  const [showEmergencyShareModal, setShowEmergencyShareModal] = useState(false)
  const [newContact, setNewContact] = useState({ name: "", relationship: "Family", phone: "" })

  // Triage Evaluation Result
  const [triageResult, setTriageResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  // Speech Recognition reference
  const recognitionRef = useRef(null)

  // Load user's trusted contacts
  useEffect(() => {
    api
      .get("/symptoms/trusted-contacts")
      .then((res) => setTrustedContacts(res.data || []))
      .catch(() => {})
  }, [user])

  // Quick symptom chips (bilingual)
  const QUICK_SYMPTOMS = [
    { id: "chest_pain", en: "Chest Pain / Pressure", ta: "நெஞ்சு வலி / இறுக்கம்" },
    { id: "shortness_of_breath", en: "Difficulty Breathing", ta: "மூச்சுத் திணறல்" },
    { id: "palpitations", en: "Heart Beating Fast", ta: "இதயம் வேகமாக துடிக்கிறது" },
    { id: "dizziness_syncope", en: "Dizziness / Fainting", ta: "தலைச்சுற்றல் / மயக்கம்" },
    { id: "radiating_pain", en: "Pain in Left Arm / Jaw", ta: "இடது கை / தாடை வலி" },
    { id: "diaphoresis_sweating", en: "Cold Sweating", ta: "குளிர்ந்த வியர்வை" },
    { id: "nausea_vomiting", en: "Nausea / Vomiting", ta: "குமட்டல் / வாந்தி" },
    { id: "fatigue_weakness", en: "Extreme Weakness", ta: "உடல் சோர்வு / பலவீனம்" },
    { id: "stroke_symptoms", en: "Facial Droop / Slurred Speech", ta: "முகம் கோணல் / பேச்சு சிரமம்" },
    { id: "peripheral_edema", en: "Swollen Legs / Ankles", ta: "கால் வீக்கம் / பாத வீக்கம்" }
  ]

  // Setup Web Speech API for English and Tamil
  const toggleVoiceRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert(
        lang === "ta"
          ? "உங்கள் உலாவியில் குரல் பதிவு ஆதரவு இல்லை. தயவுசெய்து தட்டச்சு செய்யவும்."
          : "Voice recognition is not supported in this browser. Please type your symptoms."
      )
      return
    }

    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop()
      setIsRecording(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = lang === "ta" ? "ta-IN" : "en-IN"
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => setIsRecording(true)
      recognition.onend = () => setIsRecording(false)
      recognition.onerror = () => setIsRecording(false)

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript))
        // Trigger auto NLP extraction on spoken input
        triggerNlpExtraction(description ? `${description} ${transcript}` : transcript)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (e) {
      setIsRecording(false)
    }
  }

  // Trigger NLP extraction
  const triggerNlpExtraction = async (textToAnalyze) => {
    const query = textToAnalyze || description
    if (!query || query.trim().length < 3) return

    setNlpLoading(true)
    try {
      const res = await api.post("/symptoms/extract-nlp", {
        text: query,
        language: lang === "ta" ? "ta" : "auto"
      })
      setNlpResult(res.data)

      // Auto-populate identified symptoms
      if (res.data.extracted_symptoms && res.data.extracted_symptoms.length > 0) {
        const ids = res.data.extracted_symptoms.map((s) => s.symptom_id)
        setSelectedSymptoms((prev) => Array.from(new Set([...prev, ...ids])))
      }

      if (res.data.severity_detected) setSeverity(res.data.severity_detected)
      if (res.data.onset_detected) setOnsetType(res.data.onset_detected)
      if (res.data.trend_detected) setIsWorsening(res.data.trend_detected)
    } catch (err) {
      console.error("NLP extraction failed:", err)
    } finally {
      setNlpLoading(false)
    }
  }

  const toggleSymptomSelection = (id) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Request browser Geolocation with user consent
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        })
        setLocationShared(true)
        setLocationLoading(false)
      },
      (err) => {
        setLocationLoading(false)
        alert(
          lang === "ta"
            ? "இருப்பிடத்தை அணுக அனுமதி மறுக்கப்பட்டது. அவசர சேவைகளிடம் உங்கள் முகவரியை நேரடியாக கூறவும்."
            : "Location access denied. Please tell emergency responders your exact street address."
        )
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  // Add trusted contact
  const handleAddContact = async (e) => {
    e.preventDefault()
    if (!newContact.name || !newContact.phone) return
    try {
      const res = await api.post("/symptoms/trusted-contacts", newContact)
      setTrustedContacts((prev) => [...prev, res.data])
      setNewContact({ name: "", relationship: "Family", phone: "" })
      setShowContactModal(false)
    } catch (err) {
      console.error("Failed to add contact:", err)
    }
  }

  // Delete trusted contact
  const handleDeleteContact = async (contactId) => {
    try {
      await api.delete(`/symptoms/trusted-contacts/${contactId}`)
      setTrustedContacts((prev) => prev.filter((c) => c.id !== contactId))
    } catch (err) {
      console.error("Failed to delete contact:", err)
    }
  }

  // Copy emergency summary to clipboard
  const handleCopySummary = () => {
    if (!triageResult) return
    navigator.clipboard.writeText(triageResult.emergency_summary_text)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 3000)
  }

  // Submit triage to Clinical Rule Engine
  const handleEvaluateTriage = async () => {
    setSubmitting(true)
    try {
      const payload = {
        symptom_description: description,
        language: lang,
        reported_symptoms: selectedSymptoms,
        symptom_location: symptomLocation,
        symptom_onset_datetime: onsetDateTime,
        onset_type: onsetType,
        duration: duration,
        severity: severity,
        is_worsening: isWorsening,
        medical_history: medicalHistory,
        latitude: locationCoords?.latitude || null,
        longitude: locationCoords?.longitude || null,
        share_location_consent: locationShared
      }

      const res = await api.post("/symptoms/triage", payload)
      setTriageResult(res.data)
      setStep(6) // Move to Assessment Result screen
    } catch (err) {
      console.error("Clinical triage failed:", err)
    } finally {
      setSubmitting(false)
    }
  }

  // Fast emergency check: if critical red flags detected in Step 1, allow instant 1-click evaluation
  const hasCriticalRedFlag =
    nlpResult?.has_emergency_keywords ||
    selectedSymptoms.includes("stroke_symptoms") ||
    (selectedSymptoms.includes("chest_pain") &&
      (selectedSymptoms.includes("diaphoresis_sweating") || selectedSymptoms.includes("shortness_of_breath")))

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl glass-card border border-teal-500/20 bg-gradient-to-r from-teal-950/40 via-slate-900/60 to-slate-950/80 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-teal-950/50 flex-shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-500/30">
              {lang === "ta" ? "AI உடனடி அவசர வகைப்பாடு" : "AI Clinical Triage System"}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              {lang === "ta" ? "AI அறிகுறி பரிசோதனை & அவசர உதவி" : "AI Symptom Checker & Clinical Triage"}
            </h1>
            <p className="text-xs text-slate-300">
              {lang === "ta"
                ? "மருத்துவ பரிசோதனை முடிவுகள் தேவையில்லை. உங்கள் அறிகுறிகளை எளிய தமிழில் விவரிக்கவும்."
                : "No lab test results required. Describe your symptoms in simple everyday language."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Link
            to="/symptom-history"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <History className="w-4 h-4 text-teal-400" />
            <span>{lang === "ta" ? "அறிகுறி வரலாறு" : "Symptom History"}</span>
          </Link>
          <a
            href="tel:112"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-950/40 animate-pulse"
          >
            <PhoneCall className="w-4 h-4" />
            <span>112</span>
          </a>
        </div>
      </div>

      {/* Immediate Red Flag Warning Banner if Emergency Detected early */}
      {hasCriticalRedFlag && step < 6 && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border-2 border-rose-500 text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0 animate-bounce" />
            <div>
              <p className="text-xs font-extrabold text-white">
                {lang === "ta"
                  ? "எச்சரிக்கை: தீவிர அவசர அறிகுறிகள் கண்டறியப்பட்டன!"
                  : "CRITICAL ALERT: Emergency warning symptoms detected!"}
              </p>
              <p className="text-[11px] text-rose-200">
                {lang === "ta"
                  ? "கேள்வித்தாளை பூர்த்தி செய்ய காத்திருக்க வேண்டாம். உடனடியாக 112-ஐ அழைக்கவும் அல்லது உடனடி மதிப்பீட்டை பார்க்கவும்."
                  : "Do not wait to finish all questions. Call 112 immediately or view immediate instructions."}
              </p>
            </div>
          </div>
          <button
            onClick={handleEvaluateTriage}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-950/50 flex items-center justify-center gap-1.5 flex-shrink-0"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>{lang === "ta" ? "உடனடி மதிப்பீடு" : "Evaluate Immediately"}</span>
          </button>
        </div>
      )}

      {/* Wizard Progress Steps (Steps 1 to 5) */}
      {step < 6 && (
        <div className="glass-card rounded-2xl p-3 border border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs font-semibold text-slate-400">
          <div className={`flex items-center gap-1.5 ${step === 1 ? "text-teal-400 font-bold" : step > 1 ? "text-emerald-400" : ""}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? "bg-teal-500 text-slate-950" : step > 1 ? "bg-emerald-500 text-slate-950" : "bg-slate-800"}`}>1</span>
            <span className="hidden sm:inline">{lang === "ta" ? "விவரம்" : "Symptoms"}</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

          <div className={`flex items-center gap-1.5 ${step === 2 ? "text-teal-400 font-bold" : step > 2 ? "text-emerald-400" : ""}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? "bg-teal-500 text-slate-950" : step > 2 ? "bg-emerald-500 text-slate-950" : "bg-slate-800"}`}>2</span>
            <span className="hidden sm:inline">{lang === "ta" ? "உறுதிப்படுத்துக" : "Confirm"}</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

          <div className={`flex items-center gap-1.5 ${step === 3 ? "text-teal-400 font-bold" : step > 3 ? "text-emerald-400" : ""}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? "bg-teal-500 text-slate-950" : step > 3 ? "bg-emerald-500 text-slate-950" : "bg-slate-800"}`}>3</span>
            <span className="hidden sm:inline">{lang === "ta" ? "நேரம் & காலம்" : "Onset"}</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

          <div className={`flex items-center gap-1.5 ${step === 4 ? "text-teal-400 font-bold" : step > 4 ? "text-emerald-400" : ""}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 4 ? "bg-teal-500 text-slate-950" : step > 4 ? "bg-emerald-500 text-slate-950" : "bg-slate-800"}`}>4</span>
            <span className="hidden sm:inline">{lang === "ta" ? "தீவிரம்" : "Severity"}</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

          <div className={`flex items-center gap-1.5 ${step === 5 ? "text-teal-400 font-bold" : ""}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 5 ? "bg-teal-500 text-slate-950" : "bg-slate-800"}`}>5</span>
            <span className="hidden sm:inline">{lang === "ta" ? "மருத்துவ வரலாறு" : "History"}</span>
          </div>
        </div>
      )}

      {/* STEP 1: DESCRIBE SYMPTOMS (Free-text, Voice, Quick Chips, NLP live analysis) */}
      {step === 1 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-900/80 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <span>{lang === "ta" ? "படி 1: உங்கள் அறிகுறிகளை விவரிக்கவும்" : "Step 1: What symptoms are you experiencing?"}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {lang === "ta"
                ? "நீங்கள் உணர்வதை எளிய வார்த்தைகளில் தட்டச்சு செய்யவும் அல்லது பேசவும்."
                : "Describe your discomfort in everyday language or tap the microphone to speak."}
            </p>
          </div>

          {/* Quick Symptoms Suggestion Chips */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              {lang === "ta" ? "விரைவு தேர்வு (கிளிக் செய்யவும்):" : "Quick Symptom Tags (Tap to add):"}
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_SYMPTOMS.map((item) => {
                const isSelected = selectedSymptoms.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      toggleSymptomSelection(item.id)
                      const textAddition = lang === "ta" ? item.ta : item.en
                      if (!description.includes(textAddition)) {
                        setDescription((prev) => (prev ? `${prev}, ${textAddition}` : textAddition))
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-950/40"
                        : "bg-slate-950/60 hover:bg-slate-800 border border-slate-700/80 text-slate-300"
                    }`}
                  >
                    <span>{isSelected ? "✓" : "+"}</span>
                    <span>{lang === "ta" ? item.ta : item.en}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Free-text area with voice input */}
          <div className="space-y-2 relative">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                {lang === "ta" ? "உங்கள் வார்த்தைகளில் விவரிக்கவும்:" : "Describe what you feel in your own words:"}
              </label>
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isRecording
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30"
                }`}
                title="Voice Input (Tamil / English)"
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-teal-400" />}
                <span>
                  {isRecording
                    ? lang === "ta" ? "கேட்கிறது..." : "Listening..."
                    : lang === "ta" ? "குரல் வழி பதிவு (மைக்)" : "Voice Input (Mic)"}
                </span>
              </button>
            </div>

            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                lang === "ta"
                  ? "எடுத்துக்காட்டு: எனக்கு 20 நிமிடமாக கடுமையான நெஞ்சு வலி இருக்கிறது, இடது கையில் வலி பரவுகிறது மற்றும் குளிர்ந்த வியர்வை கொட்டுகிறது..."
                  : "e.g., I have chest pain and cold sweating, feeling difficulty breathing for the past 20 minutes..."
              }
              className="w-full rounded-2xl bg-slate-950/80 border border-slate-700 p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />

            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={nlpLoading || !description.trim()}
                onClick={() => triggerNlpExtraction(description)}
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{nlpLoading ? (lang === "ta" ? "ஆராய்கிறது..." : "Analyzing...") : (lang === "ta" ? "AI மூலம் ஆராய்க" : "Analyze via Medical NLP")}</span>
              </button>
              <span className="text-[10px] text-slate-500">{description.length} characters</span>
            </div>
          </div>

          {/* Real-Time NLP Extraction Badges */}
          {nlpResult && nlpResult.extracted_symptoms && nlpResult.extracted_symptoms.length > 0 && (
            <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                  {lang === "ta" ? "NLP கண்டறிந்த அறிகுறிகள்:" : "NLP Detected Medical Entities:"}
                </span>
                <span className="text-[10px] text-slate-400">Language: {nlpResult.detected_language?.toUpperCase()}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {nlpResult.extracted_symptoms.map((item) => (
                  <span
                    key={item.symptom_id}
                    className="px-2.5 py-1 rounded-lg bg-teal-900/60 border border-teal-500/40 text-teal-200 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3 text-teal-400" />
                    <span>{lang === "ta" ? item.symptom_name_ta : item.symptom_name}</span>
                    {item.location && <span className="text-[10px] text-teal-400/80">({item.location})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Step 1 Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-[11px] text-slate-400">
              {lang === "ta" ? "குறைந்தது ஒரு அறிகுறியை தேர்வு செய்யவும்" : "Select or describe at least 1 symptom"}
            </span>
            <button
              type="button"
              disabled={selectedSymptoms.length === 0 && !description.trim()}
              onClick={() => {
                if (!nlpResult && description.trim()) triggerNlpExtraction(description)
                setStep(2)
              }}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-950/50 disabled:opacity-50"
            >
              <span>{lang === "ta" ? "அடுத்த படி" : "Next: Confirm Details"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CONFIRM SYMPTOMS & LOCATION */}
      {step === 2 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-900/80 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-400" />
              <span>{lang === "ta" ? "படி 2: அறிகுறிகள் & வலி உள்ள இடம்" : "Step 2: Confirm Symptoms & Location"}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {lang === "ta"
                ? "நீங்கள் தற்போது உணரும் அனைத்து அறிகுறிகளையும் உறுதிப்படுத்தவும்."
                : "Check all active symptoms that apply right now."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUICK_SYMPTOMS.map((item) => {
              const isChecked = selectedSymptoms.includes(item.id)
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSymptomSelection(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                    isChecked
                      ? "bg-teal-950/30 border-teal-500 text-teal-100 shadow-sm"
                      : "bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <span className="font-semibold">{lang === "ta" ? item.ta : item.en}</span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                  />
                </div>
              )
            })}
          </div>

          {/* Primary Symptom Location */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-slate-300 block">
              {lang === "ta" ? "முக்கிய வலி / அசௌகரியம் உள்ள இடம்:" : "Primary anatomical location of discomfort:"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "chest", label: "Chest (Center / Left)", label_ta: "மார்பு / நெஞ்சு" },
                { id: "left_arm", label: "Left Arm / Shoulder", label_ta: "இடது கை / தோள்பட்டை" },
                { id: "jaw_neck", label: "Jaw / Neck / Back", label_ta: "தாடை / கழுத்து / முதுகு" },
                { id: "generalized", label: "Generalized / Whole Body", label_ta: "முழு உடல் / பரவலானது" }
              ].map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setSymptomLocation(loc.id)}
                  className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                    symptomLocation === loc.id
                      ? "bg-teal-500/20 border-teal-500 text-teal-300 font-bold"
                      : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {lang === "ta" ? loc.label_ta : loc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{lang === "ta" ? "பின்னால்" : "Back"}</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-950/50"
            >
              <span>{lang === "ta" ? "அடுத்த படி: நேரம்" : "Next: Onset & Duration"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ONSET & DURATION */}
      {step === 3 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-900/80 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-400" />
              <span>{lang === "ta" ? "படி 3: அறிகுறிகள் எப்போது ஆரம்பித்தன?" : "Step 3: When did symptoms start?"}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {lang === "ta"
                ? "தொடக்க நேரம் மற்றும் காலம் இதய அவசர மதிப்பீட்டிற்கு மிக முக்கியமானது."
                : "Onset timing and duration are critical parameters in clinical cardiovascular triage."}
            </p>
          </div>

          {/* Exact Date & Time */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              {lang === "ta" ? "அறிகுறிகள் தொடங்கிய தேதி மற்றும் நேரம்:" : "Exact symptom onset date and time:"}
            </label>
            <input
              type="datetime-local"
              value={onsetDateTime}
              onChange={(e) => setOnsetDateTime(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Sudden vs Gradual */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              {lang === "ta" ? "அறிகுறிகள் திடீரென தொடங்கினவா அல்லது படிப்படியாகவா?" : "Did symptoms start suddenly or gradually?"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "sudden", label: "Suddenly (All at once)", label_ta: "திடீரென (உடனடியாக)" },
                { id: "gradual", label: "Gradually (Slowly over time)", label_ta: "படிப்படியாக (மெதுவாக)" },
                { id: "not_sure", label: "Not Sure / Don't Know", label_ta: "உறுதியாக தெரியவில்லை" }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOnsetType(opt.id)}
                  className={`p-3 rounded-2xl text-xs font-semibold border text-center transition-all ${
                    onsetType === opt.id
                      ? "bg-teal-500/20 border-teal-500 text-teal-300 font-bold shadow-sm"
                      : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {lang === "ta" ? opt.label_ta : opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              {lang === "ta" ? "எவ்வளவு நேரமாக இந்த பிரச்சனை உள்ளது?" : "How long have you experienced these symptoms?"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: "<15m", label: "< 15 minutes", label_ta: "15 நிமிடத்திற்குள்" },
                { id: "15-30m", label: "15 – 30 minutes", label_ta: "15 – 30 நிமிடம்" },
                { id: "1-2h", label: "1 – 2 hours", label_ta: "1 – 2 மணி நேரம்" },
                { id: ">2h", label: "More than 2 hours", label_ta: "2 மணி நேரத்திற்கு மேல்" },
                { id: "days", label: "Days / Weeks", label_ta: "பல நாட்களாக" }
              ].map((dur) => (
                <button
                  key={dur.id}
                  type="button"
                  onClick={() => setDuration(dur.id)}
                  className={`p-3 rounded-2xl text-xs font-semibold border text-center transition-all ${
                    duration === dur.id
                      ? "bg-teal-500/20 border-teal-500 text-teal-300 font-bold shadow-sm"
                      : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {lang === "ta" ? dur.label_ta : dur.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{lang === "ta" ? "பின்னால்" : "Back"}</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-950/50"
            >
              <span>{lang === "ta" ? "அடுத்த படி: தீவிரம்" : "Next: Severity"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SEVERITY & TRAJECTORY */}
      {step === 4 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-900/80 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" />
              <span>{lang === "ta" ? "படி 4: வலியின் தீவிரம் & முன்னேற்றம்" : "Step 4: Severity & Symptom Trend"}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {lang === "ta"
                ? "வலி எவ்வளவு தீவிரமாக உள்ளது மற்றும் அதிகமாகிறதா என்பதை தேர்வு செய்யவும்."
                : "Select the perceived severity and whether symptoms are worsening."}
            </p>
          </div>

          {/* Severity Options */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              {lang === "ta" ? "பிரச்சனை எவ்வளவு தீவிரமாக உள்ளது?" : "How severe is the problem?"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "mild", label: "Mild (Noticeable but bearable)", label_ta: "லேசானது (தாங்கக்கூடியது)", color: "text-emerald-400" },
                { id: "moderate", label: "Moderate (Uncomfortable)", label_ta: "மிதமானது (சிரமமானது)", color: "text-amber-400" },
                { id: "severe", label: "Severe (Intense / Unbearable)", label_ta: "கடுமையானது (தாங்க முடியாதது)", color: "text-rose-400" },
                { id: "not_sure", label: "Not Sure / Don't Know", label_ta: "உறுதியாக தெரியவில்லை", color: "text-slate-400" }
              ].map((sev) => (
                <button
                  key={sev.id}
                  type="button"
                  onClick={() => setSeverity(sev.id)}
                  className={`p-3.5 rounded-2xl text-xs font-bold border text-center transition-all ${
                    severity === sev.id
                      ? "bg-teal-500/20 border-teal-500 text-white shadow-md shadow-teal-950/40"
                      : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className={sev.color}>{lang === "ta" ? sev.label_ta : sev.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Trend / Worsening */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              {lang === "ta" ? "அறிகுறிகள் அதிகமாகிறதா அல்லது குறைகிறதா?" : "Are symptoms getting worse over time?"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "worsening", label: "Getting Worse (Escalating)", label_ta: "அதிகமாகிறது (மோசமாகிறது)", alert: true },
                { id: "same", label: "Staying the Same (Constant)", label_ta: "மாற்றமில்லை (ஒரே அளவில்)" },
                { id: "improving", label: "Getting Better (Easing)", label_ta: "குறைகிறது (குணமாகிறது)" },
                { id: "not_sure", label: "Not Sure / Fluctuating", label_ta: "உறுதியாக தெரியவில்லை" }
              ].map((tr) => (
                <button
                  key={tr.id}
                  type="button"
                  onClick={() => setIsWorsening(tr.id)}
                  className={`p-3.5 rounded-2xl text-xs font-semibold border text-center transition-all ${
                    isWorsening === tr.id
                      ? tr.alert
                        ? "bg-rose-500/20 border-rose-500 text-rose-300 font-bold"
                        : "bg-teal-500/20 border-teal-500 text-teal-300 font-bold"
                      : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {lang === "ta" ? tr.label_ta : tr.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{lang === "ta" ? "பின்னால்" : "Back"}</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEvaluateTriage}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700"
                title="Skip medical history and evaluate symptoms immediately"
              >
                {lang === "ta" ? "வரலாற்றை தவிர் (உடனே பரிசோதி)" : "Skip History (Evaluate Now)"}
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-950/50"
              >
                <span>{lang === "ta" ? "அடுத்த படி: மருத்துவ வரலாறு" : "Next: Medical History"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: MEDICAL HISTORY (Non-compulsory, with "Not Sure" options) */}
      {step === 5 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-900/80 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-teal-400" />
              <span>{lang === "ta" ? "படி 5: மருத்துவ வரலாறு (விருப்பமிருந்தால்)" : "Step 5: Relevant Medical History (Optional)"}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {lang === "ta"
                ? "தெரியாத விவரங்களுக்கு 'தெரியாது' என்பதை தேர்வு செய்யவும். அவசர நிலைகளுக்கு இது கட்டாயமில்லை."
                : "Select 'Not Sure' if unknown. Never mandatory when acute symptoms are already present."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "diabetes", label: "Diabetes Mellitus", label_ta: "சர்க்கரை நோய் (நீரிழிவு)" },
              { key: "high_blood_pressure", label: "High Blood Pressure (Hypertension)", label_ta: "உயர் இரத்த அழுத்தம்" },
              { key: "high_cholesterol", label: "High Cholesterol", label_ta: "அதிக கொலஸ்ட்ரால்" },
              { key: "previous_heart_disease", label: "Previous Heart Disease (CAD / Stent)", label_ta: "இதய நோய் / ஸ்டென்ட் அறுவை சிகிச்சை" },
              { key: "previous_heart_attack", label: "Previous Heart Attack (MI)", label_ta: "முந்தைய மாரடைப்பு" },
              { key: "previous_stroke", label: "Previous Stroke or TIA", label_ta: "முந்தைய பக்கவாதம்" }
            ].map((hist) => (
              <div key={hist.key} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-white block">
                  {lang === "ta" ? hist.label_ta : hist.label}
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {["yes", "no", "not_sure"].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMedicalHistory((prev) => ({ ...prev, [hist.key]: val }))}
                      className={`py-1.5 rounded-xl text-[11px] font-semibold border transition-all ${
                        medicalHistory[hist.key] === val
                          ? "bg-teal-500 text-slate-950 font-bold border-teal-400"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {val === "yes"
                        ? lang === "ta" ? "ஆம்" : "Yes"
                        : val === "no"
                        ? lang === "ta" ? "இல்லை" : "No"
                        : lang === "ta" ? "தெரியாது" : "Not Sure"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Current Medications & Allergies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                {lang === "ta" ? "தற்போது உட்கொள்ளும் மருந்துகள் (ஏதேனும் இருப்பின்):" : "Current Medications (if any):"}
              </label>
              <input
                type="text"
                placeholder={lang === "ta" ? "எ.கா: அஸ்பிரின், அட்டோர்வாஸ்டாடின்..." : "e.g., Aspirin, Atorvastatin, Metoprolol..."}
                value={medicalHistory.current_medications}
                onChange={(e) => setMedicalHistory((prev) => ({ ...prev, current_medications: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                {lang === "ta" ? "மருந்து ஒவ்வாமை / Allergies:" : "Drug Allergies (if any):"}
              </label>
              <input
                type="text"
                placeholder={lang === "ta" ? "எ.கா: அஸ்பிரின் ஒவ்வாமை..." : "e.g., Aspirin allergy, penicillin, none known..."}
                value={medicalHistory.allergies}
                onChange={(e) => setMedicalHistory((prev) => ({ ...prev, allergies: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{lang === "ta" ? "பின்னால்" : "Back"}</span>
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleEvaluateTriage}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-xl shadow-teal-950/60 disabled:opacity-50 transition-all hover:scale-105"
            >
              <Stethoscope className="w-4 h-4" />
              <span>{submitting ? (lang === "ta" ? "மதிப்பிடுகிறது..." : "Evaluating Triage...") : (lang === "ta" ? "முழு மருத்துவ வகைப்பாடு செய்க" : "Run Clinical Triage Evaluation")}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: ASSESSMENT RESULT (FOUR-LEVEL URGENCY CLASSIFICATION) */}
      {step === 6 && triageResult && (
        <div className="space-y-6">
          {/* LEVEL 1: EMERGENCY DISPLAY SCREEN */}
          {triageResult.urgency_level === 1 && (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-rose-950 via-rose-900/60 to-slate-950 border-2 border-rose-500 text-rose-100 shadow-2xl space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse shadow-lg shadow-rose-950/80">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 bg-rose-950 px-3 py-1 rounded-full border border-rose-400/40">
                    {lang === "ta" ? triageResult.badge_label_ta : triageResult.badge_label}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {lang === "ta" ? triageResult.summary_headline_ta : triageResult.summary_headline}
                  </h2>
                  <p className="text-xs sm:text-sm text-rose-200 leading-relaxed font-medium">
                    {lang === "ta" ? triageResult.explanation_ta : triageResult.explanation}
                  </p>
                </div>
              </div>

              {/* Large Emergency 112 / 108 Call Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <a
                  href="tel:112"
                  className="py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-base sm:text-lg text-center shadow-xl shadow-rose-950/80 flex items-center justify-center gap-3 transition-transform hover:scale-105"
                >
                  <PhoneCall className="w-6 h-6 animate-bounce" />
                  <span>{lang === "ta" ? "112-ஐ அழைக்கவும் (தேசிய அவசரம்)" : "CALL 112 (National Emergency)"}</span>
                </a>
                <a
                  href="tel:108"
                  className="py-4 px-6 rounded-2xl bg-rose-700 hover:bg-rose-600 text-white font-black text-base sm:text-lg text-center shadow-xl shadow-rose-950/80 flex items-center justify-center gap-3 transition-transform hover:scale-105"
                >
                  <PhoneCall className="w-6 h-6 animate-bounce" />
                  <span>{lang === "ta" ? "108-ஐ அழைக்கவும் (ஆம்புலன்ஸ்)" : "CALL 108 (Ambulance Dispatch)"}</span>
                </a>
              </div>

              {/* Reported Symptoms and Onset Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-xs">
                <div>
                  <span className="text-rose-400 font-bold block">{lang === "ta" ? "அறிகுறிகள்:" : "Reported Symptoms:"}</span>
                  <span className="text-white font-semibold">
                    {triageResult.reported_symptoms_summary?.join(", ") || "Acute symptoms"}
                  </span>
                </div>
                <div>
                  <span className="text-rose-400 font-bold block">{lang === "ta" ? "தொடக்க நேரம்:" : "Symptom Onset:"}</span>
                  <span className="text-white font-semibold">{triageResult.onset_time_display}</span>
                </div>
                <div>
                  <span className="text-rose-400 font-bold block">{lang === "ta" ? "கால அளவு / தீவிரம்:" : "Duration & Severity:"}</span>
                  <span className="text-white font-semibold">
                    {triageResult.duration_display} ({triageResult.severity_display})
                  </span>
                </div>
              </div>

              {/* Clinician-Reviewed First-Response Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-rose-900/40 border border-rose-500/40 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-black text-emerald-300 uppercase tracking-wide">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{lang === "ta" ? "உடனடியாக செய்ய வேண்டியவை (DOs):" : "What you MUST do right now:"}</span>
                  </div>
                  <ul className="space-y-1.5 text-rose-100 list-disc list-inside">
                    {triageResult.first_response_guidance?.do_actions?.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-rose-900/40 border border-rose-500/40 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-black text-rose-300 uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{lang === "ta" ? "செய்யக்கூடாதவை (DONTs):" : "What you MUST AVOID:"}</span>
                  </div>
                  <ul className="space-y-1.5 text-rose-200 list-disc list-inside">
                    {triageResult.first_response_guidance?.dont_actions?.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Location Sharing & Trusted Contact Options */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-rose-500/30 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-rose-400" />
                  <span>{lang === "ta" ? "அவசர விவரப் பகிர்வு & இருப்பிடம்:" : "Emergency Summary Sharing & Live Location:"}</span>
                </h4>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmergencyShareModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-rose-950/70 transition-transform hover:scale-105"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{lang === "ta" ? "அவசர விவரங்களைப் பகிர்க" : "Share Emergency Details"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRequestLocation}
                    disabled={locationLoading || locationShared}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      locationShared
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-rose-400" />
                    <span>
                      {locationLoading
                        ? lang === "ta" ? "இருப்பிடத்தை கண்டறிகிறது..." : "Detecting GPS..."
                        : locationShared
                        ? lang === "ta" ? "✓ இருப்பிடம் இணைக்கப்பட்டது" : "✓ GPS Location Attached"
                        : lang === "ta" ? "என் இருப்பிடத்தை இணைக்க (GPS)" : "Attach My Live Location (GPS)"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5"
                  >
                    <Copy className="w-4 h-4 text-teal-400" />
                    <span>{copySuccess ? (lang === "ta" ? "நகலெடுக்கப்பட்டது!" : "Copied!") : (lang === "ta" ? "அவசர குறிப்பை நகலெடு" : "Copy Emergency Note")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowContactModal(true)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold border border-teal-500/30 flex items-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{lang === "ta" ? "நம்பகமான தொடர்புகள்" : "Trusted Contacts"} ({trustedContacts.length})</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LEVEL 2: URGENT MEDICAL EVALUATION SCREEN */}
          {triageResult.urgency_level === 2 && (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border-2 border-amber-500 text-amber-100 shadow-2xl space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-950/80 font-black">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950 px-3 py-1 rounded-full border border-amber-400/40">
                    {lang === "ta" ? triageResult.badge_label_ta : triageResult.badge_label}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {lang === "ta" ? triageResult.summary_headline_ta : triageResult.summary_headline}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {lang === "ta" ? triageResult.explanation_ta : triageResult.explanation}
                  </p>
                </div>
              </div>

              {triageResult.uncertainty_notice && (
                <div className="p-3.5 rounded-2xl bg-amber-900/30 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{lang === "ta" ? triageResult.uncertainty_notice_ta : triageResult.uncertainty_notice}</span>
                </div>
              )}

              {/* Interim Safe Guidance */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-amber-500/30 space-y-3 text-xs">
                <h4 className="font-bold text-white text-sm">
                  {lang === "ta" ? "மருத்துவரை அணுகும் முன் செய்ய வேண்டியவை:" : "Safe Interim Actions While Arranging Care:"}
                </h4>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                  {triageResult.first_response_guidance?.do_actions?.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmergencyShareModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-950/60 transition-transform hover:scale-105"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{lang === "ta" ? "அவசர விவரங்களைப் பகிர்க" : "Share Clinical Summary & GPS"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4 text-teal-400" />
                  <span>{copySuccess ? "Copied!" : (lang === "ta" ? "மருத்துவ குறிப்பை நகலெடு" : "Copy Clinical Summary")}</span>
                </button>
                <Link
                  to="/symptom-history"
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <History className="w-4 h-4" />
                  <span>{lang === "ta" ? "அறிகுறி வரலாற்றில் காண்க" : "View in Symptom History"}</span>
                </Link>
              </div>
            </div>
          )}

          {/* LEVEL 3: ROUTINE MEDICAL FOLLOW-UP SCREEN */}
          {triageResult.urgency_level === 3 && (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-950 border-2 border-teal-500/50 text-slate-100 shadow-2xl space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-950/60 font-black">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-300 bg-teal-950 px-3 py-1 rounded-full border border-teal-400/40">
                    {lang === "ta" ? triageResult.badge_label_ta : triageResult.badge_label}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {lang === "ta" ? triageResult.summary_headline_ta : triageResult.summary_headline}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {lang === "ta" ? triageResult.explanation_ta : triageResult.explanation}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
                <h4 className="font-bold text-white text-sm">
                  {lang === "ta" ? "பரிந்துரைக்கப்படும் ஆலோசனைகள்:" : "Recommended Clinical Guidance:"}
                </h4>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                  {triageResult.first_response_guidance?.do_actions?.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/symptom-history"
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <History className="w-4 h-4" />
                  <span>{lang === "ta" ? "அறிகுறி வரலாற்றில் காண்க" : "View in Symptom History"}</span>
                </Link>
              </div>
            </div>
          )}

          {/* LEVEL 4: GENERAL SELF-CARE GUIDANCE SCREEN */}
          {triageResult.urgency_level === 4 && (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-2 border-emerald-500/50 text-slate-100 shadow-2xl space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-950/60 font-black">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-400/40">
                    {lang === "ta" ? triageResult.badge_label_ta : triageResult.badge_label}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {lang === "ta" ? triageResult.summary_headline_ta : triageResult.summary_headline}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {lang === "ta" ? triageResult.explanation_ta : triageResult.explanation}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
                <h4 className="font-bold text-white text-sm">
                  {lang === "ta" ? "இதய நல பராமரிப்பு பழக்கங்கள்:" : "Heart Wellness & Precautionary Guidance:"}
                </h4>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                  {triageResult.first_response_guidance?.do_actions?.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/symptom-history"
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <History className="w-4 h-4" />
                  <span>{lang === "ta" ? "அறிகுறி வரலாற்றில் காண்க" : "View in Symptom History"}</span>
                </Link>
              </div>
            </div>
          )}

          {/* Documented Clinical Guideline Citations Card */}
          {triageResult.matched_rules && triageResult.matched_rules.length > 0 && (
            <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800 bg-slate-900/60 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-400" />
                <span>{lang === "ta" ? "சான்றளிக்கப்பட்ட மருத்துவ வழிகாட்டுதல் ஆதாரங்கள்:" : "Validated Clinical Decision Rule Citations:"}</span>
              </h3>
              <div className="space-y-2">
                {triageResult.matched_rules.map((rule, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{rule.rule_name}</span>
                      <span className="text-[10px] text-teal-400 font-mono bg-teal-950 px-2 py-0.5 rounded border border-teal-500/30">{rule.rule_id}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">Source: {rule.guideline_source}</p>
                    <p className="text-[10px] text-slate-500 italic">Citation: {rule.citation}</p>
                    <p className="text-[11px] text-teal-300/80">Trigger: {rule.trigger_criteria}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset / Start New Check */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => {
                setStep(1)
                setDescription("")
                setSelectedSymptoms([])
                setTriageResult(null)
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-teal-400" />
              <span>{lang === "ta" ? "புதிய அறிகுறி பரிசோதனை தொடங்குக" : "Start New Symptom Assessment"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Trusted Contacts Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card rounded-3xl p-6 border border-slate-700 bg-slate-900 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-teal-400" />
                <span>{lang === "ta" ? "நம்பகமான அவசர தொடர்புகள்" : "Trusted Emergency Contacts"}</span>
              </h3>
              <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {trustedContacts.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  {lang === "ta" ? "தொடர்புகள் எதுவும் சேமிக்கப்படவில்லை." : "No trusted contacts saved yet."}
                </p>
              ) : (
                trustedContacts.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{c.name}</span>
                      <span className="text-[11px] text-slate-400">{c.relationship} • {c.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${c.phone}`}
                        className="p-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50"
                        title="Call Contact"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDeleteContact(c.id)}
                        className="p-1.5 rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600/40"
                        title="Delete Contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddContact} className="space-y-3 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-300 block">{lang === "ta" ? "புதிய தொடர்பை சேர்க்கவும்:" : "Add Contact:"}</span>
              <input
                type="text"
                placeholder={lang === "ta" ? "பெயர் (எ.கா: அப்பா / அண்ணன்)" : "Name (e.g. Spouse / Brother)"}
                value={newContact.name}
                onChange={(e) => setNewContact((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder={lang === "ta" ? "உறவுமுறை" : "Relationship"}
                  value={newContact.relationship}
                  onChange={(e) => setNewContact((prev) => ({ ...prev, relationship: e.target.value }))}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
                <input
                  type="tel"
                  placeholder={lang === "ta" ? "தொலைபேசி எண்" : "Phone Number"}
                  value={newContact.phone}
                  onChange={(e) => setNewContact((prev) => ({ ...prev, phone: e.target.value }))}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
              >
                {lang === "ta" ? "சேமிக்க" : "Save Contact"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Details & Location Share Modal */}
      <EmergencyLocationShareModal
        isOpen={showEmergencyShareModal}
        onClose={() => setShowEmergencyShareModal(false)}
        reportId={triageResult?.report_id}
        urgencyTier={triageResult?.urgency_tier}
        urgencyTitle={lang === "ta" ? triageResult?.urgency_title_ta : triageResult?.urgency_title}
        symptomsSummary={triageResult?.reported_symptoms_summary || []}
        onsetDisplay={triageResult?.onset_time_display}
        durationDisplay={triageResult?.duration_display}
        severityDisplay={triageResult?.severity_display}
        defaultSummaryText={triageResult?.emergency_summary_text}
      />

      {/* Safety Disclaimer */}
      <MedicalDisclaimer compact={true} />
    </div>
  )
}

export default SymptomChecker
