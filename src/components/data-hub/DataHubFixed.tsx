"use client"

import { useCallback, useMemo, useRef, useState, useTransition } from "react"
import { AlertCircle, Check, CheckCircle2, ChevronRight, FileSpreadsheet, Loader2, Upload, X, Trash2, LayoutGrid, Plus, Database } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { deleteDataset } from "@/app/data-hub/actions"
import { useRouter } from "next/navigation"

type Business = { id: string; name: string; currencyCode: string }
type Dataset = { id: string; name: string; file_name: string | null; row_count: number | null; column_count: number | null; status: string; created_at: string; schema_definition?: any }
type DatasetKind = "sales" | "products" | "inventory" | "suppliers" | "customers" | "finance" | "other"
type ParsedSheet = { name: string; headers: string[]; rows: Record<string, unknown>[]; rowCount: number; columnCount: number; kind: DatasetKind; included: boolean }

const kinds: { value: DatasetKind; label: string; description: string }[] = [
  { value: "sales", label: "Sales / orders", description: "Orders, revenue and transactions" },
  { value: "products", label: "Products", description: "Catalogue, SKUs, pricing and categories" },
  { value: "inventory", label: "Inventory", description: "Stock, warehouses and reorder levels" },
  { value: "suppliers", label: "Suppliers", description: "Supplier and vendor records" },
  { value: "customers", label: "Customers", description: "Customer or account records" },
  { value: "finance", label: "Finance", description: "Invoices, expenses and financial records" },
  { value: "other", label: "Other", description: "A dataset that does not fit these areas" },
]

const isFilled = (value: unknown) => value !== null && value !== undefined && String(value).trim() !== ""

function normaliseHeader(value: unknown, index: number) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ")
  return text || `Column ${index + 1}`
}

function suggestKind(sheetName: string, headers: string[]): DatasetKind {
  const text = `${sheetName} ${headers.join(" ")}`.toLowerCase().replace(/[_-]+/g, " ")
  if (/\b(order|orders|sales|transaction|transactions)\b/.test(text)) return "sales"
  if (/\b(inventory|stock|warehouse)\b/.test(text)) return "inventory"
  if (/\b(supplier|suppliers|vendor|vendors)\b/.test(text)) return "suppliers"
  if (/\b(customer|customers|client|clients|account|accounts)\b/.test(text)) return "customers"
  if (/\b(product|products|catalogue|catalog|sku)\b/.test(text)) return "products"
  if (/\b(finance|financial|expense|invoice|invoices|payment|payments|profit)\b/.test(text)) return "finance"
  return "other"
}

function shouldIncludeByDefault(sheetName: string) {
  return !/^(readme|read me|instructions|notes?)$/i.test(sheetName.trim())
}

function excelValue(value: unknown, header: string, XLSX: typeof import("xlsx")) {
  if (typeof value !== "number") return value ?? null
  const h = header.toLowerCase().replace(/[_-]+/g, " ")
  if (/\b(date|order date|invoice date|transaction date|created at|updated at)\b/.test(h)) {
    const decoded = XLSX.SSF.parse_date_code(value)
    if (decoded?.y && decoded?.m && decoded?.d) return `${decoded.y}-${String(decoded.m).padStart(2, "0")}-${String(decoded.d).padStart(2, "0")}`
  }
  return value
}

