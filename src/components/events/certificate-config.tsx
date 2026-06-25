'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Upload, Crosshair, Save, Type } from 'lucide-react'

interface CertificateConfigProps {
  eventId: string
  initialConfig: {
    template_url?: string
    text_x?: number
    text_y?: number
    font_size?: number
    text_color?: string
  }
  onUpdate: () => void
}

export function CertificateConfig({ eventId, initialConfig, onUpdate }: CertificateConfigProps) {
  const supabase = createClient()
  const [templateUrl, setTemplateUrl] = useState(initialConfig.template_url || '')
  const [x, setX] = useState(initialConfig.text_x || 0)
  const [y, setY] = useState(initialConfig.text_y || 0)
  const [fontSize, setFontSize] = useState(initialConfig.font_size || 40)
  const [color, setColor] = useState(initialConfig.text_color || '#000000')
  
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPicking, setIsPicking] = useState(false)

  const imageRef = useRef<HTMLImageElement>(null)

  // Sync initial props
  useEffect(() => {
    setTemplateUrl(initialConfig.template_url || '')
    setX(initialConfig.text_x || 0)
    setY(initialConfig.text_y || 0)
    setFontSize(initialConfig.font_size || 40)
    setColor(initialConfig.text_color || '#000000')
  }, [initialConfig])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${eventId}_template_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('event_banners') // Reuse event banners bucket for event templates
        .upload(fileName, file)
        
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
        .from('event_banners')
        .getPublicUrl(fileName)

      setTemplateUrl(publicUrl)
      toast.success('Template uploaded! Now set the text position.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload template')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSaveConfig() {
    setIsSaving(true)
    try {
      const { error } = await supabase.from('events').update({
        certificate_template_url: templateUrl,
        cert_text_x: x,
        cert_text_y: y,
        cert_font_size: fontSize,
        cert_text_color: color
      }).eq('id', eventId)

      if (error) throw error
      toast.success('Certificate configuration saved!')
      onUpdate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save configuration')
    } finally {
      setIsSaving(false)
    }
  }

  function handleImageClick(e: React.MouseEvent<HTMLImageElement>) {
    if (!isPicking || !imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    // Calculate the scale between the rendered image and its natural size
    const scaleX = imageRef.current.naturalWidth / rect.width
    const scaleY = imageRef.current.naturalHeight / rect.height

    const clickX = (e.clientX - rect.left) * scaleX
    const clickY = (e.clientY - rect.top) * scaleY

    setX(Math.round(clickX))
    setY(Math.round(clickY))
    setIsPicking(false)
    toast.success('Position updated!')
  }

  return (
    <div className="p-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[hsl(var(--border))] pb-4">
        <div>
          <h4 className="font-semibold">Certificate Template</h4>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Upload a blank certificate and pick where the name should appear.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer px-4 py-2 bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload Template
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </div>
      </div>

      {templateUrl && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-[hsl(var(--muted)/0.3)]">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">Text Color</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-[hsl(var(--border))]"
                />
                <input 
                  type="text" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)}
                  className="px-2 py-1.5 text-sm rounded bg-[hsl(var(--background))] border border-[hsl(var(--border))] flex-1 max-w-[100px]"
                />
              </div>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">Font Size (px)</label>
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <input 
                  type="number" 
                  value={fontSize} 
                  onChange={(e) => setFontSize(parseInt(e.target.value) || 40)}
                  className="px-2 py-1.5 text-sm rounded bg-[hsl(var(--background))] border border-[hsl(var(--border))] w-20"
                />
              </div>
            </div>
            <div className="flex-1 min-w-[150px] flex items-end">
              <button 
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Config
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Position Preview</p>
              <button 
                onClick={() => setIsPicking(!isPicking)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isPicking ? 'bg-amber-500 text-white animate-pulse' : 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)]'}`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                {isPicking ? 'Click on image to set position...' : 'Pick Position'}
              </button>
            </div>

            <div className="relative border border-[hsl(var(--border))] rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center min-h-[300px]">
              <img 
                ref={imageRef}
                src={templateUrl} 
                alt="Certificate Template" 
                className={`max-w-full h-auto max-h-[600px] object-contain transition-opacity ${isPicking ? 'cursor-crosshair opacity-90' : ''}`}
                onClick={handleImageClick}
              />
              
              {/* Preview Overlay */}
              {imageRef.current && (
                <div 
                  className="absolute pointer-events-none whitespace-nowrap"
                  style={{
                    left: `${(x / imageRef.current.naturalWidth) * 100}%`,
                    top: `${(y / imageRef.current.naturalHeight) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    color: color,
                    // Scale font size relatively based on display width vs natural width
                    fontSize: `${fontSize * (imageRef.current.getBoundingClientRect().width / imageRef.current.naturalWidth)}px`,
                    fontWeight: 'bold',
                    textShadow: '0 0 2px rgba(255,255,255,0.5)' // Just to make it visible against varied backgrounds in preview
                  }}
                >
                  Participant Name
                </div>
              )}
            </div>
            <p className="text-xs text-center text-[hsl(var(--muted-foreground))]">Current Target: X={x}, Y={y}</p>
          </div>
        </div>
      )}
    </div>
  )
}
