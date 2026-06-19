'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Mic, ArrowRight, CheckCircle, AlertCircle, Loader2, ArrowLeft, Trophy, User, MessageSquare } from 'lucide-react'
import { startMockInterviewAction, evaluateAnswerAction, completeMockInterviewAction } from '@/actions/placement'
import { DashboardContainer } from '@/components/ui/dashboard-container'
import { toast } from 'sonner'

export default function MockInterviewPage() {
  const router = useRouter()
  
  // 0 = Config, 1 = Questioning, 2 = Results
  const [step, setStep] = useState(0)
  
  // Config
  const [type, setType] = useState('technical')
  const [domain, setDomain] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  
  // Interview state
  const [sessionId, setSessionId] = useState('')
  const [questions, setQuestions] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Answering state
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isEvaluating, setIsEvaluating] = useState(false)
  
  // Feedback state for current question
  const [currentFeedback, setCurrentFeedback] = useState<{score: number, feedback: string} | null>(null)
  
  // Results
  const [finalScore, setFinalScore] = useState(0)
  const [finalFeedback, setFinalFeedback] = useState('')
  const [isCompleting, setIsCompleting] = useState(false)

  async function handleStart() {
    if (!type) return toast.error('Please select an interview type')
    if (type === 'technical' && !domain.trim()) return toast.error('Please enter a domain for technical interview')
    
    setIsStarting(true)
    const toastId = toast.loading('Generating interview questions...')
    try {
      const session = await startMockInterviewAction(type, domain)
      setSessionId(session.id)
      setQuestions(session.questions)
      toast.success('Interview ready!', { id: toastId })
      setStep(1)
    } catch (e: any) {
      toast.error(e.message || 'Failed to start interview', { id: toastId })
    } finally {
      setIsStarting(false)
    }
  }

  async function handleSubmitAnswer() {
    if (!currentAnswer.trim()) return toast.error('Please provide an answer')
    
    setIsEvaluating(true)
    try {
      const evaluation = await evaluateAnswerAction(sessionId, currentIndex, currentAnswer)
      setCurrentFeedback(evaluation)
      
      // Update local question state
      const updatedQs = [...questions]
      updatedQs[currentIndex].answer = currentAnswer
      updatedQs[currentIndex].score = evaluation.score
      updatedQs[currentIndex].ai_evaluation = evaluation.feedback
      setQuestions(updatedQs)
    } catch (e: any) {
      toast.error(e.message || 'Failed to evaluate answer')
    } finally {
      setIsEvaluating(false)
    }
  }

  async function handleNextQuestion() {
    setCurrentAnswer('')
    setCurrentFeedback(null)
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      // Complete interview
      setIsCompleting(true)
      const toastId = toast.loading('Compiling final results...')
      try {
        const result = await completeMockInterviewAction(sessionId)
        setFinalScore(result.total_score)
        setFinalFeedback(result.ai_feedback)
        toast.success('Interview completed!', { id: toastId })
        setStep(2)
      } catch (e: any) {
        toast.error(e.message || 'Failed to complete interview', { id: toastId })
      } finally {
        setIsCompleting(false)
      }
    }
  }

  return (
    <DashboardContainer title="Mock Interview" description="Practice and improve your interview skills with CampusAI">
      
      <AnimatePresence mode="wait">
        
        {/* STEP 0: Configuration */}
        {step === 0 && (
          <motion.div 
            key="step0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto mt-8"
          >
            <div className="glass rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors pointer-events-none"></div>
              
              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Mic className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[hsl(var(--foreground))]">Setup Interview</h2>
                  <p className="text-[hsl(var(--muted-foreground))]">Configure your AI mock interview session</p>
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[hsl(var(--foreground))]">Interview Type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {['technical', 'hr', 'behavioral'].map(t => (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          type === t 
                            ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500' 
                            : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))]'
                        }`}
                      >
                        <p className="font-bold capitalize text-[hsl(var(--foreground))]">{t}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                          {t === 'technical' ? 'Domain specific skills' : t === 'hr' ? 'Culture fit & general' : 'Past experiences & traits'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`transition-all duration-300 ${type === 'technical' ? 'opacity-100 h-auto' : 'opacity-50'}`}>
                  <label className="block text-sm font-semibold mb-2 text-[hsl(var(--foreground))]">
                    Target Domain / Role {type === 'technical' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    placeholder="e.g. Frontend Developer, Data Scientist, Marketing Manager"
                    className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                  />
                </div>

                <div className="pt-6 border-t border-[hsl(var(--border))] flex justify-end gap-3">
                  <button onClick={() => router.back()} className="px-6 py-3 rounded-xl font-bold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-colors">
                    Cancel
                  </button>
                  <button 
                    onClick={handleStart}
                    disabled={isStarting}
                    className="px-8 py-3 rounded-xl gradient-primary text-white font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
                  >
                    {isStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                    {isStarting ? 'Preparing...' : 'Start Session'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 1: Questioning */}
        {step === 1 && questions.length > 0 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black capitalize">{type} Interview {domain && `- ${domain}`}</h2>
              <div className="px-4 py-1.5 rounded-full bg-[hsl(var(--muted))] text-sm font-bold">
                Question {currentIndex + 1} of {questions.length}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* AI Question */}
                <div className="glass rounded-3xl p-6 border border-blue-500/20 relative">
                  <div className="absolute top-4 right-4 text-blue-500/20">
                    <MessageSquare className="w-24 h-24" />
                  </div>
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                      <span className="text-lg font-black text-blue-500">AI</span>
                    </div>
                    <div>
                      <p className="font-bold text-[hsl(var(--foreground))] text-lg leading-relaxed">
                        {questions[currentIndex].question}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Candidate Answer */}
                <div className="glass rounded-3xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                    </div>
                    <div className="w-full">
                      <p className="font-bold mb-3 text-[hsl(var(--foreground))]">Your Answer</p>
                      
                      {!currentFeedback ? (
                        <div className="space-y-4">
                          <textarea
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            placeholder="Type your answer here. Be as detailed as you would in a real interview..."
                            rows={6}
                            disabled={isEvaluating}
                            className="w-full p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                          />
                          <div className="flex justify-end">
                            <button 
                              onClick={handleSubmitAnswer}
                              disabled={isEvaluating || !currentAnswer.trim()}
                              className="px-6 py-2.5 rounded-xl gradient-primary text-white font-bold flex items-center gap-2 hover:shadow-md transition-all disabled:opacity-50"
                            >
                              {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Answer'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] whitespace-pre-wrap">
                          {currentAnswer}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Evaluation */}
                {currentFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="glass rounded-3xl p-6 border border-emerald-500/20"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">AI Evaluation</p>
                          <div className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                            Score: {currentFeedback.score}/10
                          </div>
                        </div>
                        <p className="text-[hsl(var(--foreground))] leading-relaxed text-sm whitespace-pre-wrap">
                          {currentFeedback.feedback}
                        </p>
                        
                        <div className="mt-6 flex justify-end">
                          <button 
                            onClick={handleNextQuestion}
                            disabled={isCompleting}
                            className="px-6 py-2.5 rounded-xl bg-[hsl(var(--foreground))] text-[hsl(var(--background))] font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                          >
                            {isCompleting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                              <>{currentIndex < questions.length - 1 ? 'Next Question' : 'Complete Interview'} <ArrowRight className="w-4 h-4" /></>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sidebar Hints */}
              <div className="space-y-4">
                <div className="glass rounded-3xl p-6">
                  <h3 className="font-bold flex items-center gap-2 mb-4 text-[hsl(var(--foreground))]">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Interview Hints
                  </h3>
                  <ul className="space-y-3">
                    {questions[currentIndex]?.hints?.map((hint: string, i: number) => (
                      <li key={i} className="text-sm text-[hsl(var(--muted-foreground))] flex gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Results */}
        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto"
          >
            <div className="glass rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-10 text-center text-white relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
                <h2 className="text-3xl font-black mb-2">Interview Completed!</h2>
                <p className="opacity-90">Great job completing your {type} mock interview.</p>
                
                <div className="mt-8 inline-block bg-white/20 backdrop-blur-sm rounded-3xl px-8 py-6 border border-white/20">
                  <p className="text-sm uppercase tracking-wider font-bold opacity-80 mb-1">Final Score</p>
                  <p className="text-6xl font-black">{finalScore}<span className="text-2xl opacity-70">/100</span></p>
                </div>
              </div>
              
              <div className="p-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[hsl(var(--foreground))]">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  Overall Feedback
                </h3>
                <div className="p-6 rounded-2xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] whitespace-pre-wrap leading-relaxed">
                  {finalFeedback}
                </div>
                
                <div className="mt-8 flex justify-center">
                  <button 
                    onClick={() => router.push('/placement')}
                    className="px-8 py-3 rounded-xl bg-[hsl(var(--foreground))] text-[hsl(var(--background))] font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Return to Placement Hub
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
      </AnimatePresence>
    </DashboardContainer>
  )
}
