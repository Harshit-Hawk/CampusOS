'use client'

import { useState, useEffect } from 'react'
import { getWalletTransactions } from '@/actions/gamification'
import { Coins, ArrowUpRight, ArrowDownRight, History, Store, CreditCard } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function WalletPage() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getWalletTransactions()
      if (!data.error) {
        setBalance(data.balance || 0)
        setTransactions(data.transactions || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-emerald-400" />
          Campus Wallet
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">Manage your Campus Coins and rewards</p>
      </div>

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
              <button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Store className="w-4 h-4" />
                Redeem
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
    </div>
  )
}
