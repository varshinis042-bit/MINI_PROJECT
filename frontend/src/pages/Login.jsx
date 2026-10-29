import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Heart, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { MedicalDisclaimer } from "../components/MedicalDisclaimer"

export const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      navigate("/dashboard")
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid login credentials. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fillDemoAccount = () => {
    setEmail("demo.patient@cardioai.org")
    setPassword("CardioAI@2026")
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-slate-800 shadow-2xl relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-teal-500 mx-auto flex items-center justify-center shadow-lg shadow-rose-950/50 mb-3">
            <Heart className="w-7 h-7 text-white fill-white" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-1">Sign in to access your cardiovascular risk profile & lifestyle guidance</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@hospital.org or patient@domain.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-xs font-bold tracking-wide uppercase shadow-lg shadow-teal-950/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-3">
          <button
            onClick={fillDemoAccount}
            type="button"
            className="text-xs text-teal-400 hover:text-teal-300 font-medium inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Auto-fill Demo Patient Credentials
          </button>
          <div className="text-xs text-slate-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-rose-400 hover:text-rose-300 font-semibold">
              Register here
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <MedicalDisclaimer compact={true} />
        </div>
      </div>
    </div>
  )
}