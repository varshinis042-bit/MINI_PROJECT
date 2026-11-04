import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  ShieldCheck,
  Activity,
  Droplet,
  Flame,
  Scale,
  Footprints,
  Utensils,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Info,
  Heart,
  Save,
  RotateCcw,
  AlertOctagon,
  Sparkles,
  PhoneCall,
  Check
} from "lucide-react"
import api from "../services/api"
import { useLanguage } from "../context/LanguageContext"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

export const RiskMaintenance = () => {
  const { lang, t } = useLanguage()
  const isTa = lang === "ta"

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState("")
  const [profile, setProfile] = useState(null)
  const [latestPred, setLatestPred] = useState(null)
  const [progressHistory, setProgressHistory] = useState([])
  const [selectedTier, setSelectedTier] = useState("HIGH") // "LOW" | "MODERATE" | "HIGH"

  // Measurement input fields
  const [measurements, setMeasurements] = useState({
    systolic_bp: 130,
    diastolic_bp: 84,
    cholesterol: 200,
    blood_glucose: 100,
    weight_kg: 75,
    resting_hr: 72
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [profRes, predRes, progRes] = await Promise.allSettled([
        api.get("/profile"),
        api.get("/predict/history"),
        api.get("/progress")
      ])

      if (profRes.status === "fulfilled" && profRes.value.data) {
        const p = profRes.value.data
        setProfile(p)
        setMeasurements({
          systolic_bp: p.systolic_bp || 130,
          diastolic_bp: p.diastolic_bp || 84,
          cholesterol: p.cholesterol || 200,
          blood_glucose: p.blood_glucose || 100,
          weight_kg: p.weight_kg || 75,
          resting_hr: p.resting_hr || 72
        })
      }

      if (predRes.status === "fulfilled" && predRes.value.data && predRes.value.data.length > 0) {
        const lp = predRes.value.data[0]
        setLatestPred(lp)
        const cat = (lp.risk_category || (lp.risk_percentage >= 50 ? "HIGH" : lp.risk_percentage >= 20 ? "MODERATE" : "LOW")).toUpperCase()
        setSelectedTier(cat)
      } else {
        setSelectedTier("MODERATE")
      }

      if (progRes.status === "fulfilled" && progRes.value.data) {
        setProgressHistory(progRes.value.data)
      }
    } catch (err) {
      console.error("Failed to load risk maintenance data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setMeasurements((prev) => ({
      ...prev,
      [field]: Number(value) || 0
    }))
  }

  const handleRecordMeasurements = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess("")

    try {
      // 1. Record progress check-in
      const checkinPayload = {
        systolic_bp: measurements.systolic_bp,
        diastolic_bp: measurements.diastolic_bp,
        cholesterol: measurements.cholesterol,
        blood_glucose: measurements.blood_glucose,
        weight_kg: measurements.weight_kg,
        resting_hr: measurements.resting_hr,
        risk_percentage: latestPred ? latestPred.risk_percentage : (selectedTier === "HIGH" ? 75.0 : selectedTier === "MODERATE" ? 35.0 : 8.0),
        lifestyle_score: selectedTier === "LOW" ? 88 : selectedTier === "MODERATE" ? 72 : 55,
        created_at: new Date().toISOString()
      }
      await api.post("/progress", checkinPayload)

      // 2. Also update patient profile baseline if available
      if (profile) {
        const updatedProfile = {
          ...profile,
          systolic_bp: measurements.systolic_bp,
          diastolic_bp: measurements.diastolic_bp,
          cholesterol: measurements.cholesterol,
          blood_glucose: measurements.blood_glucose,
          weight_kg: measurements.weight_kg,
          resting_hr: measurements.resting_hr
        }
        await api.put("/profile", updatedProfile)
      }

      setSaveSuccess(
        isTa
          ? "அளவீடுகள் வெற்றிகரமாக பதிவு செய்யப்பட்டு முன்னேற்றப் பட்டியலில் சேர்க்கப்பட்டன!"
          : "Measurements successfully recorded and added to your progress timeline!"
      )

      // Refresh progress history
      const progRes = await api.get("/progress")
      if (progRes.data) setProgressHistory(progRes.data)

      setTimeout(() => setSaveSuccess(""), 4500)
    } catch (err) {
      console.error("Failed to save measurements:", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">
          {isTa ? "பராமரிப்பு விவரங்கள் ஏற்றப்படுகின்றன..." : "Loading risk factor maintenance guide..."}
        </p>
      </div>
    )
  }

  const userActualTier = latestPred
    ? (latestPred.risk_category || (latestPred.risk_percentage >= 50 ? "HIGH" : latestPred.risk_percentage >= 20 ? "MODERATE" : "LOW")).toUpperCase()
    : "MODERATE"

  const activeTier = selectedTier || userActualTier
  const isHigh = activeTier === "HIGH"
  const isMod = activeTier === "MODERATE"
  const isLow = activeTier === "LOW"

  const recentRecords = progressHistory.slice(-5).reverse()

  // Dynamic Content Matrix per Risk Tier
  const tierContent = {
    LOW: {
      tag: isTa ? "குறைந்த அபாயம் • பராமரிப்பு முறை" : "Low Risk • Primary Wellness Protocol",
      headline: isTa ? "குறைந்த அபாய நிலை: நீண்டகால ஆரோக்கியத்தைப் பேணுதல்" : "Low Cardiovascular Risk: Long-Term Wellness Maintenance",
      description: isTa
        ? "உங்கள் இதய அபாயம் தற்போது குறைவான வரம்பில் உள்ளது. வழக்கமான ஆரோக்கியப் பழக்கங்கள், சரிவிகித உணவு மற்றும் மிதமான உடற்பயிற்சி மூலம் இதய தமனிகளை ஆயுள் முழுவதும் நெகிழ்வாக வைத்திருக்க முடியும்."
        : "Your estimated cardiovascular risk is in the low tier (< 20%). The primary objective is sustainable wellness: preserving vascular elasticity, maintaining healthy lipid ratios, and preventing age-related arterial stiffening.",
      bannerTheme: "border-emerald-500/40 bg-emerald-950/20 text-emerald-300",
      iconColor: "text-emerald-400",
      accentBg: "bg-emerald-950/60 border-emerald-500/30 text-emerald-300",
      areas: [
        {
          id: 1,
          icon: Activity,
          title: isTa ? "1. இரத்த அழுத்த கண்காணிப்பு" : "1. Blood Pressure Maintenance",
          target: isTa ? "இலக்கு: < 120/80 mmHg" : "Target: < 120/80 mmHg",
          frequency: isTa ? "மாதம் 1 முறை / இரு வாரத்திற்கு ஒருமுறை" : "Monthly or Bi-Weekly Check",
          freqColor: "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30",
          body: isTa
            ? "அமைதியாக 5 நிமிடங்கள் அமர்ந்த பின் அளவீடு எடுக்கவும். எப்போதாவது ஏற்படும் தற்காலிக உயர்வுகளை கவனிக்கவும். தற்போதைய அளவீடுகளை 120/80 mmHg வரம்பில் நிலைநிறுத்துவது தமனிகளின் ரத்த ஓட்டத்தை சீராக வைத்திருக்கும்."
            : "Sit quietly for 5 minutes before recording. Measure periodically at home or during routine doctor visits. Keeping readings consistently below 120/80 mmHg prevents early arterial wall remodeling and stiffening.",
          tip: isTa ? "வழக்கமான நடை மற்றும் போதுமான தண்ணீர் அருந்துதல் BP-யை சீராக வைக்கும்" : "Adequate hydration and 7–8 hours sleep maintain healthy circadian blood pressure dips"
        },
        {
          id: 2,
          icon: Droplet,
          title: isTa ? "2. கொலஸ்ட்ரால் சமநிலை" : "2. Cholesterol & Lipid Balance",
          target: isTa ? "மொத்த கொலஸ்ட்ரால் < 180 mg/dL | LDL < 100" : "Total < 180 mg/dL | LDL < 100 mg/dL",
          frequency: isTa ? "ஆண்டுக்கு 1 முறை லிப்பிட் பரிசோதனை" : "Annual Fasting Lipid Panel",
          freqColor: "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30",
          body: isTa
            ? "வருடத்திற்கு ஒருமுறை லிப்பிட் பரிசோதனை (Lipid Profile) செய்து நல்ல கொழுப்பை (HDL > 45 mg/dL) பராமரிக்கவும். ஆரோக்கியமான தாவர எண்ணெய்கள், பருப்பு மற்றும் நட்ஸ் வகைகளை அளவாக உணவில் சேர்க்கவும்."
            : "Maintain optimal protective HDL (> 45 mg/dL) through regular aerobic movement. Schedule an annual fasting lipid profile. Soluble fiber from lentils, apples, and oats naturally prevents circulating LDL reabsorption.",
          tip: isTa ? "ஓட்ஸ், பாசிப்பருப்பு மற்றும் பச்சைக் காய்கறிகள் கெட்ட கொழுப்பைத் தடுக்கும்" : "Whole grains, moong dal, and walnuts promote healthy lipid particle distribution"
        },
        {
          id: 3,
          icon: Scale,
          title: isTa ? "3. இரத்த சர்க்கரை மேலாண்மை" : "3. Blood Glucose Stability",
          target: isTa ? "வெறும் வயிற்று சர்க்கரை: 70–99 mg/dL | HbA1c < 5.6%" : "Fasting: 70–99 mg/dL | HbA1c < 5.6%",
          frequency: isTa ? "ஆண்டுக்கு 1 முறை பரிசோதனை" : "Annual Preventive Screening",
          freqColor: "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30",
          body: isTa
            ? "தீட்டிய வெள்ளை அரிசி, சர்க்கரை மற்றும் குளிர்பானங்களை குறைத்து, ராகி, சாமை, தினை போன்ற சிறுதானியங்களை உணவில் சேர்க்கவும். இது இன்சுலின் தடையைத் தடுத்து சர்க்கரையை சீராக வைக்கும்."
            : "Maintain fasting blood glucose between 70–99 mg/dL. Emphasize low-glycemic traditional South Indian staples (Ragi, Thinai, Samai) and minimize refined sweets and sugary carbonated drinks.",
          tip: isTa ? "சிறுதானிய நார்ச்சத்து ரத்தத்தில் சர்க்கரை திடீரென உயர்வதைத் தடுக்கிறது" : "Sustained fiber intake prevents insulin resistance and microvascular endothelial wear"
        },
        {
          id: 4,
          icon: Footprints,
          title: isTa ? "4. வழக்கமான உடற்பயிற்சி பழக்கம்" : "4. Active Lifestyle & Fitness Routine",
          target: isTa ? "150–300 நிமிடம் / வாரம் (மிதமானது)" : "150–300 mins / week (Moderate/Brisk)",
          frequency: isTa ? "வாரத்தில் 4–6 நாட்கள்" : "4–6 Days / Week",
          freqColor: "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30",
          body: isTa
            ? "விறுவிறுப்பான நடை, யோகாசனம், நீச்சல் அல்லது மிதிவண்டி ஓட்டுதல் என வாரத்திற்கு 150 முதல் 300 நிமிடங்கள் சுறுசுறுப்பாக இருக்கவும். ஓய்வு நேர இதயத் துடிப்பு 60-75 BPM வரம்பில் இருப்பதை உறுதிசெய்யவும்."
            : "Aim for 150–300 minutes of weekly moderate aerobic walking, cycling, or swimming, plus 2 days of functional strength exercises. Aerobic fitness increases myocardial stroke volume and resting heart rate efficiency.",
          tip: isTa ? "சூரிய நமஸ்காரம் மற்றும் விறுவிறுப்பான நடை இதய தசைகளை பலப்படுத்தும்" : "Regular brisk walking enhances microvascular collateralization and longevity",
          link: "/exercise"
        },
        {
          id: 5,
          icon: Utensils,
          title: isTa ? "5. ஆரோக்கியமான உணவுப் பழக்கம்" : "5. Heart-Protective Daily Diet",
          target: isTa ? "சோடியம்: < 2,300 mg/நாள் (1 டீஸ்பூன் உப்பு)" : "Sodium: < 2,300 mg/day (~1 tsp salt)",
          frequency: isTa ? "தினசரி சரிவிகித உணவு தட்டு" : "Daily Balanced Plate (DASH Pattern)",
          freqColor: "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30",
          body: isTa
            ? "உணவுத் தட்டில் 50% பச்சைக் காய்கறி மற்றும் பழங்கள், 25% பருப்பு/முட்டை, 25% முழு தானியம் இருப்பதை உறுதிசெய்யவும். பொரித்த உணவுகள் மற்றும் அதிக சோடியம் பாக்கெட் நொறுக்குத் தீனிகளைத் தவிர்க்கவும்."
            : "Follow the cardioprotective plate model: half plate vegetables/salads, quarter lean protein (lentils/dal/egg), quarter whole grains. Restrict sodium under 2,300 mg/day and use cold-pressed sesame or mustard oils.",
          tip: isTa ? "தக்காளி, சுரைக்காய் மற்றும் மோரில் உள்ள பொட்டாசியம் ரத்த நாளங்களுக்கு சிறந்தது" : "Fresh garlic, ginger, and curry leaves naturally supply protective polyphenols",
          link: "/diet"
        },
        {
          id: 6,
          icon: CalendarCheck,
          title: isTa ? "6. வருடாந்திர மருத்துவ பரிசோதனை" : "6. Annual Preventive Check-Up",
          target: isTa ? "வருடாந்திர முழு உடல் நலம்" : "Yearly Wellness Assessment",
          frequency: isTa ? "ஆண்டுக்கு 1 முறை மருத்துவ சந்திப்பு" : "Annual Routine Review",
          freqColor: "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30",
          body: isTa
            ? "ஆண்டுக்கு ஒருமுறை உங்கள் குடும்ப மருத்துவரிடம் இரத்த அழுத்தம், கொலஸ்ட்ரால் மற்றும் எடையை மதிப்பாய்வு செய்யவும். சிறப்பு மருந்துகளின் தேவை இல்லை; ஆரோக்கிய வாழ்க்கை முறையே போதுமானது."
            : "Consult your primary physician once a year to review baseline vitals and lab panels. No cardiac pharmacotherapy is required; disciplined lifestyle habits form your strongest protective shield.",
          tip: isTa ? "ஆரம்ப கட்ட சுய கண்காணிப்பு எதிர்கால இதய உபாதைகளை 80% வரை தவிர்க்கும்" : "Consistent routine screening identifies subtle biomarker drifts 10 years before clinical events",
          link: "/reminders"
        }
      ]
    },
    MODERATE: {
      tag: isTa ? "மிதமான அபாயம் • கட்டுப்பாட்டு முறை" : "Moderate Risk • Targeted Attenuation Protocol",
      headline: isTa ? "மிதமான அபாய நிலை: காரணிகளை முன்கூட்டியே கட்டுப்படுத்துதல்" : "Moderate Cardiovascular Risk: Targeted Risk Attenuation",
      description: isTa
        ? "உங்கள் இதய அபாயம் மிதமான வரம்பில் (20% – 50%) உள்ளது. இது எச்சரிக்கை மணியாகும். இரத்த அழுத்தம், உணவு முறை மற்றும் கொழுப்பை திட்டமிட்டு கட்டுப்படுத்துவதன் மூலம் இந்த அபாயத்தை எளிதாகக் குறைக்க முடியும்."
        : "Your estimated cardiovascular risk is in the moderate tier (20%–50%). Targeted lifestyle interventions, sodium reduction, and focused biomarker tracking can successfully bend your risk trajectory back to low.",
      bannerTheme: "border-amber-500/40 bg-amber-950/20 text-amber-200",
      iconColor: "text-amber-400",
      accentBg: "bg-amber-950/60 border-amber-500/30 text-amber-300",
      areas: [
        {
          id: 1,
          icon: Activity,
          title: isTa ? "1. இரத்த அழுத்த கண்காணிப்பு" : "1. Blood Pressure Targeted Control",
          target: isTa ? "இலக்கு: < 125/80 mmHg" : "Target: < 125/80 mmHg",
          frequency: isTa ? "வாரந்தோறும் 2 முறை (காலை & மாலை)" : "Weekly Log (Morning & Evening)",
          freqColor: "bg-amber-950/80 text-amber-300 border border-amber-500/30",
          body: isTa
            ? "வாரத்திற்கு இரண்டு முறை காலை மற்றும் மாலை இருவேளைகளிலும் இரத்த அழுத்தத்தைப் பதிவு செய்யவும். 130–139 mmHg எல்லைக்கு மேல் தொடர்ந்து இருந்தால் மருத்துவ ஆலோசனையுடன் உணவில் உப்பைக் குறைக்கவும்."
            : "Log blood pressure twice weekly at consistent times (morning before breakfast, evening before dinner). If readings persistently hover between 130–139 mmHg, intensify sodium restriction and review with your doctor.",
          tip: isTa ? "உணவில் உப்பை 1,800 மி.கி-க்குள் கட்டுப்படுத்துவது சிஸ்டாலிக் அழுத்தத்தை குறைக்கும்" : "Restricting sodium below 1,800 mg/day directly relieves systemic peripheral vascular resistance"
        },
        {
          id: 2,
          icon: Droplet,
          title: isTa ? "2. கொலஸ்ட்ரால் & லிப்பிட் குறைப்பு" : "2. Targeted Lipid Lowering",
          target: isTa ? "மொத்த கொலஸ்ட்ரால் < 170 mg/dL | LDL < 80" : "Total < 170 mg/dL | LDL < 80 mg/dL",
          frequency: isTa ? "3 முதல் 6 மாதங்களுக்கு ஒருமுறை" : "Every 3 to 6 Months",
          freqColor: "bg-amber-950/80 text-amber-300 border border-amber-500/30",
          body: isTa
            ? "வறுத்த உணவுகள், டால்டா மற்றும் பேக்கரி தின்பண்டங்களை முற்றிலும் தவிர்க்கவும். வெந்தயம், ஓட்ஸ், பார்லி மற்றும் ஆளி விதைகளை உணவில் சேர்த்து 3 முதல் 6 மாதங்களுக்குள் மீண்டும் பரிசோதிக்கவும்."
            : "Completely eliminate trans-fats, bakery shortenings, and re-used deep-frying oils. Incorporate soluble beta-glucan fiber and fenugreek (methi) seeds. Schedule repeat lipid panels every 3–6 months.",
          tip: isTa ? "முளைகட்டிய வெந்தயம் மற்றும் பாசிப்பருப்பு கெட்ட கொழுப்பை (LDL) கணிசமாக குறைக்கும்" : "Soluble fiber and plant sterols block intestinal cholesterol re-absorption"
        },
        {
          id: 3,
          icon: Scale,
          title: isTa ? "3. இரத்த சர்க்கரை தீவிர கட்டுப்பாடு" : "3. Glycemic Regulation & Carb Swaps",
          target: isTa ? "வெறும் வயிற்று சர்க்கரை: < 100 mg/dL | HbA1c < 5.7%" : "Fasting: < 100 mg/dL | HbA1c < 5.7%",
          frequency: isTa ? "3 மாதங்களுக்கு ஒருமுறை (HbA1c & Fasting)" : "Every 3 Months (Quarterly HbA1c)",
          freqColor: "bg-amber-950/80 text-amber-300 border border-amber-500/30",
          body: isTa
            ? "வெள்ளை அரிசிக்கு பதிலாக ராகி, கம்பு, குதிரைவாலி போன்ற சிறுதானியங்களை பயன்படுத்தவும். சாப்பிட்ட பிறகு 15 நிமிடங்கள் மெதுவாக நடப்பது ரத்த சர்க்கரை கூர்மையாக உயர்வதைத் தடுக்கும்."
            : "Swap polished white rice for whole finger millet (Ragi), Foxtail millet (Thinai), or brown rice. Take a 15-minute gentle post-meal walk to blunt postprandial glucose surges and lower insulin spikes.",
          tip: isTa ? "சாப்பிட்ட பின் 15 நிமிட நடைப்பயிற்சி சர்க்கரையை இயற்கையாகவே தசை செல்களுக்குள் ஈர்க்கிறது" : "Post-meal walks activate non-insulin dependent glucose uptake in skeletal muscle"
        },
        {
          id: 4,
          icon: Footprints,
          title: isTa ? "4. திட்டமிட்ட மிதமான உடற்பயிற்சி" : "4. Structured Aerobic Walking",
          target: isTa ? "150 நிமிடம் / வாரம் (தினமும் 30 நிமிடம்)" : "150 mins / week (30 mins x 5 days)",
          frequency: isTa ? "வாரத்தில் 5 நாட்கள்" : "5 Days / Week",
          freqColor: "bg-amber-950/80 text-amber-300 border border-amber-500/30",
          body: isTa
            ? "பேசக்கூடிய வேகத்தில் நிதானமாக விறுவிறுப்பான நடைப்பயிற்சி மேற்கொள்ளவும். தொடங்கும் முன் 5 நிமிடம் வார்ம்-அப் மற்றும் முடிவில் கூல்-டவுன் அவசியம். திடீர் கடுமையான ஓட்டங்களைத் தவிர்க்கவும்."
            : "Perform 30 minutes of moderate aerobic walking 5 days a week at a conversational pace. Include 5-minute warm-up and cool-down periods. Avoid sudden unconditioned sprinting or heavy lifting.",
          tip: isTa ? "அனுலோம் விலோம் மூச்சுப்பயிற்சி நரம்பு அழுத்தத்தை தணித்து இரத்த ஓட்டத்தை சீராக்கும்" : "Anulom Vilom and slow diaphragmatic breathing reduce sympathetic vascular tone",
          link: "/exercise"
        },
        {
          id: 5,
          icon: Utensils,
          title: isTa ? "5. சோடியம் கட்டுப்படுத்தப்பட்ட DASH உணவு" : "5. Sodium-Restricted Cardioprotective Diet",
          target: isTa ? "சோடியம்: < 1,800 mg/நாள் (முக்கால் டீஸ்பூன் உப்பு)" : "Sodium: < 1,800 mg/day (~3/4 tsp salt)",
          frequency: isTa ? "கண்டிப்பான தினசரி உணவு கட்டுப்பாடு" : "Daily Strict DASH Plan",
          freqColor: "bg-amber-950/80 text-amber-300 border border-amber-500/30",
          body: isTa
            ? "ஊறுகாய், அப்பளம், உப்பு தின்பண்டங்களை முற்றிலும் தவிர்க்கவும். உப்பிற்கு பதிலாக எலுமிச்சை, பூண்டு, சீரகம், கறிவேப்பிலை கொண்டு சுவை கூட்டவும். நெய்யை 1 ஸ்பூனுக்குள் கட்டுப்படுத்தவும்."
            : "Eliminate high-sodium items: pickles (achaar), papads, salted crisps, and canned gravies. Season dishes with fresh lime, crushed garlic, cumin, and curry leaves instead of salt. Limit ghee to 1 tsp/day.",
          tip: isTa ? "பூண்டில் உள்ள அல்லிசின் ரத்த நாளங்களில் ஏற்படும் அழற்சியைத் தடுத்து இதயத்தை காக்கும்" : "Fresh garlic and raw ginger supply allicin to enhance endothelial nitric oxide availability",
          link: "/diet"
        },
        {
          id: 6,
          icon: CalendarCheck,
          title: isTa ? "6. மருத்துவர் ஆலோசனை & மருந்து வழிகாட்டல்" : "6. Clinical Review & Early Intervention",
          target: isTa ? "3–6 மாதங்களுக்கு ஒருமுறை மருத்துவ சந்திப்பு" : "Semi-Annual Doctor Consultation",
          frequency: isTa ? "3 முதல் 6 மாதங்களில் மறுபரிசீலனை" : "Every 3–6 Months",
          freqColor: "bg-amber-950/80 text-amber-300 border border-amber-500/30",
          body: isTa
            ? "உங்கள் மருத்துவரிடம் சமீபத்திய அளவீடுகளைக் காட்டி ஆலோசிக்கவும். மருத்துவர் ஏதேனும் தடுப்பு மருந்துகளை (BP அல்லது ஸ்டேடின்) பரிந்துரைத்தால் தவறாமல் குறித்த நேரத்தில் உட்கொள்ளவும்."
            : "Review clinical trends with your physician semi-annually. Discuss whether preventive low-dose statin or anti-hypertensive therapy is warranted based on your aggregate 10-year risk curve.",
          tip: isTa ? "துவக்க நிலையிலேயே வாழ்க்கை முறையை மாற்றுவது அபாயத்தை 40% வரை குறைக்கும்" : "Catching subclinical vascular changes early reverses disease trajectory before events occur",
          link: "/reminders"
        }
      ]
    },
    HIGH: {
      tag: isTa ? "உயர் அபாயம் • தீவிர கண்காணிப்பு முறை" : "High Risk • Intensive Clinical Oversight Protocol",
      headline: isTa ? "உயர் அபாய நிலை: தீவிர மருத்துவ கண்காணிப்பு & தினசரி பாதுகாப்பு" : "High Cardiovascular Risk: Intensive Clinical Management",
      description: isTa
        ? "உங்கள் இதய அபாயம் உயர் வரம்பில் (>= 50%) உள்ளது. இது உடனடி மருத்துவ மேலாண்மை மற்றும் கண்டிப்பான தினசரி பராமரிப்பைக் கோருகிறது. மருத்துவர் பரிந்துரைத்த மருந்துகள், கண்டிப்பான உப்பு கட்டுப்பாடு மற்றும் தொடர் கண்காணிப்பால் அபாயத்தை குறைக்க முடியும்."
        : "Your estimated cardiovascular risk is in the high tier (>= 50%). This status necessitates active physician partnership, disciplined pharmacotherapy adherence, strict sodium restriction, and daily home monitoring to avert acute complications.",
      bannerTheme: "border-rose-500/40 bg-rose-950/30 text-rose-200",
      iconColor: "text-rose-400",
      accentBg: "bg-rose-950/60 border-rose-500/30 text-rose-300",
      areas: [
        {
          id: 1,
          icon: Activity,
          title: isTa ? "1. இரத்த அழுத்த தினசரி பதிவு" : "1. Strict Daily Blood Pressure Log",
          target: isTa ? "கண்டிப்பான இலக்கு: < 120/75 mmHg (மருத்துவர் ஆலோசனையுடன்)" : "Strict Target: < 120/75 mmHg (or as prescribed)",
          frequency: isTa ? "தினமும் 2 முறை (காலை & மாலை மாத்திரைக்கு முன்)" : "Daily Twice (Morning & Night before meds)",
          freqColor: "bg-rose-950/80 text-rose-300 border border-rose-500/30 font-bold",
          body: isTa
            ? "தினமும் காலை மற்றும் மாலையில் மாத்திரை உட்கொள்வதற்கு முன் தவறாமல் இரத்த அழுத்தத்தைப் பதிவு செய்யவும். 160/100 mmHg-க்கு மேல் சென்றால் மருத்துவரைத் தொடர்பு கொள்ளவும். 180/110 mmHg-க்கு மேல் சென்றால் அவசர மருத்துவ உதவி (112/108) பெறவும்."
            : "Measure BP twice daily before taking morning and evening medications using a calibrated upper-arm cuff. If SBP >= 160 or DBP >= 100 mmHg, alert your clinician. If BP exceeds 180/110 mmHg, seek immediate emergency care.",
          tip: isTa ? "முக்கிய எச்சரிக்கை: இரத்த அழுத்த மாத்திரைகளை மருத்துவர் அனுமதியின்றி ஒருநாளும் நிறுத்தக் கூடாது" : "Strict medication adherence prevents mechanical pressure spikes that trigger acute plaque rupture"
        },
        {
          id: 2,
          icon: Droplet,
          title: isTa ? "2. தீவிர LDL கொழுப்புக் குறைப்பு" : "2. Aggressive LDL-C Reduction",
          target: isTa ? "தீவிர இலக்கு: LDL < 55–70 mg/dL" : "Aggressive Target: LDL < 55–70 mg/dL",
          frequency: isTa ? "6 முதல் 8 வாரங்களுக்கு ஒருமுறை பரிசோதனை" : "Every 6 to 8 Weeks until stabilized",
          freqColor: "bg-rose-950/80 text-rose-300 border border-rose-500/30 font-bold",
          body: isTa
            ? "கார்டியாலஜிஸ்ட் பரிந்துரைத்த ஸ்டேடின் மாத்திரைகளை ஒருநாளும் தவிர்க்காமல் உட்கொள்ளவும். நெய், சிவப்பு இறைச்சி, வறுத்த உணவுகள் மற்றும் முட்டை மஞ்சள் கருவை தவிர்க்கவும். 6-8 வாரங்களில் லிப்பிட் அளவை மறுபரிசீலனை செய்யவும்."
            : "High-intensity statin therapy (Atorvastatin/Rosuvastatin) strictly as directed by your cardiologist. Zero tolerance for trans-fats, saturated red meats, and deep-fried snacks. Re-check fasting lipids every 6–8 weeks.",
          tip: isTa ? "ஸ்டேடின் மாத்திரைகள் தமனிகளில் உள்ள அடைப்புகள் வெடிக்காமல் நிலைப்படுத்துகிறது" : "Statins actively stabilize vulnerable arterial plaques and damp down vascular inflammation"
        },
        {
          id: 3,
          icon: Scale,
          title: isTa ? "3. ரத்த சர்க்கரை தினசரி கண்காணிப்பு" : "3. Strict Glycemic Tight Control",
          target: isTa ? "Fasting 80–110 mg/dL | HbA1c < 6.5–7.0%" : "Fasting 80–110 mg/dL | HbA1c < 6.5–7.0%",
          frequency: isTa ? "வாரந்தோறும் வீட்டில் குளூக்கோமீட்டர் பரிசோதனை" : "Frequent SMBG / Bi-Weekly Glucose Checks",
          freqColor: "bg-rose-950/80 text-rose-300 border border-rose-500/30 font-bold",
          body: isTa
            ? "வீட்டிலேயே குளூக்கோமீட்டர் மூலம் சர்க்கரையை அடிக்கடி சோதிக்கவும். சர்க்கரை உயர்வு தமனி வீக்கத்தை விரைவுபடுத்தும். சர்க்கரை மாத்திரைகள் அல்லது இன்சுலினை இதய மருந்துகளோடு சரியாக இணைத்து உட்கொள்ளவும்."
            : "Maintain tight glycemic control. Blood sugar spikes dramatically amplify microvascular calcification and vascular stiffness. Coordinate anti-diabetic and cardiovascular therapies with your specialist.",
          tip: isTa ? "சர்க்கரையைக் கட்டுப்பாட்டில் வைப்பது இதய தசை செயலிழப்பு (Heart Failure) அபாயத்தை குறைக்கிறது" : "Glycemic stability shields coronary microvessels from advanced glycation end-products (AGEs)"
        },
        {
          id: 4,
          icon: Footprints,
          title: isTa ? "4. எச்சரிக்கையான குறைந்த தீவிர நடை" : "4. Conservative Walking Protocol (Safety-First)",
          target: isTa ? "20–30 நிமிடம் மெதுவான நடை (சமமான தரை)" : "20–30 mins Low-Intensity Supervised Walk",
          frequency: isTa ? "தினமும் இருவேளை 15 நிமிடம்" : "Daily Short Sessions (15 mins x 2)",
          freqColor: "bg-rose-950/80 text-rose-300 border border-rose-500/30 font-bold",
          body: isTa
            ? "கடுமையான எடைகளை தூக்குவது, விரைந்து ஓடுவது முற்றிலும் தடை செய்யப்பட்டுள்ளது. சமமான தரையில் மட்டுமே நிதானமாக நடக்கவும். மார்பு இறுக்கம், தலைசுற்றல் அல்லது மூச்சுத்திணறல் ஏற்பட்டால் உடனே நடைப்பயிற்சியை நிறுத்தி அமரவும்."
            : "STRICT ACTIVITY SAFETY: Low-intensity walking on flat ground only. Stop immediately if experiencing chest tightness, dizziness, or unusual breathlessness. CONTRAINDICATION: No heavy lifting, isometric straining, or high-intensity bursts.",
          tip: isTa ? "எச்சரிக்கை: BP 160/100 mmHg-க்கு மேல் இருந்தால் உடற்பயிற்சி செய்யக் கூடாது" : "Red-Flag Contraindication: Never exercise during acute symptomatic episodes or BP >= 160/100 mmHg",
          link: "/exercise"
        },
        {
          id: 5,
          icon: Utensils,
          title: isTa ? "5. தீவிர குறைந்த சோடியம் உணவு முறை" : "5. Therapeutic Sodium Restriction (< 1,500 mg)",
          target: isTa ? "கடுமையான சோடியம்: < 1,500 mg/நாள் (< 1/2 டீஸ்பூன் உப்பு)" : "Strict Sodium: < 1,500 mg/day (< 1/2 tsp salt)",
          frequency: isTa ? "கண்டிப்பான மருத்துவ உணவு முறை" : "Cardiac-Safe Low-Sodium Plate",
          freqColor: "bg-rose-950/80 text-rose-300 border border-rose-500/30 font-bold",
          body: isTa
            ? "உணவில் உப்பை மிகவும் குறைவாக சேர்க்கவும். உணவக குழம்புகள், பாக்கெட் சூப், ஊறுகாய், அப்பளம் ஆகியவற்றை அறவே தவிர்க்கவும். ஆவியில் வேகவைத்த உணவுகள் (இட்லி, கஞ்சி, சுண்டல்) மட்டுமே உண்பது சிறந்தது."
            : "Zero table salt added. Completely avoid restaurant gravies, canned broths, processed savories, and pickles. Base daily intake on steamed idli, ragi malt, moong dal khichdi, and fresh potassium-rich steamed vegetables.",
          tip: isTa ? "உப்பை 1,500 மி.கி-க்குள் கட்டுப்படுத்துவது ஒரு BP மாத்திரை தரும் பலனுக்கு சமம்" : "Sodium restriction under 1,500 mg/day yields blood pressure reduction equivalent to monotherapy",
          link: "/diet"
        },
        {
          id: 6,
          icon: CalendarCheck,
          title: isTa ? "6. மாதாந்திர இதய நிபுணர் சந்திப்பு" : "6. Monthly Cardiologist Review & Adherence",
          target: isTa ? "மாதாந்திர கிளினிக்கல் கண்காணிப்பு & மாத்திரை கட்டுப்பாடு" : "Monthly Specialist Review & 100% Adherence",
          frequency: isTa ? "4 முதல் 8 வாரங்களுக்கு ஒருமுறை" : "Every 4 to 8 Weeks",
          freqColor: "bg-rose-950/80 text-rose-300 border border-rose-500/30 font-bold",
          body: isTa
            ? "கார்டியாலஜிஸ்ட் பரிந்துரைத்த மாத்திரைகளை (BP, கொலஸ்ட்ரால், ரத்த உறைவு தடுப்பு மருந்துகள்) குறித்த நேரத்தில் எடுக்கவும். உடம்பு நன்றாக இருப்பதாக நினைத்து மாத்திரைகளை நிறுத்தக் கூடாது. அவசர உதவி எண்களை (112/108) குறித்து வைக்கவும்."
            : "Strictly adhere to your multi-drug cardiac regimen (anti-hypertensive, high-potency statin, antiplatelet / beta-blocker). Never skip or reduce dosages without explicit cardiologist direction. Keep emergency numbers (112 / 108) ready.",
          tip: isTa ? "அவசர எண்களை (112/108) எப்போதும் தயாராக வைக்கவும்; மாத்திரைகளை தவறாமல் எடுக்கவும்" : "Set automated medication reminders; never allow your prescription supplies to run out",
          link: "/reminders"
        }
      ]
    }
  }

  const currentContent = tierContent[activeTier]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 bg-teal-950 border border-teal-500/30 px-2.5 py-0.5 rounded-full font-bold">
            {isTa ? "இதய நல பராமரிப்பு" : "Health Management & Monitoring"}
          </span>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs text-slate-400">
            {isTa ? "ஆரோக்கிய கண்காணிப்பு வழிகாட்டி" : "Risk Factor Maintenance"}
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-teal-400" />
          <span>
            {isTa ? "இதய அபாய காரணிகள் பராமரிப்பு & கண்காணிப்பு" : "Risk Factor Maintenance & Monitoring"}
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
          {isTa
            ? "உங்கள் இதய அபாய நிலைக்கு ஏற்ப (குறைந்த, மிதமான அல்லது உயர் அபாயம்) தனிப்பயனாக்கப்பட்ட கண்காணிப்பு வழிகாட்டிகள் மற்றும் பராமரிப்பு இலக்குகள்."
            : "Personalized cardiovascular maintenance targets, monitoring schedules, and habit protocols adapted dynamically to your risk tier."}
        </p>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Interactive Risk Tier Switcher */}
      <div className="glass-card rounded-2xl p-3 border border-slate-800 bg-slate-900/90 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>{isTa ? "அபாய நிலை அடிப்படையிலான வழிகாட்டல்:" : "Risk Tier Guidance Level:"}</span>
          </span>
          {latestPred && (
            <span className="text-[11px] text-slate-400">
              {isTa ? "உங்கள் தற்போதைய மதிப்பீடு: " : "Your Evaluated Risk: "}
              <strong className={
                userActualTier === "HIGH" ? "text-rose-400" : userActualTier === "MODERATE" ? "text-amber-400" : "text-emerald-400"
              }>
                {latestPred.risk_percentage ? `${latestPred.risk_percentage}% ` : ""}({userActualTier} RISK)
              </strong>
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Low Risk Tab */}
          <button
            type="button"
            onClick={() => setSelectedTier("LOW")}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              activeTier === "LOW"
                ? "bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-950/40"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${activeTier === "LOW" ? "bg-emerald-400" : "bg-emerald-600"}`}></span>
              <span>{isTa ? "குறைந்த அபாயம்" : "Low Risk (< 20%)"}</span>
            </div>
            <span className="text-[10px] font-normal text-slate-400">
              {userActualTier === "LOW" ? (isTa ? "உங்கள் நிலை" : "Your Current Tier") : (isTa ? "ஆரோக்கிய பராமரிப்பு" : "Wellness Plan")}
            </span>
          </button>

          {/* Moderate Risk Tab */}
          <button
            type="button"
            onClick={() => setSelectedTier("MODERATE")}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              activeTier === "MODERATE"
                ? "bg-amber-950/80 border-amber-500 text-amber-200 shadow-md shadow-amber-950/40"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${activeTier === "MODERATE" ? "bg-amber-400" : "bg-amber-600"}`}></span>
              <span>{isTa ? "மிதமான அபாயம்" : "Moderate Risk (20–50%)"}</span>
            </div>
            <span className="text-[10px] font-normal text-slate-400">
              {userActualTier === "MODERATE" ? (isTa ? "உங்கள் நிலை" : "Your Current Tier") : (isTa ? "கட்டுப்பாட்டு திட்டம்" : "Targeted Control")}
            </span>
          </button>

          {/* High Risk Tab */}
          <button
            type="button"
            onClick={() => setSelectedTier("HIGH")}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              activeTier === "HIGH"
                ? "bg-rose-950/80 border-rose-500 text-rose-200 shadow-md shadow-rose-950/40"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${activeTier === "HIGH" ? "bg-rose-400 animate-pulse" : "bg-rose-600"}`}></span>
              <span>{isTa ? "உயர் அபாயம்" : "High Risk (>= 50%)"}</span>
            </div>
            <span className="text-[10px] font-normal text-slate-400">
              {userActualTier === "HIGH" ? (isTa ? "உங்கள் நிலை" : "Your Current Tier") : (isTa ? "தீவிர கண்காணிப்பு" : "Intensive Care")}
            </span>
          </button>
        </div>
      </div>

      {/* Dynamic Tier Context Banner */}
      <div className={`glass-card rounded-3xl p-5 border ${currentContent.bannerTheme} space-y-3`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {isHigh ? (
              <AlertOctagon className="w-5 h-5 text-rose-400 animate-pulse flex-shrink-0" />
            ) : isMod ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            ) : (
              <Heart className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300">
                {currentContent.tag}
              </span>
              {activeTier === userActualTier && (
                <span className="text-[10px] font-bold text-teal-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> {isTa ? "மதிப்பீடு பொருத்தம்" : "Matches Your Assessment"}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white mt-1">
              {currentContent.headline}
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {currentContent.description}
            </p>
          </div>
        </div>

        {/* Quick Action Links */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs border-t border-slate-800/80">
          <Link
            to="/what-if"
            className="font-semibold text-teal-300 hover:text-white flex items-center gap-1 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-teal-500/30 transition-colors"
          >
            <span>{isTa ? "அளவீட்டு மாற்றங்களை சோதிக்க (What-If) →" : "Simulate Improvements in What-If →"}</span>
          </Link>
          <Link
            to="/diet"
            className="font-semibold text-emerald-300 hover:text-white flex items-center gap-1 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition-colors"
          >
            <span>{isTa ? "இதய நல உணவு முறை →" : "Heart-Healthy Diet Plan →"}</span>
          </Link>
          <Link
            to="/exercise"
            className="font-semibold text-blue-300 hover:text-white flex items-center gap-1 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-blue-500/30 transition-colors"
          >
            <span>{isTa ? "உடற்பயிற்சி வழிகாட்டல் →" : "Safe Activity Routine →"}</span>
          </Link>
          {isHigh && (
            <Link
              to="/emergency"
              className="font-semibold text-rose-300 hover:text-white flex items-center gap-1 bg-rose-950/60 px-3 py-1.5 rounded-xl border border-rose-500/40 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
              <span>{isTa ? "அவசர உதவி (112 / 108)" : "Emergency Triage (112 / 108)"}</span>
            </Link>
          )}
        </div>
      </div>

      {/* 6 Key Areas to Regularly Monitor and Maintain (Dynamic per Risk Tier) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" />
            <span>
              {isTa
                ? `6 முக்கிய பராமரிப்பு அம்சங்கள் (${isHigh ? "உயர் அபாயம்" : isMod ? "மிதமான அபாயம்" : "குறைந்த அபாயம்"})`
                : `6 Key Areas to Monitor & Maintain (${isHigh ? "High Risk Protocol" : isMod ? "Moderate Risk Protocol" : "Low Risk Protocol"})`}
            </span>
          </h2>
          <span className="text-[11px] text-slate-400">
            {isTa ? "தனிப்பயனாக்கப்பட்ட இலக்குகள்" : "Personalized Targets"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentContent.areas.map((area) => {
            const AreaIcon = area.icon
            return (
              <div
                key={area.id}
                className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/80 space-y-2.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${currentContent.iconColor}`}>
                    <AreaIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{area.title}</span>
                  </span>
                  <span className="text-[10px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded font-mono border border-slate-800 flex-shrink-0">
                    {area.target}
                  </span>
                </div>

                {/* Monitoring Frequency Badge */}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${area.freqColor}`}>
                    {area.frequency}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {area.body}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                  <div className="text-teal-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                    <span className="leading-tight">{area.tip}</span>
                  </div>
                  {area.link && (
                    <Link to={area.link} className="text-teal-400 hover:underline flex-shrink-0 font-semibold ml-2">
                      →
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Measurement Tracking & Recording Form */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-5">
        <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Save className="w-5 h-5 text-teal-400" />
              <span>{isTa ? "உங்கள் அளவீடுகளை பதிவு செய்க / புதுப்பிக்கவும்" : "Record / Update Your Current Measurements"}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isTa
                ? "இன்றைய அளவீடுகளைப் பதிவு செய்து உங்கள் முன்னேற்றப் பாதையைக் கண்காணிக்கவும்."
                : "Log your recent measurements to update your health baseline and record a progress check-in."}
            </p>
          </div>
          <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full self-start sm:self-auto font-mono">
            {new Date().toLocaleDateString(isTa ? "ta-IN" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {saveSuccess && (
          <div className="p-3.5 rounded-2xl bg-teal-950/50 border border-teal-500/40 text-xs text-teal-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        <form onSubmit={handleRecordMeasurements} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Systolic BP */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isTa ? "சிஸ்டாலிக் BP (Systolic mmHg)" : "Systolic BP (mmHg)"}
              </label>
              <input
                type="number"
                min="80"
                max="240"
                value={measurements.systolic_bp}
                onChange={(e) => handleInputChange("systolic_bp", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {isHigh ? (isTa ? "இலக்கு: < 120 (கண்டிப்பானது)" : "Strict Target: < 120") : (isTa ? "இயல்பானது: < 120" : "Desirable: < 120")}
              </span>
            </div>

            {/* Diastolic BP */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isTa ? "டயஸ்டாலிக் BP (Diastolic mmHg)" : "Diastolic BP (mmHg)"}
              </label>
              <input
                type="number"
                min="50"
                max="140"
                value={measurements.diastolic_bp}
                onChange={(e) => handleInputChange("diastolic_bp", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {isHigh ? (isTa ? "இலக்கு: < 75 (கண்டிப்பானது)" : "Strict Target: < 75") : (isTa ? "இயல்பானது: < 80" : "Desirable: < 80")}
              </span>
            </div>

            {/* Cholesterol */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isTa ? "மொத்த கொலஸ்ட்ரால் (Total Chol mg/dL)" : "Total Cholesterol (mg/dL)"}
              </label>
              <input
                type="number"
                min="100"
                max="450"
                value={measurements.cholesterol}
                onChange={(e) => handleInputChange("cholesterol", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {isHigh ? (isTa ? "இலக்கு: < 150 (தீவிர கட்டுப்பாடு)" : "Intensive Target: < 150") : (isTa ? "இயல்பானது: < 180" : "Desirable: < 180")}
              </span>
            </div>

            {/* Blood Glucose */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isTa ? "இரத்த சர்க்கரை (Glucose mg/dL)" : "Fasting Glucose (mg/dL)"}
              </label>
              <input
                type="number"
                min="60"
                max="350"
                value={measurements.blood_glucose}
                onChange={(e) => handleInputChange("blood_glucose", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {isTa ? "இயல்பானது: 70 – 99 mg/dL" : "Desirable: 70–99 mg/dL"}
              </span>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isTa ? "உடல் எடை (Weight kg)" : "Body Weight (kg)"}
              </label>
              <input
                type="number"
                min="35"
                max="200"
                step="0.5"
                value={measurements.weight_kg}
                onChange={(e) => handleInputChange("weight_kg", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {isTa ? "ஆசிய BMI: 18.5 – 22.9" : "Asian BMI: 18.5–22.9 kg/m²"}
              </span>
            </div>

            {/* Resting Heart Rate */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isTa ? "இதயத் துடிப்பு (Resting HR BPM)" : "Resting Heart Rate (BPM)"}
              </label>
              <input
                type="number"
                min="45"
                max="140"
                value={measurements.resting_hr}
                onChange={(e) => handleInputChange("resting_hr", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {isTa ? "இயல்பானது: 60 – 80 BPM" : "Desirable: 60–80 BPM"}
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {isTa ? "அளவீடுகள் உங்கள் சுயவிவரத்திலும் சேமிக்கப்படும்." : "Entries update both your profile and progress trajectory."}
            </span>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-950/40 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isTa ? "சேமிக்கப்படுகிறது..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isTa ? "முன்னேற்றத்தை பதிவு செய்" : "Save & Record Check-In"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Progress Over Time History */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span>{isTa ? "சமீபத்திய கண்காணிப்பு முன்னேற்றம்" : "Recent Monitoring & Progress Check-Ins"}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isTa
                ? "காலப்போக்கில் உங்கள் அளவீடுகள் எவ்வாறு முன்னேறுகின்றன என்பதைக் காணுங்கள்."
                : "Tracking your recorded measurements across clinical check-in dates."}
            </p>
          </div>
          <Link
            to="/progress"
            className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
          >
            <span>{isTa ? "முழு வரைபடம் காண்க →" : "View Full Charts →"}</span>
          </Link>
        </div>

        {recentRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="pb-2">{isTa ? "தேதி" : "Date"}</th>
                  <th className="pb-2">{isTa ? "இரத்த அழுத்தம்" : "Blood Pressure"}</th>
                  <th className="pb-2">{isTa ? "கொலஸ்ட்ரால்" : "Cholesterol"}</th>
                  <th className="pb-2">{isTa ? "சர்க்கரை" : "Blood Glucose"}</th>
                  <th className="pb-2">{isTa ? "எடை" : "Weight"}</th>
                  <th className="pb-2 text-right">{isTa ? "மதிப்பிடப்பட்ட அபாயம்" : "Estimated Risk"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {recentRecords.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2.5 text-slate-300">
                      {rec.created_at ? rec.created_at.substring(0, 10) : rec.date || "Logged"}
                    </td>
                    <td className="py-2.5 text-white font-semibold">
                      {rec.systolic_bp || 130} / {rec.diastolic_bp || 84} <span className="text-[10px] text-slate-400">mmHg</span>
                    </td>
                    <td className="py-2.5 text-slate-300">
                      {rec.cholesterol || 200} <span className="text-[10px] text-slate-400">mg/dL</span>
                    </td>
                    <td className="py-2.5 text-slate-300">
                      {rec.blood_glucose || 100} <span className="text-[10px] text-slate-400">mg/dL</span>
                    </td>
                    <td className="py-2.5 text-slate-300">
                      {rec.weight_kg ? `${rec.weight_kg} kg` : "—"}
                    </td>
                    <td className="py-2.5 text-right font-bold text-teal-400">
                      {rec.risk_percentage ? `${rec.risk_percentage}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            <p>{isTa ? "இன்னும் பதிவுகள் இல்லை. மேலே உள்ள படிவத்தைப் பயன்படுத்தி முதல் அளவீட்டைப் பதிவு செய்க." : "No recorded check-ins yet. Use the form above to record your first measurement checkpoint."}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RiskMaintenance
