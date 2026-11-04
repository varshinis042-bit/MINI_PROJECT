import React, { useState, useEffect } from "react"
import {
  UserCheck,
  Plus,
  Phone,
  Trash2,
  Edit2,
  Star,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  X
} from "lucide-react"
import api from "../services/api"
import { useLanguage } from "../context/LanguageContext"

export const TrustedContactManager = ({ onSelectPrimary, compact = false }) => {
  const { lang } = useLanguage()
  const isTa = lang === "ta"

  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form / Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    relationship: "Family",
    phone: "",
    email: "",
    is_primary: false
  })
  const [phoneError, setPhoneError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await api.get("/symptoms/trusted-contacts")
      const list = res.data || []
      setContacts(list)
      const primary = list.find((c) => c.is_primary) || list[0]
      if (primary && onSelectPrimary) {
        onSelectPrimary(primary)
      }
    } catch (err) {
      console.error("Failed to load contacts:", err)
      setError(isTa ? "தொடர்புகளை ஏற்றுவதில் பிழை ஏற்பட்டது." : "Failed to load trusted contacts.")
    } finally {
      setLoading(false)
    }
  }

  const validatePhone = (num) => {
    const clean = num.replace(/[\s\-\(\)]/g, "")
    const digitsOnly = clean.replace(/\D/g, "")
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return isTa
        ? "தொலைபேசி எண் 10 முதல் 15 இலக்கங்களைக் கொண்டிருக்க வேண்டும்."
        : "Phone number must contain between 10 and 15 digits."
    }
    return ""
  }

  const handleOpenAdd = () => {
    setEditingContact(null)
    setFormData({
      name: "",
      relationship: "Family",
      phone: "",
      email: "",
      is_primary: contacts.length === 0
    })
    setPhoneError("")
    setShowModal(true)
  }

  const handleOpenEdit = (contact) => {
    setEditingContact(contact)
    setFormData({
      name: contact.name,
      relationship: contact.relationship || "Family",
      phone: contact.phone,
      email: contact.email || "",
      is_primary: contact.is_primary
    })
    setPhoneError("")
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validatePhone(formData.phone)
    if (err) {
      setPhoneError(err)
      return
    }

    setSubmitting(true)
    setError("")
    setPhoneError("")

    try {
      if (editingContact && editingContact.id) {
        await api.put(`/symptoms/trusted-contacts/${editingContact.id}`, formData)
        setSuccess(isTa ? "தொடர்பு விவரங்கள் புதுப்பிக்கப்பட்டன!" : "Contact successfully updated!")
      } else {
        await api.post("/symptoms/trusted-contacts", formData)
        setSuccess(isTa ? "புதிய நம்பகமான தொடர்பு சேர்க்கப்பட்டது!" : "New trusted contact added!")
      }
      setShowModal(false)
      await fetchContacts()
      setTimeout(() => setSuccess(""), 4000)
    } catch (err) {
      console.error("Failed to save contact:", err)
      const detail = err.response?.data?.detail
      setError(typeof detail === "string" ? detail : (isTa ? "தொடர்பைச் சேமிப்பதில் பிழை." : "Failed to save contact."))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (contactId) => {
    if (!window.confirm(isTa ? "இந்த தொடர்பை நிச்சயமாக நீக்க விரும்புகிறீர்களா?" : "Are you sure you want to remove this contact?")) {
      return
    }
    try {
      await api.delete(`/symptoms/trusted-contacts/${contactId}`)
      await fetchContacts()
      setSuccess(isTa ? "தொடர்பு நீக்கப்பட்டது." : "Contact removed.")
      setTimeout(() => setSuccess(""), 4000)
    } catch (err) {
      console.error("Failed to delete contact:", err)
      setError(isTa ? "தொடர்பை நீக்குவதில் தோல்வி." : "Failed to delete contact.")
    }
  }

  const handleSetPrimary = async (contactId) => {
    try {
      await api.post(`/symptoms/trusted-contacts/${contactId}/primary`)
      await fetchContacts()
      setSuccess(isTa ? "முதன்மை அவசரத் தொடர்பு தேர்ந்தெடுக்கப்பட்டது!" : "Set as primary emergency contact!")
      setTimeout(() => setSuccess(""), 4000)
    } catch (err) {
      console.error("Failed to set primary contact:", err)
    }
  }

  const primaryContact = contacts.find((c) => c.is_primary) || contacts[0]

  return (
    <div className="space-y-4">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            <span>{isTa ? "நம்பகமான அவசரத் தொடர்புகள்" : "Trusted Emergency Contacts"}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isTa
              ? "அவசர காலத்தில் உங்கள் அறிகுறிகள் மற்றும் நேரலை இருப்பிடத்தைப் பகிர ஒருவரை முதன்மை தொடர்பாளராக தேர்வு செய்யவும்."
              : "Designate a family member or friend to instantly receive your live GPS and emergency notes."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-teal-950/40 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isTa ? "தொடர்பைச் சேர்" : "Add Trusted Contact"}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-teal-950/50 border border-teal-500/40 text-teal-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Primary Contact Callout Box */}
      {primaryContact && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/50 to-slate-900 border border-teal-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-bold flex-shrink-0 shadow-md shadow-teal-950/50">
              <Star className="w-5 h-5 fill-slate-950 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{primaryContact.name}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-500/30">
                  {isTa ? "முதன்மை அவசரத் தொடர்பு" : "Primary Emergency Contact"}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-teal-400" />
                <span>{primaryContact.phone}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{primaryContact.relationship}</span>
              </p>
            </div>
          </div>
          <a
            href={`tel:${primaryContact.phone}`}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Phone className="w-3.5 h-3.5 text-teal-400" />
            <span>{isTa ? "அழைக்கவும்" : "Call Contact"}</span>
          </a>
        </div>
      )}

      {/* List of All Contacts */}
      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span>{isTa ? "தொடர்புகள் ஏற்றப்படுகின்றன..." : "Loading contacts..."}</span>
        </div>
      ) : contacts.length === 0 ? (
        <div className="p-6 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 space-y-2">
          <UserCheck className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs font-bold text-slate-300">
            {isTa ? "இன்னும் அவசர தொடர்புகள் சேர்க்கப்படவில்லை." : "No trusted contacts saved yet."}
          </p>
          <p className="text-[11px] text-slate-500">
            {isTa
              ? "ஒரு குடும்ப உறுப்பினர் அல்லது நண்பரின் தொலைபேசி எண்ணைச் சேர்க்க மேலே உள்ள பொத்தானைக் கிளிக் செய்யவும்."
              : "Add at least one family member or close friend to be notified during cardiac emergencies."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                contact.is_primary
                  ? "bg-slate-900 border-teal-500/50 shadow-sm"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">{contact.name}</h4>
                    {contact.is_primary && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 border border-teal-500/30 px-1.5 py-0.5 rounded">
                        {isTa ? "முதன்மை" : "Primary"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-teal-300 font-mono mt-1 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{contact.phone}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {contact.relationship || "Contact"}
                    {contact.email ? ` • ${contact.email}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {!contact.is_primary && (
                    <button
                      type="button"
                      title={isTa ? "முதன்மை தொடர்பாக்க" : "Set as primary emergency contact"}
                      onClick={() => handleSetPrimary(contact.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    title={isTa ? "திருத்த" : "Edit contact"}
                    onClick={() => handleOpenEdit(contact)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title={isTa ? "நீக்க" : "Delete contact"}
                    onClick={() => handleDelete(contact.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl border border-slate-700 bg-slate-900 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" />
                <span>
                  {editingContact
                    ? (isTa ? "தொடர்பைத் திருத்தவும்" : "Edit Trusted Contact")
                    : (isTa ? "புதிய தொடர்பைச் சேர்க்கவும்" : "Add Trusted Emergency Contact")}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isTa ? "முழு பெயர் *" : "Contact Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma, Ramesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isTa ? "உறவு *" : "Relationship *"}
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
                  >
                    <option value="Spouse">Spouse / Partner</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Son / Daughter</option>
                    <option value="Sibling">Brother / Sister</option>
                    <option value="Family">Other Family Member</option>
                    <option value="Friend">Close Friend</option>
                    <option value="Neighbor">Neighbor</option>
                    <option value="Doctor">Primary Care Doctor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isTa ? "அலைபேசி எண் *" : "Mobile Phone Number *"}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value })
                      setPhoneError("")
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-white text-xs placeholder:text-slate-600 ${
                      phoneError ? "border-rose-500 focus:border-rose-400" : "border-slate-800 focus:border-teal-500"
                    }`}
                  />
                  {phoneError && <p className="text-[10px] text-rose-400 mt-0.5">{phoneError}</p>}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isTa ? "மின்னஞ்சல் (விருப்பத்தேர்வு)" : "Email Address (Optional)"}
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs placeholder:text-slate-600"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.is_primary}
                    onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="font-semibold text-xs">
                    {isTa ? "இவரை முதன்மை அவசரத் தொடர்பாளராக வைக்கவும்" : "Set as my primary emergency contact"}
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  {isTa ? "ரத்து" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <span>{isTa ? "சேமிக்கப்படுகிறது..." : "Saving..."}</span>
                  ) : (
                    <span>{isTa ? "சேமி" : "Save Contact"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrustedContactManager

