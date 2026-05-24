import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"
import Auth from "./Auth"
import Dashboard from "./Dashboard"
import ItemsList from "./ItemsList"
import ItemForm from "./ItemForm"

async function getOrCreateHousehold(userId) {
  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .single()

  if (membership) return membership.household_id

  const { data: household } = await supabase
    .from("households")
    .insert({ name: "My Household" })
    .select()
    .single()

  await supabase
    .from("household_members")
    .insert({ household_id: household.id, user_id: userId })

  return household.id
}

const NAV_ITEMS = ["Dashboard", "Items"]

function App() {
  const [session, setSession] = useState(null)
  const [householdId, setHouseholdId] = useState(null)
  const [currentPage, setCurrentPage] = useState("Dashboard")
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) getOrCreateHousehold(session.user.id).then(setHouseholdId)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        getOrCreateHousehold(session.user.id).then(setHouseholdId)
      } else {
        setHouseholdId(null)
      }
    })
  }, [])

  function openAdd() {
    setEditItem(null)
    setShowForm(true)
  }

  function openEdit(item) {
    setEditItem(item)
    setShowForm(true)
  }

  function handleSaved() {
    setShowForm(false)
    setEditItem(null)
    setRefreshKey(k => k + 1)
  }

  function handleSelectFromDashboard(item) {
    setSelectedItem(item)
    setCurrentPage("Items")
  }

  if (!session) return <Auth />
  if (!householdId) return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Setting up your household...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-amber-700 text-white px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-lg">Warranty Tracker</h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-amber-200 text-sm hover:text-white"
        >
          Sign out
        </button>
      </header>

      <nav className="bg-white border-b border-gray-200 px-4 flex items-center justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item}
              onClick={() => { setCurrentPage(item); setSelectedItem(null) }}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                currentPage === item
                  ? "border-amber-700 text-amber-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <button
          onClick={openAdd}
          className="text-sm font-medium text-amber-700 hover:text-amber-900 py-3 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {showForm ? (
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              {editItem ? "Edit Item" : "Add Item"}
            </h2>
            <ItemForm
              householdId={householdId}
              item={editItem}
              onSaved={handleSaved}
              onCancel={() => { setShowForm(false); setEditItem(null) }}
            />
          </div>
        ) : (
          <>
            {currentPage === "Dashboard" && (
              <Dashboard
                key={refreshKey}
                householdId={householdId}
                onSelectItem={handleSelectFromDashboard}
              />
            )}
            {currentPage === "Items" && (
              <ItemsList
                key={refreshKey}
                householdId={householdId}
                onEdit={openEdit}
                selectedItem={selectedItem}
                clearSelected={() => setSelectedItem(null)}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
