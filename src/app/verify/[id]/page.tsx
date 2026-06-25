import { verifyCertificate } from '@/actions/certificates'
import { CheckCircle2, ShieldAlert, Award, Calendar, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

export default async function VerifyCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { certificate, error } = await verifyCertificate(id)

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

          {certificate.image_url ? (
            <div className="w-full mb-8 rounded-2xl overflow-hidden border-4 border-[hsl(var(--border))] shadow-2xl relative">
              <img src={certificate.image_url} alt={certificate.title} className="w-full h-auto object-contain" />
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-md bg-opacity-90">
                <CheckCircle2 className="w-4 h-4" /> Verified
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 font-serif text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-sky-500 to-blue-500">
                {certificate.title}
              </h1>

              <p className="text-lg md:text-xl text-[hsl(var(--muted-foreground))] mb-8 max-w-lg leading-relaxed">
                {certificate.description}
              </p>
            </>
          )}

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
