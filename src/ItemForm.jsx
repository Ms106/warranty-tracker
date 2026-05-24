import { useState, useEffect } from "react"
import { supabase } from "./supabaseClient"

const CATEGORIES = ["Appliance", "Electronics", "Furniture", "Tool", "Vehicle", "Other"]

function calcExpiry(purchaseDate, warrantyYears) {
  if (!purchaseDate || !warrantyYears) return ""
  const d = new Date(purchaseDate)
  d.setFullYear(d.getFullYear() + Number(warrantyYears))
  return d.toISOString().split("T")[0]
}

const EMPTY = {
  name: "",
  category: "Electronics",
  purchase_date: "",
  purchase_price: "",
  store: "",
  warranty_years: "",
  warranty_expiry: "",
  serial_number: "",
  model_number: "",
  notes: "",
}

export default function ItemForm({ householdId, item, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY)
  const [expiryManual, setExpiryManual] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || "",
        category: item.category || "Electronics",
        purchase_date: item.purchase_date || "",
        purchase_price: item.purchase_price ?? "",
        store: item.store || "",
        warranty_years: item.warranty_years ?? "",
        warranty_expiry: item.warranty_expiry || "",
        serial_number: item.serial_number || "",
        model_number: item.model_number || "",
        notes: item.notes || "",
      })
      setExpiryManual(false)
    } else {
      setForm(EMPTY)
      setExpiryManual(false)
    }
  }, [item])

  function set(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // Auto-calculate expiry when purchase_date or warranty_years changes
      if (!expiryManual && (field === "purchase_date" || field === "warranty_years")) {
        const pd = field === "purchase_date" ? value : prev.purchase_date
        const wy = field === "warranty_years" ? value : prev.warranty_years
        next.warranty_expiry = calcExpiry(pd, wy)
      }
      return next
    })
  }

  function handleExpiryChange(value) {
    setExpiryManual(true)
    setForm(prev => ({ ...prev, warranty_expiry: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const payload = {
      household_id: householdId,
      name: form.name.trim(),
      category: form.category,
      purchase_date: form.purchase_date || null,
      purchase_price: form.purchase_price !== "" ? Number(form.purchase_price) : null,
      store: form.store.trim() || null,
      warranty_years: form.warranty_years !== "" ? Number(form.warranty_years) : null,
      warranty_expiry: form.warranty_expiry || null,
      serial_number: form.serial_number.trim() || null,
      model_number: form.model_number.trim() || null,
      notes: form.notes.trim() || null,
      active: true,
    }

    let result
    if (item) {
      result = await supabase.from("items").update(payload).eq("id", item.id).select().single()
    } else {
      result = await supabase.from("items").insert(payload).select().single()
    }

    if (result.error) {
      setError(result.error.message)
    } else {
      onSaved(result.data)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => set("name", e.target.value)}
          required
          placeholder="e.g. Samsung Refrigerator"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={form.category}
          onChange={e => set("category", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
          <input
            type="date"
            value={form.purchase_date}
            onChange={e => set("purchase_date", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
          <input
            type="number"
            value={form.purchase_price}
            onChange={e => set("purchase_price", e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
        <input
          type="text"
          value={form.store}
          onChange={e => set("store", e.target.value)}
          placeholder="e.g. Home Depot"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Warranty (years)</label>
          <input
            type="number"
            value={form.warranty_years}
            onChange={e => set("warranty_years", e.target.value)}
            min="0"
            step="0.5"
            placeholder="e.g. 2"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Warranty Expiry
            {!expiryManual && form.purchase_date && form.warranty_years && (
              <span className="text-xs text-amber-600 ml-1">(auto)</span>
            )}
          </label>
          <input
            type="date"
            value={form.warranty_expiry}
            onChange={e => handleExpiryChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
          <input
            type="text"
            value={form.serial_number}
            onChange={e => set("serial_number", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Model Number</label>
          <input
            type="text"
            value={form.model_number}
            onChange={e => set("model_number", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          rows={3}
          placeholder="Any additional details..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-amber-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-amber-800 disabled:opacity-50"
        >
          {loading ? "Saving..." : item ? "Save changes" : "Add item"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