export default function DataHub({ business, datasets }: { business: Business; datasets: Dataset[] }) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"library" | "import">("library")
  
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [fileName, setFileName] = useState("")
  const [fileSize, setFileSize] = useState(0)
  const [sheets, setSheets] = useState<ParsedSheet[]>([])
  const [selected, setSelected] = useState(0)
  
  const [isPending, startTransition] = useTransition()

  const inputRef = useRef<HTMLInputElement>(null)

  const parseFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setError("This file is larger than 20 MB. Please upload a smaller file.")
      return
    }
    setBusy(true); setError(null); setSuccess(null)
    try {
      const XLSX = await import("xlsx")
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false })

      if (!workbook.SheetNames.length) throw new Error("The workbook appears to be empty.")

      const parsed: ParsedSheet[] = []
      for (const name of workbook.SheetNames) {
        const worksheet = workbook.Sheets[name]
        const raw = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: null })
        if (raw.length < 2) continue

        const headers = (raw[0] || []).map(normaliseHeader)
        const rows = raw.slice(1).map(row => {
          const obj: Record<string, unknown> = {}
          headers.forEach((h, i) => { obj[h] = excelValue(row[i], h, XLSX) })
          return obj
        }).filter(r => Object.values(r).some(isFilled))

        if (rows.length > 0) {
          parsed.push({ name, headers, rows, rowCount: rows.length, columnCount: headers.length, kind: suggestKind(name, headers), included: shouldIncludeByDefault(name) })
        }
      }

      if (!parsed.length) throw new Error("We couldn’t find any data rows in this workbook.")
      
      setFileName(file.name)
      setFileSize(file.size)
      setSheets(parsed)
      setSelected(parsed.findIndex(s => s.included) >= 0 ? parsed.findIndex(s => s.included) : 0)
      setStep(2)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn’t read this file.")
    } finally { setBusy(false) }
  }

  const toggleSheet = (index: number) => {
    setSheets(prev => prev.map((s, i) => i === index ? { ...s, included: !s.included } : s))
  }

  const setAllIncluded = (included: boolean) => {
    setSheets(prev => prev.map(s => ({ ...s, included })))
  }

  const changeKind = (kind: DatasetKind) => {
    setSheets(prev => prev.map((s, i) => i === selected ? { ...s, kind } : s))
  }

  const current = sheets[selected]
  const includedSheets = useMemo(() => sheets.filter(s => s.included), [sheets])
  const totalRows = useMemo(() => sheets.reduce((sum, s) => sum + s.rowCount, 0), [sheets])
  const includedRows = useMemo(() => includedSheets.reduce((sum, s) => sum + s.rowCount, 0), [includedSheets])

  const importData = async () => {
    if (!includedSheets.length) {
      setError("Select at least one sheet before connecting the workbook.")
      return
    }

    setBusy(true); setError(null); setSuccess(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Your session has expired. Please log in again.")

      let importedRows = 0
      const workbookSheetCount = includedSheets.length

      for (const sheet of includedSheets) {
        const baseName = fileName.replace(/\.(csv|xlsx|xls)$/i, "")
        const datasetName = workbookSheetCount === 1 ? baseName : `${baseName} — ${sheet.name}`

        const { data: dataset, error: datasetError } = await supabase.from("datasets").insert({
          business_id: business.id,
          name: datasetName,
          source_type: "upload",
          file_name: fileName,
          file_size: fileSize,
          row_count: sheet.rowCount,
          column_count: sheet.columnCount,
          status: "processing",
          schema_definition: {
            dataset_type: sheet.kind,
            sheet_name: sheet.name,
            workbook_file: fileName,
            workbook_sheet_count: workbookSheetCount,
            columns: sheet.headers,
            preview_rows: sheet.rows.slice(0, 5),
            parser: "xlsx",
          },
          created_by: user.id,
        }).select("id").single()

        if (datasetError || !dataset) throw new Error(`Could not create dataset “${sheet.name}”: ${datasetError?.message || "unknown error"}`)

        for (let start = 0; start < sheet.rows.length; start += 500) {
          const chunk = sheet.rows.slice(start, start + 500).map((row, offset) => ({ business_id: business.id, dataset_id: dataset.id, row_number: start + offset + 2, row_data: row }))
          const { error: rowsError } = await supabase.from("dataset_rows").insert(chunk)
          if (rowsError) throw new Error(`Could not import rows for “${sheet.name}”: ${rowsError.message}`)
        }

        const { error: updateError } = await supabase.from("datasets").update({ status: "ready" }).eq("id", dataset.id)
        if (updateError) throw new Error(`Could not finalize dataset “${sheet.name}”: ${updateError.message}`)
        importedRows += sheet.rowCount
      }

      setSuccess(`${includedSheets.length} ${includedSheets.length === 1 ? "sheet" : "sheets"} and ${importedRows.toLocaleString()} rows are now part of Nexora.`)
      setStep(3)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The workbook import failed.")
    } finally { setBusy(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this dataset? This will remove all associated data and cannot be undone.")) return
    
    startTransition(async () => {
      const res = await deleteDataset(id)
      if (res.success) {
        setSuccess("Dataset successfully deleted.")
        router.refresh()
      } else {
        setError(res.error || "Failed to delete dataset.")
      }
    })
  }

  const reset = () => { setSheets([]); setSelected(0); setFileName(""); setFileSize(0); setError(null); setSuccess(null); setStep(1); setViewMode("library") }

  return (
    <div className="min-h-screen bg-[#F1F0F8]">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs text-[#68647A]">
          <span>Workspace</span><ChevronRight className="h-3.5 w-3.5" /><span className="font-medium text-[#17153B]">Data Hub</span>
        </div>
        
        <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">Data Hub</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#17153B] sm:text-4xl">Manage your business data.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#68647A]">View connected datasets, monitor data quality, or import new spreadsheets into your workspace.</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => { setViewMode("library"); setError(null); setSuccess(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${viewMode === "library" ? "bg-[#17153B] text-white" : "bg-white border border-[#E7E4EF] text-[#68647A] hover:bg-[#F1F0F8]"}`}
            >
              <LayoutGrid className="w-4 h-4" /> Library
            </button>
            <button 
              onClick={() => { setViewMode("import"); setError(null); setSuccess(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${viewMode === "import" ? "bg-[#17153B] text-white" : "bg-white border border-[#E7E4EF] text-[#68647A] hover:bg-[#F1F0F8]"}`}
            >
              <Plus className="w-4 h-4" /> Import Data
            </button>
          </div>
        </div>

        {error && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#B85454]/20 bg-[#B85454]/5 p-4 text-sm text-[#8D3F3F]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span className="break-words">{error}</span><button type="button" onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button></div>}
        {success && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#3C8F70]/20 bg-[#3C8F70]/5 p-4 text-sm text-[#286B54]"><CheckCircle2 className="mt-0.5 h-4 w-4" /><span>{success}</span></div>}

        {viewMode === "library" && (
          <div className="mt-8">
            {datasets.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-[#E7E4EF] text-center min-h-[400px]">
                <Database className="w-16 h-16 text-[#C8ACD6] mb-6" />
                <h2 className="text-2xl font-semibold text-[#17153B] mb-2">Your data library is empty</h2>
                <p className="text-[#68647A] mb-8 max-w-md">Connect your first spreadsheet to start analyzing your business data across Nexora.</p>
                <button onClick={() => setViewMode("import")} className="px-6 py-3 bg-[#17153B] text-white rounded-xl hover:bg-[#2E236C] transition-colors inline-flex items-center gap-2 font-medium">
                  <Upload className="w-4 h-4" /> Import Data
                </button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {datasets.map(dataset => (
                  <div key={dataset.id} className="bg-white rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] overflow-hidden flex flex-col">
                    <div className="p-5 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EEF6] text-[#433D8B]">
                          <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <span className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full ${dataset.status === "ready" ? "bg-[#EAF5F0] text-[#286B54]" : "bg-[#FFF8E7] text-[#C58A3A]"}`}>
                          {dataset.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-[#17153B] truncate" title={dataset.name}>{dataset.name}</h3>
                      <p className="text-xs text-[#68647A] mt-1 truncate" title={dataset.file_name || ""}>{dataset.file_name}</p>
                      
                      <div className="mt-5 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#68647A]">Classification</span>
                          <span className="font-medium text-[#17153B] capitalize">{dataset.schema_definition?.dataset_type || "Unknown"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#68647A]">Rows</span>
                          <span className="font-medium text-[#17153B]">{dataset.row_count?.toLocaleString() || "—"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#68647A]">Columns</span>
                          <span className="font-medium text-[#17153B]">{dataset.column_count?.toLocaleString() || "—"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#68647A]">Added</span>
                          <span className="font-medium text-[#17153B]">{new Date(dataset.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#F7F5FA] border-t border-[#E7E4EF] p-4 flex gap-3">
                      <button 
                        onClick={() => handleDelete(dataset.id)} 
                        disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-[#B85454] bg-white border border-[#E7E4EF] hover:bg-[#FFF5F5] hover:border-[#F2D6D6] transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                      <button 
                        onClick={() => { setViewMode("import"); }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-[#17153B] bg-white border border-[#E7E4EF] hover:bg-[#F1F0F8] transition-colors"
                      >
                        <Upload className="w-4 h-4" /> Replace
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === "import" && (
          <div>
            <div className="mt-8 flex items-center gap-2 text-xs text-[#68647A]">{["Upload", "Understand", "Connect"].map((label, index) => { const n = index + 1; return <div key={label} className="flex items-center gap-2"><div className={["flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold", step >= n ? "border-[#17153B] bg-[#17153B] text-white" : "border-[#E7E4EF] bg-white text-[#9A94A8]"].join(" ")}>{step > n ? <Check className="h-3.5 w-3.5" /> : n}</div><span className={step === n ? "font-medium text-[#17153B]" : "text-[#68647A]"}>{label}</span>{index < 2 && <ChevronRight className="mx-1 h-3.5 w-3.5 text-[#9A94A8]/50" />}</div> })}</div>

            {step === 1 && <section className="mt-7 grid gap-5 lg:grid-cols-[1fr_330px]">
              <button type="button" onClick={() => inputRef.current?.click()} onDragEnter={e => { e.preventDefault(); setDragging(true) }} onDragOver={e => e.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files?.[0]; if (file) void parseFile(file) }} className={["min-h-[360px] rounded-3xl border-2 border-dashed p-8 text-center transition-all", dragging ? "border-[#433D8B] bg-[#C8ACD6]/15" : "border-[#D9D5E4] bg-white hover:border-[#433D8B]/50"].join(" ")}>
                <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) void parseFile(file); e.currentTarget.value = "" }} />
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0EEF6] text-[#433D8B]"><Upload className="h-7 w-7" /></div><h2 className="mt-6 text-xl font-semibold text-[#17153B]">Drop your spreadsheet here</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68647A]">CSV, XLSX and XLS files are supported. Excel workbooks are read sheet-by-sheet in your browser before anything is imported.</p><span className="mt-6 inline-flex rounded-xl bg-[#17153B] px-5 py-3 text-sm font-medium text-white">Browse files</span><p className="mt-4 text-xs text-[#9A94A8]">Maximum 20 MB for this import.</p>{busy && <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#433D8B]"><Loader2 className="h-4 w-4 animate-spin" /> Reading workbook…</div>}
              </button>
              <aside className="rounded-3xl border border-[#E7E4EF] bg-white p-6"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EEF6] text-[#433D8B]"><FileSpreadsheet className="h-5 w-5" /></div><h2 className="mt-5 text-lg font-semibold text-[#17153B]">What happens next?</h2><div className="mt-5 space-y-5">{[["01", "We inspect every sheet", "Columns and previews are calculated separately."], ["02", "You confirm the context", "Nexora suggests how each sheet should be used."], ["03", "We connect each sheet", "Every worksheet becomes its own dataset." ]].map(([number, title, description]) => <div key={number} className="flex gap-3"><span className="text-[10px] font-semibold tracking-[0.15em] text-[#C8ACD6]">{number}</span><div><p className="text-sm font-medium text-[#17153B]">{title}</p><p className="mt-1 text-xs leading-5 text-[#68647A]">{description}</p></div></div>)}</div></aside>
            </section>}

            {step === 2 && current && <section className="mt-7 space-y-5">
              <div className="rounded-3xl border border-[#E7E4EF] bg-white p-5 sm:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex items-center gap-3"><FileSpreadsheet className="h-5 w-5 text-[#433D8B]" /><div><p className="text-sm font-semibold text-[#17153B]">{fileName}</p><p className="text-xs text-[#9A94A8]">{sheets.length} sheets · {totalRows.toLocaleString()} rows · {(fileSize / 1024 / 1024).toFixed(2)} MB</p></div></div><p className="mt-2 text-xs text-[#68647A]"><span className="font-medium text-[#17153B]">{includedSheets.length} of {sheets.length}</span> sheets selected · {includedRows.toLocaleString()} rows will be connected</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setAllIncluded(true)} className="rounded-xl border border-[#E7E4EF] bg-white px-3 py-2 text-xs font-medium text-[#68647A] hover:border-[#BEB8D0]">Select all</button><button type="button" onClick={() => setAllIncluded(false)} className="rounded-xl border border-[#E7E4EF] bg-white px-3 py-2 text-xs font-medium text-[#68647A] hover:border-[#BEB8D0]">Deselect all</button><button type="button" onClick={reset} className="rounded-xl border border-[#E7E4EF] bg-white px-4 py-2 text-sm font-medium text-[#68647A]">Choose another</button><button type="button" onClick={() => void importData()} disabled={busy || includedSheets.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-[#17153B] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Connect {includedSheets.length} {includedSheets.length === 1 ? "sheet" : "sheets"}</button></div></div>
                <div className="mt-7 grid gap-5 lg:grid-cols-[230px_1fr]">
                  <div className="space-y-2">{sheets.map((sheet, index) => <div key={sheet.name} className={["rounded-2xl border p-3 transition", selected === index ? "border-[#433D8B] bg-[#F0EEF6]" : "border-[#E7E4EF] bg-white", !sheet.included ? "opacity-70" : ""].join(" ")}><div className="flex items-start gap-3"><button type="button" onClick={() => toggleSheet(index)} aria-pressed={sheet.included} aria-label={`${sheet.included ? "Exclude" : "Include"} ${sheet.name}`} className={["mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition", sheet.included ? "border-[#17153B] bg-[#17153B] text-white" : "border-[#CFC9DC] bg-white text-transparent"].join(" ")}>{sheet.included && <Check className="h-3.5 w-3.5" />}</button><button type="button" onClick={() => setSelected(index)} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-medium text-[#17153B]">{sheet.name}</p><p className="mt-1 text-xs text-[#9A94A8]">{sheet.rowCount.toLocaleString()} rows · {sheet.columnCount} columns</p><span className={["mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-wide", sheet.included ? "bg-white text-[#433D8B]" : "bg-[#F3F1F6] text-[#8F899D]"].join(" ")}>{sheet.included ? sheet.kind : "Skipped"}</span></button></div></div>)}</div>
                  <div className="min-w-0"><div className="rounded-2xl border border-[#E7E4EF] bg-[#FBFAFD] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#68647A]">Sheet context</p><p className="mt-1 text-sm font-medium text-[#17153B]">{current.name}</p></div><div className="flex items-center gap-2"><span className={["rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide", current.included ? "bg-[#EAF5F0] text-[#286B54]" : "bg-[#F1EEF5] text-[#777084]"].join(" ")}>{current.included ? "Included" : "Skipped"}</span><select value={current.kind} onChange={e => changeKind(e.target.value as DatasetKind)} disabled={!current.included} className="rounded-xl border border-[#D9D5E4] bg-white px-3 py-2 text-sm text-[#17153B] outline-none disabled:cursor-not-allowed disabled:opacity-50">{kinds.map(kind => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></div></div></div>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-[#E7E4EF] bg-white"><div className="overflow-x-auto"><table className="min-w-full text-left text-xs"><thead className="bg-[#F7F5FA]"><tr>{current.headers.map(header => <th key={header} className="whitespace-nowrap border-b border-[#E7E4EF] px-3 py-3 font-semibold text-[#68647A]">{header}</th>)}</tr></thead><tbody>{current.rows.slice(0, 8).map((row, rowIndex) => <tr key={rowIndex} className="border-b border-[#F0EDF5] last:border-0">{current.headers.map(header => <td key={header} className="max-w-[220px] truncate px-3 py-3 text-[#3F3A52]">{row[header] === null || row[header] === undefined || row[header] === "" ? "—" : String(row[header])}</td>)}</tr>)}</tbody></table></div><p className="border-t border-[#E7E4EF] px-3 py-3 text-[11px] text-[#9A94A8]">Showing the first {Math.min(8, current.rowCount).toLocaleString()} of {current.rowCount.toLocaleString()} rows.</p></div>
                  </div>
                </div>
              </div>
            </section>}

            {step === 3 && <section className="mt-7 rounded-3xl border border-[#E7E4EF] bg-white p-8 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF5F0] text-[#286B54]"><CheckCircle2 className="h-8 w-8" /></div><h2 className="mt-5 text-2xl font-semibold text-[#17153B]">Data connected.</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#68647A]">The selected workbook sheets have been split into independent datasets. Skipped sheets were left out of the import.</p><div className="mt-6 flex justify-center gap-3"><button type="button" onClick={reset} className="rounded-xl border border-[#E7E4EF] bg-white px-5 py-3 text-sm font-medium text-[#17153B]">View Library</button></div></section>}
          </div>
        )}
      </div>
    </div>
  )
}
