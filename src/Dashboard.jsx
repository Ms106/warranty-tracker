import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"

function daysBetween(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exp = new Date(dateStr)
  exp.setHours(0, 0, 0, 0)
  return Math.floor((exp - today) / (1000 * 60 * 60 * 24))
}

function WarrantyBadge({ days }) {
  if (days === null) return <span className="text-xs text-gray-400">No warranty</span>
  if (days < 0) return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">Expired</span>
  if (days <= 90) return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Expires in {days}d</span>
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Active</span>
}

function ItemCard({ item, onClick }) {
  const days = daysBetween(item.warranty_expiry)
  return (
    <button
      onClick={() => onClick(item)}
      className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-amber-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{item.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>
          {item.purchase_date && (
            <p className="text-xs text-gray-400 mt-0.5">
              Purchased {new Date(item.purchase_date).toLocaleDateString()}
            </p>
          )}
          {item.warranty_expiry && (
            <p className="text-xs text-gray-400">
              Expires {new Date(item.warranty_expiry).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 mt-0.5">
          <WarrantyBadge days={days} />
        </div>
      </div>
    </button>
  )
}

function Section({ title, items, color, onClick }) {
  if (items.length === 0) return null
  return (
    <div>
      <h2 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${color}`}>
        {title} <span className="font-normal normal-case text-gray-400">({items.length})</span>
      </h2>
      <div className="space-y-2">
        {items.map(item => (
          <ItemCard key={item.id} item={item} onClick={onClick} />
        ))}
      </div>
    </div>
  )
}

export default function Dashboard({ householdId, onSelectItem }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("items")
        .select("id, name, category, purchase_date, warranty_expiry")
        .eq("household_id", householdId)
        .eq("active", true)
        .order("warranty_expiry", { ascending: true, nullsFirst: false })
      setItems(data || [])
      setLoading(false)
    }
    load()
  }, [householdId])

  if (loading) return <p className="text-gray-400 text-sm text-center py-12">Loading...</p>
  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">📦</p>
        <p className="text-gray-500 text-sm">No items yet. Add your first item!</p>
      </div>
    )
  }

  const expiringSoon = items.filter(i => {
    const d = daysBetween(i.warranty_expiry)
    return d !== null && d >= 0 && d <= 90
  })
  const expired = items.filter(i => {
    const d = daysBetween(i.warranty_expiry)
    return d !== null && d < 0
  })
  const active = items.filter(i => {
    const d = daysBetween(i.warranty_expiry)
    return d === null || d > 90
  })

  return (
    <div className="space-y-8">
      <Section title="Expiring Soon" items={expiringSoon} color="text-amber-700" onClick={onSelectItem} />
      <Section title="Expired" items={expired} color="text-red-600" onClick={onSelectItem} />
      <Section title="Active" items={active} color="text-green-700" onClick={onSelectItem} />
    </div>
  )
}
