import { describe, it, expect } from 'vitest'
import { classifyDataset, classifyRows, rowsForDomain, detectRowSchema } from '@/lib/dataset-utils'
import type { DatasetInfo } from '@/lib/dataset-utils'

const makeDataset = (name: string, id = 'test-id'): DatasetInfo => ({
  id, name, fileName: null, rowCount: 10, status: 'ready', createdAt: '2024-01-01',
})

describe('classifyDataset', () => {
  it('classifies by name - orders', () => expect(classifyDataset(makeDataset('Orders'))).toBe('sales'))
  it('classifies by name - inventory', () => expect(classifyDataset(makeDataset('Stock List'))).toBe('inventory'))
  it('classifies by name - suppliers', () => expect(classifyDataset(makeDataset('Vendor Data'))).toBe('suppliers'))
  it('classifies by name - customers', () => expect(classifyDataset(makeDataset('Client Accounts'))).toBe('customers'))
  it('classifies by name - products', () => expect(classifyDataset(makeDataset('Product Catalog'))).toBe('products'))
  it('classifies by name - finance', () => expect(classifyDataset(makeDataset('Expenses 2024'))).toBe('finance'))
  it('classifies by name - projects', () => expect(classifyDataset(makeDataset('Project List'))).toBe('projects'))
  it('returns other for unknown', () => expect(classifyDataset(makeDataset('Sheet1'))).toBe('other'))
  
  it('uses column hints when name is ambiguous', () => {
    const result = classifyDataset(makeDataset('Sheet1'), { order_id: '001', total_amount: 100, customer_id: 'C1' })
    expect(result).toBe('sales')
  })
})

describe('classifyRows', () => {
  it('classifies rows per dataset independently', () => {
    const datasets: DatasetInfo[] = [
      makeDataset('Orders', 'ds-1'),
      makeDataset('Inventory', 'ds-2'),
    ]
    const storedRows = [
      { dataset_id: 'ds-1', row_number: 1, row_data: { order_id: '001', revenue: 100 } },
      { dataset_id: 'ds-2', row_number: 1, row_data: { product: 'A', stock_qty: 50 } },
    ]
    const classified = classifyRows(datasets, storedRows)
    expect(classified[0].datasetKind).toBe('sales')
    expect(classified[1].datasetKind).toBe('inventory')
  })

  it('does not contaminate schemas across datasets', () => {
    const datasets: DatasetInfo[] = [
      makeDataset('Sales Data', 'ds-sales'),
      makeDataset('Stock Data', 'ds-stock'),
    ]
    const storedRows = [
      { dataset_id: 'ds-sales', row_number: 1, row_data: { revenue: 500, order_id: 'O1' } },
      { dataset_id: 'ds-stock', row_number: 1, row_data: { product: 'Widget', quantity: 25 } },
    ]
    const classified = classifyRows(datasets, storedRows)
    const salesRows = rowsForDomain(classified, 'sales')
    const inventoryRows = rowsForDomain(classified, 'inventory')
    expect(salesRows).toHaveLength(1)
    expect(salesRows[0]).toHaveProperty('revenue', 500)
    // Stock data should NOT appear in sales
    expect(inventoryRows).toHaveLength(1)
    expect(inventoryRows[0]).toHaveProperty('quantity', 25)
  })
})

describe('detectRowSchema', () => {
  it('detects revenue key', () => {
    const schema = detectRowSchema({ Amount: 100, OrderDate: '2024-01-01' })
    expect(schema.revenue).toBe('Amount')
  })

  it('detects date key', () => {
    const schema = detectRowSchema({ 'Transaction Date': '2024-01-01', Revenue: 100 })
    expect(schema.date).toBe('Transaction Date')
  })

  it('returns null for missing fields', () => {
    const schema = detectRowSchema({ foo: 'bar' })
    expect(schema.revenue).toBeNull()
    expect(schema.orderId).toBeNull()
    expect(schema.date).toBeNull()
  })
})
