import React from "react"
import {
  Heart,
  Brain,
  ShieldAlert,
  Layers,
  Sparkles,
  Utensils,
  Footprints,
  Activity,
  Code2
} from "lucide-react"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

export const About = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-2 border-b border-slate-800">
        <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 bg-teal-950 border border-teal-500/30 px-2 py-0.5 rounded-full font-bold">
          Final-Year Academic Engineering Project
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
          AI-Based Personalized Cardiovascular Risk Prediction & Preventive Lifestyle Recommendation System
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          End-to-end multi-modal machine learning architecture, SHAP explainability, and personalized Indian preventive nutrition.
        </p>
      </div>

      <MedicalDisclaimer />

      {/* 10 Core Innovations */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> 10 Key System Innovations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { title: "Stacking Ensemble ML", desc: "Aggregates Logistic Regression, Random Forest, XGBoost, LightGBM, SVM, and Neural Networks with an out-of-fold meta learner." },
            { title: "Explainable AI (SHAP)", desc: "Quantifies exact mathematical feature contributions for every single patient prediction using TreeExplainer." },
            { title: "Model Uncertainty Estimation", desc: "Computes ensemble variance and entropy across base models to flag low-confidence predictions." },
            { title: "Demographic Fairness Auditing", desc: "Verifies disparate impact, false positive rates, and recall parity across biological sex and age cohorts." },
            { title: "Indian Food Database (50+ items)", desc: "Database of authentic regional dishes with full macro and micronutrient parameters." },
            { title: "Dynamic Meal Analyzer", desc: "Calculates a 0-100 diet score and flags excess sodium (>2000mg) or saturated fats with cultural swaps." },
            { title: "Multi-Pillar Lifestyle Score", desc: "Transparent composite scoring of diet, physical activity, sleep, smoking, stress, and BMI." },
            { title: "What-If Counterfactual Simulator", desc: "Allows interactive slider adjustments of modifiable markers (BP, Lipids) showing live risk delta." },
            { title: "Conservative Activity Guidance", desc: "Safety-first exercise engine with red-flag contraindication filters for severe hypertension." },
            { title: "Emergency Safety Triage", desc: "Urgent red-flag symptom screening with immediate direct-dispatch contact integration." }
          ].map((item, idx) => (
            <div key={idx} className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
              <span className="font-bold text-white block mb-0.5">{idx + 1}. {item.title}</span>
              <p className="text-slate-400 text-[11px] leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* System Architecture */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4 text-xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Code2 className="w-4 h-4 text-indigo-400" /> Technology Stack & Abstraction Architecture
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="font-bold text-teal-400 block">Frontend</span>
            <ul className="space-y-1 text-slate-300 text-[11px]">
              <li>• React 18 + Vite</li>
              <li>• Tailwind CSS (Glassmorphic)</li>
              <li>• Recharts Interactive Charts</li>
              <li>• React Router v6</li>
              <li>• Axios Client Interceptors</li>
            </ul>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="font-bold text-teal-400 block">Backend & ML</span>
            <ul className="space-y-1 text-slate-300 text-[11px]">
              <li>• Python 3.10 + FastAPI</li>
              <li>• Scikit-learn + XGBoost + LightGBM</li>
              <li>• SHAP TreeExplainer</li>
              <li>• Optuna Hyperparameter Optimization</li>
              <li>• Pydantic v2 Medical Schemas</li>
            </ul>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="font-bold text-teal-400 block">Database Abstraction</span>
            <ul className="space-y-1 text-slate-300 text-[11px]">
              <li>• MongoDB (via Motor AsyncIO)</li>
              <li>• Persistent SQLite Fallback</li>
              <li>• Zero-setup seamless execution</li>
              <li>• JWT + Passlib Password Security</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}