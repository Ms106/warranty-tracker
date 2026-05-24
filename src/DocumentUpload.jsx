import { useEffect, useRef, useState } from "react"
import { supabase } from "./supabaseClient"

const DOC_TYPE_LABELS = {
  receipt: "Receipt",
  warranty: "Warranty",
  manual: "Manual",
  service_record: "Service Record",
  photo: "Photo",
}

function DocItem({ doc, householdId }) {
  const [url, setUrl] = useState(null)
  const isImage = /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(doc.file_name)

  useEffect(() => {
    supabase.storage
      .from("documents")
      .createSignedUrl(doc.storage_path, 3600)
      .then(({ data }) => { if (data) setUrl(data.signedUrl) })
  }, [doc.storage_path])

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {isImage && url && (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img
            src={url}
            alt={doc.file_name}
            className="w-full h-32 object-cover bg-gray-100"
          />
        </a>
      )}
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-700 truncate">{doc.file_name}</p>
          <p className="text-xs text-gray-400">{DOC_TYPE_LABELS[doc.document_type] || doc.document_type}</p>
        </div>
        {url && !isImage && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-700 font-medium hover:underline flex-shrink-0"
          >
            Open
          </a>
        )}
        {url && isImage && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-700 font-medium hover:underline flex-shrink-0"
          >
            View
          </a>
        )}
      </div>
    </div>
  )
}

export default function DocumentUpload({ itemId, householdId }) {
  const [docs, setDocs] = useState([])
  const [docType, setDocType] = useState("receipt")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef()

  useEffect(() => {
    loadDocs()
  }, [itemId])

  async function loadDocs() {
    const { data } = await supabase
      .from("item_documents")
      .select("*")
      .eq("item_id", itemId)
      .order("uploaded_at", { ascending: false })
    setDocs(data || [])
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const path = `${householdId}/${itemId}/${Date.now()}_${safeName}`

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, file, { upsert: false })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { error: dbError } = await supabase.from("item_documents").insert({
      item_id: itemId,
      document_type: docType,
      storage_path: path,
      file_name: file.name,
    })

    if (dbError) {
      setError(dbError.message)
    } else {
      await loadDocs()
    }

    fileRef.current.value = ""
    setUploading(false)
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Documents</p>

      {docs.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {docs.map(doc => (
            <DocItem key={doc.id} doc={doc} householdId={householdId} />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <select
          value={docType}
          onChange={e => setDocType(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <label className={`flex-1 flex items-center justify-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg py-1.5 px-3 text-xs font-medium cursor-pointer hover:bg-amber-100 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {uploading ? "Uploading..." : "Upload"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <p className="text-xs text-red-600 mt-2">{error}</p>
      )}
    </div>
  )
}
