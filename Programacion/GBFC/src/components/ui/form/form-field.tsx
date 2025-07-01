import { motion } from "framer-motion"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "../button"
import { Input } from "../input"
import { Label } from "../label"

interface FormFieldProps {
  label: string
  type?: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  error?: string
  showPasswordToggle?: boolean
  onTogglePassword?: () => void
  required?: boolean
}

export function FormField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  showPasswordToggle = false,
  onTogglePassword,
  required = true, // Por defecto, los campos son requeridos
}: FormFieldProps) {
  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Label htmlFor={label.toLowerCase()} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={label.toLowerCase()}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${error ? "border-red-500" : ""}`}
          required={required} // Aplicar el prop 'required'
        />
        {showPasswordToggle && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-transparent"
            onClick={onTogglePassword}
          >
            {type === "password" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="text-xs text-red-500"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  )
}
