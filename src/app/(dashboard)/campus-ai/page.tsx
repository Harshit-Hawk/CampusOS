'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ArrowUp, Plus, Trash2, MessageSquare, BookOpen,
  BriefcaseBusiness, CalendarDays, GraduationCap, TrendingUp,
  Loader2, Bot, User, ChevronLeft, Users, Shield
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { createChatSession, getChatSessions, getChatSession, deleteChatSession } from '@/actions/ai'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatSession {
  id: string
  title: string
  context_type: string
  created_at: string
  updated_at: string
}

const SUGGESTED_PROMPTS = {
  student: [
    { icon: CalendarDays, text: 'Which events should I attend this month?', color: 'text-blue-500' },
    { icon: Sparkles, text: 'What clubs match my skills?', color: 'text-cyan-500' },
    // { icon: BriefcaseBusiness, text: 'Help me prepare for placements', color: 'text-rose-500' },
    { icon: TrendingUp, text: 'How can I climb the leaderboard?', color: 'text-amber-500' },
    // { icon: GraduationCap, text: 'Connect me with relevant alumni', color: 'text-purple-500' },
    { icon: Users, text: 'Find communities for my interests', color: 'text-emerald-500' },
  ],
  faculty: [
    { icon: CalendarDays, text: 'Upcoming events in my department', color: 'text-blue-500' },
    { icon: TrendingUp, text: 'Analyze campus event participation', color: 'text-emerald-500' },
    // { icon: BriefcaseBusiness, text: 'Placement stats for recent graduates', color: 'text-purple-500' },
    { icon: Sparkles, text: 'Suggest new club ideas', color: 'text-amber-500' },
  ],
  admin: [
    { icon: TrendingUp, text: 'Generate platform engagement report', color: 'text-blue-500' },
    { icon: CalendarDays, text: 'Predict next event participation', color: 'text-emerald-500' },
    { icon: Shield, text: 'Active clubs and communities overview', color: 'text-purple-500' },
    { icon: Sparkles, text: 'Campus insights dashboard summary', color: 'text-amber-500' },
  ],
}

