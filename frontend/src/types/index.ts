export type Role = 'ADMIN' | 'MANAGER' | 'OPERATOR'
export type ProductType = 'MATERIE_PRIMA' | 'GATA_ASAMBLARE' | 'ASAMBLAT'
export type Unit = 'BUC' | 'MP' | 'ML' | 'KG' | 'M3' | 'L'
export type MovementType = 'RECEPTIE' | 'PRODUCTIE' | 'VANZARE' | 'TRANSFER' | 'DESEURI' | 'INVENTARIERE'

export type User = {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  createdAt?: string
}

export type Product = {
  id:          string
  name:        string
  type:        ProductType
  unit:        Unit
  description?: string
  minStock:    number
  active:      boolean
  stock?:      StockEntry[]
}

export type Warehouse = {
  id: string
  name: string
  code: string
  location?: string
  description?: string
  active: boolean
  stock?: StockEntry[]
}

export type StockEntry = {
  id: string
  productId: string
  warehouseId: string
  quantity: number
  product: Product
  warehouse: Warehouse
}

export type MovementLine = {
  id: string
  productId: string
  fromWarehouseId?: string
  toWarehouseId?: string
  quantity: number
  product?: Product
}

export type Movement = {
  id: string
  type: MovementType
  date: string
  note?: string
  userId: string
  user: { id: string; name: string }
  lines: MovementLine[]
  createdAt: string
}

export type StockSummary = {
  id: string
  name: string
  code: string
  location?: string
  productCount: number
  totalQty: number
}
