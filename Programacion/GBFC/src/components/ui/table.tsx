import type { ReactNode } from "react"

interface Column<T> {
  header: string
  render: (item: T) => ReactNode
  className?: string
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
  return (
    <div className="bg-white rounded-xl shadow border overflow-x-auto overflow-visible">
      <table className={`w-full min-w-[${minWidth}]`}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={`text-left px-4 py-3 font-medium text-gray-700 ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item, idx) => (
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