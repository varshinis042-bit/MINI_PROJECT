import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Heart,
  User,
  Scale,
  Activity,
  Droplet,
  Flame,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  HelpCircle
} from "lucide-react"
import api from "../services/api"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

export const RiskAssessment = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 6
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    age: 48,
    sex: "male",
    height_cm: 172,
    weight_kg: 78,
    bmi: 26.4,
    systolic_bp: 136,
    diastolic_bp: 86,
    cholesterol: 215,
    blood_glucose: 102,
    resting_hr: 74,
    smoking_status: "former",
    diabetes_status: "no",
    family_history: true,
    physical_activity: "moderate",
    sleep_duration: 6.8,
    stress_level: 3,
    alcohol_status: "occasional",
    diet_preference: "vegetarian",
    allergies: []
  })

  // Live BMI calculation
  useEffect(() => {
    if (formData.height_cm > 0 && formData.weight_kg > 0) {
      const h_m = formData.height_cm / 100.0
      const calculatedBmi = Number((formData.weight_kg / (h_m * h_m)).toFixed(1))
      setFormData((prev) => ({ ...prev, bmi: calculatedBmi }))
    }
  }, [formData.height_cm, formData.weight_kg])

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Helper text and BMI Category
  const getBmiCategory = (bmi) => {
    if (bmi < 18.5) return { text: "Underweight", color: "text-amber-400" }
    if (bmi < 23.0) return { text: "Normal (Asian Criteria)", color: "text-emerald-400" }
    if (bmi < 27.5) return { text: "Overweight (Asian Criteria)", color: "text-amber-400" }
    return { text: "Obese (Asian Criteria)", color: "text-rose-400" }
  }

  const applyPreset = (type) => {
    if (type === "healthy") {
      setFormData({
        age: 38,
        sex: "female",
        height_cm: 162,
        weight_kg: 58,
        bmi: 22.1,
        systolic_bp: 118,
        diastolic_bp: 76,
        cholesterol: 175,
        blood_glucose: 88,
        resting_hr: 68,
        smoking_status: "never",
        diabetes_status: "no",
        family_history: false,
        physical_activity: "active",
        sleep_duration: 7.5,
        stress_level: 2,
        alcohol_status: "none",
        diet_preference: "vegetarian",
        allergies: []
      })
    } else if (type === "elevated") {
      setFormData({
        age: 58,
        sex: "male",
        height_cm: 170,
        weight_kg: 86,
        bmi: 29.8,
        systolic_bp: 154,
        diastolic_bp: 94,
        cholesterol: 255,
        blood_glucose: 138,
        resting_hr: 82,
        smoking_status: "current",
        diabetes_status: "type2",
        family_history: true,
        physical_activity: "sedentary",
        sleep_duration: 5.5,
        stress_level: 4,
        alcohol_status: "moderate",
        diet_preference: "non_vegetarian",
        allergies: []
      })
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await api.post("/predict", formData)
      const predId = res.data.prediction_id || res.data._id || res.data.id
      navigate(`/prediction-result?id=${predId}`)
    } catch (err) {
      setError(err.response?.data?.detail || "Assessment submission failed. Please verify the entered values.")
    } finally {
      setLoading(false)
    }
  }

  const stepTitles = [
    { num: 1, title: "Basic Information", icon: User },
    { num: 2, title: "Body Measurements", icon: Scale },
    { num: 3, title: "Heart & Blood Pressure", icon: Activity },
    { num: 4, title: "Blood Tests", icon: Droplet },
    { num: 5, title: "Daily Lifestyle Habits", icon: Flame },
    { num: 6, title: "Medical History & Diet", icon: ShieldAlert }
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 bg-teal-950 border border-teal-500/30 px-2.5 py-0.5 rounded-full font-bold">
            Guided Assessment
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <Heart className="w-7 h-7 text-rose-500" /> Check Your Heart Risk
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Step-by-step 2-minute evaluation to calculate your personalized 10-year cardiovascular risk.
          </p>
        </div>

        {/* Quick Demo Presets */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => applyPreset("healthy")}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors border border-slate-700"
          >
            Load Healthy Demo
          </button>
          <button
            type="button"
            onClick={() => applyPreset("elevated")}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors border border-slate-700"
          >
            Load High-Risk Demo
          </button>
        </div>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Wizard Progress Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/80 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span>Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1].title}</span>
          <span className="text-teal-400">{Math.round((currentStep / totalSteps) * 100)}% Completed</span>
        </div>

        {/* Progress Dots / Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Steps Chips */}
        <div className="hidden sm:flex items-center justify-between pt-1">
          {stepTitles.map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setCurrentStep(s.num)}
              className={`text-[11px] flex items-center gap-1 transition-colors ${
                s.num === currentStep
                  ? "text-teal-300 font-bold"
                  : s.num < currentStep
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600"
              }`}
            >
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                s.num === currentStep ? "bg-teal-500 text-slate-950" : s.num < currentStep ? "bg-slate-800 text-teal-400" : "bg-slate-800 text-slate-600"
              }`}>
                {s.num}
              </span>
              <span>{s.title.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Form Container */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-900/90 shadow-xl">
        {/* STEP 1: BASIC INFO */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-teal-400" /> Basic Demographic Information
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Age and biological sex are fundamental clinical indicators for cardiovascular algorithms.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Age (Years) *
                </label>
                <input
                  type="number"
                  min="20"
                  max="90"
                  value={formData.age}
                  onChange={(e) => handleChange("age", parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-teal-500 text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Standard screening cohorts evaluate adults between 20 and 80 years old.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Biological Sex *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange("sex", "male")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      formData.sex === "male"
                        ? "bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange("sex", "female")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      formData.sex === "female"
                        ? "bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    Female
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Cardiovascular risk curves differ based on biological hormones and arterial physiology.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BODY MEASUREMENTS */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-teal-400" /> Body Measurements
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Body Mass Index (BMI) measures cardiometabolic body mass and arterial workload.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Height (in cm) *
                </label>
                <input
                  type="number"
                  min="120"
                  max="220"
                  value={formData.height_cm}
                  onChange={(e) => handleChange("height_cm", parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-teal-500 text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Example: 5 feet 7 inches = 170 cm.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Weight (in kg) *
                </label>
                <input
                  type="number"
                  min="35"
                  max="180"
                  value={formData.weight_kg}
                  onChange={(e) => handleChange("weight_kg", parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-teal-500 text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Measured on a standard weighing scale.
                </p>
              </div>
            </div>

            {/* Calculated BMI Badge */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 font-medium">Auto-Calculated Body Mass Index (BMI):</span>
                <div className="text-lg font-bold text-white mt-0.5">
                  {formData.bmi} <span className="text-xs font-normal text-slate-400">kg/m²</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-[11px] block">Category:</span>
                <span className={`font-bold ${getBmiCategory(formData.bmi).color}`}>
                  {getBmiCategory(formData.bmi).text}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: HEART & BLOOD PRESSURE */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-400" /> Heart & Blood Pressure
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Blood pressure is one of the strongest modifiable risk factors for cardiac wellness.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Systolic BP (Upper Number) *
                </label>
                <input
                  type="number"
                  min="80"
                  max="220"
                  value={formData.systolic_bp}
                  onChange={(e) => handleChange("systolic_bp", parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-teal-500 text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  The top number in your BP reading (normal is under 120 mmHg).
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Diastolic BP (Lower Number) *
                </label>
                <input
                  type="number"
                  min="50"
                  max="130"
                  value={formData.diastolic_bp}
                  onChange={(e) => handleChange("diastolic_bp", parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-teal-500 text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  The bottom number in your BP reading (normal is under 80 mmHg).
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Resting Heart Rate (BPM)
                </label>
                <input
                  type="number"
                  min="40"
                  max="140"
                  value={formData.resting_hr}
                  onChange={(e) => handleChange("resting_hr", parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-teal-500 text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Pulse rate per minute when resting comfortably (typically 60–100 bpm).
                </p>
              </div>
            </div>

            {formData.systolic_bp >= 180 || formData.diastolic_bp >= 110 ? (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Notice: Very high blood pressure readings detected. Please consult your physician.</span>
              </div>
            ) : null}
          </div>
        )}

        {/* STEP 4: BLOOD TESTS */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Droplet className="w-5 h-5 text-teal-400" /> Laboratory Blood Tests
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                From your latest lipid panel and fasting blood sugar test report.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Total Cholesterol (mg/dL) *
                </label>
                <input
                  type="number"
                  min="100"
                  max="400"
                  value={formData.cholesterol}
                  onChange={(e) => handleChange("cholesterol", parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-teal-500 text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Desirable is below 200 mg/dL. If unsure, average healthy value is ~180.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Fasting Blood Glucose (mg/dL) *
                </label>
                <input
                  type="number"
                  min="60"
                  max="300"
                  value={formData.blood_glucose}
                  onChange={(e) => handleChange("blood_glucose", parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-teal-500 text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Normal fasting blood sugar is 70–99 mg/dL. Prediabetes is 100–125 mg/dL.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: DAILY LIFESTYLE HABITS */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-teal-400" /> Daily Lifestyle Habits
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Behavioral pillars that heavily influence arterial inflammation and cardiac longevity.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Smoking Status *
                </label>
                <select
                  value={formData.smoking_status}
                  onChange={(e) => handleChange("smoking_status", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="never">Never Smoked</option>
                  <option value="former">Former Smoker (Quit)</option>
                  <option value="current">Current Smoker</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Physical Activity Level *
                </label>
                <select
                  value={formData.physical_activity}
                  onChange={(e) => handleChange("physical_activity", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="sedentary">Sedentary (Little or no exercise)</option>
                  <option value="light">Light (1-2 days/week light walks)</option>
                  <option value="moderate">Moderate (3-5 days/week brisk walking)</option>
                  <option value="active">Active (Daily aerobic exercise)</option>
                  <option value="very_active">Very Active (Heavy training)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Nightly Sleep Duration (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="3"
                  max="12"
                  value={formData.sleep_duration}
                  onChange={(e) => handleChange("sleep_duration", parseFloat(e.target.value) || 7)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500 text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Optimal for cardiovascular recovery is 7–8 hours.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Self-Reported Stress Level (1 to 5)
                </label>
                <select
                  value={formData.stress_level}
                  onChange={(e) => handleChange("stress_level", parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="1">1 - Very Low / Calm</option>
                  <option value="2">2 - Low / Manageable</option>
                  <option value="3">3 - Moderate Everyday Stress</option>
                  <option value="4">4 - High Work/Personal Stress</option>
                  <option value="5">5 - Severe / Chronic Stress</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Alcohol Consumption
                </label>
                <select
                  value={formData.alcohol_status}
                  onChange={(e) => handleChange("alcohol_status", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="none">None (Non-drinker)</option>
                  <option value="occasional">Occasional (Socially)</option>
                  <option value="moderate">Moderate</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: MEDICAL HISTORY & DIET */}
        {currentStep === 6 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-teal-400" /> Medical History & Dietary Preferences
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Helps curate customized Indian heart meals and evaluate genetic predisposition.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Diabetes Status *
                </label>
                <select
                  value={formData.diabetes_status}
                  onChange={(e) => handleChange("diabetes_status", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="no">No Diabetes</option>
                  <option value="pre_diabetes">Pre-diabetes</option>
                  <option value="type2">Type 2 Diabetes</option>
                  <option value="type1">Type 1 Diabetes</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Family History of Early Heart Disease? *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange("family_history", true)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      formData.family_history
                        ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    Yes (Parents/Siblings)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange("family_history", false)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      !formData.family_history
                        ? "bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    No Known History
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Indian Diet Preference
                </label>
                <select
                  value={formData.diet_preference}
                  onChange={(e) => handleChange("diet_preference", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="vegetarian">Vegetarian (Pure Veg)</option>
                  <option value="non_vegetarian">Non-Vegetarian (Includes Chicken/Fish)</option>
                  <option value="vegan">Vegan (Plant-based)</option>
                </select>
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/30 text-xs text-teal-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400" /> Ready to Calculate!
              </div>
              <p className="text-slate-300">
                The Stacking Ensemble AI will process your clinical profile and generate your 10-year risk probability alongside local SHAP explanations.
              </p>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-950/40 flex items-center gap-1.5"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-950/50 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Calculating Risk...</span>
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 fill-white" />
                  <span>Calculate My Heart Risk</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}