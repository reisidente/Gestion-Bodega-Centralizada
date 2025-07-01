import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { FormField } from "../ui/form/form-field";
import { BaseModal } from "./base";

interface EditarProveedorModalProps {
  open: boolean;
  onClose: () => void;
  proveedor: any; // El proveedor a editar
  onEditar: (form: {
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
  }) => Promise<void>;
}

export function EditarProveedorModal({
  open,
  onClose,
  proveedor,
  onEditar,
}: EditarProveedorModalProps) {
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Cargar datos del proveedor cuando el modal se abre o el proveedor cambia
  useEffect(() => {
    if (proveedor) {
      setForm({
        nombre: proveedor.nombre || "",
        direccion: proveedor.direccion || "",
        telefono: proveedor.telefono || "",
        email: proveedor.email || "",
      });
    }
  }, [proveedor]);

  if (!open) return null;

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.nombre || !form.direccion || !form.telefono || !form.email) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    // Validación de Email con Regex corregida
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(form.email)) {
      setError("El formato del email no es válido.");
      return;
    }

    // Validación de teléfono para varchar(20) (permite números, +, -, (), espacios)
    const phoneRegex = /^[+\d\s()-]{7,20}$/;
    if (!phoneRegex.test(form.telefono)) {
      setError("El teléfono debe ser válido (entre 7 y 20 caracteres).");
      return;
    }

    setIsLoading(true);
    try {
      await onEditar(form);
      onClose();
    } catch (err: any) {
      setError("Error al editar el proveedor: " + (err.message || err));
    }
    setIsLoading(false);
  };

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-md">
      <h2 className="text-xl font-semibold text-center mb-4">Editar Proveedor</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Nombre del Proveedor"
          value={form.nombre}
          onChange={(val) => handleChange("nombre", val)}
          placeholder="Ej: Farmacias Cruz Verde"
        />
        <FormField
          label="Dirección"
          value={form.direccion}
          onChange={(val) => handleChange("direccion", val)}
          placeholder="Ej: Av. Siempre Viva 123"
        />
        <FormField
          label="Teléfono"
          value={form.telefono}
          onChange={(val) => handleChange("telefono", val)}
          placeholder="Ej: 912345678"
        />
        <FormField
          label="Email"
          type="email"
          value={form.email}
          onChange={(val) => handleChange("email", val)}
          placeholder="Ej: contacto@proveedor.com"
        />

        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
