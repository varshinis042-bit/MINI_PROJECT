import React, { useState, useEffect } from "react"
import {
  MapPin,
  Share2,
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  MessageSquare,
  X,
  Phone,
  User,
  Navigation,
  Clock,
  HeartPulse
} from "lucide-react"
import api from "../services/api"
import { useLanguage } from "../context/LanguageContext"

export const EmergencyLocationShareModal = ({
  isOpen,
  onClose,
  reportId,
  urgencyTier = "LEVEL_1_EMERGENCY",
  urgencyTitle = "Critical Emergency",
  symptomsSummary = [],
  onsetDisplay = "Recently",
  durationDisplay = "Sudden",
  severityDisplay = "Severe",
  defaultSummaryText = ""
}) => {
  const { lang } = useLanguage()
  const isTa = lang === "ta"

  const [contacts, setContacts] = useState([])
  const [selectedContact, setSelectedContact] = useState(null)
  const [loadingContacts, setLoadingContacts] = useState(true)

  // Geolocation state
  const [locationConsent, setLocationConsent] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [locationCoords, setLocationCoords] = useState(null)
  const [readableAddress, setReadableAddress] = useState("")
  const [locationError, setLocationError] = useState("")

  // Dispatch state
  const [customNote, setCustomNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alertResponse, setAlertResponse] = useState(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadContacts()
    }
  }, [isOpen])

  const loadContacts = async () => {
    setLoadingContacts(true)
    try {
      const res = await api.get("/symptoms/trusted-contacts")
      const list = res.data || []
      setContacts(list)
      const primary = list.find((c) => c.is_primary) || list[0]
      if (primary) setSelectedContact(primary)
    } catch (err) {
      console.error("Failed to load contacts for emergency modal:", err)
    } finally {
      setLoadingContacts(false)
    }
  }

  // Request browser GPS location with permission
  const handleRequestLocation = () => {
    setLocationError("")
    if (!navigator.geolocation) {
      setLocationError(isTa ? "உங்கள் உலாவியில் GPS இருப்பிட வசதி இல்லை." : "Geolocation is not supported by your browser.")
      return
    }

    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }
        setLocationCoords(coords)
        setLocationConsent(true)
        setDetectingLocation(false)

        // Reverse geocode to get a readable address
        try {
          const geoRes = await api.post("/symptoms/reverse-geocode", coords)
          if (geoRes.data?.formatted_address) {
            setReadableAddress(geoRes.data.formatted_address)
          }
        } catch (e) {
          setReadableAddress(`GPS: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`)
        }
      },
      (err) => {
        setDetectingLocation(false)
        setLocationConsent(false)
        if (err.code === 1) {
          setLocationError(
            isTa
              ? "இருப்பிட அனுமதி மறுக்கப்பட்டது. அவசரச் செய்தி GPS இல்லாமலேயே அனுப்பப்படும்."
              : "Location permission denied. Emergency details can still be shared without GPS."
          )
        } else {
          setLocationError(
            isTa
              ? "GPS இருப்பிடத்தைக் கண்டறிய முடியவில்லை."
              : "Unable to retrieve GPS coordinates. Check device location settings."
          )
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const handleShareEmergencyDetails = async () => {
    if (!selectedContact) {
      setErrorMessage(isTa ? "தயவுசெய்து ஒரு அவசரத் தொடர்பைத் தேர்ந்தெடுக்கவும்." : "Please select or add an emergency contact first.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")
    setAlertResponse(null)

    try {
      const payload = {
        report_id: reportId,
        contact_id: selectedContact.id,
        contact_name: selectedContact.name,
        contact_phone: selectedContact.phone,
        include_location: locationConsent && locationCoords !== null,
        latitude: locationCoords?.latitude || null,
        longitude: locationCoords?.longitude || null,
        readable_address: readableAddress || null,
        custom_notes: customNote
      }

      const res = await api.post("/symptoms/send-emergency-alert", payload)
      setAlertResponse(res.data)
    } catch (err) {
      console.error("Emergency dispatch error:", err)
      setErrorMessage(
        isTa
          ? "அவசர அறிவிப்பைத் தயாரிப்பதில் பிழை ஏற்பட்டது. கீழே உள்ள நேரடி பொத்தான்களைப் பயன்படுத்தவும்."
          : "Failed to dispatch alert. Please use the direct SMS / WhatsApp buttons below."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 3000)
  }

  if (!isOpen) return null

  const mapsUrl = locationCoords
    ? `https://maps.google.com/?q=${locationCoords.latitude},${locationCoords.longitude}`
    : null

  const previewMessage = alertResponse?.emergency_message || [
    `🚨 EMERGENCY ALERT: Patient needs urgent medical attention!`,
    `Status: ${urgencyTitle}`,
    `Symptoms: ${symptomsSummary.join(", ") || "Acute symptoms"}`,
    `Onset: ${onsetDisplay} (${durationDisplay})`,
    locationCoords ? `📍 Address: ${readableAddress || "Live Coordinates Attached"}` : null,
    mapsUrl ? `🗺️ Map Link: ${mapsUrl}` : null,
    customNote ? `Note: ${customNote}` : null,
    `⚠️ Call 112 / 108 or check on them immediately.`
  ].filter(Boolean).join("\n")

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card rounded-3xl border-2 border-rose-500/80 bg-slate-900 max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl my-6 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold flex-shrink-0 animate-pulse">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isTa ? "அவசர விவரங்கள் மற்றும் இருப்பிடப் பகிர்வு" : "Share Emergency Details & Live Location"}
              </h3>
              <p className="text-[11px] text-rose-300">
                {isTa ? "நம்பகமான தொடர்பாளருக்கு உடனடி தகவல் அனுப்பவும்" : "Notify your trusted contact with symptom summary & GPS"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Critical Safety Notice Banner */}
        <div className="p-3 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-xs text-rose-200 flex items-start gap-2.5">
          <PhoneCall className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span className="leading-tight">
            <strong>{isTa ? "முதலில் 112 / 108-ஐ அழைக்கவும்: " : "First Priority: Call 112 / 108. "}</strong>
            {isTa
              ? "ஆம்புலன்ஸ் அல்லது அவசர மருத்துவ உதவியை தாமதிக்காமல் அழைக்கவும். அதன்பின் உங்கள் உறவினருக்கு தகவல் பகிரவும்."
              : "Do not delay emergency ambulance assistance while sharing details with family."}
          </span>
        </div>

        {/* 1. Emergency Contact Selection */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-4 h-4 text-teal-400" />
              <span>{isTa ? "அவசர தொடர்பு நபர்:" : "Recipient Emergency Contact:"}</span>
            </span>
            <span className="text-[10px] text-teal-400 font-semibold">
              {contacts.length} {isTa ? "தொடர்புகள்" : "Saved"}
            </span>
          </div>

          {loadingContacts ? (
            <p className="text-xs text-slate-400">{isTa ? "தொடர்புகள் ஏற்றப்படுகின்றன..." : "Loading contacts..."}</p>
          ) : contacts.length === 0 ? (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200">
              <p className="font-semibold">{isTa ? "அவசர தொடர்புகள் எதுவும் சேர்க்கப்படவில்லை." : "No trusted contacts saved yet."}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isTa
                  ? "கீழே உள்ள உள்ளீட்டில் மொபைல் எண்ணைத் தட்டச்சு செய்து நேரடியாகப் பகிரலாம்."
                  : "You can enter a mobile number directly below or add trusted contacts from the dashboard."}
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  onChange={(e) =>
                    setSelectedContact({ name: "Emergency Contact", phone: e.target.value, relationship: "Family" })
                  }
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {contacts.map((c) => {
                const isSelected = selectedContact?.id === c.id || (!selectedContact && c.is_primary)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedContact(c)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start justify-between ${
                      isSelected
                        ? "bg-teal-950/70 border-teal-500 text-white shadow-sm shadow-teal-950/40"
                        : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold">{c.name}</span>
                        {c.is_primary && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950 border border-teal-500/30 px-1 py-0.2 rounded">
                            {isTa ? "முதன்மை" : "Primary"}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-teal-300 font-mono block mt-0.5">{c.phone}</span>
                      <span className="text-[10px] text-slate-400">{c.relationship}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 2. Location Permission & Attachment */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>{isTa ? "தற்போதைய இருப்பிடப் பகிர்வு (GPS):" : "Live GPS Location Sharing:"}</span>
            </span>
            {locationConsent && locationCoords && (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {isTa ? "இணைக்கப்பட்டது" : "Attached"}
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400">
            {isTa
              ? "உங்கள் அனுமதிக்குப் பிறகே GPS இருப்பிடம் பெறப்படும். அவசர ஊர்தி அல்லது உறவினர் உங்களை எளிதில் அடைய இது உதவும்."
              : "GPS coordinates will only be accessed with your explicit consent to help emergency responders or contacts navigate to your exact location."}
          </p>

          {!locationConsent ? (
            <button
              type="button"
              onClick={handleRequestLocation}
              disabled={detectingLocation}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Navigation className="w-4 h-4 text-rose-400" />
              <span>
                {detectingLocation
                  ? (isTa ? "GPS இருப்பிடம் கண்டறியப்படுகிறது..." : "Detecting GPS Coordinates...")
                  : (isTa ? "என் நேரலை இருப்பிடத்தை இணைக்க அனுமதி தருகிறேன்" : "Allow & Attach My Live GPS Location")}
              </span>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{readableAddress || `Coordinates: ${locationCoords.latitude.toFixed(4)}, ${locationCoords.longitude.toFixed(4)}`}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLocationConsent(false)
                    setLocationCoords(null)
                    setReadableAddress("")
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-400 underline"
                >
                  {isTa ? "நீக்கு" : "Remove"}
                </button>
              </div>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-teal-300 hover:underline inline-flex items-center gap-1"
                >
                  <span>{isTa ? "வரைபடத்தில் காண்க" : "Preview Location in Google Maps"}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {locationError && (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-[11px] text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span>{locationError}</span>
            </div>
          )}
        </div>

        {/* 3. Emergency Message Preview */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span>{isTa ? "பகிரப்படும் அவசரச் செய்தி முன்னோட்டம்:" : "Emergency Message Summary Preview:"}</span>
            </span>
            <button
              type="button"
              onClick={() => handleCopy(previewMessage)}
              className="text-[10px] text-teal-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <Copy className="w-3 h-3" />
              <span>{copySuccess ? (isTa ? "நகலெடுக்கப்பட்டது!" : "Copied!") : (isTa ? "நகலெடு" : "Copy Note")}</span>
            </button>
          </div>

          <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-36 overflow-y-auto">
            {previewMessage}
          </pre>

          {/* Optional Short Custom Note */}
          <input
            type="text"
            placeholder={isTa ? "கூடுதல் தகவல் (உதாரணம்: வீட்டு எண், மாடி, கதவு சாவி...)" : "Add brief note (e.g. Apt #402, front door unlocked, inhaler in bag)..."}
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-teal-500 text-white text-xs placeholder:text-slate-600"
          />
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/50 text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Status / Dispatch Response Callout */}
        {alertResponse && (
          <div
            className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
              alertResponse.success
                ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-200"
                : "bg-slate-950/80 border-amber-500/50 text-amber-200"
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {alertResponse.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{isTa ? "அவசர அறிவிப்பு வெற்றிகரமாக அனுப்பப்பட்டது!" : "Automated SMS Alert Dispatched!"}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{isTa ? "நேரடி செயலி வழி பகிர்க (1-கிளிக்):" : "Dispatch via 1-Click Phone Apps:"}</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {alertResponse.status_message}
            </p>

            {/* Direct 1-Click SMS and WhatsApp Links */}
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={alertResponse.sms_fallback_url}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-transform hover:scale-105 shadow-md shadow-blue-950/50"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{isTa ? "SMS செயலி வழி அனுப்புக" : "Open Phone SMS App"}</span>
              </a>

              <a
                href={alertResponse.whatsapp_fallback_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-transform hover:scale-105 shadow-md shadow-emerald-950/50"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isTa ? "வாட்ஸ்அப் வழி அனுப்புக" : "Open WhatsApp"}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400">
            {selectedContact ? (
              <span>
                {isTa ? "பெறுநர்: " : "Sending to: "}
                <strong className="text-white">{selectedContact.name} ({selectedContact.phone})</strong>
              </span>
            ) : (
              <span className="text-amber-400">{isTa ? "தொடர்பாளரைத் தேர்ந்தெடுக்கவும்" : "Select a contact above"}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              {isTa ? "மூடு" : "Close"}
            </button>

            <button
              type="button"
              onClick={handleShareEmergencyDetails}
              disabled={isSubmitting || !selectedContact}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-rose-950/60 disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? (isTa ? "தயாராகிறது..." : "Preparing Alert...")
                  : (isTa ? "அவசர விவரங்களைப் பகிர்க" : "Share Emergency Details")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmergencyLocationShareModal

