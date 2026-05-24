import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"
import DocumentUpload from "./DocumentUpload"

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
  if (days < 0) return <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">Expired</span>
  if (days <= 90) return <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Expires in {days}d</span>
  return <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Active</span>
}

function ItemRow({ item, householdId, onEdit, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false)
  const days = daysBetween(item.warranty_expiry)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900">{item.name}</span>
            <WarrantyBadge days={days} />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{item.category}{item.store ? ` · ${item.store}` : ""}</p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 ml-2 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm">
            {item.purchase_date && (
              <>
                <span className="text-gray-500">Purchased</span>
                <span className="text-gray-900">{new Date(item.purchase_date).toLocaleDateString()}</span>
              </>
            )}
            {item.purchase_price != null && (
              <>
                <span className="text-gray-500">Price</span>
                <span className="text-gray-900">${Number(item.purchase_price).toFixed(2)}</span>
              </>
            )}
            {item.store && (
              <>
                <span className="text-gray-500">Store</span>
                <span className="text-gray-900">{item.store}</span>
              </>
            )}
            {item.warranty_years != null && (
              <>
                <span className="text-gray-500">Warranty</span>
                <span className="text-gray-900">{item.warranty_years} {item.warranty_years === 1 ? "year" : "years"}</span>
              </>
            )}
            {item.warranty_expiry && (
              <>
                <span className="text-gray-500">Expires</span>
                <span className="text-gray-900">{new Date(item.warranty_expiry).toLocaleDateString()}</span>
              </>
            )}
            {item.serial_number && (
              <>
                <span className="text-gray-500">Serial #</span>
                <span className="text-gray-900 font-mono text-xs">{item.serial_number}</span>
              </>
            )}
            {item.model_number && (
              <>
                <span className="text-gray-500">Model #</span>
                <span className="text-gray-900 font-mono text-xs">{item.model_number}</span>
              </>
            )}
          </div>
          {item.notes && (
            <p className="text-sm text-gray-600 mt-3 bg-gray-50 rounded-lg px-3 py-2">{item.notes}</p>
          )}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => onEdit(item)}
              className="text-sm text-amber-700 font-medium hover:text-amber-900"
            >
              Edit item
            </button>
          </div>
          <div className="mt-4">
            <DocumentUpload itemId={item.id} householdId={householdId} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function ItemsList({ householdId, onEdit, selectedItem, clearSelected }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("household_id", householdId)
        .eq("active", true)
        .order("name")
      setItems(data || [])
      setLoading(false)
    }
    load()
  }, [householdId])

  // When a new item is selected from dashboard, reload to make sure it's in list
  useEffect(() => {
    if (selectedItem) {
      supabase
        .from("items")
        .select("*")
        .eq("household_id", householdId)
        .eq("active", true)
        .order("name")
        .then(({ data }) => setItems(data || []))
    }
  }, [selectedItem, householdId])

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <p className="text-gray-400 text-sm text-center py-12">Loading...</p>

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Search items..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
      />

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">
          {search ? "No items match your search." : "No items yet. Add your first item!"}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              householdId={householdId}
              onEdit={onEdit}
              defaultOpen={selectedItem?.id === item.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
