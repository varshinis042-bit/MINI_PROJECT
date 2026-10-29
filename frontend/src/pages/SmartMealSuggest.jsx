import React, { useState } from "react"
import {
  Utensils,
  Plus,
  X,
  Search,
  Clock,
  Flame,
  Heart,
  ChefHat,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Leaf,
  Filter
} from "lucide-react"
import api from "../services/api"
import { useLanguage } from "../context/LanguageContext"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

const QUICK_INGREDIENTS = [
  { en: "Tomato", ta: "தக்காளி" },
  { en: "Onion", ta: "வெங்காயம்" },
  { en: "Garlic", ta: "பூண்டு" },
  { en: "Eggs", ta: "முட்டைகள்" },
  { en: "Rice", ta: "அரிசி" },
  { en: "Moong Dal", ta: "பாசிப்பருப்பு" },
  { en: "Toor Dal", ta: "துவரம்பருப்பு" },
  { en: "Ragi (Finger Millet)", ta: "ராகி / கேழ்வரகு" },
  { en: "Oats", ta: "ஓட்ஸ்" },
  { en: "Spinach (Keerai)", ta: "கீரை" },
  { en: "Curd / Yogurt", ta: "தயிர்" },
  { en: "Chickpeas (Chana)", ta: "சுண்டல் / கொண்டைக்கடலை" },
  { en: "Curry Leaves", ta: "கறிவேப்பிலை" },
  { en: "Pepper", ta: "மிளகு" },
  { en: "Cumin (Jeera)", ta: "சீரகம்" },
  { en: "Ginger", ta: "இஞ்சி" }
]

