'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn, signUp } from '@/actions/auth'
import { DEPARTMENTS } from '@/lib/constants'
import { 
  Eye, EyeOff, Mail, Lock, User, BookOpen, Building2, 
  Zap, ArrowRight, CheckCircle2, Sparkles, Shield, ArrowLeft,
  GraduationCap, Phone
} from 'lucide-react'

/* FLOATING PARTICLE */
function Particle({ x, y, size, duration, delay }: any) {
  return (
    <motion.div
      className="absolute rounded-full bg-blue-500/15 pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      animate={{ y: [0, -30, 0], opacity: [0, 0.5, 0], scale: [0.8, 1.2, 0.8] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 8 + 4,
  duration: Math.random() * 4 + 3,
  delay: Math.random() * 5,
}))

/* DARK INPUT FIELD */
function Field({ label, icon: Icon, type = 'text', placeholder, required, name, value, onChange }: any) {
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="space-y-1.5 text-left">
      <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">{label}</label>
      <motion.div
        animate={focused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ duration: 0.15 }}
        className={`relative rounded-xl overflow-hidden transition-all duration-200 border ${
          focused ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-white border-blue-500/50' : 'border-gray-200'
        }`}
      >
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon size={15} className={`transition-colors ${focused ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>
        )}
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-10 py-3 bg-white text-gray-900 text-sm rounded-xl placeholder-gray-400 focus:outline-none transition-all font-medium"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </motion.div>
    </div>
  )
}

/* DARK SELECT FIELD */
function SelectField({ label, icon: Icon, required, name, children, value, onChange }: any) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="space-y-1.5 text-left">
      <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">{label}</label>
      <motion.div
        animate={focused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ duration: 0.15 }}
        className={`relative rounded-xl overflow-hidden transition-all duration-200 border ${
          focused ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-white border-blue-500/50' : 'border-gray-200'
        }`}
      >
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon size={15} className={`transition-colors ${focused ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>
        )}
        <select
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          className="w-full pl-10 pr-10 py-3 bg-white text-gray-900 text-sm rounded-xl focus:outline-none transition-all font-medium appearance-none cursor-pointer"
        >
          {children}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[8px]">▼</div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('tab') === 'signup') {
      setTab('signup')
    }
  }, [])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [rollNo, setRollNo] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [department, setDepartment] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await signIn(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (signUpPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    
    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      setSuccess(result.success)
      setLoading(false)
    }
  }

  const switchTab = (t: 'signin' | 'signup') => {
    setTab(t)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-[#f8f8fc] text-gray-900 antialiased font-sans">
      
      {/* LEFT PANEL (BRANDING & FEATURE LIST - DESKTOP ONLY) */}
      <div className="hidden lg:flex lg:w-[50%] relative bg-gradient-to-br from-blue-50 via-sky-50 to-white flex-col items-center justify-center overflow-hidden px-14 border-r border-gray-200 select-none">
        
        {/* Floating Particles */}
        {mounted && PARTICLES.map(p => <Particle key={p.id} {...p} />)}
        
        {/* Subtle grid background */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,currentColor 0,currentColor 1px,transparent 1px,transparent 56px),repeating-linear-gradient(90deg,currentColor 0,currentColor 1px,transparent 1px,transparent 56px)' }} 
        />
        
        {/* Light glow radial background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-400/15 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-10 max-w-sm">
          


          {/* Heading Text */}
          <div className="space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 24 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl font-black tracking-tighter text-gray-900 leading-none"
            >
              {tab === 'signin' ? (
                <>Welcome<br /><span className="text-blue-600">back.</span></>
              ) : (
                <>Join the<br /><span className="text-blue-600">nexus.</span></>
              )}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-gray-500 text-sm leading-relaxed"
            >
              {tab === 'signin'
                ? 'Sign in to your campus portal and pick up exactly where you left off.'
                : 'Create your CampusOS account and unlock every club, event, and achievement on your campus.'}
            </motion.p>
          </div>

          {/* Checklist */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col gap-3"
          >
            {[
              { icon: Shield, text: 'Domain-verified & secure' },
              { icon: Sparkles, text: 'Instant access to clubs & events' },
              { icon: CheckCircle2, text: 'Role-based dashboard on first login' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-xs text-gray-600 font-semibold">
                <Icon size={15} className="text-emerald-500 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>

        </div>

        <p className="absolute bottom-8 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
          Campus<span className="text-blue-500">OS</span> • Campus Operating System
        </p>
      </div>

      {/* RIGHT PANEL (FORM CONTAINER) */}
      <motion.div
        initial={{ opacity: 0, x: 32 }} 
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-y-auto"
      >
        {/* Mobile Glow */}
        <div className="lg:hidden absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[400px] h-[400px] rounded-full bg-blue-400/15 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md space-y-7">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 select-none">
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">
              Campus<span className="text-blue-500">OS</span>
            </span>
          </div>

          {/* Switch Tab Pill */}
          <div className="flex gap-1 p-1 bg-gray-100 border border-gray-200 rounded-2xl select-none">
            {(['signin', 'signup'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                className={`relative flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
                  tab === t ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === t && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t === 'signin' ? 'Sign In' : 'Create Account'}</span>
              </button>
            ))}
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-600 font-semibold flex items-start gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Banner */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-600 font-semibold flex items-start gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Switcher */}
          <AnimatePresence mode="wait">
            {tab === 'signin' ? (
              
              /* SIGN IN FORM */
              <motion.form
                key="signin"
                initial={{ opacity: 0, y: 16 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <Field 
                  label="Email Address" 
                  icon={Mail} 
                  type="email" 
                  name="email"
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  placeholder="you@university.edu" 
                  required 
                />
                
                <div className="space-y-1">
                  <Field 
                    label="Password" 
                    icon={Lock} 
                    type="password" 
                    name="password"
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                    placeholder="Enter your password" 
                    required 
                  />
                  <div className="text-right pt-0.5">
                    <Link href="#" className="text-[10px] font-bold text-blue-600 hover:text-blue-500 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <motion.button
                  type="submit" 
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02 } : {}} 
                  whileTap={!loading ? { scale: 0.97 } : {}}
                  className="group w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm py-3.5 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/20 mt-4"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Sign In <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </motion.button>

                <div className="flex items-center gap-3 pt-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 select-none">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <button 
                  type="button" 
                  onClick={() => switchTab('signup')}
                  className="w-full py-3 text-xs font-bold text-gray-500 border border-gray-200 rounded-2xl hover:bg-gray-50 hover:text-gray-700 transition-all select-none"
                >
                  Don't have an account? <span className="text-blue-600">Register here</span>
                </button>
              </motion.form>

            ) : (

              /* SIGN UP FORM */
              <motion.form
                key="signup"
                initial={{ opacity: 0, y: 16 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                onSubmit={handleSignUp}
                className="space-y-4"
              >
                <div className="space-y-3.5">
                  <Field 
                    label="Full Name" 
                    icon={User} 
                    name="fullName"
                    value={fullName}
                    onChange={(e: any) => setFullName(e.target.value)}
                    placeholder="John Doe" 
                    required 
                  />
                  <Field 
                    label="Student ID / Roll Number" 
                    icon={BookOpen} 
                    name="rollNo"
                    value={rollNo}
                    onChange={(e: any) => setRollNo(e.target.value)}
                    placeholder="Enter your student ID" 
                    required 
                  />
                  <Field 
                    label="Email Address" 
                    icon={Mail} 
                    type="email" 
                    name="email"
                    value={signUpEmail}
                    onChange={(e: any) => setSignUpEmail(e.target.value)}
                    placeholder="you@university.edu" 
                    required 
                  />
                  
                  <Field 
                    label="Mobile Number" 
                    icon={Phone} 
                    type="tel" 
                    name="mobileNumber"
                    value={mobileNumber}
                    onChange={(e: any) => setMobileNumber(e.target.value)}
                    placeholder="Enter your mobile number" 
                    required 
                  />

                  <SelectField
                    label="Branch / Department"
                    icon={Building2}
                    name="department"
                    value={department}
                    onChange={(e: any) => setDepartment(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select your branch</option>
                    {DEPARTMENTS.map((d: string) => <option key={d} value={d}>{d}</option>)}
                  </SelectField>

                  <Field 
                    label="Password" 
                    icon={Lock} 
                    type="password" 
                    name="password"
                    value={signUpPassword}
                    onChange={(e: any) => setSignUpPassword(e.target.value)}
                    placeholder="Create a strong password" 
                    required 
                  />
                  <Field 
                    label="Confirm Password" 
                    icon={Lock} 
                    type="password" 
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e: any) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password" 
                    required 
                  />
                </div>



                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02 } : {}}
                  whileTap={!loading ? { scale: 0.97 } : {}}
                  className="group w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm py-3.5 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/20 mt-4"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Create Account <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </motion.button>

                <button 
                  type="button" 
                  onClick={() => switchTab('signin')}
                  className="w-full py-3 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors text-center select-none"
                >
                  Already have an account? <span className="text-blue-600">Sign in</span>
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Back to Home Link */}
          <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.5 }}
            className="text-center pt-2 select-none"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={13} /> Back to homepage
            </Link>
          </motion.div>



        </div>

      </motion.div>

    </div>
  )
}
