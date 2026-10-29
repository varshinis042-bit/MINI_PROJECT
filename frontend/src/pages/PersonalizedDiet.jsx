import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Utensils,
  Salad,
  Flame,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Info,
  Sparkles,
  Heart,
  Droplet
} from "lucide-react"
import api from "../services/api"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

export const PersonalizedDiet = () => {
  const [dietPlan, setDietPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchDiet = async () => {
      try {
        const res = await api.get("/diet/recommendations")
        setDietPlan(res.data)
      } catch (err) {
        setError("Failed to load Indian dietary recommendations.")
      } finally {
        setLoading(false)
      }
    }
    fetchDiet()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">Curating cardioprotective Indian meal plan...</p>
      </div>
    )
  }

  const {
    risk_tier = "MODERATE",
    diet_type = "Vegetarian",
    breakfast = [],
    lunch = [],
    snack = [],
    dinner = [],
    daily_macros = {},
    cardiovascular_guidelines = []
  } = dietPlan || {}

  const mealExplanations = {
    Breakfast: "High-fiber and low-sodium steamed items provide sustained glucose release without morning arterial blood pressure spikes.",
    Lunch: "Lean plant proteins (dal, pulses) paired with complex whole grains and antioxidant-rich vegetables to support healthy endothelial dilation.",
    Snack: "Light, low-glycemic crunch (like roasted makhana or spiced buttermilk) to prevent mid-afternoon hunger and avoid fried snacks.",
    Dinner: "Easy-to-digest soothing khichdi or warm soup that prevents late-night gastro-metabolic strain and supports deep sleep."
  }

  const renderMealSection = (title, items, color, borderTheme) => (
    <div className={`glass-card rounded-3xl p-6 border ${borderTheme} space-y-4 bg-slate-900/80`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-3">
        <div>
          <h3 className={`text-base font-bold ${color} flex items-center gap-2`}>
            <Utensils className="w-4 h-4" /> {title}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            <strong>Why this meal?</strong> {mealExplanations[title]}
          </p>
        </div>
        <span className="text-[11px] text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded-md self-start sm:self-auto">
          {items.reduce((acc, i) => acc + (i.calories || 0), 0)} kcal
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item, idx) => (
          <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <strong className="text-xs font-bold text-white block">{item.name}</strong>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 flex-shrink-0">
                {item.calories} kcal
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              {item.cardio_benefit || "Rich in dietary fiber and heart-protective plant micronutrients."}
            </p>

            <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
              <span>Sodium: {item.sodium_mg || 120}mg</span>
              <span>•</span>
              <span>Fiber: {item.fiber_g || 4}g</span>
              <span>•</span>
              <span>Protein: {item.protein_g || 6}g</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
            Heart-DASH Indian Nutrition
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <Salad className="w-7 h-7 text-emerald-400" /> Today's Heart-Friendly Food Plan
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Calibrated for South Asian dietary patterns with authentic regional dishes (Idli, Dal, Millets, Khichdi, Makhana).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/meal-analysis"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <span>Log Today's Meals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Macro Daily Target Strip */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/80 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Calories</span>
          <div className="text-sm font-bold text-white mt-0.5">{daily_macros.calories || 1750} kcal</div>
        </div>
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Sodium Target</span>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">&lt; {daily_macros.sodium_mg || 1800} mg</div>
        </div>
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Dietary Fiber</span>
          <div className="text-sm font-bold text-teal-400 mt-0.5">{daily_macros.fiber_g || 32} g</div>
        </div>
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Protein</span>
          <div className="text-sm font-bold text-indigo-400 mt-0.5">{daily_macros.protein_g || 65} g</div>
        </div>
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Saturated Fat</span>
          <div className="text-sm font-bold text-amber-400 mt-0.5">&lt; {daily_macros.saturated_fat_g || 14} g</div>
        </div>
      </div>

      {/* 4 Daily Meals */}
      <div className="space-y-4">
        {renderMealSection("Breakfast", breakfast, "text-amber-300", "border-amber-500/30")}
        {renderMealSection("Lunch", lunch, "text-emerald-300", "border-emerald-500/30")}
        {renderMealSection("Snack", snack, "text-teal-300", "border-teal-500/30")}
        {renderMealSection("Dinner", dinner, "text-indigo-300", "border-indigo-500/30")}
      </div>

      {/* Heart-Healthy Cooking Tips */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/60 space-y-2 text-xs text-slate-300">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" /> Essential Cardioprotective Cooking Rules:
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 list-disc list-inside">
          <li>Limit table salt and papads; flavor with lemon juice, cumin, and garlic.</li>
          <li>Choose mustard, sesame, or groundnut oil in moderation over hydrogenated vanaspati/palm oil.</li>
          <li>Incorporate whole millets (Ragi, Jowar, Foxtail) to lower glycemic spikes.</li>
          <li>Include garlic and curry leaves, known for natural antioxidant polyphenols.</li>
        </ul>
      </div>
    </div>
  )
}