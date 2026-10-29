import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Salad,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Utensils
} from "lucide-react"
import api from "../services/api"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

export const MealAnalysis = () => {
  const [foodsList, setFoodsList] = useState([])
  const [loadingFoods, setLoadingFoods] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)

  // Meal rows
  const [breakfast, setBreakfast] = useState([{ food_name: "Steamed Idli (2 pieces)", servings: 1 }])
  const [lunch, setLunch] = useState([
    { food_name: "Yellow Dal Tadka (Low Oil)", servings: 1 },
    { food_name: "Whole Wheat Chapati (Without Ghee)", servings: 2 }
  ])
  const [snack, setSnack] = useState([{ food_name: "Roasted Makhana (Foxnuts)", servings: 1 }])
  const [dinner, setDinner] = useState([{ food_name: "Moong Dal Khichdi with Vegetables", servings: 1 }])

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await api.get("/diet/foods")
        setFoodsList(res.data)
      } catch (err) {
        console.error("Failed to load food database:", err)
      } finally {
        setLoadingFoods(false)
      }
    }
    fetchFoods()
  }, [])

  const addItem = (setMeal) => {
    const defaultFood = foodsList.length > 0 ? foodsList[0].name : "Steamed Idli (2 pieces)"
    setMeal((prev) => [...prev, { food_name: defaultFood, servings: 1 }])
  }

  const removeItem = (setMeal, index) => {
    setMeal((prev) => prev.filter((_, i) => i !== index))
  }

  const updateItem = (setMeal, index, field, val) => {
    setMeal((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    )
  }

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault()
    setAnalyzing(true)
    try {
      const payload = {
        breakfast_items: breakfast,
        lunch_items: lunch,
        snack_items: snack,
        dinner_items: dinner
      }
      const res = await api.post("/diet/analyze-meal", payload)
      setAnalysisResult(res.data)
    } catch (err) {
      console.error("Meal analysis error:", err)
    } finally {
      setAnalyzing(false)
    }
  }

  // Auto-run analysis once foods are loaded
  useEffect(() => {
    if (!loadingFoods) {
      handleAnalyze()
    }
  }, [loadingFoods])

  const renderMealLogger = (title, items, setMeal, badgeColor) => (
    <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/70 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <span className={`text-xs font-bold uppercase tracking-wider ${badgeColor} flex items-center gap-1.5`}>
          <Utensils className="w-3.5 h-3.5" /> {title}
        </span>
        <button
          type="button"
          onClick={() => addItem(setMeal)}
          className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add Food
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <select
              value={item.food_name}
              onChange={(e) => updateItem(setMeal, idx, "food_name", e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-teal-500"
            >
              {foodsList.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name} ({f.calories} kcal)
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                value={item.servings}
                onChange={(e) => updateItem(setMeal, idx, "servings", parseFloat(e.target.value) || 1)}
                className="w-16 bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-white text-xs text-center focus:outline-none focus:border-teal-500"
              />
              <span className="text-[10px] text-slate-400">servings</span>
            </div>

            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(setMeal, idx)}
                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                title="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const score = analysisResult ? analysisResult.diet_score : 75
  const sodium = analysisResult ? analysisResult.total_sodium_mg : 1780
  const calories = analysisResult ? analysisResult.total_calories : 1640
  const protein = analysisResult ? analysisResult.total_protein_g : 62
  const fiber = analysisResult ? analysisResult.total_fiber_g : 31
  const satFat = analysisResult ? analysisResult.total_saturated_fat_g : 11.5
  const suggestions = analysisResult ? analysisResult.personalized_suggestions || [] : []
  const issues = analysisResult ? analysisResult.potential_issues || [] : []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
            Dynamic Nutrition
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <Salad className="w-7 h-7 text-emerald-400" /> What Did You Eat Today?
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Log your everyday Indian meals to calculate your real-time 0–100 Diet Health Score and sodium safety.
          </p>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>{analyzing ? "Analyzing..." : "Analyze Meals"}</span>
        </button>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Score Hero */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-900/80 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          <div className="text-center sm:border-r sm:border-slate-800 pr-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Diet Health Score
            </span>
            <div className="text-4xl sm:text-5xl font-extrabold text-emerald-400 mt-1">
              {score} <span className="text-lg font-normal text-slate-400">/ 100</span>
            </div>
            <span
              className={`inline-block mt-2 text-[10px] font-bold uppercase px-3 py-0.5 rounded-full ${
                score >= 80
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                  : score >= 60
                  ? "bg-teal-950 text-teal-300 border border-teal-500/40"
                  : "bg-amber-950 text-amber-300 border border-amber-500/40"
              }`}
            >
              {score >= 80 ? "Heart-Protective" : score >= 60 ? "Moderate Quality" : "Needs Adjustments"}
            </span>
          </div>

          {/* Key Macros Grid */}
          <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Total Calories</span>
              <strong className="text-sm font-bold text-white block mt-0.5">{calories} kcal</strong>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Sodium Intake</span>
              <strong className={`text-sm font-bold block mt-0.5 ${sodium > 2000 ? "text-amber-400" : "text-emerald-400"}`}>
                {sodium} mg
              </strong>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Dietary Fiber</span>
              <strong className="text-sm font-bold text-teal-300 block mt-0.5">{fiber} g</strong>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Plant/Lean Protein</span>
              <strong className="text-sm font-bold text-indigo-300 block mt-0.5">{protein} g</strong>
            </div>
          </div>
        </div>

        {/* Actionable Feedback Warnings */}
        {(issues.length > 0 || sodium > 1800) && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
            {sodium > 1800 && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  <strong>Notice:</strong> Your sodium intake is a little high today ({sodium} mg). Try choosing a lower-salt or steamed option for dinner.
                </span>
              </div>
            )}
            {suggestions.slice(0, 2).map((s, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-teal-950/20 border border-teal-500/30 text-xs text-teal-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4 Meal Loggers */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
          Select What You Ate:
        </h2>
        {renderMealLogger("Breakfast", breakfast, setBreakfast, "text-amber-300")}
        {renderMealLogger("Lunch", lunch, setLunch, "text-emerald-300")}
        {renderMealLogger("Afternoon Snack", snack, setSnack, "text-teal-300")}
        {renderMealLogger("Dinner", dinner, setDinner, "text-indigo-300")}
      </div>
    </div>
  )
}