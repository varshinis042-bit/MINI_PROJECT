/**
 * Notification and PWA Service for CardioAI.
 * Manages polite permission prompts, local timezone detection,
 * browser notifications, and schedule monitoring.
 */
import api from "./api"

const PROMPT_STORAGE_KEY = "cardio_notif_prompted"
const NOTIFIED_ITEMS_KEY = `cardio_notified_${new Date().toISOString().split("T")[0]}`

export const notificationService = {
  // Check browser support
  isSupported() {
    return "Notification" in window
  },

  // Get current permission status
  getPermission() {
    if (!this.isSupported()) return "denied"
    return Notification.permission
  },

  // Has user already responded to the initial prompt?
  hasPrompted() {
    return localStorage.getItem(PROMPT_STORAGE_KEY) === "true"
  },

  // Mark that prompt was shown
  setPrompted() {
    localStorage.setItem(PROMPT_STORAGE_KEY, "true")
  },

  // Detect client local timezone
  getClientTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    } catch {
      return "UTC"
    }
  },

  // Polite request for permission
  async requestPermission() {
    this.setPrompted()
    if (!this.isSupported()) return "denied"

    try {
      const permission = await Notification.requestPermission()
      return permission
    } catch (err) {
      console.error("Error requesting notification permission:", err)
      return "denied"
    }
  },

  // Display native or service-worker notification
  async triggerNotification(title, body, options = {}) {
    if (!this.isSupported() || Notification.permission !== "granted") {
      return false
    }

    const defaultOptions = {
      body,
      icon: "/icon-192.svg",
      badge: "/icon-192.svg",
      vibrate: [200, 100, 200],
      data: {
        url: options.url || "/health-plan",
        category: options.category || "GENERAL"
      },
      ...options
    }

    // Try service worker notification first (better on mobile/Android PWA)
    if ("serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready
        if (reg && reg.showNotification) {
          await reg.showNotification(title, defaultOptions)
          return true
        }
      } catch (e) {
        console.warn("ServiceWorker showNotification failed, falling back to standard Notification:", e)
      }
    }

    // Standard Notification fallback
    try {
      const notif = new Notification(title, defaultOptions)
      notif.onclick = () => {
        window.focus()
        if (options.url) {
          window.location.href = options.url
        }
      }
      return true
    } catch (e) {
      console.warn("Standard Notification trigger failed:", e)
      return false
    }
  },

  // Check today's routine items and notify if due
  checkAndNotifyDueItems(planItems = [], preferences = null) {
    if (!planItems || planItems.length === 0) return
    if (!this.isSupported() || Notification.permission !== "granted") return
    if (preferences && preferences.notifications_enabled === false) return

    let notifiedMap = {}
    try {
      notifiedMap = JSON.parse(localStorage.getItem(NOTIFIED_ITEMS_KEY) || "{}")
    } catch {
      notifiedMap = {}
    }

    const now = new Date()
    const currentHours = now.getHours()
    const currentMinutes = now.getMinutes()
    const currentTotalMin = currentHours * 60 + currentMinutes

    for (const item of planItems) {
      if (item.completed || notifiedMap[item.id]) continue

      // Parse item time "HH:MM"
      const [iH, iM] = item.time.split(":").map(Number)
      const itemTotalMin = iH * 60 + iM

      // Check if item time is within window (-10 min to +30 min)
      if (currentTotalMin >= itemTotalMin - 10 && currentTotalMin <= itemTotalMin + 30) {
        // Check category preferences
        const cat = item.category
        if (preferences) {
          if (cat === "BREAKFAST" && !preferences.breakfast_reminders) continue
          if (cat === "LUNCH" && !preferences.lunch_reminders) continue
          if (cat === "DINNER" && !preferences.dinner_reminders) continue
          if (cat === "HYDRATION" && !preferences.hydration_reminders) continue
          if (cat === "EXERCISE" && !preferences.exercise_reminders) continue
          if (cat === "MEDICATION" && !preferences.medication_reminders) continue
          if (cat === "GENERAL" && !preferences.general_reminders) continue
        }

        let title = `🔔 ${item.title}`
        let body = item.description

        if (cat === "MEDICATION") {
          title = `💊 Scheduled Medication Reminder`
          body = item.description
        } else if (cat === "EXERCISE") {
          title = `🚶 Walking / Activity Reminder`
          body = "Your daily walking session is scheduled now. Take a refreshing walk."
        } else if (cat === "HYDRATION") {
          title = `💧 Hydration Reminder`
          body = "Time to drink a fresh glass of water for optimal vascular health."
        } else if (cat === "BREAKFAST") {
          title = `🥣 Breakfast Reminder`
          body = "Good morning! Time for your heart-healthy breakfast."
        } else if (cat === "LUNCH") {
          title = `🍛 Lunch Reminder`
          body = "Time for your wholesome, balanced lunch."
        } else if (cat === "DINNER") {
          title = `🍽️ Dinner Reminder`
          body = "Time for a light, nourishing dinner."
        }

        this.triggerNotification(title, body, {
          category: cat,
          url: "/health-plan"
        })

        notifiedMap[item.id] = true
      }
    }

    try {
      localStorage.setItem(NOTIFIED_ITEMS_KEY, JSON.stringify(notifiedMap))
    } catch (e) {
      // ignore storage error
    }
  },

  // API wrappers
  async getPreferences() {
    try {
      const res = await api.get("/notifications/preferences")
      return res.data
    } catch {
      return {
        notifications_enabled: true,
        breakfast_reminders: true,
        lunch_reminders: true,
        dinner_reminders: true,
        hydration_reminders: true,
        exercise_reminders: true,
        medication_reminders: true,
        general_reminders: true,
        timezone: this.getClientTimezone()
      }
    }
  },

  async updatePreferences(prefs) {
    try {
      const res = await api.put("/notifications/preferences", prefs)
      return res.data
    } catch (err) {
      console.error("Failed to update notification preferences:", err)
      return prefs
    }
  }
}
