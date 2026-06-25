'use client'

import { verifyCertificate } from '@/actions/certificates'
import { CheckCircle2, ShieldAlert, Award, Calendar, ExternalLink, Download } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function VerifyCertificatePage() {
  const params = useParams()
  const id = params.id as string
  const [certificate, setCertificate] = useState<any>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    verifyCertificate(id).then(res => {
      if (res.error || !res.certificate) setError(true)
      else setCertificate(res.certificate)
      setLoading(false)
    })
  }, [id])

  async function handleDownload() {
    if (!certificate?.image_url) return
    try {
      const response = await fetch(certificate.image_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${certificate.title || 'certificate'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      // Fallback: open in new tab
      window.open(certificate.image_url, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[hsl(var(--background))]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[hsl(var(--background))]">
        <div className="max-w-md w-full glass rounded-2xl p-8 text-center animate-scale-in">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Invalid Certificate</h1>
          <p className="text-[hsl(var(--muted-foreground))]">This certificate could not be found or has been revoked. Please check the ID and try again.</p>
          <Link href="/" className="mt-8 inline-block text-blue-500 font-medium hover:underline">
            Return to CampusOS
          </Link>
        </div>
      </div>
    )
  }

  // Dynamic certificate with uploaded template image
  if (certificate.image_url) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-[hsl(var(--background))] bg-[url('/mesh-bg.svg')] bg-cover bg-center">
        <div className="max-w-3xl w-full flex flex-col items-center gap-6 animate-scale-in">
          {/* Certificate Image */}
          <div className="w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-[hsl(var(--border))] relative group">
            <img 
              src={certificate.image_url} 
              alt={certificate.title} 
              className="w-full h-auto object-contain" 
            />
            {/* Verified overlay badge */}
            <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm transition-all shadow-lg shadow-blue-500/20"
            >
              <Download className="w-4 h-4" />
              Save Certificate
            </button>
          </div>

          {/* Minimal Footer */}
          <div className="flex flex-col items-center gap-2 mt-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500 font-medium text-xs">
              <ShieldAlert className="w-3.5 h-3.5" />
              Verified Authentic
            </div>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-mono">
              Certificate ID: {certificate.id}
            </p>
            <Link href="/" className="inline-flex items-center gap-1.5 text-blue-500 font-medium text-xs hover:underline">
              Powered by CampusOS <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Fallback: text-based certificate with full verification layout
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[hsl(var(--background))] bg-[url('/mesh-bg.svg')] bg-cover bg-center">
      <div className="max-w-2xl w-full glass-strong rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden animate-scale-in">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -ml-32 -mb-32" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-500/20">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500 font-medium text-sm mb-6">
            <ShieldAlert className="w-4 h-4" />
            Verified Authentic
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-4 font-serif text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-sky-500 to-blue-500">
            {certificate.title}
          </h1>

          <p className="text-lg md:text-xl text-[hsl(var(--muted-foreground))] mb-8 max-w-lg leading-relaxed">
            {certificate.description}
          </p>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-[hsl(var(--border))] to-transparent my-8" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full text-left">
            <div className="glass rounded-xl p-5">
              <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-semibold mb-1">Awarded To</p>
              <p className="text-lg font-bold">{certificate.profiles?.full_name}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Roll No. {certificate.profiles?.roll_no}</p>
            </div>
            
            <div className="glass rounded-xl p-5">
              <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-semibold mb-1">Issued By</p>
              <p className="text-lg font-bold">{certificate.issuer?.full_name}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">CampusOS Event Organizer</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full text-left mt-4">
            <div className="flex items-center gap-4 glass rounded-xl p-5">
              <Award className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-semibold mb-1">Event</p>
                <p className="font-semibold">{certificate.events?.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 glass rounded-xl p-5">
              <Calendar className="w-8 h-8 text-sky-500" />
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-semibold mb-1">Issue Date</p>
                <p className="font-semibold">{certificate.issue_date ? format(new Date(certificate.issue_date), 'MMMM do, yyyy') : 'Unknown'}</p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center gap-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-mono">
              Certificate ID: {certificate.id}
            </p>
            <Link href="/" className="inline-flex items-center gap-2 text-blue-500 font-medium hover:underline">
              Powered by CampusOS <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