export default function CampusAIPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [userRole, setUserRole] = useState<string>('student')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Auto-close sidebar on mobile
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
    loadSessions()
    // Get user role from profile data
    fetch('/api/ai/chat', { method: 'OPTIONS' }).catch(() => {})
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadSessions() {
    try {
      const data = await getChatSessions()
      setSessions(data)
    } catch (e) {
      console.error('Failed to load sessions:', e)
    }
  }

  async function handleNewChat() {
    try {
      const session = await createChatSession()
      setSessions(prev => [session, ...prev])
      setActiveSession(session.id)
      setMessages([])
    } catch (e) {
      console.error('Failed to create session:', e)
    }
  }

  async function handleSelectSession(sessionId: string) {
    try {
      setActiveSession(sessionId)
      const session = await getChatSession(sessionId)
      setMessages((session?.messages as Message[]) || [])
    } catch (e) {
      console.error('Failed to load session:', e)
    }
  }

  async function handleDeleteSession(sessionId: string) {
    try {
      await deleteChatSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (activeSession === sessionId) {
        setActiveSession(null)
        setMessages([])
      }
    } catch (e) {
      console.error('Failed to delete session:', e)
    }
  }

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    let sessionId = activeSession

    // Create new session if none active
    if (!sessionId) {
      try {
        const session = await createChatSession()
        sessionId = session.id
        setActiveSession(session.id)
        setSessions(prev => [session, ...prev])
      } catch (e) {
        console.error('Failed to create session:', e)
        return
      }
    }

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content.trim(), sessionId }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      const aiMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      }

      setMessages(prev => [...prev, aiMessage])

      // Update session title in sidebar
      setSessions(prev => prev.map(s =>
        s.id === sessionId
          ? { ...s, title: content.substring(0, 50) + (content.length > 50 ? '...' : ''), updated_at: new Date().toISOString() }
          : s
      ))
    } catch (error: any) {
      let friendlyError = "I'm having trouble connecting to the server right now. Please try again."
      if (error.message?.includes('503') || error.message?.includes('high demand') || error.message?.includes('overloaded')) {
        friendlyError = "The AI model is currently experiencing high demand. Please wait a moment and try again."
      } else if (error.message?.includes('fetch')) {
        friendlyError = "I'm having trouble reaching the AI service due to a network issue. Please check your connection and try again."
      }

      const errorMessage: Message = {
        role: 'assistant',
        content: friendlyError,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [activeSession, isLoading])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const prompts = SUGGESTED_PROMPTS[userRole as keyof typeof SUGGESTED_PROMPTS] || SUGGESTED_PROMPTS.student

  return (
    <div className="flex h-[calc(100dvh-var(--topbar-height)-6rem)] lg:h-[calc(100vh-var(--topbar-height)-1.5rem)] -mx-4 -mt-4 lg:-mx-6 lg:-mt-6 bg-[hsl(var(--background))] overflow-hidden relative">
      
      {/* Centered Top Nav */}
      <div className="absolute top-0 left-0 right-0 z-20 flex flex-col items-center justify-center pt-8 pb-10 bg-gradient-to-b from-background via-background/90 to-transparent pointer-events-none">
        <div className="font-black text-2xl text-slate-900 dark:text-white pointer-events-auto flex items-center gap-2 tracking-tight">
          Campus<span className="text-blue-500">AI</span>
        </div>
        <button
          onClick={handleNewChat}
          className="mt-3 flex items-center gap-1.5 px-5 py-2 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-500 dark:text-blue-400 rounded-full shadow-sm pointer-events-auto transition-all text-sm font-bold border border-blue-100 dark:border-slate-700 hover:shadow-md hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> New Chat
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {messages.length === 0 ? (
            <div className="min-h-full flex flex-col items-center justify-center max-w-3xl mx-auto px-4 pb-48 pt-32">
              <div className="w-20 h-20 rounded-full bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center mb-6 shrink-0">
                <Sparkles className="w-10 h-10 text-blue-500 dark:text-blue-400" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8 text-center tracking-tight shrink-0">
                How can I help you today?
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl shrink-0 mt-4">
                {prompts.slice(0, 4).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt.text)}
                    className="p-4 rounded-2xl border border-blue-100 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 transition-all text-left flex items-start gap-4 shadow-sm backdrop-blur-md hover:shadow-md hover:-translate-y-0.5 group"
                  >
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-slate-700 group-hover:scale-110 transition-transform shrink-0">
                      <prompt.icon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div className="pt-1.5">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">{prompt.text}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="pb-32 pt-36">
              {messages.map((msg, i) => (
                <div key={i} className={`w-full py-4 sm:py-6`}>
                  <div className={`max-w-3xl mx-auto px-4 sm:px-6 flex gap-3 sm:gap-5 text-sm sm:text-base md:gap-6 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="shrink-0 mt-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                      </div>
                    )}
                    <div className={`min-w-0 ${msg.role === 'user' ? 'max-w-[85%] sm:max-w-[75%] bg-blue-600 text-white px-5 py-3.5 rounded-3xl rounded-br-sm text-right shadow-sm' : 'flex-1 text-left'}`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-bold [&_code]:text-xs [&_code]:bg-blue-100 dark:[&_code]:bg-blue-900/30 [&_code]:text-blue-800 dark:[&_code]:text-blue-300 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_pre]:text-sm [&_pre]:bg-slate-900 [&_pre]:text-white [&_pre]:rounded-xl [&_pre]:p-5 [&_a]:text-blue-600 hover:[&_a]:underline [&_strong]:font-bold leading-relaxed">
                          <ReactMarkdown>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="font-medium whitespace-pre-wrap leading-relaxed text-white text-left inline-block">{msg.content}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="w-full py-4 sm:py-6">
                  <div className="max-w-3xl mx-auto px-4 sm:px-6 flex gap-3 sm:gap-5 text-base md:gap-6">
                    <div className="shrink-0 mt-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex items-center pt-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse mr-1"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse [animation-delay:150ms] mr-1"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse [animation-delay:300ms]"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-6" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-16 pb-6 px-4 pointer-events-none">
          <div className="max-w-3xl mx-auto relative pointer-events-auto">            <div className="relative rounded-3xl border border-blue-200 dark:border-slate-700 shadow-xl shadow-blue-900/5 dark:shadow-none bg-white dark:bg-slate-800 focus-within:shadow-2xl focus-within:shadow-blue-900/10 focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask CampusAI anything..."
                rows={1}
                className="w-full resize-none px-6 py-[18px] pr-16 bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none scrollbar-hide font-medium"
                style={{ maxHeight: 200, minHeight: 60 }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = '60px'
                  target.style.height = Math.min(target.scrollHeight, 200) + 'px'
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="absolute right-2.5 bottom-2.5 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 transition-all hover:bg-blue-700 active:scale-95 shadow-sm disabled:shadow-none"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
