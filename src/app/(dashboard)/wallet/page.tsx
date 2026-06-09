'use client'

import { useState, useEffect } from 'react'
import { getWalletTransactions } from '@/actions/gamification'
import { fetchActiveRewards, redeemReward, createReward, deleteReward, fetchAdminRedemptions, updateRedemptionStatus } from '@/actions/wallet'
import { Coins, ArrowUpRight, ArrowDownRight, History, Store, CreditCard, Shield, Gift, Loader2, Plus, Trash2, Check, X, Image as ImageIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function WalletPage() {
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRole() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        setRole(profile?.role || 'student')
      }
      setLoading(false)
    }
    loadRole()
  }, [])

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>

  if (role === 'admin') return <AdminWalletView />
  if (role === 'faculty') return <FacultyWalletView />
  return <StudentWalletView />
}

function FacultyWalletView() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass rounded-3xl p-10 text-center">
        <Shield className="w-16 h-16 text-[hsl(var(--muted-foreground))] mx-auto mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Wallet Access Restricted</h2>
        <p className="text-[hsl(var(--muted-foreground))]">The gamification system and Campus Wallet are reserved for students.</p>
      </div>
    </div>
  )
}

function AdminWalletView() {
  const [activeTab, setActiveTab] = useState<'rewards' | 'redemptions'>('rewards')
  
  // Store state
  const [rewards, setRewards] = useState<any[]>([])
  const [creating, setCreating] = useState(false)
  const [fetchingStore, setFetchingStore] = useState(true)

  // Redemptions state
  const [redemptions, setRedemptions] = useState<any[]>([])
  const [fetchingRedemptions, setFetchingRedemptions] = useState(true)

  async function loadData() {
    setFetchingStore(true)
    setFetchingRedemptions(true)
    const [rewRes, redRes] = await Promise.all([
      fetchActiveRewards(),
      fetchAdminRedemptions()
    ])
    if (rewRes.rewards) setRewards(rewRes.rewards)
    if (redRes.redemptions) setRedemptions(redRes.redemptions)
    setFetchingStore(false)
    setFetchingRedemptions(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleCreateReward(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCreating(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    const res = await createReward(formData)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Reward added to store!')
      form.reset()
      loadData()
    }
    setCreating(false)
  }

  async function handleDeleteReward(id: string) {
    if (!confirm('Remove this reward from the store?')) return
    const res = await deleteReward(id)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Reward removed')
      loadData()
    }
  }

  async function handleUpdateRedemption(id: string, status: 'fulfilled' | 'rejected') {
    if (status === 'rejected' && !confirm('Reject this redemption and refund the user?')) return
    const res = await updateRedemptionStatus(id, status)
    if (res.error) toast.error(res.error)
    else {
      toast.success(status === 'fulfilled' ? 'Marked as fulfilled!' : 'Redemption rejected & refunded')
      loadData()
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-400" />
            Admin Store Management
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">Manage rewards and fulfill student redemptions.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-[hsl(var(--border))] pb-0 animate-fade-in">
        <button onClick={() => setActiveTab('rewards')} className={cn("pb-3 text-sm font-bold transition-colors", activeTab === 'rewards' ? "text-emerald-500 border-b-2 border-emerald-500" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]")}>
          Manage Store
        </button>
        <button onClick={() => setActiveTab('redemptions')} className={cn("pb-3 text-sm font-bold transition-colors", activeTab === 'redemptions' ? "text-emerald-500 border-b-2 border-emerald-500" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]")}>
          Redemptions
        </button>
      </div>

      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {/* Add Reward Form */}
          <div className="md:col-span-1">
            <div className="glass rounded-3xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-emerald-500" /> Add New Reward</h3>
              <form onSubmit={handleCreateReward} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1 block">Title</label>
                  <input required name="title" className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors" placeholder="e.g. Campus Hoodie" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1 block">Description</label>
                  <textarea required name="description" className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none h-20" placeholder="Details about the item..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1 block">Cost (CC)</label>
                    <input required type="number" min="1" name="cost" className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors" placeholder="500" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1 block">Stock Limit</label>
                    <input type="number" min="1" name="stock" className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors" placeholder="Leave blank for inf." />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1 block">Image</label>
                  <input type="file" name="image" accept="image/*" className="w-full text-xs text-[hsl(var(--muted-foreground))] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                </div>
                <button disabled={creating} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-bold transition-colors flex items-center justify-center gap-2 mt-2">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Store'}
                </button>
              </form>
            </div>
          </div>
          
          {/* Active Store List */}
          <div className="md:col-span-2">
            <div className="glass rounded-3xl p-6 h-full">
              <h3 className="font-bold mb-4">Active Store Items</h3>
              {fetchingStore ? (
                <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
              ) : rewards.length === 0 ? (
                <div className="text-center p-10 text-[hsl(var(--muted-foreground))]">No rewards in store.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rewards.map(r => (
                    <div key={r.id} className="bg-[hsl(var(--muted)/0.5)] rounded-2xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="w-full h-32 bg-[hsl(var(--muted))] rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                          {r.image_url ? <img src={r.image_url} alt="" className="w-full h-full object-cover" /> : <Gift className="w-8 h-8 opacity-20" />}
                        </div>
                        <h4 className="font-bold">{r.title}</h4>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 mt-1">{r.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-emerald-500 font-bold flex items-center gap-1 text-sm"><Coins className="w-3 h-3" /> {r.cost}</div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">{r.stock === -1 ? '∞' : `${r.stock} left`}</span>
                          <button onClick={() => handleDeleteReward(r.id)} className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'redemptions' && (
        <div className="glass rounded-3xl p-6 animate-fade-in">
           {fetchingRedemptions ? (
              <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
            ) : redemptions.length === 0 ? (
              <div className="text-center p-10 text-[hsl(var(--muted-foreground))]">No redemptions yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                    <tr>
                      <th className="font-semibold pb-3">Student</th>
                      <th className="font-semibold pb-3">Reward</th>
                      <th className="font-semibold pb-3">Cost</th>
                      <th className="font-semibold pb-3">Date</th>
                      <th className="font-semibold pb-3 text-right">Status / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--border))]">
                    {redemptions.map(r => (
                      <tr key={r.id} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <img src={r.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${r.profiles?.full_name}`} className="w-8 h-8 rounded-full" />
                            <div>
                              <p className="font-medium">{r.profiles?.full_name}</p>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">{r.profiles?.roll_no}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-medium">{r.rewards?.title || 'Unknown Reward'}</td>
                        <td className="py-3 text-emerald-500 font-bold">{r.cost_at_redemption} CC</td>
                        <td className="py-3 text-[hsl(var(--muted-foreground))]">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</td>
                        <td className="py-3 text-right">
                          {r.status === 'pending' ? (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleUpdateRedemption(r.id, 'fulfilled')} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors">Fulfill</button>
                              <button onClick={() => handleUpdateRedemption(r.id, 'rejected')} className="px-3 py-1.5 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-xs font-bold rounded-lg hover:bg-rose-500 hover:text-white transition-colors">Reject</button>
                            </div>
                          ) : (
                            <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold", r.status === 'fulfilled' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                              {r.status.toUpperCase()}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}
    </div>
  )
}

function StudentWalletView() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [rewards, setRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'wallet' | 'store'>('wallet')
  const [redeemingId, setRedeemingId] = useState<string | null>(null)

  async function loadData() {
    const [walletData, storeData] = await Promise.all([
      getWalletTransactions(),
      fetchActiveRewards()
    ])
    if (!walletData.error) {
      setBalance(walletData.balance || 0)
      setTransactions(walletData.transactions || [])
    }
    if (!storeData.error) {
      setRewards(storeData.rewards || [])
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleRedeem(rewardId: string, cost: number) {
    if (balance < cost) {
      toast.error('Not enough Campus Coins!')
      return
    }
    if (!confirm('Are you sure you want to redeem this reward?')) return
    setRedeemingId(rewardId)
    const res = await redeemReward(rewardId)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Reward redeemed! Check with administration for fulfillment.')
      await loadData()
    }
    setRedeemingId(null)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            Campus Wallet
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">Manage your Campus Coins and rewards</p>
        </div>
        
        <div className="flex bg-[hsl(var(--muted))] rounded-xl p-1 shrink-0">
          <button onClick={() => setActiveTab('wallet')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'wallet' ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]")}>Wallet</button>
          <button onClick={() => setActiveTab('store')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2", activeTab === 'store' ? "bg-emerald-500 text-white shadow-sm" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]")}><Store className="w-4 h-4" /> Campus Store</button>
        </div>
      </div>

      {activeTab === 'wallet' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {/* Balance Card */}
          <div className="md:col-span-1">
            <div className="glass rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
              
              <p className="text-sm font-medium text-emerald-500 flex items-center gap-2 mb-2">
                <Coins className="w-4 h-4" />
                Available Balance
              </p>
              
              {loading ? (
                <div className="w-32 h-10 bg-[hsl(var(--muted))] animate-pulse rounded-lg mt-2"></div>
              ) : (
                <h2 className="text-5xl font-black tracking-tight text-[hsl(var(--foreground))]">
                  {balance}
                  <span className="text-xl font-bold text-[hsl(var(--muted-foreground))] ml-2">CC</span>
                </h2>
              )}

              <div className="mt-8 flex gap-2">
                <button onClick={() => setActiveTab('store')} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Store className="w-4 h-4" />
                  Spend Coins
                </button>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="md:col-span-2">
            <div className="glass rounded-3xl p-6 h-full">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-blue-400" />
                Transaction History
              </h3>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[hsl(var(--muted))]"></div>
                        <div className="space-y-2">
                          <div className="w-32 h-4 bg-[hsl(var(--muted))] rounded"></div>
                          <div className="w-20 h-3 bg-[hsl(var(--muted))] rounded"></div>
                        </div>
                      </div>
                      <div className="w-16 h-6 bg-[hsl(var(--muted))] rounded"></div>
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-10">
                  <Coins className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-3 opacity-50" />
                  <p className="text-[hsl(var(--muted-foreground))]">No transactions yet.</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Attend events to earn Campus Coins!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                  {transactions.map(tx => {
                    const isEarn = tx.amount > 0
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isEarn ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {isEarn ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[hsl(var(--foreground))]">{tx.reason}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                              {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className={`text-sm font-bold ${isEarn ? 'text-emerald-500' : 'text-[hsl(var(--foreground))]'}`}>
                          {isEarn ? '+' : ''}{tx.amount} CC
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'store' && (
        <div className="animate-fade-in">
          {loading ? (
             <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
          ) : rewards.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center">
              <Store className="w-16 h-16 text-[hsl(var(--muted-foreground))] mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-bold mb-2">Store is Empty</h2>
              <p className="text-[hsl(var(--muted-foreground))]">Check back later for new rewards!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map(r => (
                <div key={r.id} className="glass rounded-3xl p-5 flex flex-col justify-between group hover:border-[hsl(var(--ring)/0.5)] transition-all relative overflow-hidden">
                  <div>
                    <div className="w-full aspect-video bg-[hsl(var(--muted))] rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                      {r.image_url ? <img src={r.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <Gift className="w-10 h-10 opacity-20" />}
                    </div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg leading-tight">{r.title}</h3>
                      <span className="shrink-0 bg-emerald-500/10 text-emerald-500 font-bold px-2 py-1 rounded-lg text-sm flex items-center gap-1"><Coins className="w-3 h-3" /> {r.cost}</span>
                    </div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">{r.description}</p>
                  </div>
                  
                  <button 
                    disabled={balance < r.cost || r.stock === 0 || redeemingId === r.id}
                    onClick={() => handleRedeem(r.id, r.cost)}
                    className={cn(
                      "w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                      redeemingId === r.id ? "bg-emerald-500/50 text-white cursor-not-allowed" :
                      balance < r.cost ? "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed" : 
                      r.stock === 0 ? "bg-rose-500/10 text-rose-500 cursor-not-allowed" :
                      "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    )}
                  >
                    {redeemingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : r.stock === 0 ? 'Out of Stock' : balance < r.cost ? 'Insufficient Coins' : 'Redeem Now'}
                  </button>
                  
                  {r.stock > 0 && (
                    <div className="absolute top-8 right-8 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/10">
                      {r.stock} left
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
