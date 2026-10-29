import React, { createContext, useContext, useState, useEffect } from "react"

const translations = {
  en: {
    // Brand & App Title
    app_title: "Heart Assistant",
    APP_TITLE: "Heart Assistant",
    brand_name: "Cardio AI",
    brand_subtitle: "Your Personal Heart Health Assistant",
    emergency_help: "Emergency Help",
    call_hotline: "Call 112 / 108",
    help_tutorial: "Help / Tutorial",
    how_to_use: "How to use this app?",
    
    // Greetings
    greeting_morning: "Good Morning",
    greeting_afternoon: "Good Afternoon",
    greeting_evening: "Good Evening",
    greeting_sub: "Let's take care of your heart today ❤️",
    today_is: "Today is",

    // Navigation
    nav_dashboard: "Dashboard",
    nav_profile: "My Health Profile",
    nav_risk_assessment: "Check My Heart Risk",
    nav_result: "Your Heart Result",
    nav_manage_risk: "Manage & Monitor Risk",
    nav_ecg: "ECG Monitor",
    nav_explain: "Explain My Risk",
    nav_explainability: "Explain My Risk",
    nav_whatif: "What-If Simulator",
    nav_what_if: "What-If Simulator",
    nav_daily_plan: "Daily Health Plan",
    nav_diet: "My Diet",
    nav_smart_meals: "Meal Suggestions",
    nav_meal_suggest: "Meal Suggestions",
    nav_meal_analysis: "Meal Analysis",
    nav_meals: "Meal Analysis",
    nav_lifestyle: "My Lifestyle Score",
    nav_exercise: "My Activity Plan",
    nav_personalized_care: "Personalized Care",
    nav_reminders: "Medication Reminders",
    nav_progress: "My Progress",
    nav_emergency: "Emergency Help",
    nav_performance: "Model Performance",
    nav_about: "About System",
    nav_settings: "Settings",

    // Daily Health Plan & Notifications
    daily_plan_title: "Personalized Daily Health Routine",
    daily_plan_subtitle: "Customized heart wellness schedule based on your risk profile, diet, and prescribed medications",
    next_reminder: "Next Reminder",
    mark_complete: "Mark Complete",
    completed: "Completed",
    allow_notifications: "Enable Notifications",
    not_now: "Not Now",
    notifications_enabled: "Notifications Active",
    notifications_disabled: "Notifications Disabled",
    notification_pref: "Notification Preferences",
    breakfast_reminder: "Breakfast Reminder",
    lunch_reminder: "Lunch Reminder",
    dinner_reminder: "Dinner Reminder",
    hydration_reminder: "Hydration Reminder",
    exercise_reminder: "Activity Reminder",
    medication_reminder: "Medication Reminder",
    general_reminder: "General Routine",
    plan_progress: "Today's Routine Progress",
    view_full_plan: "View Full Plan",
    refresh_plan: "Regenerate Plan",
    all_notifications: "All Notifications",
    mark_all_read: "Mark All as Read",
    no_notifications: "No notifications yet",
    enable_notifications_prompt: "Stay on track with timely heart health alerts, meal guidance, and scheduled medication reminders.",
    time_left: "remaining",
    plan_empty: "No health plan items found for today.",
    plan_generating: "Generating your personalized routine...",
    save_preferences: "Save Preferences",
    quiet_hours: "Quiet Hours",
    start_time: "Start Time",
    end_time: "End Time",
    enabled_types: "Notification Categories",


    // Summary Cards
    card_risk: "Heart Risk",
    card_bp: "Blood Pressure",
    card_chol: "Cholesterol",
    card_sugar: "Blood Sugar",
    card_bmi: "BMI",
    card_hr: "Heart Rate",

    // Status Tags
    status_normal: "Normal",
    status_monitor: "Monitor",
    status_attention: "Needs Attention",
    status_high: "High Risk",
    status_moderate: "Moderate Risk",
    status_low: "Low Risk",
    status_good: "Good",

    // Today's Actions
    actions_title: "Today's Health Actions",
    action_check_risk: "Check Risk",
    action_upload_ecg: "Upload ECG",
    action_diet: "My Diet",
    action_exercise: "Exercise",
    action_reminders: "Reminders",
    action_progress: "Health Progress",

    // Body Health
    body_title: "My Body Health",
    body_subtitle: "Click any body area to view your indicators and what you can do today.",
    organ_heart: "Heart",
    organ_blood: "Blood",
    organ_body: "Body",
    organ_lungs: "Lungs",
    organ_mind: "Mind",

    // Today's Plan Checklist
    plan_title: "Today's Health Plan",
    plan_subtitle: "Daily personal habits checklist for a healthier heart.",
    plan_water: "Drink 8 glasses of clean water",
    plan_meds: "Take doctor-prescribed morning/night medicine",
    plan_walk: "15–20 minutes of brisk walking or stretching",
    plan_diet: "Eat a heart-healthy fiber-rich breakfast/meal",
    plan_bp: "Check blood pressure reading if scheduled",
    plan_sleep: "Restful sleep for 7–8 hours tonight",
    plan_completed: "Completed Today",

    // Alerts
    alerts_title: "Important Health Alerts",
    alert_high_risk: "High Risk Attention: Your estimated risk indicates focused medical attention and lifestyle changes are advised.",
    alert_reminders_due: "Scheduled Reminders: You have pending medications or routine checks today.",
    alert_profile_incomplete: "Profile Notice: Completing your profile with recent lab tests improves estimate accuracy.",

    // Medical Disclaimer
    disclaimer_short: "Cardio AI is for lifestyle awareness & decision support. Not a doctor or medical diagnosis.",
    disclaimer_emergency: "Emergency Notice: If experiencing acute chest pain or breathlessness, call 112 / 108 immediately.",

    // Common Buttons
    btn_next: "Next",
    btn_back: "Back",
    btn_skip: "Skip Tutorial",
    btn_finish: "Finish & Start",
    btn_save: "Save",
    btn_cancel: "Cancel",
    btn_start_assessment: "Start Assessment",
    btn_upload_image: "Upload Image",
    btn_view_details: "View Details"
  },

  ta: {
    // Brand & App Title
    app_title: "இதய நல உதவியாளர்",
    APP_TITLE: "இதய நல உதவியாளர்",
    brand_name: "கார்டியோ AI",
    brand_subtitle: "உங்கள் தனிப்பயனாக்கப்பட்ட இதய நல உதவியாளர்",
    emergency_help: "அவசர உதவி",
    call_hotline: "அழைக்க: 112 / 108",
    help_tutorial: "உதவி / வழிகாட்டி",
    how_to_use: "இதை எவ்வாறு பயன்படுத்துவது?",

    // Greetings
    greeting_morning: "காலை வணக்கம்",
    greeting_afternoon: "மதிய வணக்கம்",
    greeting_evening: "மாலை வணக்கம்",
    greeting_sub: "இன்றே உங்கள் இதயத்தை கவனித்துக் கொள்ளுங்கள் ❤️",
    today_is: "இன்று",

    // Navigation
    nav_dashboard: "முகப்பு",
    nav_profile: "என் சுயவிவரம்",
    nav_risk_assessment: "இதய அபாய பரிசோதனை",
    nav_result: "பரிசோதனை முடிவு",
    nav_manage_risk: "அபாய கண்காணிப்பு & பராமரிப்பு",
    nav_ecg: "ECG இதய கண்காணிப்பு",
    nav_explain: "காரணங்களை அறிக",
    nav_explainability: "காரணங்களை அறிக",
    nav_whatif: "மாற்றங்களின் பலன்",
    nav_what_if: "மாற்றங்களின் பலன்",
    nav_daily_plan: "தினசரி ஆரோக்கிய திட்டம்",
    nav_diet: "உணவு முறை",
    nav_smart_meals: "உணவு பரிந்துரை",
    nav_meal_suggest: "உணவு பரிந்துரை",
    nav_meal_analysis: "உணவுப் பதிவு",
    nav_meals: "உணவுப் பதிவு",
    nav_lifestyle: "வாழ்க்கை முறை மதிப்பீடு",
    nav_exercise: "உடற்பயிற்சி திட்டம்",
    nav_personalized_care: "தனிப்பயன் இதய பராமரிப்பு",
    nav_reminders: "நினைவூட்டல்கள்",
    nav_progress: "என் முன்னேற்றம்",
    nav_emergency: "அவசர உதவி",
    nav_performance: "மாதிரி செயல்திறன்",
    nav_about: "அமைப்பு பற்றி",
    nav_settings: "அமைப்புகள்",

    // Daily Health Plan & Notifications
    daily_plan_title: "தனிப்பயனாக்கப்பட்ட தினசரி ஆரோக்கிய அட்டவணை",
    daily_plan_subtitle: "உங்கள் இதய அபாய நிலை, உணவு மற்றும் மருந்து அட்டவணைக்கேற்ப அமைக்கப்பட்ட ஆரோக்கிய அட்டவணை",
    next_reminder: "அடுத்த நினைவூட்டல்",
    mark_complete: "முடித்துவிட்டேன்",
    completed: "முடிந்தது",
    allow_notifications: "அறிவிப்புகளை இயக்கவும்",
    not_now: "இப்போது வேண்டாம்",
    notifications_enabled: "அறிவிப்புகள் இயக்கத்தில் உள்ளன",
    notifications_disabled: "அறிவிப்புகள் முடக்கப்பட்டுள்ளன",
    notification_pref: "அறிவிப்பு அமைப்புகள்",
    breakfast_reminder: "காலை உணவு நினைவூட்டல்",
    lunch_reminder: "மதிய உணவு நினைவூட்டல்",
    dinner_reminder: "இரவு உணவு நினைவூட்டல்",
    hydration_reminder: "குடிநீர் நினைவூட்டல்",
    exercise_reminder: "உடற்பயிற்சி நினைவூட்டல்",
    medication_reminder: "மருந்து நினைவூட்டல்",
    general_reminder: "பொதுவான வழக்கம்",
    plan_progress: "இன்றைய வழக்கத்தின் முன்னேற்றம்",
    view_full_plan: "முழு அட்டவணையை காண்க",
    refresh_plan: "அட்டவணையை புதுப்பி",
    all_notifications: "அனைத்து அறிவிப்புகள்",
    mark_all_read: "அனைத்தையும் படித்ததாக குறி",
    no_notifications: "எந்த அறிவிப்புகளும் இல்லை",
    enable_notifications_prompt: "சரியான நேரத்தில் இதய நல எச்சரிக்கைகள், உணவு வழிகாட்டல் மற்றும் மாத்திரை நினைவூட்டல்களைப் பெற அறிவிப்புகளை இயக்கவும்.",
    time_left: "மீதம்",
    plan_empty: "இன்று எந்த அட்டவணை கூறுகளும் கிடைக்கவில்லை.",
    plan_generating: "உங்கள் தனிப்பயனாக்கப்பட்ட அட்டவணை உருவாக்கப்படுகிறது...",
    save_preferences: "அமைப்புகளை சேமி",
    quiet_hours: "அமைதியான நேரம் (அறிவிப்புகள் வராது)",
    start_time: "தொடக்க நேரம்",
    end_time: "முடிவு நேரம்",
    enabled_types: "அறிவிப்பு வகைகள்",


    // Summary Cards
    card_risk: "இதய அபாய அளவு",
    card_bp: "இரத்த அழுத்தம்",
    card_chol: "கொலஸ்ட்ரால்",
    card_sugar: "இரத்த சர்க்கரை",
    card_bmi: "உடல் குறியீடு (BMI)",
    card_hr: "இதயத் துடிப்பு",

    // Status Tags
    status_normal: "இயல்பானது",
    status_monitor: "கண்காணிக்கவும்",
    status_attention: "கவனம் தேவை",
    status_high: "அதிக அபாயம்",
    status_moderate: "மிதமான அபாயம்",
    status_low: "குறைந்த அபாயம்",
    status_good: "நன்று",

    // Today's Actions
    actions_title: "இன்றைய ஆரோக்கிய செயல்கள்",
    action_check_risk: "அபாய பரிசோதனை",
    action_upload_ecg: "ECG பதிவேற்றுக",
    action_diet: "உணவு முறை",
    action_exercise: "உடற்பயிற்சி",
    action_reminders: "நினைவூட்டல்கள்",
    action_progress: "முன்னேற்றம்",

    // Body Health
    body_title: "என் உடல் நலன்",
    body_subtitle: "உடலின் பகுதிகளை கிளிக் செய்து உங்கள் நிலையை மற்றும் ஆலோசனைகளை அறியவும்.",
    organ_heart: "இதயம்",
    organ_blood: "இரத்தம்",
    organ_body: "உடல்",
    organ_lungs: "நுரையீரல்",
    organ_mind: "மனநலம்",

    // Today's Plan Checklist
    plan_title: "இன்றைய ஆரோக்கிய திட்டம்",
    plan_subtitle: "ஆரோக்கியமான இதயத்திற்கான அன்றாட பழக்கங்களின் சரிபார்ப்பு பட்டியல்.",
    plan_water: "8 டம்ளர் தூய தண்ணீர் குடிக்கவும்",
    plan_meds: "பரிந்துரைக்கப்பட்ட மாத்திரைகளை உட்கொள்ளவும்",
    plan_walk: "15–20 நிமிடம் நடைப்பயிற்சி செய்யவும்",
    plan_diet: "ஆரோக்கியமான நார்ச்சத்துள்ள காலை உணவு உட்கொள்ளவும்",
    plan_bp: "திட்டமிடப்பட்டிருந்தால் இரத்த அழுத்தத்தை பரிசோதிக்கவும்",
    plan_sleep: "இரவு 7–8 மணி நேரம் ஆழ்ந்து தூங்கவும்",
    plan_completed: "இன்று முடிந்தது",

    // Alerts
    alerts_title: "முக்கிய ஆரோக்கிய எச்சரிக்கைகள்",
    alert_high_risk: "அதிக அபாய எச்சரிக்கை: உங்கள் இதய அபாய அளவு அதிகமாக உள்ளது. உடனடியாக மருத்துவ ஆலோசனை மற்றும் வாழ்க்கை முறை மாற்றம் தேவை.",
    alert_reminders_due: "திட்டமிடப்பட்ட நினைவூட்டல்: இன்று உங்களுக்கு மாத்திரை அல்லது பரிசோதனை நேரம் உள்ளது.",
    alert_profile_incomplete: "சுயவிவர அறிவிப்பு: சமீபத்திய மருத்துவ பரிசோதனை விவரங்களை உள்ளிடுவது துல்லியமான முடிவுகளை தரும்.",

    // Medical Disclaimer
    disclaimer_short: "கார்டியோ AI என்பது விழிப்புணர்வு மற்றும் ஆராய்ச்சி வழிகாட்டி மட்டுமே; மருத்துவ சிகிச்சை அல்ல.",
    disclaimer_emergency: "அவசர எச்சரிக்கை: நெஞ்சு வலி, மூச்சுத் திணறல் ஏற்பட்டால் உடனடியாக 112 அல்லது 108-ஐ அழைக்கவும்.",

    // Common Buttons
    btn_next: "அடுத்து",
    btn_back: "பின்னால்",
    btn_skip: "தவிர்க்க",
    btn_finish: "தொடங்குக",
    btn_save: "சேமிக்க",
    btn_cancel: "ரத்து செய்",
    btn_start_assessment: "பரிசோதனையை தொடங்கு",
    btn_upload_image: "படத்தை பதிவேற்று",
    btn_view_details: "விவரங்களை காண்க"
  }
}

