"use client"

import { useCallback, useRef, useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Business = {
  id: string
  name: string
  currencyCode: string
}

type Dataset = {
  id: string
  name: string
  file_name: string | null
  row_count: number | null
  column_count: number | null
  status: string
  created_at: string
}

type ParsedData = {
  headers: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  columnCount: number
  fileName: string
  size: number
}

type ColumnType = "date" | "number" | "text" | "boolean"

type ColumnInfo = {
  name: string
  type: ColumnType
  missing: number
  examples: string[]
}

type DatasetKind =
  | "sales"
  | "products"
  | "inventory"
  | "suppliers"
  | "customers"
  | "finance"
  | "other"

const kinds: { value: DatasetKind; label: string; description: string }[] = [
  { value: "sales", label: "Sales / orders", description: "Orders, revenue, quantities, customers or products" },
  { value: "products", label: "Products", description: "Product catalogue, SKUs, pricing and categories" },
  { value: "inventory", label: "Inventory", description: "Stock levels, warehouses and reorder points" },
  { value: "suppliers", label: "Suppliers", description: "Supplier records, lead times and reliability" },
  { value: "customers", label: "Customers", description: "Customer or account information" },
  { value: "finance", label: "Finance", description: "Invoices, payments, expenses or financial records" },
  { value: "other", label: "Other", description: "A dataset that does not fit these areas" },
]

const fieldAliases: Record<string, string[]> = {
  date: ["date", "order_date", "order date", "invoice_date", "transaction_date", "created_at"],
  name: ["name", "product_name", "product name", "customer", "customer_name", "supplier", "supplier_name"],
  product: ["product", "product_id", "product id", "item", "item_id", "item id"],
  sku: ["sku", "product_code", "product code", "item_code", "item code"],
  quantity: ["qty", "quantity", "units", "unit", "stock", "stock_qty", "stock quantity"],
  revenue: ["revenue", "sales", "amount", "total", "total_amount", "total amount", "net_sales"],
  price: ["price", "unit_price", "unit price", "selling_price", "selling price"],
  cost: ["cost", "unit_cost", "unit cost", "purchase_cost"],
  customer: ["customer", "customer_name", "customer name", "client", "account"],
  supplier: ["supplier", "supplier_name", "supplier name", "vendor", "vendor_name"],
  category: ["category", "product_category", "product category", "segment"],
  warehouse: ["warehouse", "location", "store", "branch"],
  reorder: ["reorder_level", "reorder level", "reorder_point", "reorder point", "min_stock", "minimum stock"],
}

function normaliseHeader(value: string, index: number) {
  const cleaned = value.trim().replace(/\s+/g, " ")
  return cleaned || `Column ${index + 1}`
}

function inferType(values: unknown[], header: string): ColumnType {
  const sample = values.filter((value) => value !== null && value !== undefined && String(value).trim() !== "").slice(0, 100)
  if (!sample.length) return "text"

  const normalizedHeader = header.toLowerCase().trim().replace(/[_-]+/g, " ")
  const isIdentifier =
    /(^| )(id|code|sku|key)$/.test(normalizedHeader) ||
    normalizedHeader.endsWith(" id") ||
    normalizedHeader.endsWith(" code") ||
    normalizedHeader.endsWith(" sku")

  if (isIdentifier) return "text"

  const booleanCount = sample.filter((value) => ["true", "false", "yes", "no"].includes(String(value).toLowerCase())).length
  if (booleanCount / sample.length >= 0.9) return "boolean"

  const numberCount = sample.filter((value) => {
    if (typeof value === "number") return Number.isFinite(value)
    const cleaned = String(value).replace(/[₹$€£,%\s,]/g, "")
    return cleaned !== "" && Number.isFinite(Number(cleaned))
  }).length
  if (numberCount / sample.length >= 0.9) return "number"

  const dateCount = sample.filter((value) => {
    if (value instanceof Date) return !Number.isNaN(value.getTime())
    const text = String(value)
    return /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(text) || (!Number.isNaN(Date.parse(text)) && /[-/]/.test(text))
  }).length
  if (dateCount / sample.length >= 0.8) return "date"

  return "text"
}

function analyseColumns(parsed: ParsedData): ColumnInfo[] {
  return parsed.headers.map((header) => {
    const values = parsed.rows.map((row) => row[header])
    const missing = values.filter((value) => value === null || value === undefined || String(value).trim() === "").length
    return {
      name: header,
      type: inferType(values, header),
      missing,
      examples: values.filter((value) => value !== null && value !== undefined && String(value).trim() !== "").slice(0, 3).map(String),
    }
  })
}

function similarity(header: string, aliases: string[]) {
  const normal = header.toLowerCase().trim().replace(/[_-]+/g, " ")
  return aliases.some((alias) => normal === alias || normal.includes(alias))
}

function suggestMapping(headers: string[], kind: DatasetKind) {
  const mapping: Record<string, string> = {}
  const relevant = kind === "sales"
    ? ["date", "customer", "product", "name", "quantity", "revenue", "price", "sku"]
    : kind === "inventory"
      ? ["name", "sku", "quantity", "reorder", "cost", "warehouse"]
      : kind === "products"
        ? ["name", "sku", "category", "price", "cost"]
        : kind === "suppliers"
          ? ["supplier", "name", "location"]
          : kind === "customers"
            ? ["customer", "name", "location"]
            : kind === "finance"
              ? ["date", "customer", "revenue", "cost"]
              : []

  for (const header of headers) {
    const key = relevant.find((candidate) => similarity(header, fieldAliases[candidate]))
    if (key && !Object.values(mapping).includes(key)) mapping[header] = key
  }
  return mapping
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function displayValue(value: unknown) {
  if (value === null || value === undefined) return "—"

  if (value instanceof Date) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, "0")
    const day = String(value.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  return String(value)
}

function isDateHeader(header: string) {
  const normal = header.toLowerCase().trim().replace(/[_-]+/g, " ")
  return /(^| )(date|datetime|timestamp|day)$/.test(normal) ||
    normal.includes(" order date") ||
    normal.includes(" transaction date") ||
    normal.includes(" invoice date") ||
    normal.includes(" created at") ||
    normal.includes(" updated at")
}

function normaliseExcelValue(value: unknown, header: string, XLSX: typeof import("xlsx")) {
  if (value === null || value === undefined || value === "") return value

  // With cellDates:false, Excel dates remain serial numbers. Convert them
  // using SheetJS' calendar decoder, never JavaScript Date timezone conversion.
  if (typeof value === "number" && isDateHeader(header)) {
    const decoded = XLSX.SSF.parse_date_code(value)
    if (decoded && decoded.y && decoded.m && decoded.d) {
      const month = String(decoded.m).padStart(2, "0")
      const day = String(decoded.d).padStart(2, "0")
      return `${decoded.y}-${month}-${day}`
    }
  }

  return value
}

export default function DataHub({ business, datasets }: { business: Business; datasets: Dataset[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = useState<ParsedData | null>(null)
  const [columns, setColumns] = useState<ColumnInfo[]>([])
  const [kind, setKind] = useState<DatasetKind>("sales")
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const parseFile = useCallback(async (file: File) => {
    setBusy(true)
    setError(null)
    setSuccess(null)

    try {
      const lower = file.name.toLowerCase()
      if (!lower.endsWith(".csv") && !lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
        throw new Error("Use a CSV, XLSX, or XLS file.")
      }
      if (file.size > 20 * 1024 * 1024) {
        throw new Error("For this first import, keep files under 20 MB.")
      }

      const XLSX = await import("xlsx")
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array", cellDates: false })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      if (!firstSheet) throw new Error("The workbook does not contain a readable sheet.")

      const raw = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: null, raw: true }) as unknown[][]
      if (!raw.length) throw new Error("This file appears to be empty.")

      const headerRow = raw.find((row: unknown[]) => row.some((cell: unknown) => cell !== null && String(cell).trim() !== ""))
      if (!headerRow) throw new Error("No column headers were found.")
      const headerIndex = raw.indexOf(headerRow)
      const headers = (headerRow as unknown[]).map((cell: unknown, index: number) => normaliseHeader(String(cell ?? ""), index))
      const uniqueHeaders = headers.map((header, index) => {
        const sameBefore = headers.slice(0, index).filter((item) => item === header).length
        return sameBefore ? `${header} ${sameBefore + 1}` : header
      })
      const rows = raw.slice(headerIndex + 1).filter((row: unknown[]) => row.some((cell: unknown) => cell !== null && String(cell).trim() !== "")).map((row: unknown[]) => {
        const record: Record<string, unknown> = {}
        uniqueHeaders.forEach((header, index) => {
          const value = (row as unknown[])[index] ?? null
          record[header] = normaliseExcelValue(value, header, XLSX)
        })
        return record
      })

      if (!rows.length) throw new Error("The file has headers but no data rows.")
      const nextParsed = { headers: uniqueHeaders, rows, rowCount: rows.length, columnCount: uniqueHeaders.length, fileName: file.name, size: file.size }
      setParsed(nextParsed)
      setColumns(analyseColumns(nextParsed))
      setMapping(suggestMapping(uniqueHeaders, kind))
      setStep(2)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The file could not be read.")
    } finally {
      setBusy(false)
    }
  }, [kind])

  const chooseKind = (next: DatasetKind) => {
    setKind(next)
    if (parsed) setMapping(suggestMapping(parsed.headers, next))
  }

  const importData = async () => {
    if (!parsed) return
    setBusy(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Your session has expired. Please log in again.")

      const schemaDefinition = {
        dataset_type: kind,
        columns: columns.map((column) => ({ ...column, examples: column.examples.slice(0, 3) })),
        mapping,
        preview_rows: parsed.rows.slice(0, 5),
        parser: "xlsx",
      }

      const { data: dataset, error: datasetError } = await supabase
        .from("datasets")
        .insert({
          business_id: business.id,
          name: parsed.fileName.replace(/\.(csv|xlsx|xls)$/i, ""),
          source_type: "upload",
          file_name: parsed.fileName,
          file_size: parsed.size,
          row_count: parsed.rowCount,
          column_count: parsed.columnCount,
          status: "processing",
          schema_definition: schemaDefinition,
          created_by: user.id,
        })
        .select("id")
        .single()

      if (datasetError || !dataset) throw new Error(datasetError?.message || "Dataset could not be created.")

      const { data: importRecord, error: importError } = await supabase
        .from("data_imports")
        .insert({
          business_id: business.id,
          dataset_id: dataset.id,
          file_name: parsed.fileName,
          status: "processing",
          rows_detected: parsed.rowCount,
          mapping,
          created_by: user.id,
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (importError || !importRecord) throw new Error(importError?.message || "Import could not be started.")

      const chunkSize = 500
      let imported = 0
      for (let start = 0; start < parsed.rows.length; start += chunkSize) {
        const chunk = parsed.rows.slice(start, start + chunkSize).map((row, offset) => ({
          business_id: business.id,
          dataset_id: dataset.id,
          row_number: start + offset + 2,
          row_data: row,
        }))
        const { error: rowsError } = await supabase.from("dataset_rows").insert(chunk)
        if (rowsError) throw new Error(rowsError.message)
        imported += chunk.length
      }

      const now = new Date().toISOString()
      const { error: updateImportError } = await supabase
        .from("data_imports")
        .update({ status: "completed", rows_imported: imported, completed_at: now })
        .eq("id", importRecord.id)
      if (updateImportError) throw new Error(updateImportError.message)

      const { error: updateDatasetError } = await supabase
        .from("datasets")
        .update({ status: "ready" })
        .eq("id", dataset.id)
      if (updateDatasetError) throw new Error(updateDatasetError.message)

      setSuccess(`${imported.toLocaleString()} rows are now connected to Nexora.`)
      setStep(3)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The import failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F0F8]">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs text-[#68647A]">
          <span>Workspace</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-[#17153B]">Data Hub</span>
        </div>

        <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">Data Hub</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#17153B] sm:text-4xl">Connect your business data.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#68647A]">Upload a spreadsheet, let Nexora understand its shape, then decide how it should be used across your workspace.</p>
          </div>
          <div className="rounded-2xl border border-[#E7E4EF] bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#68647A]/60">Workspace</p>
            <p className="mt-1 max-w-[220px] truncate text-sm font-medium text-[#17153B]">{business.name}</p>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-2 text-xs text-[#68647A]">
          {["Upload", "Understand", "Connect"].map((label, index) => {
            const current = index + 1
            const complete = step > current
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={["flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold", complete ? "border-[#433D8B] bg-[#433D8B] text-white" : step === current ? "border-[#2E236C] bg-[#17153B] text-white" : "border-[#E7E4EF] bg-white text-[#9A94A8]"].join(" ")}>{complete ? <Check className="h-3.5 w-3.5" /> : current}</div>
                <span className={step === current ? "font-medium text-[#17153B]" : "text-[#68647A]"}>{label}</span>
                {index < 2 && <ArrowRight className="mx-1 h-3.5 w-3.5 text-[#9A94A8]/50" />}
              </div>
            )
          })}
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#B85454]/20 bg-[#B85454]/5 p-4 text-sm text-[#8D3F3F]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button>
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#3C8F70]/20 bg-[#3C8F70]/5 p-4 text-sm text-[#286B54]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {!parsed && step === 1 && (
          <section className="mt-7 grid gap-5 lg:grid-cols-[1fr_330px]">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) void parseFile(file) }}
              className={["min-h-[360px] rounded-3xl border-2 border-dashed p-8 text-center transition-all", dragging ? "border-[#433D8B] bg-[#C8ACD6]/15" : "border-[#D9D5E4] bg-white hover:border-[#433D8B]/50 hover:bg-white"].join(" ")}
            >
              <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void parseFile(file); event.currentTarget.value = "" }} />
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0EEF6] text-[#433D8B]"><Upload className="h-7 w-7" /></div>
              <h2 className="mt-6 text-xl font-semibold text-[#17153B]">Drop your spreadsheet here</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68647A]">CSV, XLSX and XLS files are supported. Nexora reads the file in your browser before anything is imported.</p>
              <span className="mt-6 inline-flex rounded-xl bg-[#17153B] px-5 py-3 text-sm font-medium text-white">Browse files</span>
              <p className="mt-4 text-xs text-[#9A94A8]">Maximum 20 MB for this import.</p>
              {busy && <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#433D8B]"><Loader2 className="h-4 w-4 animate-spin" /> Reading file…</div>}
            </button>

            <aside className="rounded-3xl border border-[#E7E4EF] bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EEF6] text-[#433D8B]"><FileSpreadsheet className="h-5 w-5" /></div>
              <h2 className="mt-5 text-lg font-semibold text-[#17153B]">What happens next?</h2>
              <div className="mt-5 space-y-5">
                {[["01", "We inspect", "Columns, types, missing values and a small preview."], ["02", "You confirm", "Tell Nexora what the dataset represents and review the mapping."], ["03", "We connect", "The original rows and schema are saved to your workspace."]].map(([number, title, description]) => (
                  <div key={number} className="flex gap-3"><span className="text-[10px] font-semibold tracking-[0.15em] text-[#C8ACD6]">{number}</span><div><p className="text-sm font-medium text-[#17153B]">{title}</p><p className="mt-1 text-xs leading-5 text-[#68647A]">{description}</p></div></div>
                ))}
              </div>
            </aside>
          </section>
        )}

        {parsed && step === 2 && (
          <section className="mt-7 space-y-5">
            <div className="rounded-3xl border border-[#E7E4EF] bg-white p-6 sm:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EEF6] text-[#433D8B]"><FileText className="h-5 w-5" /></div><div><h2 className="font-semibold text-[#17153B]">{parsed.fileName}</h2><p className="mt-1 text-xs text-[#68647A]">{parsed.rowCount.toLocaleString()} rows · {parsed.columnCount} columns · {formatBytes(parsed.size)}</p></div></div>
                <button type="button" onClick={() => { setParsed(null); setColumns([]); setMapping({}); setStep(1); setSuccess(null); setError(null) }} className="text-xs font-medium text-[#68647A] hover:text-[#17153B]">Choose another file</button>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[['Rows', parsed.rowCount.toLocaleString()], ['Columns', String(parsed.columnCount)], ['Detected fields', String(columns.filter((column) => column.type !== 'text').length)]].map(([label, value]) => <div key={label} className="rounded-2xl border border-[#E7E4EF] bg-[#F1F0F8]/55 p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-[#68647A]/60">{label}</p><p className="mt-2 text-xl font-semibold text-[#17153B]">{value}</p></div>)}
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
              <div className="rounded-3xl border border-[#E7E4EF] bg-white p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#433D8B]">1 · Context</p>
                <h2 className="mt-2 text-xl font-semibold text-[#17153B]">What does this data represent?</h2>
                <p className="mt-2 text-sm leading-6 text-[#68647A]">This helps Nexora connect the dataset to the right part of your business.</p>
                <div className="mt-5 space-y-2">
                  {kinds.map((option) => <button key={option.value} type="button" onClick={() => chooseKind(option.value)} className={["w-full rounded-2xl border p-4 text-left transition", kind === option.value ? "border-[#433D8B] bg-[#F0EEF6] shadow-sm" : "border-[#E7E4EF] hover:border-[#C8ACD6] hover:bg-[#F1F0F8]/50"].join(" ")}><div className="flex items-start gap-3"><span className={["mt-0.5 flex h-4 w-4 shrink-0 rounded-full border", kind === option.value ? "border-[#433D8B] bg-[#433D8B] ring-2 ring-[#C8ACD6]/40" : "border-[#B8B3C2]"].join(" ")}></span><span><span className="block text-sm font-medium text-[#17153B]">{option.label}</span><span className="mt-0.5 block text-xs leading-5 text-[#68647A]">{option.description}</span></span></div></button>)}
                </div>
              </div>

              <div className="rounded-3xl border border-[#E7E4EF] bg-white p-6">
                <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#433D8B]">2 · Understand</p><h2 className="mt-2 text-xl font-semibold text-[#17153B]">Nexora&apos;s first read</h2></div><p className="text-xs text-[#68647A]">Showing up to 100 sample rows</p></div>
                <div className="mt-5 overflow-x-auto rounded-2xl border border-[#E7E4EF]"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-[#F1F0F8]"><tr>{columns.map((column) => <th key={column.name} className="border-b border-[#E7E4EF] px-3 py-3 font-medium text-[#534B52]"><div>{column.name}</div><span className="mt-1 inline-block rounded-md bg-white px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[#433D8B]">{column.type}</span></th>)}</tr></thead><tbody>{parsed.rows.slice(0, 8).map((row, index) => <tr key={index} className="border-b border-[#E7E4EF] last:border-0">{columns.map((column) => <td key={column.name} className="max-w-[220px] truncate px-3 py-3 text-[#68647A]">{displayValue(row[column.name])}</td>)}</tr>)}</tbody></table></div>
                <div className="mt-6"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#433D8B]">3 · Mapping</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{columns.map((column) => <label key={column.name} className="flex items-center justify-between gap-3 rounded-xl border border-[#E7E4EF] px-3 py-2.5"><span className="min-w-0 truncate text-xs text-[#534B52]">{column.name}</span><select value={mapping[column.name] || "ignore"} onChange={(event) => setMapping((current) => ({ ...current, [column.name]: event.target.value }))} className="max-w-[150px] rounded-lg border border-[#E7E4EF] bg-white px-2 py-1.5 text-xs text-[#17153B] outline-none focus:border-[#433D8B]"><option value="ignore">Ignore</option><option value="date">Date</option><option value="name">Name</option><option value="product">Product</option><option value="sku">SKU</option><option value="quantity">Quantity</option><option value="revenue">Revenue</option><option value="price">Price</option><option value="cost">Cost</option><option value="customer">Customer</option><option value="supplier">Supplier</option><option value="category">Category</option><option value="warehouse">Warehouse</option><option value="reorder">Reorder level</option></select></label>)}</div></div>
                <div className="mt-6 flex flex-col justify-between gap-3 border-t border-[#E7E4EF] pt-5 sm:flex-row sm:items-center"><p className="text-xs leading-5 text-[#68647A]">Original rows are preserved. The mapping is saved with the dataset so later Nexora features can normalize it safely.</p><button type="button" disabled={busy} onClick={() => void importData()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#17153B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#2E236C] disabled:cursor-not-allowed disabled:opacity-60">{busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</> : <>Connect {parsed.rowCount.toLocaleString()} rows <ArrowRight className="h-4 w-4" /></>}</button></div>
              </div>
            </div>
          </section>
        )}

        {parsed && step === 3 && (
          <section className="mt-7 rounded-3xl border border-[#E7E4EF] bg-white p-8 text-center sm:p-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#3C8F70]/10 text-[#3C8F70]"><CheckCircle2 className="h-8 w-8" /></div>
            <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">Connected</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#17153B]">Your data is now part of Nexora.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#68647A]">The dataset, detected schema, mapping and original rows are stored in your workspace. This gives the Dashboard and Business Brain a reliable source to work from.</p>
            <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row"><a href="/dashboard" className="rounded-xl bg-[#17153B] px-5 py-3 text-sm font-medium text-white hover:bg-[#2E236C]">Back to dashboard</a><button type="button" onClick={() => { setParsed(null); setColumns([]); setMapping({}); setStep(1); setSuccess(null) }} className="rounded-xl border border-[#E7E4EF] px-5 py-3 text-sm font-medium text-[#534B52] hover:bg-[#F1F0F8]">Connect another dataset</button></div>
          </section>
        )}

        {datasets.length > 0 && (
          <section className="mt-8 rounded-3xl border border-[#E7E4EF] bg-white p-6">
            <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#433D8B]">Connected data</p><h2 className="mt-2 text-xl font-semibold text-[#17153B]">Your datasets</h2></div><span className="text-xs text-[#68647A]">{datasets.length} recent</span></div>
            <div className="mt-5 divide-y divide-[#E7E4EF]">{datasets.map((dataset) => <div key={dataset.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F0EEF6] text-[#433D8B]"><FileSpreadsheet className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-sm font-medium text-[#17153B]">{dataset.name}</p><p className="mt-1 text-xs text-[#68647A]">{dataset.file_name || "Uploaded dataset"} · {(dataset.row_count ?? 0).toLocaleString()} rows · {dataset.column_count ?? 0} columns</p></div></div><span className={["w-fit rounded-full px-2.5 py-1 text-[10px] font-medium capitalize", dataset.status === "ready" ? "bg-[#3C8F70]/10 text-[#286B54]" : dataset.status === "failed" ? "bg-[#B85454]/10 text-[#8D3F3F]" : "bg-[#C58A3A]/10 text-[#956521]"].join(" ")}>{dataset.status}</span></div>)}</div>
          </section>
        )}
      </div>
    </div>
  )
}
