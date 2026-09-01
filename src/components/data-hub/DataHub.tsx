"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { AlertCircle, ArrowRight, Check, CheckCircle2, ChevronRight, FileSpreadsheet, Loader2, Upload, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Business = { id: string; name: string; currencyCode: string }
type Dataset = { id: string; name: string; file_name: string | null; row_count: number | null; column_count: number | null; status: string; created_at: string }
type ColumnType = "date" | "number" | "text" | "boolean"
type ColumnInfo = { name: string; type: ColumnType; missing: number; examples: string[] }
type DatasetKind = "sales" | "products" | "inventory" | "suppliers" | "customers" | "finance" | "other"
type ParsedSheet = {
  name: string
  headers: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  columnCount: number
  kind: DatasetKind
  mapping: Record<string, string>
  columns: ColumnInfo[]
}

const kinds: { value: DatasetKind; label: string; description: string }[] = [
  { value: "sales", label: "Sales / orders", description: "Orders, revenue, quantities, customers or products" },
  { value: "products", label: "Products", description: "Product catalogue, SKUs, pricing and categories" },
  { value: "inventory", label: "Inventory", description: "Stock levels, warehouses and reorder points" },
  { value: "suppliers", label: "Suppliers", description: "Supplier records, lead times and reliability" },
  { value: "customers", label: "Customers", description: "Customer or account information" },
  { value: "finance", label: "Finance", description: "Invoices, payments, expenses or financial records" },
  { value: "other", label: "Other", description: "A dataset that does not fit these areas" },
]

const aliases: Record<string, string[]> = {
  date: ["date", "order_date", "order date", "invoice_date", "transaction_date", "created_at"],
  name: ["name", "product_name", "product name", "customer_name", "customer name", "supplier_name", "supplier name"],
  product: ["product", "product_id", "product id", "item", "item_id", "item id"],
  sku: ["sku", "product_code", "product code", "item_code", "item code"],
  quantity: ["qty", "quantity", "units", "unit", "stock", "stock_qty", "stock quantity"],
  revenue: ["revenue", "sales", "amount", "total", "total_amount", "total amount", "net_sales"],
  price: ["price", "unit_price", "unit price", "selling_price", "selling price"],
  cost: ["cost", "unit_cost", "unit cost", "purchase_cost"],
  customer: ["customer", "customer_id", "customer id", "customer_name", "customer name", "client", "account"],
  supplier: ["supplier", "supplier_id", "supplier id", "supplier_name", "supplier name", "vendor", "vendor_name"],
  category: ["category", "product_category", "product category", "segment"],
  warehouse: ["warehouse", "location", "store", "branch"],
  reorder: ["reorder_level", "reorder level", "reorder_point", "reorder point", "min_stock", "minimum stock"],
}

function normaliseHeader(value: string, index: number) {
  const cleaned = value.trim().replace(/\s+/g, " ")
  return cleaned || `Column ${index + 1}`
}

function isDateHeader(header: string) {
  const normal = header.toLowerCase().trim().replace(/[_-]+/g, " ")
  return /(^| )(date|datetime|timestamp|day)$/.test(normal) || normal.includes(" order date") || normal.includes(" transaction date") || normal.includes(" invoice date") || normal.includes(" created at") || normal.includes(" updated at")
}

function normaliseExcelValue(value: unknown, header: string, XLSX: typeof import("xlsx")) {
  if (value === null || value === undefined || value === "") return value
  if (typeof value === "number" && isDateHeader(header)) {
    const decoded = XLSX.SSF.parse_date_code(value)
    if (decoded?.y && decoded.m && decoded.d) return `${decoded.y}-${String(decoded.m).padStart(2, "0")}-${String(decoded.d).padStart(2, "0")}`
  }
  return value
}

function inferType(values: unknown[], header: string): ColumnType {
  const sample = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== "").slice(0, 100)
  if (!sample.length) return "text"
  const normal = header.toLowerCase().trim().replace(/[_-]+/g, " ")
  if (/(^| )(id|code|sku|key)$/.test(normal) || normal.endsWith(" id") || normal.endsWith(" code") || normal.endsWith(" sku")) return "text"
  const booleans = sample.filter((v) => ["true", "false", "yes", "no"].includes(String(v).toLowerCase())).length
  if (booleans / sample.length >= 0.9) return "boolean"
  const numbers = sample.filter((v) => {
    if (typeof v === "number") return Number.isFinite(v)
    const cleaned = String(v).replace(/[₹$€£,%\s,]/g, "")
    return cleaned !== "" && Number.isFinite(Number(cleaned))
  }).length
  if (numbers / sample.length >= 0.9) return "number"
  const dates = sample.filter((v) => {
    const text = String(v)
    return /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(text) || (!Number.isNaN(Date.parse(text)) && /[-/]/.test(text))
  }).length
  if (dates / sample.length >= 0.8) return "date"
  return "text"
}