const LanguageContext = createContext()

// Helper to format unknown keys into clean, human-readable Title Case fallback
const formatKeyFallback = (key) => {
  if (!key || typeof key !== "string") return ""
  // Strip common technical prefixes
  const cleaned = key.replace(/^(nav_|btn_|card_|alert_|plan_|action_|status_|organ_)/i, "")
  // Replace underscores and hyphens with space
  const words = cleaned.replace(/[_-]+/g, " ").trim().split(" ")
  return words
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("app_language") || "en"
  })

  useEffect(() => {
    localStorage.setItem("app_language", language)
  }, [language])

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ta" : "en"))
  }

  const t = (key, fallback = "") => {
    if (!key) return ""
    const langDict = translations[language] || translations.en
    const lowerKey = typeof key === "string" ? key.toLowerCase() : ""

    // 1. Direct match in active language
    if (langDict[key]) return langDict[key]
    if (lowerKey && langDict[lowerKey]) return langDict[lowerKey]

    // 2. Fallback to English dictionary
    if (translations.en[key]) return translations.en[key]
    if (lowerKey && translations.en[lowerKey]) return translations.en[lowerKey]

    // 3. User-supplied fallback
    if (fallback) return fallback

    // 4. Clean Title Case fallback (never display raw key with underscores)
    return formatKeyFallback(key)
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        lang: language,
        setLanguage,
        setLang: setLanguage,
        toggleLanguage,
        toggleLang: toggleLanguage,
        t
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)