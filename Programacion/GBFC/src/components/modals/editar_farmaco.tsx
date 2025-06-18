import React, { useEffect, useState } from "react";
import { BaseModal } from "./base";
import { supabase } from "../../libs/supabase";

interface EditarFarmacoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (form: any) => void;
  initialData: any;
}

export function EditFarmacoModal({
  open,
  onClose,
  onSave,
  initialData,
}: EditarFarmacoModalProps) {
  const [form, setForm] = useState({
    nombre: "",
    categoria: "",
    codigo: "",
    uni_medida: "",
    precio: "",
  });
  const [categorias, setCategorias] = useState<string[]>([]);

  // Cargar categorías únicas del sistema
  useEffect(() => {
    const fetchCategorias = async () => {
      const { data } = await supabase
        .from("farmaco")
        .select("categoria")
        .not("categoria", "is", null);

      if (data) {
        const uniqueCategorias = Array.from(
          new Set(data.map((item) => item.categoria))
        );
        setCategorias(uniqueCategorias);
      }
    };
    fetchCategorias();
  }, []);

  // Actualizamos el formulario cuando cambian los datos iniciales
  useEffect(() => {
    if (initialData) {
      setForm({
        nombre: initialData.nombre || "",
        categoria: initialData.categoria || "",
        codigo: initialData.codigo || "",
        uni_medida: initialData.uni_medida || "",
        precio: initialData.precio || "",
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-lg">
      <form onSubmit={handleSubmit}>
        <h2 className="font-semibold text-2xl mb-1">Editar Fármaco</h2>
        <p className="text-gray-500 mb-6">
          Modifique los datos del fármaco seleccionado
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Código</label>
            <input
              name="codigo"
              value={form.codigo}
              className="w-full border rounded-md px-3 py-2 bg-gray-100"
              readOnly
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Nombre</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Categoría</label>
            <select
              name="categoria"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              required
            >
              <option value="">Seleccione una categoría</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Unidad de Medida</label>
            <input
              name="uni_medida"
              value={form.uni_medida}
              onChange={(e) => setForm({ ...form, uni_medida: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Precio</label>
            <input
              name="precio"
              type="number"
              value={form.precio}
              onChange={(e) => setForm({ ...form, precio: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-8">
          <button
            type="button"
            className="px-6 py-2 rounded-md border border-gray-300 bg-white text-gray-900 font-medium hover:bg-gray-50"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 rounded-md bg-black text-white font-medium hover:bg-gray-900"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </BaseModal>
  );
}