function analyseColumns(headers: string[], rows: Record<string, unknown>[]): ColumnInfo[] {
  return headers.map((name) => {
    const values = rows.map((row) => row[name])
    const present = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
    return { name, type: inferType(values, name), missing: values.length - present.length, examples: present.slice(0, 3).map(String) }
  })
}

function matches(header: string, values: string[]) {
  const normal = header.toLowerCase().trim().replace(/[_-]+/g, " ")
  return values.some((value) => normal === value || normal.includes(value))
}

function suggestKind(sheetName: string, headers: string[]): DatasetKind {
  const text = `${sheetName} ${headers.join(" ")}`.toLowerCase().replace(/[_-]+/g, " ")
  if (/(^|\s)(order|orders|sales|transactions)(\s|$)/.test(text) || matches(headers[0] ?? "", aliases.revenue)) return "sales"
  if (/(inventory|stock|warehouse)/.test(text)) return "inventory"
  if (/(supplier|vendor)/.test(text)) return "suppliers"
  if (/(customer|client|account)/.test(text)) return "customers"
  if (/(product|catalogue|catalog|sku)/.test(text)) return "products"
  if (/(finance|expense|invoice|payment|profit|cost)/.test(text)) return "finance"
  return "other"
}

function suggestMapping(headers: string[], kind: DatasetKind) {
  const relevant: Record<DatasetKind, string[]> = {
    sales: ["date", "customer", "product", "quantity", "revenue", "price", "sku"],
    products: ["name", "sku", "category", "price", "cost"],
    inventory: ["name", "sku", "quantity", "reorder", "cost", "warehouse"],
    suppliers: ["supplier", "name", "location"],
    customers: ["customer", "name", "location"],
    finance: ["date", "revenue", "cost", "customer"],
    other: [],
  }
  const mapping: Record<string, string> = {}
  for (const header of headers) {
    const target = relevant[kind].find((candidate) => matches(header, aliases[candidate]))
    if (target && !Object.values(mapping).includes(target)) mapping[header] = target
  }
  return mapping
}

function parseSheet(sheetName: string, worksheet: import("xlsx").WorkSheet, XLSX: typeof import("xlsx"), fallbackKind?: DatasetKind): ParsedSheet {
  const raw = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: true }) as unknown[][]
  const headerRow = raw.find((row) => row.some((cell) => cell !== null && String(cell).trim() !== ""))
  if (!headerRow) throw new Error(`Sheet “${sheetName}” does not contain column headers.`)
  const headerIndex = raw.indexOf(headerRow)
  const headers = headerRow.map((cell, index) => normaliseHeader(String(cell ?? ""), index))
  const uniqueHeaders = headers.map((header, index) => {
    const count = headers.slice(0, index).filter((item) => item === header).length
    return count ? `${header} ${count + 1}` : header
  })
  const rows = raw.slice(headerIndex + 1).filter((row) => row.some((cell) => cell !== null && String(cell).trim() !== "")).map((row) => {
    const record: Record<string, unknown> = {}
    uniqueHeaders.forEach((header, index) => { record[header] = normaliseExcelValue(row[index] ?? null, header, XLSX) })
    return record
  })
  if (!rows.length) throw new Error(`Sheet “${sheetName}” contains headers but no data rows.`)
  const kind = fallbackKind ?? suggestKind(sheetName, uniqueHeaders)
  return { name: sheetName, headers: uniqueHeaders, rows, rowCount: rows.length, columnCount: uniqueHeaders.length, kind, mapping: suggestMapping(uniqueHeaders, kind), columns: analyseColumns(uniqueHeaders, rows) }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—"
  return String(value)
}

