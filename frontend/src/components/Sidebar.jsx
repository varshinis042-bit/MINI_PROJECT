import React from "react"
import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  User,
  HeartPulse,
  Activity,
  Lightbulb,
  Utensils,
  Salad,
  Flame,
  Footprints,
  Sliders,
  LineChart,
  AlertOctagon,
  Pill,
  BarChart3,
  Info,
  ChefHat,
  CalendarCheck,
  Heart,
  ShieldCheck
} from "lucide-react"
import { useLanguage } from "../context/LanguageContext"

export const Sidebar = () => {
  const { lang, t } = useLanguage()

  const PRIMARY_NAV = [
    { name: t("nav_dashboard"), path: "/dashboard", icon: LayoutDashboard },
    { name: t("nav_profile"), path: "/profile", icon: User },
    { name: t("nav_risk_assessment"), path: "/risk-assessment", icon: HeartPulse },
    { name: t("nav_ecg"), path: "/ecg", icon: Activity, badge: "AI" },
    { name: t("nav_result"), path: "/prediction-result", icon: Activity },
    { name: t("nav_manage_risk", "Manage & Monitor Risk"), path: "/manage-risk", icon: ShieldCheck, badge: "CARE" },
    { name: t("nav_explainability"), path: "/explainability", icon: Lightbulb },
    { name: t("nav_what_if"), path: "/what-if", icon: Sliders },
    { name: t("nav_diet"), path: "/diet", icon: Utensils },
    { name: t("nav_meal_suggest"), path: "/meal-suggest", icon: ChefHat, badge: "NEW" },
    { name: t("nav_meals"), path: "/meal-analysis", icon: Salad },
    { name: t("nav_lifestyle"), path: "/lifestyle", icon: Flame },
    { name: t("nav_exercise"), path: "/exercise", icon: Footprints },
    { name: t("nav_personalized_care", "❤️ Personalized Care"), path: "/personalized-care", icon: Heart, badge: "CARE" },
    { name: t("nav_daily_plan", "Daily Health Plan"), path: "/health-plan", icon: CalendarCheck, badge: "SMART" },
    { name: t("nav_reminders"), path: "/reminders", icon: Pill },
    { name: t("nav_progress"), path: "/progress", icon: LineChart },
    { name: t("nav_emergency"), path: "/emergency", icon: AlertOctagon, alert: true }
  ]

  const RESEARCH_NAV = [
    { name: t("nav_performance", "Model Performance"), path: "/model-performance", icon: BarChart3 },
    { name: t("nav_about", "About System"), path: "/about", icon: Info }
  ]

  return (
    <aside className="w-64 glass-card border-r border-slate-800/80 min-h-[calc(100vh-4rem)] p-3 flex flex-col justify-between hidden md:flex">
      <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-10rem)] pr-1">
        <div>
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-400/80">
            {lang === "ta" ? "இதய நல கருவிகள்" : "Heart Health Assistant"}
          </div>
          <div className="space-y-1 mt-1">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? item.alert
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm"
                        : item.alert
                        ? "text-rose-400 hover:bg-rose-500/10"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-500/40">
                      {item.badge}
                    </span>
                  )}
                  {item.alert && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0"></span>
                  )}
                </NavLink>
              )
            })}
          </div>
        </div>

        <div>
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {lang === "ta" ? "ஆராய்ச்சி & விவரங்கள்" : "Research & Details"}
          </div>
          <div className="space-y-1 mt-1">
            {RESEARCH_NAV.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-slate-800 text-slate-200 border border-slate-700"
                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              )
            })}
          </div>
        </div>
      </div>

      <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl mt-4 text-[11px] text-slate-400">
        <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{lang === "ta" ? "AI உதவியாளர் தயார்" : "AI Assistant Active"}</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          {lang === "ta"
            ? "தெற்காசிய மக்களின் இதய நலனுக்காக பிரத்யேகமாக வடிவமைக்கப்பட்டது."
            : "Personalized cardiovascular insights calibrated for South Asian heart health."}
        </p>
      </div>
    </aside>
  )
}