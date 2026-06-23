'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award, Upload, ExternalLink, CheckCircle2, Clock, XCircle,
  Search, Filter, Sparkles, Loader2, X, FileText
} from 'lucide-react'
import { getMyCertificates, getUserCertificates, uploadCertificate, deleteCertificate } from '@/actions/certificate-repo'
import { extractAndSaveSkills } from '@/actions/ai'
import { CERTIFICATE_PLATFORMS } from '@/lib/constants'
import { Modal } from '@/components/ui/modal'

export function CertificatesTab({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) {
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [extractingSkills, setExtractingSkills] = useState<string | null>(null)

  useEffect(() => { loadCerts() }, [])

  async function loadCerts() {
    try {
      const data = isOwnProfile ? await getMyCertificates() : await getUserCertificates(userId)
      setCertificates(data)
    } catch (e) {
      console.error('Failed to load certificates:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleExtractSkills(certId: string) {
    setExtractingSkills(certId)
    try {
      const skills = await extractAndSaveSkills(certId)
      // Refresh certificates
      await loadCerts()
    } catch (e) {
      console.error('Failed to extract skills:', e)
    } finally {
      setExtractingSkills(null)
    }
  }

  async function handleDelete(certId: string) {
    if (!confirm('Delete this certificate?')) return
    try {
      await deleteCertificate(certId)
      setCertificates(prev => prev.filter(c => c.id !== certId))
    } catch (e) {
      console.error('Failed to delete:', e)
    }
  }

  const filteredCerts = certificates.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.issuer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPlatform = filterPlatform === 'all' || c.platform === filterPlatform
    return matchesSearch && matchesPlatform
  })

  const statusIcons: Record<string, any> = {
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Pending' },
    verified: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Verified' },
    rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Rejected' },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section inside the tab */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-black text-[hsl(var(--foreground))] text-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Award className="w-5 h-5" />
            </div>
            Certificate Repository
          </h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 ml-14">
            Upload, verify, and extract skills from your certifications
          </p>
        </div>
      </div>

      {/* Actions Bar */}
      {isOwnProfile && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search certificates..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">All Platforms</option>
            {CERTIFICATE_PLATFORMS.map(p => (
              <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity shrink-0 shadow-md hover:shadow-lg active:scale-95"
          >
            <Upload className="w-4 h-4" />
            Upload Certificate
          </button>
        </div>
      )}

      {/* Certificates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-[hsl(var(--muted))] animate-pulse" />
          ))}
        </div>
      ) : filteredCerts.length === 0 ? (
        <div className="text-center py-16 bg-[hsl(var(--card))] rounded-3xl border border-[hsl(var(--border))] border-dashed">
          <Award className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
          <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">No certificates yet</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 max-w-md mx-auto">
            {isOwnProfile ? "Upload your certifications from platforms like Google, AWS, Coursera, and more to boost your profile visibility." : "This user hasn't added any certificates yet."}
          </p>
          {isOwnProfile && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium shadow-md hover:shadow-lg active:scale-95 transition-all"
            >
              Upload Your First Certificate
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCerts.map((cert, i) => {
            const status = statusIcons[cert.verification_status]
            const platform = CERTIFICATE_PLATFORMS.find(p => p.value === cert.platform)
            return (
              <motion.div
                key={cert.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="group p-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 p-10 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-bl-full pointer-events-none" />
                
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <span className="text-2xl">{platform?.icon || '📄'}</span>
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.color}`}>
                    <status.icon className="w-3 h-3" />
                    {status.label}
                  </div>
                </div>
                <h3 className="font-semibold text-sm text-[hsl(var(--foreground))] mb-1 line-clamp-2 relative z-10">
                  {cert.title}
                </h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3 relative z-10">
                  {cert.issuer} • {platform?.label}
                </p>
                {cert.issue_date && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3 relative z-10">
                    Issued: {new Date(cert.issue_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                )}

                {/* Extracted Skills */}
                {cert.certificate_skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3 relative z-10">
                    {cert.certificate_skills.slice(0, 4).map((skill: any, j: number) => (
                      <span key={j} className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium">
                        {skill.skill_name}
                      </span>
                    ))}
                    {cert.certificate_skills.length > 4 && (
                      <span className="px-2 py-0.5 rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] text-[10px]">
                        +{cert.certificate_skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 mt-auto border-t border-[hsl(var(--border)/0.5)] relative z-10">
                  {cert.credential_url && (
                    <a
                      href={cert.credential_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {isOwnProfile && (!cert.certificate_skills || cert.certificate_skills.length === 0) && (
                    <button
                      onClick={() => handleExtractSkills(cert.id)}
                      disabled={extractingSkills === cert.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition-colors disabled:opacity-50"
                    >
                      {extractingSkills === cert.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      Extract Skills
                    </button>
                  )}
                  {isOwnProfile && (
                    <button
                      onClick={() => handleDelete(cert.id)}
                      className="ml-auto p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Upload Modal */}
      <UploadCertificateModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploaded={loadCerts}
      />
    </div>
  )
}

function UploadCertificateModal({ isOpen, onClose, onUploaded }: {
  isOpen: boolean; onClose: () => void; onUploaded: () => void
}) {
  const [formData, setFormData] = useState({
    title: '', issuer: '', platform: 'other' as string,
    credential_url: '', credential_id: '', issue_date: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Create preview
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      // Remove data:image/jpeg;base64, part
      const base64Data = base64String.split(',')[1]
      setImageBase64(base64Data)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title || !formData.issuer) return

    setSubmitting(true)
    try {
      await uploadCertificate({
        ...formData,
        issue_date: formData.issue_date || undefined,
      }, imageBase64 || undefined)
      onUploaded()
      onClose()
      setFormData({ title: '', issuer: '', platform: 'other', credential_url: '', credential_id: '', issue_date: '' })
      setImageBase64(null)
      setPreviewUrl(null)
    } catch (e) {
      console.error('Failed to upload:', e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Certificate">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Certificate Image (Optional)</label>
          <div className="flex items-center gap-4">
            <label className="flex-1 border-2 border-dashed border-[hsl(var(--border))] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
              <Upload className="w-6 h-6 text-[hsl(var(--muted-foreground))] mb-2" />
              <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">Click to upload image</span>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">PNG, JPG, or WEBP up to 5MB</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
            </label>
            {previewUrl && (
              <div className="w-24 h-24 rounded-xl overflow-hidden border border-[hsl(var(--border))] shrink-0">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Certificate Title *</label>
          <input
            type="text" required value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Google Data Analytics Professional Certificate"
            className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Issuer *</label>
            <input
              type="text" required value={formData.issuer}
              onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
              placeholder="e.g., Google"
              className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Platform *</label>
            <select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {CERTIFICATE_PLATFORMS.map(p => (
                <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Credential URL</label>
          <input
            type="url" value={formData.credential_url}
            onChange={(e) => setFormData({ ...formData, credential_url: e.target.value })}
            placeholder="https://www.coursera.org/verify/..."
            className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Credential ID</label>
            <input
              type="text" value={formData.credential_id}
              onChange={(e) => setFormData({ ...formData, credential_id: e.target.value })}
              placeholder="ABC123XYZ"
              className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Issue Date</label>
            <input
              type="date" value={formData.issue_date}
              onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-[hsl(var(--border))] mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-colors">
            Cancel
          </button>
          <button
            type="submit" disabled={submitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> : null}
            {submitting ? 'Uploading...' : 'Upload Certificate'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