export default function DataHub({ business, datasets }: { business: Business; datasets: Dataset[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [sheets, setSheets] = useState<ParsedSheet[]>([])
  const [selected, setSelected] = useState(0)
  const [fileName, setFileName] = useState("")
  const [fileSize, setFileSize] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const current = sheets[selected] ?? null
  const totalRows = useMemo(() => sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0), [sheets])
  const existingCount = datasets.length

  const parseFile = useCallback(async (file: File) => {
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      const lower = file.name.toLowerCase()
      if (!lower.endsWith(".csv") && !lower.endsWith(".xlsx") && !lower.endsWith(".xls")) throw new Error("Use a CSV, XLSX, or XLS file.")
      if (file.size > 20 * 1024 * 1024) throw new Error("For this first import, keep files under 20 MB.")
      const XLSX = await import("xlsx")
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false })
      if (!workbook.SheetNames.length) throw new Error("The workbook does not contain any worksheets.")
      const parsedSheets = workbook.SheetNames.map((name) => parseSheet(name, workbook.Sheets[name], XLSX))
      setFileName(file.name)
      setFileSize(file.size)
      setSheets(parsedSheets)
      setSelected(0)
      setStep(2)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The workbook could not be read.")
    } finally {
      setBusy(false)
    }
  }, [])

  const changeKind = (kind: DatasetKind) => {
    setSheets((previous) => previous.map((sheet, index) => index === selected ? { ...sheet, kind, mapping: suggestMapping(sheet.headers, kind) } : sheet))
  }

  const importData = async () => {
    if (!sheets.length) return
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Your session has expired. Please log in again.")

      let importedSheets = 0
      let importedRows = 0
      for (const sheet of sheets) {
        const schemaDefinition = {
          dataset_type: sheet.kind,
          sheet_name: sheet.name,
          workbook_file: fileName,
          workbook_sheet_count: sheets.length,
          columns: sheet.columns.map((column) => ({ ...column, examples: column.examples.slice(0, 3) })),
          mapping: sheet.mapping,
          preview_rows: sheet.rows.slice(0, 5),
          parser: "xlsx",
        }
        const baseName = fileName.replace(/\.(csv|xlsx|xls)$/i, "")
        const datasetName = sheets.length === 1 ? baseName : `${baseName} — ${sheet.name}`
        const { data: dataset, error: datasetError } = await supabase.from("datasets").insert({
          business_id: business.id,
          name: datasetName,
          source_type: "upload",
          file_name: fileName,
          file_size: fileSize,
          row_count: sheet.rowCount,
          column_count: sheet.columnCount,
          status: "processing",
          schema_definition: schemaDefinition,
          created_by: user.id,
        }).select("id").single()
        if (datasetError || !dataset) throw new Error(`Could not create dataset “${sheet.name}”: ${datasetError?.message || "unknown error"}`)

        const { data: importRecord, error: importError } = await supabase.from("data_imports").insert({
          business_id: business.id,
          dataset_id: dataset.id,
          file_name: fileName,
          status: "processing",
          rows_detected: sheet.rowCount,
          mapping: sheet.mapping,
          created_by: user.id,
          started_at: new Date().toISOString(),
        }).select("id").single()
        if (importError || !importRecord) throw new Error(`Could not start import for “${sheet.name}”: ${importError?.message || "unknown error"}`)

        for (let start = 0; start < sheet.rows.length; start += 500) {
          const chunk = sheet.rows.slice(start, start + 500).map((row, offset) => ({ business_id: business.id, dataset_id: dataset.id, row_number: start + offset + 2, row_data: row }))
          const { error: rowsError } = await supabase.from("dataset_rows").insert(chunk)
          if (rowsError) throw new Error(`Could not import rows for “${sheet.name}”: ${rowsError.message}`)
        }

        const now = new Date().toISOString()
        const { error: importUpdateError } = await supabase.from("data_imports").update({ status: "completed", rows_imported: sheet.rowCount, completed_at: now }).eq("id", importRecord.id)
        if (importUpdateError) throw new Error(`Could not complete import for “${sheet.name}”: ${importUpdateError.message}`)
        const { error: datasetUpdateError } = await supabase.from("datasets").update({ status: "ready" }).eq("id", dataset.id)
        if (datasetUpdateError) throw new Error(`Could not finalize dataset “${sheet.name}”: ${datasetUpdateError.message}`)
        importedSheets += 1
        importedRows += sheet.rowCount
      }
      setSuccess(`${importedSheets} ${importedSheets === 1 ? "sheet" : "sheets"} and ${importedRows.toLocaleString()} rows are now part of Nexora.`)
      setStep(3)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The workbook import failed.")
    } finally {
      setBusy(false)
    }
  }

  const reset = () => { setSheets([]); setSelected(0); setFileName(""); setFileSize(0); setError(null); setSuccess(null); setStep(1) }

  return (
    <div className="min-h-screen bg-[#F1F0F8]">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs text-[#68647A]"><span>Workspace</span><ChevronRight className="h-3.5 w-3.5" /><span className="font-medium text-[#17153B]">Data Hub</span></div>
        <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">Data Hub</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#17153B] sm:text-4xl">Connect your business data.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#68647A]">Upload a spreadsheet, let Nexora understand every sheet, then decide how each part should be used across your workspace.</p></div>
          <div className="rounded-2xl border border-[#E7E4EF] bg-white px-4 py-3 text-right shadow-sm"><p className="text-[10px] uppercase tracking-[0.15em] text-[#68647A]/60">Workspace</p><p className="mt-1 max-w-[220px] truncate text-sm font-medium text-[#17153B]">{business.name}</p></div>
        </div>

        <div className="mt-8 flex items-center gap-2 text-xs text-[#68647A]">{["Upload", "Understand", "Connect"].map((label, index) => { const n = index + 1; const complete = step > n; return <div key={label} className="flex items-center gap-2"><div className={["flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold", complete || step === n ? "border-[#17153B] bg-[#17153B] text-white" : "border-[#E7E4EF] bg-white text-[#9A94A8]"].join(" ")}>{complete ? <Check className="h-3.5 w-3.5" /> : n}</div><span className={step === n ? "font-medium text-[#17153B]" : "text-[#68647A]"}>{label}</span>{index < 2 && <ArrowRight className="mx-1 h-3.5 w-3.5 text-[#9A94A8]/50" />}</div> })}</div>

        {error && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#B85454]/20 bg-[#B85454]/5 p-4 text-sm text-[#8D3F3F]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span><button type="button" onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button></div>}
        {success && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#3C8F70]/20 bg-[#3C8F70]/5 p-4 text-sm text-[#286B54]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{success}</span></div>}

        {step === 1 && <section className="mt-7 grid gap-5 lg:grid-cols-[1fr_330px]">
          <button type="button" onClick={() => inputRef.current?.click()} onDragEnter={(e) => { e.preventDefault(); setDragging(true) }} onDragOver={(e) => e.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files[0]; if (file) void parseFile(file) }} className={["min-h-[360px] rounded-3xl border-2 border-dashed p-8 text-center transition-all", dragging ? "border-[#433D8B] bg-[#C8ACD6]/15" : "border-[#D9D5E4] bg-white hover:border-[#433D8B]/50"].join(" ")}>
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void parseFile(file); e.currentTarget.value = "" }} />
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0EEF6] text-[#433D8B]"><Upload className="h-7 w-7" /></div><h2 className="mt-6 text-xl font-semibold text-[#17153B]">Drop your spreadsheet here</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68647A]">CSV, XLSX and XLS files are supported. Excel workbooks are read sheet-by-sheet in your browser before anything is imported.</p><span className="mt-6 inline-flex rounded-xl bg-[#17153B] px-5 py-3 text-sm font-medium text-white">Browse files</span><p className="mt-4 text-xs text-[#9A94A8]">Maximum 20 MB for this import.</p>{busy && <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#433D8B]"><Loader2 className="h-4 w-4 animate-spin" /> Reading workbook…</div>}
          </button>
          <aside className="rounded-3xl border border-[#E7E4EF] bg-white p-6"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EEF6] text-[#433D8B]"><FileSpreadsheet className="h-5 w-5" /></div><h2 className="mt-5 text-lg font-semibold text-[#17153B]">What happens next?</h2><div className="mt-5 space-y-5">{[["01", "We inspect every sheet", "Columns, types, missing values and previews are calculated separately."], ["02", "You confirm the context", "Nexora suggests Sales, Products, Inventory, Suppliers, Customers or Finance for each sheet."], ["03", "We connect each sheet", "Every worksheet becomes its own dataset while preserving the original rows."]].map(([number, title, description]) => <div key={number} className="flex gap-3"><span className="text-[10px] font-semibold tracking-[0.15em] text-[#C8ACD6]">{number}</span><div><p className="text-sm font-medium text-[#17153B]">{title}</p><p className="mt-1 text-xs leading-5 text-[#68647A]">{description}</p></div></div>)}</div></aside>
        </section>}

        {step === 2 && current && <section className="mt-7 space-y-5">
          <div className="rounded-3xl border border-[#E7E4EF] bg-white p-6 sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EEF6] text-[#433D8B]"><FileSpreadsheet className="h-5 w-5" /></div><div><p className="text-sm font-semibold text-[#17153B]">{fileName}</p><p className="mt-1 text-xs text-[#68647A]">{sheets.length} {sheets.length === 1 ? "sheet" : "sheets"} · {totalRows.toLocaleString()} total rows · {formatBytes(fileSize)}</p></div></div></div><button type="button" onClick={reset} className="text-sm font-medium text-[#433D8B]">Choose another file</button></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-[#F7F6FA] p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-[#68647A]">Sheets detected</p><p className="mt-2 text-2xl font-semibold text-[#17153B]">{sheets.length}</p></div><div className="rounded-2xl bg-[#F7F6FA] p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-[#68647A]">Rows detected</p><p className="mt-2 text-2xl font-semibold text-[#17153B]">{totalRows.toLocaleString()}</p></div><div className="rounded-2xl bg-[#F7F6FA] p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-[#68647A]">Existing datasets</p><p className="mt-2 text-2xl font-semibold text-[#17153B]">{existingCount}</p></div></div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
            <div className="rounded-3xl border border-[#E7E4EF] bg-white p-4"><p className="px-2 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#433D8B]">Workbook sheets</p><div className="space-y-1">{sheets.map((sheet, index) => <button key={sheet.name} type="button" onClick={() => setSelected(index)} className={["w-full rounded-2xl px-3 py-3 text-left transition", selected === index ? "bg-[#F0EEF6] ring-1 ring-[#433D8B]/20" : "hover:bg-[#F8F7FB]"].join(" ")}><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium text-[#17153B]">{sheet.name}</span><span className="shrink-0 text-[10px] text-[#68647A]">{sheet.rowCount}</span></div><p className="mt-1 text-xs text-[#68647A]">{kinds.find((k) => k.value === sheet.kind)?.label}</p></button>)}</div></div>

            <div className="rounded-3xl border border-[#E7E4EF] bg-white p-6 sm:p-7"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#433D8B]">Sheet {selected + 1} of {sheets.length}</p><h2 className="mt-2 text-2xl font-semibold text-[#17153B]">{current.name}</h2><p className="mt-1 text-sm text-[#68647A]">{current.rowCount.toLocaleString()} rows · {current.columnCount} columns</p></div><div className="w-full sm:w-64"><label htmlFor="dataset-kind" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#68647A]">What does this sheet represent?</label><select id="dataset-kind" value={current.kind} onChange={(e) => changeKind(e.target.value as DatasetKind)} className="mt-2 w-full rounded-xl border border-[#E7E4EF] bg-white px-3 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B]">{kinds.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><p className="mt-2 text-xs leading-5 text-[#68647A]">{kinds.find((item) => item.value === current.kind)?.description}</p></div></div>

              <div className="mt-7 overflow-hidden rounded-2xl border border-[#E7E4EF]"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-[#F3F1F8]"><tr>{current.headers.slice(0, 10).map((header) => <th key={header} className="whitespace-nowrap px-4 py-3 font-medium text-[#68647A]">{header}<span className="ml-2 rounded-full bg-white px-1.5 py-0.5 text-[9px] text-[#433D8B]">{current.columns.find((c) => c.name === header)?.type}</span></th>)}</tr></thead><tbody>{current.rows.slice(0, 8).map((row, rowIndex) => <tr key={rowIndex} className="border-t border-[#EEEAF4]">{current.headers.slice(0, 10).map((header) => <td key={header} className="max-w-[220px] truncate whitespace-nowrap px-4 py-3 text-[#68647A]">{displayValue(row[header])}</td>)}</tr>)}</tbody></table></div></div>

              <div className="mt-6 flex flex-col justify-between gap-4 border-t border-[#EEEAF4] pt-5 sm:flex-row sm:items-center"><div><p className="text-sm font-medium text-[#17153B]">This sheet will become its own dataset.</p><p className="mt-1 text-xs text-[#68647A]">Original rows are preserved. Nexora will save the sheet name and mapping with the dataset.</p></div><button type="button" disabled={busy} onClick={() => void importData()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17153B] px-5 py-3 text-sm font-medium text-white disabled:opacity-60">{busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</> : <>Connect {sheets.length} {sheets.length === 1 ? "sheet" : "sheets"} <ArrowRight className="h-4 w-4" /></>}</button></div>
            </div>
          </div>
        </section>}

        {step === 3 && <section className="mt-7 rounded-3xl border border-[#E7E4EF] bg-white p-8 text-center sm:p-12"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF6F1] text-[#286B54]"><CheckCircle2 className="h-7 w-7" /></div><p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#433D8B]">Connected</p><h2 className="mt-2 text-2xl font-semibold text-[#17153B]">Your workbook is now part of Nexora.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#68647A]">Each worksheet was imported separately, so Orders, Customers, Products, Inventory and the other business contexts can be analysed independently and correlated later.</p><button type="button" onClick={reset} className="mt-7 rounded-xl bg-[#17153B] px-5 py-3 text-sm font-medium text-white">Connect another file</button></section>}
      </div>
    </div>
  )
}
