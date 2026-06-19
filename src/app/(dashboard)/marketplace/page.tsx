'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingBag, Search, Plus, Tag, Star, MapPin,
  MessageCircle, Package, X, Filter
} from 'lucide-react'
import { getMarketplaceListings, createMarketplaceListing, getMyListings, updateListing } from '@/actions/marketplace'
import { MARKETPLACE_CATEGORIES, ITEM_CONDITIONS } from '@/lib/constants'
import { DashboardContainer } from '@/components/ui/dashboard-container'
import { Modal } from '@/components/ui/modal'

export default function MarketplacePage() {
  const [listings, setListings] = useState<any[]>([])
  const [myListings, setMyListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'browse' | 'my-listings'>('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [allListings, mine] = await Promise.all([
        getMarketplaceListings(),
        getMyListings(),
      ])
      setListings(allListings)
      setMyListings(mine)
    } catch (e) {
      console.error('Failed to load marketplace:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch() {
    try {
      const data = await getMarketplaceListings({
        search: searchQuery || undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
      })
      setListings(data)
    } catch (e) {
      console.error('Search failed:', e)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(handleSearch, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery, filterCategory])

  async function handleMarkSold(listingId: string) {
    try {
      await updateListing(listingId, { is_sold: true })
      setMyListings(prev => prev.map(l => l.id === listingId ? { ...l, is_sold: true } : l))
    } catch (e) {
      console.error('Failed to update:', e)
    }
  }

  const conditionColors: Record<string, string> = {
    new: 'bg-emerald-500/10 text-emerald-600',
    like_new: 'bg-blue-500/10 text-blue-600',
    good: 'bg-amber-500/10 text-amber-600',
    fair: 'bg-orange-500/10 text-orange-600',
    poor: 'bg-red-500/10 text-red-600',
  }

  return (
    <DashboardContainer title="Campus Marketplace" description="Buy and sell within your campus community">
      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'browse' ? 'bg-blue-500/10 text-blue-600' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}>
            Browse
          </button>
          <button onClick={() => setActiveTab('my-listings')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'my-listings' ? 'bg-blue-500/10 text-blue-600' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}>
            My Listings ({myListings.length})
          </button>
        </div>
        <div className="flex-1" />
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 shrink-0">
          <Plus className="w-4 h-4" />Sell Item
        </button>
      </div>

      {activeTab === 'browse' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              <button onClick={() => setFilterCategory('all')}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${filterCategory === 'all' ? 'bg-blue-500/10 text-blue-600' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}>
                All
              </button>
              {MARKETPLACE_CATEGORIES.map(cat => (
                <button key={cat.value} onClick={() => setFilterCategory(cat.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${filterCategory === cat.value ? 'bg-blue-500/10 text-blue-600' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-[hsl(var(--muted))] animate-pulse" />
              ))
            ) : listings.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <ShoppingBag className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No items found</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Be the first to list something!</p>
              </div>
            ) : (
              listings.map((item, i) => {
                const category = MARKETPLACE_CATEGORIES.find(c => c.value === item.category)
                return (
                  <motion.div
                    key={item.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden card-hover"
                  >
                    <div className="aspect-[4/3] bg-[hsl(var(--muted))] relative">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
                        </div>
                      )}
                      <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-medium ${conditionColors[item.condition] || ''}`}>
                        {item.condition?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-sm text-[hsl(var(--foreground))] line-clamp-1">{item.title}</h3>
                      </div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 line-clamp-1">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-[hsl(var(--foreground))]">₹{item.price}</span>
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{category?.icon} {category?.label}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[hsl(var(--border)/0.5)]">
                        <div className="w-5 h-5 rounded-full bg-[hsl(var(--muted))] overflow-hidden shrink-0">
                          {item.profiles?.avatar_url && <img src={item.profiles.avatar_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-xs text-[hsl(var(--muted-foreground))] truncate">{item.profiles?.full_name}</span>
                        <button className="ml-auto p-1 rounded-lg hover:bg-blue-500/10 text-[hsl(var(--muted-foreground))] hover:text-blue-500 transition-colors">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </>
      )}

      {activeTab === 'my-listings' && (
        <div className="space-y-3">
          {myListings.length === 0 ? (
            <div className="text-center py-16">
              <Tag className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No listings yet</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Start selling items to your campus community</p>
            </div>
          ) : (
            myListings.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
              >
                <div className="w-16 h-16 rounded-xl bg-[hsl(var(--muted))] overflow-hidden shrink-0">
                  {item.images?.[0] ? (
                    <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{item.title}</h4>
                  <p className="text-sm font-bold text-[hsl(var(--foreground))]">₹{item.price}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.views_count || 0} views</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.is_sold ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-medium">Sold</span>
                  ) : (
                    <button onClick={() => handleMarkSold(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors">
                      Mark Sold
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Create Listing Modal */}
      <CreateListingModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={loadData} />
    </DashboardContainer>
  )
}

function CreateListingModal({ isOpen, onClose, onCreated }: {
  isOpen: boolean; onClose: () => void; onCreated: () => void
}) {
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', category: 'other', condition: 'good',
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title || !formData.price) return

    setSubmitting(true)
    try {
      await createMarketplaceListing({
        ...formData,
        price: parseFloat(formData.price),
      })
      onCreated()
      onClose()
      setFormData({ title: '', description: '', price: '', category: 'other', condition: 'good' })
    } catch (e) {
      console.error('Failed to create:', e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sell an Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Title *</label>
          <input type="text" required value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Engineering Mathematics Textbook"
            className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Description *</label>
          <textarea required value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your item..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Price (₹) *</label>
            <input type="number" required min="0" step="1" value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Category</label>
            <select value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm">
              {MARKETPLACE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Condition</label>
            <select value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm">
              {ITEM_CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-[hsl(var(--muted-foreground))]">Cancel</button>
          <button type="submit" disabled={submitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium disabled:opacity-50">
            {submitting ? 'Listing...' : 'List Item'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
