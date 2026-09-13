"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { AlertCircle, Check, CheckCircle2, ChevronRight, FileSpreadsheet, Loader2, Upload, X, Trash2, LayoutGrid, Plus, Database, ShieldCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { deleteDataset } from "@/app/data-hub/actions"
import { useRouter } from "next/navigation"

type Business = { id: string; name: string; currencyCode: string }
type Dataset = { id: string; name: string; file_name: string | null; row_count: number | null; column_count: number | null; status: string; created_at: string; schema_definition?: Record<string, unknown>; quality_metrics?: { validPercent?: string | number, missingRows?: number, warnings?: string[] } }
type DatasetKind = "sales" | "products" | "inventory" | "suppliers" | "customers" | "finance" | "other"
type ParsedSheet = { name: string; headers: string[]; rows: Record<string, unknown>[]; rowCount: number; columnCount: number; kind: DatasetKind; included: boolean; quality: { validPercent: string | number, missingRows: number, warnings: string[] } }

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

function calculateQuality(rows: Record<string, unknown>[], headers: string[]) {
  if (rows.length === 0) return { validPercent: 0, missingRows: 0, warnings: ["No data rows found"] };
  let missingCount = 0;
  let emptyCells = 0;
  const totalCells = rows.length * headers.length;
  
  rows.forEach(row => {
    let rowHasMissing = false;
    headers.forEach(h => {
      if (!isFilled(row[h])) {
        emptyCells++;
        rowHasMissing = true;
      }
    });
    if (rowHasMissing) missingCount++;
  });
  
  const validPercent = totalCells > 0 ? Math.max(0, 100 - (emptyCells / totalCells * 100)) : 0;
  
  return {
    validPercent: validPercent.toFixed(1),
    missingRows: missingCount,
    warnings: missingCount > 0 ? [`${missingCount} rows have missing data fields.`] : [],
  };
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
      const parsed: ParsedSheet[] = []
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        const Papa = (await import("papaparse")).default;
        const text = await file.text();
        const result = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true });
        
        if (result.data.length > 0) {
          const headers = (result.meta.fields || []).map((h, i) => normaliseHeader(h, i));
          const rows = result.data;
          
          const quality = calculateQuality(rows, headers);
          parsed.push({
            name: file.name,
            headers,
            rows,
            rowCount: rows.length,
            columnCount: headers.length,
            kind: suggestKind(file.name, headers),
            included: true,
            quality
          })
        }
      } else {
        const ExcelJS = (await import("exceljs")).default;
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        if (workbook.worksheets.length === 0) throw new Error("The workbook appears to be empty.");

        workbook.eachSheet((worksheet) => {
          const name = worksheet.name;
          const headerRow = worksheet.getRow(1);
          if (!headerRow || !headerRow.values) return;
          
          const rawHeaders = Array.isArray(headerRow.values) ? headerRow.values.slice(1) : [];
          const headers = rawHeaders.map((h, i) => normaliseHeader(h, i));
          
          if (headers.length === 0) return;
          
          const rows: Record<string, unknown>[] = [];
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // skip header
            const obj: Record<string, unknown> = {};
            const rowVals = Array.isArray(row.values) ? row.values.slice(1) : [];
            
            headers.forEach((h, i) => {
              let val = rowVals[i];
              // Handle rich text or formulas
              if (val && typeof val === 'object') {
                if ('result' in val) val = (val as { result: unknown }).result as typeof val;
                else if ('text' in val) val = (val as { text: unknown }).text as typeof val;
              }
              // Handle dates properly
              if (val instanceof Date) {
                obj[h] = val.toISOString().split('T')[0];
              } else {
                obj[h] = val ?? null;
              }
            });
            
            if (Object.values(obj).some(isFilled)) {
              rows.push(obj);
            }
          });
          
          if (rows.length > 0) {
            const quality = calculateQuality(rows, headers);
            parsed.push({
              name,
              headers,
              rows,
              rowCount: rows.length,
              columnCount: headers.length,
              kind: suggestKind(name, headers),
              included: shouldIncludeByDefault(name),
              quality
            });
          }
        });
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
          quality_metrics: sheet.quality,
          schema_definition: {
            dataset_type: sheet.kind,
            sheet_name: sheet.name,
            workbook_file: fileName,
            workbook_sheet_count: workbookSheetCount,
            columns: sheet.headers,
            preview_rows: sheet.rows.slice(0, 5),
            parser: "exceljs",
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
        setError(res.error || "Failed to delete dataset. You might not have owner permissions.")
      }
    })
  }

  const reset = () => { setSheets([]); setSelected(0); setFileName(""); setFileSize(0); setError(null); setSuccess(null); setStep(1); setViewMode("library") }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Workspace</span><ChevronRight className="h-3.5 w-3.5" /><span className="font-medium text-zinc-950">Data Hub</span>
        </div>
        
        <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium text-blue-600">Data Hub</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Manage your business data.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">View connected datasets, monitor data quality, or import new spreadsheets into your workspace.</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => { setViewMode("library"); setError(null); setSuccess(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${viewMode === "library" ? "bg-zinc-950 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50"}`}
            >
              <LayoutGrid className="w-4 h-4" /> Library
            </button>
            <button 
              onClick={() => { setViewMode("import"); setError(null); setSuccess(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${viewMode === "import" ? "bg-zinc-950 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50"}`}
            >
              <Plus className="w-4 h-4" /> Import Data
            </button>
          </div>
        </div>

        {error && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-600/20 bg-rose-600/5 p-4 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span className="break-words">{error}</span><button type="button" onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button></div>}
        {success && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-600/20 bg-emerald-600/5 p-4 text-sm text-emerald-700"><CheckCircle2 className="mt-0.5 h-4 w-4" /><span>{success}</span></div>}

        {viewMode === "library" && (
          <div className="mt-8">
            {datasets.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-zinc-200 text-center min-h-[400px]">
                <Database className="w-16 h-16 text-blue-200 mb-6" />
                <h2 className="text-2xl font-semibold text-zinc-950 mb-2">Your data library is empty</h2>
                <p className="text-zinc-500 mb-8 max-w-md">Connect your first spreadsheet to start analyzing your business data across Nexora.</p>
                <button onClick={() => setViewMode("import")} className="px-6 py-3 bg-zinc-950 text-white rounded-xl hover:bg-blue-800 transition-colors inline-flex items-center gap-2 font-medium">
                  <Upload className="w-4 h-4" /> Import Data
                </button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {datasets.map(dataset => (
                  <div key={dataset.id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-blue-600">
                          <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <span className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full ${dataset.status === "ready" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-500"}`}>
                          {dataset.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-zinc-950 truncate" title={dataset.name}>{dataset.name}</h3>
                      <p className="text-xs text-zinc-500 mt-1 truncate" title={dataset.file_name || ""}>{dataset.file_name}</p>
                      
                      <div className="mt-5 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Classification</span>
                          <span className="font-medium text-zinc-950 capitalize">{(dataset.schema_definition?.dataset_type as string) || "Unknown"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Rows</span>
                          <span className="font-medium text-zinc-950">{dataset.row_count?.toLocaleString() || "—"}</span>
                        </div>
                        {dataset.quality_metrics?.validPercent && (
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-500 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Quality</span>
                            <span className="font-medium text-zinc-950">{dataset.quality_metrics?.validPercent}% valid</span>
                          </div>
                        )}
                        {(dataset.quality_metrics?.missingRows ?? 0) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-rose-600">Missing data</span>
                            <span className="font-medium text-rose-600">{dataset.quality_metrics?.missingRows} rows</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Added</span>
                          <span className="font-medium text-zinc-950">{new Date(dataset.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-zinc-50 border-t border-zinc-200 p-4 flex gap-3">
                      <button 
                        onClick={() => handleDelete(dataset.id)} 
                        disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-rose-600 bg-white border border-zinc-200 hover:bg-rose-50 hover:border-[#F2D6D6] transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                      <button 
                        onClick={() => { setViewMode("import"); }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-zinc-950 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors"
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
            <div className="mt-8 flex items-center gap-2 text-xs text-zinc-500">{["Upload", "Understand", "Connect"].map((label, index) => { const n = index + 1; return <div key={label} className="flex items-center gap-2"><div className={["flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold", step >= n ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-400"].join(" ")}>{step > n ? <Check className="h-3.5 w-3.5" /> : n}</div><span className={step === n ? "font-medium text-zinc-950" : "text-zinc-500"}>{label}</span>{index < 2 && <ChevronRight className="mx-1 h-3.5 w-3.5 text-zinc-400/50" />}</div> })}</div>

            {step === 1 && <section className="mt-7 grid gap-5 lg:grid-cols-[1fr_330px]">
              <button type="button" onClick={() => inputRef.current?.click()} onDragEnter={e => { e.preventDefault(); setDragging(true) }} onDragOver={e => e.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files?.[0]; if (file) void parseFile(file) }} className={["min-h-[360px] rounded-xl border-2 border-dashed p-8 text-center transition-all", dragging ? "border-blue-600 bg-blue-200/15" : "border-zinc-300 bg-white hover:border-blue-600/50"].join(" ")}>
                <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) void parseFile(file); e.currentTarget.value = "" }} />
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-blue-600"><Upload className="h-7 w-7" /></div><h2 className="mt-6 text-xl font-semibold text-zinc-950">Drop your spreadsheet here</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">CSV, XLSX and XLS files are supported. Workbooks are read securely sheet-by-sheet in your browser using our modern parsing engine.</p><span className="mt-6 inline-flex rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white">Browse files</span><p className="mt-4 text-xs text-zinc-400">Maximum 20 MB for this import.</p>{busy && <div className="mt-5 flex items-center justify-center gap-2 text-xs text-blue-600"><Loader2 className="h-4 w-4 animate-spin" /> Reading workbook…</div>}
              </button>
              <aside className="rounded-xl border border-zinc-200 bg-white p-6"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-blue-600"><FileSpreadsheet className="h-5 w-5" /></div><h2 className="mt-5 text-lg font-semibold text-zinc-950">What happens next?</h2><div className="mt-5 space-y-5">{[["01", "We inspect every sheet", "Columns, previews, and data quality metrics are calculated."], ["02", "You confirm the context", "Nexora suggests how each sheet should be used."], ["03", "We connect each sheet", "Every worksheet becomes its own protected dataset." ]].map(([number, title, description]) => <div key={number} className="flex gap-3"><span className="text-[10px] font-semibold tracking-[0.15em] text-blue-200">{number}</span><div><p className="text-sm font-medium text-zinc-950">{title}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p></div></div>)}</div></aside>
            </section>}

            {step === 2 && current && <section className="mt-7 space-y-5">
              <div className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex items-center gap-3"><FileSpreadsheet className="h-5 w-5 text-blue-600" /><div><p className="text-sm font-semibold text-zinc-950">{fileName}</p><p className="text-xs text-zinc-400">{sheets.length} sheets · {totalRows.toLocaleString()} rows · {(fileSize / 1024 / 1024).toFixed(2)} MB</p></div></div><p className="mt-2 text-xs text-zinc-500"><span className="font-medium text-zinc-950">{includedSheets.length} of {sheets.length}</span> sheets selected · {includedRows.toLocaleString()} rows will be connected</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setAllIncluded(true)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-500 hover:border-zinc-300">Select all</button><button type="button" onClick={() => setAllIncluded(false)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-500 hover:border-zinc-300">Deselect all</button><button type="button" onClick={reset} className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-500">Choose another</button><button type="button" onClick={() => void importData()} disabled={busy || includedSheets.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Connect {includedSheets.length} {includedSheets.length === 1 ? "sheet" : "sheets"}</button></div></div>
                <div className="mt-7 grid gap-5 lg:grid-cols-[230px_1fr]">
                  <div className="space-y-2">{sheets.map((sheet, index) => <div key={sheet.name} className={["rounded-2xl border p-3 transition", selected === index ? "border-blue-600 bg-zinc-100" : "border-zinc-200 bg-white", !sheet.included ? "opacity-70" : ""].join(" ")}><div className="flex items-start gap-3"><button type="button" onClick={() => toggleSheet(index)} aria-pressed={sheet.included} aria-label={`${sheet.included ? "Exclude" : "Include"} ${sheet.name}`} className={["mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition", sheet.included ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-300 bg-white text-transparent"].join(" ")}>{sheet.included && <Check className="h-3.5 w-3.5" />}</button><button type="button" onClick={() => setSelected(index)} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-medium text-zinc-950">{sheet.name}</p><p className="mt-1 text-xs text-zinc-400">{sheet.rowCount.toLocaleString()} rows · {sheet.quality.validPercent}% valid</p><span className={["mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-wide", sheet.included ? "bg-white text-blue-600" : "bg-zinc-100 text-zinc-400"].join(" ")}>{sheet.included ? sheet.kind : "Skipped"}</span></button></div></div>)}</div>
                  <div className="min-w-0"><div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Sheet context</p><p className="mt-1 text-sm font-medium text-zinc-950">{current.name}</p></div><div className="flex items-center gap-2"><span className={["rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide", current.included ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"].join(" ")}>{current.included ? "Included" : "Skipped"}</span><select value={current.kind} onChange={e => changeKind(e.target.value as DatasetKind)} disabled={!current.included} className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none disabled:cursor-not-allowed disabled:opacity-50">{kinds.map(kind => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></div></div></div>
                    {current.quality.missingRows > 0 && (
                      <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-[#9C6515]">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>Data quality check: {current.quality.missingRows} rows contain missing fields which may affect calculations.</span>
                      </div>
                    )}
                    <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white"><div className="overflow-x-auto"><table className="min-w-full text-left text-xs"><thead className="bg-zinc-50"><tr>{current.headers.map(header => <th key={header} className="whitespace-nowrap border-b border-zinc-200 px-3 py-3 font-semibold text-zinc-500">{header}</th>)}</tr></thead><tbody>{current.rows.slice(0, 8).map((row, rowIndex) => <tr key={rowIndex} className="border-b border-zinc-200 last:border-0">{current.headers.map(header => <td key={header} className="max-w-[220px] truncate px-3 py-3 text-zinc-700">{row[header] === null || row[header] === undefined || row[header] === "" ? "—" : String(row[header])}</td>)}</tr>)}</tbody></table></div><p className="border-t border-zinc-200 px-3 py-3 text-[11px] text-zinc-400">Showing the first {Math.min(8, current.rowCount).toLocaleString()} of {current.rowCount.toLocaleString()} rows.</p></div>
                  </div>
                </div>
              </div>
            </section>}

            {step === 3 && <section className="mt-7 rounded-xl border border-zinc-200 bg-white p-8 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-8 w-8" /></div><h2 className="mt-5 text-2xl font-semibold text-zinc-950">Data connected.</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-500">The selected workbook sheets have been split into independent datasets. Skipped sheets were left out of the import.</p><div className="mt-6 flex justify-center gap-3"><button type="button" onClick={reset} className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-950">View Library</button></div></section>}
          </div>
        )}
      </div>
    </div>
  )
}
