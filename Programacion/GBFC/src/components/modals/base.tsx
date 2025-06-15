import type { ReactNode } from "react"

interface BaseModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  widthClass?: string
}

export function BaseModal({ open, onClose, children, widthClass = "max-w-xl" }: BaseModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        className={`relative bg-white rounded-xl shadow-xl w-full ${widthClass}`}
        style={{ maxHeight: "90vh", overflow: "auto" }}
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  )
}