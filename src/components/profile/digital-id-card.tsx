import { QRCodeSVG } from 'qrcode.react'
import type { Profile } from '@/types/database'
import { getInitials } from '@/lib/utils'
import { Building, GraduationCap, Shield } from 'lucide-react'

interface DigitalIDCardProps {
  profile: Profile
}

export function DigitalIDCard({ profile }: DigitalIDCardProps) {
  const qrData = JSON.stringify({
    type: 'CAMPUS_ID',
    id: profile.id,
    roll_no: profile.roll_no,
    name: profile.full_name,
    role: profile.role
  })

  return (
    <div className="flex flex-col items-center p-2 sm:p-4">
      {/* The ID Card Container */}
      <div className="relative w-full max-w-[320px] rounded-[2rem] overflow-hidden shadow-2xl border border-[hsl(var(--border)/0.5)] bg-white dark:bg-slate-900 group">
        
        {/* Card Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 opacity-100" />
        
        {/* Decorative elements */}
        <div className="absolute top-[-10%] left-[-20%] w-[140%] h-[40%] bg-white/10 rounded-[100%] blur-xl transform -rotate-12 pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[140%] h-[40%] bg-black/10 rounded-[100%] blur-xl transform rotate-12 pointer-events-none" />

        <div className="relative h-full flex flex-col p-6 text-white">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-black tracking-widest uppercase leading-none mb-0.5">CampusOS</div>
                <div className="text-[9px] font-bold text-blue-100 tracking-[0.2em] uppercase">University Identity</div>
              </div>
            </div>
            {profile.role === 'admin' ? (
              <Shield className="w-6 h-6 text-yellow-300" />
            ) : profile.role === 'faculty' ? (
              <GraduationCap className="w-6 h-6 text-emerald-300" />
            ) : null}
          </div>

          {/* Photo & Name */}
          <div className="flex flex-col items-center text-center flex-1">
            <div className="relative w-28 h-28 rounded-[1.25rem] overflow-hidden mb-4 border-[3px] border-white/30 shadow-xl backdrop-blur-sm bg-white/10 flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white">{getInitials(profile.full_name)}</span>
              )}
            </div>

            <h2 className="text-2xl font-black tracking-tight mb-1">{profile.full_name}</h2>
            <p className="text-blue-100 font-semibold text-sm uppercase tracking-widest mb-4">
              {profile.role === 'admin' ? 'Administrator' : profile.role === 'faculty' ? 'Faculty Member' : 'Student'}
            </p>

            <div className="w-full bg-white/10 rounded-xl p-3 backdrop-blur-md border border-white/10 text-left space-y-1.5 mt-auto mb-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-blue-200">Roll No</span>
                <span className="font-bold tracking-wider">{profile.roll_no}</span>
              </div>
              {(profile.course || profile.department) && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-blue-200">Dept</span>
                  <span className="font-bold">{profile.department || profile.course}</span>
                </div>
              )}
              {profile.year && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-blue-200">Valid Till</span>
                  <span className="font-bold">{parseInt(profile.year) + 3}</span> {/* Placeholder valid till */}
                </div>
              )}
            </div>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-3 rounded-2xl mx-auto w-fit shadow-2xl relative mb-2">
            <QRCodeSVG 
              value={qrData}
              size={120}
              level="H"
              includeMargin={false}
              fgColor="#020617" // Very dark slate for high contrast
            />
          </div>

        </div>
      </div>
      <p className="mt-6 text-sm text-[hsl(var(--muted-foreground))] text-center max-w-[300px]">
        This digital ID card is officially issued by CampusOS and can be scanned for verification.
      </p>
    </div>
  )
}
