import React, { useEffect, useState } from "react";
import { BaseModal } from "./base";
import { supabase } from "../../libs/supabase";

interface EditarFarmacoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (form: any) => void;
  initialData: any;
}

const unidadesMedidaComunes = [
  "mg", // miligramos
  "g", // gramos
  "kg", // kilogramos
  "mcg", // microgramos
  "ng", // nanogramos
  "ml", // mililitros
  "l", // litros
  "cl", // centilitros
  "μl", // microlitros
  "UI", // unidades internacionales
  "mEq", // miliequivalentes
  "mOsm", // miliosmoles
  "kUI", // kilo unidades internacionales
  "MUI", // millones de unidades internacionales
  "%", // porcentaje
  "ppm", // partes por millón
  "mg/ml",
  "g/100ml",
  "mg/g",
  "μg/ml",
  "UI/ml",
  "mEq/ml",
  "Otro"
]

const presentacionesComunes = [
  "Tableta",
  "Comprimido",
  "Comprimido recubierto",
  "Comprimido efervescente",
  "Comprimido masticable",
  "Comprimido de liberación prolongada",
  "Cápsula",
  "Cápsula de gelatina dura",
  "Cápsula de gelatina blanda",
  "Cápsula de liberación prolongada",
  "Gragea",
  "Pastilla",
  "Sello",
  "Polvo para suspensión oral",
  "Granulado",
  "Granulado efervescente",
  "Jarabe",
  "Suspensión oral",
  "Solución oral",
  "Gotas orales",
  "Elixir",
  "Emulsión oral",
  "Inyectable",
  "Solución inyectable",
  "Suspensión inyectable",
  "Polvo para inyección",
  "Ampolla",
  "Vial",
  "Jeringa precargada",
  "Bolsa para infusión",
  "Frasco para infusión",
  "Crema",
  "Pomada",
  "Gel",
  "Loción",
  "Ungüento",
  "Pasta",
  "Emulsión tópica",
  "Spray tópico",
  "Solución tópica",
  "Tintura",
  "Colirio",
  "Solución oftálmica",
  "Suspensión oftálmica",
  "Pomada oftálmica",
  "Gel oftálmico",
  "Gotas óticas",
  "Solución ótica",
  "Suspensión ótica",
  "Spray nasal",
  "Gotas nasales",
  "Solución nasal",
  "Gel nasal",
  "Supositorio",
  "Óvulo",
  "Crema vaginal",
  "Gel vaginal",
  "Tableta vaginal",
  "Parche transdérmico",
  "Inhalador",
  "Nebulización",
  "Aerosol",
  "Dispositivo transdérmico",
  "Implante",
  "Chicle medicinal",
  "Película oral",
  "Otro"
]

