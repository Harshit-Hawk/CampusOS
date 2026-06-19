'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/actions/communities'
import Link from 'next/link'
import { Plus, Smile, Send, Paperclip, Hash, Users, X, ChevronLeft, MoreVertical, Search, Crown } from 'lucide-react'

export function ChatInterface({ 
  channelId, 
  initialMessages, 
  currentUser,
  channel,
  members
}: { 
  channelId: string, 
  initialMessages: any[], 
  currentUser: any,
  channel: any,
  members: any[]
}) {
  const [messages, setMessages] = useState<any[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [attachments, setAttachments] = useState<{name: string, url: string, type: string}[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const emojis = ['👍', '❤️', '😂', '🔥', '🎉', '🙌', '👀', '✨', '💯', '🚀']

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current && !showMembers) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, showMembers])

  // Real-time subscription
  useEffect(() => {
    const channelSub = supabase
      .channel(`chat_${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `channel_id=eq.${channelId}`
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role')
            .eq('id', payload.new.user_id)
            .single()

          const newMessage = {
            ...payload.new,
            profiles: profile
          }

          setMessages(prev => {
            if (prev.find(m => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channelSub)
    }
  }, [channelId, supabase])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `${channelId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('community_files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('community_files')
        .getPublicUrl(filePath)

      setAttachments(prev => [...prev, { name: file.name, url: data.publicUrl, type: file.type }])
    } catch (error: any) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file. ' + error.message)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && attachments.length === 0) || isSending) return
    
    setIsSending(true)
    const content = input
    const currentAttachments = attachments.map(a => a.url)
    
    setInput('')
    setAttachments([])
    
    const res = await sendMessage(channelId, content, currentAttachments)
    if (!res.success) {
      console.error(res.error)
      setInput(content)
    }
    
    setIsSending(false)
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Generate color based on role or name hash for UI demo
  const getRoleColor = (role: string, name: string) => {
    if (role === 'admin' || role === 'owner') return 'text-emerald-500'
    if (role === 'moderator') return 'text-blue-500'
    
    // Hash name for other members to assign a persistent random color (pink, purple, blue, teal, orange)
    const colors = ['text-pink-500', 'text-purple-500', 'text-indigo-500', 'text-teal-500', 'text-orange-500']
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  // --- Members Screen (Mockup Screen 3 / Pane 4) ---
  const owners = members.filter(m => m.role === 'owner')
  const moderators = members.filter(m => m.role === 'admin' || m.role === 'moderator')
  const others = members.filter(m => m.role !== 'owner' && m.role !== 'admin' && m.role !== 'moderator')

  const membersPane = showMembers && (
    <div className="w-full xl:w-[320px] shrink-0 flex flex-col min-w-0 bg-[hsl(var(--background))] animate-in fade-in duration-200 border-l border-[hsl(var(--border)/0.5)]">
      <div className="h-16 px-4 flex items-center shrink-0 border-b border-[hsl(var(--border)/0.5)]">
        <button onClick={() => setShowMembers(false)} className="p-2 -ml-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors xl:hidden">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="font-bold text-[hsl(var(--foreground))] text-lg ml-2 flex-1 text-center pr-8 xl:text-left xl:pr-0 xl:ml-0">Members</h2>
        <button onClick={() => setShowMembers(false)} className="hidden xl:block p-1.5 ml-auto text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors rounded-lg hover:bg-[hsl(var(--muted))]">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="px-4 py-3 border-b border-[hsl(var(--border)/0.5)]">
        <div className="bg-[hsl(var(--muted)/0.5)] rounded-xl flex items-center px-3 py-2 border border-[hsl(var(--border)/0.5)]">
          <Search className="w-5 h-5 text-[hsl(var(--muted-foreground))] mr-2" />
          <input type="text" placeholder="Search members" className="bg-transparent border-none outline-none text-sm w-full text-[hsl(var(--foreground))]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {owners.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-[hsl(var(--muted-foreground))] px-4 mb-2 uppercase tracking-wider">
              Community Owner — {owners.length}
            </h3>
            {owners.map(m => (
              <div key={m.profiles.id} className="flex items-center gap-3 px-4 py-2 hover:bg-[hsl(var(--muted)/0.5)] cursor-pointer">
                <div className="w-10 h-10 rounded-[14px] bg-[hsl(var(--muted))] shrink-0 flex items-center justify-center overflow-hidden relative border border-[hsl(var(--border))]">
                  {m.profiles.avatar_url ? (
                    <img src={m.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold">{m.profiles.full_name?.substring(0,2).toUpperCase()}</span>
                  )}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[hsl(var(--background))]"></div>
                </div>
                <div className="flex-1 flex flex-col">
                  <span className={`font-bold text-sm flex items-center gap-1 text-emerald-500`}>
                    {m.profiles.full_name} <Crown className="w-3.5 h-3.5 text-warning" />
                  </span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">Online</span>
                </div>
                <MoreVertical className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              </div>
            ))}
          </div>
        )}

        {moderators.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-[hsl(var(--muted-foreground))] px-4 mb-2 uppercase tracking-wider">
              Moderators — {moderators.length}
            </h3>
            {moderators.map(m => (
              <div key={m.profiles.id} className="flex items-center gap-3 px-4 py-2 hover:bg-[hsl(var(--muted)/0.5)] cursor-pointer">
                <div className="w-10 h-10 rounded-[14px] bg-[hsl(var(--muted))] shrink-0 flex items-center justify-center overflow-hidden relative border border-[hsl(var(--border))]">
                  {m.profiles.avatar_url ? (
                    <img src={m.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold">{m.profiles.full_name?.substring(0,2).toUpperCase()}</span>
                  )}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[hsl(var(--background))]"></div>
                </div>
                <div className="flex-1 flex flex-col">
                  <span className={`font-bold text-sm text-blue-500`}>{m.profiles.full_name}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">Online</span>
                </div>
                <MoreVertical className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              </div>
            ))}
          </div>
        )}

        {others.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-[hsl(var(--muted-foreground))] px-4 mb-2 uppercase tracking-wider">
              Online — {others.length}
            </h3>
            {others.map(m => (
              <div key={m.profiles.id} className="flex items-center gap-3 px-4 py-2 hover:bg-[hsl(var(--muted)/0.5)] cursor-pointer">
                <div className="w-10 h-10 rounded-[14px] bg-[hsl(var(--muted))] shrink-0 flex items-center justify-center overflow-hidden relative border border-[hsl(var(--border))]">
                  {m.profiles.avatar_url ? (
                    <img src={m.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold">{m.profiles.full_name?.substring(0,2).toUpperCase()}</span>
                  )}
                  {/* Mock status indicator */}
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[hsl(var(--background))] ${Math.random() > 0.5 ? 'bg-emerald-500' : Math.random() > 0.5 ? 'bg-warning' : 'bg-destructive'}`}></div>
                </div>
                <div className="flex-1 flex flex-col">
                  <span className={`font-bold text-sm ${getRoleColor('member', m.profiles.full_name || 'user')}`}>{m.profiles.full_name}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">Active</span>
                </div>
                <MoreVertical className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // --- Main Layout Return ---
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main Chat Screen (Mockup Screen 2 / Pane 3) */}
      <div className={`flex-1 flex-col min-w-0 bg-[hsl(var(--background))] ${showMembers ? 'hidden xl:flex' : 'flex'}`}>
        
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between shrink-0 border-b border-[hsl(var(--border)/0.5)] z-10 bg-[hsl(var(--background)/0.8)] backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link href={`/communities/${channel.community_id}`} className="md:hidden p-2 -ml-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div className="w-10 h-10 rounded-[14px] bg-primary flex items-center justify-center text-white shrink-0 shadow-sm">
              <Hash className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-bold text-[hsl(var(--foreground))] text-[15px] leading-tight">{channel.name}</h3>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Community</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMembers(true)} className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-full transition-colors">
              <Users className="w-5 h-5" />
            </button>
            <button className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-full transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          
          {/* Welcome Banner */}
          <div className="bg-[hsl(var(--muted)/0.3)] border border-[hsl(var(--border)/0.5)] rounded-2xl p-4 flex items-start gap-3 relative">
            <div className="w-10 h-10 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] flex items-center justify-center shrink-0">
              <Hash className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            </div>
            <div className="flex flex-col">
              <h4 className="font-bold text-[hsl(var(--foreground))] text-sm">Welcome to #{channel.name}!</h4>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">This is the start of the #{channel.name} channel.</p>
            </div>
            <button className="absolute top-4 right-4 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          {messages.map((msg, idx) => {
            const isConsecutive = idx > 0 && 
              messages[idx-1].user_id === msg.user_id && 
              (new Date(msg.created_at).getTime() - new Date(messages[idx-1].created_at).getTime()) < 5 * 60 * 1000

            return (
              <div key={msg.id || idx} className={`flex gap-3 group transition-all duration-200 ${!isConsecutive ? 'mt-6' : 'mt-1'}`}>
                {!isConsecutive ? (
                  <div className="w-10 h-10 rounded-[14px] bg-[hsl(var(--muted))] shrink-0 overflow-hidden flex items-center justify-center border border-[hsl(var(--border))]">
                    {msg.profiles?.avatar_url ? (
                      <img src={msg.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-sm">
                        {msg.profiles?.full_name?.substring(0, 2).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-10 shrink-0 flex justify-center items-center opacity-0 group-hover:opacity-100">
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      {isMounted ? formatTime(msg.created_at) : ''}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                  {!isConsecutive && (
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`font-bold text-[14px] hover:underline cursor-pointer ${getRoleColor(msg.profiles?.role, msg.profiles?.full_name || '')}`}>
                        {msg.profiles?.full_name || 'Unknown'}
                      </span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {isMounted ? formatTime(msg.created_at) : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    {msg.content && <div className="text-[15px] leading-relaxed text-[hsl(var(--foreground))] whitespace-pre-wrap break-words">{msg.content}</div>}
                    
                    {/* Dummy Reactions & Replies for Mockup Matching */}
                    {idx % 3 === 0 && !isConsecutive && (
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <div className="bg-[hsl(var(--muted)/0.8)] hover:bg-[hsl(var(--muted))] cursor-pointer px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-[hsl(var(--border))]">
                          <span className="text-sm">👍</span>
                          <span className="text-xs font-bold text-[hsl(var(--foreground))]">12</span>
                        </div>
                        <div className="bg-[hsl(var(--muted)/0.8)] hover:bg-[hsl(var(--muted))] cursor-pointer px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-[hsl(var(--border))]">
                          <span className="text-sm">🔥</span>
                          <span className="text-xs font-bold text-[hsl(var(--foreground))]">5</span>
                        </div>
                        <div className="bg-[hsl(var(--muted)/0.8)] hover:bg-[hsl(var(--muted))] cursor-pointer px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-[hsl(var(--border))]">
                          <span className="text-sm">💭</span>
                          <span className="text-xs font-bold text-[hsl(var(--foreground))]">2 replies</span>
                        </div>
                      </div>
                    )}
                    
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-col gap-2 mt-1">
                        {msg.attachments.map((url: string, i: number) => {
                          const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i)
                          if (isImage) {
                            return <img key={i} src={url} alt="attachment" className="max-w-[250px] md:max-w-sm rounded-xl border border-[hsl(var(--border))] object-cover cursor-pointer" />
                          }
                          return (
                            <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[hsl(var(--muted)/0.5)] p-3 rounded-xl border border-[hsl(var(--border))] w-max">
                              <Paperclip className="w-4 h-4 text-primary shrink-0" />
                              <span className="text-sm font-medium text-primary hover:underline truncate max-w-[200px]">{url.split('/').pop()}</span>
                            </a>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Input Bar */}
        <div className="px-4 pb-4 pt-2 shrink-0 bg-[hsl(var(--background))] z-10">
          
          {attachments.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2">
              {attachments.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-[hsl(var(--muted))] rounded-xl p-1.5 pr-3">
                  <div className="w-8 h-8 rounded-lg bg-[hsl(var(--background))] flex items-center justify-center shrink-0">
                    <Paperclip className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium truncate max-w-[100px]">{file.name}</span>
                  <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-[hsl(var(--muted-foreground))] hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border)/0.5)] rounded-full flex items-center px-1.5 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--background))] hover:text-[hsl(var(--foreground))] transition-colors shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message #${channel.name}`}
              className="flex-1 bg-transparent border-none text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none px-3 text-[15px]"
            />
            
            <div className="flex items-center gap-1 shrink-0">
              <button 
                type="button" 
                onClick={() => setShowEmojis(!showEmojis)}
                className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
              
              <button 
                type="submit" 
                disabled={(!input.trim() && attachments.length === 0) || isSending || isUploading}
                className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4 translate-x-[1px]" />
              </button>
            </div>
          </form>

          {/* Emoji Popover */}
          {showEmojis && (
            <div className="absolute bottom-[72px] right-4 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl p-3 shadow-xl grid grid-cols-5 gap-2 animate-in fade-in slide-in-from-bottom-2 z-20">
              {emojis.map(e => (
                <button key={e} type="button" onClick={() => setInput(prev => prev + e)} className="w-10 h-10 text-xl hover:bg-[hsl(var(--muted))] rounded-xl flex items-center justify-center transition-colors">
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Pane 4: Members View (Visible only if showMembers is true) */}
      {membersPane}
    </div>
  )
}
