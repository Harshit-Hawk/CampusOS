'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Loader2, FileText, Check, Sparkles, AlertCircle, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'

interface DocxReportModalProps {
  eventId: string
  open: boolean
  onClose: () => void
}

interface PreflightData {
  autoFilled: Record<string, string>
  missingFields: string[]
  isCompetitive: boolean
  eventTitle: string
}

// Field labels for display
const FIELD_LABELS: Record<string, string> = {
  eventName: 'Name of Event / Activity',
  organizingDepartment: 'Organizing Department',
  activityCoordinator: 'Activity Coordinator',
  activityCoCoordinator: 'Activity Co-Coordinator',
  dateAndTime: 'Date and Time',
  targetAudience: 'Target Audience / Participants',
  expectedOutcome: 'Expected Outcome',
  chiefGuest: 'Chief Guest / Other Guest',
  judgesDetail: 'Judges Detail',
  totalParticipants: 'Total Number of Participants',
  resultsWinners: 'Results / Winners Detail',
  assessmentCriteria: 'Assessment Criteria',
  rulesAndRegulations: 'Rules and Regulations',
  glimpses: 'Copy of Glimpses (News etc.)',
  billsDetails: 'Bills Details',
  itemsReceivedIssued: 'Items Received and Issued Records',
}

export function DocxReportModal({ eventId, open, onClose }: DocxReportModalProps) {
  const [step, setStep] = useState<'loading' | 'upload_creative' | 'analyzing_creative' | 'form' | 'generating'>('loading')
  const [preflight, setPreflight] = useState<PreflightData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state for user-provided answers
  const [targetAudience, setTargetAudience] = useState('')
  const [expectedOutcome, setExpectedOutcome] = useState('')
  const [chiefGuest, setChiefGuest] = useState('')
  const [hasChiefGuest, setHasChiefGuest] = useState<'yes' | 'no' | null>(null)
  const [hasJudges, setHasJudges] = useState<'yes' | 'no' | null>(null)
  const [judgesDetail, setJudgesDetail] = useState('')
  const [isCompetitiveEvent, setIsCompetitiveEvent] = useState<'yes' | 'no' | null>(null)
  const [winnersDetail, setWinnersDetail] = useState('')
  const [hasBills, setHasBills] = useState<'yes' | 'no' | null>(null)
  const [billsDetail, setBillsDetail] = useState('')
  const [assessmentCriteria, setAssessmentCriteria] = useState('')
  const [rulesAndRegulations, setRulesAndRegulations] = useState('')
  const [creativeImage, setCreativeImage] = useState<{ base64: string, mimeType: string, width: number, height: number, dataUrl: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch preflight data when modal opens
  useEffect(() => {
    if (!open) return
    setStep('loading')
    setError(null)

    fetch('/api/ai/event-report/docx/preflight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to fetch event data')
        }
        return res.json()
      })
      .then((data: PreflightData) => {
        setPreflight(data)

        // Pre-fill form with auto-filled data where available
        if (data.autoFilled.targetAudience) {
          setTargetAudience(data.autoFilled.targetAudience)
        }
        if (data.autoFilled.chiefGuest) {
          setHasChiefGuest('yes')
          setChiefGuest(data.autoFilled.chiefGuest)
        }
        if (data.autoFilled.resultsWinners) {
          setIsCompetitiveEvent('yes')
          setWinnersDetail(data.autoFilled.resultsWinners)
        }

        setStep('upload_creative')
      })
      .catch((e) => {
        setError(e.message)
        setStep('upload_creative')
      })
  }, [open, eventId])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setStep('loading')
      setPreflight(null)
      setError(null)
      setTargetAudience('')
      setExpectedOutcome('')
      setChiefGuest('')
      setHasChiefGuest(null)
      setHasJudges(null)
      setJudgesDetail('')
      setIsCompetitiveEvent(null)
      setWinnersDetail('')
      setHasBills(null)
      setBillsDetail('')
      setAssessmentCriteria('')
      setRulesAndRegulations('')
      setCreativeImage(null)
    }
  }, [open])

  async function handleAnalyzeCreative() {
    if (!creativeImage) {
      setStep('form')
      return
    }

    setStep('analyzing_creative')
    try {
      const res = await fetch('/api/ai/event-report/docx/analyze-creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creativeImage,
          eventTitle: preflight?.eventTitle || '',
          eventDescription: '',
          organizingDepartment: preflight?.autoFilled?.organizingDepartment || '',
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.targetAudience && data.targetAudience !== 'None') {
          setTargetAudience(data.targetAudience)
          // Also update the auto-filled display box so it matches
          setPreflight(prev => prev ? {
            ...prev,
            autoFilled: {
              ...prev.autoFilled,
              targetAudience: data.targetAudience
            }
          } : null)
        }
        
        if (data.expectedOutcome && data.expectedOutcome !== 'None') {
          setExpectedOutcome(data.expectedOutcome)
        } else {
          setExpectedOutcome('The event aimed to enhance student engagement and provide a platform for foundational learning.')
        }

        if (data.chiefGuest && data.chiefGuest !== 'None') {
          setHasChiefGuest('yes')
          setChiefGuest(data.chiefGuest)
        } else {
          setHasChiefGuest('no')
        }

        if (data.judgesDetail && data.judgesDetail !== 'None') {
          setHasJudges('yes')
          setJudgesDetail(data.judgesDetail)
        } else {
          setHasJudges('no')
        }

        if (data.rulesAndRegulations && data.rulesAndRegulations !== 'None') {
          setRulesAndRegulations(data.rulesAndRegulations)
        } else {
          setRulesAndRegulations('Not explicitly mentioned in the poster.')
        }
      } else {
        let errData;
        try { errData = await res.json() } catch(e) {}
        toast.error(`Could not analyze creative: ${errData?.error || res.statusText}`)
      }
    } catch (e: any) {
      toast.error(`Failed to analyze creative: ${e.message}`)
    }
    setStep('form')
  }

  async function handleGenerate() {
    setStep('generating')

    // Build user overrides from form
    const userOverrides: Record<string, string> = {}

    if (targetAudience.trim()) userOverrides.targetAudience = targetAudience.trim()
    if (expectedOutcome.trim()) userOverrides.expectedOutcome = expectedOutcome.trim()
    if (assessmentCriteria.trim()) userOverrides.assessmentCriteria = assessmentCriteria.trim()
    if (rulesAndRegulations.trim()) userOverrides.rulesAndRegulations = rulesAndRegulations.trim()

    if (hasChiefGuest === 'yes' && chiefGuest.trim()) {
      userOverrides.chiefGuest = chiefGuest.trim()
    } else if (hasChiefGuest === 'no') {
      userOverrides.chiefGuest = '--'
    }

    if (hasJudges === 'yes' && judgesDetail.trim()) {
      userOverrides.judgesDetail = judgesDetail.trim()
    } else if (hasJudges === 'no') {
      userOverrides.judgesDetail = '--'
    }

    if (isCompetitiveEvent === 'yes' && winnersDetail.trim()) {
      userOverrides.resultsWinners = winnersDetail.trim()
    } else if (isCompetitiveEvent === 'no') {
      userOverrides.resultsWinners = '--'
    }

    if (hasBills === 'yes' && billsDetail.trim()) {
      userOverrides.billsDetails = billsDetail.trim()
    } else if (hasBills === 'no') {
      userOverrides.billsDetails = '--'
    }

    try {
      const res = await fetch('/api/ai/event-report/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, userOverrides, creativeImage }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to generate DOCX report')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const disposition = res.headers.get('Content-Disposition') || ''
      const filenameMatch = disposition.match(/filename="?(.+?)"?$/)
      link.setAttribute('href', url)
      link.setAttribute('download', filenameMatch?.[1] || 'event_report.docx')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('DOCX report downloaded!')
      onClose()
    } catch (e: any) {
      toast.error(e.message)
      setStep('form')
    }
  }

  if (!open) return null

  // Count auto-filled fields
  const autoFilledCount = preflight
    ? Object.values(preflight.autoFilled).filter(v => v && v.length > 0).length
    : 0

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[hsl(var(--border))] flex justify-between items-center bg-[hsl(var(--muted)/0.3)] shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              Generate Event Report
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {step === 'loading' && 'Fetching event data from CampusOS...'}
              {step === 'upload_creative' && 'Attach an event poster/creative (Optional)'}
              {step === 'analyzing_creative' && 'Analyzing event poster...'}
              {step === 'form' && `${preflight ? Object.values(preflight.autoFilled).filter(v => v && v.length > 0).length : 0} fields auto-filled. Please review the questions below.`}
              {step === 'generating' && 'Generating your DOCX report...'}
            </p>
          </div>
          <button onClick={onClose} disabled={step === 'generating' || step === 'analyzing_creative'} className="p-2 rounded-full bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] transition-colors disabled:opacity-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Retrieving event information...</p>
            </div>
          )}

          {error && (
            <div className="p-4 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-500">Error</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
              </div>
            </div>
          )}

          {step === 'upload_creative' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-full max-w-md p-6 border-2 border-dashed border-[hsl(var(--border))] rounded-2xl bg-[hsl(var(--muted)/0.3)] hover:bg-[hsl(var(--muted)/0.5)] transition-colors text-center cursor-pointer" onClick={() => !creativeImage && fileInputRef.current?.click()}>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return }
                  if (file.size > 4 * 1024 * 1024) { toast.error('Image size must be less than 4MB'); return }
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    const dataUrl = event.target?.result as string
                    const base64String = dataUrl.split(',')[1]
                    const img = new Image()
                    img.onload = () => {
                      setCreativeImage({ 
                        base64: base64String, 
                        mimeType: file.type,
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        dataUrl
                      })
                      toast.success('Creative attached successfully')
                    }
                    img.src = dataUrl
                  }
                  reader.readAsDataURL(file)
                }} />
                
                <div className="flex flex-col items-center gap-4">
                  {!creativeImage && (
                    <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-2">
                      <ImagePlus className="w-8 h-8 text-indigo-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold">Attach Event Poster</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                      Upload the event creative or poster. AI will analyze it to pre-fill the form with details like Chief Guest, Rules, and Expected Outcome.
                    </p>
                  </div>
                  
                  {creativeImage ? (
                    <div className="mt-4 flex flex-col items-center">
                      <div className="relative w-48 h-48 rounded-xl overflow-hidden border-2 border-[hsl(var(--border))] shadow-md mb-3 group">
                        <img src={creativeImage.dataUrl} alt="Creative Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-sm font-medium flex items-center gap-1"><ImagePlus className="w-4 h-4"/> Change Poster</span>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setCreativeImage(null) }} className="text-sm text-red-500 hover:underline">Remove Image</button>
                    </div>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }} className="mt-4 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors">
                      Upload Image
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'analyzing_creative' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Analyzing Event Poster...</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Extracting guests, outcomes, and rules to save you time</p>
              </div>
            </div>
          )}

          {step === 'form' && preflight && (
            <div className="space-y-6">
              {/* Auto-filled summary */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <h3 className="text-sm font-semibold text-emerald-500 mb-2 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Auto-filled details ({Object.values(preflight.autoFilled).filter(v => v && v.length > 0).length + (creativeImage ? 4 : 0)} fields)
                </h3>
                <div className="grid gap-1.5">
                  {Object.entries(preflight.autoFilled)
                    .filter(([, v]) => v && v.length > 0)
                    .map(([key, value]) => (
                      <div key={key} className="text-xs flex gap-2">
                        <span className="text-[hsl(var(--muted-foreground))] shrink-0 w-44">{FIELD_LABELS[key] || key}:</span>
                        <span className="font-medium truncate">{value}</span>
                      </div>
                    ))}
                  {creativeImage && (
                    <>
                      <div className="text-xs flex gap-2">
                        <span className="text-[hsl(var(--muted-foreground))] shrink-0 w-44">Attached Annexure:</span>
                        <span className="font-medium text-indigo-500 truncate">Event Creative / Poster Image</span>
                      </div>
                      <div className="text-xs flex gap-2">
                        <span className="text-[hsl(var(--muted-foreground))] shrink-0 w-44">AI Extraction:</span>
                        <span className="font-medium text-emerald-600 truncate">Chief Guest, Judges, Rules, Outcomes</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Questions for missing fields */}
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Review & Fill Remaining Details
                </h3>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Target Audience / Participants
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="E.g., BBA and MBA Students"
                    className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                {/* Expected Outcome */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    What was the expected outcome of this event?
                  </label>
                  <textarea
                    value={expectedOutcome}
                    onChange={(e) => setExpectedOutcome(e.target.value)}
                    placeholder="Leave blank to let AI generate this..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                  />
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI will generate if left blank
                  </p>
                </div>

                {/* Chief Guest */}
                {!preflight.autoFilled.chiefGuest && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Was there any Chief Guest or Guest Speaker?
                    </label>
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setHasChiefGuest('yes')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${hasChiefGuest === 'yes' ? 'bg-indigo-500 text-white' : 'bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasChiefGuest('no')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${hasChiefGuest === 'no' ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]' : 'bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}
                      >
                        No
                      </button>
                    </div>
                    {hasChiefGuest === 'yes' && (
                      <input
                        type="text"
                        value={chiefGuest}
                        onChange={(e) => setChiefGuest(e.target.value)}
                        placeholder="Enter guest name and designation..."
                        className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    )}
                  </div>
                )}

                {/* Judges */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Were there any judges?
                  </label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setHasJudges('yes')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${hasJudges === 'yes' ? 'bg-indigo-500 text-white' : 'bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasJudges('no')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${hasJudges === 'no' ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]' : 'bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}
                    >
                      No
                    </button>
                  </div>
                  {hasJudges === 'yes' && (
                    <textarea
                      value={judgesDetail}
                      onChange={(e) => setJudgesDetail(e.target.value)}
                      placeholder="Enter judge names and designation..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                    />
                  )}
                </div>

                {/* Winners / Competitive */}
                {!preflight.autoFilled.resultsWinners && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Was this a competitive event?
                    </label>
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setIsCompetitiveEvent('yes')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isCompetitiveEvent === 'yes' ? 'bg-indigo-500 text-white' : 'bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCompetitiveEvent('no')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isCompetitiveEvent === 'no' ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]' : 'bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}
                      >
                        No
                      </button>
                    </div>
                    {isCompetitiveEvent === 'yes' && (
                      <textarea
                        value={winnersDetail}
                        onChange={(e) => setWinnersDetail(e.target.value)}
                        placeholder="Enter winner details (e.g., 1st Place: John Doe, 2nd Place: Jane Smith)..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                      />
                    )}
                  </div>
                )}

                {/* Assessment Criteria */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Assessment Criteria
                  </label>
                  <textarea
                    value={assessmentCriteria}
                    onChange={(e) => setAssessmentCriteria(e.target.value)}
                    placeholder="Leave blank to let AI generate this..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                  />
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI will generate if left blank
                  </p>
                </div>

                {/* Rules & Regulations */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Rules and Regulations
                  </label>
                  <textarea
                    value={rulesAndRegulations}
                    onChange={(e) => setRulesAndRegulations(e.target.value)}
                    placeholder="Leave blank to let AI generate this..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                  />
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI will generate if left blank
                  </p>
                </div>

                {/* Bills */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Would you like to attach bills?
                  </label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setHasBills('yes')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${hasBills === 'yes' ? 'bg-indigo-500 text-white' : 'bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasBills('no')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${hasBills === 'no' ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]' : 'bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}
                    >
                      No
                    </button>
                  </div>
                  {hasBills === 'yes' && (
                    <input
                      type="text"
                      value={billsDetail}
                      onChange={(e) => setBillsDetail(e.target.value)}
                      placeholder="Enter bill reference or details..."
                      className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Generating your Event Report...</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">AI is writing professional content for remaining fields</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'upload_creative' && (
          <div className="p-6 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] flex justify-between items-center shrink-0">
            <button
              onClick={() => setStep('form')}
              className="px-4 py-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors text-sm font-medium"
            >
              Skip
            </button>
            <button
              onClick={handleAnalyzeCreative}
              disabled={!creativeImage}
              className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-md disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              Analyze & Continue
            </button>
          </div>
        )}

        {step === 'form' && preflight && (
          <div className="p-6 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] flex justify-between items-center shrink-0">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Fields left blank will be auto-generated by AI
            </p>
            <button
              onClick={handleGenerate}
              className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-md hover:shadow-lg active:scale-95"
            >
              <FileText className="w-4 h-4" />
              Generate DOCX
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