export const SmartMealSuggest = () => {
  const { lang, t } = useLanguage()
  const [selectedIngredients, setSelectedIngredients] = useState([
    "Tomato",
    "Onion",
    "Garlic",
    "Eggs"
  ])
  const [customInput, setCustomInput] = useState("")
  const [mealType, setMealType] = useState("all")
  const [maxCookingTime, setMaxCookingTime] = useState(45)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  const handleAddIngredient = (itemEn) => {
    if (!selectedIngredients.includes(itemEn)) {
      setSelectedIngredients([...selectedIngredients, itemEn])
    }
  }

  const handleRemoveIngredient = (itemEn) => {
    setSelectedIngredients(selectedIngredients.filter((i) => i !== itemEn))
  }

  const handleAddCustom = (e) => {
    e?.preventDefault()
    const trimmed = customInput.trim()
    if (trimmed && !selectedIngredients.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedIngredients([...selectedIngredients, trimmed])
      setCustomInput("")
    }
  }

  const handleSuggest = async () => {
    if (selectedIngredients.length === 0) {
      setError(lang === "ta" ? "தயவுசெய்து குறைந்தது ஒரு உணவுப் பொருளையாவது தேர்ந்தெடுக்கவும்." : "Please select or type at least one ingredient.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const payload = {
        available_ingredients: selectedIngredients,
        meal_type: mealType === "all" ? null : mealType,
        max_cooking_time_minutes: maxCookingTime,
        dietary_preference: "any"
      }
      const res = await api.post("/meals/suggest", payload)
      setResults(res.data)
      if (res.data?.dishes?.length > 0) {
        setSelectedRecipe(res.data.dishes[0])
      }
    } catch (err) {
      console.error("Meal suggestion error:", err)
      setError(
        lang === "ta"
          ? "பரிந்துரைகளை ஏற்றுவதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்."
          : "Failed to get meal suggestions. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950 border border-teal-500/30 px-2.5 py-0.5 rounded-full">
              {lang === "ta" ? "இதயத்திற்கு உகந்த சமையல்" : "Heart-Friendly Kitchen"}
            </span>
            <span className="text-xs text-slate-500">?</span>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Leaf className="w-3 h-3" /> South Indian Traditional
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-2.5">
            <ChefHat className="w-7 h-7 text-teal-400" />
            <span>{lang === "ta" ? "உணவுப் பொருள் அடிப்படையிலான பரிந்துரை" : "Smart Ingredient-Based Meal Suggestions"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {lang === "ta"
              ? "உங்கள் சமையலறையில் உள்ள பொருட்களைத் தேர்ந்தெடுங்கள். இதயத்திற்கு உகந்த சுவையான தமிழ்/தென்னிந்திய உணவுப் பரிந்துரைகளைப் பெறுங்கள்."
              : "Tell us what ingredients you have in your kitchen. We'll suggest wholesome, heart-healthy South Indian and Tamil recipes with minimal oil and sodium."}
          </p>
        </div>

        <button
          onClick={handleSuggest}
          disabled={loading || selectedIngredients.length === 0}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-lg shadow-teal-950/50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{lang === "ta" ? "பரிந்துரைக்கப்படுகிறது..." : "Finding Recipes..."}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{lang === "ta" ? "உணவுகளைக் காட்டு" : "Suggest Heart-Healthy Meals"}</span>
            </>
          )}
        </button>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Ingredient Selection Card */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-teal-400" />
              <span>{lang === "ta" ? "உங்களிடம் உள்ள பொருட்கள் என்ன?" : "What ingredients do you have in your kitchen?"}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === "ta" ? "விரைவுப் பொருட்களை கிளிக் செய்யவும் அல்லது புதிய பொருளை தட்டச்சு செய்து சேர்க்கவும்." : "Click common South Indian items or type any ingredient you have."}
            </p>
          </div>
          <span className="text-xs font-bold text-teal-400 bg-teal-950/80 px-2.5 py-1 rounded-full border border-teal-500/30 self-start sm:self-auto">
            {selectedIngredients.length} {lang === "ta" ? "பொருட்கள் தேர்வு செய்யப்பட்டுள்ளன" : "selected"}
          </span>
        </div>

        {/* Selected Ingredients Badges */}
        <div>
          <div className="text-xs font-semibold text-slate-400 mb-2">
            {lang === "ta" ? "தேர்ந்தெடுக்கப்பட்ட பொருட்கள்:" : "Your Selected Kitchen Basket:"}
          </div>
          {selectedIngredients.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-dashed border-slate-800 text-center text-xs text-slate-500">
              {lang === "ta" ? "எந்தப் பொருளும் இன்னும் தேர்ந்தெடுக்கப்படவில்லை. கீழே உள்ள விரைவுப் பட்டியலில் கிளிக் செய்யவும்." : "No ingredients selected yet. Tap quick items below or type your own."}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedIngredients.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-200 text-xs font-medium"
                >
                  <span>{item}</span>
                  <button
                    onClick={() => handleRemoveIngredient(item)}
                    className="hover:text-rose-400 transition-colors p-0.5"
                    title={lang === "ta" ? "நீக்கு" : "Remove"}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Add Custom Ingredient Form */}
        <form onSubmit={handleAddCustom} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder={lang === "ta" ? "உதாரணம்: வெண்டைக்காய், முருங்கைக்காய், கேரட்..." : "e.g. Lady's finger, Drumstick, Carrot, Mint..."}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 focus:outline-none text-xs text-white placeholder:text-slate-600"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            <span>{lang === "ta" ? "சேர்" : "Add"}</span>
          </button>
        </form>

        {/* Quick Common South Indian Ingredients */}
        <div>
          <div className="text-xs font-semibold text-slate-400 mb-2">
            {lang === "ta" ? "பிரபலமான பொருட்கள் (கிளிக் செய்து சேர்க்கவும்):" : "Quick Add Popular Items:"}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_INGREDIENTS.map((item) => {
              const isSelected = selectedIngredients.includes(item.en)
              return (
                <button
                  key={item.en}
                  type="button"
                  onClick={() =>
                    isSelected ? handleRemoveIngredient(item.en) : handleAddIngredient(item.en)
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-teal-600 text-white font-semibold shadow-sm"
                      : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60"
                  }`}
                >
                  <span>{lang === "ta" ? item.ta : item.en}</span>
                  {isSelected ? <CheckCircle2 className="w-3 h-3" /> : <Plus className="w-3 h-3 text-slate-400" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Meal Type & Cooking Time Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-teal-400" />
              <span>{lang === "ta" ? "உணவு வகை" : "Meal Type Filter"}</span>
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-teal-500 focus:outline-none"
            >
              <option value="all">{lang === "ta" ? "அனைத்து வேளைகளும்" : "All Meals"}</option>
              <option value="breakfast">{lang === "ta" ? "காலை உணவு (Breakfast)" : "Breakfast"}</option>
              <option value="lunch">{lang === "ta" ? "மதிய உணவு (Lunch)" : "Lunch"}</option>
              <option value="dinner">{lang === "ta" ? "இரவு உணவு (Dinner)" : "Dinner"}</option>
              <option value="snack">{lang === "ta" ? "சிற்றுண்டி (Healthy Snack)" : "Healthy Snack"}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>
                {lang === "ta" ? `அதிகபட்ச சமையல் நேரம்: ${maxCookingTime} நிமிடங்கள்` : `Max Cooking Time: ${maxCookingTime} mins`}
              </span>
            </label>
            <input
              type="range"
              min="15"
              max="60"
              step="5"
              value={maxCookingTime}
              onChange={(e) => setMaxCookingTime(Number(e.target.value))}
              className="w-full accent-teal-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>15 min (Quick)</span>
              <span>30 min</span>
              <span>45 min</span>
              <span>60 min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Suggestions Results */}
      {results && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <span>
                {lang === "ta"
                  ? `பரிந்துரைக்கப்பட்ட உணவுகள் (${results.dishes?.length || 0})`
                  : `Suggested Recipes (${results.dishes?.length || 0})`}
              </span>
            </h2>
            <span className="text-xs text-slate-400">
              {lang === "ta" ? "இதய நலம் மற்றும் இரத்த அழுத்தக் கட்டுப்பாடு" : "Optimized for Heart Health & Blood Pressure"}
            </span>
          </div>

          {results.dishes && results.dishes.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recipe List Left Column */}
              <div className="lg:col-span-1 space-y-3">
                {results.dishes.map((dish, idx) => {
                  const isSelected = selectedRecipe?.name === dish.name
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedRecipe(dish)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-teal-950/40 border-teal-500 shadow-md shadow-teal-950/50"
                          : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-white">
                            {lang === "ta" && dish.tamil_name ? dish.tamil_name : dish.name}
                          </h3>
                          {dish.tamil_name && (
                            <span className="text-[11px] text-teal-400 block">
                              {lang === "ta" ? dish.name : dish.tamil_name}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {dish.meal_type || "Meal"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-amber-300">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{dish.calories} kcal</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{dish.cooking_time_minutes || 25} min</span>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <Heart className="w-3.5 h-3.5" />
                          <span>{dish.heart_benefit_score || 90}% Match</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Recipe Detail Right Column */}
              {selectedRecipe && (
                <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950 px-2 py-0.5 rounded-full border border-teal-500/30">
                        {selectedRecipe.meal_type?.toUpperCase() || "CARDIOPROTECTIVE RECIPE"}
                      </span>
                      <h2 className="text-xl font-bold text-white tracking-tight mt-1">
                        {lang === "ta" && selectedRecipe.tamil_name
                          ? selectedRecipe.tamil_name
                          : selectedRecipe.name}
                      </h2>
                      {selectedRecipe.tamil_name && (
                        <p className="text-xs text-teal-300">
                          {lang === "ta" ? selectedRecipe.name : selectedRecipe.tamil_name}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xl font-bold text-amber-300 block">{selectedRecipe.calories}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Calories</span>
                      </div>
                      <div className="text-right pl-3 border-l border-slate-800">
                        <span className="text-xl font-bold text-emerald-400 block">{selectedRecipe.cooking_time_minutes || 25}m</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cook Time</span>
                      </div>
                    </div>
                  </div>

                  {/* Macronutrients Breakdown */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      {lang === "ta" ? "ஊட்டச்சத்து விவரம்" : "Nutritional Profile"}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-xs text-slate-400 block">{lang === "ta" ? "புரதம்" : "Protein"}</span>
                        <span className="text-base font-bold text-teal-400">{selectedRecipe.protein_g || 12}g</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-xs text-slate-400 block">{lang === "ta" ? "மாவுச்சத்து" : "Carbs"}</span>
                        <span className="text-base font-bold text-blue-400">{selectedRecipe.carbs_g || 38}g</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-xs text-slate-400 block">{lang === "ta" ? "கொழுப்பு" : "Healthy Fats"}</span>
                        <span className="text-base font-bold text-amber-400">{selectedRecipe.fat_g || 6}g</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-xs text-slate-400 block">{lang === "ta" ? "நார்ச்சத்து" : "Dietary Fiber"}</span>
                        <span className="text-base font-bold text-emerald-400">{selectedRecipe.fiber_g || 7}g</span>
                      </div>
                    </div>
                  </div>

                  {/* Ingredients needed & Cooking Instructions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300">
                        {lang === "ta" ? "தேவையான பொருட்கள்" : "Ingredients List"}
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {selectedRecipe.ingredients && selectedRecipe.ingredients.map((ing, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span>{ing}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300">
                        {lang === "ta" ? "இதய நல சமையல் குறிப்பு" : "Heart-Safe Preparation Tips"}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedRecipe.heart_tip || (
                          lang === "ta"
                            ? "எண்ணெயை அளவாகப் பயன்படுத்தவும் (1 தேக்கரண்டி மட்டும்). சோடியத்தைக் குறைக்க உப்பை குறைவாக சேர்க்கவும். சுவைக்கு சீரகம், மிளகு, கறிவேப்பிலை அதிகம் சேர்க்கவும்."
                            : "Use only 1 teaspoon of cold-pressed oil. Keep added salt minimal for blood pressure protection. Enhance aroma with fresh curry leaves, cumin, and crushed black pepper."
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Step by step cooking steps */}
                  {selectedRecipe.cooking_steps && selectedRecipe.cooking_steps.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {lang === "ta" ? "செய்முறை வழிகாட்டி" : "Step-by-Step Instructions"}
                      </h4>
                      <div className="space-y-2">
                        {selectedRecipe.cooking_steps.map((stepText, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs text-slate-300 flex items-start gap-3"
                          >
                            <span className="w-5 h-5 rounded-full bg-teal-950 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                              {sIdx + 1}
                            </span>
                            <span className="leading-relaxed">{stepText}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center glass-card rounded-3xl border border-slate-800">
              <Utensils className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">
                {lang === "ta" ? "பொருந்திய உணவுகள் எதுவும் கிடைக்கவில்லை." : "No matching dishes found for the current combination."}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {lang === "ta" ? "கூடுதல் பொருட்களைச் சேர்க்கவும் அல்லது சமையல் நேர வரம்பை அதிகரிக்கவும்." : "Try adding more common ingredients or increasing the cooking time filter."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SmartMealSuggest