import React, { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import {
  Heart,
  ShieldAlert,
  User,
  LogOut,
  LogIn,
  PhoneCall,
  Menu,
  X,
  Pill,
  HelpCircle,
  LayoutDashboard,
  Activity,
  Lightbulb,
  Utensils,
  Salad,
  Flame,
  Footprints,
  Sliders,
  LineChart,
  AlertOctagon,
  BarChart3,
  Languages,
  ChefHat,
  Bell,
  CalendarCheck,
  ShieldCheck,
  Sun,
  Moon
} from "lucide-react"
import api from "../services/api"
import { useAuth } from "../context/AuthContext"
import { useLanguage } from "../context/LanguageContext"
import { useTheme } from "../context/ThemeContext"

export const Navbar = () => {
  const { user, logout } = useAuth()
  const { lang, toggleLang, t } = useLanguage()
  const { theme, toggleTheme, isLight } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)

  React.useEffect(() => {
    if (user) {
      api
        .get("/notifications")
        .then((res) => setNotifications(res.data || []))
        .catch(() => {})
    }
  }, [user, location.pathname])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/mark-all-read")
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {}
  }

  const mobileLinks = [
    { name: t("nav_dashboard"), path: "/dashboard", icon: LayoutDashboard },
    { name: t("nav_profile"), path: "/profile", icon: User },
    { name: t("nav_risk_assessment"), path: "/risk-assessment", icon: Activity },
    { name: t("nav_ecg"), path: "/ecg", icon: Activity },
    { name: t("nav_manage_risk", "Manage & Monitor Risk"), path: "/manage-risk", icon: ShieldCheck },
    { name: t("nav_diet"), path: "/diet", icon: Utensils },
    { name: t("nav_meal_suggest"), path: "/meal-suggest", icon: ChefHat },
    { name: t("nav_meals"), path: "/meal-analysis", icon: Salad },
    { name: t("nav_lifestyle"), path: "/lifestyle", icon: Flame },
    { name: t("nav_exercise"), path: "/exercise", icon: Footprints },
    { name: t("nav_personalized_care", "❤️ Personalized Care"), path: "/personalized-care", icon: Heart },
    { name: t("nav_daily_plan", "Daily Health Plan"), path: "/health-plan", icon: CalendarCheck },
    { name: t("nav_what_if"), path: "/what-if", icon: Sliders },
    { name: t("nav_reminders"), path: "/reminders", icon: Pill },
    { name: t("nav_progress"), path: "/progress", icon: LineChart },
    { name: t("nav_emergency"), path: "/emergency", icon: AlertOctagon, alert: true },
    { name: t("nav_performance", "Model Performance"), path: "/model-performance", icon: BarChart3 }
  ]

  return (
    <header className="sticky top-0 z-40 glass-card border-b border-teal-900/40 backdrop-blur-xl bg-[#0c333a]/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-teal-500 flex items-center justify-center shadow-lg shadow-rose-950/40 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <span className="font-display font-bold text-base sm:text-lg text-white tracking-tight flex items-center gap-1.5">
                {lang === "ta" ? "இதய நல" : "Heart"}<span className="text-teal-400">{lang === "ta" ? "உதவியாளர்" : "Assistant"}</span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal-950 border border-teal-500/30 text-teal-300 hidden sm:inline">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 hidden lg:block">
                {lang === "ta" ? "தனிப்பயனாக்கப்பட்ட இதய பாதுகாப்பு" : "Personalized Cardiovascular Wellness"}
              </span>
            </div>
          </Link>
        </div>

        {/* Center Tagline / Quick Shortcuts */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-slate-300">
            {lang === "ta" ? "உங்கள் இதய நல தோழன்" : "Your Heart Health Companion"}
          </span>
          <span className="text-slate-600">|</span>
          <Link to="/ecg" className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 transition-colors">
            <Activity className="w-3.5 h-3.5" />
            <span>ECG</span>
          </Link>
          <span className="text-slate-600">|</span>
          <Link to="/meal-suggest" className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors">
            <ChefHat className="w-3.5 h-3.5" />
            <span>{lang === "ta" ? "சமையல்" : "Meals"}</span>
          </Link>
          <span className="text-slate-600">|</span>
          <Link to="/health-plan" className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 transition-colors">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>{lang === "ta" ? "அட்டவணை" : "Routine"}</span>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification Bell Dropdown */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all shadow-sm"
                title={t("all_notifications", "Notifications")}
              >
                <Bell className="w-4 h-4 text-teal-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-card rounded-2xl border border-slate-700/90 bg-slate-900/95 backdrop-blur-xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 px-1">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-xs font-bold text-white">{t("all_notifications", "Notifications")}</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-teal-500 text-slate-950">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold"
                      >
                        {t("mark_all_read", "Mark all read")}
                      </button>
                    )}
                  </div>

                  <div className="py-2 max-h-64 overflow-y-auto space-y-1.5">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">{t("no_notifications", "No notifications yet")}</p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl border text-xs ${
                            n.read
                              ? "bg-slate-950/40 border-slate-800/80 text-slate-400"
                              : "bg-teal-950/20 border-teal-500/30 text-slate-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-semibold text-white text-[11px]">{n.title}</h5>
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1 flex-shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">{n.body}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-center">
                    <Link
                      to="/health-plan"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center justify-center gap-1 py-1"
                    >
                      <span>{t("view_full_plan", "View Daily Health Plan")}</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Theme Toggle (Light / Dark) Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-sm flex items-center justify-center"
            title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
            aria-label="Toggle Theme"
          >
            {isLight ? (
              <Moon className="w-4 h-4 text-slate-700 hover:text-teal-600 transition-colors" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-colors" />
            )}
          </button>

          {/* Bilingual Language Switcher Button */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-teal-300 transition-all shadow-sm"
            title={lang === "ta" ? "Switch to English" : "தமிழுக்கு மாற்றவும்"}
          >
            <Languages className="w-3.5 h-3.5 text-teal-400" />
            <span className="tracking-wide">{lang === "ta" ? "English" : "தமிழ்"}</span>
          </button>

          {/* Emergency Quick Trigger */}
          <Link
            to="/emergency"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950/40 animate-pulse"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === "ta" ? "அவசர உதவி" : "Emergency Help"}</span>
            <span className="sm:hidden">{lang === "ta" ? "அவசரம்" : "Help"}</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <Link
                to="/profile"
                className="flex items-center gap-2 text-xs text-slate-300 hover:text-white transition-colors"
                title="View Profile"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600 flex items-center justify-center font-bold text-teal-400 text-xs shadow-inner">
                  {user.full_name?.charAt(0) || "U"}
                </div>
                <span className="hidden sm:inline font-medium text-xs max-w-[100px] truncate">{user.full_name}</span>
              </Link>
              <button
                onClick={() => {
                  logout()
                  navigate("/login")
                }}
                className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{lang === "ta" ? "உள்நுழை" : "Log In"}</span>
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors hidden sm:inline"
              >
                {lang === "ta" ? "பதிவு" : "Register"}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 p-4 max-h-[calc(100vh-4rem)] overflow-y-auto space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-400">
            <span>{lang === "ta" ? "பட்டி" : "Menu Navigation"}</span>
            <button
              onClick={toggleLang}
              className="text-teal-300 underline font-semibold flex items-center gap-1"
            >
              <Languages className="w-3 h-3" />
              <span>{lang === "ta" ? "Switch to English" : "தமிழுக்கு மாற்றவும்"}</span>
            </button>
          </div>
          {mobileLinks.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? item.alert
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-semibold"
                    : item.alert
                    ? "text-rose-400 hover:bg-rose-500/10"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}