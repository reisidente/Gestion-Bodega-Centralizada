import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { FormField } from "../ui/form/form-field";
import { BaseModal } from "./base";

interface RegistrarProveedorModalProps {
  open: boolean;
  onClose: () => void;
  onRegistrar: (form: {
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
  }) => Promise<void>;
}

export function RegistrarProveedorModal({
  open,
  onClose,
  onRegistrar,
}: RegistrarProveedorModalProps) {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      // Reset form when modal is closed
      setNombre("");
      setDireccion("");
      setTelefono("");
      setEmail("");
      setError("");
      setIsLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nombre || !direccion || !telefono || !email) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    // Validación de Email con Regex corregida
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      setError("El formato del email no es válido.");
      return;
    }

    // Validación de teléfono para varchar(20) (permite números, +, -, (), espacios)
    const phoneRegex = /^[+\d\s()-]{7,20}$/;
    if (!phoneRegex.test(telefono)) {
      setError("El teléfono debe ser válido (entre 7 y 20 caracteres).");
      return;
    }

    setIsLoading(true);
    try {
      await onRegistrar({
        nombre,
        direccion,
        telefono,
        email,
      });
      onClose(); // Close modal on successful registration
    } catch (err: any) {
      setError("Error al registrar proveedor: " + (err.message || err));
    }
    setIsLoading(false);
  };

  if (!open) return null;

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-md">
      <h2 className="text-xl font-semibold text-center mb-4">
        Registrar Nuevo Proveedor
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Nombre del Proveedor"
          value={nombre}
          onChange={setNombre}
          placeholder="Ej: Proveedor Farmacéutico S.A."
        />
        <FormField
          label="Dirección"
          value={direccion}
          onChange={setDireccion}
          placeholder="Ej: Av. Siempre Viva 123"
        />
        <FormField
          label="Teléfono"
          value={telefono}
          onChange={setTelefono}
          type="tel"
          placeholder="Ej: 912345678"
        />
        <FormField
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          placeholder="Ej: contacto@proveedor.com"
        />

        {error && <div className="text-red-500 text-sm text-center">{error}</div>}

        <div className="flex gap-2 justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Registrando..." : "Registrar Proveedor"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
