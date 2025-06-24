import type { ReactNode } from "react"
import { useState } from "react"

interface Column<T> {
  header: string
  render: (item: T) => ReactNode
  className?: string
  sortKey?: keyof T
}

interface TableContainerProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  minWidth?: string
}

export function TableContainer<T>({
  columns,
  data,
  emptyMessage = "No hay datos para mostrar.",
  minWidth = "700px",
}: TableContainerProps<T>) {
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (col: Column<T>, idx: number) => {
    if (!col.sortKey) return
    if (sortBy === col.sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col.sortKey as string)
      setSortDir('asc')
    }
  }

  let sortedData = data
  if (sortBy) {
    sortedData = [...data].sort((a, b) => {
      const aValue = a[sortBy as keyof T]
      const bValue = b[sortBy as keyof T]
      if (aValue == null) return 1
      if (bValue == null) return -1
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDir === 'asc' ? aValue - bValue : bValue - aValue
      }
      return sortDir === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })
  }

  return (
    <div className="bg-white rounded-xl shadow border overflow-x-auto overflow-visible">
      <table className={`w-full min-w-[${minWidth}]`}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={`text-left px-4 py-3 font-medium text-gray-700 cursor-pointer select-none ${col.className || ""}`}
                onClick={() => handleSort(col, i)}
              >
                <span className="flex items-center gap-1">
                  {col.header}
                  {col.sortKey && sortBy === col.sortKey && (
                    <span>{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length > 0 ? (
            sortedData.map((item, idx) => (
              <tr
                key={idx}
                className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                {columns.map((col, i) => (
                  <td key={i} className={`px-4 py-3 ${col.className || ""}`}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center text-gray-500 py-8">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}