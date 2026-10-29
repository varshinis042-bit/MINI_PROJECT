import { ThemeProvider } from "./context/ThemeContext"
import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { LanguageProvider } from "./context/LanguageContext"
import { AppLayout } from "./layouts/AppLayout"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { Dashboard } from "./pages/Dashboard"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { UserProfile } from "./pages/UserProfile"
import { RiskAssessment } from "./pages/RiskAssessment"
import { PredictionResult } from "./pages/PredictionResult"
import { Explainability } from "./pages/Explainability"
import { PersonalizedDiet } from "./pages/PersonalizedDiet"
import { MealAnalysis } from "./pages/MealAnalysis"
import { SmartMealSuggest } from "./pages/SmartMealSuggest"
import { LifestyleScore } from "./pages/LifestyleScore"
import { ExerciseRecommendations } from "./pages/ExerciseRecommendations"
import { WhatIfSimulator } from "./pages/WhatIfSimulator"
import { DailyHealthPlan } from "./pages/DailyHealthPlan"
import { Reminders } from "./pages/Reminders"
import { ProgressMonitoring } from "./pages/ProgressMonitoring"
import { EmergencyModule } from "./pages/EmergencyModule"
import { EcgMonitor } from "./pages/EcgMonitor"
import { ModelPerformance } from "./pages/ModelPerformance"
import { About } from "./pages/About"
import { RiskMaintenance } from "./pages/RiskMaintenance"

export function App() {
  return (
    <ThemeProvider>
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<AppLayout />}>

              <Route
                path="/"
                element={<Navigate to="/dashboard" replace />}
              />

              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/risk-assessment" element={<RiskAssessment />} />
              <Route path="/prediction-result" element={<PredictionResult />} />
              <Route path="/explainability" element={<Explainability />} />
              <Route path="/diet" element={<PersonalizedDiet />} />
              <Route path="/meal-analysis" element={<MealAnalysis />} />
              <Route path="/meal-suggest" element={<SmartMealSuggest />} />
              <Route path="/lifestyle" element={<LifestyleScore />} />
              <Route path="/exercise" element={<ExerciseRecommendations />} />
              <Route path="/personalized-care" element={<DailyHealthPlan />} />
              <Route path="/health-plan" element={<DailyHealthPlan />} />
              <Route path="/daily-plan" element={<DailyHealthPlan />} />
              <Route path="/what-if" element={<WhatIfSimulator />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/progress" element={<ProgressMonitoring />} />
              <Route path="/emergency" element={<EmergencyModule />} />
              <Route path="/ecg" element={<EcgMonitor />} />
              <Route path="/model-performance" element={<ModelPerformance />} />
              <Route path="/manage-risk" element={<RiskMaintenance />} />
              <Route path="/about" element={<About />} />

            </Route>

            <Route
              path="*"
              element={<Navigate to="/dashboard" replace />}
            />

          </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
    </ThemeProvider>
  )
}

export default App