export function EditFarmacoModal({
  open,
  onClose,
  onSave,
  initialData,
}: EditarFarmacoModalProps) {
  const [form, setForm] = useState({
    nombre_comercial: "",
    nombre_generico: "",
    categoria: "",
    codigo: "",
    uni_medida: "",
    principio_activo: "",
    presentacion: "",
    concentracion: "",
    via_administracion: "",
    observacion: "",
    precio: "",
  });
  const [categorias, setCategorias] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [unidadPersonalizada, setUnidadPersonalizada] = useState("");
  const [mostrarUnidadPersonalizada, setMostrarUnidadPersonalizada] = useState(false);
  const [presentacionPersonalizada, setPresentacionPersonalizada] = useState("");
  const [mostrarPresentacionPersonalizada, setMostrarPresentacionPersonalizada] = useState(false);

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
    if (initialData && open) {
      setForm({
        nombre_comercial: initialData.nombre_comercial || "",
        nombre_generico: initialData.nombre_generico || "",
        categoria: initialData.categoria || "",
        codigo: initialData.codigo || "",
        uni_medida: initialData.uni_medida || "",
        principio_activo: initialData.principio_activo || "",
        presentacion: initialData.presentacion || "",
        concentracion: initialData.concentracion?.toString() || "",
        via_administracion: initialData.via_administracion || "",
        observacion: initialData.observacion || "",
        precio: initialData.precio?.toString() || "",
      });

      // Configurar estados para campos personalizados
      const unidadExisteEnComunes = unidadesMedidaComunes.includes(initialData.uni_medida);
      if (!unidadExisteEnComunes && initialData.uni_medida) {
        setMostrarUnidadPersonalizada(true);
        setUnidadPersonalizada(initialData.uni_medida);
      } else {
        setMostrarUnidadPersonalizada(false);
        setUnidadPersonalizada("");
      }

      const presentacionExisteEnComunes = presentacionesComunes.includes(initialData.presentacion);
      if (!presentacionExisteEnComunes && initialData.presentacion) {
        setMostrarPresentacionPersonalizada(true);
        setPresentacionPersonalizada(initialData.presentacion);
      } else {
        setMostrarPresentacionPersonalizada(false);
        setPresentacionPersonalizada("");
      }
    }
  }, [initialData, open]);

  // Reiniciar errores cuando se abre el modal
  useEffect(() => {
    if (open) {
      setError("");
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleConcentracionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    // Solo permitir números y punto decimal
    const regex = /^[0-9]*\.?[0-9]*$/;
    if (regex.test(valor) || valor === "") {
      setForm({ ...form, concentracion: valor });
    }
  };

  const handleUnidadMedidaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const valor = e.target.value;
    if (valor === "Otro") {
      setMostrarUnidadPersonalizada(true);
      setForm({ ...form, uni_medida: "" });
    } else {
      setMostrarUnidadPersonalizada(false);
      setUnidadPersonalizada("");
      setForm({ ...form, uni_medida: valor });
    }
  };

  const handleUnidadPersonalizadaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setUnidadPersonalizada(valor);
    setForm({ ...form, uni_medida: valor });
  };

  const handlePresentacionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const valor = e.target.value;
    if (valor === "Otro") {
      setMostrarPresentacionPersonalizada(true);
      setForm({ ...form, presentacion: "" });
    } else {
      setMostrarPresentacionPersonalizada(false);
      setPresentacionPersonalizada("");
      setForm({ ...form, presentacion: valor });
    }
  };

  const handlePresentacionPersonalizadaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setPresentacionPersonalizada(valor);
    setForm({ ...form, presentacion: valor });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      // Validar unidad de medida personalizada
      if (mostrarUnidadPersonalizada && unidadPersonalizada.trim()) {
        const unidadesExistentes = unidadesMedidaComunes.filter(u => u !== "Otro").map(u => u.toLowerCase());
        if (unidadesExistentes.includes(unidadPersonalizada.toLowerCase().trim())) {
          setError("La unidad de medida personalizada ya existe en las opciones comunes");
          return;
        }
      }

      // Validar presentación personalizada
      if (mostrarPresentacionPersonalizada && presentacionPersonalizada.trim()) {
        const presentacionesExistentes = presentacionesComunes.filter(p => p !== "Otro").map(p => p.toLowerCase());
        if (presentacionesExistentes.includes(presentacionPersonalizada.toLowerCase().trim())) {
          setError("La presentación personalizada ya existe en las opciones comunes");
          return;
        }
      }

      onSave(form);
    } catch (err) {
      setError("Error inesperado al validar los datos");
    }
  };

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-4xl">
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
            <small className="text-gray-500">El código no se puede modificar</small>
          </div>
          <div>
            <label className="block font-medium mb-1">Nombre Comercial</label>
            <input
              name="nombre_comercial"
              value={form.nombre_comercial}
              onChange={handleChange}
              placeholder="Ej: Paracetamol, Ibuprofeno, Aspirina"
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Nombre Genérico</label>
            <input
              name="nombre_generico"
              value={form.nombre_generico}
              onChange={handleChange}
              placeholder="Ej: Acetaminofén, Ácido acetilsalicílico"
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
            <label className="block font-medium mb-1">Unidad de medida</label>
            <select
              value={mostrarUnidadPersonalizada ? "Otro" : form.uni_medida}
              onChange={handleUnidadMedidaChange}
              className="w-full border rounded-md px-3 py-2"
              required
            >
              <option value="">Seleccione una unidad</option>
              {unidadesMedidaComunes.map((unidad) => (
                <option key={unidad} value={unidad}>
                  {unidad}
                </option>
              ))}
            </select>
            {mostrarUnidadPersonalizada && (
              <input
                type="text"
                value={unidadPersonalizada}
                onChange={handleUnidadPersonalizadaChange}
                placeholder="Ingrese la unidad personalizada"
                className="w-full border rounded-md px-3 py-2 mt-2"
                required
              />
            )}
          </div>
          <div>
            <label className="block font-medium mb-1">Principio Activo</label>
            <input
              name="principio_activo"
              value={form.principio_activo}
              onChange={handleChange}
              placeholder="Ej: Acetaminofén, Ibuprofeno, Amoxicilina"
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Presentación</label>
            <select
              value={mostrarPresentacionPersonalizada ? "Otro" : form.presentacion}
              onChange={handlePresentacionChange}
              className="w-full border rounded-md px-3 py-2"
              required
            >
              <option value="">Seleccione una presentación</option>
              {presentacionesComunes.map((presentacion) => (
                <option key={presentacion} value={presentacion}>
                  {presentacion}
                </option>
              ))}
            </select>
            {mostrarPresentacionPersonalizada && (
              <input
                type="text"
                value={presentacionPersonalizada}
                onChange={handlePresentacionPersonalizadaChange}
                placeholder="Ingrese la presentación personalizada"
                className="w-full border rounded-md px-3 py-2 mt-2"
                required
              />
            )}
          </div>
          <div>
            <label className="block font-medium mb-1">Concentración</label>
            <input
              name="concentracion"
              value={form.concentracion}
              onChange={handleConcentracionChange}
              placeholder="Ej: 500, 10.5, 0.25"
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Vía de Administración</label>
            <input
              name="via_administracion"
              value={form.via_administracion}
              onChange={handleChange}
              placeholder="Ej: Oral, Intravenosa, Intramuscular, Tópica"
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
              placeholder="Ej: 1500, 2500, 890"
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-medium mb-1">Observación (opcional)</label>
            <input
              name="observacion"
              value={form.observacion}
              onChange={handleChange}
              placeholder="Ej: Refrigerar, No exponer al sol, Uso pediátrico"
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>

        {error && <div className="text-red-500 text-sm mt-4">{error}</div>}

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