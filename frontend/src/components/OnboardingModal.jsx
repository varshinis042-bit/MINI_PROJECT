import React, { useState } from "react"
import {
  Heart,
  User,
  Activity,
  Lightbulb,
  Salad,
  LineChart,
  AlertOctagon,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  ChefHat,
  Pill,
  Languages
} from "lucide-react"
import { useLanguage } from "../context/LanguageContext"

export const OnboardingModal = ({ isOpen, onClose }) => {
  const { lang, toggleLang, t } = useLanguage()
  const [step, setStep] = useState(1)
  const totalSteps = 7

  if (!isOpen) return null

  const handleFinish = () => {
    localStorage.setItem("cardio_onboarding_completed", "true")
    onClose()
  }

  const handleSkip = () => {
    localStorage.setItem("cardio_onboarding_completed", "true")
    onClose()
  }

  const stepsData = [
    {
      step: 1,
      title: lang === "ta" ? "உங்கள் இதய நல உதவியாளருக்கு நல்வரவு!" : "Welcome to your Heart Health Assistant!",
      subtitle: lang === "ta" ? "உங்கள் இதய நலனை எளிய முறையில் கண்காணிக்கவும் பேணவும் ஒரு வழிகாட்டி" : "Simple, personalized heart health guidance at your fingertips",
      icon: Heart,
      iconColor: "text-rose-400 bg-rose-500/20 border-rose-500/30",
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            {lang === "ta"
              ? "இதயத்தைப் பாதுகாப்பது இனி கடினமானதல்ல. இந்த வழிகாட்டி உங்கள் இதய அபாயத்தை எளிய முறையில் கணக்கிட்டு, நமது பாரம்பரிய உணவுகள் மற்றும் ஆரோக்கியமான பழக்கங்களை பரிந்துரைக்கிறது."
              : "Taking care of your heart doesn't have to be complicated. This assistant helps you estimate your heart health status, provides culturally personalized food recommendations, and helps you stay on track with daily healthy habits."}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5">
              <span className="text-emerald-400 text-base">✓</span>
              <div>
                <strong className="text-white block text-xs">{lang === "ta" ? "எளிய தமிழ் & ஆங்கிலம்" : "Plain Language"}</strong>
                <span className="text-xs text-slate-400">{lang === "ta" ? "மருத்துவ சொற்கள் இல்லாத தெளிவான முடிவுகள்." : "Clear results without confusing medical jargon."}</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5">
              <span className="text-teal-400 text-base">✓</span>
              <div>
                <strong className="text-white block text-xs">{lang === "ta" ? "பாரம்பரிய தென்னிந்திய உணவு" : "Personalized Diet"}</strong>
                <span className="text-xs text-slate-400">{lang === "ta" ? "ராகி, கம்பு, பருப்பு போன்ற ஆரோக்கியமான உணவுத் திட்டங்கள்." : "Regional Indian meal plans suited for heart health."}</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5">
              <span className="text-indigo-400 text-base">✓</span>
              <div>
                <strong className="text-white block text-xs">{lang === "ta" ? "பாதுகாப்பான உடற்பயிற்சி" : "Safe Activity"}</strong>
                <span className="text-xs text-slate-400">{lang === "ta" ? "இரத்த அழுத்தத்திற்கு பாதுகாப்பான எளிய நடைப்பயிற்சி." : "Gentle routines adapted to your fitness level."}</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5">
              <span className="text-amber-400 text-base">✓</span>
              <div>
                <strong className="text-white block text-xs">{lang === "ta" ? "தினசரி நினைவூட்டல்கள்" : "Daily Reminders"}</strong>
                <span className="text-xs text-slate-400">{lang === "ta" ? "மருந்துகள் மற்றும் தண்ணீர் குடிக்க சரியான நேர நினைவூட்டல்." : "Timely reminders for pills, walks, and blood pressure."}</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      step: 2,
      title: lang === "ta" ? "படி 1: உங்கள் உடல் விவரங்களை பதிவு செய்யவும்" : "Step 1: Set up your Health Profile",
      subtitle: lang === "ta" ? "வயது, இரத்த அழுத்தம், சர்க்கரை மற்றும் கொலஸ்ட்ரால் அளவுகள்" : "Age, blood pressure, cholesterol, and fasting glucose",
      icon: User,
      iconColor: "text-teal-400 bg-teal-500/20 border-teal-500/30",
      content: (
        <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
          <p>
            {lang === "ta"
              ? "உங்கள் சுயவிவரத்தில் சமீபத்திய இரத்த அழுத்தம் மற்றும் இரத்த பரிசோதனை முடிவுகளைப் பதிவு செய்வதன் மூலம் துல்லியமான இதய நலக் கணிப்புகளைப் பெறலாம்."
              : "Entering your basic health measurements helps the AI provide personalized risk estimates tailored to your body."}
          </p>
          <div className="p-3.5 rounded-xl bg-teal-950/30 border border-teal-500/30 text-xs space-y-2">
            <div className="font-semibold text-teal-300">
              {lang === "ta" ? "நீங்கள் சேர்க்க வேண்டிய முக்கிய விவரங்கள்:" : "Key values you can record:"}
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div>• {lang === "ta" ? "இரத்த அழுத்தம் (BP)" : "Blood Pressure (e.g. 120/80)"}</div>
              <div>• {lang === "ta" ? "கொலஸ்ட்ரால் அளவு" : "Total Cholesterol"}</div>
              <div>• {lang === "ta" ? "இரத்த சர்க்கரை" : "Fasting Glucose"}</div>
              <div>• {lang === "ta" ? "உயரம் மற்றும் எடை (BMI)" : "Height & Weight (BMI)"}</div>
            </div>
          </div>
        </div>
      )
    },
    {
      step: 3,
      title: lang === "ta" ? "படி 2: இதய அபாய மதிப்பீடு & ECG படம் சரிபார்த்தல்" : "Step 2: Check Heart Risk & Monitor ECG Images",
      subtitle: lang === "ta" ? "2 நிமிட கேள்வித்தாள் மற்றும் ECG அச்சுப் பட பகுப்பாய்வு" : "2-minute health questionnaire & software ECG waveform preview",
      icon: Activity,
      iconColor: "text-rose-400 bg-rose-500/20 border-rose-500/30",
      content: (
        <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
          <p>
            {lang === "ta"
              ? "எங்கள் இதய மதிப்பீட்டு வினாடி வினா மூலம் உங்கள் 10 ஆண்டு இதய அபாய சதவீதத்தை அறியலாம். மேலும் உங்கள் மருத்துவமனை ECG தாளை புகைப்படமாக பதிவேற்றி ஆய்வு செய்யலாம்!"
              : "Our risk questionnaire gives you an immediate 10-year percentage estimate. You can also upload a photo of an ECG paper strip for software waveform inspection!"}
          </p>
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
            <div className="font-semibold text-rose-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-400" />
              <span>{lang === "ta" ? "புதிய ECG பட கண்காணிப்பு" : "Software ECG Strip Inspection"}</span>
            </div>
            <p className="text-slate-400">
              {lang === "ta"
                ? "உங்கள் ECG புகைப்படத்தை பதிவேற்றி அலைவடிவம், இதய துடிப்பு சீரான தன்மை மற்றும் படத்தரத்தை உடனடியாகப் பார்க்கலாம்."
                : "Upload an image of your ECG paper strip to inspect signal periodicity, waveform resolution, and review pattern classifications."}
            </p>
          </div>
        </div>
      )
    },
    {
      step: 4,
      title: lang === "ta" ? "படி 3: இந்த முடிவின் பின்னணி என்ன?" : "Step 3: Understand 'Why this result?'",
      subtitle: lang === "ta" ? "அபாயத்தை அதிகரிக்கும் மற்றும் பாதுகாக்கும் காரணிகள்" : "See what factors increase or decrease your cardiovascular risk",
      icon: Lightbulb,
      iconColor: "text-amber-400 bg-amber-500/20 border-amber-500/30",
      content: (
        <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
          <p>
            {lang === "ta"
              ? "ஒரு எண்ணை மட்டும் பார்க்காமல், உங்கள் இதய நலனை பாதிக்கும் காரணிகளை வெளிப்படையாகப் புரிந்துகொள்ளுங்கள்."
              : "Instead of a mysterious number, our AI explainability shows exactly what influences your result."}
          </p>
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-1.5">
            <div className="font-semibold text-amber-300">
              {lang === "ta" ? "அபாய காரணிகள் vs பாதுகாப்புக் காரணிகள்" : "Top Contributing Factors"}
            </div>
            <p className="text-slate-300">
              {lang === "ta"
                ? "கொலஸ்ட்ரால், இரத்த அழுத்தம் போன்ற அபாய காரணிகளையும், நீங்கள் தினமும் நடக்கும் நடைப்பயிற்சி போன்ற பாதுகாப்புக் காரணிகளையும் தனித்தனியாக விளக்குகிறது."
                : "Highlights the Top 3 risk-elevating factors alongside your Top protective factors (such as brisk walking, non-smoking, and normal blood sugar)."}
            </p>
          </div>
        </div>
      )
    },
    {
      step: 5,
      title: lang === "ta" ? "படி 4: இதய நல உணவு & சமையலறை உணவுப் பரிந்துரை" : "Step 4: Heart-Healthy Diet & Smart Meal Suggestions",
      subtitle: lang === "ta" ? "உங்களிடம் உள்ள சமையல் பொருட்களை வைத்து சுவையான ஆரோக்கியமான உணவுகள்" : "Discover South Indian recipes based on what's in your kitchen",
      icon: ChefHat,
      iconColor: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
      content: (
        <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
              <strong className="text-emerald-300 block mb-1">
                {lang === "ta" ? "🥗 சமையலறை உணவுப் பரிந்துரை" : "🥗 Smart Meal Suggestions"}
              </strong>
              <p className="text-slate-300">
                {lang === "ta"
                  ? "தக்காளி, ராகி, முட்டை, கீரை என உங்களிடம் உள்ள பொருட்களைத் தேர்ந்தெடுத்து இதயத்திற்கு உகந்த தென்னிந்திய உணவுகளை உடனடியாகக் கண்டறியலாம்!"
                  : "Pick ingredients you have (Eggs, Tomato, Ragi, Moong Dal) to get authentic heart-healthy South Indian recipes with cooking steps."}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
              <strong className="text-indigo-300 block mb-1">
                {lang === "ta" ? "🏃 பாதுகாப்பான உடற்பயிற்சி" : "🏃 Activity Recommendations"}
              </strong>
              <p className="text-slate-300">
                {lang === "ta"
                  ? "உங்கள் இதயத் துடிப்பு மற்றும் இரத்த அழுத்தத்திற்கு பாதுகாப்பான உடற்பயிற்சிகளைப் பின்பற்றுங்கள்."
                  : "Personalized physical activity plans calibrated safely for your blood pressure and endurance."}
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      step: 6,
      title: lang === "ta" ? "படி 5: 'நான் மாறினால் என்னவாகும்?' & நினைவூட்டல்கள்" : "Step 5: 'What-If' Simulator & Routine Reminders",
      subtitle: lang === "ta" ? "பழக்கவழக்கங்களை மாற்றினால் ஏற்படும் உடனடி நன்மைகள்" : "Simulate risk reduction and never miss daily medication",
      icon: Pill,
      iconColor: "text-purple-400 bg-purple-500/20 border-purple-500/30",
      content: (
        <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
          <p>
            {lang === "ta"
              ? "உங்கள் இரத்த அழுத்தம் 10 புள்ளிகள் குறைந்தாலோ அல்லது தினமும் 30 நிமிடங்கள் நடந்தாலோ உங்கள் இதய அபாயம் எவ்வாறு குறையும் என்பதை நேரடியாக சோதித்துப் பார்க்கலாம்."
              : "Curious how much your risk drops if you lower blood pressure or walk 30 minutes daily? Slide interactive controls in the What-If Simulator."}
          </p>
          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs space-y-1.5">
            <div className="font-semibold text-purple-300">
              {lang === "ta" ? "தினசரி நினைவூட்டல்கள்" : "Medication & Hydration Alarms"}
            </div>
            <p className="text-slate-300">
              {lang === "ta"
                ? "உங்கள் மாத்திரைகள், நீர் அருந்துதல், மற்றும் BP சரிபார்ப்பு நினைவூட்டல்களை திட்டமிட்டு உங்கள் மொபைல்/கணினியில் அறிவிப்புகளைப் பெறுங்கள்."
                : "Set automated in-app and browser notifications for prescribed heart pills, hydration, and daily check-ins."}
            </p>
          </div>
        </div>
      )
    },
    {
      step: 7,
      title: lang === "ta" ? "படி 6: அவசர அறிகுறிகள் & பாதுகாப்பு எச்சரிக்கை" : "Step 6: Emergency Red Flags & Critical Safety",
      subtitle: lang === "ta" ? "உங்கள் பாதுகாப்பு எப்போதும் முதன்மையானது" : "Your safety is always the highest priority",
      icon: AlertOctagon,
      iconColor: "text-rose-400 bg-rose-500/20 border-rose-500/30",
      content: (
        <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-2">
            <div className="font-bold text-rose-300 text-sm flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span>{lang === "ta" ? "அவசர காலத்தில் செயலி முடிவுகளுக்காக காத்திருக்காதீர்கள்!" : "Never wait for an app in a medical emergency!"}</span>
            </div>
            <p className="text-slate-200 leading-relaxed">
              {lang === "ta"
                ? "திடீர் கடுமையான நெஞ்சு வலி, இடது கை அல்லது தாடைக்கு வலி பரவுதல், கடும் மூச்சுத்திணறல் அல்லது குளிர்ந்த வியர்வை ஏற்பட்டால் உடனே அவசர சிகிச்சையைத் தொடர்பு கொள்ளுங்கள்:"
                : "If you or anyone near you experiences sudden crushing chest pain, pain radiating to the left arm or jaw, severe breathlessness, or cold sweats, call emergency services immediately:"}
            </p>
            <div className="p-2.5 rounded-lg bg-rose-900/40 font-bold text-rose-200 flex items-center justify-around text-center text-xs">
              <span>{lang === "ta" ? "காவல்துறை/அவசரம்:" : "Emergency Dispatch:"} <strong>112</strong></span>
              <span>•</span>
              <span>{lang === "ta" ? "ஆம்புலன்ஸ்:" : "Ambulance:"} <strong>108</strong></span>
              <span>•</span>
              <span>{lang === "ta" ? "சர்வதேசம்:" : "US/Intl:"} <strong>911</strong></span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {lang === "ta"
              ? "இந்த மென்பொருள் வாழ்க்கைமுறை வழிகாட்டலுக்காக மட்டுமே உருவாக்கப்பட்டது. இது மருத்துவரின் சிகிச்சைக்கு மாற்றல்ல."
              : "This application is for preventive lifestyle guidance and decision support. It does not replace emergency medical care or doctors' advice."}
          </p>
        </div>
      )
    }
  ]

  const current = stepsData[step - 1]
  const Icon = current.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card max-w-xl w-full rounded-3xl border border-slate-700/80 p-6 sm:p-8 shadow-2xl bg-slate-900/95 relative overflow-hidden">
        {/* Close and Language Toggle */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold flex items-center gap-1 border border-slate-700"
            title="Switch Language"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === "ta" ? "EN" : "தமிழ்"}</span>
          </button>

          <button
            onClick={handleSkip}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Skip tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-4 pr-24">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950 border border-teal-500/30 px-2.5 py-0.5 rounded-full">
            {lang === "ta" ? `வழிகாட்டி • படி ${step} / ${totalSteps}` : `Tutorial • Step ${step} of ${totalSteps}`}
          </span>
          <div className="flex items-center gap-1">
            {stepsData.map((s) => (
              <div
                key={s.step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s.step === step
                    ? "w-6 bg-teal-400"
                    : s.step < step
                    ? "w-2.5 bg-teal-600"
                    : "w-2.5 bg-slate-700"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center flex-shrink-0 ${current.iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {current.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Body Content */}
        <div className="min-h-[220px] mb-6">
          {current.content}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={handleSkip}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors py-2 px-3 rounded-lg hover:bg-slate-800/50"
          >
            {lang === "ta" ? "வழிகாட்டியைத் தவிர்" : "Skip Tutorial"}
          </button>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> {lang === "ta" ? "முந்தையது" : "Back"}
              </button>
            )}

            {step < totalSteps ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white transition-all shadow-md shadow-teal-950/40 flex items-center gap-1.5"
              >
                {lang === "ta" ? "அடுத்தது" : "Next"} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-xs font-bold text-white transition-all shadow-lg shadow-teal-950/50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> {lang === "ta" ? "முடித்து தொடங்கவும்" : "Finish & Start"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
export default OnboardingModal